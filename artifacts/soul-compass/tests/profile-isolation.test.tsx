import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({
  auth: { configured: true, ready: true, session: null as { user: { id: string } } | null, signOut: vi.fn() },
  storage: new Map<string, string>(),
  records: new Map<string, any>(),
  failure: false,
  delayed: null as null | Promise<any>,
}));
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => state.auth }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: {
  getItem: async (key: string) => state.storage.get(key) ?? null,
  setItem: async (key: string, value: string) => { state.storage.set(key, value); },
  removeItem: async (key: string) => { state.storage.delete(key); },
} }));
vi.mock('@/profile/cloud', async importOriginal => {
  const original = await importOriginal<typeof import('../profile/cloud')>();
  return { ...original, accountRequest: async (_path: string, options: RequestInit = {}, expectedId: string) => {
    if (state.failure) throw new Error('Network unavailable.');
    if (expectedId !== state.auth.session?.user.id) throw new Error('Account changed.');
    if (state.delayed && !options.method) return state.delayed;
    const existing = state.records.get(expectedId);
    if (!options.method) return { record: existing ?? null };
    const body = JSON.parse(options.body as string);
    if (options.method === 'POST' && existing) throw new Error('A cloud profile already exists.');
    if (options.method === 'PUT' && body.expectedVersion !== existing?.version) throw new Error('Conflict.');
    if (options.method === 'DELETE') { state.records.delete(expectedId); return; }
    const record = { profile: body.profile, preferences: body.preferences, version: (existing?.version ?? 0) + 1 };
    state.records.set(expectedId, record);
    return { record };
  } };
});
// The original cloud module imports the client, but no external service is used.
vi.mock('@/auth/supabase', () => ({ supabase: null }));
import { ProfileProvider, useProfile } from '../profile/ProfileContext';
import { defaultPreferences } from '../profile/cloud';

const key = 'soul-compass.profile.v1';
const local = {
  birthDate: '1991-06-20', birthTime: { status: 'unknown' as const },
  birthPlace: { city: 'Test', country: 'Test', latitude: 48, longitude: 32, timeZone: 'Europe/Kyiv' }, currentResidence: null,
};
let view: ReturnType<typeof useProfile>;
let renderer: ReactTestRenderer | undefined;
function Probe() { view = useProfile(); return null; }
async function render() { await act(async () => { if (renderer) renderer.update(<ProfileProvider><Probe /></ProfileProvider>); else renderer = create(<ProfileProvider><Probe /></ProfileProvider>); }); }
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  state.auth.session = null; state.records.clear(); state.storage.clear(); state.failure = false; state.delayed = null;
  state.auth.signOut.mockImplementation(async () => { state.auth.session = null; });
});
afterEach(async () => { if (renderer) await act(async () => renderer?.unmount()); renderer = undefined; });

test('A → sign out → B clears A profile and preferences immediately', async () => {
  state.records.set('A', { profile: local, preferences: { ...defaultPreferences(), language: 'hu' }, version: 1 });
  state.auth.session = { user: { id: 'A' } }; await render();
  expect(view.profile?.birthDate).toBe(local.birthDate); expect(view.preferences.language).toBe('hu');
  state.auth.session = null; await render(); expect(view.profile).toBeNull(); expect(view.preferences.language).toBe('en');
  state.auth.session = { user: { id: 'B' } }; await render(); expect(view.profile).toBeNull(); expect(view.cloudVersion).toBeNull();
  await act(async () => view.saveProfile({ ...local, birthDate: '2000-01-01' }));
  expect(state.records.get('A').profile.birthDate).toBe(local.birthDate);
  expect(state.records.get('B').profile.birthDate).toBe('2000-01-01');
});
test('local import is opt-in, survives failure and removes local copy only after confirmed success', async () => {
  state.storage.set(key, JSON.stringify(local)); state.auth.session = { user: { id: 'A' } }; await render();
  expect(view.profile).toBeNull(); expect(view.localImportAvailable).toBe(true); expect(state.records.size).toBe(0);
  state.failure = true;
  await act(async () => { await expect(view.importLocalProfile()).rejects.toThrow(); });
  expect(state.storage.has(key)).toBe(true);
  state.failure = false;
  await act(async () => view.importLocalProfile());
  expect(state.storage.has(key)).toBe(false); expect(view.localImportAvailable).toBe(false); expect(state.records.size).toBe(1);
});
test('a conflicting cloud profile is never overwritten by import', async () => {
  state.storage.set(key, JSON.stringify(local)); state.auth.session = { user: { id: 'A' } };
  state.records.set('A', { profile: { ...local, birthDate: '2000-01-01' }, preferences: defaultPreferences(), version: 3 });
  await render(); await act(async () => { await expect(view.importLocalProfile()).rejects.toThrow('already exists'); });
  expect(state.storage.has(key)).toBe(true); expect(state.records.get('A').version).toBe(3);
});
test('interrupted import completes after confirming identical cloud data without a duplicate write', async () => {
  state.storage.set(key, JSON.stringify(local)); state.auth.session = { user: { id: 'A' } };
  state.records.set('A', { profile: local, preferences: defaultPreferences(), version: 1 }); await render();
  await act(async () => view.importLocalProfile());
  expect(state.storage.has(key)).toBe(false); expect(state.records.get('A').version).toBe(1);
});
test('a delayed A response cannot populate B state after switching accounts', async () => {
  let resolve!: (value: any) => void;
  state.delayed = new Promise(r => { resolve = r; }); state.auth.session = { user: { id: 'A' } };
  await render();
  state.delayed = null; state.auth.session = { user: { id: 'B' } }; await render();
  await act(async () => resolve({ record: { profile: local, preferences: defaultPreferences(), version: 1 } }));
  expect(view.profile).toBeNull(); expect(view.cloudVersion).toBeNull();
});
test('reopening and manual synchronization reload the same account data without local cloud caches', async () => {
  state.auth.session = { user: { id: 'A' } };
  state.records.set('A', { profile: local, preferences: defaultPreferences(), version: 1 }); await render();
  state.records.set('A', { profile: local, preferences: { ...defaultPreferences(), language: 'hu' }, version: 2 });
  await act(async () => view.reloadCloud()); expect(view.preferences.language).toBe('hu'); expect(view.cloudVersion).toBe(2);
  await act(async () => renderer?.unmount()); renderer = undefined; await render();
  expect(view.preferences.language).toBe('hu'); expect(state.storage.size).toBe(0);
});
