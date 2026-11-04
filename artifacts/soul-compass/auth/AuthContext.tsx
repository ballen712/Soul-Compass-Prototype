import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, authConfigured } from './supabase';
import { sessionStorage, SESSION_STORAGE_KEY } from './sessionStorage';
import { onSessionExpired } from './events';

WebBrowser.maybeCompleteAuthSession();
const callbackExchanges = new Map<string, Promise<void>>();
type AuthValue = {
  session: Session | null; ready: boolean; configured: boolean; error: string | null;
  sendEmailCode(email: string): Promise<void>; verifyEmailCode(email: string, code: string): Promise<void>;
  signInGoogle(): Promise<void>; completeCallback(url: string): Promise<void>;
  signOut(): Promise<void>; clearError(): void;
};
const Context = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!authConfigured);
  const [error, setError] = useState<string | null>(null);
  const identity = useRef<string | null>(null);
  const authRevision = useRef(0);
  const query = useQueryClient();
  const accept = useCallback((next: Session | null) => {
    if (identity.current !== (next?.user.id ?? null)) {
      void query.cancelQueries();
      query.clear();
      identity.current = next?.user.id ?? null;
    }
    setSession(next); setReady(true);
  }, [query]);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const revision = authRevision.current;
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { if (active) { authRevision.current++; accept(next); } });
    void supabase.auth.getSession().then(({ data, error: loadError }) => {
      if (!active || authRevision.current !== revision) return;
      if (loadError) { accept(null); setError('Your session could not be restored. Please sign in again.'); }
      else accept(data.session);
    }).catch(() => { if (active && authRevision.current === revision) { accept(null); setError('Session storage is unavailable. Please try again.'); } });
    const state = AppState.addEventListener('change', value => {
      if (value === 'active') supabase?.auth.startAutoRefresh(); else supabase?.auth.stopAutoRefresh();
    });
    if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
    return () => { active = false; data.subscription.unsubscribe(); state.remove(); supabase?.auth.stopAutoRefresh(); };
  }, [accept]);
  const signOut = useCallback(async () => {
    accept(null); setError(null);
    try { const result = await supabase?.auth.signOut({ scope: 'local' }); if (result?.error) setError('Signed out on this device; server revocation could not be confirmed.'); }
    finally {
      await sessionStorage.removeItem(SESSION_STORAGE_KEY);
      await sessionStorage.removeItem(`${SESSION_STORAGE_KEY}-code-verifier`);
      accept(null);
    }
  }, [accept]);
  useEffect(() => onSessionExpired(() => {
    void signOut().finally(() => setError('Your session expired. Please sign in again.')).catch(() => {});
  }), [signOut]);
  async function completeCallback(url: string) {
    if (!supabase) throw new Error('Cloud sign-in is not configured yet.');
    const result = new URL(url);
    if (result.searchParams.has('error')) throw new Error('Sign-in was cancelled or expired. Please try again.');
    const code = result.searchParams.get('code');
    if (!code || code.length > 8192) throw new Error('No valid sign-in code was received. Start sign-in again.');
    if (callbackExchanges.has(code)) return callbackExchanges.get(code);
    if (callbackExchanges.size >= 8) callbackExchanges.clear();
    const exchange = supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) throw new Error('This sign-in link expired or was already used. Please start again.');
    });
    callbackExchanges.set(code, exchange);
    try { await exchange; }
    catch (error) { callbackExchanges.delete(code); throw error; }
    finally { setTimeout(() => callbackExchanges.delete(code), 60_000); }
  }
  const value: AuthValue = {
    session, ready, configured: authConfigured, error, clearError: () => setError(null), signOut, completeCallback,
    async sendEmailCode(email) {
      if (!supabase) throw new Error('Cloud sign-in is not configured yet.');
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
      if (error) throw new Error('Could not send a code. Check your email address or wait before retrying.');
    },
    async verifyEmailCode(email, token) {
      if (!supabase) throw new Error('Cloud sign-in is not configured yet.');
      const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: token.trim(), type: 'email' });
      if (error) throw new Error('The code is invalid or expired. Request a new one.');
    },
    async signInGoogle() {
      if (!supabase) throw new Error('Cloud sign-in is not configured yet.');
      const redirectTo = makeRedirectUri({ scheme: 'soul-compass', path: 'auth/callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } } });
      if (error || !data.url) throw new Error('Google sign-in could not be started.');
      if (Platform.OS === 'web') { window.location.assign(data.url); return; }
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success') {
        const expected = new URL(redirectTo), returned = new URL(result.url);
        if (expected.protocol !== returned.protocol || expected.host !== returned.host || expected.pathname !== returned.pathname) throw new Error('Unexpected sign-in callback.');
        await completeCallback(result.url);
      } else throw new Error('Google sign-in was cancelled.');
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context); if (!value) throw new Error('AuthProvider is missing.'); return value;
}
