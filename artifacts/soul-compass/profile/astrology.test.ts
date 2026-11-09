import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateDailyAstrology, calculateNatalElementBalance, calculateNatalElementBalanceFromPlacements, classifyTransitMotion, EPHEMERIS_SOURCE, makeCalculatedReading, TRANSIT_ANALYSIS_CONFIG } from './astrology';
import type { NatalElementBalance } from './astrology';
import type { UserProfile } from './profile';
import { getChartPrecision } from './profile';
import { DAILY_CRYSTAL_SCORE_WEIGHTS, FEELING_OPTIONS, getCrystalRecommendation, getCrystalSuggestions as rankDailyCrystals, getIntentionRecommendation, getNatalCrystalSuggestions } from './crystal-guidance';
import { getDailyAstrology } from './daily-cache';
import { getDailyPersonalizationContext } from './daily-personalization';
import { getTransitAspectThemes } from './transit-themes';
import { defaultPreferences, localDayKey } from './local';
import { crystalCatalog, dailyReading } from '../constants/content';

type CrystalOptions = Parameters<typeof rankDailyCrystals>[1];

function getCrystalSuggestions(
  astrology: Parameters<typeof rankDailyCrystals>[0],
  options: CrystalOptions = {},
  limit = 3,
  translate: Parameters<typeof rankDailyCrystals>[3] = (source) => source,
  translateStoneName: Parameters<typeof rankDailyCrystals>[4] = (name) => name,
) {
  if (astrology && options.natalCrystalRecommendations === undefined) {
    const balance = calculateNatalElementBalanceFromPlacements(
      astrology.natalPlacements,
      astrology.preciseBirthMoment,
    );
    const natalCrystalRecommendations = balance.status === 'calculated'
      ? getNatalCrystalSuggestions(
          balance,
          [],
          8,
          translate,
          translateStoneName,
          [],
        )
      : [];
    return rankDailyCrystals(
      astrology,
      { ...options, natalCrystalRecommendations },
      limit,
      translate,
      translateStoneName,
    );
  }
  return rankDailyCrystals(astrology, options, limit, translate, translateStoneName);
}

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
  const instant = new Date('2026-06-01T01:00:00.000Z');
  const result = calculateDailyAstrology(makeProfile(), instant);
  const londonResult = calculateDailyAstrology(
    makeProfile({ currentResidence: london }),
    instant,
  );

  assert.equal(result.status, 'calculated');
  assert.equal(londonResult.status, 'calculated');
  if (result.status !== 'calculated' || londonResult.status !== 'calculated') return;
  assert.equal(result.calculationDate, 'May 31, 2026');
  assert.equal(londonResult.calculationDate, 'June 1, 2026');
  assert.deepEqual(result.transits, londonResult.transits);
  assert.deepEqual(result.aspects, londonResult.aspects);
});

test('applying, exact, separating, and uncertain status use observed motion on both sides', () => {
  assert.equal(classifyTransitMotion([1], [1.2], [0.8]), 'applying');
  assert.equal(classifyTransitMotion([1], [0.8], [1.2]), 'separating');
  assert.equal(classifyTransitMotion([0.04], [0.2], [0.2]), 'exact');
  assert.equal(classifyTransitMotion([1], [1.01], [1.02]), 'uncertain');
  assert.equal(classifyTransitMotion([1, 1], [1.2, 0.8], [0.8, 1.2]), 'uncertain');
});

