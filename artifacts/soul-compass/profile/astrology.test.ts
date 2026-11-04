import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateDailyAstrology, EPHEMERIS_SOURCE } from './astrology';
import type { UserProfile } from './profile';
import { getChartPrecision } from './profile';

const currentResidence = {
  city: 'New York',
  country: 'United States',
  latitude: 40.7128,
  longitude: -74.006,
  timeZone: 'America/New_York',
};

const london = {
  city: 'London',
  country: 'United Kingdom',
  latitude: 51.5072,
  longitude: -0.1276,
  timeZone: 'Europe/London',
};

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    birthDate: '2000-01-01',
    birthTime: { status: 'known', localTime: '12:00' },
    birthPlace: {
      ...london,
      timeZone: 'UTC',
    },
    currentResidence,
    ...overrides,
  };
}

test('timed profile calculates geocentric tropical placements at birth time', () => {
  const result = calculateDailyAstrology(
    makeProfile(),
    new Date('2026-06-01T12:00:00.000Z'),
  );

  assert.equal(result.status, 'calculated');
  if (result.status !== 'calculated') return;

  const sun = result.natalPlacements.find((placement) => placement.body === 'Sun');
  assert.ok(sun);
  assert.equal(sun.sign, 'Capricorn');
  assert.ok(Math.abs(sun.longitude - 280.37) < 0.1);
  assert.equal(result.preciseBirthMoment, true);
  assert.match(EPHEMERIS_SOURCE.models, /VSOP87/);
});

test('unknown-time profile only includes planet signs stable across possible local birth times', () => {
  const profile = makeProfile({
    birthTime: { status: 'unknown' },
  });
  const result = calculateDailyAstrology(
    profile,
    new Date('2026-06-01T12:00:00.000Z'),
  );

  assert.equal(result.status, 'calculated');
  if (result.status !== 'calculated') return;

  const precision = getChartPrecision(profile);
  assert.equal(result.preciseBirthMoment, false);
  assert.equal(precision.mayUseAscendant, false);
  assert.equal(precision.mayUseMidheaven, false);
  assert.equal(precision.mayUseHouses, false);
  assert.equal(precision.mayUseTimeSensitiveInterpretations, false);
  assert.ok(result.natalPlacements.some((placement) => placement.body === 'Sun'));
  for (const placement of result.natalPlacements) {
    const signs = new Set(
      placement.possibleLongitudes.map((longitude) => Math.floor(longitude / 30)),
    );
    assert.equal(signs.size, 1, `${placement.body} must remain in one sign`);
  }
});

test('birth clock time uses the birth city, not the current residence time zone', () => {
  const londonBirth = calculateDailyAstrology(makeProfile(), new Date('2026-06-01T12:00:00.000Z'));
  const newYorkBirth = calculateDailyAstrology(
    makeProfile({ birthPlace: { ...currentResidence, timeZone: 'America/New_York' } }),
    new Date('2026-06-01T12:00:00.000Z'),
  );

  assert.equal(londonBirth.status, 'calculated');
  assert.equal(newYorkBirth.status, 'calculated');
  if (londonBirth.status !== 'calculated' || newYorkBirth.status !== 'calculated') return;
  const londonSun = londonBirth.natalPlacements.find((placement) => placement.body === 'Sun');
  const newYorkSun = newYorkBirth.natalPlacements.find((placement) => placement.body === 'Sun');
  assert.ok(londonSun && newYorkSun);
  assert.ok(Math.abs(londonSun.longitude - newYorkSun.longitude) > 0.1);
});

test('daily calculation date follows the saved home time zone', () => {
  const result = calculateDailyAstrology(
    makeProfile(),
    new Date('2026-06-01T01:00:00.000Z'),
  );

  assert.equal(result.status, 'calculated');
  if (result.status !== 'calculated') return;
  assert.equal(result.calculationDate, 'May 31, 2026');
});

test('daily calculation does not substitute birthplace when residence is unset', () => {
  const result = calculateDailyAstrology(makeProfile({ currentResidence: null }));
  assert.equal(result.status, 'unavailable');
  if (result.status === 'unavailable') {
    assert.match(result.message, /birth city is not used as a substitute/i);
  }
});

test('ambiguous and skipped daylight-saving birth times are not guessed', () => {
  const repeatedHour = calculateDailyAstrology(
    makeProfile({
      birthDate: '2024-11-03',
      birthTime: { status: 'known', localTime: '01:30' },
      birthPlace: { ...currentResidence, timeZone: 'America/New_York' },
    }),
  );
  const skippedHour = calculateDailyAstrology(
    makeProfile({
      birthDate: '2024-03-10',
      birthTime: { status: 'known', localTime: '02:30' },
      birthPlace: { ...currentResidence, timeZone: 'America/New_York' },
    }),
  );

  assert.equal(repeatedHour.status, 'unavailable');
  assert.equal(skippedHour.status, 'unavailable');
});
