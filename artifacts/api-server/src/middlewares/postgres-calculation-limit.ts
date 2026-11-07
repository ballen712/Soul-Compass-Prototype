import type { CalculationRateLimitStore, CalculationRateDecision } from "./shared-calculation-limit";

type PoolLike = Pick<typeof import("@workspace/db").pool, "connect">;
type Counter = { version: 1; windowStartMs: number; count: number; limit: number };

const WINDOW_MS = 60_000;
const PRODUCTION_BUCKET = "soul-compass:global-calculation-rate:v1";
export const ASTROLOGY_GLOBAL_LIMIT_PER_MINUTE = 3_000;
let poolPromise: Promise<PoolLike> | undefined;
const defaultPool = () => poolPromise ??= import("@workspace/db").then(db => db.pool);

function counterValue(value: unknown): Counter {
  const parsed = typeof value === "string" ? JSON.parse(value) as unknown : value;
  const state = parsed as Counter;
  if (!state || state.version !== 1 ||
    ![state.windowStartMs, state.count, state.limit].every(Number.isSafeInteger) ||
    state.windowStartMs < 0 || state.windowStartMs % WINDOW_MS !== 0 ||
    state.count < 0 || state.limit < 1 || state.count > state.limit) {
    throw new Error("Invalid shared calculation counter");
  }
  return state;
}

/**
 * Stores one app-wide minute counter in the existing operational state table.
 * It contains no client identifier or personal data. A transaction-scoped
 * advisory lock makes the reservation atomic across API processes.
 */
export function postgresCalculationRateLimit(options: {
  pool?: () => Promise<PoolLike>;
  bucket?: string;
  maxRequestsPerMinute?: number;
} = {}): CalculationRateLimitStore {
  const bucket = options.bucket ?? PRODUCTION_BUCKET;
  const maxRequests = options.maxRequestsPerMinute ?? ASTROLOGY_GLOBAL_LIMIT_PER_MINUTE;
  if (!/^[a-z0-9:_-]{1,120}$/.test(bucket) ||
    !Number.isSafeInteger(maxRequests) || maxRequests < 1) {
    throw new Error("Invalid shared calculation limiter configuration");
  }

  return {
    async reserve(): Promise<CalculationRateDecision> {
      const pool = await (options.pool ?? defaultPool)();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SET LOCAL statement_timeout = '2500ms'; SET LOCAL lock_timeout = '2000ms'");
        const clock = await client.query(
          "SELECT pg_advisory_xact_lock(hashtextextended($1, 0)), floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint AS ms",
          [bucket],
        );
        const now = Number(clock.rows[0]?.ms);
        if (!Number.isSafeInteger(now) || now < 0) throw new Error("Invalid shared limiter clock");
        const windowStartMs = Math.floor(now / WINDOW_MS) * WINDOW_MS;
        const previous = await client.query(
          "SELECT value FROM geoapify_quota_state WHERE bucket=$1 FOR UPDATE",
          [bucket],
        );

        let counter: Counter;
        if (!previous.rows.length) {
          counter = { version: 1, windowStartMs, count: 0, limit: maxRequests };
        } else {
          const stored = counterValue(previous.rows[0].value);
          if (stored.windowStartMs > windowStartMs) throw new Error("Shared limiter clock moved backwards");
          counter = stored.windowStartMs === windowStartMs
            ? { ...stored, limit: Math.min(stored.limit, maxRequests) }
            : { version: 1, windowStartMs, count: 0, limit: maxRequests };
        }

        if (counter.count >= counter.limit) {
          await client.query("COMMIT");
          return {
            allowed: false,
            retryAfterSeconds: Math.max(1, Math.ceil((windowStartMs + WINDOW_MS - now) / 1000)),
          };
        }

        counter.count++;
        await client.query(
          "INSERT INTO geoapify_quota_state(bucket,value) VALUES($1,$2::jsonb) " +
          "ON CONFLICT(bucket) DO UPDATE SET value=EXCLUDED.value",
          [bucket, JSON.stringify(counter)],
        );
        await client.query("COMMIT");
        return { allowed: true, retryAfterSeconds: 0 };
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch { /* never expose connection details */ }
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
