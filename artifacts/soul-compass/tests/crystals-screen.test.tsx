import React from 'react';
import { Modal, Pressable, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({
  push: vi.fn(),
  profileContext: {
    profile: null,
    preferences: {
      crystalCollection: [],
      crystalPreferences: { intentions: [], hiddenCrystals: [], feeling: null },
    },
    toggleCrystal: vi.fn(),
  },
  moonstone: {
    id: 'moonstone',
    name: 'Moonstone',
    note: 'Reflection · steadiness',
    description: 'A gentle reminder to pause.',
    image: 1,
    imageDescription: 'Moonstone on linen',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Amethyst',
    note: 'Stillness · perspective',
    description: 'A reminder to slow down.',
    image: 2,
    imageDescription: 'Amethyst cluster',
  },
  labradorite: {
    id: 'labradorite',
    name: 'Labradorite',
    note: 'Curiosity · change',
    description: 'A reminder to stay curious.',
    image: 3,
    imageDescription: 'Labradorite stone',
  },
}));

vi.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('expo-router', () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
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
  samplePrimaryCrystal: state.moonstone,
  alternativeCrystals: [state.amethyst, state.labradorite],
}));
vi.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    crystals: {
      background: '#F5F1E8',
      card: '#FFFCF6',
      foreground: '#30342F',
      secondary: '#7B846C',
      mutedForeground: '#77766D',
      border: '#DDD6C8',
      imageSurface: '#EAE4D8',
      badgeBackground: '#FFFCF6',
      badgeForeground: '#59634F',
    },
  }),
}));
vi.mock('@/profile/ProfileContext', () => ({
  useProfile: () => state.profileContext,
}));
vi.mock('@/profile/astrology', () => ({
  getCrystalRecommendation: () => null,
  getIntentionRecommendation: () => null,
  getSampleCrystal: () => state.moonstone,
}));
vi.mock('@/profile/crystal-guidance', () => ({
  getCompanionReason: (crystal: { name: string }) => `${crystal.name} is another symbolic prompt.`,
}));
vi.mock('@/profile/daily-cache', () => ({ getDailyAstrology: () => null }));
vi.mock('@/hooks/useLocalClock', () => ({
  useLocalClock: () => new Date('2026-11-05T12:00:00.000Z'),
}));

import CrystalsScreen from '../app/(tabs)/crystals';

let renderer: ReactTestRenderer | undefined;

afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
  state.push.mockReset();
  state.profileContext.toggleCrystal.mockReset();
});

test('the Stone Guide explains daily companions and opens from its info button', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await act(async () => {
    renderer = create(<CrystalsScreen />);
  });
  const root = renderer!.root;
  const info = root.findByProps({ testID: 'stone-guide-info' });
  expect(root.findAllByProps({ name: 'info' })).toHaveLength(1);
  expect(root.findAllByProps({ name: 'sun' })).toHaveLength(0);
  expect(root.findByType(Modal).props.visible).toBe(false);

  await act(async () => { info.props.onPress(); });
  expect(root.findByType(Modal).props.visible).toBe(true);
  const modal = root.findByProps({ testID: 'stone-guide-modal' });
  const copy = modal.findAllByType(Text).map((node) => node.props.children).join(' ');
  expect(copy).toContain('With your saved birth chart and current city');
  expect(copy).toContain('we do not use GPS');
  expect(copy).toContain('pendant, ring, or bracelet');
  expect(copy).toContain('Add to Collection');
  expect(copy).toContain('not promises or health advice');

  const close = root.findByProps({ testID: 'close-stone-guide' });
  expect(close.type).toBe(Pressable);
  await act(async () => { close.props.onPress(); });
  expect(root.findByType(Modal).props.visible).toBe(false);
});
