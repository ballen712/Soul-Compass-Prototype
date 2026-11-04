import { calculateNatalChart, type NatalChartRequest } from '@workspace/api-client-react';
import type { UserProfile } from '@/profile/profile';
import type { LocalProfileStore } from '@/profile/storage';

export type Disambiguation = 'earlier' | 'later';
/** No residence, names, preferences, account IDs or collection leave the device. */
export function natalRequest(profile: UserProfile, choice: Disambiguation | null): NatalChartRequest {
  return {
    birthDate: profile.birthDate,
    birthTime: profile.birthTime.status === 'known'
      ? { status: 'known', localTime: profile.birthTime.localTime, ...(choice ? { disambiguation: choice } : {}) }
      : { status: 'unknown' },
    birthPlace: {
      latitude: profile.birthPlace.latitude, longitude: profile.birthPlace.longitude,
      timeZone: profile.birthPlace.timeZone,
    },
    houseSystem: 'placidus', zodiac: 'tropical',
  };
}
export function requestNatal(
  permission: Pick<LocalProfileStore, 'withCalculationConsent'>,
  profile: UserProfile, choice: Disambiguation | null,
) {
  return permission.withCalculationConsent(signal =>
    calculateNatalChart(natalRequest(profile, choice), { signal }));
}
