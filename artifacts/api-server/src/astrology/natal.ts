import {
  angularSeparation,
  calculateMajorAspects,
  calculatePlanetaryPositions,
  astronomyEngineProvider,
  earthOrientation,
  normalizeLongitude,
  type PlanetaryPosition,
} from "./ephemeris";

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string) {
  let result = dateTimeFormatCache.get(timeZone);
  if (!result) {
    result = new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    });
    dateTimeFormatCache.set(timeZone, result);
  }
  return result;
}

function localParts(date: Date, timeZone: string) {
  const parts = Object.fromEntries(formatter(timeZone).formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second),
  };
}

function sameLocal(parts: ReturnType<typeof localParts>, target: {year:number;month:number;day:number;hour:number;minute:number}) {
  return parts.year === target.year && parts.month === target.month && parts.day === target.day
    && parts.hour === target.hour && parts.minute === target.minute && parts.second === 0;
}

export type LocalTimeResolution =
  | { status: "unique"; instant: Date }
  | { status: "ambiguous"; candidates: Date[] }
  | { status: "nonexistent"; candidates: [] };

/** Resolve local wall-clock time by testing historical offsets observed around that date. */
export function resolveLocalBirthTime(date: string, time: string, timeZone: string): LocalTimeResolution {
  const matchDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const matchTime = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!matchDate || !matchTime) throw new Error("Birth date and time must use YYYY-MM-DD and HH:mm.");
  formatter(timeZone); // Throws for an invalid IANA time zone.
  const target = {
    year: Number(matchDate[1]), month: Number(matchDate[2]), day: Number(matchDate[3]),
    hour: Number(matchTime[1]), minute: Number(matchTime[2]),
  };
  const localAsUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);
  const check = new Date(Date.UTC(target.year, target.month - 1, target.day));
  if (check.getUTCFullYear() !== target.year || check.getUTCMonth() + 1 !== target.month || check.getUTCDate() !== target.day) {
    throw new Error("Birth date is not a valid calendar date.");
  }
  const offsets = new Set<number>();
  for (let hour = -48; hour <= 48; hour += 3) {
    const sample = new Date(localAsUtc + hour * 3600_000);
    const p = localParts(sample, timeZone);
    offsets.add(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - sample.getTime());
  }
  const candidates = [...offsets]
    .map((offset) => new Date(localAsUtc - offset))
    .filter((instant) => sameLocal(localParts(instant, timeZone), target))
    .sort((a, b) => a.getTime() - b.getTime());
  if (!candidates.length) return { status: "nonexistent", candidates: [] };
  if (candidates.length > 1) return { status: "ambiguous", candidates };
  return { status: "unique", instant: candidates[0] };
}

export function localDateBounds(date: string, timeZone: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error("Date must use YYYY-MM-DD.");
  const year = Number(m[1]), month = Number(m[2]), day = Number(m[3]);
  resolveLocalBirthTime(date, "12:00", timeZone); // Validate calendar date and zone.
  const boundary = (target: string, anchor: number) => {
    let low = anchor - 48 * 3600_000, high = anchor + 48 * 3600_000;
    const localDate = (value: number) => {
      const p = localParts(new Date(value), timeZone);
      return `${p.year.toString().padStart(4,"0")}-${p.month.toString().padStart(2,"0")}-${p.day.toString().padStart(2,"0")}`;
    };
    while (high - low > 1) {
      const mid = Math.floor((low + high) / 2);
      if (localDate(mid) >= target) high = mid; else low = mid;
    }
    return { instant: new Date(high), date: localDate(high) };
  };
  const startResult = boundary(date, Date.UTC(year, month - 1, day));
  if (startResult.date !== date) throw new Error("This local calendar date was skipped in this time zone.");
  const start = startResult.instant;
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const nextDate = `${next.getUTCFullYear().toString().padStart(4, "0")}-${(next.getUTCMonth()+1).toString().padStart(2,"0")}-${next.getUTCDate().toString().padStart(2,"0")}`;
  const end = boundary(nextDate, next.getTime()).instant;
  if (end <= start) throw new Error("Local date has no representable duration in this time zone.");
  return { start, end, durationHours: (end.getTime() - start.getTime()) / 3_600_000 };
}

