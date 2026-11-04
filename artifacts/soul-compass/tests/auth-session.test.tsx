import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const fixture = vi.hoisted(() => ({
  session: null as any,
  listener: null as null | ((event: string, next: any) => void),
  restoreError: false,
  storage: new Map<string, string>(),
}));
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) },
}));
vi.mock('expo-auth-session', () => ({ makeRedirectUri: () => 'soul-compass://auth/callback' }));
vi.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: () => {}, openAuthSessionAsync: async () => ({ type: 'cancel' }) }));
vi.mock('../auth/sessionStorage', () => ({
  SESSION_STORAGE_KEY: 'test',
  sessionStorage: { removeItem: async (key: string) => { fixture.storage.delete(key); } },
}));
vi.mock('@/auth/supabase', () => ({
  authConfigured: true,
  supabase: { auth: {
    onAuthStateChange: (callback: typeof fixture.listener) => { fixture.listener = callback; return { data: { subscription: { unsubscribe: () => {} } } }; },
    getSession: async () => ({ data: { session: fixture.session }, error: fixture.restoreError ? new Error('expired') : null }),
    startAutoRefresh: () => {}, stopAutoRefresh: () => {},
    signOut: async () => { fixture.session = null; fixture.listener?.('SIGNED_OUT', null); return { error: null }; },
  } },
}));
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { notifySessionExpired } from '../auth/events';
let renderer: ReactTestRenderer | undefined;
let view: ReturnType<typeof useAuth>;
let query: QueryClient;
function Probe() { view = useAuth(); return null; }
async function render() { await act(async () => { renderer = create(<QueryClientProvider client={query}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>); }); }
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  fixture.session = { user: { id: 'A' }, access_token: 'fake-test-only' };
  fixture.restoreError = false; fixture.storage.clear(); query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(async () => { await act(async () => renderer?.unmount()); query.clear(); });
test('stored session restoration establishes an authenticated account', async () => {
  await render(); expect(view.ready).toBe(true); expect(view.session?.user.id).toBe('A');
});
test('switching identities and signing out clear user-specific query caches and stored sessions', async () => {
  await render(); query.setQueryData(['private-chart', 'A'], { private: true });
  await act(async () => fixture.listener?.('SIGNED_IN', { user: { id: 'B' } }));
  expect(view.session?.user.id).toBe('B'); expect(query.getQueryData(['private-chart', 'A'])).toBeUndefined();
  fixture.storage.set('test', 'fake-test-only');
  query.setQueryData(['private-profile', 'B'], { private: true });
  await act(async () => view.signOut());
  expect(view.session).toBeNull(); expect(query.getQueryCache().getAll().length).toBe(0); expect(fixture.storage.size).toBe(0);
});
test('invalid stored sessions and API expiry events lead to sign-in state without cached private data', async () => {
  fixture.restoreError = true; await render(); expect(view.session).toBeNull(); expect(view.error).toContain('restored');
  await act(async () => fixture.listener?.('SIGNED_IN', { user: { id: 'A' } }));
  query.setQueryData(['private'], 'test');
  await act(async () => notifySessionExpired());
  expect(view.session).toBeNull(); expect(view.error).toContain('expired'); expect(query.getQueryCache().getAll()).toEqual([]);
});
