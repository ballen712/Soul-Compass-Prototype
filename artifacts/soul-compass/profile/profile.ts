export type BirthTime =
  | { status: 'known'; localTime: string }
  | { status: 'unknown' };

export type HomeLocation = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timeZone: string;
};

export type UserProfile = {
  birthDate: string;
  birthTime: BirthTime;
  birthPlace: HomeLocation;
  currentResidence: HomeLocation | null;
};

export type ProfileFormDraft = {
  birthDate?: string;
  birthTime?: BirthTime;
  currentResidence?: HomeLocation | null;
};

export type ChartPrecision = {
  birthTimeKnown: boolean;
  mayUseAscendant: boolean;
  mayUseMidheaven: boolean;
  mayUseHouses: boolean;
  mayUseTimeSensitiveInterpretations: boolean;
  precisionNote: string;
};

export function getChartPrecision(profile: UserProfile): ChartPrecision {
  const birthTimeKnown = profile.birthTime.status === 'known';
  return {
    birthTimeKnown,
    mayUseAscendant: false,
    mayUseMidheaven: false,
    mayUseHouses: false,
    mayUseTimeSensitiveInterpretations: birthTimeKnown,
    precisionNote: birthTimeKnown
      ? 'Planet positions use your birth date, time, and birth city. Ascendant, Midheaven, and houses are not included.'
      : 'Birth time is unknown, so only planet signs stable throughout the possible birth day are used. Ascendant, Midheaven, houses, and other time-sensitive chart details are excluded.',
  };
}

export function getHomeDateTimeLabel(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(now);
}