function wrapSigned(degrees: number) {
  return ((degrees + 180) % 360 + 360) % 360 - 180;
}


function equatorial(longitude: number, obliquity: number) {
  const l = longitude * RAD, e = obliquity * RAD;
  const ra = normalizeLongitude(Math.atan2(Math.sin(l) * Math.cos(e), Math.cos(l)) * DEG);
  const dec = Math.asin(Math.sin(l) * Math.sin(e)) * DEG;
  return { ra, dec };
}

function hourAngle(longitude: number, sidereal: number, obliquity: number) {
  return wrapSigned(sidereal - equatorial(longitude, obliquity).ra);
}

function altitude(longitude: number, sidereal: number, latitude: number, obliquity: number) {
  const { dec } = equatorial(longitude, obliquity);
  const h = hourAngle(longitude, sidereal, obliquity) * RAD;
  return Math.asin(Math.sin(latitude * RAD) * Math.sin(dec * RAD)
    + Math.cos(latitude * RAD) * Math.cos(dec * RAD) * Math.cos(h)) * DEG;
}

function solveRoot(fn: (x: number) => number, low: number, high: number) {
  let fLow = fn(low), fHigh = fn(high);
  if (!Number.isFinite(fLow) || !Number.isFinite(fHigh) || fLow * fHigh > 0) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2, fMid = fn(mid);
    if (Math.abs(fMid) < 1e-10) return normalizeLongitude(mid);
    if (fLow * fMid <= 0) { high = mid; fHigh = fMid; }
    else { low = mid; fLow = fMid; }
  }
  return normalizeLongitude((low + high) / 2);
}

function findRoots(fn: (x: number) => number) {
  const roots: number[] = [];
  let x0 = 0, f0 = fn(0);
  for (let x = 1; x <= 360; x++) {
    const f1 = fn(x);
    if (Number.isFinite(f0) && Number.isFinite(f1) && f0 * f1 <= 0) {
      const root = solveRoot(fn, x0, x);
      if (root !== null && Math.abs(fn(root)) < 1e-6
        && !roots.some((r) => angularSeparation(r, root) < 1e-5)) roots.push(root);
    }
    x0 = x; f0 = f1;
  }
  return roots;
}

function placidusSemiarc(longitude: number, latitude: number, obliquity: number) {
  const { dec } = equatorial(longitude, obliquity);
  const argument = -Math.tan(latitude * RAD) * Math.tan(dec * RAD);
  if (argument < -1 || argument > 1) return null;
  return Math.acos(argument) * DEG;
}

function cuspAtPlacidusFraction(fraction: number, sidereal: number, latitude: number, obliquity: number) {
  const fn = (longitude: number) => {
    const semi = placidusSemiarc(longitude, latitude, obliquity);
    if (semi === null) return Number.NaN;
    const targetHourAngle = fraction <= 1
      ? semi * fraction
      : semi + (180 - semi) * (fraction - 1);
    return wrapSigned(hourAngle(longitude, sidereal, obliquity) + targetHourAngle);
  };
  const roots = findRoots(fn);
  if (roots.length !== 1) throw new Error(`Placidus cusp fraction ${fraction} is not uniquely defined at this latitude and time (${roots.length} roots).`);
  return roots[0];
}

export type NatalChartInput = {
  birthDate: string;
  birthTime: { status: "known"; localTime: string; disambiguation?: "earlier" | "later" } | { status: "unknown" };
  birthPlace: { latitude: number; longitude: number; timeZone: string };
  houseSystem?: "placidus";
  orbs?: { luminary: number; other: number };
};

