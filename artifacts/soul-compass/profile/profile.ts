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
      ? 'Sample content only; chart calculations are not connected yet.'
      : 'Birth time is unknown, so this reading has reduced precision. It does not use the Ascendant, Midheaven, houses, or other time-sensitive chart details. Sample content only; chart calculations are not connected yet.',
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
