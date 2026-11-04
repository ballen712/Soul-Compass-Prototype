import assert from "node:assert/strict";
import test from "node:test";
import {
  angularSeparation,
  astronomyEngineProvider,
  calculateMajorAspects,
  calculatePlanetaryPositions,
  normalizeLongitude,
  zodiacPlacement,
} from "../src/astrology/ephemeris";

test("normalizes longitude and handles the zodiac boundary", () => {
  assert.equal(normalizeLongitude(360), 0);
  assert.equal(normalizeLongitude(-1), 359);
  assert.deepEqual(zodiacPlacement(30), { sign: "Taurus", degreeInSign: 0 });
  const endOfPisces = zodiacPlacement(359.999);
  assert.equal(endOfPisces.sign, "Pisces");
  assert.ok(Math.abs(endOfPisces.degreeInSign - 29.999) < 1e-9);
});

test("calculates wraparound angular separation", () => {
  assert.equal(angularSeparation(359, 1), 2);
  const found = calculateMajorAspects([
    { planet: "Sun", longitude: 359 },
    { planet: "Moon", longitude: 1 },
  ]);
  assert.equal(found[0]?.type, "conjunction");
  assert.equal(found[0]?.orb, 2);
});

test("returns reproducible, bounded planetary positions", () => {
  const date = new Date("2000-01-01T12:00:00.000Z");
  const first = calculatePlanetaryPositions(date);
  const second = calculatePlanetaryPositions(date);
  assert.equal(first.length, 10);
  assert.deepEqual(first, second);
  for (const item of first) {
    assert.ok(item.longitude >= 0 && item.longitude < 360);
    assert.ok(item.latitude >= -90 && item.latitude <= 90);
    assert.equal(item.atUtc, date.toISOString());
    assert.ok(Number.isFinite(item.speedDegreesPerDay));
    assert.equal(item.retrograde, item.speedDegreesPerDay < 0);
  }
});

test("provider rejects invalid timestamps", () => {
  assert.throws(() => astronomyEngineProvider.position("Sun", new Date("invalid")));
});