test('transit analysis ranks multiple synthetic charts and separates long-term context', () => {
  const scenarios = [
    {
      profile: makeProfile(),
      now: new Date('2026-06-01T12:00:00.000Z'),
    },
    {
      profile: makeProfile({
        birthDate: '1988-05-17',
        birthTime: { status: 'known', localTime: '08:20' },
      }),
      now: new Date('2026-11-09T12:00:00.000Z'),
    },
    {
      profile: makeProfile({
        birthDate: '1994-11-29',
        birthTime: { status: 'unknown' },
      }),
      now: new Date('2026-03-21T12:00:00.000Z'),
    },
  ];
  let sawMoreThanFourAspects = false;
  let sawLongTermTransit = false;
  let sawCappedDurationLowerBound = false;

  for (const { profile, now } of scenarios) {
    const result = calculateDailyAstrology(profile, now);
    assert.equal(result.status, 'calculated');
    if (result.status !== 'calculated') continue;

    const analysis = result.transitAnalysis;
    assert.ok(analysis);
    sawMoreThanFourAspects ||= analysis.activeAspects.length > 4;
    sawLongTermTransit ||= analysis.longTermAspects.length > 0;
    sawCappedDurationLowerBound ||= analysis.activeAspects.some((aspect) =>
      aspect.duration.isLowerBound,
    );
    assert.ok(analysis.activeAspects.every((aspect) =>
      aspect.maxOrb <= TRANSIT_ANALYSIS_CONFIG.orbLimitDegrees,
    ));
    assert.equal(
      result.aspects.length,
      Math.min(4, analysis.activeAspects.length),
      'legacy daily reading keeps its existing four-aspect limit',
    );

    const closestFour = [...analysis.activeAspects]
      .sort((first, second) => first.maxOrb - second.maxOrb)
      .slice(0, 4);
    assert.deepEqual(
      result.aspects.map(({ transitBody, natalBody, aspect }) => `${transitBody}:${natalBody}:${aspect}`),
      closestFour.map(({ transitBody, natalBody, aspect }) => `${transitBody}:${natalBody}:${aspect}`),
      'legacy screen inputs retain their prior closest-orb order',
    );

    for (const aspect of analysis.activeAspects) {
      assert.ok(aspect.themeTags?.length);
      assert.deepEqual(
        aspect.themeTags,
        getTransitAspectThemes(aspect),
        'transit analysis and crystal scoring use the same theme vocabulary',
      );
      assert.ok(aspect.separationRangeDegrees.min <= aspect.separationRangeDegrees.max);
      assert.ok(aspect.minimumOrb <= aspect.maxOrb);
      assert.ok(aspect.duration.minimumObservedDays >= 0);
      assert.ok(aspect.duration.resolutionDays > 0);
      assert.equal(
        aspect.duration.estimatedDays === null,
        aspect.duration.isLowerBound,
        'a capped search is reported as a lower bound, not a precise duration',
      );
      if (aspect.motion === 'exact') {
        assert.ok(aspect.maxOrb <= TRANSIT_ANALYSIS_CONFIG.exactThresholdDegrees);
      }
      if (aspect.motion === 'applying') assert.equal(aspect.priorityReason, 'applying');
      if (aspect.motion === 'uncertain') assert.equal(aspect.priorityReason, 'uncertain');
      if (!result.preciseBirthMoment) {
        assert.equal(aspect.angularSeparationDegrees, null);
        assert.equal(aspect.reliability, 'limited');
      }
    }

    const grouped = [
      ...(analysis.dominantAspect ? [analysis.dominantAspect] : []),
      ...analysis.supportingAspects,
      ...analysis.longTermAspects,
    ];
    assert.equal(
      new Set(grouped).size,
      analysis.activeAspects.length,
      'dominant, supporting, and background groups cover every active aspect once',
    );
    assert.equal(
      analysis.reliability,
      result.preciseBirthMoment ? 'high' : 'limited',
    );
    for (const evidence of analysis.themeEvidence) {
      assert.equal(evidence.reinforced, evidence.aspectCount > 1);
      assert.ok(evidence.supportingAspectCount <= evidence.aspectCount);
      assert.ok(evidence.longTermAspectCount <= evidence.aspectCount);
    }
  }

  assert.ok(sawMoreThanFourAspects, 'analysis includes relevant aspects beyond the legacy screen limit');
  assert.ok(sawLongTermTransit, 'at least one synthetic chart exercises the long-term layer');
  assert.ok(sawCappedDurationLowerBound, 'long windows are exposed as observed lower bounds');
});

