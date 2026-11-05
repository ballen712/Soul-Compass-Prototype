import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateDailyAstrology, EPHEMERIS_SOURCE } from './astrology';
import type { UserProfile } from './profile';
import { getChartPrecision } from './profile';
import { FEELING_OPTIONS, getCompanionReason, getCrystalRecommendation, getIntentionRecommendation } from './crystal-guidance';
import { getDailyAstrology } from './daily-cache';
import { alternativeCrystals, samplePrimaryCrystal } from '../constants/content';

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
  assert.match(result.reading.body, /\b(today|today’s)\b/i);
  assert.doesNotMatch(result.reading.body, /calculated|natal|astrological tradition|ephemeris/i);
  assert.ok(result.reading.body.length < 140);
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
test('intentions change crystal ranking without requiring a collection', () => {
  const chart = calculateDailyAstrology(makeProfile(), new Date('2026-06-01T01:00:00Z'));
  assert.equal(chart.status, 'calculated');
  if (chart.status !== 'calculated') return;
  const focus = getCrystalRecommendation(chart, { intentions: ['Focus'] });
  const change = getCrystalRecommendation(chart, { intentions: ['Change'] });
  assert.equal(focus?.crystal.name, 'Amethyst');
  assert.deepEqual(focus?.matchedIntentions, ['focus']);
  assert.equal(change?.crystal.name, 'Labradorite');
  assert.match(focus!.reason, /today|theme/i);
  assert.doesNotMatch(focus!.reason, /calculated|natal|aspect|ephemeris/i);
  const moonstoneReason = getCompanionReason(samplePrimaryCrystal, focus);
  const labradoriteReason = getCompanionReason(alternativeCrystals[1], focus);
  assert.match(moonstoneReason, /another angle/);
  assert.match(moonstoneReason, /not a promise/);
  assert.notEqual(moonstoneReason, labradoriteReason);
  assert.doesNotMatch(moonstoneReason, /calculated|natal|aspect|ephemeris/i);
});
test('hidden recommendations are replaced from the remaining visible catalog', () => {
  const chart = calculateDailyAstrology(makeProfile());
  assert.equal(chart.status, 'calculated'); if (chart.status !== 'calculated') return;
  const result = getCrystalRecommendation(chart, { intentions: ['Focus'], hiddenCrystals: ['amethyst'] });
  assert.notEqual(result?.crystal.name, 'Amethyst');
  assert.equal(getCrystalRecommendation(chart, { hiddenCrystals: ['amethyst', 'moonstone', 'labradorite'] }), null);
});
test('intention-only suggestions are labeled and arbitrary custom words are not invented as matches', () => {
  const result = getIntentionRecommendation({ intentions: [' focus ', 'FOCUS'] });
  assert.equal(result?.basis, 'intention'); assert.equal(result?.crystal.name, 'Amethyst');
  assert.deepEqual(result?.matchedIntentions, ['focus']);
  assert.match(result!.reason, /intention to focus/i);
  assert.equal(getIntentionRecommendation({ intentions: ['unmapped custom word'] }), null);
  assert.equal(getIntentionRecommendation({ intentions: ['Focus'], hiddenCrystals: ['amethyst'] }), null);
});
test('twelve daily feelings produce personal stone suggestions and still respond to transit themes', () => {
  assert.equal(FEELING_OPTIONS.length, 12);
  assert.equal(new Set(FEELING_OPTIONS.map(option => option.id)).size, 12);
  const catalog = new Set(['Moonstone', 'Amethyst', 'Labradorite']);
  for (const feeling of FEELING_OPTIONS) {
    assert.ok(getIntentionRecommendation({ feeling: feeling.id }), `${feeling.label} should guide a stone suggestion`);
    assert.ok(catalog.has(feeling.primary), `${feeling.label} primary stone should exist in the guide`);
    assert.ok(catalog.has(feeling.secondary), `${feeling.label} alternate stone should exist in the guide`);
  }

  const chart = calculateDailyAstrology(makeProfile(), new Date('2026-06-01T01:00:00Z'));
  assert.equal(chart.status, 'calculated');
  if (chart.status !== 'calculated') return;

  const withTransit = (aspect: string, quality: string) => ({
    ...chart,
    aspects: [{ ...chart.aspects[0], aspect, quality }],
  }) as typeof chart;
  const steadyDay = getCrystalRecommendation(withTransit('trine', 'supportive'), { feeling: 'tired' });
  const demandingDay = getCrystalRecommendation(withTransit('square', 'challenging'), { feeling: 'tired' });

  assert.equal(getIntentionRecommendation({ feeling: 'energized' })?.crystal.name, 'Labradorite');
  assert.equal(steadyDay?.crystal.name, 'Amethyst');
  assert.equal(demandingDay?.crystal.name, 'Labradorite');
  assert.equal(steadyDay?.basis, 'chart');
  assert.equal(demandingDay?.feelingLabel, 'Feeling tired');
  assert.equal(getIntentionRecommendation({ feeling: 'tired', hiddenCrystals: ['amethyst'] })?.crystal.name, 'Moonstone');
  assert.match(getCompanionReason(samplePrimaryCrystal, steadyDay), /how you feel/i);
});
test('minute cache is shared only for the same profile and refreshes after local midnight', () => {
  const profile = makeProfile();
  const first = getDailyAstrology(profile, new Date('2026-06-01T03:59:00Z'));
  assert.equal(getDailyAstrology(profile, new Date('2026-06-01T03:59:30Z')), first);
  const next = getDailyAstrology(profile, new Date('2026-06-01T04:00:00Z'));
  assert.notEqual(next, first);
  assert.equal(first.status, 'calculated'); assert.equal(next.status, 'calculated');
  if (first.status === 'calculated' && next.status === 'calculated') {
    assert.equal(first.calculationDate, 'May 31, 2026'); assert.equal(next.calculationDate, 'June 1, 2026');
  }
  assert.notEqual(getDailyAstrology({ ...profile, birthDate: '1991-01-01' }, new Date('2026-06-01T04:00:00Z')), next);
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
