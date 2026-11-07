---
name: Astrology profile rules
description: Confirmed Soul Compass requirements for home location and unknown birth times.
---

Collect a mandatory birthplace and store its city, country, coordinates, and IANA time zone separately from an optional current residence. Ask for birthplace during onboarding; manage current residence separately in Settings. Use birthplace only for natal-chart inputs. For daily readings, use the current residence time zone when set, otherwise fall back to the birthplace time zone so daily guidance and crystal suggestions remain available. Do not infer or collect GPS location. Keep both locations independently editable and retain the approved city-search provider’s attribution and privacy notice.

Birth time is optional. Onboarding must include an explicit “I don't know my birth time” choice and permit continuing without a time. Store whether birth time is known instead of assigning an assumed time. Support timed and untimed charts throughout the astrology engine, horoscope generation, and crystal recommendations. For untimed charts, calculate and present only placements and transit relationships that remain reliable; do not claim accurate Ascendant, Midheaven, houses, or other time-sensitive interpretations. Explain the reduced precision, and let users add or correct their birth time later in profile settings.

**Why:** the user asked to keep first-run setup simple and make residence optional, while ensuring daily crystal guidance still appears without a residence.

**How to apply:** carry these constraints through onboarding, profile storage and Settings. Test that no residence is requested during onboarding, it can be edited or cleared in Settings, natal inputs always use birthplace, and daily local dates fall back to birthplace only when residence is unset.

Retain MIT-licensed Astronomy Engine behind the existing provider boundary unless there is a compelling technical reason to replace it. Do not add Swiss Ephemeris, GPL/AGPL dependencies, paid APIs/datasets, or commercial ephemeris licensing. A limited independent comparison is not permission to claim universal precision or JPL DE-file usage.

**Why:** the user explicitly required this in the natal-engine phase, preserving the existing TypeScript architecture rather than replacing the provider.

**How to apply:** keep astronomical calculations server-side and distinguish calculated natal data from sample daily readings. Extend independent reference coverage as needed instead of silently swapping providers.

Default houses must be Placidus; if unsuitable, warn without silently substituting a system. Unknown-time natal charts may use a documented local-noon reference but must omit angles/houses and explain Moon uncertainty. Repeated birth wall-clock times require an explicit occurrence choice, not an assumed offset.

**Why:** the user requires honest precision and no fabricated birth moment or hidden house-system fallback.

**How to apply:** retain these distinctions in future calculation APIs, chart displays and interpretations; never treat reference-noon placements as a known birth instant.

When saved birth date, time, or birthplace changes, invalidate the old chart by its natal-input identity, allow a fresh request for the new identity even if an older request is still finishing, and never let a stale response replace the new chart. Current residence affects local daily readings but is not a natal-chart input.

**Why:** an automatic refresh can start its asynchronous cache lookup before the profile-change effect runs; otherwise it may capture the prior request revision and discard the new chart request.

**How to apply:** keep chart refreshes keyed to birth date, time, and birthplace; refresh after a valid local save only while consent remains active, and test changes while a previous chart request is still in flight.

For daily crystal suggestions, the current residence's time zone sets the local calendar date when available; otherwise use the birthplace time zone. Planetary factors remain geocentric at the current instant, and neither city's coordinates directly affect the stone score. Do not add location-specific crystal scoring without an evidence-backed method and a product decision.

**Why:** the user wants crystal guidance available without requiring a residence, while the existing method keeps city coordinates out of crystal matching.

**How to apply:** describe the time-zone/date role plainly; test birthplace fallback, residence override, and that changing city coordinates without changing time zone does not change planetary factors or crystal matches.

Natal Chart interpretation copy should be simple, personal, and understandable to people unfamiliar with astrology. Explain placements through recognizable qualities and everyday behavior instead of relying on astrology jargon.

**Why:** the user wants people to understand what their planet, sign, and house placements may mean in ordinary life.

**How to apply:** keep placement labels for orientation, but translate planet, sign, and house combinations into clear, consistent examples across all placements.
