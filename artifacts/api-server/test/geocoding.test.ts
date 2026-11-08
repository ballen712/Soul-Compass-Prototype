import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { Writable } from "node:stream";
import { test } from "node:test";
import express from "express";
import pino from "pino";
import { createCitySearch, normalizeCities } from "../src/geocoding/geoapify";
import { createGeocodingRouter } from "../src/routes/geocoding";
import { createApp } from "../src/app";
import { geocodingConfig } from "../src/geocoding/config";
import { developmentQuota } from "../src/geocoding/quota";
import { pruneExpiredSourceDigests } from "../src/geocoding/postgres";

function testSearch(options: Parameters<typeof createCitySearch>[0] = {}) {
  const config = { ...geocodingConfig({}), requestsPerSecond: 2, ...options.config };
  if (options.dailyLimit !== undefined) {
    config.hardCeiling = options.dailyLimit; config.sourcePerDay = options.dailyLimit;
  }
  return createCitySearch({ ...options, config, production: false, event: () => {},
    store: developmentQuota(config, options.now) });
}

const city = { city: "Budapest", country: "Hungary", state: "Central Hungary",
  lat: 47.4979, lon: 19.0402, timezone: { name: "Europe/Budapest" } };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body),
  { status, headers: { "content-type": "application/json" } });

test("normalizes lat/lon and IANA zone, distinguishes ambiguous states, drops invalid/duplicate results", () => {
  const cities = normalizeCities({ results: [
    city, city, { ...city, city: "Springfield", state: "Illinois", lat: 39.8, lon: -89.6 },
    null, { ...city, lat: 91 }, { ...city, timezone: { name: "Invalid/Zone" } },
  ] });
  assert.equal(cities.length, 2);
  assert.deepEqual(cities[0], { city: "Budapest", country: "Hungary", admin1: "Central Hungary",
    latitude: 47.4979, longitude: 19.0402, timeZone: "Europe/Budapest" });
  assert.equal(cities[1].admin1, "Illinois");
  assert.throws(() => normalizeCities({ results: "bad" }));
  assert.throws(() => normalizeCities({ results: [{ ...city, lon: 181 }] }));
  assert.deepEqual(normalizeCities({ results: [] }), []);
});

test("only explicit query and fixed parameters reach provider; no profile, client headers or raw response leaks", async () => {
  let received: URL | undefined, init: RequestInit | undefined;
  const search = testSearch({
    getKey: () => "test-placeholder",
    request: (async (url, options) => { received = new URL(String(url)); init = options;
      return json({ results: [{ ...city, apiKey: "must-not-return", datasource: { secret: "excluded" } }] });
    }) as typeof fetch,
  });
  const result = await search("Budapest");
  assert.equal(received!.origin, "https://api-eu.geoapify.com");
  assert.equal(received!.pathname, "/v1/geocode/search");
  assert.deepEqual([...received!.searchParams.keys()].sort(), ["apiKey", "bias", "format", "lang", "limit", "text", "type"]);
  assert.equal(received!.searchParams.get("text"), "Budapest");
  assert.equal(received!.searchParams.get("type"), "city");
  assert.equal(received!.searchParams.get("bias"), "countrycode:none");
  assert.equal(init!.redirect, "error");
  assert.deepEqual(init!.headers, { accept: "application/json" });
  assert.equal(init!.body, undefined);
  assert.ok(init!.signal);
  assert.doesNotMatch(JSON.stringify(result), /apiKey|datasource|secret|test-placeholder/);
});

test("normalizes Unicode before sending and preserves an empty provider result", async () => {
  let received: URL | undefined;
  const query = "  Budapest e\u0301 & center  ";
  const expected = query.trim().normalize("NFC");
  const search = testSearch({
    getKey: () => "test-placeholder",
    request: (async url => {
      received = new URL(String(url));
      return json({ results: [] });
    }) as typeof fetch,
  });

  assert.deepEqual(await search(query), []);
  assert.equal(received!.searchParams.get("text"), expected);
  assert.equal(received!.searchParams.get("type"), "city");
});

