import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express from "express";
import { createProfileRouter } from "../src/profiles/router";
import type { ProfileRecord, ProfileService } from "../src/profiles/service";
import { CloudProfileSchema } from "@workspace/api-zod";

// Deliberately an in-memory contract double, NOT evidence that live RLS passed.
const tokens = { alice: "a".repeat(40), bob: "b".repeat(40), old: "c".repeat(40) };
const profile = {
  birthDate: "1991-06-20", birthTime: { status: "unknown" },
  birthPlace: { city: "Test City", country: "Test Country", latitude: 48.5, longitude: 32.2, timeZone: "Europe/Kyiv" },
  currentResidence: null,
};
const preferences = { language: "en", crystalCollection: [], crystalPreferences: { intentions: [], hiddenCrystals: [] } };
function fixture() {
  const records = new Map<string, ProfileRecord>();
  const deleted: string[] = [];
  const id = (token: string) => token === tokens.alice ? "alice" : token === tokens.bob ? "bob" : "old";
  const service: ProfileService = {
    async authenticate(token) { return Object.values(tokens).includes(token) ? { id: id(token), lastSignInAt: token === tokens.old ? "2000-01-01T00:00:00Z" : new Date().toISOString() } : null; },
    async read(_token, userId) { return records.get(userId) ?? null; },
    async create(token, value) { const userId = id(token); if (records.has(userId)) return null; const record = { ...value, version: 1 }; records.set(userId, record); return record; },
    async update(_token, userId, version, value) { if (records.get(userId)?.version !== version) return null; const record = { ...value, version: version + 1 }; records.set(userId, record); return record; },
    async removeProfile(_token, userId) { records.delete(userId); },
    async deleteAccount(userId) { deleted.push(userId); records.delete(userId); },
  };
  return { service, records, deleted };
}
async function run(fn: (request: (path: string, token?: string, method?: string, body?: unknown) => Promise<Response>, data: ReturnType<typeof fixture>) => Promise<void>) {
  const data = fixture(), app = express();
  app.use(express.json()); app.use("/me", createProfileRouter(data.service));
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/me`;
  try { await fn((path, token, method = "GET", body) => fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }), data); }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}
test("private API rejects absent, malformed, invalid and expired credentials", () => run(async request => {
  for (const token of [undefined, "short", "x".repeat(40)]) assert.equal((await request("/profile", token)).status, 401);
}));
test("two accounts on one client stay isolated; identity cannot be supplied in body", () => run(async (request, data) => {
  assert.equal((await request("/profile", tokens.alice, "POST", { profile, preferences, user_id: "bob" })).status, 400);
  assert.equal((await request("/profile", tokens.alice, "POST", { profile, preferences })).status, 201);
  assert.equal((await (await request("/profile", tokens.bob)).json()).record, null);
  assert.equal((await request("/profile", tokens.bob, "POST", { profile: { ...profile, birthDate: "2000-01-01" }, preferences })).status, 201);
  assert.equal((await (await request("/profile", tokens.alice)).json()).record.profile.birthDate, profile.birthDate);
  assert.equal(data.records.size, 2);
}));
test("migration retry is create-only and a duplicate cannot overwrite cloud data", () => run(async request => {
  const body = { profile, preferences };
  assert.equal((await request("/profile", tokens.alice, "POST", body)).status, 201);
  assert.equal((await request("/profile", tokens.alice, "POST", { ...body, profile: { ...profile, birthDate: "2000-01-01" } })).status, 409);
  assert.equal((await (await request("/profile", tokens.alice)).json()).record.version, 1);
}));
test("cross-device stale writes conflict, valid writes synchronize on subsequent read", () => run(async request => {
  await request("/profile", tokens.alice, "POST", { profile, preferences });
  const updated = { profile, preferences: { ...preferences, language: "hu", crystalCollection: ["amethyst"] }, expectedVersion: 1 };
  assert.equal((await request("/profile", tokens.alice, "PUT", updated)).status, 200);
  assert.equal((await request("/profile", tokens.alice, "PUT", updated)).status, 409);
  const read = await (await request("/profile", tokens.alice)).json();
  assert.equal(read.record.version, 2); assert.equal(read.record.preferences.language, "hu");
}));
test("strict server profile validation rejects impossible dates, coordinates, zones and unknown-time leakage", () => {
  assert.equal(CloudProfileSchema.safeParse(profile).success, true);
  for (const bad of [
    { ...profile, birthDate: "2025-02-30" },
    { ...profile, birthTime: { status: "unknown", localTime: "12:00" } },
    { ...profile, birthPlace: { ...profile.birthPlace, latitude: 91 } },
    { ...profile, birthPlace: { ...profile.birthPlace, timeZone: "../../etc/passwd" } },
  ]) assert.equal(CloudProfileSchema.safeParse(bad).success, false);
});
test("account deletion needs explicit confirmation, recent login and always targets verified owner", () => run(async (request, data) => {
  assert.equal((await request("/account", tokens.alice, "DELETE", {})).status, 400);
  assert.equal((await request("/account", tokens.old, "DELETE", { confirmation: "DELETE" })).status, 403);
  await request("/profile", tokens.alice, "POST", { profile, preferences });
  await request("/profile", tokens.bob, "POST", { profile, preferences });
  assert.equal((await request("/account", tokens.alice, "DELETE", { confirmation: "DELETE", user_id: "bob" })).status, 204);
  assert.deepEqual(data.deleted, ["alice"]); assert.ok(data.records.has("bob")); assert.equal(data.records.has("alice"), false);
}));
