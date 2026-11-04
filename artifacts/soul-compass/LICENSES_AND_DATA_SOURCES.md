# Licenses and data sources

This is a scoped audit of the new calculation component, not a full transitive dependency audit.

| Component | Version | License | Source | Commercial use / conditions |
|---|---:|---|---|---|
| Astronomy Engine | 2.1.19 | MIT | https://github.com/cosinekitty/astronomy | Permissive; include copyright and license notice with redistribution. |

No external planetary-position API or separately downloaded ephemeris dataset is used. Astronomy Engine contains the calculation algorithms/coefficients in its MIT-licensed package. This is not NASA/JPL DE440 or DE441 data.

City search now uses Geoapify Forward Geocoding (`type=city`) through the Express server, not Open-Meteo. The owner confirmed the Free plan. Geoapify's published Free-plan terms permit commercial apps/production within its limits, with Geoapify and OpenStreetMap attribution; both links appear beside every search. Published allowance: 3,000 credits/day, up to five requests/second; a geocoding call costs one credit. Account-wide usage, other projects and dashboard settings still require owner monitoring. No subscription was created.

Terms checked 4 November 2026: https://www.geoapify.com/pricing/ and https://www.geoapify.com/terms-and-conditions/#attribution. API documentation: https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/. Data-source attribution: https://www.openstreetmap.org/copyright. Provider privacy: https://www.geoapify.com/privacy-policy/.

The server forwards only the typed query and fixed city-search parameters, not the profile or end-user headers/IP. Normal server connection metadata still reaches Geoapify. Its published privacy policy describes request logging and generally no more than 24 hours for successful requests; error logging may differ. This is a review of published terms, not a verified dashboard entitlement, legal certification or full transitive license audit. The previous launch report's Open-Meteo blocker is superseded by GEOAPIFY_INTEGRATION.html; its other device/legal/release gates remain.