export function calculateNatalAspects(planets: readonly PlanetaryPosition[], orbs = { luminary: 8, other: 6 }) {
  if (![orbs.luminary, orbs.other].every((orb) => Number.isFinite(orb) && orb > 0 && orb <= 15)) throw new Error("Aspect orbs must be greater than zero and at most 15 degrees.");
  return calculateMajorAspects(planets, orbs).map((aspect) => {
    const a = planets.find((p) => p.planet === aspect.first)!;
    const b = planets.find((p) => p.planet === aspect.second)!;
    const relativeSpeed = Math.sign(wrapSigned(b.longitude - a.longitude)) * (b.speedDegreesPerDay - a.speedDegreesPerDay);
    const signedError = aspect.separation - aspect.angle;
    const orbLimit = a.planet === "Sun" || a.planet === "Moon" || b.planet === "Sun" || b.planet === "Moon" ? orbs.luminary : orbs.other;
    return {
      ...aspect,
      applying: aspect.orb < 1e-8 || Math.abs(relativeSpeed) < 1e-10 ? null : signedError * relativeSpeed < 0,
      strength: Math.max(0, 1 - aspect.orb / orbLimit),
      exact: aspect.orb <= 1,
    };
  });
}

export function houseForLongitude(longitude: number, cusps: readonly number[]) {
  if (cusps.length !== 12) throw new Error("Twelve house cusps are required.");
  for (let i = 0; i < 12; i++) {
    const distance = normalizeLongitude(longitude - cusps[i]);
    if (distance < normalizeLongitude(cusps[(i + 1) % 12] - cusps[i])) return i + 1;
  }
  throw new Error("House cusps do not form a complete zodiac circle.");
}

