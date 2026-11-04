import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import type { ProfileFormDraft, UserProfile } from './profile';
import { useAuth } from '@/auth/AuthContext';
import { accountRequest, defaultPreferences, AccountRequestError, type CloudPreferences, type CloudRecord } from './cloud';

const PROFILE_KEY = 'soul-compass.profile.v1';
function sameProfile(a: UserProfile, b: UserProfile): boolean {
  const location = (value: UserProfile['currentResidence']) => value
    ? [value.city.trim(), value.country.trim(), value.latitude, value.longitude, value.timeZone] : null;
  const fields = (p: UserProfile) => [p.birthDate, p.birthTime.status,
    p.birthTime.status === 'known' ? p.birthTime.localTime : null, location(p.birthPlace), location(p.currentResidence)];
  return JSON.stringify(fields(a)) === JSON.stringify(fields(b));
}

type ProfileContextValue = {
  profile: UserProfile | null;
  onboardingDraft: ProfileFormDraft | null;
  loaded: boolean;
  error: string | null;
  saveProfile: (profile: UserProfile) => Promise<void>;
  preferences: CloudPreferences;
  cloudVersion: number | null;
  localImportAvailable: boolean;
  importLocalProfile: () => Promise<void>;
  savePreferences: (preferences: CloudPreferences) => Promise<void>;
  reloadCloud: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
  const auth = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [localCandidate, setLocalCandidate] = useState<UserProfile | null>(null);
  const [onboardingDraft, setOnboardingDraft] = useState<ProfileFormDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloud, setCloud] = useState<{ owner: string | null; record: CloudRecord | null; loaded: boolean; error: string | null }>({ owner: null, record: null, loaded: false, error: null });
  const currentOwner = auth.session?.user.id ?? null;
  const owner = useRef(currentOwner);
  owner.current = currentOwner;
  const busy = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PROFILE_KEY)
      .then((stored) => {
        if (!active || !stored) return;
        const saved: unknown = JSON.parse(stored);
        if (isUserProfile(saved)) {
          setLocalCandidate(saved);
          if (!auth.configured) setProfile(saved);
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
  }, [auth.configured]);

  const reloadCloud = useCallback(async () => {
    if (!auth.configured || !currentOwner) return;
    const id = currentOwner;
    setCloud(previous => ({ owner: id, record: previous.owner === id ? previous.record : null, loaded: false, error: null }));
    try {
      const { record } = await accountRequest<{ record: CloudRecord | null }>('/profile', {}, id);
      if (owner.current === id) setCloud({ owner: id, record, loaded: true, error: null });
    } catch (cause) {
      if (owner.current !== id) return;
      const message = cause instanceof Error ? cause.message : 'Could not load your cloud profile.';
      setCloud({ owner: id, record: null, loaded: true, error: message });
    }
  }, [auth.configured, auth.signOut, currentOwner]);

  useEffect(() => {
    if (!currentOwner) setCloud({ owner: null, record: null, loaded: false, error: null });
    else void reloadCloud();
  }, [currentOwner, reloadCloud]);

  const record = cloud.owner === currentOwner ? cloud.record : null;
  const writeCloud = useCallback(async (nextProfile: UserProfile, preferences: CloudPreferences, createOnly = false) => {
    const id = currentOwner;
    if (!id || !auth.ready) throw new Error('Sign in before saving cloud data.');
    if (busy.current.has(id)) throw new Error('A save is already in progress. Please wait.');
    busy.current.add(id);
    try {
      const existing = cloud.owner === id ? cloud.record : null;
      if (createOnly && existing) {
        // Complete an interrupted import only after a fresh, matching server read.
        const { record: confirmed } = await accountRequest<{ record: CloudRecord | null }>('/profile', {}, id);
        if (owner.current === id && confirmed && sameProfile(confirmed.profile, nextProfile)) return true;
        throw new Error('Your cloud profile already exists. It was not overwritten; the local copy remains on this device.');
      }
      const body = existing && !createOnly
        ? { profile: nextProfile, preferences, expectedVersion: existing.version }
        : { profile: nextProfile, preferences };
      const result = await accountRequest<{ record: CloudRecord }>('/profile', { method: existing && !createOnly ? 'PUT' : 'POST', body: JSON.stringify(body) }, id);
      if (owner.current !== id) throw new Error('Your account changed while saving. No data from the previous account was shown.');
      setCloud({ owner: id, record: result.record, loaded: true, error: null });
      return true;
    } finally { busy.current.delete(id); }
  }, [auth.ready, cloud, currentOwner]);

  const saveProfile = useCallback(async (nextProfile: UserProfile) => {
    if (auth.configured) {
      await writeCloud(nextProfile, record?.preferences ?? defaultPreferences());
      return;
    }
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setOnboardingDraft(null);
    setError(null);
  }, [auth.configured, record, writeCloud]);

  const importLocalProfile = useCallback(async () => {
    if (!localCandidate) throw new Error('No local profile was found.');
    if (await writeCloud(localCandidate, defaultPreferences(), true)) {
      // Confirmed create response is required before removing the old local data.
      await AsyncStorage.removeItem(PROFILE_KEY);
      setLocalCandidate(null);
      setOnboardingDraft(null);
    }
  }, [localCandidate, writeCloud]);

  const savePreferences = useCallback(async (preferences: CloudPreferences) => {
    if (!record) throw new Error('Save your profile before changing cloud preferences.');
    await writeCloud(record.profile, preferences);
  }, [record, writeCloud]);
  const deleteAccount = useCallback(async () => {
    if (!currentOwner) throw new Error('Sign in before deleting your account.');
    const id = currentOwner;
    await accountRequest<void>('/account', { method: 'DELETE', body: JSON.stringify({ confirmation: 'DELETE' }) }, id);
    if (owner.current === id) await auth.signOut();
    // Unimported legacy data is intentionally retained; it was never cloud-owned.
  }, [auth.signOut, currentOwner]);

  const value = useMemo(
    () => ({
      profile: auth.configured ? record?.profile ?? null : profile,
      onboardingDraft: auth.configured ? null : onboardingDraft,
      loaded: auth.configured ? auth.ready && Boolean(currentOwner) && cloud.owner === currentOwner && cloud.loaded && loaded : loaded,
      error: auth.configured ? (cloud.owner === currentOwner ? cloud.error : null) : error,
      saveProfile, preferences: record?.preferences ?? defaultPreferences(),
      cloudVersion: record?.version ?? null, localImportAvailable: Boolean(localCandidate),
      importLocalProfile, savePreferences, reloadCloud, deleteAccount,
    }),
    [auth.configured, auth.ready, record, profile, onboardingDraft, loaded, currentOwner, cloud, error, saveProfile, localCandidate, importLocalProfile, savePreferences, reloadCloud, deleteAccount],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider.');
  return context;
}
