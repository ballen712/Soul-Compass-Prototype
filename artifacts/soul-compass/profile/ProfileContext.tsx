import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import type { ProfileFormDraft, UserProfile } from './profile';

const PROFILE_KEY = 'soul-compass.profile.v1';

type ProfileContextValue = {
  profile: UserProfile | null;
  onboardingDraft: ProfileFormDraft | null;
  loaded: boolean;
  error: string | null;
  saveProfile: (profile: UserProfile) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function isHomeLocation(value: unknown): value is NonNullable<UserProfile['currentResidence']> {
  if (!value || typeof value !== 'object') return false;
  const location = value as Record<string, unknown>;
  return typeof location.city === 'string'
    && typeof location.country === 'string'
    && typeof location.latitude === 'number'
    && Number.isFinite(location.latitude)
    && typeof location.longitude === 'number'
    && Number.isFinite(location.longitude)
    && typeof location.timeZone === 'string'
    && location.timeZone.length > 0;
}

function isUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== 'object') return false;
  const saved = value as Record<string, unknown>;
  const birthTime = saved.birthTime as Record<string, unknown> | null;
  const validBirthTime = birthTime?.status === 'unknown'
    || (birthTime?.status === 'known' && typeof birthTime.localTime === 'string');
  return typeof saved.birthDate === 'string'
    && validBirthTime
    && isHomeLocation(saved.birthPlace)
    && (saved.currentResidence === null || isHomeLocation(saved.currentResidence));
}

function isBirthTime(value: unknown): value is UserProfile['birthTime'] {
  if (!value || typeof value !== 'object') return false;
  const birthTime = value as Record<string, unknown>;
  return birthTime.status === 'unknown'
    || (birthTime.status === 'known' && typeof birthTime.localTime === 'string');
}

export function ProfileProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [onboardingDraft, setOnboardingDraft] = useState<ProfileFormDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PROFILE_KEY)
      .then((stored) => {
        if (!active || !stored) return;
        const saved: unknown = JSON.parse(stored);
        if (isUserProfile(saved)) {
          setProfile(saved);
          return;
        }
        // Older profiles called the residence "homeLocation". Keep it as a
        // residence draft, but never reinterpret it as a birthplace.
        if (saved && typeof saved === 'object') {
          const legacy = saved as Record<string, unknown>;
          const draft: ProfileFormDraft = {};
          if (typeof legacy.birthDate === 'string') draft.birthDate = legacy.birthDate;
          if (isBirthTime(legacy.birthTime)) draft.birthTime = legacy.birthTime;
          if (isHomeLocation(legacy.homeLocation)) draft.currentResidence = legacy.homeLocation;
          if (Object.keys(draft).length > 0) setOnboardingDraft(draft);
        }
      })
      .catch(() => {
        if (active) setError('Could not load your saved profile.');
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const saveProfile = useCallback(async (nextProfile: UserProfile) => {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setOnboardingDraft(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ profile, onboardingDraft, loaded, error, saveProfile }),
    [profile, onboardingDraft, loaded, error, saveProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider.');
  return context;
}
