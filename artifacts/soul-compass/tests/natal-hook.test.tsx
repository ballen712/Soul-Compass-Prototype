import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { NatalChartResponse } from '@workspace/api-client-react';
import { CalculateNatalChartResponse } from '@workspace/api-zod';
import { natalChartCacheKey } from '../services/natal';
vi.mock('react-native', () => ({
  AppState: { addEventListener: () => ({ remove: () => {} }) },
}));
const state = vi.hoisted(() => ({
  storage: new Map<string, string>(),
  calculate: vi.fn(),
}));
const chartResult = CalculateNatalChartResponse.parse({
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
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => state.storage.get(key) ?? null,
    setItem: async (key: string, value: string) => { state.storage.set(key, value); },
  },
}));
vi.mock('@workspace/api-client-react', () => ({
  calculateNatalChart: (...args: unknown[]) => state.calculate(...args),
}));
import { ProfileProvider, useProfile } from '../profile/ProfileContext';
import {
  NatalAutoRefresh,
  NatalCalculationProvider,
  useNatalCalculation,
} from '../hooks/useNatalCalculation';
let profile: ReturnType<typeof useProfile>;
let chart: ReturnType<typeof useNatalCalculation>;
let renderer: ReactTestRenderer | undefined;
function Probe() { profile = useProfile(); chart = useNatalCalculation(); return null; }
function App({ autoRefresh = false }: { autoRefresh?: boolean }) {
  return (
    <ProfileProvider>
      <NatalCalculationProvider>
        {autoRefresh ? <NatalAutoRefresh /> : null}
        <Probe />
      </NatalCalculationProvider>
    </ProfileProvider>
  );
}
async function mount(autoRefresh = false) {
  await act(async () => { renderer = create(<App autoRefresh={autoRefresh} />); });
  await act(async () => profile.saveProfile({
    birthDate: '2000-01-01', birthTime: { status: 'unknown' }, currentResidence: null,
    birthPlace: { city: 'Test', country: 'Test', latitude: 0, longitude: 0, timeZone: 'UTC' },
  }));
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.storage.clear(); state.calculate.mockReset();
  state.calculate.mockResolvedValue(chartResult);
});
afterEach(async () => { await act(async () => renderer?.unmount()); renderer = undefined; });
test('first consent calculates once and later app openings restore the local chart', async () => {
  await mount(true);
  expect(state.calculate).not.toHaveBeenCalled();
  await act(async () => profile.setConsent(true));
  expect(state.calculate).toHaveBeenCalledTimes(1);
  await act(async () => profile.savePreferences(profile.preferences));
  expect(state.calculate).toHaveBeenCalledTimes(1);

  await act(async () => renderer?.unmount());
  await act(async () => { renderer = create(<App autoRefresh />); });
  expect(profile.canCalculate()).toBe(true);
  expect(state.calculate).toHaveBeenCalledTimes(1);
  expect(chart.data?.planets).toEqual([]);
});
test('changing saved birth details clears the old chart and calculates for the new profile', async () => {
  await mount(true);
  await act(async () => {
    await profile.setConsent(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
  expect(state.calculate).toHaveBeenCalledTimes(1);
  expect(chart.data).toBeDefined();

  const updatedProfile = {
    ...profile.profile!,
    birthDate: '1991-06-20',
    birthTime: { status: 'known' as const, localTime: '08:45' },
    birthPlace: {
      city: 'Prague', country: 'Czechia', latitude: 50.0755, longitude: 14.4378, timeZone: 'Europe/Prague',
    },
  };
  await act(async () => {
    await profile.saveProfile(updatedProfile);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });

  expect(profile.profile).toEqual(updatedProfile);
  expect(state.calculate).toHaveBeenCalledTimes(2);
  expect(state.calculate.mock.calls[1][0]).toMatchObject({
    birthDate: '1991-06-20',
    birthTime: { status: 'known', localTime: '08:45' },
    birthPlace: { latitude: 50.0755, longitude: 14.4378, timeZone: 'Europe/Prague' },
  });
  expect(chart.data).toBeDefined();
});
test('a late chart response for the previous profile cannot replace the recalculated chart', async () => {
  await mount(true);
  const previousProfile = profile.profile!;
  const previousKey = natalChartCacheKey(previousProfile);
  let resolvePrevious!: (result: NatalChartResponse) => void;
  const staleChart = {
    ...chartResult,
    calculation: { ...chartResult.calculation, instantUtc: '1999-01-01T12:00:00.000Z' },
  };
  state.calculate.mockImplementationOnce(
    () => new Promise<NatalChartResponse>(resolve => { resolvePrevious = resolve; }),
  );

  await act(async () => { await profile.setConsent(true); });
  expect(state.calculate).toHaveBeenCalledTimes(1);
  expect(resolvePrevious).toBeTypeOf('function');

  const updatedProfile = {
    ...previousProfile,
    birthDate: '2005-06-30',
    birthTime: { status: 'known' as const, localTime: '12:00' },
    birthPlace: {
      city: 'Sydney',
      country: 'Australia',
      latitude: -33.8688,
      longitude: 151.2093,
      timeZone: 'Australia/Sydney',
    },
  };
  await act(async () => {
    await profile.saveProfile(updatedProfile);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });

  expect(state.calculate).toHaveBeenCalledTimes(2);
  expect(state.calculate.mock.calls[1][0]).toMatchObject({
    birthDate: '2005-06-30',
    birthPlace: { latitude: -33.8688, longitude: 151.2093, timeZone: 'Australia/Sydney' },
  });
  expect(chart.data).toEqual(chartResult);

  await act(async () => { resolvePrevious(staleChart as NatalChartResponse); });
  expect(chart.data).toEqual(chartResult);
  const updatedCache = await profile.loadNatalChartCache(natalChartCacheKey(updatedProfile));
  expect(updatedCache).not.toBeNull();
  expect(new Date(updatedCache!.data.calculation.instantUtc).toISOString())
    .toBe(new Date(chartResult.calculation.instantUtc).toISOString());
  expect(await profile.loadNatalChartCache(previousKey)).toBeNull();
});

test('a saved chart remains local after permission is withdrawn', async () => {
  await mount(true);
  await act(async () => profile.setConsent(true));
  expect(state.calculate).toHaveBeenCalledTimes(1);
  expect(chart.data).toBeDefined();
  await act(async () => profile.setConsent(false));
  expect(profile.canCalculate()).toBe(false);
  expect(chart.data).toBeDefined();
  await act(async () => renderer?.unmount());
  await act(async () => { renderer = create(<App autoRefresh />); });
  expect(state.calculate).toHaveBeenCalledTimes(1);
  expect(chart.data).toBeDefined();
});
test('revocation during a pending refresh discards its result and preserves the local chart', async () => {
  await mount(true);
  await act(async () => profile.setConsent(true));
  expect(state.calculate).toHaveBeenCalledTimes(1);
  const previousChart = chart.data;
  expect(previousChart).toBeDefined();
  const profileKey = natalChartCacheKey(profile.profile!);
  const cachedBefore = await profile.loadNatalChartCache(profileKey);
  expect(new Date(cachedBefore!.data.calculation.instantUtc).toISOString())
    .toBe('2000-01-01T12:00:00.000Z');

  let resolve!: (result: NatalChartResponse) => void;
  const lateChart = {
    ...chartResult,
    calculation: { ...chartResult.calculation, instantUtc: '2001-01-01T12:00:00.000Z' },
  };
  state.calculate.mockImplementationOnce(() => new Promise<NatalChartResponse>(r => { resolve = r; }));
  let request!: Promise<void>;
  await act(async () => { request = chart.calculate(null); void chart.calculate(null); });
  expect(state.calculate).toHaveBeenCalledTimes(2);
  await act(async () => { await profile.setConsent(false); });
  expect(chart.data).toBeDefined();
  expect(state.calculate.mock.calls[1][1].signal.aborted).toBe(true);
  expect(JSON.stringify(chart.data)).toBe(JSON.stringify(previousChart));
  expect(chart.isError).toBe(false);
  expect(new Date(chart.data!.calculation.instantUtc).toISOString())
    .toBe('2000-01-01T12:00:00.000Z');

  await act(async () => { await request; });
  await act(async () => { resolve(lateChart as NatalChartResponse); });
  expect(JSON.stringify(chart.data)).toBe(JSON.stringify(previousChart));
  expect(new Date(chart.data!.calculation.instantUtc).toISOString())
    .toBe('2000-01-01T12:00:00.000Z');
  const cachedAfter = await profile.loadNatalChartCache(profileKey);
  expect(cachedAfter?.data).toEqual(cachedBefore?.data);
  expect(new Date(cachedAfter!.data.calculation.instantUtc).toISOString())
    .toBe('2000-01-01T12:00:00.000Z');
  await act(async () => chart.calculate(null));
  expect(state.calculate).toHaveBeenCalledTimes(2);
});
test('network failure is visible and is not automatically retried after state changes', async () => {
  await mount(true);
  let rejectRequest!: (error: Error) => void;
  state.calculate.mockImplementationOnce(() => new Promise((_resolve, reject) => {
    rejectRequest = reject;
  }));
  await act(async () => profile.setConsent(true));
  expect(rejectRequest).toBeTypeOf('function');
  await act(async () => {
    rejectRequest(new Error('offline'));
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
  expect(chart.isError).toBe(true); expect(chart.error).toEqual(new Error('offline'));
  await act(async () => profile.toggleCrystal('moonstone'));
  expect(state.calculate).toHaveBeenCalledTimes(1);
  await act(async () => chart.calculate(null)); expect(state.calculate).toHaveBeenCalledTimes(2);
});