test('current-city coordinates do not change geocentric factors or stone matches', () => {
  const instant = new Date('2026-06-01T12:00:00.000Z');
  const newYork = calculateDailyAstrology(makeProfile(), instant);
  const boston = calculateDailyAstrology(
    makeProfile({
      currentResidence: {
        city: 'Boston',
        country: 'United States',
        latitude: 42.3601,
        longitude: -71.0589,
        timeZone: 'America/New_York',
      },
    }),
    instant,
  );

  assert.equal(newYork.status, 'calculated');
  assert.equal(boston.status, 'calculated');
  if (newYork.status !== 'calculated' || boston.status !== 'calculated') return;
  assert.equal(newYork.calculationDate, boston.calculationDate);
  assert.deepEqual(newYork.transits, boston.transits);
  assert.deepEqual(newYork.aspects, boston.aspects);
  assert.deepEqual(
    getCrystalSuggestions(newYork).map(({ crystal }) => crystal.name),
    getCrystalSuggestions(boston).map(({ crystal }) => crystal.name),
  );
});

test('daily calculation uses birthplace timezone when no current residence is saved', () => {
  const result = calculateDailyAstrology(
    makeProfile({
      currentResidence: null,
      birthPlace: { ...london, timeZone: 'Pacific/Kiritimati' },
    }),
    new Date('2026-06-01T12:00:00.000Z'),
  );
  assert.equal(result.status, 'calculated');
  if (result.status === 'calculated') {
    assert.equal(result.calculationDate, 'June 2, 2026');
  }
});
test('intentions guide matching without a collection and chart links stay specific', () => {
  const chart = calculateDailyAstrology(makeProfile(), new Date('2026-06-01T01:00:00Z'));
  assert.equal(chart.status, 'calculated');
  if (chart.status !== 'calculated') return;
  const focus = getIntentionRecommendation({ intentions: ['Focus'] });
  const change = getIntentionRecommendation({ intentions: ['Change'] });
  assert.ok(focus?.crystal.themes.some((theme) => ['focus', 'clarity', 'attention', 'structure'].includes(theme)));
  assert.deepEqual(focus?.matchedIntentions, ['focus']);
  assert.ok(change?.crystal.themes.some((theme) => ['change', 'adaptability', 'renewal', 'curiosity'].includes(theme)));
  assert.notEqual(focus?.crystal.name, change?.crystal.name);
  assert.match(focus!.reason, /intention: focus/i);
  const chartFocus = getCrystalRecommendation(chart, { intentions: ['Focus'] });
  assert.ok(chartFocus);
  assert.match(chartFocus!.reason, /main chart link|birth-chart companion|catalog associations/i);
  assert.doesNotMatch(focus!.reason, /symbolic prompt|not a guaranteed effect/i);
  assert.equal(focus!.scoreBreakdown.intentions, DAILY_CRYSTAL_SCORE_WEIGHTS.intentions);
  assert.ok(chartFocus!.scoreBreakdown.total <= 100);
});

