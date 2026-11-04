import { Router, type IRouter } from "express";
import { calculatePlanetaryPositions } from "../astrology/ephemeris";
import { calculateNatalChart } from "../astrology/natal";

const router: IRouter = Router();

router.get("/astrology/health", (_req, res) => {
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
  if (!Number.isFinite(at.getTime())) {
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
  const body = req.body;
  if (!body || typeof body !== "object"
    || typeof body.birthDate !== "string"
    || !body.birthTime || !["known", "unknown"].includes(body.birthTime.status)
    || !body.birthPlace || typeof body.birthPlace !== "object"
    || typeof body.birthPlace.latitude !== "number" || typeof body.birthPlace.longitude !== "number"
    || typeof body.birthPlace.timeZone !== "string") {
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
  if (body.birthTime.status === "known" && typeof body.birthTime.localTime !== "string") {
    res.status(400).json({ error: "Known birth time requires localTime in HH:mm format." });
    return;
  }
  try {
    const chart = calculateNatalChart({
      birthDate: body.birthDate,
      birthTime: body.birthTime,
      birthPlace: body.birthPlace,
      houseSystem: body.houseSystem ?? "placidus",
    });
    res.json(chart);
  } catch (error) {
    res.status(422).json({ error: error instanceof Error ? error.message : "Natal chart calculation failed." });
  }
});

export default router;
