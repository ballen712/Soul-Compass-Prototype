import { Body, Ecliptic, GeoVector } from 'astronomy-engine';
import type { Crystal } from '@/constants/content';
import {
  alternativeCrystals,
  samplePrimaryCrystal,
} from '../constants/content';
import type { HomeLocation, UserProfile } from './profile';
import { getChartPrecision } from './profile';
import { getTransitAspectThemes, planetDailyThemeCopy } from './transit-themes';

export const EPHEMERIS_SOURCE = {
  name: 'Astronomy Engine 2.1.19',
  models: 'VSOP87 and NOVAS C 3.1',
  accuracy: 'The project documents accuracy within approximately 1 arcminute and validation against NOVAS and JPL Horizons.',
  url: 'https://github.com/cosinekitty/astronomy',
} as const;

const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

const PLANETS = [
  Body.Sun,
  Body.Moon,
  Body.Mercury,
  Body.Venus,
  Body.Mars,
  Body.Jupiter,
  Body.Saturn,
  Body.Uranus,
  Body.Neptune,
  Body.Pluto,
] as const;

const MAJOR_ASPECTS = [
  { name: 'conjunction', angle: 0, quality: 'intensifying' },
  { name: 'sextile', angle: 60, quality: 'supportive' },
  { name: 'square', angle: 90, quality: 'challenging' },
  { name: 'trine', angle: 120, quality: 'supportive' },
  { name: 'opposition', angle: 180, quality: 'challenging' },
] as const;

/**
 * Transit rules are deliberately explicit and bounded:
 * - Keep the existing 3° daily orb for compatibility.
 * - Treat <=0.05° as exact (three times the documented ~1 arcminute model accuracy).
 * - Compare real Astronomy Engine positions 12 hours before and after for motion.
 * - Sample duration from actual positions, at <=1 day and about <=0.5° of motion,
 *   for at most 90 days on either side; beyond that, expose only a lower bound.
 * - Call a sampled window long-term at two weeks, and round ranking orbs to 0.1°
 *   so negligible numerical changes do not reorder otherwise similar factors.
 */
export const TRANSIT_ANALYSIS_CONFIG = {
  orbLimitDegrees: 3,
  exactThresholdDegrees: 0.05,
  motionSampleHours: 12,
  motionEpsilonDegrees: 0.005,
  durationSearchHorizonDays: 90,
  maximumDurationSampleDays: 1,
  targetAngularChangePerDurationSampleDegrees: 0.5,
  rankingOrbResolutionDegrees: 0.1,
  longTermMinimumDays: 14,
} as const;

export type PlanetaryBody = (typeof PLANETS)[number];
type Planet = PlanetaryBody;
export type AspectName = (typeof MAJOR_ASPECTS)[number]['name'];
export type ZodiacElement = 'Fire' | 'Air' | 'Water' | 'Earth';

export type NatalElementBalance = {
  status: 'calculated';
  counts: Record<ZodiacElement, number>;
  total: number;
  dominant: ZodiacElement[];
  leastRepresented: ZodiacElement[];
  preciseBirthMoment: boolean;
};

export type NatalElementResult =
  | NatalElementBalance
  | { status: 'unavailable'; message: string };

const SIGN_ELEMENTS: Record<(typeof ZODIAC_SIGNS)[number], ZodiacElement> = {
  Aries: 'Fire',
  Taurus: 'Earth',
  Gemini: 'Air',
  Cancer: 'Water',
  Leo: 'Fire',
  Virgo: 'Earth',
  Libra: 'Air',
  Scorpio: 'Water',
  Sagittarius: 'Fire',
  Capricorn: 'Earth',
  Aquarius: 'Air',
  Pisces: 'Water',
};

export type NatalPlacement = {
  body: Planet;
  longitude: number;
  sign: (typeof ZODIAC_SIGNS)[number];
  /** Longitudes sampled over the possible local birth day for untimed charts. */
  possibleLongitudes: number[];
};

export type TransitAspect = {
  transitBody: Planet;
  transitSign: (typeof ZODIAC_SIGNS)[number];
  natalBody: Planet;
  natalSign: (typeof ZODIAC_SIGNS)[number];
  aspect: AspectName;
  quality: (typeof MAJOR_ASPECTS)[number]['quality'];
  maxOrb: number;
};

