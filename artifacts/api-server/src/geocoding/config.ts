// Verified against Geoapify's public Free-plan documentation on 2026-11-04.
// Server-only configuration. Increasing provider limits requires a new review.
const VERIFIED_ALLOWANCE = 3000;
function number(env: NodeJS.ProcessEnv, name: string, fallback: number, max: number, min = 1) {
  const value = Number(env[name] ?? fallback);
  return Math.max(min, Math.min(Number.isSafeInteger(value) ? value : fallback, max));
}
export function geocodingConfig(env: NodeJS.ProcessEnv = process.env) {
  const allowance = number(env, "GEOAPIFY_PROVIDER_DAILY_ALLOWANCE", VERIFIED_ALLOWANCE, VERIFIED_ALLOWANCE);
  const hardCeiling = number(env, "GEOAPIFY_DAILY_BUDGET", Math.floor(allowance * .8), Math.floor(allowance * .8), 0);
  const warning = number(env, "GEOAPIFY_WARNING_THRESHOLD", Math.floor(allowance * .6), hardCeiling, 0);
  const critical = Math.max(warning,
    number(env, "GEOAPIFY_CRITICAL_THRESHOLD", Math.floor(allowance * .72), hardCeiling, 0));
  return {
    allowance, hardCeiling, warning, critical,
    requestsPerSecond: number(env, "GEOAPIFY_REQUESTS_PER_SECOND", 3, 3),
    sourcePerMinute: number(env, "GEOAPIFY_SOURCE_PER_MINUTE", 20, 60),
    sourcePerDay: number(env, "GEOAPIFY_SOURCE_PER_DAY", Math.floor(hardCeiling / 10), Math.max(0,hardCeiling - 1), 0),
    cacheTtlMs: number(env, "GEOAPIFY_CACHE_TTL_SECONDS", 300, 3600, 0) * 1000,
    cacheEntries: 256,
    timeoutMs: 8000,
    endpointPerDay: 12_000,
  };
}
export type GeocodingConfig = ReturnType<typeof geocodingConfig>;

export function isProduction(env: NodeJS.ProcessEnv = process.env) {
  // Published Replit apps must not be able to opt into dev enforcement via NODE_ENV.
  return env.REPLIT_DEPLOYMENT === "1" || !["development", "test"].includes(env.NODE_ENV ?? "");
}
