import React from 'react';
import { Image, Modal, Pressable, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({
  push: vi.fn(),
  guideScrollTo: vi.fn(),
  collectionScrollToOffset: vi.fn(),
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
    specimenDescription: 'A pearly white stone with a soft blue flash.',
    image: 0,
    imageDescription: 'Moonstone on linen',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Amethyst',
    note: 'Stillness · perspective',
    description: 'A reminder to slow down.',
    specimenDescription: 'A violet cluster of pointed quartz crystals.',
    image: 2,
    imageDescription: 'Amethyst cluster',
  },
  labradorite: {
    id: 'labradorite',
    name: 'Labradorite',
    note: 'Curiosity · change',
    description: 'A reminder to stay curious.',
    specimenDescription: 'A grey stone with blue-green flashes across its surface.',
    image: 3,
    imageDescription: 'Labradorite stone',
  },
  roseQuartz: {
    name: 'Rose Quartz',
    note: 'Connection · care',
    description: 'A good fit for care and connection.',
    specimenDescription: 'A pale pink quartz with a cloudy, translucent finish.',
    themes: ['connection', 'empathy'],
    tone: 'pink',
  },
}));

vi.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('expo-router', () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 59, right: 0, bottom: 34, left: 0 }),
}));
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  FlatList: React.forwardRef(({ data, renderItem, ListEmptyComponent, ...props }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      scrollToOffset: (options: unknown) => state.collectionScrollToOffset(options),
    }), []);
    return React.createElement(
      'FlatList',
      props,
      data.length
        ? data.map((item: any, index: number) => React.createElement(
          React.Fragment,
          { key: item.name },
          renderItem({ item, index }),
        ))
        : ListEmptyComponent
          ? React.createElement(ListEmptyComponent)
          : null,
    );
  }),
  Image: 'Image',
  Modal: 'Modal',
  PanResponder: { create: (handlers: any) => ({ panHandlers: {
    onMoveShouldSetResponderCapture: handlers.onMoveShouldSetPanResponderCapture,
    onResponderRelease: handlers.onPanResponderRelease,
  } }) },
  Platform: { OS: 'ios' },
  Pressable: 'Pressable',
  ScrollView: React.forwardRef(({ children, ...props }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      scrollTo: (options: unknown) => state.guideScrollTo(options),
    }), []);
    return React.createElement('ScrollView', props, children);
  }),
  StyleSheet: {
    absoluteFill: { top: 0, right: 0, bottom: 0, left: 0 },
    create: (styles: unknown) => styles,
  },
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
  useWindowDimensions: () => ({ width: 402, height: 874 }),
}));
vi.mock('react-native-keyboard-controller', () => ({
  KeyboardAvoidingView: 'KeyboardAvoidingView',
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
  state.guideScrollTo.mockReset();
  state.collectionScrollToOffset.mockReset();
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
  expect(root.findAllByType(Modal)[0].props.visible).toBe(false);

  await act(async () => { info.props.onPress(); });
  expect(root.findAllByType(Modal)[0].props.visible).toBe(true);
  const modal = root.findByProps({ testID: 'stone-guide-modal' });
  const copy = modal.findAllByType(Text).map((node) => node.props.children).join(' ');
  expect(copy).toContain('With your saved birth chart and current city');
  expect(copy).toContain('we do not use GPS');
  expect(copy).toContain('pendant, ring, or bracelet');
  expect(copy).toContain('Add to Collection');
  expect(copy).not.toMatch(/symbolic|not proven|not a proven effect|guaranteed effect|health advice/i);

  const close = root.findByProps({ testID: 'close-stone-guide' });
  expect(close.type).toBe(Pressable);
  await act(async () => { close.props.onPress(); });
  expect(root.findAllByType(Modal)[0].props.visible).toBe(false);
});

test('the full collection can be searched, opened, and added to a local collection', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.profileContext.toggleCrystal.mockResolvedValue(undefined);
  await act(async () => { renderer = create(<CrystalsScreen />); });
  const root = renderer!.root;
  await act(async () => {
    root.findByProps({ testID: 'open-crystal-collection' }).props.onPress();
  });

  expect(root.findByProps({ testID: 'catalog-stone-moonstone' })).toBeDefined();
  expect(root.findAll((node) =>
    node.type === Pressable && String(node.props.testID ?? '').startsWith('catalog-stone-'),
  )).toHaveLength(4);

  await act(async () => {
    root.findByProps({ testID: 'crystal-catalog-search' }).props.onChangeText('pale pink');
  });
  expect(root.findAll((node) =>
    node.type === Pressable && String(node.props.testID ?? '').startsWith('catalog-stone-'),
  )).toHaveLength(1);
  const roseQuartzRow = root.findByProps({ testID: 'catalog-stone-rose-quartz' });
  await act(async () => { roseQuartzRow.props.onPress(); });

  const detailText = root.findAllByType(Text).map((node) => node.props.children).join(' ');
  expect(detailText).toContain('pale pink quartz');
  expect(detailText).not.toContain('AI-generated illustrations');
  expect(detailText).not.toContain('Real stones vary');
  expect(detailText).toContain('GOOD FOR');
  expect(detailText).toContain('A good fit for care and connection.');
  expect(detailText).not.toMatch(/symbolic|not proven|guaranteed effect/i);
  const addStone = root.findByProps({ testID: 'collect-rose-quartz' });
  await act(async () => { addStone.props.onPress(); });
  expect(state.profileContext.toggleCrystal).toHaveBeenCalledWith('rose-quartz');

  await act(async () => {
    const edge = root.findAllByProps({ testID: 'crystal-catalog-edge-swipe-back' })
      .find((node) => String(node.type) === 'View')!.props;
    edge.onResponderRelease({}, { x0: 12, dx: 100, dy: 8 });
  });
  expect(root.findByProps({ testID: 'crystal-catalog-search' })).toBeDefined();
  await act(async () => {
    root.findByProps({ testID: 'close-crystal-catalog' }).props.onPress();
  });
  expect(root.findByProps({ testID: 'open-crystal-collection' })).toBeDefined();
});

