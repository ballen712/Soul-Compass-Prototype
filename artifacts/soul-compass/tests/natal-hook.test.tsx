import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { NatalChartResponse } from '@workspace/api-client-react';
import { CalculateNatalChartResponse } from '@workspace/api-zod';
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
test('repeated taps are deduplicated and late response after revocation never displays', async () => {
  await mount(); await act(async () => profile.setConsent(true));
  let resolve!: (result: NatalChartResponse) => void;
  state.calculate.mockImplementation(() => new Promise<NatalChartResponse>(r => { resolve = r; }));
  let request!: Promise<void>;
  await act(async () => { request = chart.calculate(null); void chart.calculate(null); });
  expect(state.calculate).toHaveBeenCalledTimes(1);
  await act(async () => profile.setConsent(false));
  expect(state.calculate.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => { resolve({} as NatalChartResponse); await request; });
  expect(chart.data).toBeUndefined();
  await act(async () => chart.calculate(null)); expect(state.calculate).toHaveBeenCalledTimes(1);
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
