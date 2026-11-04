import { Router, type IRouter } from "express";
import { calculatePlanetaryPositions } from "../astrology/ephemeris";

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

export default router;
