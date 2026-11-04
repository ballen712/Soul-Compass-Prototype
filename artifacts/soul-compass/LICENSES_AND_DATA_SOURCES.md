# Licenses and data sources

This is a scoped audit of the new calculation component, not a full transitive dependency audit.

| Component | Version | License | Source | Commercial use / conditions |
|---|---:|---|---|---|
| Astronomy Engine | 2.1.19 | MIT | https://github.com/cosinekitty/astronomy | Permissive; include copyright and license notice with redistribution. |

No external planetary-position API or separately downloaded ephemeris dataset is used. Astronomy Engine contains the calculation algorithms/coefficients in its MIT-licensed package. This is not NASA/JPL DE440 or DE441 data.

The existing city search uses Open-Meteo/GeoNames; its non-commercial free endpoint restriction, attribution links, and CC BY 4.0 notice remain documented in the city picker. A complete audit of all app/API transitive dependencies and city-data terms remains outstanding.
