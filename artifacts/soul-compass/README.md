# Soul Compass

Current operational/release guidance: [production hardening report](GEOAPIFY_HARDENING.html). Owner-approved Replit PostgreSQL enforces shared Geoapify budgets/source limits and a global astrology calculation cap; no profiles moved off-device. The latest production status and remaining release gates are in `reports/soul-compass-launch/PRODUCTION_READINESS_AUDIT_2026-11-07.md`.

Local-first Expo + React Native app with COSMOS, CRYSTALS and NATAL tabs. No registration or authentication. A versioned AsyncStorage record holds birth details, optional residence, preferences, collection and revocable astrology API consent.

The API server calculates planetary snapshots and full natal charts. NATAL sends minimal birth inputs only after explicit consent AND a Calculate chart action. It displays real positions, angles, Placidus houses and aspects, with explicit unknown-time and polar limitations. COSMOS also uses the existing on-device Astronomy Engine for limited personal daily transit reflections when a separate current residence is saved. For CRYSTALS, the saved residence's time zone sets the local calendar date and the stable daily tie-break; geocentric positions are calculated for the current instant, and residence coordinates do not directly affect the stone score. Recognized intentions and an optional daily feeling can also guide the match. Symbolic meanings are not scientific/medical effects. Unavailable daily calculations retain clearly labeled sample content.

Local data is not encrypted or synchronized. App/browser storage removal may lose data; OS backups may include app data. Export/import is not implemented. Cloud-only profiles remain untouched and are not automatically recovered. Supabase migrations, RLS and protected backend endpoints are preserved; the active mobile UI does not call the protected `/api/me` profile routes, which remain a release decision. Historical Phase 3 documents describe the dormant account implementation, not current setup requirements.

## Development

- Web app: `pnpm --filter @workspace/soul-compass run dev:web`
- Expo Go tunnel: `pnpm --filter @workspace/soul-compass run dev`
- API server: `pnpm --filter @workspace/api-server run dev`
- API typecheck/tests: `pnpm --filter @workspace/api-server run typecheck` and `pnpm --filter @workspace/api-server run test`
- Client tests: `pnpm --filter @workspace/soul-compass test`
- Native static build: use a free Metro port and the stable production host, for example `EXPO_BUILD_METRO_PORT=20317 REPLIT_INTERNAL_APP_DOMAIN=soul-compass-prototype.replit.app pnpm --filter @workspace/soul-compass run build` (generates ignored `static-build/`; refuses development-host fallback and does not publish or sign an app)

See [architecture](ARCHITECTURE.md), [engine notes](ASTROLOGY_ENGINE.md), [API](API_DOCUMENTATION.md), [testing](TESTING.md), [deployment](DEPLOYMENT.md), and [licenses](LICENSES_AND_DATA_SOURCES.md).

See the [local-first implementation and verification report](LOCAL_FIRST_IMPLEMENTATION.html) for current results and remaining device/Expo checks.

The older [product audit and launch checklist](LAUNCH_READINESS.html) is a historical snapshot; use the current readiness report linked above. The app currently includes English, Hungarian, Italian, German, French, Spanish, and Russian. Official support contact: Soul Compass Support — soulcompass.support@gmail.com. The [Geoapify integration verification](GEOAPIFY_INTEGRATION.html) supersedes the old Open-Meteo eligibility blocker: server-backed Geoapify Free permits commercial use within its reviewed quota and attribution conditions. The current prototype has a public Replit Autoscale deployment; this is not TestFlight or App Store publication.
