# Soul Compass — production readiness audit

**Checked:** 7 November 2026  
**Status:** internal preparation only; no publication, migration, account change, paid build, or credential change was performed.

## Executive summary

The existing architecture is sufficient for an initial public release; a Supabase migration or a new backend is not needed for the active local-first app. The public Replit deployment and its `/api` service are responding, and a fabricated natal-chart request succeeded. The code, bundle, and automated security checks are in good shape, but this is **not yet ready for a signed TestFlight build**.

The main release blockers are the missing Apple Developer/TestFlight setup, unpublished policy and support URLs, the still-reachable legacy cloud-profile API, and incomplete real-device/store checks. Build-safety defects were fixed and verified: production bundles now require the stable Replit production host, Expo Go icons use a reachable HTTPS asset, and a shared astrology calculation cap now spans API processes.

## 1. Current architecture and request flow

```text
Soul Compass (Expo / iOS and Android)
  ├─ AsyncStorage: profile, language, preferences, mood, crystal collection,
  │  hidden stones, consent, and cached natal chart
  ├─ On-device: daily crystal ranking, local preferences, and local profile UI
  ├─ GET /api/astrology/positions: current UTC instant → Express → Astronomy Engine
  ├─ POST /api/astrology/natal-chart: consented birth inputs → Express
  │  → Astronomy Engine → chart returned to app and cached locally
  └─ explicit city search → Express → Geoapify
                           └─ Replit PostgreSQL: operational quota counters

Legacy, not called by the active mobile UI:
  Supabase-authenticated /api/me routes → Supabase Auth + profile tables/RLS
```

- **Production app/API origin:** `https://soul-compass-prototype.replit.app`; API paths are under `/api`. The deployment is Replit Autoscale and is currently reported as **public**.
- **Production status checked:** `/api/healthz` and `/api/astrology/health` returned HTTP 200. One natal-chart request using fabricated inputs returned HTTP 200 with 10 planetary placements and 11 aspects. No real profile was used, and this calculation did not write a profile to the application database.
- The deployed `/api/astrology/health` response included the engine version during this audit. I changed the workspace code so production returns only `{status: "ok"}`; `/api/healthz` remains the generic deployment health check. This source change is not live until a separately approved publish.
- A read-only production metadata query confirmed the existing operational state table has the required `bucket` (text) and `value` (jsonb) columns. No production rows or profile data were queried or changed, and no new table/migration is needed for the new counter.
- **Protected-route check:** unauthenticated `GET /api/me` returned HTTP 401.
- The active UI does not require accounts, read cloud profiles, or upload the saved profile automatically. Supabase is not hosting app logic or required for the Cosmos, Crystals, or Natal Chart tabs. No Supabase Edge Function is needed.
- A Supabase integration is not connected to this workspace. I did not query the live Supabase schema, RLS state, or records and did not apply or change any SQL. Local migrations and RLS tests remain untouched.
- The API also exposes protected `/api/me` routes. They are reachable when a valid Supabase access token is supplied, even though the app UI does not call them. This is a dormant cloud-profile capability, not a normal local-first flow. `SUPABASE_SERVICE_ROLE_KEY` is absent, so service-role account deletion is not configured.
- No advertising, Tarot payment, subscription, or AI service is active in the current app.

## 2. Data-flow inventory

