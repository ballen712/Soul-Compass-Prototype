import type { GeocodingConfig } from "./config";
import { QuotaBlocked, type QuotaStore, type QuotaReceipt } from "./quota";

type State = {
  version: 1; day: string; used: number; warned: boolean; critical: boolean;
  dispatches: number[]; lastMs: number; requests: number; budget: number; rps: number;
};
type Source = { used: number; times: number[] };
type PoolLike = Pick<typeof import("@workspace/db").pool, "connect">;
let poolPromise: Promise<PoolLike> | undefined;
const defaultPool = () => poolPromise ??= import("@workspace/db").then(db => db.pool);

/** Remove per-source digests from completed UTC days. The API process calls this
 * at startup and periodically while running; the transaction lock serializes it
 * with quota writes without reading or exposing stored digests.
 */
export async function pruneExpiredSourceDigests(options: {
  pool?: () => Promise<PoolLike>; bucket?: string;
} = {}): Promise<number> {
  const pool = await (options.pool ?? defaultPool)();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL statement_timeout = '2500ms'");
    await client.query("SET LOCAL lock_timeout = '2000ms'");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [options.bucket ?? "geoapify"]);
    const clock = await client.query<{ day: string }>(
      "SELECT to_char((clock_timestamp() AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') AS day");
    const day = clock.rows[0]?.day;
    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("Invalid UTC cleanup day");
    const result = await client.query("DELETE FROM geoapify_quota_sources WHERE utc_day < $1", [day]);
    await client.query("COMMIT");
    return result.rowCount ?? 0;
  } catch {
    try { await client.query("ROLLBACK"); } catch { /* never log database details */ }
    throw new Error("Quota digest cleanup failed.");
  } finally {
    client.release();
  }
}

const validNumber = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
function validTimes(v: unknown): v is number[] {
  return Array.isArray(v) && v.length <= 100 && v.every(validNumber);
}
function stateValue(value: unknown): State {
  const s = value as State;
  if (!s || s.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(s.day) ||
    ![s.used,s.lastMs,s.requests,s.budget,s.rps].every(validNumber) ||
    typeof s.warned !== "boolean" || typeof s.critical !== "boolean" || !validTimes(s.dispatches)) {
    throw new Error("Invalid operational counter");
  }
  return s;
}
function sourceValue(value: unknown): Source {
  const s = value as Source;
  if (!s || !validNumber(s.used) || !validTimes(s.times)) throw new Error("Invalid source counter");
  return s;
}

/** No DDL, filesystem counters or fail-open fallback. All instances sharing this
 * database take the same transaction-scoped lock; PostgreSQL supplies the clock.
 */
export function postgresQuota(config: GeocodingConfig, options: {
  pool?: () => Promise<PoolLike>; bucket?: string;
} = {}): QuotaStore {
  const bucket = options.bucket ?? "geoapify";
  const transact = async (operation: "source" | "credit", sourceForDay: (day: string) => string) => {
    const pool = await (options.pool ?? defaultPool)();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL statement_timeout = '2500ms'");
      await client.query("SET LOCAL lock_timeout = '2000ms'");
      // Lock includes bucket; production has exactly one bucket for all API instances.
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [bucket]);
      const clock = await client.query("SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint AS ms");
      const now = Number(clock.rows[0].ms);
      const day = new Date(now).toISOString().slice(0, 10);
      const midnight = Math.max(1, Math.ceil((Date.parse(`${day}T00:00:00Z`) + 86_400_000 - now) / 1000));
      const previous = await client.query("SELECT value FROM geoapify_quota_state WHERE bucket=$1 FOR UPDATE", [bucket]);
      let state: State = previous.rows.length ? stateValue(previous.rows[0].value) : {
        version: 1, day, used: 0, warned: false, critical: false, dispatches: [],
        lastMs: now, requests: 0, budget: config.hardCeiling, rps: config.requestsPerSecond,
      };
      if (now < state.lastMs || day < state.day) throw new Error("Operational clock moved backwards");
      const dispatches = state.dispatches.filter(t => t > now - 1000);
      if (day !== state.day) state = {
        version: 1, day, used: 0, warned: false, critical: false, dispatches,
        lastMs: now, requests: 0, budget: config.hardCeiling, rps: config.requestsPerSecond,
      };
      state.lastMs = now; state.dispatches = dispatches;
      // Conflicting instance configuration cannot raise the established ceiling.
      state.budget = Math.min(state.budget, config.hardCeiling);
      state.rps = Math.min(state.rps, config.requestsPerSecond);
      const hash = sourceForDay(day);
      if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("Invalid source digest");
      const existing = await client.query(
        "SELECT value FROM geoapify_quota_sources WHERE utc_day=$1 AND source_hash=$2 FOR UPDATE", [day,hash]);
      const source = existing.rows.length ? sourceValue(existing.rows[0].value) : { used: 0, times: [] };
      source.times = source.times.filter(t => t > now - 60_000);
      let warningCrossed = false, criticalCrossed = false;
      if (operation === "source") {
        if (state.requests >= config.endpointPerDay || source.used >= config.sourcePerDay) throw new QuotaBlocked(midnight);
        if (source.times.length >= config.sourcePerMinute) throw new QuotaBlocked(60);
        source.times.push(now); state.requests++;
      } else {
        if (state.used >= state.budget || source.used >= config.sourcePerDay) throw new QuotaBlocked(midnight);
        if (dispatches.length >= state.rps) throw new QuotaBlocked(1);
        state.used++; source.used++; state.dispatches.push(now);
        warningCrossed = !state.warned && state.used >= config.warning;
        criticalCrossed = !state.critical && state.used >= config.critical;
        state.warned ||= warningCrossed; state.critical ||= criticalCrossed;
      }
      await client.query(
        "INSERT INTO geoapify_quota_state(bucket,value) VALUES($1,$2::jsonb) ON CONFLICT(bucket) DO UPDATE SET value=EXCLUDED.value",
        [bucket,JSON.stringify(state)]);
      await client.query(
        "INSERT INTO geoapify_quota_sources(utc_day,source_hash,value) VALUES($1,$2,$3::jsonb) ON CONFLICT(utc_day,source_hash) DO UPDATE SET value=EXCLUDED.value",
        [day,hash,JSON.stringify(source)]);
      // No raw IP is retained. Expired daily digests are pruned on the next admitted request.
      await client.query("DELETE FROM geoapify_quota_sources WHERE utc_day < $1", [day]);
      await client.query("COMMIT");
      return { day, used: state.used, remaining: Math.max(0,state.budget-state.used),
        warningCrossed, criticalCrossed } satisfies QuotaReceipt;
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { /* never log connection/error details */ }
      throw error;
    } finally { client.release(); }
  };
  return {
    persistent: true,
    async checkSource(source) { await transact("source", source); },
    reserve: source => transact("credit", source),
  };
}
