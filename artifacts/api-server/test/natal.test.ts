import assert from "node:assert/strict";
import test from "node:test";
import { calculatePlanetaryPositions, type PlanetaryPosition } from "../src/astrology/ephemeris";
import { calculateNatalAspects, calculateNatalChart, houseForLongitude, localDateBounds, resolveLocalBirthTime } from "../src/astrology/natal";

const profile = {
  birthDate: "1991-06-20",
  birthTime: { status: "known" as const, localTime: "19:51" },
  birthPlace: { latitude: 48.50834, longitude: 32.26618, timeZone: "Europe/Kyiv" },
};

test("historical Kyiv offset, not today's offset, resolves the regression instant", () => {
  const time = resolveLocalBirthTime("1991-06-20", "19:51", "Europe/Kyiv");
  assert.equal(time.status, "unique");
  if (time.status === "unique") assert.equal(time.instant.toISOString(), "1991-06-20T16:51:00.000Z");
});

test("DST folds require explicit occurrence and gaps are rejected", () => {
  const fold = resolveLocalBirthTime("2026-10-25", "02:30", "Europe/Budapest");
  assert.equal(fold.status, "ambiguous");
  if (fold.status === "ambiguous") assert.deepEqual(fold.candidates.map((d) => d.toISOString()), ["2026-10-25T00:30:00.000Z", "2026-10-25T01:30:00.000Z"]);
  assert.equal(resolveLocalBirthTime("2026-03-29", "02:30", "Europe/Budapest").status, "nonexistent");
  assert.throws(() => calculateNatalChart({ ...profile, birthDate: "2026-10-25", birthTime: { status: "known", localTime: "02:30" }, birthPlace: { ...profile.birthPlace, timeZone: "Europe/Budapest" } }), /occurred twice/);
  const later = calculateNatalChart({ ...profile, birthDate: "2026-10-25", birthTime: { status: "known", localTime: "02:30", disambiguation: "later" }, birthPlace: { ...profile.birthPlace, timeZone: "Europe/Budapest" } });
  assert.equal(later.calculation.instantUtc, "2026-10-25T01:30:00.000Z");
});

test("local birth-day duration handles DST and a skipped midnight", () => {
  assert.equal(localDateBounds("2026-03-29", "Europe/Budapest").durationHours, 23);
  assert.equal(localDateBounds("2026-10-25", "Europe/Budapest").durationHours, 25);
  assert.equal(localDateBounds("2018-11-04", "America/Sao_Paulo").durationHours, 23);
  assert.throws(() => localDateBounds("2011-12-30", "Pacific/Apia"), /skipped/);
});

test("fractional time-zone offsets and malformed inputs", () => {
  const india = resolveLocalBirthTime("1991-06-20", "19:51", "Asia/Kolkata");
  if (india.status !== "unique") assert.fail();
  assert.equal(india.instant.toISOString(), "1991-06-20T14:21:00.000Z");
  assert.throws(() => resolveLocalBirthTime("1991-02-30", "12:00", "UTC"), /calendar/);
  assert.throws(() => resolveLocalBirthTime("1991-06-20", "24:00", "UTC"));
  assert.throws(() => resolveLocalBirthTime("1991-06-20", "12:00", "Not/AZone"));
  assert.throws(() => calculateNatalChart({ ...profile, birthPlace: { ...profile.birthPlace, latitude: 91 } }));
});

test("regression Ascendant, MC, and complete ordered Placidus cusps", () => {
  const chart = calculateNatalChart(profile);
  assert.ok(chart.angles);
  assert.ok(Math.abs(chart.angles.ascendant - 256.31) < 0.02);
  assert.ok(Math.abs(chart.angles.midheaven - 194.57) < 0.02);
  assert.equal(chart.houseCusps.length, 12);
  let total = 0;
  chart.houseCusps.forEach((cusp, i) => {
    const next = chart.houseCusps[(i + 1) % 12];
    const distance = (next.longitude - cusp.longitude + 360) % 360;
    assert.ok(distance > 0 && distance < 90);
    total += distance;
  });
  assert.ok(Math.abs(total - 360) < 1e-8);
  assert.equal(chart.planetaryHouses.length, 10);
});

