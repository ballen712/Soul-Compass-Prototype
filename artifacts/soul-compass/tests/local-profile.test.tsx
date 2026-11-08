import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { CalculateNatalChartResponse } from '@workspace/api-zod';
import type { NatalChartResponse } from '@workspace/api-client-react';
import { LocalProfileStore } from '../profile/storage';
import { CONSENT_VERSION, LEGACY_KEY, LOCAL_KEY, ProfileSchema, emptyRecord, localDayKey } from '../profile/local';
import type { UserProfile } from '../profile/profile';
import { resolveAppColorMode } from '../hooks/useColors';

const state = vi.hoisted(() => ({ data: new Map<string, string>() }));
const appEvents = vi.hoisted(() => ({ listener: undefined as undefined | ((state: string) => void) }));
vi.mock('react-native', () => ({
  AppState: { addEventListener: (_event: string, listener: (state: string) => void) => {
    appEvents.listener = listener;
    return { remove: () => { appEvents.listener = undefined; } };
  } },
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => state.data.get(key) ?? null,
    setItem: async (key: string, value: string) => { state.data.set(key, value); },
    removeItem: async (key: string) => { state.data.delete(key); },
  },
}));
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
    removeItem: vi.fn(async (key: string) => { data.delete(key); }),
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
afterEach(async () => { await act(async () => renderer?.unmount()); renderer = undefined; vi.useRealTimers(); });

