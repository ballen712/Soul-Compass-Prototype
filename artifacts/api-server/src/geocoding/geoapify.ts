import { createHmac } from "node:crypto";
import { geocodingConfig, isProduction, type GeocodingConfig } from "./config";
import { QuotaBlocked, type QuotaStore } from "./quota";
import { postgresQuota } from "./postgres";
import { logger } from "../lib/logger";

export type CityLocation = {
  city: string; country: string; admin1?: string;
  latitude: number; longitude: number; timeZone: string;
};

export class CitySearchError extends Error {
  constructor(public status: number, message: string, public retryAfter = 60) {
    super(message);
  }
}

const unavailable = "City search is temporarily unavailable. Please try again later.";
function text(value: unknown, max = 120): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}
function timeZone(value: unknown): value is string {
  if (!text(value)) return false;
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; }
  catch { return false; }
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function normalizeCities(data: unknown): CityLocation[] {
  if (!record(data) || !Array.isArray(data.results)) throw new CitySearchError(502, unavailable);
  const seen = new Set<string>();
  const results = data.results.slice(0, 8).flatMap((entry): CityLocation[] => {
    if (!record(entry)) return [];
    const city = entry.city ?? entry.town ?? entry.village ?? entry.name;
    const zone = record(entry.timezone) ? entry.timezone.name : undefined;
    if (!text(city) || !text(entry.country) || !timeZone(zone) ||
        typeof entry.lat !== "number" || !Number.isFinite(entry.lat) || Math.abs(entry.lat) > 90 ||
        typeof entry.lon !== "number" || !Number.isFinite(entry.lon) || Math.abs(entry.lon) > 180) return [];
    const key = `${city}|${entry.country}|${entry.lat}|${entry.lon}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{
      city: city.trim(), country: entry.country.trim(),
      ...(text(entry.state) ? { admin1: entry.state.trim() } : {}),
      latitude: entry.lat, longitude: entry.lon, timeZone: zone,
    }];
  });
  if (data.results.length && !results.length) throw new CitySearchError(502, unavailable);
  return results;
}

/** Server-only. Never export provider URLs, responses, exceptions or credentials.
 * These conservative limits are per process, not an account-wide billing cap.
 * No retries, background searches, forwarding of client IP/headers, or paid fallback.
 */
export function createCitySearch(options: {
  getKey?: () => string | undefined; request?: typeof fetch; now?: () => number; dailyLimit?: number;
  config?: GeocodingConfig; store?: QuotaStore; production?: boolean;
  event?: (event: string, fields?: Record<string, string | number>) => void;
} = {}) {
  const getKey = options.getKey ?? (() => process.env.GEOAPIFY_API_KEY);
  const request = options.request ?? fetch;
  const now = options.now ?? Date.now;
  const config = { ...(options.config ?? geocodingConfig()) };
  if (options.dailyLimit !== undefined) {
    // Compatibility for existing isolated tests; not a public/server runtime setting.
    config.hardCeiling = Math.min(config.hardCeiling, options.dailyLimit);
    config.sourcePerDay = Math.max(1, config.hardCeiling);
  }
  const production = options.production ?? isProduction();
  // Owner approved Replit PostgreSQL. Schema is applied to dev separately, never at startup.
  const store = options.store ?? postgresQuota(config);
  const event = options.event ?? ((name, fields = {}) => {
    const level = name.includes("disabled") || name.includes("_critical") || name.endsWith("_store_unavailable")
      ? "error" : name.endsWith("_warning") || name.endsWith("_failed") ? "warn" : "info";
    logger[level]({ event: name, ...fields }, "Geoapify operation");
  });
  const cache = new Map<string, { expires: number; results: CityLocation[] }>();
  const inFlight = new Map<string, Promise<CityLocation[]>>();
  let active = 0;
  if (!getKey()) event("geoapify_disabled_missing_key");
  if (!options.store && !process.env.DATABASE_URL) event("geoapify_disabled_missing_quota_database");
  if (production && (!store.persistent || !store.checkSource)) event("geoapify_disabled_shared_store_required");
  if (!production && !store?.persistent) event("geoapify_development_nonpersistent_limiter");
  const copy = (rows: CityLocation[]) => rows.map(row => ({ ...row }));
  return async (query: string, source = "unknown"): Promise<CityLocation[]> => {
    const key = getKey();
    if (!key) throw new CitySearchError(503, unavailable);
    if (production && (!store.persistent || !store.checkSource)) throw new CitySearchError(503, unavailable);
    const sourceForDay = (day: string) => createHmac("sha256", key)
      .update(`city-source:v1:${day}:${source}`).digest("hex");
    try { await store.checkSource?.(sourceForDay); }
    catch (error) {
      if (error instanceof QuotaBlocked) throw new CitySearchError(429, unavailable, error.retryAfter);
      event("geoapify_quota_store_unavailable"); throw new CitySearchError(503, unavailable);
    }
    const normalized = query.trim().normalize("NFC").toLocaleLowerCase("en");
    const cacheKey = createHmac("sha256", key).update(`city-cache:v1:${normalized}`).digest("hex");
    const current = now();
    for (const [id, entry] of cache) if (entry.expires <= current) cache.delete(id);
    const cached = cache.get(cacheKey);
    if (cached) return copy(cached.results);
    const pending = inFlight.get(cacheKey);
    if (pending) return copy(await pending);
    if (active >= 2) {
      throw new CitySearchError(429, "City search is busy. Please wait a moment and search again.", 1);
    }
    active++;
    const run = async () => {
      let receipt;
      try {
        receipt = await store.reserve(sourceForDay);
      } catch (error) {
        if (error instanceof QuotaBlocked) throw new CitySearchError(429,
          "City search is temporarily unavailable. Please try again later.", error.retryAfter);
        event("geoapify_quota_store_unavailable");
        throw new CitySearchError(503, unavailable);
      }
      event("geoapify_credit_reserved", { day: receipt.day, used: receipt.used, remaining: receipt.remaining });
      if (receipt.warningCrossed) event("geoapify_quota_warning", { day: receipt.day, used: receipt.used });
      if (receipt.criticalCrossed) event("geoapify_quota_critical", { day: receipt.day, used: receipt.used });
    try {
      const url = new URL("https://api-eu.geoapify.com/v1/geocode/search");
      url.search = new URLSearchParams({
        text: query.trim(), type: "city", format: "json", lang: "en", limit: "8",
        bias: "countrycode:none", apiKey: key,
      }).toString();
      const response = await request(url, {
        signal: AbortSignal.timeout(config.timeoutMs), redirect: "error", headers: { accept: "application/json" },
      });
      if (response.status === 429) throw new CitySearchError(429, "City search quota reached. Please try again later.");
      if (!response.ok) throw new CitySearchError(503, unavailable);
      const rows = normalizeCities(await response.json());
      if (config.cacheTtlMs > 0) {
        if (cache.size >= config.cacheEntries) cache.delete(cache.keys().next().value!);
        cache.set(cacheKey, { expires: now() + config.cacheTtlMs, results: copy(rows) });
      }
      event("geoapify_request_succeeded");
      return rows;
    } catch (error) {
      event("geoapify_request_failed");
      if (error instanceof CitySearchError) throw error;
      if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) {
        throw new CitySearchError(504, "City search took too long. Please try again.");
      }
      // Do not log error/cause: fetch exceptions can contain the credential-bearing URL.
      throw new CitySearchError(502, unavailable);
    }
    };
    const work = run();
    inFlight.set(cacheKey, work);
    try { return copy(await work); }
    finally { active--; inFlight.delete(cacheKey); }
  };
}
