import { z } from "zod";

const timeZone = z.string().min(1).max(100).refine((value) => {
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; }
}, "Use a valid IANA time zone.");
const location = z.object({
  city: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  timeZone,
}).strict();
const crystalIds = z.array(z.string().regex(/^[a-z0-9-]{1,64}$/)).max(128)
  .refine((items) => new Set(items).size === items.length, "Remove duplicate crystals.");
export const CloudProfileSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Use a valid birth date."),
  birthTime: z.discriminatedUnion("status", [
    z.object({ status: z.literal("unknown") }).strict(),
    z.object({ status: z.literal("known"), localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }).strict(),
  ]),
  birthPlace: location,
  currentResidence: location.nullable(),
}).strict();
export const CloudPreferencesSchema = z.object({
  language: z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/).max(35),
  crystalCollection: crystalIds,
  crystalPreferences: z.object({
    intentions: z.array(z.string().trim().min(1).max(40)).max(20),
    hiddenCrystals: crystalIds,
  }).strict(),
}).strict();
export const ProfileCreateSchema = z.object({ profile: CloudProfileSchema, preferences: CloudPreferencesSchema }).strict();
export const ProfileUpdateSchema = ProfileCreateSchema.extend({ expectedVersion: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) });
export type CloudPreferences = z.infer<typeof CloudPreferencesSchema>;
export const DEFAULT_CLOUD_PREFERENCES: CloudPreferences = {
  language: "en", crystalCollection: [], crystalPreferences: { intentions: [], hiddenCrystals: [] },
};
