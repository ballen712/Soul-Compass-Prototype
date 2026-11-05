import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { CalculateNatalChartResponse } from '@workspace/api-zod';
import type { NatalChartResponse } from '@workspace/api-client-react';
import { LocalProfileStore } from '../profile/storage';
import { CONSENT_VERSION, LEGACY_KEY, LOCAL_KEY, ProfileSchema, emptyRecord } from '../profile/local';
import type { UserProfile } from '../profile/profile';

const state = vi.hoisted(() => ({ data: new Map<string, string>() }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => state.data.get(key) ?? null,
    setItem: async (key: string, value: string) => { state.data.set(key, value); },
  },
}));
vi.mock('@/auth/supabase', () => { throw new Error('Active local app must not initialize Supabase'); });
import { ProfileProvider, useProfile } from '../profile/ProfileContext';

const profile: UserProfile = {
  birthDate: '1991-06-20', birthTime: { status: 'unknown' },
  birthPlace: { city: 'Budapest', country: 'Hungary', latitude: 47.5, longitude: 19.04, timeZone: 'Europe/Budapest' },
  currentResidence: { city: 'Kyiv', country: 'Ukraine', latitude: 50.45, longitude: 30.52, timeZone: 'Europe/Kyiv' },
};
function adapter() {
  const data = new Map<string, string>();
  const storage = {
    getItem: vi.fn(async (key: string) => data.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => { data.set(key, value); }),
  };
  return { data, storage, store: new LocalProfileStore(storage) };
}
let renderer: ReactTestRenderer | undefined;
let view: ReturnType<typeof useProfile>;
function Probe() { view = useProfile(); return null; }
async function render() {
  await act(async () => { renderer = create(<ProfileProvider><Probe /></ProfileProvider>); });
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.data.clear();
});
afterEach(async () => { await act(async () => renderer?.unmount()); renderer = undefined; });

test('fresh startup works without auth or any cloud request', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('No network permitted'));
  await render();
  expect(view.loaded).toBe(true); expect(view.error).toBeNull(); expect(view.profile).toBeNull();
  expect(view.privacy.astrologyApiConsent).toBe(false);
  expect(fetchSpy).not.toHaveBeenCalled(); fetchSpy.mockRestore();
});
test('profile, residence and all preferences survive provider restart', async () => {
  await render();
  await act(async () => view.saveProfile(profile));
  await act(async () => view.savePreferences({
    language: 'hu', crystalCollection: ['amethyst'],
    crystalPreferences: { intentions: ['calm'], hiddenCrystals: ['moonstone'], feeling: 'tired' },
  }));
  await act(async () => renderer?.unmount()); await render();
  expect(view.profile).toEqual(profile);
  expect(view.preferences).toEqual({
    language: 'hu', crystalCollection: ['amethyst'],
    crystalPreferences: { intentions: ['calm'], hiddenCrystals: ['moonstone'], feeling: 'tired' },
  });
  await act(async () => view.saveProfile({ ...profile, birthTime: { status: 'known', localTime: '00:01' } }));
  expect(view.preferences.language).toBe('hu');
  expect(view.profile?.birthTime).toEqual({ status: 'known', localTime: '00:01' });
});
test('concurrent profile edits and collection toggles do not lose unrelated data', async () => {
  const { store } = adapter(); await store.load(); await store.saveProfile(profile);
  await Promise.all([store.toggleCrystal('amethyst'), store.toggleCrystal('moonstone'), store.saveProfile({ ...profile, currentResidence: null })]);
  expect(store.getSnapshot().record.preferences.crystalCollection).toEqual(['amethyst', 'moonstone']);
  expect(store.getSnapshot().record.profile?.currentResidence).toBeNull();
  await store.toggleCrystal('amethyst');
  expect(store.getSnapshot().record.preferences.crystalCollection).toEqual(['moonstone']);
});
test('queued preference updates preserve independent collection changes', async () => {
  const { store } = adapter(); await store.load();
  const preferences = store.getSnapshot().record.preferences;
  await Promise.all([store.toggleCrystal('amethyst'), store.savePreferences({ ...preferences, language: 'fr' })]);
  expect(store.getSnapshot().record.preferences.language).toBe('fr');
  expect(store.getSnapshot().record.preferences.crystalCollection).toEqual(['amethyst']);
});
test('valid legacy profile migrates without deleting or changing original bytes', async () => {
  const { data, store } = adapter(); const original = JSON.stringify(profile);
  data.set(LEGACY_KEY, original); await store.load();
  expect(store.getSnapshot().record.profile).toEqual(profile);
  expect(data.get(LEGACY_KEY)).toBe(original);
  expect(JSON.parse(data.get(LOCAL_KEY)!).schemaVersion).toBe(2);
  expect(store.canCalculate()).toBe(false);
});
test('legacy residence stays a draft and never becomes birthplace', async () => {
  const { data, store } = adapter();
  data.set(LEGACY_KEY, JSON.stringify({ birthDate: profile.birthDate, birthTime: profile.birthTime, homeLocation: profile.currentResidence }));
  await store.load();
  expect(store.getSnapshot().record.profile).toBeNull();
  expect(store.getSnapshot().record.onboardingDraft?.currentResidence).toEqual(profile.currentResidence);
  expect(store.getSnapshot().record.onboardingDraft).not.toHaveProperty('birthPlace');
});
test('new local record takes precedence over retained legacy copy', async () => {
  const { data, store } = adapter();
  data.set(LEGACY_KEY, JSON.stringify(profile));
  data.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), profile: { ...profile, birthDate: '2000-01-01' } }));
  await store.load(); expect(store.getSnapshot().record.profile?.birthDate).toBe('2000-01-01');
});
test.each(['{invalid', JSON.stringify({ schemaVersion: 999 }), JSON.stringify({ ...emptyRecord(), profile: {} })])(
  'corrupt or future local data is not replaced with defaults: %s', async value => {
    const { data, store, storage } = adapter(); data.set(LOCAL_KEY, value);
    await store.load(); expect(store.getSnapshot().error).not.toBeNull();
    await expect(store.saveProfile(profile)).rejects.toThrow();
    expect(data.get(LOCAL_KEY)).toBe(value); expect(storage.setItem).not.toHaveBeenCalled();
  });
