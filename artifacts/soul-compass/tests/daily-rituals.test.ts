import { describe, expect, test } from 'vitest';
import { dailyRituals, getDailyRituals } from '../constants/daily-rituals';

describe('daily ritual rotation', () => {
  test('contains more than 25 distinct, short rituals', () => {
    expect(dailyRituals.length).toBeGreaterThan(25);
    expect(new Set(dailyRituals).size).toBe(dailyRituals.length);
    expect(dailyRituals.every((ritual) => ritual.length < 180)).toBe(true);
  });

  test('keeps one card and three distinct alternatives stable within a local day', () => {
    const morning = getDailyRituals(new Date(2026, 10, 5, 1));
    const evening = getDailyRituals(new Date(2026, 10, 5, 23));
    expect(morning).toEqual(evening);
    expect(morning).toHaveLength(4);
    expect(new Set(morning).size).toBe(4);
    expect(morning.slice(1)).toHaveLength(3);
  });

  test('does not repeat yesterday’s choices, including shuffled deck boundaries', () => {
    for (let day = 1; day <= 32; day += 1) {
      const today = getDailyRituals(new Date(2026, 10, day));
      const tomorrow = getDailyRituals(new Date(2026, 10, day + 1));
      expect(tomorrow.some((ritual) => today.includes(ritual))).toBe(false);
    }
  });

  test('rotates through the whole deck before the next cycle', () => {
    const firstDay = 20_000; // divisible by the eight-day deck length
    const seen = new Set<string>();
    for (let day = 0; day < 8; day += 1) {
      const date = new Date(1970, 0, 1 + firstDay + day);
      for (const ritual of getDailyRituals(date)) seen.add(ritual);
    }
    expect(seen.size).toBe(dailyRituals.length);
  });
});
