# Soul Compass

Local-first Expo and React Native app for daily astrology-inspired reflection, a crystal guide, and natal-chart exploration. The app does not require user registration or cloud profile synchronization.

## Run and verify

- Expo preview: `pnpm --filter @workspace/soul-compass run dev`
- Browser preview: `pnpm --filter @workspace/soul-compass run dev:web`
- API server: `pnpm --filter @workspace/api-server run dev`
- Full workspace TypeScript check: `pnpm run typecheck`
- API tests: `pnpm --filter @workspace/api-server run test`
- App tests: `pnpm --filter @workspace/soul-compass run test`
- Expo compatibility: `pnpm --filter @workspace/soul-compass run check:compatibility`
- Production-style native bundle: use a free Metro port and `REPLIT_INTERNAL_APP_DOMAIN`; see `artifacts/soul-compass/DEPLOYMENT.md`. This does not publish or sign an app.

## Architecture

- Mobile profile, consent, language, preferences, mood, crystal collection, and cached chart are stored locally with AsyncStorage.
- Express API lives in `artifacts/api-server`; the public app and API share the deployment host, with API paths under `/api`.
- Astronomy Engine runs on the server for current-sky and natal calculations. Natal requests contain only the birth inputs needed for calculation and require saved local consent plus an explicit action.
- City search is an explicit request to the Express API and Geoapify. The provider key remains server-side. Replit PostgreSQL holds operational counters for city-search quotas and the aggregate astrology calculation cap, not app profiles.
- Supabase migrations, RLS, auth modules, and protected profile API code remain in the repository. The active mobile UI does not call the protected `/api/me` routes; do not remove or enable cloud-profile behavior without checking the local-first product decision and release audit.

## Operational constraints

- Never place Supabase service-role keys, database credentials, Geoapify keys, or other server secrets in Expo variables or client bundles.
- `EXPO_PUBLIC_*` values are public. `SUPABASE_SERVICE_ROLE_KEY` is intentionally not configured.
- Production static builds must use `REPLIT_INTERNAL_APP_DOMAIN`; the build refuses development/preview-host fallback and rejects a running Metro process whose environment cannot be verified.
- Geoapify usage is capped below the provider's reviewed free-plan allowance. Both astrology calculation endpoints use a shared, fail-closed PostgreSQL cap of 3,000 requests/minute across API instances; the legacy authenticated `/api/me` routes retain a bounded process-local peer limit. The shared calculation cap is in workspace code but not live until an approved publish.
- Do not apply database migrations, change deployment visibility, publish, or purchase services without explicit user approval.

## Source-of-truth docs

- Product architecture: `artifacts/soul-compass/ARCHITECTURE.md`
- Deployment and native build: `artifacts/soul-compass/DEPLOYMENT.md`
- Current production audit: `reports/soul-compass-launch/PRODUCTION_READINESS_AUDIT_2026-11-07.md`
- Draft policy, terms, and support: `reports/soul-compass-launch/`
