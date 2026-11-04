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
import type { UserProfile } from './profile';

const PROFILE_KEY = 'soul-compass.profile.v1';

type ProfileContextValue = {
  profile: UserProfile | null;
  loaded: boolean;
  error: string | null;
  saveProfile: (profile: UserProfile) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PROFILE_KEY)
      .then((stored) => {
        if (active && stored) setProfile(JSON.parse(stored) as UserProfile);
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
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ profile, loaded, error, saveProfile }),
    [profile, loaded, error, saveProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider.');
  return context;
}
