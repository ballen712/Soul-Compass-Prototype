import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { LOCAL_KEY, emptyRecord } from '../profile/local';
import type { HomeLocation, UserProfile } from '../profile/profile';

const state = vi.hoisted(() => ({
  storage: new Map<string, string>(),
  search: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => state.storage.get(key) ?? null,
    setItem: async (key: string, value: string) => { state.storage.set(key, value); },
  },
}));
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Linking: { openURL: vi.fn() },
  Platform: { OS: 'web' },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: View,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
vi.mock('@/components/KeyboardAwareScrollViewCompat', () => ({
  KeyboardAwareScrollViewCompat: View,
}));
vi.mock('@/services/geocoding', () => ({
  searchHomeCities: (...args: unknown[]) => state.search(...args),
}));
vi.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => false, back: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/constants/content', () => ({
  alternativeCrystals: [],
  samplePrimaryCrystal: { name: 'Amethyst' },
}));

import { ProfileForm } from '../components/ProfileForm';
import SettingsScreen from '../app/settings';
import { ProfileProvider, useProfile } from '../profile/ProfileContext';

const originalBirthPlace: HomeLocation = {
  city: 'Budapest', country: 'Hungary', latitude: 47.4979, longitude: 19.0402, timeZone: 'Europe/Budapest',
};
const selectedBirthPlace: HomeLocation = {
  city: 'Prague', country: 'Czechia', latitude: 50.0755, longitude: 14.4378, timeZone: 'Europe/Prague',
};
const currentResidence: HomeLocation = {
  city: 'Kyiv', country: 'Ukraine', latitude: 50.4501, longitude: 30.5234, timeZone: 'Europe/Kyiv',
};
const existingProfile: UserProfile = {
  birthDate: '1991-06-20',
  birthTime: { status: 'unknown' },
  birthPlace: originalBirthPlace,
  currentResidence,
};

let renderer: ReactTestRenderer | undefined;
let profileState: ReturnType<typeof useProfile>;

function ProfileProbe() {
  profileState = useProfile();
  return null;
}
function OnboardingForm() {
  const profile = useProfile();
  return <ProfileForm submitLabel="Enter Soul Compass" onSubmit={profile.saveProfile} />;
}
function render(element: React.ReactElement) {
  return act(async () => { renderer = create(element); });
}
function findTextNode(root: ReactTestInstance, label: string) {
  return root.findAllByType(Text).find(node => textContent(node.props.children) === label);
}
function textContent(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textContent).join('');
  if (value && typeof value === 'object' && 'props' in value) {
    return textContent((value as { props: { children?: unknown } }).props.children);
  }
  return '';
}
function pressText(root: ReactTestInstance, label: string) {
  const text = findTextNode(root, label);
  if (!text) throw new Error(`Could not find text: ${label}`);
  const pressable = text.parent;
  if (!pressable || typeof pressable.props.onPress !== 'function') {
    throw new Error(`Text is not inside a pressable button: ${label}`);
  }
  return pressable.props.onPress();
}
function input(root: ReactTestInstance, label: string, value: string) {
  const field = root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === label);
  if (!field) throw new Error(`Could not find input: ${label}`);
  act(() => field.props.onChangeText(value));
}
function setBirthTimeKnown(root: ReactTestInstance) {
  const unknownChoice = root.findAllByType(Pressable).find(node => node.props.accessibilityRole === 'checkbox');
  if (!unknownChoice) throw new Error('Could not find the unknown birth-time choice.');
  act(() => unknownChoice.props.onPress());
}
async function chooseCity(root: ReactTestInstance, label: string, city: HomeLocation) {
  input(root, label, city.city);
  await act(async () => { await pressText(root, 'Search'); });
  await act(async () => { await pressText(root, city.city); });
}
function alertText(root: ReactTestInstance) {
  const alert = root.findAll(node => node.props.accessibilityRole === 'alert')[0];
  return alert ? textContent(alert.props.children) : '';
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.storage.clear();
  state.search.mockReset();
  state.search.mockImplementation(async (query: string) => [
    query.toLowerCase() === 'prague'
      ? { ...selectedBirthPlace, admin1: undefined }
      : { ...originalBirthPlace, admin1: undefined },
  ]);
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
});

