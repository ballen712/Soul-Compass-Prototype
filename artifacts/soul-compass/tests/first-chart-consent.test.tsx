import React from 'react';
import { Modal, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { CONSENT_VERSION } from '../profile/local';

const state = vi.hoisted(() => ({
  profile: null as null | { birthDate: string },
  loaded: true,
  error: null as string | null,
  privacy: {
    astrologyApiConsent: false,
    consentTimestamp: null as string | null,
    consentVersion: null as string | null,
    revokedAt: null as string | null,
  },
  setConsent: vi.fn(async (_allowed: boolean) => {}),
}));

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Modal: 'Modal',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    cosmos: {
      background: '#111B2B', surface: '#172438', foreground: '#F1EEE6',
      secondary: '#D6C39B', mutedForeground: '#A8B0BC', border: '#354258',
    },
  }),
}));
vi.mock('@/profile/ProfileContext', () => ({ useProfile: () => state }));

import { FirstChartConsentPrompt } from '../components/FirstChartConsentPrompt';

let renderer: ReactTestRenderer | undefined;
function button(label: string) {
  return renderer!.root.findAllByType(Text).find(node => node.props.children === label)?.parent;
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.profile = null;
  state.loaded = true;
  state.error = null;
  state.privacy = {
    astrologyApiConsent: false,
    consentTimestamp: null,
    consentVersion: null,
    revokedAt: null,
  };
  state.setConsent.mockReset().mockResolvedValue(undefined);
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
});

test('the first-run prompt appears after a profile exists and consent is unset', async () => {
  state.profile = { birthDate: '2000-01-01' };
  await act(async () => { renderer = create(<FirstChartConsentPrompt />); });
  expect(renderer!.root.findByType(Modal).props.visible).toBe(true);
  const copy = renderer!.root.findAllByType(Text).map(node => node.props.children);
  expect(copy).toContain('Create your Natal Chart?');
  expect(copy).not.toContain('OPTIONAL');
  expect(copy.join(' ')).not.toContain('Cosmos and Crystals still work');
  expect(copy.join(' ')).toContain('only to calculate your chart');
  expect(copy.join(' ')).toContain('do not create an online profile with them');
  expect(copy.join(' ')).toContain('Your profile and chart stay on this device');
  expect(copy.join(' ')).toContain('delete your saved data in Settings');
  expect(copy.join(' ')).not.toContain('If you are offline');
});

test('Agree and Not now save one explicit choice and close the prompt', async () => {
  state.profile = { birthDate: '2000-01-01' };
  await act(async () => { renderer = create(<FirstChartConsentPrompt />); });
  await act(async () => { await button('Agree and calculate')?.props.onPress(); });
  expect(state.setConsent).toHaveBeenCalledWith(true);
  expect(renderer!.root.findByType(Modal).props.visible).toBe(false);

  await act(async () => renderer?.unmount());
  renderer = undefined;
  state.setConsent.mockClear();
  state.privacy = { ...state.privacy, astrologyApiConsent: false, revokedAt: null };
  await act(async () => { renderer = create(<FirstChartConsentPrompt />); });
  await act(async () => { await button('Not now')?.props.onPress(); });
  expect(state.setConsent).toHaveBeenCalledWith(false);
  expect(renderer!.root.findByType(Modal).props.visible).toBe(false);
});

test('the prompt stays hidden after consent was granted or dismissed', async () => {
  state.profile = { birthDate: '2000-01-01' };
  state.privacy = {
    ...state.privacy,
    astrologyApiConsent: true,
    consentTimestamp: new Date().toISOString(),
    consentVersion: CONSENT_VERSION,
  };
  await act(async () => { renderer = create(<FirstChartConsentPrompt />); });
  expect(renderer!.root.findByType(Modal).props.visible).toBe(false);
  await act(async () => renderer?.unmount());
  renderer = undefined;
  state.privacy = { ...state.privacy, astrologyApiConsent: false, revokedAt: new Date().toISOString() };
  await act(async () => { renderer = create(<FirstChartConsentPrompt />); });
  expect(renderer!.root.findByType(Modal).props.visible).toBe(false);
});

test('an older consent version requires updated consent before any calculation', async () => {
  state.profile = { birthDate: '2000-01-01' };
  state.privacy = {
    ...state.privacy,
    astrologyApiConsent: true,
    consentTimestamp: new Date().toISOString(),
    consentVersion: '2026-11-04-v2',
  };
  await act(async () => { renderer = create(<FirstChartConsentPrompt />); });
  expect(renderer!.root.findByType(Modal).props.visible).toBe(true);
});
