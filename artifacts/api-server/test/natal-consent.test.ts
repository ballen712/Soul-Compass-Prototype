import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import { test } from "node:test";
import { NatalChartRequestConsentVersion } from "../../../lib/api-client-react/src/generated/api.schemas";
import { SUPPORTED_NATAL_CONSENT_VERSION } from "../src/astrology/consent";
import { calculateNatalChart } from "../src/astrology/natal";
import { createAstrologyRouter } from "../src/routes/astrology";

const birthDetails = {
  birthDate: "2000-01-02",
  birthTime: { status: "unknown" },
  birthPlace: { latitude: 1, longitude: 2, timeZone: "UTC" },
};

async function withServer<T>(app: express.Express, run: (base: string) => Promise<T>): Promise<T> {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    return await run(base);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

function postJson(base: string, path: string, body: unknown) {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("backend consent version matches the mobile notice version", () => {
  assert.ok(Object.values(NatalChartRequestConsentVersion).includes(SUPPORTED_NATAL_CONSENT_VERSION));
});

test("natal chart requires explicit current consent before calculation", async () => {
  let calculationCalls = 0;
  const app = express()
    .use(express.json())
    .use(createAstrologyRouter(input => {
      calculationCalls++;
      return calculateNatalChart(input);
    }));

  await withServer(app, async base => {
    const invalidRequests: Array<{ label: string; body: unknown; code: string }> = [
      { label: "missing declaration", body: birthDetails, code: "CONSENT_REQUIRED" },
      { label: "missing declaration before invalid birth data", body: { birthDate: "PRIVATE-DATE-MARKER" }, code: "CONSENT_REQUIRED" },
      { label: "false", body: { ...birthDetails, consentAccepted: false, consentVersion: SUPPORTED_NATAL_CONSENT_VERSION }, code: "CONSENT_INVALID" },
      { label: "string", body: { ...birthDetails, consentAccepted: "true", consentVersion: SUPPORTED_NATAL_CONSENT_VERSION }, code: "CONSENT_INVALID" },
      { label: "number", body: { ...birthDetails, consentAccepted: 1, consentVersion: SUPPORTED_NATAL_CONSENT_VERSION }, code: "CONSENT_INVALID" },
      { label: "null", body: { ...birthDetails, consentAccepted: null, consentVersion: SUPPORTED_NATAL_CONSENT_VERSION }, code: "CONSENT_INVALID" },
      { label: "missing version", body: { ...birthDetails, consentAccepted: true }, code: "CONSENT_INVALID" },
      { label: "unsupported version", body: { ...birthDetails, consentAccepted: true, consentVersion: "unsupported-version" }, code: "CONSENT_INVALID" },
    ];

    for (const request of invalidRequests) {
      const response = await postJson(base, "/astrology/natal-chart", request.body);
      assert.equal(response.status, 400, request.label);
      const data = await response.json() as { code?: string; error?: string };
      assert.equal(data.code, request.code, request.label);
      assert.equal(typeof data.error, "string", request.label);
      assert.doesNotMatch(JSON.stringify(data), /PRIVATE-DATE-MARKER|2000-01-02|latitude|longitude|timeZone/);
    }
    assert.equal(calculationCalls, 0, "invalid consent must be rejected before calculation");

    const accepted = await postJson(base, "/astrology/natal-chart", {
      ...birthDetails,
      consentAccepted: true,
      consentVersion: SUPPORTED_NATAL_CONSENT_VERSION,
    });
    assert.equal(accepted.status, 200);
    const chart = await accepted.json() as { planets?: unknown[]; input?: { birthTimeKnown?: boolean } };
    assert.equal(chart.planets?.length, 10);
    assert.equal(chart.input?.birthTimeKnown, false);
    assert.equal(calculationCalls, 1);

    const positions = await postJson(base, "/astrology/positions", { atUtc: "2026-01-02T03:04:05Z" });
    assert.equal(positions.status, 200, "current positions do not receive birth data and do not require consent");
  });
});

test("birth-time calculation errors are sanitized and do not echo birth details", async () => {
  const app = express().use(express.json()).use(createAstrologyRouter());
  await withServer(app, async base => {
    const response = await postJson(base, "/astrology/natal-chart", {
      birthDate: "2026-10-25",
      birthTime: { status: "known", localTime: "02:30" },
      birthPlace: { latitude: 47.5, longitude: 19.04, timeZone: "Europe/Budapest" },
      consentAccepted: true,
      consentVersion: SUPPORTED_NATAL_CONSENT_VERSION,
    });
    assert.equal(response.status, 422);
    const data = await response.json() as { code?: string; error?: string };
    assert.equal(data.code, "BIRTH_TIME_AMBIGUOUS");
    assert.equal(data.error, "That local birth time occurred twice. Choose earlier or later occurrence.");
    assert.doesNotMatch(JSON.stringify(data), /2026-10-25|02:30|00:30:00|01:30:00|47\.5|19\.04|Europe\/Budapest/);
  });
});
