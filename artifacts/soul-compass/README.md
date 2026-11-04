# Soul Compass

Expo + React Native app with COSMOS and CRYSTALS tabs, local profile storage, birthplace/current-residence separation, optional birth time, and public city search.

The API server now has an initial astronomy calculation endpoint. It is a foundation, not a complete personalized astrology product: the UI still displays clearly labeled sample content until natal charts and daily transit interpretation are integrated and validated.

## Development

- Web app: `pnpm --filter @workspace/soul-compass run dev:web`
- Expo Go tunnel: `pnpm --filter @workspace/soul-compass run dev`
- API server: `pnpm --filter @workspace/api-server run dev`
- API typecheck/tests: `pnpm --filter @workspace/api-server run typecheck` and `pnpm --filter @workspace/api-server run test`

See [architecture](ARCHITECTURE.md), [engine notes](ASTROLOGY_ENGINE.md), [API](API_DOCUMENTATION.md), [testing](TESTING.md), [deployment](DEPLOYMENT.md), and [licenses](LICENSES_AND_DATA_SOURCES.md).
