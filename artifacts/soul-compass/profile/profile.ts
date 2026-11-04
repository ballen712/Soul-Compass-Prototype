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
      ? 'Daily reflections use your birth date, time and birth city. For Ascendant, Midheaven and houses, calculate your full chart in NATAL.'
      : 'Birth time is unknown. Daily reflections use only planet signs stable across a conservative birth-time range; rising sign and houses are not assumed.',
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