export type TransitMotion = 'applying' | 'exact' | 'separating' | 'uncertain';
export type TransitReliability = 'high' | 'limited';
export type TransitDuration = {
  /** A coarse, sampled duration estimate; never an exact prediction. */
  category: 'brief' | 'days' | 'weeks' | 'long-term';
  /** Approximate total window when both boundaries were observed within the search horizon. */
  estimatedDays: number | null;
  /** Conservative span observed inside the configured orb at sampled dates. */
  minimumObservedDays: number;
  /** True if one or both boundaries lay beyond the bounded search horizon. */
  isLowerBound: boolean;
  /** Maximum time interval between samples used to bracket a boundary. */
  resolutionDays: number;
};

export type AnalyzedTransitAspect = TransitAspect & {
  /** Null when the birth-time range does not support a single exact separation. */
  angularSeparationDegrees: number | null;
  separationRangeDegrees: { min: number; max: number };
  minimumOrb: number;
  motion: TransitMotion;
  duration: TransitDuration;
  themeTags: readonly string[];
  reliability: TransitReliability;
  priorityReason: 'exact' | 'applying' | 'closest' | 'uncertain';
};

export type DailyTransitAnalysis = {
  /** Every planet-to-planet aspect inside the documented orb limit. */
  activeAspects: AnalyzedTransitAspect[];
  dominantAspect: AnalyzedTransitAspect | null;
  supportingAspects: AnalyzedTransitAspect[];
  longTermAspects: AnalyzedTransitAspect[];
  mainThemes: string[];
  supportingThemes: string[];
  longTermThemes: string[];
  themeEvidence: {
    theme: string;
    aspectCount: number;
    appearsInMain: boolean;
    supportingAspectCount: number;
    longTermAspectCount: number;
    reinforced: boolean;
  }[];
  reliability: TransitReliability;
};

export type CalculatedReading = {
  label: string;
  title: string;
  body: string;
  favorableFocus: string;
  gentleCaution: string;
  reflection: string;
  factorSummary: string;
};

export type DailyAstrology =
  | {
      status: 'calculated';
      reading: CalculatedReading;
      natalPlacements: NatalPlacement[];
      transits: { body: Planet; longitude: number; sign: (typeof ZODIAC_SIGNS)[number] }[];
      aspects: TransitAspect[];
      /** Always populated by calculateDailyAstrology; optional for legacy synthetic fixtures. */
      transitAnalysis?: DailyTransitAnalysis;
      preciseBirthMoment: boolean;
      /** The saved residence's local calendar day; coordinates do not affect planetary factors. */
      calculationDate: string;
      sourceLabel: string;
    }
  | { status: 'unavailable'; message: string };

function normalizeLongitude(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

function geocentricEclipticLongitude(body: Planet, date: Date): number {
  return Ecliptic(GeoVector(body, date, true)).elon;
}

function signForLongitude(longitude: number): (typeof ZODIAC_SIGNS)[number] {
  return ZODIAC_SIGNS[Math.floor(normalizeLongitude(longitude) / 30)];
}

function getLocalDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    calendar: 'gregory',
    numberingSystem: 'latn',
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

function getLocalDateTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    calendar: 'gregory',
    numberingSystem: 'latn',
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function isSameLocalDateTime(
  actual: ReturnType<typeof getLocalDateTimeParts>,
  expected: { year: number; month: number; day: number; hour: number; minute: number },
): boolean {
  return (
    actual.year === expected.year &&
    actual.month === expected.month &&
    actual.day === expected.day &&
    actual.hour === expected.hour &&
    actual.minute === expected.minute &&
    actual.second === 0
  );
}

/**
 * Convert a clock reading in a named time zone to one UTC instant. Ambiguous
 * daylight-saving clock times are rejected instead of guessed.
 */
function localBirthTimeToUtc(
  birthDate: string,
  localTime: string,
  timeZone: string,
): Date | null {
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hour, minute] = localTime.split(':').map(Number);
  const wanted = { year, month, day, hour, minute };
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const offsets = new Set<number>();

  for (let hours = -48; hours <= 48; hours += 3) {
    const sample = new Date(localAsUtc + hours * 60 * 60 * 1000);
    const parts = getLocalDateTimeParts(sample, timeZone);
    const renderedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    offsets.add(renderedAsUtc - Math.floor(sample.getTime() / 1000) * 1000);
  }

  const matches = [...offsets]
    .map((offset) => new Date(localAsUtc - offset))
    .filter((candidate) => isSameLocalDateTime(getLocalDateTimeParts(candidate, timeZone), wanted));
  const uniqueMatches = [...new Set(matches.map((date) => date.getTime()))];
  return uniqueMatches.length === 1 ? new Date(uniqueMatches[0]) : null;
}

