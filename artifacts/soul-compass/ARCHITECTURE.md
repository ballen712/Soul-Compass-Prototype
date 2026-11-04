# Architecture

- Expo Router owns COSMOS/CRYSTALS/NATAL and onboarding/settings.
- AsyncStorage stores birth date/time, mandatory `birthPlace`, and optional `currentResidence` separately.
- The Express API server owns astronomy calculations; no astronomical library is imported into the Expo bundle.
- `EphemerisProvider` isolates calculations from the route layer and permits a future provider replacement.
- The initial provider is Astronomy Engine. It runs offline and needs no calculation API key or downloaded data file.
- Public city lookup is user-initiated and sends only the typed city string. It is not used for birth data transmission.

Natal data flow: saved birth profile -> generated `useCalculateNatalChart` hook -> POST `/api/astrology/natal-chart` -> historical wall-clock resolution -> provider positions -> angle/Placidus/aspect calculations -> NATAL screen. Residence is never a natal input. Profile edits/reloads recalculate the chart. Repeated-time disambiguation is an explicit chart-session choice; it does not modify the stored profile. The optional technical view reveals positions, velocities and house cusps.

The current-sky snapshot still uses `/api/astrology/positions`. Daily event searches, generated daily interpretations and personalized crystals are not part of the natal service.
