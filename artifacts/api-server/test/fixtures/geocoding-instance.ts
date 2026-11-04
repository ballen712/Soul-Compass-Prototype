import express from "express";
import { pool } from "@workspace/db";
import { geocodingConfig } from "../../src/geocoding/config";
import { postgresQuota } from "../../src/geocoding/postgres";
import { createCitySearch } from "../../src/geocoding/geoapify";
import { createGeocodingRouter } from "../../src/routes/geocoding";

const config = { ...geocodingConfig({}), hardCeiling: Number(process.argv[3] ?? 1),
  sourcePerDay: Number(process.argv[3] ?? 1), requestsPerSecond: Number(process.argv[4] ?? 3) };
const search = createCitySearch({
  // Distinct test-only keys produce distinct source digests, so the test proves
  // the global budget rather than accidentally stopping at a shared source cap.
  production: true, config, event: () => {}, getKey: () => `test-placeholder-${process.pid}`,
  store: postgresQuota(config, { bucket: process.argv[2] }),
  request: (async () => new Response(JSON.stringify({ results: [{
    city: "Budapest", country: "Hungary", lat: 47.4978789, lon: 19.0402383,
    timezone: { name: "Europe/Budapest" },
  }] }), { headers: { "content-type": "application/json" } })) as typeof fetch,
});
const server = express().use("/api/geocoding", createGeocodingRouter(search)).listen(0,"127.0.0.1", () => {
  const address = server.address();
  if (address && typeof address !== "string") process.send?.({ port: address.port });
});
process.on("SIGTERM", () => { server.closeAllConnections(); server.close(async () => {
  await pool.end(); process.exit(0);
}); });