test('fresh startup works without auth or any cloud request', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('No network permitted'));
  await render();
  expect(view.loaded).toBe(true); expect(view.error).toBeNull(); expect(view.profile).toBeNull();
  expect(view.privacy.astrologyApiConsent).toBe(false);
  expect(fetchSpy).not.toHaveBeenCalled(); fetchSpy.mockRestore();
});
test('appearance follows the device in System mode and honors explicit themes', () => {
  expect(resolveAppColorMode('system', 'dark')).toBe('dark');
  expect(resolveAppColorMode('system', 'light')).toBe('light');
  expect(resolveAppColorMode('light', 'dark')).toBe('light');
  expect(resolveAppColorMode('dark', 'light')).toBe('dark');
  expect(resolveAppColorMode('system', null)).toBe('light');
});
test('older local settings default to System appearance without losing profile data', async () => {
  const { data, store } = adapter();
  const record = emptyRecord();
  record.profile = profile;
  const { appearance: _appearance, ...oldPreferences } = record.preferences;
  data.set(LOCAL_KEY, JSON.stringify({ ...record, preferences: oldPreferences }));
  await store.load();
  expect(store.getSnapshot().record.profile).toEqual(profile);
  expect(store.getSnapshot().record.preferences).toMatchObject({
    appearance: 'system',
    language: 'en',
  });
});
test('profile, residence and all preferences survive provider restart', async () => {
  await render();
  await act(async () => view.saveProfile(profile));
  await act(async () => view.savePreferences({
    language: 'hu', appearance: 'dark', crystalCollection: ['amethyst'],
    crystalPreferences: { intentions: ['calm'], hiddenCrystals: ['moonstone'], feeling: 'tired' },
  }));
  await act(async () => renderer?.unmount()); await render();
  expect(view.profile).toEqual(profile);
  expect(view.preferences).toEqual({
    language: 'hu', appearance: 'dark', crystalCollection: ['amethyst'],
    crystalPreferences: { intentions: [], hiddenCrystals: ['moonstone'], feeling: 'tired', feelingDate: localDayKey() },
  });
  await act(async () => view.saveProfile({ ...profile, birthTime: { status: 'known', localTime: '00:01' } }));
  expect(view.preferences.language).toBe('hu');
  expect(view.profile?.birthTime).toEqual({ status: 'known', localTime: '00:01' });
});
test('the Settings delete action resets the shared app profile to first-run defaults', async () => {
  await render();
  await act(async () => view.saveProfile(profile));
  await act(async () => view.savePreferences({
    language: 'ru', appearance: 'system', crystalCollection: ['amethyst'],
    crystalPreferences: { intentions: [], hiddenCrystals: ['moonstone'], feeling: 'tired' },
  }));
  await act(async () => view.setConsent(true));

  await act(async () => view.clearLocalData());

  expect(view.profile).toBeNull();
  expect(view.onboardingDraft).toBeNull();
  expect(view.preferences).toEqual(emptyRecord().preferences);
  expect(view.privacy).toEqual(emptyRecord().privacy);
  expect(view.canCalculate()).toBe(false);
});
test('feeling resets exactly at local midnight while open, not after 24 hours', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 30));
  await render();
  await act(async () => view.savePreferences({
    ...view.preferences,
    crystalPreferences: { ...view.preferences.crystalPreferences, feeling: 'energized' },
  }));
  expect(view.preferences.crystalPreferences.feelingDate).toBe('2026-12-31');
  await act(async () => { await vi.advanceTimersByTimeAsync(29_999); });
  expect(view.preferences.crystalPreferences.feeling).toBe('energized');
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(view.preferences.crystalPreferences.feeling).toBeNull();
  expect(view.preferences.crystalPreferences.feelingDate).toBeNull();
  await act(async () => renderer?.unmount()); renderer = undefined;
  expect(vi.getTimerCount()).toBe(0);
});
test('returning from background clears yesterday’s feeling immediately', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 5, 10));
  await render();
  await act(async () => view.savePreferences({
    ...view.preferences,
    crystalPreferences: { ...view.preferences.crystalPreferences, feeling: 'tired' },
  }));
  vi.setSystemTime(new Date(2026, 10, 7, 9));
  await act(async () => appEvents.listener?.('active'));
  expect(view.preferences.crystalPreferences.feeling).toBeNull();
  await act(async () => view.savePreferences({
    ...view.preferences,
    crystalPreferences: { ...view.preferences.crystalPreferences, feeling: 'tired' },
  }));
  expect(view.preferences.crystalPreferences.feelingDate).toBe('2026-11-07');
  await act(async () => view.savePreferences({
    ...view.preferences,
    crystalPreferences: { ...view.preferences.crystalPreferences, feeling: null },
  }));
  expect(view.preferences.crystalPreferences.feelingDate).toBeNull();
});
test('reopening on a later day expires only the feeling and removes retired intentions', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 5, 10));
  const { store, storage } = adapter();
  await store.load(); await store.saveProfile(profile);
  await store.savePreferences({
    language: 'hu', appearance: 'light', crystalCollection: ['amethyst'],
    crystalPreferences: { feeling: 'tired', intentions: ['Focus'], hiddenCrystals: ['moonstone'] },
  });
  vi.setSystemTime(new Date(2026, 10, 6, 8));
  const reopened = new LocalProfileStore(storage); await reopened.load();
  expect(reopened.getSnapshot().record.profile).toEqual(profile);
  expect(reopened.getSnapshot().record.preferences).toEqual({
    language: 'hu', appearance: 'light', crystalCollection: ['amethyst'],
    crystalPreferences: { feeling: null, feelingDate: null, intentions: [], hiddenCrystals: ['moonstone'] },
  });
  // An unrelated save must not silently extend yesterday's mood.
  await store.savePreferences({ ...store.getSnapshot().record.preferences, language: 'fr' });
  expect(store.getSnapshot().record.preferences.crystalPreferences.feeling).toBeNull();
});
test('undated legacy moods and intentions are ignored without changing other local data', async () => {
  const { store, data } = adapter();
  const record = emptyRecord();
  record.profile = profile;
  record.preferences.crystalPreferences = { feeling: 'tired', intentions: ['Focus'], hiddenCrystals: ['moonstone'] };
  const original = JSON.stringify(record);
  data.set(LOCAL_KEY, original); await store.load();
  expect(store.getSnapshot().record.preferences.crystalPreferences).toEqual({
    feeling: null, feelingDate: null, intentions: [], hiddenCrystals: ['moonstone'],
  });
  expect(store.getSnapshot().record.profile).toEqual(profile);
  expect(data.get(LOCAL_KEY)).toBe(original);
});
test('expiration needs no disk write and still applies when storage cannot write', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 5, 10));
  const { store, storage } = adapter(); await store.load();
  await store.savePreferences({
    ...store.getSnapshot().record.preferences,
    crystalPreferences: { intentions: [], hiddenCrystals: [], feeling: 'tired' },
  });
  storage.setItem.mockClear(); storage.setItem.mockRejectedValue(new Error('disk'));
  vi.setSystemTime(new Date(2026, 10, 6));
  store.refreshDailyPreferences();
  expect(store.getSnapshot().record.preferences.crystalPreferences.feeling).toBeNull();
  expect(store.getSnapshot().error).toBeNull();
  expect(storage.setItem).not.toHaveBeenCalled();
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
test('deleting local data removes profile, legacy data and cached chart and restarts with empty preferences', async () => {
  const { data, store, storage } = adapter();
  await store.load();
  await store.saveProfile(profile);
  await store.savePreferences({
    language: 'ru', appearance: 'system', crystalCollection: ['amethyst'],
    crystalPreferences: { intentions: [], hiddenCrystals: ['moonstone'], feeling: 'tired' },
  });
  await store.setConsent(true);
  data.set(LEGACY_KEY, JSON.stringify(profile));
  data.set('soul-compass.natal-chart-cache.v1', JSON.stringify({ privateChart: true }));

  await store.clearLocalData();

  expect(storage.removeItem).toHaveBeenCalledWith('soul-compass.natal-chart-cache.v1');
  expect(storage.removeItem).toHaveBeenCalledWith(LEGACY_KEY);
  expect(storage.removeItem).toHaveBeenCalledWith(LOCAL_KEY);
  expect(data.size).toBe(0);
  expect(store.getSnapshot().record).toEqual(emptyRecord());
  expect(store.canCalculate()).toBe(false);

  const reopened = new LocalProfileStore(storage);
  await reopened.load();
  expect(reopened.getSnapshot().record).toEqual(emptyRecord());
  expect(reopened.canCalculate()).toBe(false);
});
test('deleting local data aborts an active chart request before clearing the profile', async () => {
  const { store } = adapter();
  await store.load();
  await store.saveProfile(profile);
  await store.setConsent(true);
  let requestSignal: AbortSignal | undefined;
  const pending = store.withCalculationConsent(signal => {
    requestSignal = signal;
    return new Promise<string>(() => {});
  });

  expect(requestSignal?.aborted).toBe(false);
  await store.clearLocalData();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(requestSignal?.aborted).toBe(true);
  expect(store.getSnapshot().record.profile).toBeNull();
});
test('failed deletion stays explicit, revokes chart consent in-session, and can be retried', async () => {
  const { data, store, storage } = adapter();
  await store.load();
  await store.saveProfile(profile);
  await store.setConsent(true);
  storage.removeItem.mockRejectedValueOnce(new Error('storage unavailable'));

  await expect(store.clearLocalData()).rejects.toThrow('Could not finish deleting data');
  expect(store.getSnapshot().record.profile).toEqual(profile);
  expect(store.getSnapshot().record.privacy.astrologyApiConsent).toBe(false);
  expect(store.canCalculate()).toBe(false);

  await store.clearLocalData();
  expect(data.size).toBe(0);
  expect(store.getSnapshot().record.profile).toBeNull();
});
test('a matching Natal Chart is cached locally and reused only for matching birth inputs', async () => {
  const { store } = adapter(); await store.load(); await store.saveProfile(profile);
  const cachedProfile = store.getSnapshot().record.profile!;
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

  await store.saveNatalChartCache('synthetic-profile-key', chart, 'later', cachedProfile);
  expect(await store.loadNatalChartCache('different-profile-key')).toBeNull();
  const saved = await store.loadNatalChartCache('synthetic-profile-key');
  expect(saved?.disambiguation).toBe('later');
  expect(saved?.data.planets).toEqual([]);
  expect(new Date(saved!.data.calculation.instantUtc).toISOString()).toBe('2000-01-01T12:00:00.000Z');
  await store.clearLocalData();
  await expect(store.saveNatalChartCache('synthetic-profile-key', chart, 'later', cachedProfile))
    .rejects.toThrow('profile changed');
  expect(await store.loadNatalChartCache('synthetic-profile-key')).toBeNull();
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
