import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { expect, test, vi } from 'vitest';

const tabLayoutState = vi.hoisted(() => ({
  platform: 'ios',
  liquidGlassAvailable: false,
  detectorCalls: 0,
}));

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

vi.mock('expo-router/native-tabs', () => {
  const NativeTabs: any = ({ children, ...props }: any) =>
    React.createElement('NativeTabs', props, children);
  const Trigger: any = ({ name, children }: any) =>
    React.createElement('NativeTabTrigger', { name }, children);
  Trigger.Icon = ({ src, sf }: any) => React.createElement('NativeTabIcon', { src, sf });
  Trigger.Label = ({ children }: any) => React.createElement('NativeTabLabel', {}, children);
  Trigger.VectorIcon = ({ family, name, size }: any) =>
    React.createElement('NativeVectorIcon', { family, name, size });
  NativeTabs.Trigger = Trigger;
  return { NativeTabs };
});

vi.mock('expo-glass-effect', () => ({
  isLiquidGlassAvailable: () => {
    tabLayoutState.detectorCalls += 1;
    return tabLayoutState.liquidGlassAvailable;
  },
}));

vi.mock('react-native', () => ({
  Platform: {
    get OS() { return tabLayoutState.platform; },
  },
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

test('older iOS keeps all four equal-width classic tabs', async () => {
  tabLayoutState.platform = 'ios';
  tabLayoutState.liquidGlassAvailable = false;
  tabLayoutState.detectorCalls = 0;

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
  expect(tabLayoutState.detectorCalls).toBe(1);

  await act(async () => renderer!.unmount());
});

test('supported iOS uses native Liquid Glass tabs with localized labels', async () => {
  tabLayoutState.platform = 'ios';
  tabLayoutState.liquidGlassAvailable = true;
  tabLayoutState.detectorCalls = 0;

  let renderer: ReactTestRenderer;
  await act(async () => { renderer = create(<TabLayout />); });

  const root = renderer!.root;
  const tabs = root.findByType('NativeTabs' as any);
  expect(tabs.props.iconColor).toEqual({
    default: '#A8B0BC',
    selected: '#F1EEE6',
  });
  expect(tabs.props.labelStyle.default).toMatchObject({
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: '#A8B0BC',
  });
  expect(root.findAllByType('NativeTabTrigger' as any).map((trigger) => trigger.props.name)).toEqual([
    'index',
    'crystals',
    'natal',
    'explore',
  ]);
  expect(root.findAllByType('NativeTabLabel' as any).map((label) => label.props.children)).toEqual([
    'COSMOS',
    'CRYSTALS',
    'NATAL CHART',
    'EXPLORE',
  ]);
  const nativeIcons = root.findAllByType('NativeTabIcon' as any);
  expect(nativeIcons.map((icon) => icon.props.src.props)).toEqual([
    { family: 'Feather', name: 'sun' },
    { family: 'MaterialCommunityIcons', name: 'diamond-stone' },
    { family: 'Feather', name: 'target' },
    { family: 'Feather', name: 'compass' },
  ]);
  expect(tabLayoutState.detectorCalls).toBe(1);

  await act(async () => renderer!.unmount());
});

test.each(['android', 'web'])('%s keeps the classic tab bar without checking Liquid Glass', async (platform) => {
  tabLayoutState.platform = platform;
  tabLayoutState.liquidGlassAvailable = true;
  tabLayoutState.detectorCalls = 0;

  let renderer: ReactTestRenderer;
  await act(async () => { renderer = create(<TabLayout />); });

  expect(renderer!.root.findByType('Tabs' as any)).toBeDefined();
  expect(renderer!.root.findAllByType('NativeTabs' as any)).toHaveLength(0);
  expect(tabLayoutState.detectorCalls).toBe(0);

  await act(async () => renderer!.unmount());
});
