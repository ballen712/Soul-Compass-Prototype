# Architecture

- Expo Router owns COSMOS/CRYSTALS/NATAL and onboarding/settings.
- A serialized local store owns one schema-versioned AsyncStorage record containing birth details, mandatory `birthPlace`, optional `currentResidence`, preferences and consent. Existing legacy data is retained unchanged. No auth provider or cloud profile client is mounted.
- The Express API server owns astronomy calculations; no astronomical library is imported into the Expo bundle.
- `EphemerisProvider` isolates calculations from the route layer and permits a future provider replacement.
- The initial provider is Astronomy Engine. It runs offline and needs no calculation API key or downloaded data file.
- Public city lookup is user-initiated and sends only the typed city string. It is not used for birth data transmission.

Natal data flow: saved local profile -> explicit consent -> Calculate chart -> request-time consent guard -> generated API function -> POST `/api/astrology/natal-chart` -> historical wall-clock resolution -> provider positions -> angle/Placidus/aspect calculations -> NATAL screen. Residence is never a natal input. Profile edits, reloads and navigation do NOT automatically calculate. Requests are deduplicated, have a 20-second timeout and are aborted on consent revocation; late responses are ignored. No queued offline sends or automatic retries. Repeated-time disambiguation is an explicit chart-session choice; it does not modify the stored profile. The optional technical view reveals positions, velocities and house cusps.

`profile/local.ts` validates the versioned record. `profile/storage.ts` serializes writes, handles migration and consent. `profile/context.ts` isolates context identity from refreshable components. `ProfileContext.tsx` connects the store to React. `services/natal.ts` minimizes the request; `useNatalCalculation` controls visible request state.

Only a previously saved local record is migrated. Cloud-only data remains in Supabase and is not recovered. Dormant auth modules and backend protected routes are retained for future optional accounts, but are unreachable from active app imports. Existing sessions are not read, refreshed or deleted.

The current-sky snapshot still uses `/api/astrology/positions`. Daily event searches, generated daily interpretations and personalized crystals are not part of the natal service.