test('failed migration preserves original and supports retry', async () => {
  const { data, store, storage } = adapter(); data.set(LEGACY_KEY, JSON.stringify(profile));
  storage.setItem.mockRejectedValueOnce(new Error('disk'));
  await store.load(); expect(store.getSnapshot().error).not.toBeNull();
  expect(data.has(LOCAL_KEY)).toBe(false); expect(data.has(LEGACY_KEY)).toBe(true);
  await store.load(); expect(store.getSnapshot().error).toBeNull(); expect(store.getSnapshot().record.profile).toEqual(profile);
});
test('failed profile writes preserve current disk record and visible state', async () => {
  const { data, store, storage } = adapter(); await store.load(); await store.saveProfile(profile);
  const bytes = data.get(LOCAL_KEY); storage.setItem.mockRejectedValueOnce(new Error('disk'));
  await expect(store.saveProfile({ ...profile, birthDate: '2000-01-01' })).rejects.toThrow('Could not save');
  expect(data.get(LOCAL_KEY)).toBe(bytes); expect(store.getSnapshot().record.profile).toEqual(profile);
  await store.toggleCrystal('moonstone'); expect(store.getSnapshot().record.preferences.crystalCollection).toEqual(['moonstone']);
});
test.each([
  { ...profile, birthDate: '2025-02-29' },
  { ...profile, birthTime: { status: 'known', localTime: '24:00' } },
  { ...profile, birthPlace: { ...profile.birthPlace, latitude: 91 } },
  { ...profile, birthPlace: { ...profile.birthPlace, longitude: -181 } },
  { ...profile, birthPlace: { ...profile.birthPlace, timeZone: 'Not/AZone' } },
  { ...profile, birthPlace: { ...profile.birthPlace, city: '' } },
])('central validation rejects impossible profile fields', value => {
  expect(ProfileSchema.safeParse(value).success).toBe(false);
});
test('known midnight, leap day, historical timezone and unknown time retain their exact inputs', () => {
  expect(ProfileSchema.parse({ ...profile, birthDate: '2000-02-29', birthTime: { status: 'known', localTime: '00:00' } }).birthTime)
    .toEqual({ status: 'known', localTime: '00:00' });
  expect(ProfileSchema.parse(profile).birthTime).toEqual({ status: 'unknown' });
});
test('consent grants, persists, revokes and can voluntarily be granted again', async () => {
  const { store, storage } = adapter(); await store.load();
  const request = vi.fn(async () => 'chart');
  await expect(store.withCalculationConsent(request)).rejects.toThrow('Permission');
  expect(request).not.toHaveBeenCalled();
  await store.setConsent(true);
  expect(store.getSnapshot().record.privacy.consentVersion).toBe(CONSENT_VERSION);
  expect(store.getSnapshot().record.privacy.consentTimestamp).toMatch(/Z$/);
  expect(await store.withCalculationConsent(request)).toBe('chart');
  const reopened = new LocalProfileStore(storage); await reopened.load(); expect(reopened.canCalculate()).toBe(true);
  await reopened.setConsent(false); expect(reopened.canCalculate()).toBe(false);
  expect(reopened.getSnapshot().record.privacy.revokedAt).toMatch(/Z$/);
  await expect(reopened.withCalculationConsent(request)).rejects.toThrow();
  const afterRevoke = new LocalProfileStore(storage); await afterRevoke.load(); expect(afterRevoke.canCalculate()).toBe(false);
  await afterRevoke.setConsent(true); expect(await afterRevoke.withCalculationConsent(request)).toBe('chart');
});
test('a matching Natal Chart is cached locally and reused only for matching birth inputs', async () => {
  const { store } = adapter(); await store.load();
  const chart = CalculateNatalChartResponse.parse({
    input: { birthTimeKnown: false },
    calculation: {
      instantUtc: '2000-01-01T12:00:00.000Z',
      birthTimeResolution: 'unknown-reference-local-noon',
      zodiac: 'tropical',
      coordinateSystem: 'geocentric',
      houseSystem: null,
      houseStatus: 'unavailable',
      houseCuspBoundary: 'test',
      applyingRule: 'test',
      provider: 'test',
      providerVersion: '1',
      timeZoneDatabase: 'test',
      angleConvention: 'test',
      exactnessThresholdDegrees: 0.01,
      orbs: { luminary: 8, other: 6 },
    },
    planets: [],
    angles: null,
    houseCusps: [],
    planetaryHouses: [],
    aspects: [],
    moonSignRange: [],
    warnings: [],
  }) as unknown as NatalChartResponse;

  await store.saveNatalChartCache('synthetic-profile-key', chart, 'later');
  expect(await store.loadNatalChartCache('different-profile-key')).toBeNull();
  const saved = await store.loadNatalChartCache('synthetic-profile-key');
  expect(saved?.disambiguation).toBe('later');
  expect(saved?.data.planets).toEqual([]);
  expect(new Date(saved!.data.calculation.instantUtc).toISOString()).toBe('2000-01-01T12:00:00.000Z');
});
test('revocation aborts an in-flight request and discards a late response', async () => {
  const { store } = adapter(); await store.load(); await store.setConsent(true);
  let resolve!: (value: string) => void; let signal!: AbortSignal;
  const response = store.withCalculationConsent(s => { signal = s; return new Promise<string>(r => { resolve = r; }); });
  const rejected = expect(response).rejects.toThrow('permission changed');
  const revocation = store.setConsent(false); expect(signal.aborted).toBe(true);
  resolve('late chart'); await rejected; await revocation;
});
test('a stalled request times out even when the transport ignores abort', async () => {
  const { store } = adapter(); await store.load(); await store.setConsent(true);
  vi.useFakeTimers();
  try {
    let signal!: AbortSignal;
    const response = store.withCalculationConsent(s => {
      signal = s;
      return new Promise<string>(() => {});
    });
    const rejected = expect(response).rejects.toThrow('The chart request timed out');
    await vi.advanceTimersByTimeAsync(20_000);
    await rejected;
    expect(signal.aborted).toBe(true);
  } finally {
    vi.useRealTimers();
  }
});
test('a failed grant never allows requests and a failed revocation fails closed in memory', async () => {
  const { store, storage } = adapter(); await store.load();
  storage.setItem.mockRejectedValueOnce(new Error('disk'));
  await expect(store.setConsent(true)).rejects.toThrow('not saved'); expect(store.canCalculate()).toBe(false);
  await store.setConsent(true); storage.setItem.mockRejectedValueOnce(new Error('disk'));
  await expect(store.setConsent(false)).rejects.toThrow('Blocked for this session');
  expect(store.canCalculate()).toBe(false);
});
test('outdated consent version requires renewed permission', async () => {
  const { data, store } = adapter();
  data.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), privacy: {
    astrologyApiConsent: true, consentTimestamp: new Date().toISOString(), consentVersion: '2026-11-04-v2', revokedAt: null,
  } }));
  await store.load(); expect(store.canCalculate()).toBe(false);
});
test('a queued grant cannot override a later revocation', async () => {
  const { store } = adapter(); await store.load();
  await Promise.all([store.setConsent(true), store.setConsent(false)]);
  expect(store.canCalculate()).toBe(false);
});
