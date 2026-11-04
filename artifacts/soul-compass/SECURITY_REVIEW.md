# Soul Compass security remediation and verification

Review date: 2026-11-04. Scope: dependency graph, API, local profile storage, static serving, tracked source and available local Git history. No paid product or commercial dependency was introduced.

## Outcome

- Original dependency findings: **19** (one Zod advisory affected two installed versions).
- Fixed and confirmed by a fresh dependency audit: **19**.
- Remaining original findings: **0**.
- Original findings waived as false positives or accepted vulnerabilities: **0**.
- Broader initial static scan: **2 high path-access warnings**, both remediated by replacing request-derived filesystem paths with a startup allowlist of public build files.
- Final dependency, static-code and privacy/dataflow scanners all completed successfully with **zero findings**; static scan reported complete.
- No unresolved scanner critical/high findings. Zero findings is not proof of production security.

## Checklist of all original dependency findings

All rows below describe confirmed vulnerable package versions, not demonstrated exploitation of Soul Compass. Severity follows the original task; npm currently labels the UUID advisory moderate rather than high. Every row is fixed, not suppressed.

Reachability keys:

- **A**: transitive Express runtime dependency. body-parser's compressed-body path was reachable; qs.stringify's advisory-specific operation was not found in application code.
- **B**: transitive Orval/Scalar tooling dependency. Not used by calculation routes; the generator loads a local OpenAPI file. Exposure would require affected tooling operations/untrusted documents or remote servers.
- **C**: Zod v3 direct catalog dependency shared by workspace consumers; generated validators/runtime/tooling use varies. No externally supplied oversized collection schema was found in existing requests.
- **D**: transitive Expo tunnel dependency. Only uuid.v4() is called by ngrok; the vulnerable buffer-writing operations were not observed. Still upgraded.
- **E**: transitive Expo development/build dependency. Filesystem glob operations are used by tooling, not exposed as HTTP glob input.

| # | Advisory | Package before | Severity | Description / reachability | Patched installed version |
|---|---|---|---|---|---|
| 1 | GHSA-27r3-jxmh-p828 | body-parser 2.3.0 | High | Compressed trailing bytes can crash server; A | 2.4.0 |
| 2 | GHSA-2m5v-pch6-74hx | undici 7.29.1 | High | Agent TLS options dropped; B | 7.30.1 / 8.12.3 |
| 3 | GHSA-4w7w-5xrc-9h26 | undici 7.29.1 | High | Redirect cache poisoning/cross-user disclosure; B | 7.30.1 / 8.12.3 |
| 4 | GHSA-mrhx-c7xc-m3w5 | zod 3.25.76 | High | Unbounded collection validation allocations; C | 4.6.7 |
| 5 | GHSA-mrhx-c7xc-m3w5 | zod 4.6.5 | High | Same issue in transitive Orval validator; B | 4.6.7 |
| 6 | GHSA-qrxm-fqhp-jwvm | undici 7.29.1 | High | TLS renegotiation denial of service; B | 7.30.1 / 8.12.3 |
| 7 | GHSA-w5hq-g745-h8pq | uuid 3.4.0 | High | Missing buffer bounds checks in v3/v5/v6; D | 11.1.1 |
| 8 | GHSA-xjj6-f33q-929c | undici 7.29.1 | High | Excessive content-encoding unhandled errors; B | 7.30.1 / 8.12.3 |
| 9 | GHSA-3g3m-2fjr-6pw4 | glob 13.0.6 | Medium | Abort cancellation bypass; E | 14.0.3 |
| 10 | GHSA-4qv8-2p9j-2685 | undici 7.29.1 | Medium | EventSource memory exhaustion; B | 7.30.1 / 8.12.3 |
| 11 | GHSA-55wc-3pg8-jfw6 | undici 7.29.1 | Medium | Decompress interceptor unhandled exceptions; B | 7.30.1 / 8.12.3 |
| 12 | GHSA-6pq8-jhm2-2vcw | qs 6.16.0 | Medium | Comma-array stringify TypeError denial of service; A | 6.17.1 |
| 13 | GHSA-9fm3-97px-rjf6 | undici 7.29.1 | Medium | WebSocket automatic PONG buffering; B | 7.30.1 / 8.12.3 |
| 14 | GHSA-f72v-6w45-q472 | undici 7.29.1 | Medium | Mixed-case SRI algorithm integrity bypass; B | 7.30.1 / 8.12.3 |
| 15 | GHSA-g3hv-75wg-m249 | minimatch 10.2.6 | Medium | Glob-part amplification denial of service; E | 11.0.4 |
| 16 | GHSA-w74x-v6f9-j3xg | fast-uri 3.1.8 | Medium | Encoded URI scheme spoofing; B via AJV | 3.1.9 |
| 17 | GHSA-wjr9-j795-jxcr | fast-uri 3.1.8 | Medium | Host canonicalization confusion; B via AJV | 3.1.9 |
| 18 | GHSA-333x-w4r6-6crp | fast-uri 3.1.8 | Low | First-segment colon scheme injection; B via AJV | 3.1.9 |
| 19 | GHSA-xhq7-xmqj-769h | fast-uri 3.1.8 | Low | Relative-reference path equivalence errors; B via AJV | 3.1.9 |

