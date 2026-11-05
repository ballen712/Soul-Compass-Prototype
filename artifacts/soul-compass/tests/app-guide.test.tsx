import React from 'react';
import { Modal, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { APP_GUIDE_INTRO, APP_GUIDE_SEEN_KEY, APP_GUIDE_TABS } from '../constants/app-guide';

const memory = vi.hoisted(() => new Map<string, string>());
const profileState = vi.hoisted(() => ({
  profile: { birthDate: '1990-01-01' },
  loaded: true,
  error: null as string | null,
  privacy: {
    astrologyApiConsent: false,
    consentTimestamp: null as string | null,
    consentVersion: null as string | null,
    revokedAt: null as string | null,
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => memory.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => { memory.set(key, value); }),
  },
}));
vi.mock('react-native', () => ({
  Modal: 'Modal',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    background: '#F5F1E8',
    foreground: '#30342F',
    card: '#FFFCF6',
    border: '#DDD6C8',
    mutedForeground: '#77766D',
    cosmos: {
      background: '#111B2B',
      surface: '#172438',
      foreground: '#F1EEE6',
      secondary: '#D6C39B',
      mutedForeground: '#A8B0BC',
      border: '#354258',
    },
  }),
}));
vi.mock('@/profile/ProfileContext', () => ({ useProfile: () => profileState }));

import { FirstRunAppGuide } from '../components/FirstRunAppGuide';

let renderer: ReactTestRenderer | undefined;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  memory.clear();
  profileState.profile = { birthDate: '1990-01-01' };
  profileState.loaded = true;
  profileState.error = null;
  profileState.privacy = {
    astrologyApiConsent: false,
    consentTimestamp: null,
    consentVersion: null,
    revokedAt: null,
  };
});

afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
});

test('the guide waits until the separate chart-consent prompt has been resolved', async () => {
  await act(async () => {
    renderer = create(<FirstRunAppGuide />);
    await Promise.resolve();
  });
  expect(renderer!.root.findByType(Modal).props.visible).toBe(false);

  profileState.privacy.revokedAt = new Date().toISOString();
  await act(async () => {
    renderer!.update(<FirstRunAppGuide />);
    await Promise.resolve();
  });
  expect(renderer!.root.findByType(Modal).props.visible).toBe(true);
});

test('the first-run guide explains each current tab and stays dismissed on later launches', async () => {
  profileState.privacy.astrologyApiConsent = true;
  profileState.privacy.consentVersion = '2026-11-04-v3';
  await act(async () => {
    renderer = create(<FirstRunAppGuide />);
    await Promise.resolve();
  });

  const firstCopy = renderer!.root.findAllByType(Text).map(node => node.props.children);
  expect(firstCopy).toContain(APP_GUIDE_INTRO);
  for (const tab of APP_GUIDE_TABS) {
    expect(firstCopy).toContain(tab.title);
    expect(firstCopy).toContain(tab.description);
  }

  await act(async () => {
    await renderer!.root.findByProps({ testID: 'first-run-guide-start' }).props.onPress();
  });
  expect(memory.get(APP_GUIDE_SEEN_KEY)).toBe('true');
  expect(renderer!.root.findByType(Modal).props.visible).toBe(false);

  await act(async () => renderer?.unmount());
  renderer = undefined;
  await act(async () => {
    renderer = create(<FirstRunAppGuide />);
    await Promise.resolve();
  });
  expect(renderer!.root.findByType(Modal).props.visible).toBe(false);
});
