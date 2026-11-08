# Deployment

The active workspace source does not read Supabase credentials or include Supabase authentication/profile routes. This cleanup leaves account-level secrets, the Supabase project, database objects, migrations, RLS policies and existing cloud records untouched. The published deployment was not changed and may continue running its previous API version until separately republished. Birth calculations require explicit local consent and a manual Calculate action; internet is required for calculation and city search, not local settings.

Native static build: `EXPO_BUILD_METRO_PORT=20317 REPLIT_INTERNAL_APP_DOMAIN=soul-compass-prototype.replit.app pnpm --filter @workspace/soul-compass run build`. The build starts its own Metro process with the stable production API origin; use a free port, not the Expo preview server's port. Production mode requires `REPLIT_INTERNAL_APP_DOMAIN` and refuses a development/preview fallback. It also fails if a Metro process is already running on the selected port, because its embedded API origin cannot be verified. The generated iOS and Android bundles are checked for the configured API origin, complete asset references, a reachable Expo Go icon, and missing source maps. `static-build/` is ignored by Git and workspace upload. Builds do not publish, sign, or install an app on a phone.

Web export: `pnpm --filter @workspace/soul-compass exec expo export --platform web --output-dir /tmp/soul-compass-web`. Expo Doctor reports 20/20 checks. Metro is capped at one transform worker after a concurrent verification run encountered an out-of-memory kill. Prefer serial production builds in this workspace. A static iOS/Android bundle was built and checked, but physical Expo Go/iPhone/Android behavior and signed-device builds remain unverified.

The API server runs through the existing `artifacts/api-server: API Server` workflow and requires the injected `PORT`. No astronomical data download, API key, paid calculation provider, or extra cloud service is required for the current position endpoint.

This is not a public-release approval. The API is hosted at the same HTTPS deployment origin as the app under `/api`. Do not use a real person's birth details for deployment checks. Daily reflections calculate eligible natal/transit themes on-device; the 93-stone catalog is a curated guide rather than a comprehensive mineral encyclopedia. Read `reports/soul-compass-launch/PRODUCTION_READINESS_AUDIT_2026-11-07.md` for the current device, privacy, cost, and distribution gates.

## Production API status — 8 November 2026

Replit reports an active public Autoscale deployment with a successful build. Synthetic smoke checks against its public API returned:

- `GET /api/healthz`: 200.
- `GET /api/astrology/health`: 200 for the published origin; 403 for an unrelated origin. The allowed origin was returned in CORS headers.
- `POST /api/astrology/positions`: 200 with ten planetary positions and the expected `input`, `metadata`, and `positions` fields.
- `POST /api/astrology/natal-chart`: 200 for one synthetic unknown-time profile, with the expected chart response fields. Unknown time correctly returned no angles or timed house cusps.
- `GET /api/geocoding/cities?q=Budapest`: 200 with one result matching the generated `CityLocation` shape. One Geoapify Free request was consumed. An invalid one-character query returned a sanitized 400 without a provider lookup.
- The health response included `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.

The published API is not yet the current workspace version: unauthenticated `GET /api/me/profile` returns 401 in production, while the workspace version returns 404. The old protected route is still registered in the published service; no profile was read. The current source’s Geoapify EU hostname is not confirmed in production from HTTP responses. Production rate limits were not stress-tested to avoid filling the calculation or provider quota; the current source’s API suite covers rate-limit behavior, including independent processes.

The cleanup has not been published. The public calculation and city-search endpoints remain compatible in these single-request checks, but the production/workspace difference for `/api/me/*` remains until a separately approved publish. These smoke requests incremented operational calculation counters; the single city query also used one Geoapify Free request. No production settings, database schema, Supabase data, or secrets were changed.

Deployment logs also emitted a PostgreSQL connection-string advisory about SSL-mode alias semantics changing in a future major driver release. The tested requests still succeeded, including the database-backed city quota reservation. No connection parameters were changed; before a future PostgreSQL driver major upgrade, confirm explicit TLS verification through the Replit Secrets workflow.
