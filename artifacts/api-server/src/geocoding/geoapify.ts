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
} = {}) {
  const getKey = options.getKey ?? (() => process.env.GEOAPIFY_API_KEY);
  const request = options.request ?? fetch;
  const now = options.now ?? Date.now;
  const recentCalls: number[] = [];
  let second = 0, secondCount = 0, active = 0;
  return async (query: string): Promise<CityLocation[]> => {
    const key = getKey();
    if (!key) throw new CitySearchError(503, unavailable);
    const current = now();
    while (recentCalls.length && recentCalls[0] <= current - 86_400_000) recentCalls.shift();
    const currentSecond = Math.floor(current / 1000);
    if (currentSecond !== second) { second = currentSecond; secondCount = 0; }
    if (recentCalls.length >= (options.dailyLimit ?? 2000)) {
      throw new CitySearchError(429, "City search daily capacity reached. Please try again later.",
        Math.max(1, Math.ceil((recentCalls[0] + 86_400_000 - current) / 1000)));
    }
    if (secondCount >= 2 || active >= 2) {
      throw new CitySearchError(429, "City search is busy. Please wait a moment and search again.", 1);
    }
    recentCalls.push(current); secondCount++; active++;
    try {
      const url = new URL("https://api.geoapify.com/v1/geocode/search");
      url.search = new URLSearchParams({
        text: query, type: "city", format: "json", lang: "en", limit: "8",
        bias: "countrycode:none", apiKey: key,
      }).toString();
      const response = await request(url, {
        signal: AbortSignal.timeout(8000), redirect: "error", headers: { accept: "application/json" },
      });
      if (response.status === 429) throw new CitySearchError(429, "City search quota reached. Please try again later.");
      if (!response.ok) throw new CitySearchError(503, unavailable);
      return normalizeCities(await response.json());
    } catch (error) {
      if (error instanceof CitySearchError) throw error;
      if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) {
        throw new CitySearchError(504, "City search took too long. Please try again.");
      }
      // Do not log error/cause: fetch exceptions can contain the credential-bearing URL.
      throw new CitySearchError(502, unavailable);
    } finally { active--; }
  };
}