| Data | Device | Network / server | Retention and limits |
|---|---|---|---|
| Birth date/time and birthplace | Stored locally in AsyncStorage; chart cache is local | Sent only after saved consent and an explicit chart action. The request includes date, known/unknown time, birthplace coordinates, and time zone—not name, residence, language, mood, or collection. | The inspected chart route does not persist the chart/profile to its application database. Hosting/proxy logs and their retention still need provider verification. |
| Current residence | Stored locally; used for local date/context | Not included in natal-chart requests. A city name is sent only when the person explicitly searches or edits a place. | No device GPS is used. Search text is not stored by the app route. Geoapify's own logging/retention must be confirmed. |
| Language, preferences, daily feeling, crystal collection, hidden stones | Local only | Not sent in active app requests | The confirmed local reset removes the profile/preferences, consent, legacy local record, and cached chart, blocks requests during deletion, and returns to onboarding. OS backups are outside this reset. |
| Current-sky query | Not a personal profile | Sends only the requested UTC instant to the API | No profile is included. |
| City-search abuse controls | Not applicable | Replit PostgreSQL stores usage counters and a keyed, daily digest of the server-observed connection peer; it does not store the raw query or raw peer address. | Old daily digests are cleaned when a later quota transaction runs after UTC midnight; cleanup is request-triggered, not scheduled. Database backup retention needs confirmation. |
| Astrology calculation cap | Not applicable | A separate bucket in the same PostgreSQL operational-state table stores only the aggregate request count and limit for the most recent one-minute window. It contains no user, device, IP, birth, or chart data; the value resets on the first request in a later window and may remain unchanged while idle. | Each calculation request makes a bounded database transaction. The production table columns were verified read-only; the new API code is not live until published. |
| IP/network metadata and logs | Device makes normal HTTPS requests | App logs record method, path without query parameters, and response status—not request bodies. The remaining in-memory peer limiter applies to protected legacy `/api/me` routes only; calculation limits use an aggregate counter without client identity. Hosting and Geoapify can process ordinary connection metadata. | Replit infrastructure log retention and provider retention have not been verified. |
| Supabase profile data | Not read from or synchronized by the active UI | A caller with a valid Supabase bearer token can use the remaining `/api/me` routes; ownership is authenticated, not client-supplied. | No live records were inspected. Decide whether to disable these routes before release while preserving the database, migrations, and RLS, or retain and disclose the capability. |
| Support contact | No automatic attachment | User may email Soul Compass Support at soulcompass.support@gmail.com voluntarily | The app does not attach a birth profile. Ask testers to redact birth details and location from screenshots. |

Local storage is not encrypted by Soul Compass at the application layer. The app has no full export/import feature. A local reset does not erase OS backups, Replit infrastructure logs, provider logs, or any separately retained cloud record.

## 3. Security and abuse controls

- Express turns off `x-powered-by`, does not trust client-supplied forwarded IP headers, uses an origin allowlist, disables credentialed CORS, and applies `no-store`/`nosniff` response headers.
- Request bodies are limited to 16 KB, strict JSON is validated, unsupported/compressed body types are rejected, external city requests have an 8-second timeout, and API error responses omit stack traces and server configuration.
- Natal endpoint validation, owner isolation, and `/api/me` authentication/RLS behavior have automated tests. No migration or destructive production test was run.
- Geoapify configuration in code uses the project-reviewed Free allowance of 3,000 credits/day and an app hard stop of 2,400/day (80%); it also bounds request rate, per-source usage, and cache size. These provider terms were last checked in the existing project record on 4 November 2026; account-wide usage and current provider terms must be rechecked before external release.
- The workspace now reserves a single PostgreSQL-backed aggregate budget of **3,000 calculation requests per minute**, shared by `/api/astrology/positions` and `/api/astrology/natal-chart` across instances. A transaction-scoped advisory lock and PostgreSQL clock make check/increment atomic. It fails closed with a generic 503 if the counter store is unavailable and returns 429 plus `Retry-After` when the shared ceiling is reached.
- The old process-local peer cap is no longer applied to public astrology calculations because a proxy peer is not a reliable per-user identity and could throttle unrelated users together. The bounded process-local 120/min peer limiter remains for protected legacy `/api/me` routes. Without login, the global cap protects total server capacity but cannot guarantee per-person fairness.
- The shared calculation counter adds a database transaction per calculation request; cost depends on actual database-active hours and usage. The database is usage-billed. We did not publish these changes or query production counters.
- The live deployment's `/api/astrology/health` reveals only non-secret engine availability/version; the staged source change reduces the production response to basic status. `/api/me` was 401 without credentials. CORS is not treated as authentication.

### Automated security checks

