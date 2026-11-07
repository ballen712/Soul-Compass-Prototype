import { createApp } from "../../src/app";
import { pool } from "@workspace/db";
import { postgresCalculationRateLimit } from "../../src/middlewares/postgres-calculation-limit";

const [bucket, rawLimit] = process.argv.slice(2);
if (!bucket || !rawLimit || !/^\d+$/.test(rawLimit)) throw new Error("Test limiter arguments are required.");
const app = createApp({
  calculationRateLimitStore: postgresCalculationRateLimit({
    bucket,
    maxRequestsPerMinute: Number(rawLimit),
  }),
});
const server = app.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (address && typeof address !== "string") process.send?.({ port: address.port });
});

process.on("SIGTERM", () => {
  server.closeAllConnections();
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});
