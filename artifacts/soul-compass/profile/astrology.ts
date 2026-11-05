import { Body, Ecliptic, GeoVector } from 'astronomy-engine';
import type { Crystal } from '@/constants/content';
import {
  alternativeCrystals,
  samplePrimaryCrystal,
} from '../constants/content';
import type { HomeLocation, UserProfile } from './profile';
import { getChartPrecision } from './profile';

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

type Planet = (typeof PLANETS)[number];
type AspectName = (typeof MAJOR_ASPECTS)[number]['name'];

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

export type CalculatedReading = {
  label: string;
  title: string;
  body: string;
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
      preciseBirthMoment: boolean;
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

function angularSeparation(first: number, second: number): number {
  const difference = Math.abs(normalizeLongitude(first - second));
  return Math.min(difference, 360 - difference);
}

function getTransitAspects(
  natalPlacements: NatalPlacement[],
  transits: { body: Planet; longitude: number; sign: (typeof ZODIAC_SIGNS)[number] }[],
): TransitAspect[] {
  const candidates: TransitAspect[] = [];
  for (const transit of transits) {
    for (const natal of natalPlacements) {
      const matches = MAJOR_ASPECTS.map((aspect) => ({
        aspect,
        maxOrb: Math.max(
          ...natal.possibleLongitudes.map((longitude) =>
            Math.abs(angularSeparation(transit.longitude, longitude) - aspect.angle),
          ),
        ),
      }))
        .filter((match) => match.maxOrb <= 3)
        .sort((first, second) => first.maxOrb - second.maxOrb);
      const closest = matches[0];
      if (!closest) continue;
      candidates.push({
        transitBody: transit.body,
        transitSign: transit.sign,
        natalBody: natal.body,
        natalSign: natal.sign,
        aspect: closest.aspect.name,
        quality: closest.aspect.quality,
        maxOrb: closest.maxOrb,
      });
    }
  }
  return candidates.sort((first, second) => first.maxOrb - second.maxOrb).slice(0, 4);
}

function makeCalculatedReading(
  natalPlacements: NatalPlacement[],
  aspects: TransitAspect[],
): CalculatedReading {
  const leadingAspect = aspects[0];
  if (leadingAspect) {
    const transitTheme: Record<Planet, string> = {
      Sun: 'confidence and direction',
      Moon: 'feelings and daily needs',
      Mercury: 'conversation and attention',
      Venus: 'connection and values',
      Mars: 'energy and initiative',
      Jupiter: 'growth and perspective',
      Saturn: 'commitment and structure',
      Uranus: 'change and independence',
      Neptune: 'imagination and uncertainty',
      Pluto: 'deep change and boundaries',
    };
    const aspectAdvice = {
      conjunction: { title: 'Bring one strong theme into focus.', action: 'Choose one small action instead of trying to do everything at once', question: 'Where would a deliberate focus help' },
      sextile: { title: 'Notice a small opening.', action: 'Try a manageable step toward something you value', question: 'What small opportunity can I act on' },
      square: { title: 'Make room for a different response.', action: 'Pause, name what feels difficult and adjust one expectation', question: 'What can I change about my response' },
      trine: { title: 'Use what feels naturally available.', action: 'Use a familiar strength to support one practical task', question: 'Which existing strength can support me' },
      opposition: { title: 'Consider both sides before deciding.', action: 'Listen to a different viewpoint before making a commitment', question: 'What other perspective deserves room' },
    }[leadingAspect.aspect];
    return {
      label: 'TODAY’S REFLECTION',
      title: aspectAdvice.title,
      body: `Notice ${transitTheme[leadingAspect.transitBody]} today; ${aspectAdvice.action.charAt(0).toLowerCase()}${aspectAdvice.action.slice(1)}.`,
      reflection: `${aspectAdvice.question} today?`,
      factorSummary: `${leadingAspect.transitBody} ${leadingAspect.aspect} natal ${leadingAspect.natalBody} · within ${leadingAspect.maxOrb.toFixed(1)}°`,
    };
  }

  const natalSun = natalPlacements.find((placement) => placement.body === Body.Sun);
  const anchor = natalSun ?? natalPlacements[0];
  return {
    label: 'TODAY’S REFLECTION',
    title: 'Return to a steady point.',
    body: `Your ${anchor.sign} ${anchor.body.toLowerCase()} quality can be a guide today; let it support one choice at your own pace.`,
    reflection: `Where could your ${anchor.sign} ${anchor.body.toLowerCase()} nature support you today?`,
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

    if (!profile.currentResidence) {
      return {
        status: 'unavailable',
        message: 'Set your current residence in Settings to anchor daily readings to your local date. Your birth city is not used as a substitute.',
      };
    }

    const natalPlacements = getNatalPlacements(profile, preciseBirthMoment, birthInstant);
    if (natalPlacements.length === 0) {
      return {
        status: 'unavailable',
        message: 'No planetary signs stayed consistent across the profile’s supported birth-time range.',
      };
    }

    const transits = PLANETS.map((body) => {
      const longitude = normalizeLongitude(geocentricEclipticLongitude(body, now));
      return { body, longitude, sign: signForLongitude(longitude) };
    });
    const aspects = getTransitAspects(natalPlacements, transits);

    return {
      status: 'calculated',
      reading: makeCalculatedReading(natalPlacements, aspects),
      natalPlacements,
      transits,
      aspects,
      preciseBirthMoment,
      calculationDate: localDateLabel(now, profile.currentResidence.timeZone),
      sourceLabel: `${EPHEMERIS_SOURCE.name} · geocentric tropical positions · ${EPHEMERIS_SOURCE.models} · documented ±1 arcminute · ${EPHEMERIS_SOURCE.url}`,
    };
  } catch {
    return {
      status: 'unavailable',
      message: 'The chart could not be calculated with the saved profile details. The sample content below is not chart-based.',
    };
  }
}

export { getCrystalRecommendation, getIntentionRecommendation } from './crystal-guidance';

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
