import { createContext } from 'react';
import type { ProfileFormDraft, UserProfile } from './profile';
import type { LocalPreferences, LocalPrivacy } from './local';
import type { LocalProfileStore } from './storage';

export type ProfileContextValue = {
  profile: UserProfile | null;
  onboardingDraft: ProfileFormDraft | null;
  loaded: boolean;
  error: string | null;
  preferences: LocalPreferences;
  privacy: LocalPrivacy;
  saveProfile: LocalProfileStore['saveProfile'];
  loadNatalChartCache: LocalProfileStore['loadNatalChartCache'];
  saveNatalChartCache: LocalProfileStore['saveNatalChartCache'];
  savePreferences: LocalProfileStore['savePreferences'];
  toggleCrystal: LocalProfileStore['toggleCrystal'];
  setConsent: LocalProfileStore['setConsent'];
  clearLocalData: LocalProfileStore['clearLocalData'];
  reloadLocal: LocalProfileStore['load'];
  canCalculate: LocalProfileStore['canCalculate'];
  withCalculationConsent: LocalProfileStore['withCalculationConsent'];
};
// Keep context identity outside the refreshable component/hook module.
export const ProfileContext = createContext<ProfileContextValue | null>(null);
