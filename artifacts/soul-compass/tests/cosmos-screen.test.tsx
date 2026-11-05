import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({
  push: vi.fn(),
  getDailyAstrology: vi.fn(),
}));

vi.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
vi.mock('expo-router', () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock('../assets/images/cosmos-starfield.jpg', () => ({ default: 'cosmos-starfield' }));
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
    absoluteFillObject: { top: 0, right: 0, bottom: 0, left: 0 },
    create: (styles: unknown) => styles,
  },
  Text: 'Text',
  View: 'View',
  useWindowDimensions: () => ({ height: 844, width: 390 }),
}));
vi.mock('@/components/SettingsButton', () => ({ SettingsButton: () => null }));
vi.mock('@/constants/content', () => ({
  dailyReading: {
    label: 'SAMPLE REFLECTION',
    title: 'Focus on one thing at a time.',
    body: 'Choose one thing to notice.',
    favorableFocus: 'Choose one thing.',
    gentleCaution: 'Take your time.',
    reflection: 'What deserves my attention?',
    status: 'Sample reflection.',
  },
}));
vi.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    cosmos: {
      background: '#111B2B',
      homeBackground: '#070B13',
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
  const screenCopy = root.findAllByType(Text).map((node) => node.props.children);
  expect(screenCopy).toContain('SOUL COMPASS');
  expect(screenCopy).not.toContain('DAILY PRACTICE');
  expect(screenCopy).not.toContain('A DAILY PAUSE');
  expect(screenCopy).toContain('FOCUS FOR TODAY');
  expect(screenCopy).toContain('WHAT TO LEAVE FOR LATER');
  expect(screenCopy).not.toContain('OPTIONAL');
  expect(root.findAllByProps({ name: 'info' })).toHaveLength(3);
  expect(root.findAllByProps({ name: 'compass' })).toHaveLength(0);
  expect(root.findAllByProps({ name: 'moon-outline' })).toHaveLength(0);
  expect(root.findAllByProps({ name: 'wind' })).toHaveLength(0);
  expect(root.findAllByProps({ name: 'arrow-up-right' })).toHaveLength(0);
  const starLayer = root.findByProps({ testID: 'cosmos-background-stars' });
  expect(starLayer.props.children).toHaveLength(24);
  expect(starLayer.props.style.bottom).toBe(0);
  const scrollView = root.findByProps({ accessibilityLabel: 'Daily reflection' });
  expect(scrollView.props.bounces).toBe(false);
  expect(scrollView.props.alwaysBounceVertical).toBe(false);
  expect(scrollView.props.overScrollMode).toBe('never');
  expect(scrollView.props.contentContainerStyle[0].paddingBottom).toBe(8);
  expect(scrollView.findAllByProps({ testID: 'cosmos-background-stars' })).toHaveLength(0);
  const natalLink = scrollView.findByProps({ testID: 'cosmos-natal-link' });
  const page = natalLink.parent!;
  expect(page.children[page.children.length - 1]).toBe(natalLink);
  const moment = root.findAllByType(Pressable).find(
    (button: ReactTestInstance) => button.props.accessibilityLabel === 'Read more about A moment to keep',
  );
  expect(moment).toBeDefined();

  await act(async () => { moment?.props.onPress(); });
  const stage = root.findByProps({ testID: 'cosmos-explanation-stage' });
  expect(stage.props.style.justifyContent).toBe('center');
  const modal = root.findByProps({ testID: 'cosmos-explanation-modal' });
  expect(modal).toBeDefined();
  const modalCopy = modal.findAllByType(Text).map((node) => node.props.children);
  expect(modalCopy).not.toContain('About this question');
  expect(modalCopy).not.toContain('What deserves my attention?');
  expect(modalCopy.join(' ')).toContain('This prompt connects today’s reflection');
  expect(state.getDailyAstrology).not.toHaveBeenCalled();

  await act(async () => {
    root.findByProps({ accessibilityLabel: 'Close explanation' }).props.onPress();
  });
  expect(root.findAllByProps({ testID: 'cosmos-explanation-modal' })).toHaveLength(0);
});

test('daily reflection opens directly to its plain-language explanation', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await act(async () => {
    renderer = create(<CosmosScreen />);
  });
  const root = renderer!.root;
  const reflection = root.findByProps({
    accessibilityLabel: 'Read more about today’s reflection',
  });

  await act(async () => { reflection.props.onPress(); });
  const modal = root.findByProps({ testID: 'cosmos-explanation-modal' });
  const modalCopy = modal.findAllByType(Text).map((node) => node.props.children);
  expect(modalCopy).not.toContain('A plain-language read');
  expect(modalCopy.join(' ')).toContain('choose what matters');
});

test('ritual ideas use the shared info button and no optional label', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await act(async () => {
    renderer = create(<CosmosScreen />);
  });
  const root = renderer!.root;
  const ideasButton = root.findByProps({
    accessibilityLabel: 'Explore other daily ritual ideas',
  });

  await act(async () => { ideasButton.props.onPress(); });
  const modal = root.findByProps({ testID: 'cosmos-explanation-modal' });
  const modalCopy = modal.findAllByType(Text).map((node) => node.props.children);
  expect(modalCopy).toContain('Other ideas for today');
  expect(modalCopy).not.toContain('OPTIONAL');
});