test('onboarding accepts a known birth time', async () => {
  const saved = vi.fn(async () => {});
  await render(<ProfileForm submitLabel="Continue" onSubmit={saved} />);
  const root = renderer!.root;

  input(root, 'Date of birth', '2000-02-29');
  setBirthTimeKnown(root);
  input(root, 'Birth time', '00:01');
  await chooseCity(root, 'Place of birth', selectedBirthPlace);
  await act(async () => { await pressText(root, 'Continue'); });

  expect(saved).toHaveBeenCalledWith({
    birthDate: '2000-02-29',
    birthTime: { status: 'known', localTime: '00:01' },
    birthPlace: selectedBirthPlace,
    currentResidence: null,
  });
});

test('onboarding explicitly accepts an unknown time and selected location survives provider reload', async () => {
  await render(<ProfileProvider><OnboardingForm /><ProfileProbe /></ProfileProvider>);
  const root = renderer!.root;

  const unknownChoice = root.findAllByType(Pressable).find(node => node.props.accessibilityRole === 'checkbox');
  expect(unknownChoice?.props.accessibilityState.checked).toBe(true);
  input(root, 'Date of birth', '1991-06-20');
  await chooseCity(root, 'Place of birth', selectedBirthPlace);
  await act(async () => { await pressText(root, 'Enter Soul Compass'); });

  expect(profileState.profile).toEqual({
    birthDate: '1991-06-20',
    birthTime: { status: 'unknown' },
    birthPlace: selectedBirthPlace,
    currentResidence: null,
  });
  expect(JSON.parse(state.storage.get(LOCAL_KEY)!).profile.birthPlace).toEqual(selectedBirthPlace);

  await act(async () => renderer?.unmount());
  await render(<ProfileProvider><ProfileProbe /></ProfileProvider>);
  expect(profileState.profile?.birthPlace).toEqual(selectedBirthPlace);
  expect(profileState.profile?.birthPlace).toMatchObject({
    city: 'Prague', latitude: 50.0755, longitude: 14.4378, timeZone: 'Europe/Prague',
  });
});

test('settings can update the birthplace city and time without changing other profile values', async () => {
  state.storage.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), profile: existingProfile }));
  await render(<ProfileProvider><SettingsScreen /><ProfileProbe /></ProfileProvider>);
  const root = renderer!.root;

  setBirthTimeKnown(root);
  input(root, 'Birth time', '08:45');
  await chooseCity(root, 'Place of birth', selectedBirthPlace);
  await act(async () => { await pressText(root, 'Save changes'); });

  expect(profileState.profile).toEqual({
    ...existingProfile,
    birthTime: { status: 'known', localTime: '08:45' },
    birthPlace: selectedBirthPlace,
  });
  expect(profileState.profile?.birthDate).toBe(existingProfile.birthDate);
  expect(profileState.profile?.currentResidence).toEqual(currentResidence);
});

test('editing a city without selecting a search result cannot save the old location', async () => {
  state.storage.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), profile: existingProfile }));
  await render(<ProfileProvider><SettingsScreen /><ProfileProbe /></ProfileProvider>);
  const root = renderer!.root;

  input(root, 'Place of birth', 'Vienna');
  await act(async () => { await pressText(root, 'Save changes'); });

  expect(profileState.profile).toEqual(existingProfile);
  expect(alertText(root)).toContain('Search for and select your place of birth.');
});

test('onboarding rejects impossible dates and a missing birthplace', async () => {
  const saved = vi.fn(async () => {});
  await render(<ProfileForm submitLabel="Continue" onSubmit={saved} />);
  const root = renderer!.root;

  input(root, 'Date of birth', '2025-02-29');
  await act(async () => { await pressText(root, 'Continue'); });
  expect(saved).not.toHaveBeenCalled();
  expect(alertText(root)).toContain('birth date');

  input(root, 'Date of birth', '2024-02-29');
  await act(async () => { await pressText(root, 'Continue'); });
  expect(saved).not.toHaveBeenCalled();
  expect(alertText(root)).toContain('place of birth');
});
