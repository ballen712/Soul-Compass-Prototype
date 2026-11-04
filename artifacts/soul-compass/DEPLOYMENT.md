# Deployment

The active app needs no Supabase credentials or provider configuration. Existing secrets and protected cloud infrastructure have not been removed. Birth calculations require explicit local consent and a manual Calculate action; internet is required for calculation and city search, not local settings.

Native static build: `EXPO_BUILD_METRO_PORT=20060 pnpm --filter @workspace/soul-compass run build` against the managed Metro server. The optional build-only port override avoids confusing another service on port 8081 with Metro; the default deployment port is unchanged. The build health check requires the actual Metro status body, not merely HTTP 200. Generated `static-build/` is ignored by Git and workspace upload; production builds generate it again. Builds do not publish or install an app on a phone.

Web export: `pnpm --filter @workspace/soul-compass exec expo export --platform web --output-dir /tmp/soul-compass-web`. Native static builds and web exports passed for the local-first milestone. Expo Doctor reported 19/20 checks passing; version alignment remains blocked by the project's minimum package-release-age safeguard. Do not bypass it. Physical Expo Go/iPhone and signed-device builds remain unverified.

The API server runs through the existing `artifacts/api-server: API Server` workflow and requires the injected `PORT`. No astronomical data download, API key, paid calculation provider, or extra cloud service is required for the current position endpoint.

This is not a complete daily-reading astrology deployment. Natal calculations are connected and have a limited independent JPL comparison; daily transit/interpretation services remain incomplete. Keep COSMOS/CRYSTALS sample labels. Historical birth conversion depends on the deployed Node/ICU time-zone database; metadata reports its version, so runtime upgrades should rerun the historical-time tests.
