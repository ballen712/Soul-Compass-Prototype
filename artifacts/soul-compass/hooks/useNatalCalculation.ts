import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import type { NatalChartResponse } from '@workspace/api-client-react';
import { useProfile } from '@/profile/ProfileContext';
import { natalChartCacheKey, requestNatal, type Disambiguation } from '@/services/natal';

type NatalCalculationState = {
  data?: NatalChartResponse;
  error?: unknown;
  cacheWarning?: string;
  disambiguation: Disambiguation | null;
  isPending: boolean;
  isError: boolean;
  calculate: (choice: Disambiguation | null) => Promise<void>;
  refreshOncePerSession: () => Promise<void>;
};

const NatalCalculationContext = createContext<NatalCalculationState | null>(null);

export function NatalCalculationProvider({ children }: PropsWithChildren) {
  const value = useNatalCalculationState();
  return createElement(NatalCalculationContext.Provider, { value }, children);
}

export function useNatalCalculation() {
  const value = useContext(NatalCalculationContext);
  if (!value) throw new Error('useNatalCalculation must be used within NatalCalculationProvider.');
  return value;
}

function useNatalCalculationState(): NatalCalculationState {
  const context = useProfile();
  const current = useRef(context);
  current.current = context;
  const inFlight = useRef(false);
  const revision = useRef(0);
  const alive = useRef(true);
  const automaticRefreshAttempted = useRef(false);
  const profileKey = JSON.stringify(context.profile);
  const scope = {
    profileKey,
    consent: context.privacy.astrologyApiConsent,
    consentVersion: context.privacy.consentVersion,
  };
  const previousScope = useRef(scope);
  const attemptScope = useRef(scope);
  if (
    attemptScope.current.profileKey !== profileKey
    || attemptScope.current.consent !== context.privacy.astrologyApiConsent
    || attemptScope.current.consentVersion !== context.privacy.consentVersion
  ) {
    automaticRefreshAttempted.current = false;
    attemptScope.current = scope;
  }
  const [state, setState] = useState<{
    data?: NatalChartResponse;
    error?: unknown;
    cacheWarning?: string;
    disambiguation: Disambiguation | null;
    isPending: boolean;
    isError: boolean;
  }>({ disambiguation: null, isPending: false, isError: false });
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; revision.current++; };
  }, []);
  useEffect(() => {
    const profileChanged = previousScope.current.profileKey !== 'null'
      && previousScope.current.profileKey !== profileKey;
    const revoked = previousScope.current.consent && !context.privacy.astrologyApiConsent;
    const consentChanged = previousScope.current.consent !== context.privacy.astrologyApiConsent
      || previousScope.current.consentVersion !== context.privacy.consentVersion;
    previousScope.current = {
      profileKey,
      consent: context.privacy.astrologyApiConsent,
      consentVersion: context.privacy.consentVersion,
    };
    if (profileChanged || revoked) {
      revision.current++;
      setState(previous => profileChanged
        ? { disambiguation: null, isPending: false, isError: false }
        : { ...previous, error: undefined, cacheWarning: undefined, isPending: false, isError: false });
    }
    if (profileChanged || consentChanged) automaticRefreshAttempted.current = false;
  }, [profileKey, context.privacy.astrologyApiConsent, context.privacy.consentVersion]);
  const calculate = useCallback(async (choice: Disambiguation | null) => {
    const ctx = current.current;
    if (!ctx.profile || !ctx.canCalculate() || inFlight.current) return;
    inFlight.current = true;
    const requestRevision = revision.current;
    const cacheKey = natalChartCacheKey(ctx.profile);
    setState(previous => ({
      ...previous,
      error: undefined,
      cacheWarning: undefined,
      disambiguation: choice,
      isPending: true,
      isError: false,
    }));
    try {
      const data = await requestNatal(ctx, ctx.profile, choice);
      if (alive.current && revision.current === requestRevision && current.current.canCalculate()) {
        let cacheWarning: string | undefined;
        try {
          await current.current.saveNatalChartCache(cacheKey, data, choice);
        } catch {
          cacheWarning = 'Your chart was calculated but could not be saved on this device. It may need to be calculated again next time.';
        }
        if (alive.current && revision.current === requestRevision) {
          setState({ data, disambiguation: choice, cacheWarning, isPending: false, isError: false });
        }
      }
    } catch (error) {
      if (alive.current && revision.current === requestRevision) {
        const readable = error instanceof Error && error.name === 'AbortError'
          ? new Error('The calculation was cancelled. Check your permission and try again.')
          : error;
        setState({ error: readable, disambiguation: choice, isPending: false, isError: true });
      }
    } finally {
      inFlight.current = false;
      if (alive.current) setState(previous => previous.isPending ? { ...previous, isPending: false } : previous);
    }
  }, []);
  const refreshOncePerSession = useCallback(async () => {
    if (automaticRefreshAttempted.current) return;
    const ctx = current.current;
    if (!ctx.loaded || !ctx.profile) return;
    automaticRefreshAttempted.current = true;
    const requestRevision = revision.current;
    setState(previous => ({
      ...previous,
      error: undefined,
      cacheWarning: undefined,
      isPending: true,
      isError: false,
    }));
    try {
      const cached = await ctx.loadNatalChartCache(natalChartCacheKey(ctx.profile));
      if (!alive.current || revision.current !== requestRevision) return;
      if (cached) {
        setState({
          data: cached.data,
          disambiguation: cached.disambiguation,
          isPending: false,
          isError: false,
        });
        return;
      }
      setState(previous => ({ ...previous, isPending: false, isError: false }));
      if (ctx.canCalculate()) await calculate(null);
    } catch (error) {
      if (alive.current && revision.current === requestRevision) {
        setState({ error, disambiguation: null, isPending: false, isError: true });
      }
    }
  }, [calculate]);
  return { ...state, calculate, refreshOncePerSession };
}

/** Load a local chart first; request one only when no matching cache exists and consent allows it. */
export function NatalAutoRefresh() {
  const { loaded, error, profile, privacy } = useProfile();
  const { refreshOncePerSession } = useNatalCalculation();
  const chartKey = profile ? natalChartCacheKey(profile) : null;

  useEffect(() => {
    if (!loaded || error) return;
    if (!chartKey) return;
    void refreshOncePerSession();
  }, [
    loaded,
    error,
    chartKey,
    privacy.astrologyApiConsent,
    privacy.consentVersion,
    privacy.revokedAt,
    refreshOncePerSession,
  ]);

  return null;
}