- Dependency audit: **0** critical/high/moderate/low/info vulnerabilities reported.
- SAST: **0 findings**, scan complete.
- HoundDog secret scan: **0 findings**.
- Generated iOS/Android client bundle scan: no matches for server-secret markers, no Supabase environment-variable names, and no development/localhost hosts. No credential values were read or printed.
- These checks are evidence, not an independent security certification or a guarantee against all vulnerabilities.

## 4. Production build configuration

The production static build originally reused the already-running development Metro process. That could produce a manifest hosted on the production URL while the JS bundle had no stable API origin, and the Expo Go icon URL could remain on `127.0.0.1`. I fixed this without publishing:

1. `pnpm --filter @workspace/soul-compass run build` now runs in production mode.
2. Production builds require `REPLIT_INTERNAL_APP_DOMAIN`; they will not fall back to a development/preview URL.
3. The build refuses to reuse a running Metro server whose environment cannot be verified. Use a free `EXPO_BUILD_METRO_PORT`.
4. iOS/Android static bundle validation now requires the configured API origin and a generated, reachable Expo Go icon.

Verification: a fresh iOS+Android static bundle was built with the production origin. Its bundle includes the stable HTTPS origin; no `replit.dev`, localhost, or server-secret markers were found. The manifest icon points to the generated HTTPS asset and returned HTTP 200 from the local static server. A negative test confirmed that a production build without the internal production domain exits with an error. Generated `static-build/` output is ignored and was not published.

## 5. Lowest-cost architecture and indicative usage cost

**Recommendation:** keep the existing Replit Autoscale app/API, current usage-based PostgreSQL quota store, and Geoapify Free plan. Keep profiles local. Do not move calculations to Supabase Edge Functions or add another paid provider; neither provides a necessary benefit for the current product.

Replit's official August 2026 billing update lists Autoscale at **$1/month base + $0.40 per million requests + $0.60 per million compute units**. Compute units depend on CPU/RAM time (18 units per CPU-second and 2 per RAM-second). Production PostgreSQL is **$0.16 per active compute hour + $0.35/GiB/month stored**, and becomes inactive after five idle minutes. Source: [Replit August 2026 cloud pricing](https://docs.replit.com/billing/aug-cloud-billing-updates).

Illustrative monthly request component only—not a bill or full cost estimate:

| Users | Assumption | API requests used for estimate | Replit request charge |
|---:|---|---:|---:|
| 0 | No user actions; service health probes/static delivery excluded | 0 app requests | $0.000 app-request component; $1 base remains |
| 100 | 10 foreground minutes/user/day, one positions request/minute, plus one initial city query/user | 30,100 | about $0.012 |
| 1,000 | Same usage assumption | 301,000 | about $0.120 |

The new shared limit adds one PostgreSQL transaction per astrology calculation: approximately 30,000 counter transactions in the 100-user scenario and 300,000 in the 1,000-user scenario (the extra city-search request uses the existing Geoapify quota path). This can keep the database active longer and increase its compute charge; the request-fee figures above do not include that effect.

Add to each estimate: Autoscale compute-unit charges; database active hours and storage; static page/assets and health checks; any repeated city searches; and the existing Supabase project's own plan, if any. User count alone does not determine the bill. The usage-based database rate is $0.16 × active hours + $0.35 × stored GiB; actual active hours/storage were not available in the workspace. Check Replit **Settings → Usage** before release.

Geoapify remains $0 under the reviewed Free allowance and app cap; a burst of more than 2,400 uncached provider requests/day is blocked by the app. This does not cap unrelated projects using the same Geoapify account/key. The current Supabase plan and billing status could not be inspected; the mobile UI makes no Supabase requests, but the dormant `/api/me` routes can.

Current pricing for Supabase and Geoapify could not be refreshed during this audit; the external web-fetch service returned HTTP 402. Do not treat the existing 4 November Geoapify review as a substitute for checking the provider's current terms/account usage before release. No paid service was purchased or enabled.

## 6. Build and verification results

