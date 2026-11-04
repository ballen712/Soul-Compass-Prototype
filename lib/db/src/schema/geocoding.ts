import { date, jsonb, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

// Operational rate counters only. No city queries, profiles, raw IPs or credentials.
export const geoapifyQuotaState = pgTable("geoapify_quota_state", {
  bucket: text("bucket").primaryKey(),
  value: jsonb("value").notNull(),
});
export const geoapifyQuotaSources = pgTable("geoapify_quota_sources", {
  utcDay: date("utc_day", { mode: "string" }).notNull(),
  sourceHash: text("source_hash").notNull(),
  value: jsonb("value").notNull(),
}, table => [primaryKey({ columns: [table.utcDay, table.sourceHash] })]);
