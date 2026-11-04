import { Router } from "express";
import { CitySearchError, createCitySearch } from "../geocoding/geoapify";

export function createGeocodingRouter(search = createCitySearch()) {
  const router = Router();
  const peers = new Map<string, { count: number; expires: number }>();
  router.get("/cities", async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (Object.keys(req.query).length !== 1 || q.length < 2 || q.length > 100 || /[\u0000-\u001f\u007f]/u.test(q)) {
      res.status(400).json({ error: "Enter a city name between 2 and 100 characters." });
      return;
    }
    const now = Date.now();
    for (const [key, value] of peers) if (value.expires <= now) peers.delete(key);
    // As with calculation limits, never trust spoofable forwarded client-IP headers.
    const peer = req.socket.remoteAddress ?? "unknown";
    let bucket = peers.get(peer);
    if (!bucket) {
      if (peers.size >= 10_000) {
        res.setHeader("Retry-After", "60");
        res.status(429).json({ error: "City search is busy. Please try again later." }); return;
      }
      bucket = { count: 0, expires: now + 60_000 }; peers.set(peer, bucket);
    }
    if (++bucket.count > 20) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((bucket.expires - now) / 1000))));
      res.status(429).json({ error: "Too many city searches. Please wait a minute." }); return;
    }
    try { res.json({ results: await search(q, peer) }); }
    catch (error) {
      const safe = error instanceof CitySearchError ? error
        : new CitySearchError(502, "City search is temporarily unavailable.");
      if (safe.status === 429) res.setHeader("Retry-After", String(safe.retryAfter));
      res.status(safe.status).json({ error: safe.message });
    }
  });
  return router;
}
