import { useCallback, useEffect, useRef, useState } from 'react';
import type { NatalChartResponse } from '@workspace/api-client-react';
import { useProfile } from '@/profile/ProfileContext';
import { requestNatal, type Disambiguation } from '@/services/natal';

export function useNatalCalculation() {
  const context = useProfile();
  const current = useRef(context);
  current.current = context;
  const inFlight = useRef(false);
  const revision = useRef(0);
  const alive = useRef(true);
  const [state, setState] = useState<{
    data?: NatalChartResponse; error?: unknown; isPending: boolean; isError: boolean;
  }>({ isPending: false, isError: false });
  const profileKey = JSON.stringify(context.profile);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; revision.current++; };
  }, []);
  useEffect(() => {
    revision.current++;
    setState({ isPending: false, isError: false });
  }, [profileKey, context.privacy.astrologyApiConsent]);
  const calculate = useCallback(async (choice: Disambiguation | null) => {
    const ctx = current.current;
    if (!ctx.profile || !ctx.canCalculate() || inFlight.current) return;
    inFlight.current = true;
    const requestRevision = revision.current;
    setState({ isPending: true, isError: false });
    try {
      const data = await requestNatal(ctx, ctx.profile, choice);
      if (alive.current && revision.current === requestRevision && current.current.canCalculate()) {
        setState({ data, isPending: false, isError: false });
      }
    } catch (error) {
      if (alive.current && revision.current === requestRevision) {
        const readable = error instanceof Error && error.name === 'AbortError'
          ? new Error('The calculation timed out or was cancelled. Check your connection and retry manually.')
          : error;
        setState({ error: readable, isPending: false, isError: true });
      }
    } finally {
      inFlight.current = false;
      if (alive.current) setState(previous => previous.isPending ? { ...previous, isPending: false } : previous);
    }
  }, []);
  return { ...state, calculate };
}