function possibleBirthDayTimes(birthDate: string): Date[] {
  const midnightUtc = new Date(`${birthDate}T00:00:00.000Z`).getTime();
  const nextMidnightUtc = midnightUtc + 24 * 60 * 60 * 1000;
  const start = midnightUtc - 14 * 60 * 60 * 1000;
  const end = nextMidnightUtc + 14 * 60 * 60 * 1000;
  const sampleEvery = 2 * 60 * 60 * 1000;
  const dates: Date[] = [];
  for (let timestamp = start; timestamp <= end; timestamp += sampleEvery) {
    dates.push(new Date(timestamp));
  }
  return dates;
}

function meanLongitude(longitudes: number[]): number {
  const x = longitudes.reduce((sum, longitude) => sum + Math.cos((longitude * Math.PI) / 180), 0);
  const y = longitudes.reduce((sum, longitude) => sum + Math.sin((longitude * Math.PI) / 180), 0);
  return normalizeLongitude((Math.atan2(y, x) * 180) / Math.PI);
}

function getNatalPlacements(
  profile: UserProfile,
  preciseBirthMoment: boolean,
  birthInstant: Date | null,
): NatalPlacement[] {
  const sampleTimes = preciseBirthMoment && birthInstant
    ? [birthInstant]
    : possibleBirthDayTimes(profile.birthDate);

  return PLANETS.flatMap((body) => {
    const possibleLongitudes = sampleTimes.map((sampleTime) =>
      normalizeLongitude(geocentricEclipticLongitude(body, sampleTime)),
    );
    const signs = new Set(possibleLongitudes.map(signForLongitude));
    if (signs.size !== 1) return [];
    const longitude = meanLongitude(possibleLongitudes);
    return [{
      body,
      longitude,
      sign: signForLongitude(longitude),
      possibleLongitudes,
    }];
  });
}

/**
 * Uses only reliable natal sign placements and never requires a current
 * residence, API consent, or a network request.
 */
export function calculateNatalElementBalance(profile: UserProfile): NatalElementResult {
  const precision = getChartPrecision(profile);
  const preciseBirthMoment = precision.mayUseTimeSensitiveInterpretations;
  const birthInstant = preciseBirthMoment
    ? localBirthTimeToUtc(
        profile.birthDate,
        profile.birthTime.status === 'known' ? profile.birthTime.localTime : '',
        profile.birthPlace.timeZone,
      )
    : null;

  if (preciseBirthMoment && !birthInstant) {
    return {
      status: 'unavailable',
      message: 'The saved birth time is ambiguous in this time zone. Check the time before using this chart summary.',
    };
  }

  const placements = getNatalPlacements(profile, preciseBirthMoment, birthInstant);
  return calculateNatalElementBalanceFromPlacements(placements, preciseBirthMoment);
}

export function calculateNatalElementBalanceFromPlacements(
  placements: readonly NatalPlacement[],
  preciseBirthMoment: boolean,
): NatalElementResult {
  if (placements.length === 0) {
    return {
      status: 'unavailable',
      message: 'There are not enough reliable sign placements to summarize this birth chart.',
    };
  }

  const counts: Record<ZodiacElement, number> = {
    Fire: 0,
    Air: 0,
    Water: 0,
    Earth: 0,
  };
  for (const placement of placements) counts[SIGN_ELEMENTS[placement.sign]] += 1;
  const values = Object.values(counts);
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const orderedElements: ZodiacElement[] = ['Fire', 'Air', 'Water', 'Earth'];

  return {
    status: 'calculated',
    counts,
    total: placements.length,
    dominant: orderedElements.filter((element) => counts[element] === highest),
    leastRepresented: orderedElements.filter((element) => counts[element] === lowest),
    preciseBirthMoment,
  };
}

