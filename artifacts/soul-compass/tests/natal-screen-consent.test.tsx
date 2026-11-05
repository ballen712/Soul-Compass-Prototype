import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { NatalChartResponse } from '@workspace/api-client-react';
import { emptyRecord, LOCAL_KEY, CONSENT_VERSION } from '../profile/local';
import { ProfileProvider } from '../profile/ProfileContext';
import { NatalAutoRefresh, NatalCalculationProvider } from '../hooks/useNatalCalculation';

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
vi.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));
vi.mock('@workspace/api-client-react', () => ({
  calculateNatalChart: (...args: unknown[]) => state.calculate(...args),
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'View',
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
vi.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: (options: Record<string, unknown>) => options.web ?? options.default,
  },
  ActivityIndicator: 'ActivityIndicator',
  Modal: 'Modal',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('@/components/SettingsButton', () => ({ SettingsButton: () => null }));
vi.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    cosmos: {
      background: '#111B2B',
      surface: '#172438',
      card: '#1D2B40',
      foreground: '#F1EEE6',
      secondary: '#D6C39B',
      mutedForeground: '#A8B0BC',
      border: '#354258',
      divider: '#536074',
    },
  }),
}));

import NatalScreen from '../app/(tabs)/natal';

let renderer: ReactTestRenderer | undefined;
const chartResult = {
  input: { birthTimeKnown: true },
  planets: [
    { planet: 'sun', sign: 'Aquarius', degreeInSign: 12.5, retrograde: false, longitude: 312.5, latitude: 0, speedDegreesPerDay: 1 },
    { planet: 'moon', sign: 'Pisces', degreeInSign: 4, retrograde: false, longitude: 334, latitude: 1, speedDegreesPerDay: 13 },
  ],
  planetaryHouses: [{ planet: 'sun', house: 5, cuspDistanceDegrees: 2 }],
  aspects: [{ first: 'sun', second: 'moon', type: 'trine', orb: 1.4, exact: false, applying: true }],
  houseCusps: [],
  angles: { ascendant: 0, midheaven: 90, descendant: 180, imumCoeli: 270 },
  moonSignRange: [],
  warnings: [],
} as unknown as NatalChartResponse;

function findText(root: ReactTestInstance, text: string) {
  return root.findAllByType(Text).find((node) => node.props.children === text);
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.storage.clear();
  state.calculate.mockReset().mockResolvedValue(chartResult);
  const profile = {
    birthDate: '2000-01-01',
    birthTime: { status: 'known', localTime: '12:00' },
    birthPlace: { city: 'Example', country: 'Example', latitude: 1, longitude: 1, timeZone: 'UTC' },
    currentResidence: null,
  };
  state.storage.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), profile }));
});

afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
});

test('Natal Chart sends no request until Agree, which starts exactly one calculation', async () => {
  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });
  const root = renderer!.root;

  expect(state.calculate).not.toHaveBeenCalled();
  const agree = findText(root, 'Agree');
  expect(agree?.parent?.props.onPress).toBeTypeOf('function');
  await act(async () => { await agree?.parent?.props.onPress(); });

  expect(state.calculate).toHaveBeenCalledTimes(1);
  expect(state.calculate).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(findText(root, 'ASCENDANT')).toBeDefined();
});

test('previously granted current-version permission refreshes automatically at app opening', async () => {
  const record = JSON.parse(state.storage.get(LOCAL_KEY)!);
  record.privacy = {
    astrologyApiConsent: true,
    consentTimestamp: new Date().toISOString(),
    consentVersion: CONSENT_VERSION,
    revokedAt: null,
  };
  state.storage.set(LOCAL_KEY, JSON.stringify(record));

  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });

  expect(state.calculate).toHaveBeenCalledTimes(1);
});

test('older one-time permission is not upgraded silently to automatic refresh', async () => {
  const record = JSON.parse(state.storage.get(LOCAL_KEY)!);
  record.privacy = {
    astrologyApiConsent: true,
    consentTimestamp: new Date().toISOString(),
    consentVersion: '2026-11-04-v1',
    revokedAt: null,
  };
  state.storage.set(LOCAL_KEY, JSON.stringify(record));

  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });

  expect(state.calculate).not.toHaveBeenCalled();
  expect(findText(renderer!.root, 'Agree')).toBeDefined();
});

test('planet, angle and aspect taps use chart placements and the centered explanation can be dismissed', async () => {
  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });
  const root = renderer!.root;
  await act(async () => { await findText(root, 'Agree')?.parent?.props.onPress(); });

  await act(async () => { root.findByProps({ testID: 'natal-planet-sun' }).props.onPress(); });
  expect(findText(root, 'Sun in Aquarius · House 5')).toBeDefined();
  expect(root.findByProps({ testID: 'natal-explanation-stage' }).props.style.justifyContent).toBe('center');
  expect(root.findAllByType(Text).some((node) => String(node.props.children).includes('House 5'))).toBe(true);
  await act(async () => { root.findByProps({ testID: 'natal-explanation-close' }).props.onPress(); });
  expect(root.findAllByProps({ testID: 'natal-explanation-modal' })).toHaveLength(0);
  await act(async () => { root.findByProps({ testID: 'natal-angle-midheaven' }).props.onPress(); });
  expect(findText(root, 'Midheaven in Cancer')).toBeDefined();
  await act(async () => { root.findByProps({ testID: 'natal-explanation-close' }).props.onPress(); });
  await act(async () => { root.findByProps({ testID: 'natal-aspect-sun-trine-moon' }).props.onPress(); });
  expect(findText(root, 'Sun trine Moon')).toBeDefined();
});

test('unknown-time uncertain Moon shows its possible range and omits time-dependent angles', async () => {
  const record = JSON.parse(state.storage.get(LOCAL_KEY)!);
  record.profile.birthTime = { status: 'unknown' };
  state.storage.set(LOCAL_KEY, JSON.stringify(record));
  state.calculate.mockResolvedValue({
    ...chartResult,
    input: { birthTimeKnown: false },
    moonSignRange: ['Aquarius', 'Pisces'],
  });
  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });
  const root = renderer!.root;
  await act(async () => { await findText(root, 'Agree')?.parent?.props.onPress(); });
  expect(findText(root, 'ASCENDANT')).toBeUndefined();
  await act(async () => { root.findByProps({ testID: 'natal-planet-moon' }).props.onPress(); });
  expect(findText(root, 'Moon sign range')).toBeDefined();
  expect(root.findAllByType(Text).some((node) => String(node.props.children).includes('Aquarius or Pisces'))).toBe(true);
});
