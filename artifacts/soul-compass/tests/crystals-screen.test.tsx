import React from 'react';
import { Modal, Pressable, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({
  push: vi.fn(),
  suggestions: [] as Array<{ crystal: Record<string, unknown>; reason: string; basis: string; matchedIntentions: string[] }>,
  natalBalance: null as null | Record<string, unknown>,
  natalRecommendations: [] as Array<{ crystal: Record<string, unknown>; element: string; reason: string }>,
  profileContext: {
    profile: null as null | Record<string, unknown>,
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
    image: 0,
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
  roseQuartz: {
    name: 'Rose Quartz',
    note: 'Connection · care',
    description: 'A small prompt for care.',
    themes: ['connection', 'empathy'],
    tone: 'pink',
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
  crystalCatalog: [state.moonstone, state.amethyst, state.labradorite, state.roseQuartz],
  samplePrimaryCrystal: state.moonstone,
  alternativeCrystals: [state.amethyst, state.labradorite],
}));
vi.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    cosmos: {
      background: '#111B2B',
      homeBackground: '#070B13',
      surface: '#172438',
      card: '#1D2B40',
      foreground: '#F1EEE6',
      secondary: '#D6C39B',
      mutedForeground: '#A8B0BC',
      border: '#354258',
    },
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
  calculateNatalElementBalance: () => state.natalBalance,
  getCrystalSuggestions: () => state.suggestions,
  getNatalCrystalSuggestions: () => state.natalRecommendations,
  getSampleAlternatives: () => [state.amethyst, state.labradorite],
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
  state.profileContext.profile = null;
  state.suggestions = [];
  state.natalBalance = null;
  state.natalRecommendations = [];
});

test('the Stone Guide explains daily companions and opens from its info button', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await act(async () => {
    renderer = create(<CrystalsScreen />);
  });
  const root = renderer!.root;
  const info = root.findByProps({ testID: 'stone-guide-info' });
  expect(root.findAllByProps({ accessibilityLabel: 'Moonstone on linen' })).toHaveLength(0);
  expect(root.findAllByProps({ testID: 'collect-moonstone' })).toHaveLength(0);
  expect(root.findByProps({ testID: 'no-daily-stone' })).toBeDefined();
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

test('a new catalog stone without a photo renders and daily cards stay limited to three', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.suggestions = [state.roseQuartz, state.amethyst, state.labradorite].map((crystal) => ({
    crystal,
    reason: 'A personal symbolic prompt.',
    basis: 'feeling',
    matchedIntentions: [],
  }));
  await act(async () => { renderer = create(<CrystalsScreen />); });
  const root = renderer!.root;
  expect(root.findByProps({ accessibilityLabel: 'Rose Quartz stone illustration' })).toBeDefined();
  expect(root.findAll((node) => node.type === Pressable && String(node.props.testID ?? '').startsWith('collect-'))).toHaveLength(3);
  expect(root.findByProps({ testID: 'collect-rose-quartz' })).toBeDefined();
});

test('one clear match is shown without inventing extra companions', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.suggestions = [{
    crystal: state.roseQuartz,
    reason: 'A close symbolic match for today.',
    basis: 'chart',
    matchedIntentions: [],
  }];
  await act(async () => { renderer = create(<CrystalsScreen />); });
  const root = renderer!.root;
  expect(root.findByProps({ testID: 'collect-rose-quartz' })).toBeDefined();
  expect(root.findAllByProps({ testID: 'collect-amethyst' })).toHaveLength(0);
  expect(root.findAllByProps({ testID: 'collect-labradorite' })).toHaveLength(0);
  expect(root.findAll((node) =>
    node.type === Text && ['Another companion', 'Two other companions'].includes(node.props.children),
  )).toHaveLength(0);
});

test('birth-chart stones open individual explanations and can be added to the collection', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.profileContext.profile = { birthDate: '2000-01-01' };
  state.natalBalance = {
    status: 'calculated',
    counts: { Fire: 5, Air: 1, Water: 2, Earth: 2 },
    total: 10,
    dominant: ['Fire'],
    leastRepresented: ['Air'],
    preciseBirthMoment: true,
  };
  state.natalRecommendations = Array.from({ length: 8 }, (_, index) => ({
    crystal: {
      name: index === 0 ? 'Rose Quartz' : `Chart Stone ${index + 1}`,
      note: 'Connection · care',
      description: 'A small reminder to make room for kindness.',
    },
    element: index === 0 ? 'Air' : 'Fire',
    reason: index === 0
      ? 'Your chart has fewer air placements. This guide pairs the stone’s care themes with air as a reflection prompt.'
      : 'This stone offers a separate symbolic prompt for your chart.',
  }));

  await act(async () => { renderer = create(<CrystalsScreen />); });
  const root = renderer!.root;
  await act(async () => { root.findByProps({ testID: 'stone-guide-info' }).props.onPress(); });
  expect(root.findAll((node) =>
    node.type === Pressable && String(node.props.testID ?? '').startsWith('natal-stone-'),
  )).toHaveLength(8);

  await act(async () => { root.findByProps({ testID: 'natal-stone-rose-quartz' }).props.onPress(); });
  const detailCopy = root.findByProps({ testID: 'stone-guide-modal' })
    .findAllByType(Text).map((node) => node.props.children).join(' ');
  expect(detailCopy).toContain('fewer air placements');
  expect(detailCopy).toContain('not a proven effect');
  const addStone = root.findByProps({ testID: 'collect-rose-quartz' });
  expect(addStone).toBeDefined();
  await act(async () => { addStone.props.onPress(); });
  expect(state.profileContext.toggleCrystal).toHaveBeenCalledWith('rose-quartz');

  await act(async () => { root.findByProps({ testID: 'back-to-stone-guide' }).props.onPress(); });
  expect(root.findAll((node) =>
    node.type === Pressable && String(node.props.testID ?? '').startsWith('natal-stone-'),
  )).toHaveLength(8);
});
