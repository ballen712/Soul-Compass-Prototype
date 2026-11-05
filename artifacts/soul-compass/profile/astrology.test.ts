import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateDailyAstrology, calculateNatalElementBalance, EPHEMERIS_SOURCE, makeCalculatedReading } from './astrology';
import type { NatalElementBalance } from './astrology';
import type { UserProfile } from './profile';
import { getChartPrecision } from './profile';
import { FEELING_OPTIONS, getCrystalRecommendation, getCrystalSuggestions, getIntentionRecommendation, getNatalCrystalSuggestions } from './crystal-guidance';
import { getDailyAstrology } from './daily-cache';
import { crystalCatalog, dailyReading } from '../constants/content';

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
  assert.ok(focus?.crystal.themes.some((theme) => ['focus', 'clarity', 'attention', 'structure'].includes(theme)));
  assert.deepEqual(focus?.matchedIntentions, ['focus']);
  assert.ok(change?.crystal.themes.some((theme) => ['change', 'adaptability', 'renewal', 'curiosity'].includes(theme)));
  assert.notEqual(focus?.crystal.name, change?.crystal.name);
  assert.match(focus!.reason, /today|theme/i);
  assert.doesNotMatch(focus!.reason, /calculated|natal|aspect|ephemeris/i);
  assert.match(focus!.reason, /birth-chart|Today’s sky links/i);
  assert.match(focus!.reason, /good companion when you want to/i);
  assert.doesNotMatch(focus!.reason, /symbolic prompt|not a guaranteed effect/i);
  assert.notEqual(focus!.reason, change!.reason);
});
test('hidden recommendations are replaced from the remaining visible catalog', () => {
  const chart = calculateDailyAstrology(makeProfile());
  assert.equal(chart.status, 'calculated'); if (chart.status !== 'calculated') return;
  const result = getCrystalRecommendation(chart, { intentions: ['Focus'], hiddenCrystals: ['amethyst'] });
  assert.notEqual(result?.crystal.name, 'Amethyst');
  const allHidden = crystalCatalog.map((crystal) => crystal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  assert.equal(getCrystalRecommendation(chart, { hiddenCrystals: allHidden }), null);
  const remaining = getCrystalRecommendation(chart, { hiddenCrystals: ['amethyst', 'moonstone', 'labradorite'] });
  if (remaining) assert.ok(!['Amethyst', 'Moonstone', 'Labradorite'].includes(remaining.crystal.name));
});
test('one shared chart theme can guide a stone while missing chart context stays empty', () => {
  const chart = calculateDailyAstrology(makeProfile());
  assert.equal(chart.status, 'calculated');
  if (chart.status !== 'calculated') return;
  const noRelevantThemes = { ...chart, aspects: [], natalPlacements: [] };
  assert.deepEqual(getCrystalSuggestions(noRelevantThemes), []);

  const singleAspectChart = {
    ...chart,
    aspects: chart.aspects.slice(0, 1),
  };
  const chartResults = getCrystalSuggestions(singleAspectChart, {}, crystalCatalog.length);
  assert.ok(chartResults.length > 0);

  const steady = FEELING_OPTIONS.find((option) => option.id === 'steady')!;
  const fullResults = getCrystalSuggestions(undefined, { feeling: steady.id }, crystalCatalog.length);
  assert.ok(fullResults.length > 0);
  assert.ok(fullResults.every((item) =>
    item.crystal.themes.some((theme) => (steady.themes as readonly string[]).includes(theme)),
  ));
});
test('daily transit selection can be empty and can return only one or two visible matches', () => {
  const chartWithNoTransitThemes = calculateDailyAstrology(makeProfile(), new Date('2026-11-01T12:00:00Z'));
  const matchingDay = calculateDailyAstrology(makeProfile(), new Date('2026-11-05T12:00:00Z'));
  assert.equal(chartWithNoTransitThemes.status, 'calculated');
  assert.equal(matchingDay.status, 'calculated');
  if (chartWithNoTransitThemes.status !== 'calculated' || matchingDay.status !== 'calculated') return;
  assert.deepEqual(getCrystalSuggestions({ ...chartWithNoTransitThemes, aspects: [] }), []);
  const matches = getCrystalSuggestions(matchingDay, {}, crystalCatalog.length);
  assert.ok(matches.length >= 2);
  const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  for (const count of [1, 2]) {
    const visible = new Set(matches.slice(0, count).map((item) => item.crystal.name));
    const hiddenCrystals = crystalCatalog.filter((stone) => !visible.has(stone.name)).map((stone) => slug(stone.name));
    assert.equal(getCrystalSuggestions(matchingDay, { hiddenCrystals }).length, count);
  }
});
test('two connected chart themes produce a main stone and two alternatives', () => {
  const chart = calculateDailyAstrology(
    makeProfile({ birthDate: '1964-07-17' }),
    new Date('2026-11-05T12:00:00Z'),
  );
  assert.equal(chart.status, 'calculated');
  if (chart.status !== 'calculated') return;

  const suggestions = getCrystalSuggestions(chart, {}, 3);
  assert.equal(suggestions.length, 3);
  assert.equal(new Set(suggestions.map((item) => item.crystal.name)).size, 3);
  assert.ok(suggestions.every((item) => item.basis === 'chart'));
});
test('intention-only suggestions are labeled and arbitrary custom words are not invented as matches', () => {
  const result = getIntentionRecommendation({ intentions: [' focus ', 'FOCUS'] });
  assert.equal(result?.basis, 'intention');
  assert.ok(result?.crystal.themes.some((theme) => ['focus', 'clarity', 'attention', 'structure'].includes(theme)));
  assert.deepEqual(result?.matchedIntentions, ['focus']);
  assert.match(result!.reason, /intention to focus/i);
  assert.equal(getIntentionRecommendation({ intentions: ['unmapped custom word'] }), null);
  const replacement = getIntentionRecommendation({ intentions: ['Focus'], hiddenCrystals: ['amethyst'] });
  assert.ok(replacement);
  assert.notEqual(replacement.crystal.name, 'Amethyst');
});
test('twelve daily feelings produce personal stone suggestions and still respond to transit themes', () => {
  assert.equal(FEELING_OPTIONS.length, 12);
  assert.equal(new Set(FEELING_OPTIONS.map(option => option.id)).size, 12);
  const catalog = new Set(crystalCatalog.map((crystal) => crystal.name));
  for (const feeling of FEELING_OPTIONS) {
    const suggestion = getIntentionRecommendation({ feeling: feeling.id });
    assert.ok(suggestion, `${feeling.label} should guide a stone suggestion`);
    assert.ok(catalog.has(suggestion.crystal.name));
    assert.ok(suggestion.crystal.themes.some((theme) => (feeling.themes as readonly string[]).includes(theme)));
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

  assert.notDeepEqual(
    getCrystalSuggestions(withTransit('trine', 'supportive'), { feeling: 'tired' }).map((suggestion) => suggestion.crystal.name),
    getCrystalSuggestions(withTransit('square', 'challenging'), { feeling: 'tired' }).map((suggestion) => suggestion.crystal.name),
  );
  assert.equal(steadyDay?.basis, 'feeling');
  assert.equal(demandingDay?.feelingLabel, 'Feeling tired');
  assert.notEqual(getIntentionRecommendation({ feeling: 'tired', hiddenCrystals: ['amethyst'] })?.crystal.name, 'Amethyst');
  assert.match(steadyDay!.reason, /You chose “feeling tired,/i);
  assert.match(steadyDay!.reason, /is a good companion when you want to/i);
  assert.doesNotMatch(steadyDay!.reason, /ease.*ease/i);
});
test('expanded catalog and daily suggestions use more than the original three stones', () => {
  assert.equal(crystalCatalog.length, 93);
  assert.equal(crystalCatalog.filter((crystal) => crystal.image !== undefined).length, crystalCatalog.length);
  assert.ok(crystalCatalog.every((crystal) => crystal.specimenDescription.trim().length > 0));
  assert.equal(new Set(crystalCatalog.map((crystal) => crystal.name.toLowerCase())).size, crystalCatalog.length);
  assert.ok(crystalCatalog.every((crystal) => crystal.themes.length >= 2 && crystal.description.length > 40));
  assert.ok(crystalCatalog.every((crystal) => /good fit/i.test(crystal.description)));
  assert.ok(crystalCatalog.every((crystal) =>
    !/symbolic|traditional|prompt|not proven|guaranteed effect/i.test(crystal.description),
  ));
  const seen = new Set<string>();
  for (const feeling of FEELING_OPTIONS) {
    const suggestions = getCrystalSuggestions(undefined, { feeling: feeling.id, dateKey: '2026-11-05' });
    assert.ok(suggestions.length >= 1 && suggestions.length <= 3);
    assert.equal(new Set(suggestions.map((suggestion) => suggestion.crystal.name)).size, 3);
    for (const suggestion of suggestions) seen.add(suggestion.crystal.name);
  }
  assert.ok(seen.size > 12, `Expected a varied catalog, got ${seen.size} distinct suggestions`);
});
test('different birth profiles can change the recommended stones', () => {
  const seen = new Set<string>();
  for (const birthDate of ['1951-02-03', '1964-07-17', '1977-11-25', '1988-04-09', '1992-09-12', '2000-01-01', '2005-06-30', '1997-12-21']) {
    const chart = calculateDailyAstrology(makeProfile({ birthDate }), new Date('2026-11-05T12:00:00Z'));
    assert.equal(chart.status, 'calculated');
    if (chart.status !== 'calculated') continue;
    const suggestions = getCrystalSuggestions(chart);
    for (const suggestion of suggestions) seen.add(suggestion.crystal.name);
  }
  assert.ok(seen.size > 3, `Birth profiles should not be limited to the original three stones; got ${seen.size}`);
});
test('natal element summary works locally without a current residence and omits uncertain unknown-time signs', () => {
  const timed = calculateNatalElementBalance(makeProfile({ currentResidence: null }));
  assert.equal(timed.status, 'calculated');
  if (timed.status !== 'calculated') return;
  assert.equal(timed.preciseBirthMoment, true);
  assert.equal(timed.total, 10);
  assert.equal(Object.values(timed.counts).reduce((sum, count) => sum + count, 0), timed.total);

  const untimed = calculateNatalElementBalance(makeProfile({
    birthTime: { status: 'unknown' },
    currentResidence: null,
  }));
  assert.equal(untimed.status, 'calculated');
  if (untimed.status !== 'calculated') return;
  assert.equal(untimed.preciseBirthMoment, false);
  assert.ok(untimed.total > 0 && untimed.total <= 10);
  assert.equal(Object.values(untimed.counts).reduce((sum, count) => sum + count, 0), untimed.total);
});
test('natal crystal set has eight unique, chart-weighted stones and respects hidden choices', () => {
  const fireChart: NatalElementBalance = {
    status: 'calculated',
    counts: { Fire: 5, Air: 1, Water: 2, Earth: 2 },
    total: 10,
    dominant: ['Fire'],
    leastRepresented: ['Air'],
    preciseBirthMoment: true,
  };
  const waterChart: NatalElementBalance = {
    ...fireChart,
    counts: { Fire: 1, Air: 2, Water: 5, Earth: 2 },
    dominant: ['Water'],
    leastRepresented: ['Fire'],
  };
  const fireStones = getNatalCrystalSuggestions(fireChart);
  const waterStones = getNatalCrystalSuggestions(waterChart);
  assert.equal(fireStones.length, 8);
  assert.equal(new Set(fireStones.map((item) => item.crystal.name)).size, 8);
  assert.notDeepEqual(
    fireStones.map((item) => item.crystal.name),
    waterStones.map((item) => item.crystal.name),
  );
  assert.ok(fireStones.every((item) => item.reason.length > 40));
  const hidden = fireStones.slice(0, 3).map((item) =>
    item.crystal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  );
  const remaining = getNatalCrystalSuggestions(fireChart, hidden);
  assert.equal(remaining.length, 8);
  assert.ok(remaining.every((item) => !hidden.includes(
    item.crystal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  )));
});
test('daily focus and caution stay practical and non-predictive across all major aspects', () => {
  const chart = calculateDailyAstrology(makeProfile(), new Date('2026-11-05T12:00:00Z'));
  assert.equal(chart.status, 'calculated');
  if (chart.status !== 'calculated') return;

  const aspectCases = [
    {
      aspect: 'conjunction',
      favorableFocus: 'Detailed work with a clear starting point may feel satisfying.',
      gentleCaution: 'Do not let every notification choose your next task.',
    },
    {
      aspect: 'sextile',
      favorableFocus: 'A first conversation or a small test of an idea may show you a useful path.',
      gentleCaution: 'Check the practical details before promising more than you can give.',
    },
    {
      aspect: 'square',
      favorableFocus: 'Thoughtful problem-solving may work better than rushing to an answer.',
      gentleCaution: 'Give yourself a beat before replying in the heat of the moment.',
    },
    {
      aspect: 'trine',
      favorableFocus: 'A practiced skill or routine can help you make steady progress.',
      gentleCaution: 'Do not fill every free hour just because things feel manageable.',
    },
    {
      aspect: 'opposition',
      favorableFocus: 'A conversation with room for listening and compromise may be more useful than a quick answer.',
      gentleCaution: 'Do not make a disagreement carry more meaning than it needs to.',
    },
  ] as const;
  const firstNatal = chart.natalPlacements[0]!;
  const secondNatal = chart.natalPlacements[1]!;

  for (const { aspect, favorableFocus, gentleCaution } of aspectCases) {
    const reading = makeCalculatedReading(chart.natalPlacements, [{
      transitBody: firstNatal.body,
      transitSign: firstNatal.sign,
      natalBody: secondNatal.body,
      natalSign: secondNatal.sign,
      aspect,
      quality: aspect === 'conjunction' ? 'intensifying'
        : aspect === 'square' || aspect === 'opposition' ? 'challenging'
          : 'supportive',
      maxOrb: 0.5,
    }]);
    assert.equal(reading.favorableFocus, favorableFocus, `${aspect} focus`);
    assert.equal(reading.gentleCaution, gentleCaution, `${aspect} caution`);
    assert.ok(reading.favorableFocus.length > 30, `${aspect} focus should be a complete, useful sentence`);
    assert.ok(reading.gentleCaution.length > 30, `${aspect} caution should be a complete, gentle sentence`);
    assert.doesNotMatch(
      `${reading.favorableFocus} ${reading.gentleCaution}`,
      /\b(?:destined|fated|guaranteed|inevitable|will happen|will succeed|will fail)\b/i,
      `${aspect} guidance must not promise or predict an outcome`,
    );
  }

  const fallback = makeCalculatedReading(chart.natalPlacements, []);
  assert.equal(fallback.favorableFocus, 'A familiar skill may help you finish one practical task.');
  assert.equal(fallback.gentleCaution, 'You do not need a complete plan before taking a first look.');
  assert.doesNotMatch(
    `${fallback.favorableFocus} ${fallback.gentleCaution}`,
    /\b(?:destined|fated|guaranteed|inevitable|will happen|will succeed|will fail)\b/i,
  );

  const reflection = makeCalculatedReading(chart.natalPlacements, [{
    transitBody: firstNatal.body,
    transitSign: firstNatal.sign,
    natalBody: secondNatal.body,
    natalSign: secondNatal.sign,
    aspect: 'conjunction',
    quality: 'supportive',
    maxOrb: 0.5,
  }]);
  const copy = [reflection.title, reflection.body, reflection.favorableFocus, reflection.gentleCaution, reflection.reflection];
  assert.equal(new Set(copy.map((text) => text.toLowerCase().replace(/[^a-z]/g, ''))).size, 5);
  assert.ok(reflection.body.length > reflection.favorableFocus.length);
  assert.ok(reflection.reflection.endsWith('?'));
  assert.doesNotMatch(reflection.reflection, /today today/);
  assert.equal(new Set([dailyReading.body, dailyReading.favorableFocus, dailyReading.gentleCaution, dailyReading.reflection]).size, 4);
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
