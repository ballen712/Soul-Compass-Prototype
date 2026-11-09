import { getLocalizedCrystalCopy } from '../localization/crystal-copy';
import type { AppLocale } from '../localization';
import type { LocalPreferences } from './local';
import {
  calculateNatalElementBalance,
  calculateNatalElementBalanceFromPlacements,
  getHomeLocalDate,
  type DailyTransitAnalysis,
  type DailyAstrology,
  type NatalElementResult,
  type NatalPlacement,
} from './astrology';
import {
  getCrystalSuggestions,
  getNatalCrystalSuggestions,
  type CrystalRecommendation,
  type NatalCrystalRecommendation,
} from './crystal-guidance';
import { getDailyAstrology } from './daily-cache';
import type { UserProfile } from './profile';

type CopyTranslator = (source: string) => string;

export type DailyPersonalizationContext = {
  /** The calendar date used by the daily crystal selection. */
  date: string;
  /** Null when there is no saved profile from which to choose a home time zone. */
  timeZone: string | null;
  /** The existing local astrology result, including an explicit unavailable state. */
  astrology: DailyAstrology | null;
  /** Full, ranked transit analysis; null when chart calculation is unavailable. */
  transitAnalysis: DailyTransitAnalysis | null;
  natalProfile: {
    placements: readonly NatalPlacement[];
    elementBalance: NatalElementResult | null;
  };
  mood: {
    selectedMood: string | null;
    selectedDay: string | null;
  };
  crystals: {
    ownedCrystals: readonly string[];
    hiddenCrystals: readonly string[];
    intentions: readonly string[];
    natalRecommendations: readonly NatalCrystalRecommendation[];
    dailyCandidates: readonly CrystalRecommendation[];
  };
};

export type DailyPersonalizationInput = {
  profile: UserProfile | null;
  preferences: LocalPreferences;
  now: Date;
  locale: AppLocale;
  translate: CopyTranslator;
  translateStoneName?: CopyTranslator;
};

type CacheEntry = {
  key: string;
  context: DailyPersonalizationContext;
};

// One-entry, device-memory cache per immutable profile. It lets both tab screens
// consume the same derived context without retaining another copy of profile data.
const cache = new WeakMap<UserProfile, CacheEntry>();
let profilelessCache: CacheEntry | null = null;

function makeInputKey(
  input: DailyPersonalizationInput,
  date: string,
  timeZone: string | null,
): string {
  const { preferences, now, locale } = input;
  return JSON.stringify({
    minute: Math.floor(now.getTime() / 60_000),
    date,
    timeZone,
    locale,
    mood: preferences.crystalPreferences.feeling,
    moodDay: preferences.crystalPreferences.feelingDate ?? null,
    collection: preferences.crystalCollection,
    hidden: preferences.crystalPreferences.hiddenCrystals,
    intentions: preferences.crystalPreferences.intentions,
  });
}

/**
 * Builds the shared local-only context from the calculations already used by
 * Cosmos and Crystals. No profile, mood, or collection data is sent to the API.
 */
export function getDailyPersonalizationContext(
  input: DailyPersonalizationInput,
): DailyPersonalizationContext {
  const { profile, preferences, now, locale, translate } = input;
  const home = profile
    ? profile.currentResidence ?? profile.birthPlace
    : null;
  const timeZone = home?.timeZone ?? null;
  // Preserve the existing Crystals fallback format when no profile is available.
  const date = home
    ? getHomeLocalDate(now, home)
    : `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const key = makeInputKey(input, date, timeZone);
  const saved = profile ? cache.get(profile) : profilelessCache;
  if (saved?.key === key) return saved.context;

  const astrology = profile ? getDailyAstrology(profile, now) : null;
  const elementBalance = profile
    ? astrology?.status === 'calculated'
      ? calculateNatalElementBalanceFromPlacements(
          astrology.natalPlacements,
          astrology.preciseBirthMoment,
        )
      : calculateNatalElementBalance(profile)
    : null;
  const translateStoneName = input.translateStoneName
    ?? ((name: string) => getLocalizedCrystalCopy(name, locale)?.name ?? name);
  const hiddenCrystals = [...preferences.crystalPreferences.hiddenCrystals];
  const ownedCrystals = [...preferences.crystalCollection];
  const dailyAstrology = astrology?.status === 'calculated' ? astrology : undefined;
  const natalRecommendations = elementBalance?.status === 'calculated'
    ? getNatalCrystalSuggestions(
        elementBalance,
        hiddenCrystals,
        8,
        translate,
        translateStoneName,
        ownedCrystals,
      )
    : [];
  const dailyCandidates = getCrystalSuggestions(
    dailyAstrology,
    {
      hiddenCrystals,
      crystalCollection: ownedCrystals,
      feeling: preferences.crystalPreferences.feeling,
      dateKey: date,
    },
    3,
    translate,
    translateStoneName,
  );

  const context: DailyPersonalizationContext = {
    date,
    timeZone,
    astrology,
    transitAnalysis: astrology?.status === 'calculated'
      ? astrology.transitAnalysis ?? null
      : null,
    natalProfile: {
      placements: astrology?.status === 'calculated' ? astrology.natalPlacements : [],
      elementBalance,
    },
    mood: {
      selectedMood: preferences.crystalPreferences.feeling,
      selectedDay: preferences.crystalPreferences.feelingDate ?? null,
    },
    crystals: {
      ownedCrystals,
      hiddenCrystals,
      intentions: [...preferences.crystalPreferences.intentions],
      natalRecommendations,
      dailyCandidates,
    },
  };

  const entry = { key, context };
  if (profile) cache.set(profile, entry);
  else profilelessCache = entry;
  return context;
}