function angularSeparation(first: number, second: number): number {
  const difference = Math.abs(normalizeLongitude(first - second));
  return Math.min(difference, 360 - difference);
}

type TransitPosition = {
  body: Planet;
  longitude: number;
  speedDegreesPerDay: number;
  sign: (typeof ZODIAC_SIGNS)[number];
};

type DurationBoundary = {
  insideDays: number;
  estimatedDays: number | null;
  capped: boolean;
};

type LongitudeAt = (body: Planet, date: Date) => number;

function aspectOrb(longitude: number, natalLongitude: number, angle: number) {
  return Math.abs(angularSeparation(longitude, natalLongitude) - angle);
}

export function classifyTransitMotion(
  currentOrbs: readonly number[],
  beforeOrbs: readonly number[],
  afterOrbs: readonly number[],
): TransitMotion {
  if (
    currentOrbs.length > 0
    && Math.max(...currentOrbs) <= TRANSIT_ANALYSIS_CONFIG.exactThresholdDegrees
  ) {
    return 'exact';
  }

  const statuses = currentOrbs.map((currentOrb, index): TransitMotion => {
    const beforeChange = currentOrb - beforeOrbs[index];
    const afterChange = afterOrbs[index] - currentOrb;
    const epsilon = TRANSIT_ANALYSIS_CONFIG.motionEpsilonDegrees;
    if (beforeChange < -epsilon && afterChange < -epsilon) return 'applying';
    if (beforeChange > epsilon && afterChange > epsilon) return 'separating';
    return 'uncertain';
  });
  const first = statuses[0];
  return first && statuses.every((status) => status === first) ? first : 'uncertain';
}

function durationSampleStep(speedDegreesPerDay: number) {
  const speed = Math.max(Math.abs(speedDegreesPerDay), 0.05);
  return Math.max(
    1 / 24,
    Math.min(
      TRANSIT_ANALYSIS_CONFIG.maximumDurationSampleDays,
      TRANSIT_ANALYSIS_CONFIG.targetAngularChangePerDurationSampleDegrees / speed,
    ),
  );
}

function scanDurationBoundary(
  direction: -1 | 1,
  transitBody: Planet,
  natal: NatalPlacement,
  aspectAngle: number,
  now: Date,
  stepDays: number,
  longitudeAt: LongitudeAt,
): DurationBoundary {
  const horizon = TRANSIT_ANALYSIS_CONFIG.durationSearchHorizonDays;
  let lastInsideDays = 0;
  for (let elapsedDays = stepDays; elapsedDays <= horizon + 1e-9;) {
    const sampleDays = Math.min(elapsedDays, horizon);
    const sampleDate = new Date(now.getTime() + direction * sampleDays * 24 * 60 * 60 * 1000);
    const longitude = longitudeAt(transitBody, sampleDate);
    const maximumOrb = Math.max(
      ...natal.possibleLongitudes.map((natalLongitude) =>
        aspectOrb(longitude, natalLongitude, aspectAngle),
      ),
    );
    if (maximumOrb > TRANSIT_ANALYSIS_CONFIG.orbLimitDegrees) {
      return {
        insideDays: lastInsideDays,
        estimatedDays: (lastInsideDays + sampleDays) / 2,
        capped: false,
      };
    }
    lastInsideDays = sampleDays;
    if (sampleDays >= horizon) break;
    elapsedDays = Math.min(elapsedDays + stepDays, horizon);
  }
  return { insideDays: horizon, estimatedDays: null, capped: true };
}

