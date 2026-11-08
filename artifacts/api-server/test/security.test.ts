import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { AddressInfo } from "node:net";
import { SUPPORTED_NATAL_CONSENT_VERSION } from "../src/astrology/consent";
import { createApp } from "../src/app";
import type { CalculationRateLimitStore } from "../src/middlewares/shared-calculation-limit";

const allowCalculations: CalculationRateLimitStore = {
  reserve: async () => ({ allowed: true, retryAfterSeconds: 0 }),
};

async function withApp(
  fn: (base: string) => Promise<void>,
  calculationStore: CalculationRateLimitStore = allowCalculations,
) {
  const server = createApp({
    allowedOrigins: ["https://allowed.example"],
    calculationRateLimitStore: calculationStore,
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  try { await fn(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api`); }
  finally { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
}
const payload = {
  birthDate: "1991-06-20", birthTime: { status: "known", localTime: "19:51" },
  birthPlace: { latitude: 48.50834, longitude: 32.26618, timeZone: "Europe/Kyiv" },
  consentAccepted: true,
  consentVersion: SUPPORTED_NATAL_CONSENT_VERSION,
};
const json = (body: unknown, extra: Record<string, string> = {}) => ({
  method: "POST", headers: { "content-type": "application/json", ...extra }, body: JSON.stringify(body),
});

test("CORS allowlist admits the app, rejects unrelated origins, native requests remain usable", async () => withApp(async (base) => {
  const allowed = await fetch(`${base}/astrology/health`, { headers: { origin: "https://allowed.example" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "https://allowed.example");
  assert.equal(allowed.headers.get("access-control-allow-credentials"), null);
  assert.equal((await fetch(`${base}/astrology/health`, { headers: { origin: "https://evil.example" } })).status, 403);
  assert.equal((await fetch(`${base}/astrology/health`)).status, 200);
}));

test("production astrology health response does not expose provider details", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    await withApp(async (base) => {
      const response = await fetch(`${base}/astrology/health`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { status: "ok" });
    });
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});

test("privacy: natal responses never echo raw profiles and cannot be cached", async () => withApp(async (base) => {
  const response = await fetch(`${base}/astrology/natal-chart`, json({ ...payload, accountId: "someone-else", currentResidence: { private: "should-not-return" } }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-powered-by"), null);
  const chart = await response.json() as any;
  assert.deepEqual(chart.input, { birthTimeKnown: true });
  assert.ok(Math.abs(chart.angles.ascendant - 256.31) < 0.02);
  assert.ok(Math.abs(chart.angles.midheaven - 194.57) < 0.02);
  assert.equal(JSON.stringify(chart).includes("should-not-return"), false);
  assert.equal((await fetch(`${base}/profile/someone-else`)).status, 404);
  assert.equal((await fetch(`${base}/astrology/natal-chart`)).status, 404);
}));

test("malformed, oversized, compressed and wrong-content-type bodies have sanitized errors", async () => withApp(async (base) => {
  const cases = [
    [{ method: "POST", headers: { "content-type": "application/json" }, body: '{"private":"sensitive",oops}' }, 400],
    [json({ data: "a".repeat(17000) }), 413],
    [json(payload, { "content-encoding": "gzip" }), 415],
    [{ method: "POST", headers: { "content-type": "text/plain" }, body: "secret" }, 415],
    [json({ ...payload, orbs: { luminary: "8", other: 6 } }), 400],
    [json({ ...payload, birthDate: "not-a-date" }), 400],
    [json({ atUtc: "2026-02-30T12:00:00Z" }), 400],
  ] as const;
  for (const [request, status] of cases) {
    const path = "body" in request && request.body?.includes("atUtc") ? "/astrology/positions" : "/astrology/natal-chart";
    const response = await fetch(base + path, request);
    assert.equal(response.status, status);
    const text = await response.text();
    assert.equal(/sensitive|SyntaxError|at .*\.ts|stack|\/home\/runner/.test(text), false);
  }
}));

test("shared calculation limit returns a bounded Retry-After response", async () => withApp(async (base) => {
  const url = `${base}/astrology/positions`;
  const blocked = await fetch(url, json({ atUtc: "2000-01-01T12:00:00Z" }));
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("retry-after"), "34");
}, { reserve: async () => ({ allowed: false, retryAfterSeconds: 34 }) }));

test("shared calculation limiter fails closed without leaking database errors", async () => withApp(async (base) => {
  const response = await fetch(`${base}/astrology/positions`, json({ atUtc: "2000-01-01T12:00:00Z" }));
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private database detail/);
}, { reserve: async () => { throw new Error("private database detail"); } }));

test("removed Supabase account routes are not registered", async () => withApp(async (base) => {
  const requests = [
    ["/me/profile", "GET"],
    ["/me/profile", "POST"],
    ["/me/profile", "PUT"],
    ["/me/profile", "DELETE"],
    ["/me/account", "DELETE"],
  ] as const;
  for (const [path, method] of requests) {
    const response = await fetch(`${base}${path}`, {
      method,
      ...(["POST", "PUT"].includes(method) ? {
        headers: { "content-type": "application/json" },
        body: "{}",
      } : {}),
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "API endpoint not found." });
  }
}));

test("public file index excludes traversal, symlinks, hidden files and source maps", () => {
  const require = createRequire(import.meta.url);
  const { indexPublicAssets } = require("../../soul-compass/server/public-assets.js");
  const root = mkdtempSync(join(tmpdir(), "soul-security-"));
  try {
    const publicRoot = join(root, "public"); mkdirSync(publicRoot); mkdirSync(join(publicRoot, "assets"));
    writeFileSync(join(publicRoot, "assets", "app.js"), "public");
    writeFileSync(join(root, "private.txt"), "private");
    writeFileSync(join(publicRoot, ".env"), "private");
    writeFileSync(join(publicRoot, "app.js.map"), "private source");
    symlinkSync(join(root, "private.txt"), join(publicRoot, "escape.txt"));
    const files = indexPublicAssets(publicRoot);
    assert.equal(files.size, 1);
    assert.ok(files.get("/assets/app.js"));
    for (const path of ["/../private.txt", "/%2e%2e/private.txt", "/escape.txt", "/.env", "/app.js.map"]) assert.equal(files.get(path), undefined);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
