# Astrology engine status

## Implemented foundation

The Node API server wraps `astronomy-engine` 2.1.19 behind `EphemerisProvider`. It calculates Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto positions at a supplied UTC instant. The output uses geocentric apparent vectors transformed into the true ecliptic of date, tropical zodiac signs, and a centered 24-hour finite difference for daily longitude speed/retrograde status. Major aspect angular separation and configurable luminary/other orb matching helpers are present.

## Important limits

This choice uses Astronomy Engine's bundled algorithms and coefficients; it does **not** load a separate JPL DE440/DE441 dataset. It therefore does not meet the brief's independent JPL-dataset verification target. Do not describe these results as DE440 data or as independently validated against JPL. UTC instants are currently required; historical local birth-time conversion, natal houses/angles, full daily event searches, lunar uncertainty ranges, and a regression chart are not implemented.

The API currently returns a planetary snapshot only. The app still labels its horoscope and crystal content as sample, not calculated or personalized.

## Conventions

- Zodiac: tropical.
- Position: geocentric, apparent, ecliptic of date.
- Input/output time: ISO UTC.
- Longitude: normalized to `[0, 360)`.
- Speed: centered numerical derivative over 24 hours.

## Upgrade path

Before presenting natal charts as accurate, evaluate Skyfield with an appropriately sized JPL ephemeris file, verify the dataset terms, historical time-zone conversion, house algorithms, and independent reference tolerances. Keep the provider boundary and replace only the provider adapter after the validation work.
