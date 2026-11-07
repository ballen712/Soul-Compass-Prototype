import type { RequestHandler } from "express";
import { logger } from "../lib/logger";

export type CalculationRateDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export type CalculationRateLimitStore = {
  reserve(): Promise<CalculationRateDecision>;
};

const calculationPaths = new Set(["/api/astrology/positions", "/api/astrology/natal-chart"]);

export function sharedCalculationRateLimit(store: CalculationRateLimitStore): RequestHandler {
  return (req, res, next) => {
    if (req.method !== "POST" || !calculationPaths.has(req.path)) {
      next();
      return;
    }
    void store.reserve().then(decision => {
      if (!decision.allowed) {
        res.setHeader("Retry-After", String(Math.max(1, Math.ceil(decision.retryAfterSeconds))));
        res.status(429).json({ error: "Calculation capacity reached. Please try again later." });
        return;
      }
      next();
    }).catch(() => {
      logger.error({ event: "shared_calculation_limit_unavailable" }, "Shared calculation protection unavailable");
      res.status(503).json({ error: "Calculation service is temporarily unavailable. Please try again later." });
    });
  };
}
