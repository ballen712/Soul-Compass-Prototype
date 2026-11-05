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
};

export function getChartPrecision(profile: UserProfile): ChartPrecision {
  const birthTimeKnown = profile.birthTime.status === 'known';
  return {
    birthTimeKnown,
    mayUseAscendant: false,
    mayUseMidheaven: false,
    mayUseHouses: false,
    mayUseTimeSensitiveInterpretations: birthTimeKnown,
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
