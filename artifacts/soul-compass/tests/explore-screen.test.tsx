import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { expect, test, vi } from 'vitest';

vi.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
vi.mock('expo-router', () => ({ useScrollToTop: vi.fn() }));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 59, right: 0, bottom: 34, left: 0 }),
}));
vi.mock('react-native', () => ({
  Image: 'Image',
  Platform: { OS: 'ios' },
  ScrollView: 'ScrollView',
  StyleSheet: { absoluteFill: {}, create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
  useWindowDimensions: () => ({ width: 402, height: 874 }),
}));
vi.mock('@/components/TabEdgeSwipe', () => ({
  TabEdgeSwipe: ({ children, ...props }: any) => React.createElement('TabEdgeSwipe', props, children),
}));
vi.mock('@/components/TabScreenHeader', () => ({
  TabScreenHeader: ({ title, subtitle }: any) => React.createElement(
    'View',
    null,
    React.createElement('Text', null, title),
    React.createElement('Text', null, subtitle),
  ),
}));
vi.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    cosmos: {
      homeBackground: '#070B13',
      surface: '#172438',
      card: '#1D2B40',
      foreground: '#F1EEE6',
      secondary: '#D6C39B',
      mutedForeground: '#A8B0BC',
      border: '#354258',
    },
  }),
}));

import ExploreScreen from '../app/(tabs)/explore';

test('Explore previews Tarot and longer transits without a paywall', async () => {
  let renderer: ReactTestRenderer;
  await act(async () => { renderer = create(<ExploreScreen />); });
  const root = renderer!.root;
  const copy = root.findAllByType('Text' as any).map((node) => node.props.children);

  expect(root.findByProps({ testID: 'tab-edge-swipe-explore' })).toBeDefined();
  expect(root.findByProps({ testID: 'explore-main-scroll' })).toBeDefined();
  expect(root.findByProps({ testID: 'explore-feature-tarot' })).toBeDefined();
  expect(root.findByProps({ testID: 'explore-feature-transits' })).toBeDefined();
  expect(copy).toContain('Explore');
  expect(copy).toContain('Tarot');
  expect(copy).toContain('Long-term transits');
  expect(copy.filter((item) => item === 'PLANNED')).toHaveLength(2);
  expect(JSON.stringify(renderer!.toJSON())).not.toMatch(/paywall|purchase|rewarded ad/i);

  await act(async () => renderer!.unmount());
});
