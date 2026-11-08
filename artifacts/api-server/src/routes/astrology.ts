import { Router, type IRouter } from "express";
import { calculatePlanetaryPositions } from "../astrology/ephemeris";
import { calculateNatalChart } from "../astrology/natal";
import { validateNatalChartConsent } from "../astrology/consent";

export function createAstrologyRouter(
  calculateChart: typeof calculateNatalChart = calculateNatalChart,
): IRouter {
const router: IRouter = Router();

router.get("/astrology/health", (_req, res) => {
  if (process.env.REPLIT_DEPLOYMENT === "1" || process.env.NODE_ENV === "production") {
    res.json({ status: "ok" });
    return;
  }

  res.json({
    status: "ok",
    provider: "astronomy-engine",
    providerVersion: "2.1.19",
    calculationsAvailable: true,
  });
});

router.post("/astrology/positions", (req, res) => {
  const atUtc = req.body?.atUtc;
  if (typeof atUtc !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(atUtc)) {
    res.status(400).json({ error: "atUtc must be an ISO 8601 timestamp ending in Z." });
    return;
  }
  const at = new Date(atUtc);
  if (!Number.isFinite(at.getTime()) || at.toISOString().slice(0, 19) !== atUtc.slice(0, 19)) {
    res.status(400).json({ error: "atUtc is not a valid timestamp." });
    return;
  }
  try {
    res.json({
      input: { atUtc: at.toISOString() },
      metadata: {
        provider: "astronomy-engine",
        providerVersion: "2.1.19",
        zodiac: "tropical",
        coordinateSystem: "geocentric apparent ecliptic of date",
        externalEphemerisFile: null,
      },
      positions: calculatePlanetaryPositions(at),
    });
  } catch {
    res.status(422).json({ error: "The astronomy provider could not calculate that date." });
  }
});

router.post("/astrology/natal-chart", (req, res) => {
  const consent = validateNatalChartConsent(req.body);
  if (!consent.accepted) {
    res.status(400).json({ code: consent.code, error: consent.error });
    return;
  }
  const body = req.body;
  if (!body || typeof body !== "object"
    || Array.isArray(body) || typeof body.birthDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.birthDate)
    || !body.birthTime || !["known", "unknown"].includes(body.birthTime.status)
    || !body.birthPlace || typeof body.birthPlace !== "object"
    || typeof body.birthPlace.latitude !== "number" || typeof body.birthPlace.longitude !== "number"
    || typeof body.birthPlace.timeZone !== "string" || body.birthPlace.timeZone.length > 100) {
    res.status(400).json({ error: "Birth date, birth-time status, birthplace coordinates, and IANA time zone are required." });
    return;
  }
  if (body.houseSystem !== undefined && body.houseSystem !== "placidus") {
    res.status(400).json({ error: "Only the Placidus house system is currently supported; no substitute is applied." });
    return;
  }
  if (body.zodiac !== undefined && body.zodiac !== "tropical") {
    res.status(400).json({ error: "Only the tropical zodiac is currently supported." });
    return;
  }
  if (body.birthTime.status === "known" && (typeof body.birthTime.localTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.birthTime.localTime))) {
    res.status(400).json({ error: "Known birth time requires localTime in HH:mm format." });
    return;
  }
  if (body.orbs !== undefined && (!body.orbs || typeof body.orbs !== "object" || Array.isArray(body.orbs)
    || ![body.orbs.luminary, body.orbs.other].every((orb) => typeof orb === "number" && Number.isFinite(orb) && orb > 0 && orb <= 15))) {
    res.status(400).json({ error: "Aspect orbs must be numeric, greater than zero and at most 15 degrees." });
    return;
  }
  if (body.birthTime.disambiguation !== undefined && !["earlier", "later"].includes(body.birthTime.disambiguation)) {
    res.status(400).json({ error: "Birth-time disambiguation must be earlier or later." });
    return;
  }
  try {
    const chart = calculateChart({
      birthDate: body.birthDate,
      birthTime: body.birthTime.status === "unknown" ? { status: "unknown" } : {
        status: "known", localTime: body.birthTime.localTime, disambiguation: body.birthTime.disambiguation,
      },
      birthPlace: { latitude: body.birthPlace.latitude, longitude: body.birthPlace.longitude, timeZone: body.birthPlace.timeZone },
      houseSystem: body.houseSystem ?? "placidus",
      orbs: body.orbs ? { luminary: body.orbs.luminary, other: body.orbs.other } : undefined,
    });
    res.json(chart);
  } catch (error) {
    if (error instanceof Error && /occurred twice/i.test(error.message)) {
      res.status(422).json({
        code: "BIRTH_TIME_AMBIGUOUS",
        error: "That local birth time occurred twice. Choose earlier or later occurrence.",
      });
      return;
    }
    res.status(422).json({ error: "The chart could not be calculated." });
  }
});

return router;
}

const router = createAstrologyRouter();
export default router;