test('the full collection restores its scroll position after returning from stone details', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await act(async () => { renderer = create(<CrystalsScreen />); });
  const root = renderer!.root;
  await act(async () => {
    root.findByProps({ testID: 'open-crystal-collection' }).props.onPress();
  });

  let list = root.findByProps({ testID: 'full-crystal-catalog-list' });
  await act(async () => {
    list.props.onScroll({ nativeEvent: { contentOffset: { y: 840 } } });
    root.findByProps({ testID: 'catalog-stone-rose-quartz' }).props.onPress();
  });
  await act(async () => {
    const edge = root.findAllByProps({ testID: 'crystal-catalog-edge-swipe-back' })
      .find((node) => String(node.type) === 'View')!.props;
    edge.onResponderRelease({}, { x0: 12, dx: 100, dy: 8 });
  });
  list = root.findByProps({ testID: 'full-crystal-catalog-list' });
  await act(async () => { list.props.onContentSizeChange(400, 2400); });
  expect(state.collectionScrollToOffset).toHaveBeenNthCalledWith(1, { offset: 840, animated: false });

  await act(async () => {
    list.props.onScroll({ nativeEvent: { contentOffset: { y: 1260 } } });
    root.findByProps({ testID: 'catalog-stone-labradorite' }).props.onPress();
  });
  await act(async () => {
    root.findByProps({ testID: 'back-to-crystal-catalog' }).props.onPress();
  });
  list = root.findByProps({ testID: 'full-crystal-catalog-list' });
  await act(async () => { list.props.onContentSizeChange(400, 2400); });
  expect(state.collectionScrollToOffset).toHaveBeenNthCalledWith(2, { offset: 1260, animated: false });
});

