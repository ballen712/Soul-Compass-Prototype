# Testing

Run:

- `pnpm --filter @workspace/api-server run typecheck`
- `pnpm --filter @workspace/api-server run test`
- `pnpm --filter @workspace/api-server run build`
- `pnpm --filter @workspace/soul-compass run typecheck`
- `pnpm --filter @workspace/soul-compass exec expo export --platform web`

Current automated tests cover deterministic output, longitude normalization/sign boundaries, wraparound separation/aspects, and invalid dates. They do not yet establish astronomical accuracy against an independent ephemeris or validate time zones, houses, exact transit events, or daily event boundaries.
