import type { UserProfile } from './profile';
import { calculateDailyAstrology, type DailyAstrology } from './astrology';

// Device-memory only; one minute per immutable saved profile. Never uploaded.
const cache = new WeakMap<UserProfile, { minute: number; result: DailyAstrology }>();
export function getDailyAstrology(profile: UserProfile, now: Date): DailyAstrology {
  const minute = Math.floor(now.getTime() / 60_000);
  const saved = cache.get(profile);
  if (saved?.minute === minute) return saved.result;
  const result = calculateDailyAstrology(profile, now);
  cache.set(profile, { minute, result });
  return result;
}