test("provider failure events do not include the search text, URL, or API key", async () => {
  const apiKey = "test-key-must-not-be-logged";
  const query = "Sensitive City & District";
  const events: unknown[] = [];
  const config = geocodingConfig({});
  const search = createCitySearch({
    getKey: () => apiKey,
    config,
    store: developmentQuota(config),
    production: false,
    event: (name, fields = {}) => events.push({ name, fields }),
    request: (async () => {
      throw new Error(`https://api-eu.geoapify.com/?text=${encodeURIComponent(query)}&apiKey=${apiKey}`);
    }) as typeof fetch,
  });

  await assert.rejects(search(query), { status: 502, message: "City search is temporarily unavailable. Please try again later." });
  assert.doesNotMatch(JSON.stringify(events), /Sensitive City|District|apiKey=|test-key-must-not-be-logged|geoapify\.com/);
});

test("city route returns the unchanged mobile response schema", async () => {
  const expected = {
    city: "Budapest",
    country: "Hungary",
    admin1: "Central Hungary",
    latitude: 47.4979,
    longitude: 19.0402,
    timeZone: "Europe/Budapest",
  };
  const app = express().use("/api/geocoding", createGeocodingRouter(async query => {
    assert.equal(query, "Budapest");
    return [expected];
  }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/geocoding/cities?q=Budapest`;
  try {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { results: [expected] });
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test("application request logs omit query values, headers, and request bodies", async () => {
  const logs: string[] = [];
  const requestLogger = pino({ level: "info" }, new Writable({
    write(chunk, _encoding, callback) {
      logs.push(String(chunk));
      callback();
    },
  }));
  const app = createApp({ allowedOrigins: [], requestLogger });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/geocoding/cities`;
  const sensitiveValues = [
    "private-city-query",
    "fake-provider-key",
    "private-header-marker",
    "private-birth-body-marker",
  ];
  try {
    const response = await fetch(
      `${base}?q=${sensitiveValues[0]}&apiKey=${sensitiveValues[1]}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-private-marker": sensitiveValues[2],
        },
        body: JSON.stringify({ birthDate: sensitiveValues[3] }),
      },
    );
    assert.equal(response.status, 404);
    await response.text();
    await new Promise<void>(resolve => setImmediate(resolve));
    const serializedLogs = logs.join("");
    assert.match(serializedLogs, /\/api\/geocoding\/cities/);
    for (const value of sensitiveValues) assert.ok(!serializedLogs.includes(value));
    assert.ok(!serializedLogs.includes("apiKey="));
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test("prunes source digests from completed UTC days under the shared quota lock", async () => {
  const calls: Array<{ sql: string; values?: unknown[] }> = [];
  const client = {
    async query(sql: string, values?: unknown[]) {
      calls.push({ sql, values });
      if (sql.includes("to_char((clock_timestamp()")) return { rows: [{ day: "2026-11-08" }], rowCount: null };
      if (sql.startsWith("DELETE FROM geoapify_quota_sources")) return { rows: [], rowCount: 2 };
      return { rows: [], rowCount: 0 };
    },
    release() {},
  };
  const pool = async () => ({ connect: async () => client }) as any;

  assert.equal(await pruneExpiredSourceDigests({ pool }), 2);
  assert.ok(calls.some(call => call.sql.includes("pg_advisory_xact_lock")));
  assert.deepEqual(
    calls.find(call => call.sql.startsWith("DELETE FROM geoapify_quota_sources"))?.values,
    ["2026-11-08"],
  );
  assert.equal(calls.at(-1)?.sql, "COMMIT");
});

test("no retry or key/error-body disclosure on missing key, denial, quota, timeout, network or malformed response", async () => {
  const missing = testSearch({ getKey: () => undefined });
  await assert.rejects(missing("Budapest"), { status: 503 });
  for (const status of [401, 403, 429, 500]) {
    let calls = 0;
    const search = testSearch({ getKey: () => "test-placeholder",
      request: (async () => { calls++; return json({ error: "test-placeholder" }, status); }) as typeof fetch });
    await assert.rejects(search("Budapest"), (error: any) => {
      assert.equal(error.status, status === 429 ? 429 : 503);
      assert.doesNotMatch(error.message, /test-placeholder/); return true;
    });
    assert.equal(calls, 1);
  }
  for (const [failure, status] of [
    [new DOMException("sensitive URL", "TimeoutError"), 504],
    [new Error("https://provider.example/?apiKey=private"), 502],
    [new SyntaxError("invalid JSON"), 502],
  ] as const) {
    const search = testSearch({ getKey: () => "test-placeholder",
      request: (async () => { throw failure; }) as typeof fetch });
    await assert.rejects(search("Budapest"), (error: any) => {
      assert.equal(error.status, status); assert.doesNotMatch(error.message, /private|sensitive|apiKey/); return true;
    });
  }
});

test("conservative per-second and rolling-day limits prevent upstream calls beyond capacity", async () => {
  let now = 1000, calls = 0;
  const search = testSearch({ getKey: () => "test-placeholder", now: () => now, dailyLimit: 3,
    request: (async () => { calls++; return json({ results: [] }); }) as typeof fetch });
  await search("Berlin"); await search("Budapest");
  await assert.rejects(search("Paris"), { status: 429 });
  now += 1000; await search("Paris");
  now += 1000; await assert.rejects(search("Vienna"), { status: 429 });
  assert.equal(calls, 3);
  now += 86_400_000; await search("Vienna"); assert.equal(calls, 4);
});

test("route rejects extra/profile parameters, repeated/invalid queries; peer limit ignores spoofed forwarding", async () => {
  let calls = 0;
  const app = express().use("/api/geocoding", createGeocodingRouter(async q => { calls++; assert.equal(q, "Budapest"); return []; }));
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/geocoding/cities`;
  try {
    for (const query of ["", "?q=x", `?q=${"x".repeat(101)}`, "?q=%00ab", "?q=ab&q=cd", "?q=Budapest&birthDate=1991-06-20"]) {
      assert.equal((await fetch(base + query)).status, 400);
    }
    assert.equal(calls, 0);
    for (let i = 0; i < 20; i++) assert.equal((await fetch(`${base}?q=Budapest`,
      { headers: { "x-forwarded-for": `192.0.2.${i}` } })).status, 200);
    const limited = await fetch(`${base}?q=Budapest`, { headers: { "x-forwarded-for": "198.51.100.1" } });
    assert.equal(limited.status, 429); assert.ok(limited.headers.get("retry-after")); assert.equal(calls, 20);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test("daily budget resets at UTC midnight, not the server's local timezone", async () => {
  let now = 1000;
  const search = testSearch({ getKey: () => "test-placeholder", now: () => now, dailyLimit: 2,
    request: (async () => json({ results: [] })) as typeof fetch });
  await search("Berlin");
  now += 23 * 3_600_000; await search("Budapest");
  now += 3_600_001; await search("Paris");
  await search("Tokyo");
  await assert.rejects(search("Vienna"), { status: 429 });
});

test("geocoding inherits existing CORS, no-store, and nosniff safeguards", async () => {
  const server = createApp({ allowedOrigins: ["https://allowed.example"] }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/geocoding/cities?q=x`;
  try {
    assert.equal((await fetch(base, { headers: { origin: "https://evil.example" } })).status, 403);
    const result = await fetch(base, { headers: { origin: "https://allowed.example" } });
    assert.equal(result.status, 400);
    assert.equal(result.headers.get("cache-control"), "no-store");
    assert.equal(result.headers.get("x-content-type-options"), "nosniff");
    assert.equal(result.headers.get("access-control-allow-origin"), "https://allowed.example");
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
