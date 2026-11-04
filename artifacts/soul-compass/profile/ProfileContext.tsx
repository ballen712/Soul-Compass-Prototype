import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext, useEffect, useRef, useSyncExternalStore, type PropsWithChildren } from 'react';
import { LocalProfileStore } from './storage';
import { ProfileContext } from './context';

function useLocalStore() {
  const ref = useRef<LocalProfileStore | null>(null);
  if (!ref.current) ref.current = new LocalProfileStore(AsyncStorage);
  return ref.current;
}
function useStoreValue(store: LocalProfileStore) {
  const { record, loaded, error } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return {
    profile: record.profile, onboardingDraft: record.onboardingDraft, loaded, error,
    preferences: record.preferences, privacy: record.privacy,
    saveProfile: store.saveProfile, savePreferences: store.savePreferences,
    toggleCrystal: store.toggleCrystal, setConsent: store.setConsent,
    reloadLocal: store.load, canCalculate: store.canCalculate,
    withCalculationConsent: store.withCalculationConsent.bind(store),
  };
}
export function ProfileProvider({ children }: PropsWithChildren) {
  const store = useLocalStore();
  const value = useStoreValue(store);
  useEffect(() => { void store.load(); return store.dispose; }, [store]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('useProfile must be used within ProfileProvider.');
  return value;
}
