import { pool } from "@workspace/db";
import { geocodingConfig } from "./config";
import { logger } from "../lib/logger";

// Private CLI only; uses the database of the current execution environment.
// Never run through a public route or export full rows/source digests.
try {
  const result = await pool.query(`SELECT
    (SELECT value FROM geoapify_quota_state WHERE bucket='geoapify') AS value,
    (clock_timestamp() AT TIME ZONE 'UTC')::date::text AS today`);
  const row = result.rows[0];
  const config = geocodingConfig();
  const used = row?.value?.day === row?.today ? Number(row.value.used) : 0;
  if (!Number.isSafeInteger(used) || used < 0) throw new Error("Invalid quota counter");
  const ceiling = row?.value?.day === row?.today
    ? Math.min(config.hardCeiling, row.value.budget) : config.hardCeiling;
  logger.info({ event: "geoapify_quota_status", utcDay: row?.today ?? new Date().toISOString().slice(0,10),
    used, remaining: Math.max(0,ceiling-used), warning: config.warning, critical: config.critical, ceiling,
    warningReached: row?.value?.day === row?.today && !!row?.value?.warned,
    criticalReached: row?.value?.day === row?.today && !!row?.value?.critical },
  "Private operational quota status");
} catch {
  logger.error({ event: "geoapify_quota_status_unavailable" }, "Quota status unavailable");
  process.exitCode = 1;
} finally { await pool.end(); }
