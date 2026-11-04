# Astrology engine status

## Daily-reflection scope

The merged daily feature also uses Astronomy Engine locally in Expo. It calculates eligible geocentric tropical natal/current planet factors and a conservative set of major transit aspects. Daily reflections require the separately saved current residence for the displayed local date; birthplace is never substituted. Full houses/angles and the authoritative detailed natal response remain server-based, behind saved consent and an explicit Calculate action. On-device daily use is not a claim that every calculation runs locally.

The visible reading uses the leading eligible aspect with one of five reviewed reflective templates, or an eligible natal factor if no close aspect exists. The crystal rule set is a three-stone symbolic pairing plus recognized intentions, not a scientific prediction. Read LAUNCH_READINESS.html for the complete current product inventory and limits.

## Implemented foundation

The Node API server wraps `astronomy-engine` 2.1.19 behind `EphemerisProvider`. It calculates Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto positions at a supplied UTC instant. The output uses geocentric apparent vectors transformed into the true ecliptic of date, tropical zodiac signs, and a centered 24-hour finite difference for daily longitude speed/retrograde status. Major aspect angular separation and configurable luminary/other orb matching helpers are present.

## Natal calculations

`POST /api/astrology/natal-chart` consumes birthplace coordinates and IANA zone, not residence. Local wall-clock times are resolved against historical offsets in the host Node ICU/IANA database (currently ICU 78.3, tzdata 2026a). Candidate historical offsets are sampled around the requested date, then each candidate UTC instant is round-tripped through the zone. No candidates means a skipped time; two candidates require an explicit earlier/later choice. The application never applies today's offset to an old birth date. The response identifies the host database version.

For unknown times, local noon is an explicitly labeled reference, not an asserted birth moment. Angles and houses are absent. The full local birth day is sampled every 30 minutes for Moon-sign possibilities, including both interval ends. Local day bounds handle 23/25-hour days and skipped midnight; wholly skipped calendar dates are rejected. Other reference placements/aspects remain time-dependent, as the warnings explain.

Angles use Astronomy Engine's Greenwich apparent sidereal time and true obliquity, east-positive longitude, geodetic latitude, and a geometric horizon without refraction. RA/declination are derived from ecliptic longitude at zero ecliptic latitude. The Ascendant is the rising ecliptic/horizon intersection (negative hour angle); MC is the ecliptic intersection with upper meridian. Descendant and IC are antipodes.

Placidus is the only implemented house system. Numerical bisection solves the ecliptic points whose diurnal/nocturnal semi-arcs are trisected. Semi-diurnal arc is `acos(-tan(latitude)*tan(declination))`. Cusps 11/12 have eastward meridian distances of one/two thirds of the semi-diurnal arc; cusps 2/3 divide the nocturnal arc. Opposite cusps differ by 180°. Wrapped-angle discontinuities are explicitly rejected as roots. Inside the polar circles, houses are refused with a warning; no other house system is silently substituted. Angles and planets remain available where their geometry is defined.

A planet exactly on a cusp belongs to the house beginning at that cusp; the interval ends before the next cusp. Nearest cusp distance is reported without moving planets into adjacent houses.

Major aspects use actual angular separation and configurable orbs (default 8° if either planet is a luminary, otherwise 6°; allowed >0 to 15°). Relative longitude velocities determine whether absolute aspect error is decreasing (applying) or increasing (separating). Exact/zero-relative-motion cases return null. Strength is `max(0, 1-orb/orbLimit)`; the exactness label means within 1°, not mathematical equality. These are calculation labels, not interpretations.

## Validation and limits

The regression city lookup returned 48.50834° N, 32.26618° E, Europe/Kyiv (GeoNames via Open-Meteo, city-only query). A general city centroid on Wikipedia is 48.50000° N, 32.26667° E; centroid choices introduce small angle differences. IANA's Europe/Kyiv history specifies standard 2h plus 1h summer offset on 1991-06-20. Local 19:51 therefore resolves to 16:51 UTC. Regression tests require Ascendant within 0.02° of Sagittarius 16.31° and MC within 0.02° of Libra 14.57°.

Independent NASA/JPL Horizons comparisons at 1991-06-20 16:51 UTC use observer quantity 31, centre `500@399`, target centres Sun (10), Moon (301), Mars (499), Jupiter (599), airless apparent ecliptic-of-date coordinates. Absolute longitude differences (degrees): Sun 0.0000401, Moon 0.0001422, Mars 0.0000948, Jupiter 0.0000938. Latitude differences are all below 0.0004°. Fixed regression tolerance is 0.001° for these samples. Horizons includes light-time, stellar aberration and gravitational deflection; this is a close convention match, not a proof that every correction is identical. This four-body, single-epoch check is not a comprehensive accuracy certification of all planets, epochs, houses or velocities.

Astronomy Engine still uses bundled algorithms/coefficients and does **not** load a separate JPL DE440/DE441 file. No runtime NASA call is made. Full daily transit-event searches, interpretation generation, and personalized crystal recommendations remain outside this natal phase. COSMOS and CRYSTALS sample readings remain marked sample; the new NATAL screen displays calculated data.

## Conventions

- Zodiac: tropical.
- Position: geocentric, apparent, ecliptic of date.
- Input/output time: ISO UTC.
- Longitude: normalized to `[0, 360)`.
- Speed: centered numerical derivative over 24 hours.

## Mathematical and data references

- Astronomy Engine API: https://github.com/cosinekitty/astronomy (SiderealTime, Earth tilt, apparent vectors).
- Placidus semi-arc equations and numerical root concerns: https://morinus-astrology.com/placidus-cusps and https://www.skyscript.co.uk/placido.html (mathematical references; no third-party source code copied).
- IANA Europe time-zone history: https://data.iana.org/time-zones/tzdb-2025b/europe (Europe/Kyiv).
- NASA/JPL observer conventions: https://ssd.jpl.nasa.gov/horizons/manual.html and https://ssd-api.jpl.nasa.gov/doc/horizons.html.
- City verification: https://geocoding-api.open-meteo.com/v1/search?name=Kropyvnytskyi&count=1 and https://en.wikipedia.org/wiki/Kropyvnytskyi.
