import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({
  preferences: {
    language: 'en',
    crystalCollection: [] as string[],
    crystalPreferences: {
      intentions: [] as string[],
      hiddenCrystals: [] as string[],
      feeling: null as string | null,
      feelingDate: null as string | null,
    },
  },
  onboardingDraft: null,
  saveProfile: vi.fn(async () => {}),
  savePreferences: vi.fn(async () => {}),
}));
const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Platform: { OS: 'ios' },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles, hairlineWidth: 0.5 },
  Text: 'Text',
  View: 'View',
}));
vi.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));
vi.mock('react-native-svg', () => ({ default: 'Svg', Path: 'Path', Rect: 'Rect' }));
vi.mock('expo-router', () => ({ useRouter: () => navigation }));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('@/components/ProfileForm', () => ({ ProfileForm: 'ProfileForm' }));
vi.mock('@/profile/ProfileContext', () => ({
  useProfile: () => state,
}));
vi.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    background: '#F5F1E8',
    foreground: '#30342F',
    card: '#FFFCF6',
    border: '#DDD6C8',
    mutedForeground: '#77766D',
    destructive: '#A85247',
    tint: '#8A7859',
    radius: 24,
    cosmos: {
      homeBackground: '#070B13',
      card: '#1D2B40',
      foreground: '#F1EEE6',
      secondary: '#D6C39B',
      mutedForeground: '#A8B0BC',
      border: '#354258',
    },
  }),
}));

import OnboardingScreen from '../app/onboarding';

let renderer: ReactTestRenderer | undefined;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.preferences = {
    language: 'en',
    crystalCollection: [],
    crystalPreferences: {
      intentions: [],
      hiddenCrystals: [],
      feeling: null,
      feelingDate: null,
    },
  };
  state.onboardingDraft = null;
  state.saveProfile.mockReset();
  state.savePreferences.mockReset().mockResolvedValue(undefined);
  navigation.push.mockReset();
});

afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
});

test('first launch asks for a language before showing the birth profile form', async () => {
  await act(async () => {
    renderer = create(<OnboardingScreen />);
  });

  expect(renderer!.root.findByProps({ testID: 'language-option-en' })).toBeDefined();
  expect(renderer!.root.findByProps({ testID: 'language-option-ru' })).toBeDefined();
  expect(renderer!.root.findAll((node) => String(node.type) === 'ProfileForm')).toHaveLength(0);
});

test('language picker uses the shared header, hides visible names, and opens Settings', async () => {
  await act(async () => {
    renderer = create(<OnboardingScreen />);
  });
  const root = renderer!.root;
  const visibleText = root.findAll((node) => String(node.type) === 'Text')
    .map((node) => typeof node.props.children === 'string' ? node.props.children : '')
    .join(' ');

  expect(root.findByProps({ testID: 'settings-button' })).toBeDefined();
  expect(root.findByProps({ testID: 'language-option-en' }).props.accessibilityLabel).toContain('English');
  expect(visibleText).not.toContain('English');
  expect(visibleText).not.toContain('Magyar');
  expect(visibleText).toContain('Choose your language');

  await act(async () => {
    root.findByProps({ testID: 'settings-button' }).props.onPress();
  });
  expect(navigation.push).toHaveBeenCalledExactlyOnceWith('/settings');
});

test('choosing a language saves it locally and then opens onboarding', async () => {
  await act(async () => {
    renderer = create(<OnboardingScreen />);
  });

  await act(async () => {
    await renderer!.root.findByProps({ testID: 'language-option-es' }).props.onPress();
  });

  expect(state.savePreferences).toHaveBeenCalledExactlyOnceWith({
    ...state.preferences,
    language: 'es',
  });
  const profileForms = renderer!.root.findAll((node) => String(node.type) === 'ProfileForm');
  expect(profileForms).toHaveLength(1);
  expect(profileForms[0].props.includeResidence).toBe(false);
  expect(renderer!.root.findAllByProps({ testID: 'language-option-es' })).toHaveLength(0);
});

test('a local save error keeps the user on the language screen', async () => {
  state.savePreferences.mockRejectedValueOnce(new Error('storage unavailable'));
  await act(async () => {
    renderer = create(<OnboardingScreen />);
  });

  await act(async () => {
    await renderer!.root.findByProps({ testID: 'language-option-hu' }).props.onPress();
  });

  expect(renderer!.root.findByProps({ testID: 'language-option-hu' })).toBeDefined();
  expect(renderer!.root.findAll((node) => String(node.type) === 'ProfileForm')).toHaveLength(0);
  expect(renderer!.root.findAllByProps({ accessibilityRole: 'alert' })).toHaveLength(1);
});
