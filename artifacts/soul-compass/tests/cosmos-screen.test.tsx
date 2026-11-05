import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({
  push: vi.fn(),
  getDailyAstrology: vi.fn(),
}));

vi.mock('@expo/vector-icons', () => ({ Feather: 'Feather', Ionicons: 'Ionicons' }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('expo-router', () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock('../assets/images/cosmos-art.jpg', () => ({ default: 'cosmos-art' }));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
vi.mock('react-native', () => ({
  Image: 'Image',
  Modal: 'Modal',
  Platform: { OS: 'ios' },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: {
    absoluteFill: { top: 0, right: 0, bottom: 0, left: 0 },
    create: (styles: unknown) => styles,
  },
  Text: 'Text',
  View: 'View',
}));
vi.mock('@/components/SettingsButton', () => ({ SettingsButton: () => null }));
vi.mock('@/constants/content', () => ({
  dailyReading: {
    label: 'SAMPLE REFLECTION',
    title: 'A quieter kind of clarity.',
    body: 'Choose one thing to notice.',
    reflection: 'What deserves my attention?',
    status: 'Sample reflection.',
  },
}));
vi.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    cosmos: {
      background: '#111B2B',
      card: '#1D2B40',
      foreground: '#F1EEE6',
      secondary: '#D6C39B',
      mutedForeground: '#A8B0BC',
      border: '#354258',
      divider: '#536074',
    },
  }),
}));
vi.mock('@/profile/ProfileContext', () => ({ useProfile: () => ({ profile: null }) }));
vi.mock('@/profile/daily-cache', () => ({ getDailyAstrology: state.getDailyAstrology }));
vi.mock('@/hooks/useLocalClock', () => ({ useLocalClock: () => new Date('2026-11-05T12:00:00.000Z') }));

import CosmosScreen from '../app/(tabs)/index';

let renderer: ReactTestRenderer | undefined;

afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
  state.push.mockReset();
  state.getDailyAstrology.mockReset();
});

test('A moment to keep opens in a centered modal and closes without a chart request', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await act(async () => {
    renderer = create(<CosmosScreen />);
  });
  const root = renderer!.root;
  const moment = root.findAllByType(Pressable).find(
    (button: ReactTestInstance) => button.props.accessibilityLabel === 'About A moment to keep',
  );
  expect(moment).toBeDefined();

  await act(async () => { moment?.props.onPress(); });
  const stage = root.findByProps({ testID: 'cosmos-explanation-stage' });
  expect(stage.props.style.justifyContent).toBe('center');
  expect(root.findByProps({ testID: 'cosmos-explanation-modal' })).toBeDefined();
  expect(root.findAllByType(Text).some((node) => node.props.children === 'About this question')).toBe(true);
  expect(state.getDailyAstrology).not.toHaveBeenCalled();

  await act(async () => {
    root.findByProps({ accessibilityLabel: 'Close explanation' }).props.onPress();
  });
  expect(root.findAllByProps({ testID: 'cosmos-explanation-modal' })).toHaveLength(0);
});