export function calculateNatalChart(input: NatalChartInput) {
  const { latitude, longitude, timeZone } = input.birthPlace;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error("Birthplace latitude must be between -90 and 90.");
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("Birthplace longitude must be between -180 and 180.");
  formatter(timeZone);

  let instant: Date;
  let birthTimeResolution: "known" | "unknown-reference-local-noon";
  let warnings: string[] = [];
  let moonSignRange: string[] = [];
  if (input.birthTime.status === "known") {
    const resolution = resolveLocalBirthTime(input.birthDate, input.birthTime.localTime, timeZone);
    if (resolution.status === "nonexistent") throw new Error("That local birth time did not occur because clocks moved forward.");
    if (resolution.status === "ambiguous" && !input.birthTime.disambiguation) throw new Error(`That local birth time occurred twice. Choose earlier or later occurrence: ${resolution.candidates.map((d) => d.toISOString()).join(", ")}.`);
    instant = resolution.status === "unique" ? resolution.instant
      : resolution.candidates[input.birthTime.disambiguation === "later" ? resolution.candidates.length - 1 : 0];
    if (resolution.status === "ambiguous") warnings.push(`Repeated local time: the ${input.birthTime.disambiguation} occurrence was explicitly selected.`);
    birthTimeResolution = "known";
  } else {
    const noon = resolveLocalBirthTime(input.birthDate, "12:00", timeZone);
    if (noon.status !== "unique") throw new Error("Unable to resolve local noon for unknown-time reference chart.");
    instant = noon.instant;
    birthTimeResolution = "unknown-reference-local-noon";
    warnings.push("Birth time is unknown; local noon is used only as a reference instant. Angles and houses are omitted.");
    const bounds = localDateBounds(input.birthDate, timeZone);
    const step = 30 * 60_000;
    const signs = new Set<string>();
    for (let t = bounds.start.getTime(); t < bounds.end.getTime(); t += step) {
      signs.add(astronomyEngineProvider.position("Moon", new Date(t)).sign);
    }
    signs.add(astronomyEngineProvider.position("Moon", new Date(bounds.end.getTime() - 1)).sign);
    moonSignRange = [...signs];
    if (moonSignRange.length > 1) warnings.push(`The Moon changes sign during this local birth day; possible signs: ${moonSignRange.join(", ")}.`);
    warnings.push("All placements and aspects represent the reference instant; their exact degrees and motion are time-dependent.");
  }

  const planets = calculatePlanetaryPositions(instant);
  const aspects = calculateNatalAspects(planets, input.orbs);

  let angles: Record<string, number> | null = null;
  let houseCusps: { house: number; longitude: number }[] = [];
  let planetaryHouses: { planet: string; house: number; cuspDistanceDegrees: number }[] = [];
  if (input.birthTime.status === "known") {
    try {
    const orientation = earthOrientation(instant);
    const obliquity = orientation.obliquityDegrees;
    const sidereal = normalizeLongitude(orientation.siderealDegrees + longitude);
    const ascRoots = findRoots((l) => altitude(l, sidereal, latitude, obliquity));
    const asc = ascRoots.find((l) => hourAngle(l, sidereal, obliquity) < 0);
    if (asc === undefined) throw new Error("The Ascendant could not be resolved for this location.");
    const mcRa = sidereal * RAD, e = obliquity * RAD;
    const mc = normalizeLongitude(Math.atan2(Math.sin(mcRa), Math.cos(mcRa) * Math.cos(e)) * DEG);
    const cusps: number[] = Array(13).fill(0);
    cusps[1] = asc; cusps[4] = normalizeLongitude(mc + 180); cusps[7] = normalizeLongitude(asc + 180); cusps[10] = mc;
    angles = { ascendant: asc, descendant: cusps[7], midheaven: mc, imumCoeli: cusps[4] };
    try {
    if (Math.abs(latitude) >= 90 - obliquity) throw new Error("Placidus houses are unavailable inside the polar circles; no alternate house system was substituted.");
    cusps[11] = cuspAtPlacidusFraction(1 / 3, sidereal, latitude, obliquity);
    cusps[12] = cuspAtPlacidusFraction(2 / 3, sidereal, latitude, obliquity);
    cusps[2] = cuspAtPlacidusFraction(4 / 3, sidereal, latitude, obliquity);
    cusps[3] = cuspAtPlacidusFraction(5 / 3, sidereal, latitude, obliquity);
    cusps[8] = normalizeLongitude(cusps[2] + 180); cusps[9] = normalizeLongitude(cusps[3] + 180);
    cusps[5] = normalizeLongitude(cusps[11] + 180); cusps[6] = normalizeLongitude(cusps[12] + 180);
    houseCusps = cusps.slice(1).map((value, index) => ({ house: index + 1, longitude: value }));
    const ordered = houseCusps.map((c) => c.longitude);
    planetaryHouses = planets.map((planet) => {
      const house = houseForLongitude(planet.longitude, ordered);
      const cuspDistanceDegrees = Math.min(...ordered.map((c) => angularSeparation(c, planet.longitude)));
      return { planet: planet.planet, house, cuspDistanceDegrees };
    });
    if (latitude > 66 || latitude < -66) warnings.push("High latitude: Placidus house cusps are especially sensitive to polar geometry.");
    } catch (error) {
      houseCusps = []; planetaryHouses = [];
      warnings.push(error instanceof Error ? error.message : "Placidus houses could not be calculated; no substitute was used.");
    }
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : "Angles are unavailable at this location.");
    }
  }
  return {
    input: { birthDate: input.birthDate, birthTime: input.birthTime, birthPlace: input.birthPlace },
    calculation: {
      instantUtc: instant.toISOString(), birthTimeResolution,
      zodiac: "tropical", coordinateSystem: "geocentric apparent true ecliptic of date",
      houseSystem: input.birthTime.status === "known" ? "Placidus" : null,
      houseStatus: houseCusps.length ? "available" : input.birthTime.status === "known" ? "unavailable" : "unknown-birth-time",
      houseCuspBoundary: "Cusps are inclusive; a planet belongs to the house beginning at that cusp. Near-cusp distance is reported in degrees.",
      applyingRule: "Applying when the absolute aspect error is decreasing under current relative longitude speed; null when exact.",
      provider: "astronomy-engine", providerVersion: "2.1.19",
      timeZoneDatabase: `Node ICU ${process.versions.icu}; tzdata ${process.versions.tz ?? "host supplied"}`,
      angleConvention: "Apparent sidereal time and true obliquity of date; geodetic latitude and east-positive longitude; geometric horizon without refraction.",
      orbs: input.orbs ?? { luminary: 8, other: 6 },
      exactnessThresholdDegrees: 1,
    },
    planets, angles, houseCusps, planetaryHouses, aspects, moonSignRange, warnings,
  };
}