function estimateTransitDuration(
  transit: TransitPosition,
  natal: NatalPlacement,
  aspectAngle: number,
  now: Date,
  longitudeAt: LongitudeAt,
): TransitDuration {
  const stepDays = durationSampleStep(transit.speedDegreesPerDay);
  const before = scanDurationBoundary(
    -1, transit.body, natal, aspectAngle, now, stepDays, longitudeAt,
  );
  const after = scanDurationBoundary(
    1, transit.body, natal, aspectAngle, now, stepDays, longitudeAt,
  );
  const isLowerBound = before.capped || after.capped;
  const estimatedDays = isLowerBound || before.estimatedDays === null || after.estimatedDays === null
    ? null
    : before.estimatedDays + after.estimatedDays;
  const minimumObservedDays = before.insideDays + after.insideDays;
  const durationForCategory = estimatedDays ?? minimumObservedDays;
  const category: TransitDuration['category'] = durationForCategory >= TRANSIT_ANALYSIS_CONFIG.longTermMinimumDays
    ? 'long-term'
    : durationForCategory >= 7
      ? 'weeks'
      : durationForCategory >= 1
        ? 'days'
        : 'brief';

  return {
    category,
    estimatedDays: estimatedDays === null ? null : Number(estimatedDays.toFixed(1)),
    minimumObservedDays: Number(minimumObservedDays.toFixed(1)),
    isLowerBound,
    resolutionDays: Number((stepDays * 2).toFixed(3)),
  };
}

function getTransitAspects(
  natalPlacements: NatalPlacement[],
  transits: TransitPosition[],
  now: Date,
  longitudeAt: LongitudeAt,
  preciseBirthMoment: boolean,
): AnalyzedTransitAspect[] {
  const candidates: AnalyzedTransitAspect[] = [];
  const motionOffsetMs = TRANSIT_ANALYSIS_CONFIG.motionSampleHours * 60 * 60 * 1000;
  for (const transit of transits) {
    for (const natal of natalPlacements) {
      const matches = MAJOR_ASPECTS.map((aspect) => ({
        aspect,
        orbs: natal.possibleLongitudes.map((longitude) =>
          aspectOrb(transit.longitude, longitude, aspect.angle),
        ),
        separations: natal.possibleLongitudes.map((longitude) =>
          angularSeparation(transit.longitude, longitude),
        ),
      }))
        .map((match) => ({
          ...match,
          maxOrb: Math.max(...match.orbs),
          minimumOrb: Math.min(...match.orbs),
        }))
        .filter((match) => match.maxOrb <= TRANSIT_ANALYSIS_CONFIG.orbLimitDegrees)
        .sort((first, second) => first.maxOrb - second.maxOrb);
      const closest = matches[0];
      if (!closest) continue;
      const longitudeBefore = longitudeAt(
        transit.body,
        new Date(now.getTime() - motionOffsetMs),
      );
      const longitudeAfter = longitudeAt(
        transit.body,
        new Date(now.getTime() + motionOffsetMs),
      );
      const beforeOrbs = natal.possibleLongitudes.map((longitude) =>
        aspectOrb(longitudeBefore, longitude, closest.aspect.angle),
      );
      const currentOrbs = closest.orbs;
      const afterOrbs = natal.possibleLongitudes.map((longitude) =>
        aspectOrb(longitudeAfter, longitude, closest.aspect.angle),
      );
      const motion = classifyTransitMotion(currentOrbs, beforeOrbs, afterOrbs);
      const separationRangeDegrees = {
        min: Math.min(...closest.separations),
        max: Math.max(...closest.separations),
      };
      const priorityReason: AnalyzedTransitAspect['priorityReason'] = motion === 'exact'
        ? 'exact'
        : motion === 'applying'
          ? 'applying'
          : motion === 'uncertain'
            ? 'uncertain'
            : 'closest';
      candidates.push({
        transitBody: transit.body,
        transitSign: transit.sign,
        natalBody: natal.body,
        natalSign: natal.sign,
        aspect: closest.aspect.name,
        quality: closest.aspect.quality,
        maxOrb: closest.maxOrb,
        themeTags: getTransitAspectThemes({
          transitBody: transit.body,
          aspect: closest.aspect.name,
          natalBody: natal.body,
        }),
        angularSeparationDegrees: natal.possibleLongitudes.length === 1
          ? closest.separations[0]
          : null,
        separationRangeDegrees,
        minimumOrb: closest.minimumOrb,
        motion,
        duration: estimateTransitDuration(
          transit,
          natal,
          closest.aspect.angle,
          now,
          longitudeAt,
        ),
        reliability: preciseBirthMoment ? 'high' : 'limited',
        priorityReason,
      });
    }
  }
  return candidates.sort((first, second) => first.maxOrb - second.maxOrb);
}

