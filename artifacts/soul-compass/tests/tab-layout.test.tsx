import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { expect, test, vi } from 'vitest';

vi.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

vi.mock('expo-router', () => {
  const Tabs: any = ({ children, screenOptions }: any) =>
    React.createElement('Tabs', { screenOptions }, children);
  Tabs.Screen = ({ name, options }: any) =>
    React.createElement('TabScreen', { name, options });
  return { Tabs };
});

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Text: 'Text',
  View: 'View',
}));
vi.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    navigation: {
      background: '#101725',
      border: '#293449',
      foreground: '#F1EEE6',
      mutedForeground: '#A8B0BC',
    },
  }),
}));
vi.mock('@/localization', () => ({ useAppText: () => (text: string) => text }));

import TabLayout from '../app/(tabs)/_layout';

test('all four translated tabs use equal-width slots and the same two-line label area', async () => {
  let renderer: ReactTestRenderer;
  await act(async () => { renderer = create(<TabLayout />); });

  const root = renderer!.root;
  const tabs = root.findByType('Tabs' as any);
  expect(tabs.props.screenOptions.tabBarItemStyle).toEqual({
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 0,
  });

  const screens = root.findAllByType('TabScreen' as any);
  expect(screens.map((screen) => screen.props.options.title)).toEqual([
    'COSMOS',
    'CRYSTALS',
    'NATAL CHART',
    'EXPLORE',
  ]);

  for (const screen of screens) {
    const label = screen.props.options.tabBarLabel({
      color: '#F1EEE6',
      children: screen.props.options.title,
    });
    expect(label.props.style).toMatchObject({ height: 22, width: '100%' });
    expect(label.props.children.props.numberOfLines).toBe(2);
    expect(label.props.children.props.style[0]).toMatchObject({
      flexShrink: 1,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 8.5,
      textAlign: 'center',
      width: '100%',
    });
  }

  await act(async () => renderer!.unmount());
});