test('daily stone ranking exposes bounded factor scores and keeps ownership separate from suitability', () => {
  const chart = calculateDailyAstrology(makeProfile(), new Date('2026-11-05T12:00:00Z'));
  const balance = calculateNatalElementBalance(makeProfile());
  assert.equal(chart.status, 'calculated');
  assert.equal(balance.status, 'calculated');
  if (chart.status !== 'calculated' || balance.status !== 'calculated') return;
  const companions = getNatalCrystalSuggestions(balance);
  const options = {
    natalCrystalRecommendations: companions,
    feeling: 'tired',
    intentions: ['Focus'],
  };
  const scored = getCrystalSuggestions(chart, options, crystalCatalog.length);
  assert.ok(scored.length > 3);
  assert.ok(scored.some(({ scoreBreakdown }) => scoreBreakdown.mood > 0));
  assert.ok(scored.some(({ scoreBreakdown }) => scoreBreakdown.intentions > 0));
  assert.equal(
    Object.values(DAILY_CRYSTAL_SCORE_WEIGHTS).reduce((sum, weight) => sum + weight, 0),
    100,
  );

  for (const suggestion of scored) {
    const components = suggestion.scoreBreakdown;
    assert.ok(components.mainTransit <= DAILY_CRYSTAL_SCORE_WEIGHTS.mainTransit);
    assert.ok(components.natalProfile <= DAILY_CRYSTAL_SCORE_WEIGHTS.natalProfile);
    assert.ok(components.mood <= DAILY_CRYSTAL_SCORE_WEIGHTS.mood);
    assert.ok(components.supportingAspects <= DAILY_CRYSTAL_SCORE_WEIGHTS.supportingAspects);
    assert.ok(components.intentions <= DAILY_CRYSTAL_SCORE_WEIGHTS.intentions);
    assert.ok(components.total <= 100);
    assert.equal(
      Number(Object.entries(components)
        .filter(([key]) => key !== 'total')
        .reduce((sum, [, value]) => sum + value, 0).toFixed(2)),
      components.total,
    );
  }

  const natalStone = scored.find(({ crystal }) => crystal.name === companions[0].crystal.name);
  assert.ok(natalStone);
  assert.ok(natalStone!.scoreBreakdown.natalProfile >= 15);
  assert.match(natalStone!.reason, /birth-chart companion/i);
  const transitStone = scored.find(({ scoreBreakdown }) => scoreBreakdown.mainTransit > 0);
  assert.ok(transitStone);
  assert.match(transitStone!.reason, /main chart link/i);
  assert.match(transitStone!.reason, /catalog associations/i);
  const supportingStone = getCrystalSuggestions(
    chart,
    { natalCrystalRecommendations: [] },
    crystalCatalog.length,
  ).find(({ scoreBreakdown }) => scoreBreakdown.supportingAspects > 0);
  assert.ok(supportingStone);
  assert.match(supportingStone!.reason, /supporting chart link/i);

  const ownedSlug = companions[0].crystal.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const ownedPrimary = getCrystalSuggestions(
    chart,
    { ...options, crystalCollection: [ownedSlug] },
    3,
  )[0];
  assert.equal(ownedPrimary.crystal.name, companions[0].crystal.name);
  assert.equal(ownedPrimary.score, natalStone!.score);
  assert.match(ownedPrimary.reason, /Among suitable stones in your collection/i);

  const unfilteredScores = new Map(
    getCrystalSuggestions(chart, {}, crystalCatalog.length)
      .map(({ crystal, score }) => [crystal.name, score]),
  );
  const hiddenSlug = companions[0].crystal.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const afterHiding = getCrystalSuggestions(
    chart,
    { hiddenCrystals: [hiddenSlug] },
    crystalCatalog.length,
  );
  assert.ok(afterHiding.every(({ crystal }) => crystal.name !== companions[0].crystal.name));
  for (const item of afterHiding) {
    assert.equal(item.score, unfilteredScores.get(item.crystal.name));
  }
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
  const noRelevantThemes = {
    ...chart,
    aspects: [],
    transitAnalysis: undefined,
    natalPlacements: [],
  };
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
test('daily transit selection can be empty without a chart and returns only visible matches', () => {
  const chartWithNoTransitThemes = calculateDailyAstrology(makeProfile(), new Date('2026-11-01T12:00:00Z'));
  const matchingDay = calculateDailyAstrology(makeProfile(), new Date('2026-11-05T12:00:00Z'));
  assert.equal(chartWithNoTransitThemes.status, 'calculated');
  assert.equal(matchingDay.status, 'calculated');
  if (chartWithNoTransitThemes.status !== 'calculated' || matchingDay.status !== 'calculated') return;
  assert.deepEqual(
    getCrystalSuggestions({
      ...chartWithNoTransitThemes,
      aspects: [],
      transitAnalysis: undefined,
      natalPlacements: [],
    }),
    [],
  );
  const natalOnly = getCrystalSuggestions({
    ...chartWithNoTransitThemes,
    aspects: [],
    transitAnalysis: undefined,
  }, {}, 3);
  assert.ok(natalOnly.length > 0, 'the natal companion profile remains a valid source of relevant matches');
  const matches = getCrystalSuggestions(matchingDay, {}, crystalCatalog.length);
  assert.ok(matches.length >= 2);
  const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  for (const count of [1, 2]) {
    const visible = new Set(matches.slice(0, count).map((item) => item.crystal.name));
    const hiddenCrystals = crystalCatalog.filter((stone) => !visible.has(stone.name)).map((stone) => slug(stone.name));
    assert.equal(getCrystalSuggestions(matchingDay, { hiddenCrystals }).length, count);
  }
});
test('daily picks are deterministic, profile-sensitive, and keep the top suitability score first', () => {
  const examples = [
    '1964-07-17',
    '1977-11-25',
    '1988-04-09',
    '2000-01-01',
    '1997-12-21',
  ];
  const date = new Date('2026-11-05T12:00:00Z');

  for (const birthDate of examples) {
    const chart = calculateDailyAstrology(makeProfile({ birthDate }), date);
    assert.equal(chart.status, 'calculated');
    if (chart.status !== 'calculated') continue;

    const suggestions = getCrystalSuggestions(chart, {}, 3);
    assert.equal(suggestions.length, 3, `${birthDate} should keep three suitable suggestions`);
    assert.ok(suggestions.every((suggestion) => suggestion.basis === 'chart'));
    assert.ok(
      new Set(suggestions.map((suggestion) => suggestion.crystal.note)).size >= 2,
      `${birthDate} should avoid a list of three identical guide categories`,
    );
    assert.ok(suggestions[0].score >= suggestions[1].score);
    assert.ok(suggestions[0].score >= suggestions[2].score);
    assert.deepEqual(getCrystalSuggestions(chart, {}, 3), suggestions);
  }
});
test('the primary recommendation keeps the top score while alternatives stay distinct', () => {
  const chart = calculateDailyAstrology(
    makeProfile({ birthDate: '1992-09-12' }),
    new Date('2026-11-05T12:00:00Z'),
  );
  assert.equal(chart.status, 'calculated');
  if (chart.status !== 'calculated') return;

  const suggestions = getCrystalSuggestions(chart, {}, 3);
  assert.equal(suggestions.length, 3);
  assert.ok(suggestions.every((suggestion) => suggestion.basis === 'chart'));
  assert.ok(suggestions[0].score >= suggestions[1].score);
  assert.ok(suggestions[0].score >= suggestions[2].score);
  assert.equal(new Set(suggestions.map(({ crystal }) => crystal.name)).size, 3);
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
  assert.match(result!.reason, /matches your intention: focus/i);
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

  const withTransit = (aspect: string, quality: string) => {
    const dominant = {
      ...chart.transitAnalysis!.dominantAspect!,
      aspect,
      quality,
    };
    return {
      ...chart,
      aspects: [dominant],
      transitAnalysis: {
        ...chart.transitAnalysis!,
        dominantAspect: dominant,
        supportingAspects: [],
      },
    } as typeof chart;
  };
  const steadyDay = getCrystalRecommendation(withTransit('trine', 'supportive'), { feeling: 'tired' });
  const demandingDay = getCrystalRecommendation(withTransit('square', 'challenging'), { feeling: 'tired' });

  assert.notDeepEqual(
    getCrystalSuggestions(withTransit('trine', 'supportive'), { feeling: 'tired' }).map((suggestion) => suggestion.crystal.name),
    getCrystalSuggestions(withTransit('square', 'challenging'), { feeling: 'tired' }).map((suggestion) => suggestion.crystal.name),
  );
  assert.equal(steadyDay?.basis, 'feeling');
  assert.equal(demandingDay?.feelingLabel, 'Feeling tired');
  assert.notEqual(getIntentionRecommendation({ feeling: 'tired', hiddenCrystals: ['amethyst'] })?.crystal.name, 'Amethyst');
  assert.match(steadyDay!.reason, /selected feeling/i);
  assert.match(steadyDay!.reason, /catalog associations/i);
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
test('a saved change to birth date and birthplace recalculates daily stone recommendations', () => {
  const now = new Date('2026-11-05T12:00:00.000Z');
  const previousProfile = makeProfile({
    birthDate: '1951-02-03',
    birthPlace: { ...london, timeZone: 'Europe/London' },
    currentResidence: null,
  });
  const updatedProfile = makeProfile({
    birthDate: '2005-06-30',
    birthPlace: {
      city: 'Sydney',
      country: 'Australia',
      latitude: -33.8688,
      longitude: 151.2093,
      timeZone: 'Australia/Sydney',
    },
    currentResidence: null,
  });
  const previousChart = getDailyAstrology(previousProfile, now);
  const updatedChart = getDailyAstrology(updatedProfile, now);
  assert.equal(previousChart.status, 'calculated');
  assert.equal(updatedChart.status, 'calculated');
  if (previousChart.status !== 'calculated' || updatedChart.status !== 'calculated') return;

  const previousStones = getCrystalSuggestions(previousChart).map(({ crystal }) => crystal.name);
  const updatedStones = getCrystalSuggestions(updatedChart).map(({ crystal }) => crystal.name);
  assert.notDeepEqual(updatedStones, previousStones);
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

test('owned chart matches lead the eight companions while the catalog fills the rest', () => {
  const chart: NatalElementBalance = {
    status: 'calculated',
    counts: { Fire: 5, Air: 1, Water: 2, Earth: 2 },
    total: 10,
    dominant: ['Fire'],
    leastRepresented: ['Air'],
    preciseBirthMoment: true,
  };
  const baseline = getNatalCrystalSuggestions(chart);
  const owned = baseline[7].crystal.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const prioritized = getNatalCrystalSuggestions(chart, [], 8, undefined, undefined, [owned]);

  assert.equal(prioritized.length, 8);
  assert.equal(prioritized[0].crystal.name, baseline[7].crystal.name);
  assert.equal(new Set(prioritized.map(({ crystal }) => crystal.name)).size, 8);
});

test('daily suggestions use suitable owned stones first and fall back to the full catalog', () => {
  const options = { feeling: 'tired', dateKey: '2026-11-06' };
  const baseline = getCrystalSuggestions(undefined, options, 3);
  assert.equal(baseline.length, 3);
  const owned = baseline[2].crystal.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const prioritized = getCrystalSuggestions(
    undefined,
    { ...options, crystalCollection: [owned] },
    3,
  );

  assert.equal(prioritized[0].crystal.name, baseline[2].crystal.name);
  assert.equal(prioritized.length, 3);
  assert.equal(new Set(prioritized.map(({ crystal }) => crystal.name)).size, 3);

  const hiddenOwned = getCrystalSuggestions(
    undefined,
    { ...options, crystalCollection: [owned], hiddenCrystals: [owned] },
    3,
  );
  assert.equal(hiddenOwned.length, 3);
  assert.ok(hiddenOwned.every(({ crystal }) =>
    crystal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') !== owned,
  ));
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

test('Cosmos and Crystals receive the same cached daily context with existing recommendations', () => {
  const profile = makeProfile();
  const preferences = defaultPreferences();
  const now = new Date('2026-06-01T12:00:00.000Z');
  const translate = (source: string) => source;
  const input = { profile, preferences, now, locale: 'en' as const, translate };

  const cosmosContext = getDailyPersonalizationContext(input);
  const crystalsContext = getDailyPersonalizationContext(input);

  assert.strictEqual(crystalsContext, cosmosContext);
  assert.strictEqual(cosmosContext.astrology, getDailyAstrology(profile, now));
  assert.equal(cosmosContext.astrology?.status, 'calculated');
  assert.equal(cosmosContext.date, '2026-06-01');
  assert.equal(cosmosContext.timeZone, currentResidence.timeZone);
  assert.equal(cosmosContext.crystals.natalRecommendations.length, 8);
  assert.ok(cosmosContext.crystals.dailyCandidates.length <= 3);
  assert.deepEqual(cosmosContext.crystals.ownedCrystals, preferences.crystalCollection);
  assert.deepEqual(cosmosContext.crystals.hiddenCrystals, preferences.crystalPreferences.hiddenCrystals);

  const directBalance = calculateNatalElementBalance(profile);
  assert.deepEqual(cosmosContext.natalProfile.elementBalance, directBalance);
  if (directBalance.status === 'calculated') {
    assert.deepEqual(
      cosmosContext.crystals.natalRecommendations,
      getNatalCrystalSuggestions(
        directBalance,
        preferences.crystalPreferences.hiddenCrystals,
        8,
        translate,
        translate,
        preferences.crystalCollection,
      ),
    );
  }
  assert.deepEqual(
    cosmosContext.crystals.dailyCandidates,
    getCrystalSuggestions(
      cosmosContext.astrology?.status === 'calculated' ? cosmosContext.astrology : undefined,
      {
        hiddenCrystals: preferences.crystalPreferences.hiddenCrystals,
        crystalCollection: preferences.crystalCollection,
        feeling: preferences.crystalPreferences.feeling,
        dateKey: cosmosContext.date,
      },
      3,
      translate,
      translate,
    ),
  );

  if (cosmosContext.astrology?.status === 'calculated') {
    assert.deepEqual(
      cosmosContext.natalProfile.elementBalance,
      calculateNatalElementBalanceFromPlacements(
        cosmosContext.astrology.natalPlacements,
        cosmosContext.astrology.preciseBirthMoment,
      ),
    );
  }
});

test('daily context refreshes preferences while reusing the same astronomical calculation', () => {
  const profile = makeProfile();
  const now = new Date('2026-06-01T12:00:00.000Z');
  const preferences = defaultPreferences();
  const translate = (source: string) => source;
  const initial = getDailyPersonalizationContext({
    profile,
    preferences,
    now,
    locale: 'en',
    translate,
  });
  const withMood = getDailyPersonalizationContext({
    profile,
    preferences: {
      ...preferences,
      crystalPreferences: {
        ...preferences.crystalPreferences,
        feeling: 'tired',
        feelingDate: '2026-06-01',
      },
    },
    now,
    locale: 'en',
    translate,
  });

  assert.notStrictEqual(withMood, initial);
  assert.strictEqual(withMood.astrology, initial.astrology);
  assert.equal(withMood.mood.selectedMood, 'tired');
  assert.equal(withMood.mood.selectedDay, '2026-06-01');
  assert.ok(withMood.crystals.dailyCandidates.length > 0);
});

test('daily context ignores a feeling saved on a prior device day', () => {
  const profile = makeProfile();
  const now = new Date('2026-06-01T12:00:00.000Z');
  const priorDay = localDayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const context = getDailyPersonalizationContext({
    profile,
    preferences: {
      ...defaultPreferences(),
      crystalPreferences: {
        ...defaultPreferences().crystalPreferences,
        feeling: 'tired',
        feelingDate: priorDay,
      },
    },
    now,
    locale: 'en',
    translate: (source) => source,
  });

  assert.equal(context.mood.selectedMood, null);
  assert.equal(context.mood.selectedDay, null);
  assert.ok(context.crystals.dailyCandidates.every(
    (candidate) => candidate.scoreBreakdown.mood === 0,
  ));
});

test('daily context invalidates for collection changes and a newly saved birth profile', () => {
  const profile = makeProfile();
  const preferences = defaultPreferences();
  const now = new Date('2026-06-01T12:00:00.000Z');
  const translate = (source: string) => source;
  const initial = getDailyPersonalizationContext({
    profile,
    preferences,
    now,
    locale: 'en',
    translate,
  });
  const withCollection = getDailyPersonalizationContext({
    profile,
    preferences: { ...preferences, crystalCollection: ['rose-quartz'] },
    now,
    locale: 'en',
    translate,
  });
  const withUpdatedProfile = getDailyPersonalizationContext({
    profile: { ...profile, birthDate: '1991-06-15' },
    preferences,
    now,
    locale: 'en',
    translate,
  });

  assert.notStrictEqual(withCollection, initial);
  assert.strictEqual(withCollection.astrology, initial.astrology);
  assert.deepEqual(withCollection.crystals.ownedCrystals, ['rose-quartz']);
  assert.notStrictEqual(withUpdatedProfile, initial);
  assert.notStrictEqual(withUpdatedProfile.astrology, initial.astrology);
});

test('daily context supports mood-only recommendations without a profile', () => {
  const preferences = {
    ...defaultPreferences(),
    crystalPreferences: {
      ...defaultPreferences().crystalPreferences,
      feeling: 'tired',
      feelingDate: '2026-06-01',
    },
  };
  const now = new Date('2026-06-01T12:00:00.000Z');
  const context = getDailyPersonalizationContext({
    profile: null,
    preferences,
    now,
    locale: 'en',
    translate: (source) => source,
  });

  assert.equal(context.astrology, null);
  assert.equal(context.natalProfile.elementBalance, null);
  assert.equal(context.mood.selectedMood, 'tired');
  assert.equal(context.crystals.dailyCandidates.length, 3);
});
