import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { fork, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { pool } from "@workspace/db";
import { geocodingConfig, isProduction } from "../src/geocoding/config";
import { postgresQuota } from "../src/geocoding/postgres";
import { QuotaBlocked, developmentQuota } from "../src/geocoding/quota";
import { createCitySearch } from "../src/geocoding/geoapify";

const buckets: string[] = [], hashes = new Set<string>();
function scope() {
  const bucket = `test-${randomUUID()}`; buckets.push(bucket);
  const source = (day: string) => {
    const hash = createHash("sha256").update(`${bucket}:${day}`).digest("hex");
    hashes.add(hash); return hash;
  };
  return { bucket, source };
}
const config = (extra = {}) => ({ ...geocodingConfig({}), hardCeiling: 3, sourcePerDay: 3,
  warning: 1, critical: 2, ...extra });
const response = () => new Response('{"results":[]}', { headers: { "content-type": "application/json" } });
async function used(bucket: string) {
  return (await pool.query("SELECT value FROM geoapify_quota_state WHERE bucket=$1", [bucket])).rows[0]?.value;
}
after(async () => {
  await pool.query("DELETE FROM geoapify_quota_state WHERE bucket=ANY($1::text[])", [buckets]);
  await pool.query("DELETE FROM geoapify_quota_sources WHERE source_hash=ANY($1::text[])", [[...hashes]]);
  // Fixture processes use their own key-derived digest; tests only use a placeholder secret.
  const { createHmac } = await import("node:crypto");
  const day = new Date().toISOString().slice(0,10);
  for (const source of ["cache-fixture","failure-fixture"]) {
    const hash=createHmac("sha256","test-placeholder").update(`city-source:v1:${day}:${source}`).digest("hex");
    await pool.query("DELETE FROM geoapify_quota_sources WHERE source_hash=$1", [hash]);
  }
  await pool.end();
});

test("central defaults, lower allowances, invalid configuration and published-environment detection are safe", () => {
  const c = geocodingConfig({});
  assert.deepEqual([c.allowance,c.hardCeiling,c.warning,c.critical,c.requestsPerSecond], [3000,2400,1800,2160,3]);
  const low = geocodingConfig({ GEOAPIFY_PROVIDER_DAILY_ALLOWANCE: "100", GEOAPIFY_DAILY_BUDGET: "9999" });
  assert.deepEqual([low.hardCeiling,low.warning,low.critical], [80,60,72]);
  assert.equal(geocodingConfig({GEOAPIFY_DAILY_BUDGET:"10",GEOAPIFY_WARNING_THRESHOLD:"bad"}).warning,10);
  assert.equal(isProduction({ NODE_ENV:"development", REPLIT_DEPLOYMENT:"1" }), true);
  assert.equal(isProduction({}), true);
  assert.equal(isProduction({NODE_ENV:"development"}), false);
});

test("missing key logs a safe startup event; production never accepts development-memory enforcement", async () => {
  const events: unknown[] = [];
  const c = config();
  const missing = createCitySearch({getKey:()=>undefined,config:c,production:true,event:(...e)=>events.push(e)});
  await assert.rejects(missing("Budapest"), {status:503});
  assert.ok(JSON.stringify(events).includes("missing_key"));
  const memory = createCitySearch({getKey:()=>"test-placeholder",config:c,production:true,
    store:developmentQuota(c),event:()=>{}});
  await assert.rejects(memory("Budapest"), {status:503});
  assert.doesNotMatch(JSON.stringify(events), /test-placeholder|apiKey=/);
});

test("PostgreSQL atomically reserves last credits across independent store instances and records thresholds once", async () => {
  const s=scope(), c=config(), a=postgresQuota(c,s), b=postgresQuota(c,s);
  const settled=await Promise.allSettled([a.reserve(s.source),b.reserve(s.source),a.reserve(s.source),b.reserve(s.source)]);
  const passed=settled.filter(r=>r.status==="fulfilled").map(r=>r.value);
  assert.equal(passed.length,3);
  assert.equal(passed.filter(r=>r.warningCrossed).length,1);
  assert.equal(passed.filter(r=>r.criticalCrossed).length,1);
  assert.equal((await used(s.bucket)).used,3);
  assert.equal((await used(s.bucket)).warned,true);
  await assert.rejects(postgresQuota(c,s).reserve(s.source), QuotaBlocked);
});

test("source HTTP limits are shared and survive store recreation; hashes contain no raw IP", async () => {
  const s=scope(), c=config({sourcePerMinute:2}), a=postgresQuota(c,s), b=postgresQuota(c,s);
  await a.checkSource!(s.source); await b.checkSource!(s.source);
  await assert.rejects(postgresQuota(c,s).checkSource!(s.source), QuotaBlocked);
  const rows=await pool.query("SELECT source_hash,value FROM geoapify_quota_sources WHERE source_hash=ANY($1::text[])",
    [[...hashes]]);
  assert.ok(rows.rows.every(r=>/^[a-f0-9]{64}$/.test(r.source_hash)));
  assert.doesNotMatch(JSON.stringify(rows.rows), /127\.0\.0\.1|Budapest|birthDate/);
});

test("global sliding-second guard is shared between connections and clock comes from PostgreSQL", async () => {
  const s=scope(), c=config({hardCeiling:20,sourcePerDay:20,requestsPerSecond:1});
  await postgresQuota(c,s).reserve(s.source);
  await assert.rejects(postgresQuota(c,s).reserve(s.source), QuotaBlocked);
  const row=await used(s.bucket);
  const db=await pool.query("SELECT floor(extract(epoch FROM clock_timestamp())*1000)::bigint AS ms");
  assert.ok(Math.abs(Number(db.rows[0].ms)-row.lastMs)<3000);
});

test("UTC rollover resets daily budget while preserving the cross-midnight global rate window", async () => {
  const s=scope(), c=config();
  await postgresQuota(c,s).reserve(s.source);
  const row=await used(s.bucket);
  row.day="2000-01-01"; row.used=3; row.lastMs=0; row.dispatches=[]; row.warned=true; row.critical=true;
  await pool.query("UPDATE geoapify_quota_state SET value=$2::jsonb WHERE bucket=$1",[s.bucket,JSON.stringify(row)]);
  const next=await postgresQuota(c,s).reserve(s.source);
  assert.equal(next.used,1); assert.notEqual(next.day,"2000-01-01"); assert.equal(next.warningCrossed,true);
  const clock=await pool.query("SELECT floor(extract(epoch FROM clock_timestamp())*1000)::bigint AS ms");
  row.day="2000-01-01"; row.used=3; row.lastMs=0; row.dispatches=Array(3).fill(Number(clock.rows[0].ms));
  await pool.query("UPDATE geoapify_quota_state SET value=$2::jsonb WHERE bucket=$1",[s.bucket,JSON.stringify(row)]);
  await assert.rejects(postgresQuota(c,s).reserve(s.source),QuotaBlocked);
});

test("expired daily source digests are cleaned up without a background provider request", async () => {
  const s=scope(), hash=s.source("2000-01-01");
  await pool.query("INSERT INTO geoapify_quota_sources VALUES($1,$2,$3::jsonb)",
    ["2000-01-01",hash,'{"used":1,"times":[]}']);
  await postgresQuota(config(),s).reserve(s.source);
  assert.equal((await pool.query("SELECT 1 FROM geoapify_quota_sources WHERE source_hash=$1",[hash])).rowCount,0);
});

test("normalized cache and in-flight dedup consume one credit, expire, and never cache failures", async () => {
  const s=scope(), c=config({cacheTtlMs:1000});
  const cacheSource=`cache-${s.bucket}`, failedScope=scope(), failureSource=`failure-${failedScope.bucket}`;
  for (const source of [cacheSource,failureSource]) {
    hashes.add(createHmac("sha256","test-placeholder")
      .update(`city-source:v1:${new Date().toISOString().slice(0,10)}:${source}`).digest("hex"));
  }
  let calls=0, now=1000;
  const search=createCitySearch({config:c,store:postgresQuota(c,s),production:true,getKey:()=>"test-placeholder",
    now:()=>now,event:()=>{},request:(async()=>{calls++; return response();}) as typeof fetch});
  await Promise.all([search(" Budapest ",cacheSource),search("budapest",cacheSource)]);
  await search("BUDAPEST",cacheSource);
  assert.equal(calls,1); assert.equal((await used(s.bucket)).used,1);
  now+=1001; await search("Budapest",cacheSource);
  assert.equal(calls,2); assert.equal((await used(s.bucket)).used,2);
  let failures=0;
  const failed=createCitySearch({config:c,store:postgresQuota(c,failedScope),production:true,getKey:()=>"test-placeholder",
    event:()=>{},request:(async()=>{failures++; throw new DOMException("redacted","TimeoutError");}) as typeof fetch});
  await assert.rejects(failed("Paris",failureSource),{status:504});
  await assert.rejects(failed("Paris",failureSource),{status:504});
  assert.equal(failures,2); assert.equal((await used(failedScope.bucket)).used,2);
});

test("quota-store outage fails closed and operational events contain no connection or credential details", async () => {
  const events: unknown[]=[]; let calls=0;
  const c=config(), store=postgresQuota(c,{pool:async()=>{throw new Error("private connection credential");}});
  const search=createCitySearch({config:c,store,production:true,getKey:()=>"test-placeholder",
    event:(...e)=>events.push(e),request:(async()=>{calls++; return response();}) as typeof fetch});
  await assert.rejects(search("Budapest"),{status:503});
  assert.equal(calls,0); assert.doesNotMatch(JSON.stringify(events),/credential|test-placeholder|Budapest/);
});

async function instance(bucket: string, budget = 1, rps = 3): Promise<{child:ChildProcess;base:string}> {
  const child=fork(new URL("./fixtures/geocoding-instance.ts",import.meta.url),[bucket,String(budget),String(rps)],
    {execArgv:["--import","tsx"],stdio:["ignore","ignore","ignore","ipc"]});
  const port=await new Promise<number>((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error("Test instance startup timeout")),15000);
    child.once("message",(m:any)=>{clearTimeout(timer);resolve(m.port);});
    child.once("error",reject);
    child.once("exit",()=>{clearTimeout(timer);reject(new Error("Test instance exited before readiness"));});
  });
  const {createHmac}=await import("node:crypto");
  hashes.add(createHmac("sha256",`test-placeholder-${child.pid}`)
    .update(`city-source:v1:${new Date().toISOString().slice(0,10)}:127.0.0.1`).digest("hex"));
  return {child,base:`http://127.0.0.1:${port}/api/geocoding/cities`};
}
async function stop(child: ChildProcess) {
  if (child.exitCode!==null) return;
  const exited=once(child,"exit"); child.kill("SIGTERM"); await exited;
}
test("two real Node API processes share one last credit; replacement process cannot reset the budget", async () => {
  const s=scope(), instances:{child:ChildProcess;base:string}[]=[];
  try {
    const a=await instance(s.bucket); instances.push(a);
    const b=await instance(s.bucket); instances.push(b);
    const results=await Promise.all([fetch(a.base+"?q=Budapest"),fetch(b.base+"?q=Tokyo")]);
    assert.deepEqual(results.map(r=>r.status).sort(),[200,429]);
    assert.equal((await used(s.bucket)).used,1);
    await stop(a.child);
    const replacement=await instance(s.bucket); instances.push(replacement);
    assert.equal((await fetch(replacement.base+"?q=Vienna")).status,429);
    assert.equal((await used(s.bucket)).used,1);
  } finally {await Promise.all(instances.map(i=>stop(i.child)));}
});
test("global provider request rate is enforced across separate Node processes", async () => {
  const s=scope(), instances:{child:ChildProcess;base:string}[]=[];
  try {
    const a=await instance(s.bucket,20,1); instances.push(a);
    const b=await instance(s.bucket,20,1); instances.push(b);
    const results=await Promise.all([fetch(a.base+"?q=Budapest"),fetch(b.base+"?q=Tokyo")]);
    assert.deepEqual(results.map(r=>r.status).sort(),[200,429]);
    assert.equal((await used(s.bucket)).used,1);
    assert.equal((await used(s.bucket)).budget,20);
  } finally {await Promise.all(instances.map(i=>stop(i.child)));}
});