function transitPriority(aspect: AnalyzedTransitAspect) {
  const roundedOrb = Math.round(
    aspect.maxOrb / TRANSIT_ANALYSIS_CONFIG.rankingOrbResolutionDegrees,
  );
  const motionPriority: Record<TransitMotion, number> = {
    exact: 0,
    applying: 1,
    separating: 2,
    uncertain: 3,
  };
  return [
    aspect.motion === 'exact' ? 0 : 1,
    roundedOrb,
    motionPriority[aspect.motion],
    PLANETS.indexOf(aspect.transitBody),
    MAJOR_ASPECTS.findIndex((item) => item.name === aspect.aspect),
    PLANETS.indexOf(aspect.natalBody),
  ];
}

function compareTransitPriority(
  first: AnalyzedTransitAspect,
  second: AnalyzedTransitAspect,
) {
  // Lexicographic order, not a weighted score: exactness, rounded orb,
  // applying/separating state, then stable body/aspect order.
  const firstPriority = transitPriority(first);
  const secondPriority = transitPriority(second);
  for (let index = 0; index < firstPriority.length; index += 1) {
    if (firstPriority[index] !== secondPriority[index]) {
      return firstPriority[index] - secondPriority[index];
    }
  }
  return 0;
}

function uniqueThemes(aspects: readonly AnalyzedTransitAspect[]) {
  return [...new Set(aspects.flatMap((aspect) => aspect.themeTags ?? []))];
}

function buildThemeEvidence(
  aspects: readonly AnalyzedTransitAspect[],
  dominantAspect: AnalyzedTransitAspect | null,
  supportingAspects: readonly AnalyzedTransitAspect[],
) {
  const supportingSet = new Set(supportingAspects);
  const evidence = new Map<string, {
    theme: string;
    aspectCount: number;
    appearsInMain: boolean;
    supportingAspectCount: number;
    longTermAspectCount: number;
  }>();

  for (const aspect of aspects) {
    for (const theme of new Set(aspect.themeTags ?? [])) {
      const entry = evidence.get(theme) ?? {
        theme,
        aspectCount: 0,
        appearsInMain: false,
        supportingAspectCount: 0,
        longTermAspectCount: 0,
      };
      entry.aspectCount += 1;
      if (aspect === dominantAspect) entry.appearsInMain = true;
      if (supportingSet.has(aspect)) entry.supportingAspectCount += 1;
      if (aspect.duration.category === 'long-term') entry.longTermAspectCount += 1;
      evidence.set(theme, entry);
    }
  }

  return [...evidence.values()].map((entry) => ({
    ...entry,
    reinforced: entry.aspectCount > 1,
  }));
}

function createTransitAnalysis(
  aspects: AnalyzedTransitAspect[],
  preciseBirthMoment: boolean,
): DailyTransitAnalysis {
  const ranked = [...aspects].sort(compareTransitPriority);
  const shortTerm = ranked.filter((aspect) => aspect.duration.category !== 'long-term');
  const longTerm = ranked.filter((aspect) => aspect.duration.category === 'long-term');
  const dominantAspect = shortTerm[0] ?? ranked[0] ?? null;
  const supportingAspects = shortTerm.filter((aspect) => aspect !== dominantAspect);
  const longTermAspects = longTerm.filter((aspect) => aspect !== dominantAspect);
  const mainThemes = dominantAspect?.themeTags ? [...dominantAspect.themeTags] : [];
  const mainThemeSet = new Set(mainThemes);
  const supportingThemes = uniqueThemes(supportingAspects)
    .filter((theme) => !mainThemeSet.has(theme));
  const usedThemes = new Set([...mainThemes, ...supportingThemes]);
  const longTermThemes = uniqueThemes(longTermAspects)
    .filter((theme) => !usedThemes.has(theme));

  return {
    activeAspects: ranked,
    dominantAspect,
    supportingAspects,
    longTermAspects,
    mainThemes,
    supportingThemes,
    longTermThemes,
    themeEvidence: buildThemeEvidence(ranked, dominantAspect, supportingAspects),
    reliability: preciseBirthMoment ? 'high' : 'limited',
  };
}

