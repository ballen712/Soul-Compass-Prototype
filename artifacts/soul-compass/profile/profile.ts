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
  homeLocation: HomeLocation;
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
    mayUseAscendant: birthTimeKnown,
    mayUseMidheaven: birthTimeKnown,
    mayUseHouses: birthTimeKnown,
    mayUseTimeSensitiveInterpretations: birthTimeKnown,
    precisionNote: birthTimeKnown
      ? 'Prototype sample only: this horoscope and crystal suggestion are not personalized or calculated.'
      : 'Prototype sample only: this horoscope and crystal suggestion are not personalized or calculated. Birth time is unknown, so future chart readings would have reduced precision and omit the Ascendant, Midheaven, houses, and other time-sensitive details.',
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
