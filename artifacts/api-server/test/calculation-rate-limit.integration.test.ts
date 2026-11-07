import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { fork, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { pool } from "@workspace/db";

const buckets: string[] = [];
after(async () => {
  if (buckets.length) {
    await pool.query("DELETE FROM geoapify_quota_state WHERE bucket=ANY($1::text[])", [buckets]);
  }
  await pool.end();
});

async function instance(bucket: string, limit: number): Promise<{ child: ChildProcess; base: string }> {
  const child = fork(new URL("./fixtures/calculation-limit-instance.ts", import.meta.url), [bucket, String(limit)], {
    execArgv: ["--import", "tsx"],
    stdio: ["ignore", "ignore", "ignore", "ipc"],
  });
  const port = await new Promise<number>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Calculation-limit fixture startup timed out.")), 15_000);
    child.once("message", (message: any) => {
      clearTimeout(timer);
      resolve(message.port);
    });
    child.once("error", reject);
    child.once("exit", () => {
      clearTimeout(timer);
      reject(new Error("Calculation-limit fixture exited before readiness."));
    });
  });
  return { child, base: `http://127.0.0.1:${port}/api/astrology/positions` };
}

async function stop(child: ChildProcess) {
  if (child.exitCode !== null) return;
  const exited = once(child, "exit");
  child.kill("SIGTERM");
  await exited;
}

async function keepAwayFromWindowBoundary() {
  const result = await pool.query(
    "SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint AS ms",
  );
  const ms = Number(result.rows[0].ms);
  const inWindowMs = ms % 60_000;
  if (inWindowMs > 56_000) await new Promise(resolve => setTimeout(resolve, 60_000 - inWindowMs + 100));
}

test("two API processes and a replacement share the global calculation limit", async () => {
  await keepAwayFromWindowBoundary();
  const bucket = `test:calculation-limit:${randomUUID()}`;
  buckets.push(bucket);
  const instances: { child: ChildProcess; base: string }[] = [];
  const request = (base: string) => fetch(base, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ atUtc: "2000-01-01T12:00:00Z" }),
  });

  try {
    const a = await instance(bucket, 1); instances.push(a);
    const b = await instance(bucket, 1); instances.push(b);
    const responses = await Promise.all([request(a.base), request(b.base)]);
    assert.deepEqual(responses.map(response => response.status).sort(), [200, 429]);
    assert.ok(responses.find(response => response.status === 429)?.headers.get("retry-after"));

    const stored = await pool.query("SELECT value FROM geoapify_quota_state WHERE bucket=$1", [bucket]);
    assert.equal(stored.rows[0]?.value.count, 1);
    assert.equal(stored.rows[0]?.value.limit, 1);

    await stop(a.child);
    const replacement = await instance(bucket, 1); instances.push(replacement);
    assert.equal((await request(replacement.base)).status, 429);
  } finally {
    await Promise.all(instances.map(({ child }) => stop(child)));
  }
});