test("Placidus geometry at equator and both hemispheres; polar refusal without fallback", () => {
  for (const latitude of [0, 35, -35, 60]) {
    const chart = calculateNatalChart({ ...profile, birthPlace: { latitude, longitude: 0, timeZone: "UTC" } });
    assert.equal(chart.houseCusps.length, 12);
    assert.ok(chart.angles);
    assert.ok(Math.abs((chart.angles.descendant - chart.angles.ascendant + 360) % 360 - 180) < 1e-8);
  }
  const polar = calculateNatalChart({ ...profile, birthPlace: { latitude: 75, longitude: 0, timeZone: "UTC" } });
  assert.equal(polar.planets.length, 10);
  assert.equal(polar.houseCusps.length, 0);
  assert.match(polar.warnings.join(" "), /polar|Placidus/);
});

test("unknown birth time omits angles/houses and detects Moon sign uncertainty", () => {
  const chart = calculateNatalChart({ ...profile, birthDate: "1991-06-21", birthTime: { status: "unknown" } });
  assert.equal(chart.angles, null);
  assert.deepEqual(chart.houseCusps, []);
  assert.deepEqual(chart.planetaryHouses, []);
  assert.equal(chart.planets.length, 10);
  assert.ok(chart.moonSignRange.length > 1);
  assert.match(chart.warnings.join(" "), /reference/);
});

test("house cusp is inclusive, prior side remains in previous house, wraps correctly", () => {
  const cusps = Array.from({ length: 12 }, (_, i) => (350 + 30 * i) % 360);
  assert.equal(houseForLongitude(350, cusps), 1);
  assert.equal(houseForLongitude(349.999, cusps), 12);
  assert.equal(houseForLongitude(20, cusps), 2);
  assert.equal(houseForLongitude(0, cusps), 1);
});

function synthetic(planet: "Mercury" | "Mars", longitude: number, speed: number): PlanetaryPosition {
  return { planet, longitude, latitude: 0, sign: "Aries", degreeInSign: 0, speedDegreesPerDay: speed, retrograde: speed < 0, atUtc: "2000-01-01T12:00:00Z" };
}

test("aspects use angular orbs and relative velocity including retrograde", () => {
  const a = synthetic("Mercury", 0, 0);
  assert.equal(calculateNatalAspects([a, synthetic("Mars", 59, 1)])[0].applying, true);
  assert.equal(calculateNatalAspects([a, synthetic("Mars", 59, -1)])[0].applying, false);
  assert.equal(calculateNatalAspects([a, synthetic("Mars", 66, 1)])[0].orb, 6);
  assert.equal(calculateNatalAspects([a, synthetic("Mars", 66.001, 1)]).length, 0);
  assert.equal(calculateNatalAspects([a, synthetic("Mars", 60, 1)])[0].applying, null);
  assert.equal(calculateNatalAspects([a, synthetic("Mars", 64, 1)], { luminary: 2, other: 3 }).length, 0);
});

test("independent JPL Horizons apparent ecliptic-of-date reference, 1991-06-20 16:51 UTC", () => {
  // Horizons observer quantity 31, geocentre 500@399, airless apparent target centres.
  // Retrieved 2026-11-04. These fixtures are never used to calculate application output.
  const reference = [
    ["Sun", 88.8684108, -0.0000574],
    ["Moon", 197.1677187, -5.2540157],
    ["Mars", 134.9272960, 1.3020960],
    ["Jupiter", 132.3968862, 0.7356096],
  ] as const;
  const actual = calculatePlanetaryPositions(new Date("1991-06-20T16:51:00Z"));
  for (const [planet, longitude, latitude] of reference) {
    const value = actual.find((p) => p.planet === planet)!;
    assert.ok(Math.abs(value.longitude - longitude) < 0.001, `${planet} longitude`);
    assert.ok(Math.abs(value.latitude - latitude) < 0.001, `${planet} latitude`);
  }
});
