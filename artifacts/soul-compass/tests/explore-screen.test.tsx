import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { expect, test, vi } from 'vitest';

const navigationState = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('@/profile/ProfileContext', () => ({
  useProfile: () => ({ preferences: { language: 'en' } }),
}));
vi.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
vi.mock('expo-router', () => ({
  useScrollToTop: vi.fn(),
  useRouter: () => ({ push: navigationState.push }),
}));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 59, right: 0, bottom: 34, left: 0 }),
}));
vi.mock('react-native', () => ({
  Image: 'Image',
  Platform: { OS: 'ios' },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { absoluteFill: {}, create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
  useWindowDimensions: () => ({ width: 402, height: 874 }),
}));
vi.mock('@/components/TabEdgeSwipe', () => ({
  TabEdgeSwipe: ({ children, ...props }: any) => React.createElement('TabEdgeSwipe', props, children),
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

test('Explore previews all three planned features without a paywall', async () => {
  navigationState.push.mockClear();
  let renderer: ReactTestRenderer;
  await act(async () => { renderer = create(<ExploreScreen />); });
  const root = renderer!.root;
  const copy = root.findAllByType('Text' as any).map((node) => node.props.children);

  expect(root.findByProps({ testID: 'tab-edge-swipe-explore' })).toBeDefined();
  const mainScroll = root.findByProps({ testID: 'explore-main-scroll' });
  expect(mainScroll).toBeDefined();
  expect(mainScroll.props.contentContainerStyle[0].paddingBottom).toBe(24);
  expect(mainScroll.props.bounces).toBe(false);
  expect(mainScroll.props.alwaysBounceVertical).toBe(false);
  expect(mainScroll.props.overScrollMode).toBe('never');
  expect(root.findByProps({ testID: 'explore-feature-tarot' })).toBeDefined();
  expect(root.findByProps({ testID: 'explore-feature-transits' })).toBeDefined();
  expect(root.findByProps({ testID: 'explore-feature-life-directions' })).toBeDefined();
  expect(copy).toContain('Explore');
  expect(copy).toContain('SOUL COMPASS');
  expect(copy).toContain('Tarot');
  expect(copy).toContain('Long-term transits');
  expect(copy).toContain('Life Directions');
  expect(copy.filter((item) => item === 'PLANNED')).toHaveLength(3);
  const settingsButton = root.findByProps({ testID: 'settings-button' });
  expect(settingsButton).toBeDefined();
  await act(async () => settingsButton.props.onPress());
  expect(navigationState.push).toHaveBeenCalledWith('/settings');
  expect(JSON.stringify(renderer!.toJSON())).not.toMatch(/paywall|purchase|rewarded ad/i);

  await act(async () => renderer!.unmount());
});