function toLegacyTransitAspect(aspect: AnalyzedTransitAspect): TransitAspect {
  return {
    transitBody: aspect.transitBody,
    transitSign: aspect.transitSign,
    natalBody: aspect.natalBody,
    natalSign: aspect.natalSign,
    aspect: aspect.aspect,
    quality: aspect.quality,
    maxOrb: aspect.maxOrb,
  };
}

export function makeCalculatedReading(
  natalPlacements: NatalPlacement[],
  aspects: TransitAspect[],
): CalculatedReading {
  const leadingAspect = aspects[0];
  if (leadingAspect) {
    const aspectAdvice = {
      conjunction: {
        title: 'Notice what is taking center stage.',
        explanation: 'One topic may feel louder than the rest; notice why before you act.',
        favorableFocus: 'Detailed work with a clear starting point may feel satisfying.',
        gentleCaution: 'Do not let every notification choose your next task.',
        question: 'What can I protect by saying a gentle no',
      },
      sextile: {
        title: 'Leave room for a useful opening.',
        explanation: 'Stay curious about a helpful conversation or an unexpected option.',
        favorableFocus: 'A first conversation or a small test of an idea may show you a useful path.',
        gentleCaution: 'Check the practical details before promising more than you can give.',
        question: 'What would I try if I did not have to get it right the first time',
      },
      square: {
        title: 'Treat tension as information.',
        explanation: 'A mismatch between your needs and the day’s demands may ask for a closer look.',
        favorableFocus: 'Thoughtful problem-solving may work better than rushing to an answer.',
        gentleCaution: 'Give yourself a beat before replying in the heat of the moment.',
        question: 'Where would asking for help be wiser than pushing through',
      },
      trine: {
        title: 'Notice what is already working.',
        explanation: 'Something familiar may come more easily; notice what is helping.',
        favorableFocus: 'A practiced skill or routine can help you make steady progress.',
        gentleCaution: 'Do not fill every free hour just because things feel manageable.',
        question: 'What kind of support could I offer or accept',
      },
      opposition: {
        title: 'Let two points of view sit side by side.',
        explanation: 'Two needs may pull in different directions, and both deserve a hearing.',
        favorableFocus: 'A conversation with room for listening and compromise may be more useful than a quick answer.',
        gentleCaution: 'Do not make a disagreement carry more meaning than it needs to.',
        question: 'Which boundary would help me stay kind without agreeing to everything',
      },
    }[leadingAspect.aspect];
    return {
      label: 'TODAY’S REFLECTION',
      title: aspectAdvice.title,
      body: `Today highlights ${planetDailyThemeCopy[leadingAspect.transitBody]}. ${aspectAdvice.explanation}`,
      favorableFocus: aspectAdvice.favorableFocus,
      gentleCaution: aspectAdvice.gentleCaution,
      reflection: `${aspectAdvice.question} today?`,
      factorSummary: `${leadingAspect.transitBody} ${leadingAspect.aspect} natal ${leadingAspect.natalBody} · within ${leadingAspect.maxOrb.toFixed(1)}°`,
    };
  }

  const natalSun = natalPlacements.find((placement) => placement.body === Body.Sun);
  const anchor = natalSun ?? natalPlacements[0];
  return {
    label: 'TODAY’S REFLECTION',
    title: 'Begin with what you know.',
    body: `Your ${anchor.sign} ${anchor.body.toLowerCase()} themes offer a starting point for noticing what feels familiar. You still choose the direction.`,
    favorableFocus: 'A familiar skill may help you finish one practical task.',
    gentleCaution: 'You do not need a complete plan before taking a first look.',
    reflection: 'Which part of my routine would I like to change a little?',
    factorSummary: `${anchor.sign} ${anchor.body} · no close major transit`,
  };
}

