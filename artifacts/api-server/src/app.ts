import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { profileRateLimit, configuredOrigins } from "./middlewares/security";
import { postgresCalculationRateLimit } from "./middlewares/postgres-calculation-limit";
import { sharedCalculationRateLimit, type CalculationRateLimitStore } from "./middlewares/shared-calculation-limit";

export function createApp(options: {
  allowedOrigins?: readonly string[];
  profileRateLimit?: number;
  calculationRateLimitStore?: CalculationRateLimitStore;
} = {}): Express {
const app = express();
app.disable("x-powered-by");
// Do not trust caller-supplied forwarded headers for authorization or rate limits.
app.set("trust proxy", false);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const allowedOrigins = new Set(options.allowedOrigins ?? configuredOrigins());
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const origin = req.get("origin");
  if (origin && !allowedOrigins.has(origin)) {
    res.status(403).json({ error: "Browser origin is not allowed." });
    return;
  }
  next();
});
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)), methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], credentials: false }));
app.use(profileRateLimit(options.profileRateLimit));
app.use(sharedCalculationRateLimit(options.calculationRateLimitStore ?? postgresCalculationRateLimit()));
app.use("/api", (req, res, next) => {
  if (["POST", "PUT"].includes(req.method) && !req.is("application/json")) {
    res.status(415).json({ error: "Calculation requests must use application/json." });
    return;
  }
  next();
});
app.use(express.json({ limit: "16kb", strict: true, inflate: false }));

app.use("/api", router);
app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found." }));
const errors: ErrorRequestHandler = (error, _req, res, _next) => {
  const status = error?.status === 413 ? 413 : error?.status === 415 ? 415 : error?.status === 400 ? 400 : 500;
  res.status(status).json({ error: status === 413 ? "Request body is too large."
    : status === 415 ? "Compressed request bodies are not supported."
    : status === 400 ? "Request body must be valid JSON." : "The request could not be processed." });
};
app.use(errors);
return app;
}

export default createApp();