- API tests: **47 passed**. Includes malformed/oversized payloads, safe errors, the PostgreSQL-backed limit across two independent API processes and a replacement process, fail-closed behavior, local legacy profile limits, CORS, Geoapify quotas, and authenticated profile isolation.
- App tests: **159 passed**; astrology tests: **20 passed**. Includes local data, consent/reset, chart, and crystal guidance behavior.
- Workspace TypeScript: **passed**.
- Expo compatibility / Expo Doctor: **20/20 passed**.
- Production checks: API health **HTTP 200**, synthetic natal request **HTTP 200**, unauthenticated `/api/me` **HTTP 401**, and read-only confirmation of the production counter table columns. After the dev workflow restart, `/api/healthz` and synthetic positions both returned **HTTP 200**; the development aggregate counter showed 1/3,000, and the isolated test-bucket cleanup check showed zero remaining rows.
- Static iOS/Android bundle: **passed**; correct API origin and Expo Go icon verified. This is not an EAS-signed build.
- City search was not called against production during this audit to avoid spending Geoapify quota. Live Supabase tables/RLS were not queried.
- Seven languages are present in the app, but a full native-device visual sweep for every language and both light/dark appearances has not been completed. Expo Doctor is not a physical Android/iOS test.

## 7. Privacy Policy, Terms, and Support

Drafts are internal only:

- `reports/soul-compass-launch/PRIVACY_POLICY_DRAFT.md`
- `reports/soul-compass-launch/TERMS_OF_USE_DRAFT.md`
- `reports/soul-compass-launch/SUPPORT_PAGE_DRAFT.md`

They are **not publication-ready**. Remaining items include: confirm a complete postal/contact address; determine legal bases and controller/supervisory-authority details; verify Replit and Geoapify regions, processors, log/back-up retention and deletion process; decide whether `/api/me` remains enabled; create stable public HTTPS Privacy, Terms, and Support URLs; translate/review legal text for supported locales; and obtain qualified legal review. No in-app policy links were added because no finalized public URLs exist. Do not publish drafts with placeholders or claim independent legal certification.

## 8. Store and TestFlight readiness

Confirmed in `app.json`: app name Soul Compass, version **1.0.0**, iOS Bundle ID `app.soulcompass.mobile`, build number **1**, iPhone-only (`supportsTablet: false`), and configured icon. No explicit splash screen or iOS minimum deployment target is pinned; Android package/store settings are not complete.

**Not ready for a signed TestFlight build:** there is no Apple Developer account in the current project context, no `eas.json`, no signed archive, no App Store Connect setup, no finalized public legal/support URLs, and no store privacy/age-rating submission. Do not purchase membership or run a paid build as part of this audit. The Expo Go CLI/account mismatch is a separate Replit-managed tunnel issue; the production static bundle build does not resolve that account mismatch.

## 9. Manual decisions and next steps

1. **Deployment visibility:** Replit reports the current prototype deployment is public. This matches the eventual public-app goal but conflicts with the earlier request to restrict the prototype. I did not change visibility. If the deployment is made private, the iOS app will not be able to reach this same-host API anonymously.
2. **Shared astrology limit:** source now allows at most 3,000 calculation requests/minute across processes. The real multi-process test passed and production table columns exist, but the code remains unpublished. After an approved publish, verify the deployed API and monitor PostgreSQL activity; the counter makes one DB transaction per calculation.
3. **Legacy cloud profiles:** decide whether to disable the protected `/api/me` routes before release while keeping Supabase Auth, tables, migrations, and RLS intact, or retain this capability and disclose it in the policy.
4. Confirm the legal operator/contact details and legal review decisions; publish final, placeholder-free policy/terms/support pages; then add their public links to Settings.
5. When ready, obtain the Apple Developer account and complete App Store Connect, signing/EAS configuration, privacy labels, age rating, screenshots, and a real-device signed build. Do not treat this audit's static Expo bundles as TestFlight builds.

**Overall:** the current stack is an appropriate low-cost foundation, and the production API path is working. Keep this as an internal prototype until the visibility choice, legacy cloud-route decision, legal URLs, Apple signing prerequisites, and a separately approved publish of the verified source changes are resolved.