function localDateLabel(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone,
  }).format(date);
}

export function calculateDailyAstrology(profile: UserProfile, now = new Date()): DailyAstrology {
  try {
    const precision = getChartPrecision(profile);
    const preciseBirthMoment = precision.mayUseTimeSensitiveInterpretations;
    const birthInstant = preciseBirthMoment
      ? localBirthTimeToUtc(
          profile.birthDate,
          profile.birthTime.status === 'known' ? profile.birthTime.localTime : '',
          profile.birthPlace.timeZone,
        )
      : null;

    if (preciseBirthMoment && !birthInstant) {
      return {
        status: 'unavailable',
        message: 'This birth time falls in an ambiguous or skipped local clock hour. Verify the time and birth city before using a timed chart.',
      };
    }

    // The current residence sets the local daily date when provided; otherwise
    // the saved birthplace supplies a reliable time zone so daily guidance works
    // for users who have not chosen a residence.
    const dailyLocation = profile.currentResidence ?? profile.birthPlace;

    const natalPlacements = getNatalPlacements(profile, preciseBirthMoment, birthInstant);
    if (natalPlacements.length === 0) {
      return {
        status: 'unavailable',
        message: 'No planetary signs stayed consistent across the profile’s supported birth-time range.',
      };
    }

    const longitudeCache = new Map<string, number>();
    const longitudeAt: LongitudeAt = (body, date) => {
      const key = `${body}:${date.getTime()}`;
      const cached = longitudeCache.get(key);
      if (cached !== undefined) return cached;
      const longitude = normalizeLongitude(geocentricEclipticLongitude(body, date));
      longitudeCache.set(key, longitude);
      return longitude;
    };
    const halfDayMs = 12 * 60 * 60 * 1000;
    const transitPositions: TransitPosition[] = PLANETS.map((body) => {
      const longitude = longitudeAt(body, now);
      const longitudeBefore = longitudeAt(body, new Date(now.getTime() - halfDayMs));
      const longitudeAfter = longitudeAt(body, new Date(now.getTime() + halfDayMs));
      const speedDegreesPerDay = normalizeLongitude(
        longitudeAfter - longitudeBefore + 180,
      ) - 180;
      return {
        body,
        longitude,
        speedDegreesPerDay,
        sign: signForLongitude(longitude),
      };
    });
    const transits = transitPositions.map(({ body, longitude, sign }) => ({
      body,
      longitude,
      sign,
    }));
    const analyzedAspects = getTransitAspects(
      natalPlacements,
      transitPositions,
      now,
      longitudeAt,
      preciseBirthMoment,
    );
    const transitAnalysis = createTransitAnalysis(analyzedAspects, preciseBirthMoment);
    // Keep the existing four-aspect input and closest-orb ordering for current
    // screen copy and crystal scoring. The full analysis is available separately.
    const aspects = analyzedAspects.slice(0, 4).map(toLegacyTransitAspect);

    return {
      status: 'calculated',
      reading: makeCalculatedReading(natalPlacements, aspects),
      natalPlacements,
      transits,
      aspects,
      transitAnalysis,
      preciseBirthMoment,
      calculationDate: localDateLabel(now, dailyLocation.timeZone),
      sourceLabel: `${EPHEMERIS_SOURCE.name} · geocentric tropical positions · ${EPHEMERIS_SOURCE.models} · documented ±1 arcminute · ${EPHEMERIS_SOURCE.url}`,
    };
  } catch {
    return {
      status: 'unavailable',
      message: 'The chart could not be calculated with the saved profile details. The sample content below is not chart-based.',
    };
  }
}

export {
  getCrystalRecommendation,
  getCrystalSuggestions,
  getIntentionRecommendation,
  getNatalCrystalSuggestions,
} from './crystal-guidance';

export function getSampleCrystal(): Crystal {
  return samplePrimaryCrystal;
}

export function getSampleAlternatives(): Crystal[] {
  return alternativeCrystals;
}

export function getHomeLocalDate(date: Date, location: HomeLocation): string {
  const parts = getLocalDateParts(date, location.timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}
