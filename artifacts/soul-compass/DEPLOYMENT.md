# Deployment

The active app needs no Supabase credentials or provider configuration. Existing secrets and protected cloud infrastructure have not been removed. Birth calculations require explicit local consent and a manual Calculate action; internet is required for calculation and city search, not local settings.

Native static build: `EXPO_BUILD_METRO_PORT=20060 pnpm --filter @workspace/soul-compass run build` against the managed Metro server. The optional build-only port override avoids confusing another service on port 8081 with Metro; the default deployment port is unchanged. The build health check requires the actual Metro status body, not merely HTTP 200. Generated `static-build/` is ignored by Git and workspace upload; production builds generate it again. Builds do not publish or install an app on a phone.

Web export: `pnpm --filter @workspace/soul-compass exec expo export --platform web --output-dir /tmp/soul-compass-web`. The earlier Expo alignment block is resolved normally: recommended SDK-compatible releases matured under the unchanged 24-hour package safeguard, and Doctor reports 20/20. Metro is capped at one transform worker after a concurrent verification run encountered an out-of-memory kill. Prefer serial production builds in this workspace. Physical Expo Go/iPhone/Android and signed-device builds remain unverified.

The API server runs through the existing `artifacts/api-server: API Server` workflow and requires the injected `PORT`. No astronomical data download, API key, paid calculation provider, or extra cloud service is required for the current position endpoint.

This is not a public-release approval. Daily reflections now calculate eligible natal/transit themes on-device, but the interpretation library and three-stone catalog remain deliberately limited. Unavailable daily results retain honest sample labels. Historical full-natal conversion depends on the deployed Node/ICU database; runtime upgrades should rerun historical-time tests. Read LAUNCH_READINESS.html for current device, city-provider, legal and distribution gates.
