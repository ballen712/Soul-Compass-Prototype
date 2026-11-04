import { createRequire } from "node:module";
import type * as AstronomyEngineTypes from "astronomy-engine";

const astronomy = createRequire(import.meta.url)("astronomy-engine") as typeof AstronomyEngineTypes;

export const PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
] as const;

export type PlanetId = (typeof PLANETS)[number];
export type ZodiacSign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
  | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export type PlanetaryPosition = {
  planet: PlanetId;
  longitude: number;
  latitude: number;
  sign: ZodiacSign;
  degreeInSign: number;
  speedDegreesPerDay: number;
  retrograde: boolean;
  atUtc: string;
};

export interface EphemerisProvider {
  readonly id: string;
  readonly version: string;
  position(planet: PlanetId, at: Date): PlanetaryPosition;
}

const SIGNS: readonly ZodiacSign[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export function normalizeLongitude(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function zodiacPlacement(longitude: number): Pick<PlanetaryPosition, "sign" | "degreeInSign"> {
  const normalized = normalizeLongitude(longitude);
  const index = Math.floor(normalized / 30);
  return { sign: SIGNS[index], degreeInSign: normalized - index * 30 };
}

function eclipticPosition(planet: PlanetId, at: Date) {
  const body = astronomy.Body[planet];
  const vector = astronomy.GeoVector(body, at, true);
  const ecliptic = astronomy.Ecliptic(vector);
  return { longitude: normalizeLongitude(ecliptic.elon), latitude: ecliptic.elat };
}

/**
 * Server-only adapter around Astronomy Engine. Positions are geocentric,
 * apparent, true ecliptic-of-date coordinates; speed is a centered numerical
 * derivative over a one-day interval.
 */
export const astronomyEngineProvider: EphemerisProvider = {
  id: "astronomy-engine",
  version: "2.1.19",
  position(planet, at) {
    if (!(at instanceof Date) || !Number.isFinite(at.getTime())) {
      throw new Error("A valid calculation date is required.");
    }
    const center = eclipticPosition(planet, at);
    const before = eclipticPosition(planet, new Date(at.getTime() - 12 * 60 * 60 * 1000));
    const after = eclipticPosition(planet, new Date(at.getTime() + 12 * 60 * 60 * 1000));
    const delta = normalizeLongitude(after.longitude - before.longitude + 180) - 180;
    return {
      planet,
      ...center,
      ...zodiacPlacement(center.longitude),
      speedDegreesPerDay: delta,
      retrograde: delta < 0,
      atUtc: at.toISOString(),
    };
  },
};

export function calculatePlanetaryPositions(at: Date, provider = astronomyEngineProvider) {
  return PLANETS.map((planet) => provider.position(planet, at));
}

export function earthOrientation(at: Date) {
  return {
    siderealDegrees: astronomy.SiderealTime(at) * 15,
    obliquityDegrees: astronomy.e_tilt(astronomy.MakeTime(at)).tobl,
  };
}

export type MajorAspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export function angularSeparation(a: number, b: number): number {
  const difference = Math.abs(normalizeLongitude(a) - normalizeLongitude(b));
  return Math.min(difference, 360 - difference);
}

export function calculateMajorAspects(
  positions: readonly Pick<PlanetaryPosition, "planet" | "longitude">[],
  orbs: { luminary: number; other: number } = { luminary: 8, other: 6 },
) {
  const aspectAngles: readonly [MajorAspectType, number][] = [
    ["conjunction", 0], ["sextile", 60], ["square", 90], ["trine", 120], ["opposition", 180],
  ];
  const aspects = [];
  for (let i = 0; i < positions.length; i += 1) {
    for (let j = i + 1; j < positions.length; j += 1) {
      const first = positions[i];
      const second = positions[j];
      const separation = angularSeparation(first.longitude, second.longitude);
      const orbLimit = first.planet === "Sun" || first.planet === "Moon"
        || second.planet === "Sun" || second.planet === "Moon"
        ? orbs.luminary : orbs.other;
      for (const [type, angle] of aspectAngles) {
        const orb = Math.abs(separation - angle);
        if (orb <= orbLimit) aspects.push({ first: first.planet, second: second.planet, type, angle, separation, orb });
      }
    }
  }
  return aspects;
}
