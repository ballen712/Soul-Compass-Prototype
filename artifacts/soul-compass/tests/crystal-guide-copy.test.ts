import { expect, test } from 'vitest';
import { crystalGuideCopy } from '../constants/crystal-guide-copy';

test('all 93 catalog stones have distinct expanded, clean guide descriptions', () => {
  const descriptions = Object.values(crystalGuideCopy);
  expect(Object.keys(crystalGuideCopy)).toHaveLength(93);
  expect(descriptions.every((description) => description.trim().length >= 70)).toBe(true);
  expect(new Set(descriptions).size).toBe(93);
  expect(descriptions.join(' ')).not.toMatch(/symbolic|not proven|guaranteed effect/i);
});
