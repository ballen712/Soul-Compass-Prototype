# Deployment

The API server runs through the existing `artifacts/api-server: API Server` workflow and requires the injected `PORT`. No astronomical data download, API key, paid calculation provider, or extra cloud service is required for the current position endpoint.

This is not a complete daily-reading astrology deployment. Natal calculations are connected and have a limited independent JPL comparison; daily transit/interpretation services remain incomplete. Keep COSMOS/CRYSTALS sample labels. Historical birth conversion depends on the deployed Node/ICU time-zone database; metadata reports its version, so runtime upgrades should rerun the historical-time tests.
