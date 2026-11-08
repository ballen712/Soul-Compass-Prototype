import { calculateNatalChart, type NatalChartRequest } from '@workspace/api-client-react';
import { CONSENT_VERSION } from '@/profile/local';
import type { UserProfile } from '@/profile/profile';
import type { LocalProfileStore } from '@/profile/storage';

export type Disambiguation = 'earlier' | 'later';
type NatalChartCalculationInputs = Omit<NatalChartRequest, 'consentAccepted' | 'consentVersion'>;
/** No residence, names, preferences, account IDs or collection leave the device. */
export function natalRequest(profile: UserProfile, choice: Disambiguation | null): NatalChartCalculationInputs {
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
/** Local cache identity: excludes residence, names and the selected repeated-hour occurrence. */
export function natalChartCacheKey(profile: UserProfile): string {
  return JSON.stringify(natalRequest(profile, null));
}
export function requestNatal(
  permission: Pick<LocalProfileStore, 'withCalculationConsent'>,
  profile: UserProfile, choice: Disambiguation | null,
) {
  return permission.withCalculationConsent(signal =>
    calculateNatalChart({
      ...natalRequest(profile, choice),
      consentAccepted: true,
      consentVersion: CONSENT_VERSION,
    }, { signal }));
}
