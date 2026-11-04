import type { RequestHandler } from "express";

/** Bounded per-process limiter. Proxy peers deliberately share a bucket:
 * untrusted X-Forwarded-For must never let clients mint new identities. */
export function calculationRateLimit(maxRequests = 120, windowMs = 60_000): RequestHandler {
  const buckets = new Map<string, { count: number; expires: number }>();
  return (req, res, next) => {
    const calculation = req.method === "POST" && ["/api/astrology/positions", "/api/astrology/natal-chart"].includes(req.path);
    const privateRequest = req.path.startsWith("/api/me/") && req.method !== "OPTIONS";
    if (!calculation && !privateRequest) return next();
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.expires <= now) buckets.delete(key);
    const key = req.socket.remoteAddress ?? "unknown";
    let bucket = buckets.get(key);
    if (!bucket) {
      if (buckets.size >= 10_000) {
        res.setHeader("Retry-After", "60");
        res.status(429).json({ error: "Calculation capacity reached. Please try again later." });
        return;
      }
      bucket = { count: 0, expires: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count++;
    if (bucket.count > maxRequests) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((bucket.expires - now) / 1000))));
      res.status(429).json({ error: "Too many calculation requests. Please try again later." });
      return;
    }
    next();
  };
}

export function configuredOrigins(): string[] {
  const origins = (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",").filter(Boolean);
  for (const host of [
    process.env.REPLIT_DEV_DOMAIN,
    process.env.REPLIT_EXPO_DEV_DOMAIN,
    ...(process.env.REPLIT_DOMAINS ?? "").split(","),
  ]) if (host) origins.push(`https://${host}`);
  return origins.flatMap((value) => {
    try {
      const url = new URL(value.trim());
      return url.protocol === "https:" || url.protocol === "http:" ? [url.origin] : [];
    } catch { return []; }
  });
}
