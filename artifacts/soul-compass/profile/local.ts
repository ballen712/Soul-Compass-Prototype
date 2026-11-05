import { z } from 'zod';

export const CONSENT_VERSION = '2026-11-04-v3';
export const LOCAL_KEY = 'soul-compass.local.v2';
export const LEGACY_KEY = 'soul-compass.profile.v1';
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Enter a valid calendar date as YYYY-MM-DD.');
export const LocationSchema = z.object({
  city: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  timeZone: z.string().min(1).max(100).refine(value => {
    try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
  }, 'Choose a valid IANA time zone.'),
}).strict();
export const BirthTimeSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('unknown') }).strict(),
  z.object({ status: z.literal('known'), localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }).strict(),
]);
export const ProfileSchema = z.object({
  birthDate: DateSchema,
  birthTime: BirthTimeSchema,
  birthPlace: LocationSchema,
  currentResidence: LocationSchema.nullable(),
}).strict();
const ids = z.array(z.string().regex(/^[a-z0-9-]{1,64}$/)).max(128)
  .refine(items => new Set(items).size === items.length, 'Remove duplicate crystal IDs.');
export const PreferencesSchema = z.object({
  language: z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/).max(35),
  crystalCollection: ids,
  crystalPreferences: z.object({
    intentions: z.array(z.string().trim().min(1).max(40)).max(20),
    hiddenCrystals: ids,
    feeling: z.string().max(40).nullable().default(null),
  }).strict(),
}).strict();
export type LocalPreferences = z.infer<typeof PreferencesSchema>;
export const defaultPreferences = (): LocalPreferences => ({
  language: 'en', crystalCollection: [], crystalPreferences: { intentions: [], hiddenCrystals: [], feeling: null },
});
const timestamp = z.string().datetime().nullable();
export const PrivacySchema = z.object({
  astrologyApiConsent: z.boolean(),
  consentTimestamp: timestamp,
  consentVersion: z.string().nullable(),
  revokedAt: timestamp,
}).strict().refine(p => !p.astrologyApiConsent || Boolean(p.consentTimestamp && p.consentVersion && !p.revokedAt),
  'Consent requires its timestamp and version.');
export type LocalPrivacy = z.infer<typeof PrivacySchema>;
export const defaultPrivacy = (): LocalPrivacy => ({
  astrologyApiConsent: false, consentTimestamp: null, consentVersion: null, revokedAt: null,
});
export const DraftSchema = z.object({
  birthDate: DateSchema.optional(),
  birthTime: BirthTimeSchema.optional(),
  currentResidence: LocationSchema.nullable().optional(),
}).strict();
export const LocalRecordSchema = z.object({
  schemaVersion: z.literal(2),
  profile: ProfileSchema.nullable(),
  preferences: PreferencesSchema,
  privacy: PrivacySchema,
  onboardingDraft: DraftSchema.nullable(),
}).strict();
export type LocalRecord = z.infer<typeof LocalRecordSchema>;
export const emptyRecord = (): LocalRecord => ({
  schemaVersion: 2, profile: null, preferences: defaultPreferences(), privacy: defaultPrivacy(), onboardingDraft: null,
});