test('the collection button clears the tab bar and detail artwork scales to the screen', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await act(async () => { renderer = create(<CrystalsScreen />); });
  const root = renderer!.root;
  const mainScroll = root.findByProps({ testID: 'crystals-main-scroll' });
  expect(mainScroll.props.contentContainerStyle[1].paddingBottom).toBeGreaterThanOrEqual(94);
  await act(async () => {
    root.findByProps({ testID: 'open-crystal-collection' }).props.onPress();
  });

  const stage = root.findByProps({ testID: 'crystal-collection-stage' });
  expect(stage.props.style[1]).toMatchObject({ paddingTop: 59, paddingBottom: 34 });

  await act(async () => {
    root.findByProps({ testID: 'catalog-stone-moonstone' }).props.onPress();
  });
  const detailImage = root.find(
    (node) => node.type === Image && node.props.accessibilityLabel === 'Moonstone on linen',
  );
  expect(detailImage.props.resizeMode).toBe('contain');
  const detailStyle = Object.assign({}, ...detailImage.props.style);
  expect(detailStyle).toMatchObject({ aspectRatio: 1 });
  expect(detailStyle.width).toBeCloseTo(297.16, 1);
  expect(detailStyle.height).toBe(detailStyle.width);

  const backButton = root.findByProps({ testID: 'back-to-crystal-catalog' });
  const closeButton = root.findByProps({ testID: 'close-crystal-catalog' });
  expect(backButton.props.style.minHeight).toBe(44);
  expect(closeButton.props.style).toMatchObject({ height: 44, width: 44 });
});

test('a new catalog stone without a photo renders and daily cards stay limited to three', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.suggestions = [state.roseQuartz, state.amethyst, state.labradorite].map((crystal) => ({
    crystal,
    reason: 'A personal match for these chart themes.',
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
    reason: 'A close match for today.',
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

test('three daily matches show one main stone, two companions, and the full collection link', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.suggestions = [state.roseQuartz, state.amethyst, state.labradorite].map((crystal) => ({
    crystal,
    reason: 'A personal match for today.',
    basis: 'chart',
    matchedIntentions: [],
  }));
  await act(async () => { renderer = create(<CrystalsScreen />); });
  const root = renderer!.root;

  expect(root.findByProps({ testID: 'collect-rose-quartz' })).toBeDefined();
  expect(root.findByProps({ testID: 'collect-amethyst' })).toBeDefined();
  expect(root.findByProps({ testID: 'collect-labradorite' })).toBeDefined();
  expect(root.findAll((node) =>
    node.type === Text && node.props.children === 'Two other companions',
  )).toHaveLength(1);
  expect(root.findByProps({ testID: 'open-crystal-collection' })).toBeDefined();
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
      description: 'A good fit for care and connection.',
    },
    element: index === 0 ? 'Air' : 'Fire',
    reason: index === 0
      ? 'Your chart has fewer air placements. Rose Quartz is a good fit for care and connection in your chart.'
      : 'This stone is a good fit for a different part of your chart.',
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
  expect(detailCopy).toContain('A good fit for care and connection.');
  expect(detailCopy).not.toMatch(/symbolic|not proven|guaranteed effect/i);
  const addStone = root.findByProps({ testID: 'collect-rose-quartz' });
  expect(addStone).toBeDefined();
  await act(async () => { addStone.props.onPress(); });
  expect(state.profileContext.toggleCrystal).toHaveBeenCalledWith('rose-quartz');

  await act(async () => { root.findByProps({ testID: 'back-to-stone-guide' }).props.onPress(); });
  await act(async () => {
    root.findByProps({ testID: 'stone-guide-scroll' }).props.onContentSizeChange(320, 900);
  });

  state.guideScrollTo.mockClear();
  const guideScroll = root.findByProps({ testID: 'stone-guide-scroll' });
  await act(async () => {
    guideScroll.props.onScroll({ nativeEvent: { contentOffset: { y: 720 } } });
  });
  await act(async () => {
    root.findByProps({ testID: 'natal-stone-chart-stone-6' }).props.onPress();
  });
  await act(async () => {
    root.findByProps({ testID: 'stone-guide-scroll' }).props.onScroll({
      nativeEvent: { contentOffset: { y: 40 } },
    });
  });
  await act(async () => { root.findByProps({ testID: 'back-to-stone-guide' }).props.onPress(); });
  await act(async () => {
    root.findByProps({ testID: 'stone-guide-scroll' }).props.onContentSizeChange(320, 900);
  });
  expect(state.guideScrollTo).toHaveBeenCalledWith({ y: 720, animated: false });
  expect(root.findAll((node) =>
    node.type === Pressable && String(node.props.testID ?? '').startsWith('natal-stone-'),
  )).toHaveLength(8);
});