Related direct tooling updates: Orval 8.41.0 → 8.46.0; zod-validation-error 3.4.0 → 5.0.0. Expo stayed on installed 58.0.22 (manifest floor aligned). No React Native/Expo major upgrade. Zod v4 was necessary because the advisory lists no patched v3. Orval now explicitly generates v4 schemas. Major glob/minimatch and scoped ngrok UUID overrides were needed because available parent versions still required vulnerable major lines; CommonJS exports and actual Expo builds were checked. The pnpm lockfile was regenerated; the one-day package-release quarantine remains enabled.

## Application review and remediation

| Area | Finding / action |
|---|---|
| Authentication/authorization | No login, sessions or persistent account records exist. No private user-data endpoints exist. Public calculators must not be described as authenticated account functionality. No authentication bypass was added. |
| Profile access/isolation | Profiles are local AsyncStorage only (browser localStorage on Web). There is no profile-by-ID fetch/update API and no shared server chart cache. Calculation requests are independent. Shared-device/browser users can see the same local profile; there is no account isolation or encryption at rest. |
| Birth-data privacy | Client stores date, known/unknown time, birthplace and optional residence locally. Natal POST sends birthplace, date/time and calculation options only; never residence. Server calculates transiently without DB persistence. Raw inputs no longer echoed; returned chart/UTC metadata is still sensitive and belongs only to the requesting client. `no-store` prevents intentional HTTP caching. |
| External services | City lookup sends only the typed query through Express to Geoapify, with fixed search parameters and server connection metadata. No profile/GPS or client IP/headers are forwarded. Server-only credentials, validation and safe errors remain; PostgreSQL now atomically shares UTC quotas and rate/source counters across instances. Daily keyed digests contain no raw IPs or queries; Settings discloses this operational storage. Usage-based PostgreSQL was explicitly approved. Daily planet reflections run on-device; full Natal remains permission/action-gated on the server. External NASA access was independent developer verification, not app requests. Development multi-process checks pass; production runtime/account usage is unverified. See GEOAPIFY_HARDENING.html. |
| Validation | Strict date/time shapes, finite coordinate bounds, supported zodiac/house system, bounded IANA identifier and numeric orb limits. Calendar and historical DST checks remain. Unknown fields are not forwarded into chart objects. |
| Request limits | JSON-only, uncompressed, 16 KiB maximum; 120 calculation requests/minute/socket peer with bounded process-local storage and Retry-After. Untrusted X-Forwarded-For cannot bypass limits. Proxied users may share a bucket. Distributed/edge limits are still a production concern. |
| Errors/logging | Generic JSON parser/server errors; no stack/body reflection. Request logs serialize only ID, method and path without query strings; response logs only status. Existing auth/cookie redaction retained. No profile bodies or chart output are logged by these routes. Hosting/access-log retention outside this process was not verified. |
| CORS | Exact configured/browser project origin allowlist; no wildcard or credentials. Native requests without Origin are allowed. CORS is not a substitute for authentication. Confirm published/custom origin configuration. |
| Exposed endpoints | GET health endpoints; POST positions/natal-chart. No debug environment/profile/DB endpoints. Development Metro/Vite workflows are not a production-hardening configuration. |
| Files/path traversal | Static serving uses only a startup index of canonical build files, excludes symlinks/hidden files/maps, and rejects malformed encodings/path components. Manifest lookup uses fixed iOS/Android keys. No user-controlled file writes. |
| XSS | Native/React Text escaping is retained; no raw HTML insertion in app. Static landing page validates host/protocol and escapes HTML attributes/JSON strings. `nosniff` added; static referrer policy is no-referrer. |
| SQL/injection/IDOR | No route executes SQL or takes a profile/account ID. DB scaffolding exists but no profile tables/CRUD are exposed. No claim about future endpoints is implied. |
| Secrets | No secret values inspected, logged or changed. Keys are not placed into Expo public variables. High-confidence key/private-key patterns and sensitive filenames were checked across all 25 locally available Git commits: no matches, no scan errors. This is not an exhaustive secret audit or an inspection of inaccessible remote-only GitHub refs. |

## Compatibility and limitations

The natal response's generic `input` object now contains only `birthTimeKnown`, not the original profile. This intentional privacy tightening does not affect the Expo UI, which reads its saved profile; external API consumers relying on the old echoed fields must migrate. Request contracts and mathematical calculations are unchanged.

Basic API protections do not provide production-ready account security. Before adding multiple persistent accounts, implement identity verification, ownership authorization on every private operation, private-cache scoping, deletion/retention controls, and appropriate secure storage. Do not share an unencrypted device profile as if it were an isolated user account. Do not infer production security solely from zero scanner results.

## Verification

Security tests exercise allowed/blocked CORS, native-originless access, no raw profile echo/cache, absent profile retrieval endpoints, malformed/oversized/compressed bodies, invalid dates/orbs, sanitized errors, rate limits with spoofed forwarded headers, static traversal/symlinks/hidden files/maps, and unchanged natal regression.

The full API suite now has 19 passing tests, including original 14 calculation tests. Kropyvnytskyi at 1991-06-20 19:51 local still resolves to 16:51 UTC; Ascendant ≈ Sagittarius 16.313°, MC ≈ Libra 14.575° (tolerance 0.02°). Codegen, workspace/API/Expo typechecks, API build and Expo Web export (10 routes) all passed after hardening. Standalone production HTTP checks also passed for manifests, public assets, traversal, symlinks, malformed URLs and host injection. Restarted services are running; live CORS checks admit the actual Expo preview origin (200), reject an unrelated origin (403), and the onboarding preview renders without browser errors.
