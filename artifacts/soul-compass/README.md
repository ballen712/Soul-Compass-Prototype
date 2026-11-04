# Soul Compass

Expo + React Native app with COSMOS and CRYSTALS tabs, local profile storage, birthplace/current-residence separation, optional birth time, and public city search.

The API server calculates planetary snapshots and natal charts. The NATAL tab consumes saved birth details and displays real positions, angles, Placidus houses and aspects, with explicit unknown-time and polar limitations. COSMOS and CRYSTALS daily readings remain clearly labeled sample content; daily transit interpretation is not yet personalized.

## Development

- Web app: `pnpm --filter @workspace/soul-compass run dev:web`
- Expo Go tunnel: `pnpm --filter @workspace/soul-compass run dev`
- API server: `pnpm --filter @workspace/api-server run dev`
- API typecheck/tests: `pnpm --filter @workspace/api-server run typecheck` and `pnpm --filter @workspace/api-server run test`

See [architecture](ARCHITECTURE.md), [engine notes](ASTROLOGY_ENGINE.md), [API](API_DOCUMENTATION.md), [testing](TESTING.md), [deployment](DEPLOYMENT.md), and [licenses](LICENSES_AND_DATA_SOURCES.md).
