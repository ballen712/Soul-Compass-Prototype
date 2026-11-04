import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { NatalChartResponse } from '@workspace/api-client-react';
const state = vi.hoisted(() => ({
  storage: new Map<string, string>(),
  calculate: vi.fn(),
}));
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
import { useNatalCalculation } from '../hooks/useNatalCalculation';
let profile: ReturnType<typeof useProfile>;
let chart: ReturnType<typeof useNatalCalculation>;
let renderer: ReactTestRenderer | undefined;
function Probe() { profile = useProfile(); chart = useNatalCalculation(); return null; }
async function mount() {
  await act(async () => { renderer = create(<ProfileProvider><Probe /></ProfileProvider>); });
  await act(async () => profile.saveProfile({
    birthDate: '2000-01-01', birthTime: { status: 'unknown' }, currentResidence: null,
    birthPlace: { city: 'Test', country: 'Test', latitude: 0, longitude: 0, timeZone: 'UTC' },
  }));
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.storage.clear(); state.calculate.mockReset();
  state.calculate.mockResolvedValue({} as NatalChartResponse);
});
afterEach(async () => { await act(async () => renderer?.unmount()); renderer = undefined; });
test('mount, profile save, consent grant and remount never calculate automatically', async () => {
  await mount(); expect(state.calculate).not.toHaveBeenCalled();
  await act(async () => chart.calculate(null)); expect(state.calculate).not.toHaveBeenCalled();
  await act(async () => profile.setConsent(true)); expect(state.calculate).not.toHaveBeenCalled();
  await act(async () => renderer?.unmount());
  await act(async () => { renderer = create(<ProfileProvider><Probe /></ProfileProvider>); });
  expect(profile.canCalculate()).toBe(true); expect(state.calculate).not.toHaveBeenCalled();
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
  await mount(); await act(async () => profile.setConsent(true));
  state.calculate.mockRejectedValueOnce(new Error('offline'));
  await act(async () => chart.calculate(null));
  expect(chart.isError).toBe(true); expect(chart.error).toEqual(new Error('offline'));
  await act(async () => profile.toggleCrystal('moonstone'));
  expect(state.calculate).toHaveBeenCalledTimes(1);
  await act(async () => chart.calculate(null)); expect(state.calculate).toHaveBeenCalledTimes(2);
});
