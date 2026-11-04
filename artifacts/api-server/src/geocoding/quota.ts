import type { GeocodingConfig } from "./config";

export type QuotaReceipt = {
  day: string; used: number; remaining: number; warningCrossed: boolean; criticalCrossed: boolean;
};
export interface QuotaStore {
  readonly persistent: boolean;
  checkSource?(sourceForDay: (day: string) => string): Promise<void>;
  reserve(sourceForDay: (day: string) => string): Promise<QuotaReceipt>;
}
export class QuotaBlocked extends Error {
  constructor(public retryAfter: number) { super("Search capacity unavailable"); }
}

/** DEVELOPMENT ONLY: never selected as a production fallback.
 * Atomic within one JS process, but NOT persistent and NOT distributed.
 */
export function developmentQuota(config: GeocodingConfig, now = Date.now): QuotaStore {
  let day = "", used = 0;
  let dispatches: number[] = [];
  const sources = new Map<string, { times: number[]; used: number }>();
  return {
    persistent: false,
    async reserve(sourceForDay) {
      const time = now();
      const currentDay = new Date(time).toISOString().slice(0, 10);
      const untilMidnight = Math.max(1, Math.ceil((Date.parse(`${currentDay}T00:00:00Z`) + 86_400_000 - time) / 1000));
      if (currentDay !== day) {
        if (day && currentDay < day) throw new Error("Quota clock moved backwards");
        day = currentDay; used = 0; sources.clear();
      }
      dispatches = dispatches.filter(t => t > time - 1000);
      const key = sourceForDay(day);
      const source = sources.get(key) ?? { times: [], used: 0 };
      source.times = source.times.filter(t => t > time - 60_000);
      if (used >= config.hardCeiling || source.used >= config.sourcePerDay) throw new QuotaBlocked(untilMidnight);
      if (source.times.length >= config.sourcePerMinute) throw new QuotaBlocked(60);
      if (dispatches.length >= config.requestsPerSecond) throw new QuotaBlocked(1);
      if (!sources.has(key) && sources.size >= 10_000) throw new Error("Source capacity reached");
      const previous = used;
      // No await between checks and reservation; failed/uncertain dispatches are never refunded.
      used++; source.used++; source.times.push(time); dispatches.push(time); sources.set(key, source);
      return {
        day, used, remaining: config.hardCeiling - used,
        warningCrossed: previous < config.warning && used >= config.warning,
        criticalCrossed: previous < config.critical && used >= config.critical,
      };
    },
  };
}
