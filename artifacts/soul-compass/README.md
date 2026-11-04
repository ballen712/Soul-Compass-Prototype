# Soul Compass

Local-first Expo + React Native app with COSMOS, CRYSTALS and NATAL tabs. No registration or authentication. A versioned AsyncStorage record holds birth details, optional residence, preferences, collection and revocable astrology API consent.

The API server calculates planetary snapshots and natal charts. NATAL sends minimal birth inputs only after explicit consent AND a Calculate chart action. It displays real positions, angles, Placidus houses and aspects, with explicit unknown-time and polar limitations. COSMOS and CRYSTALS daily readings remain clearly labeled sample content; daily transit interpretation is not yet personalized.

Local data is not encrypted or synchronized. App/browser storage removal may lose data; OS backups may include app data. Export/import is not implemented. Cloud-only profiles remain untouched and are not automatically recovered. Supabase migrations, RLS and protected backend endpoints are preserved but not used by the active app. Historical Phase 3 documents describe the dormant account implementation, not current setup requirements.

## Development

- Web app: `pnpm --filter @workspace/soul-compass run dev:web`
- Expo Go tunnel: `pnpm --filter @workspace/soul-compass run dev`
- API server: `pnpm --filter @workspace/api-server run dev`
- API typecheck/tests: `pnpm --filter @workspace/api-server run typecheck` and `pnpm --filter @workspace/api-server run test`
- Client tests: `pnpm --filter @workspace/soul-compass test`
- Native static build against the managed Metro server: `EXPO_BUILD_METRO_PORT=20060 pnpm --filter @workspace/soul-compass run build` (generates ignored `static-build/`; does not publish or sign an app)

See [architecture](ARCHITECTURE.md), [engine notes](ASTROLOGY_ENGINE.md), [API](API_DOCUMENTATION.md), [testing](TESTING.md), [deployment](DEPLOYMENT.md), and [licenses](LICENSES_AND_DATA_SOURCES.md).

See the [local-first implementation and verification report](LOCAL_FIRST_IMPLEMENTATION.html) for current results and remaining device/Expo checks.
