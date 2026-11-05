import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { LOCAL_KEY, emptyRecord } from '../profile/local';
import { APP_GUIDE_INTRO } from '../constants/app-guide';
import type { HomeLocation, UserProfile } from '../profile/profile';

const state = vi.hoisted(() => ({
  storage: new Map<string, string>(),
  search: vi.fn(),
  platformOS: 'web',
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => state.storage.get(key) ?? null,
    setItem: async (key: string, value: string) => { state.storage.set(key, value); },
  },
}));
vi.mock('react-native', () => ({
  AppState: { addEventListener: () => ({ remove: () => {} }) },
  ActivityIndicator: 'ActivityIndicator',
  Linking: { openURL: vi.fn() },
  PanResponder: { create: (handlers: any) => ({ panHandlers: {
    onMoveShouldSetResponderCapture: handlers.onMoveShouldSetPanResponderCapture,
    onResponderRelease: handlers.onPanResponderRelease,
  } }) },
  Platform: { get OS() { return state.platformOS; } },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
  useColorScheme: () => 'light',
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
  Stack: { Screen: 'StackScreen' },
  useRouter: () => ({ canGoBack: () => false, back: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/constants/content', () => ({
  crystalCatalog: [
    { name: 'Amethyst', themes: ['focus', 'calm'] },
    { name: 'Rose Quartz', themes: ['connection', 'empathy'] },
    { name: 'Clear Quartz', themes: ['clarity', 'perspective'] },
  ],
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
  let pressable: ReactTestInstance | null = text;
  while (pressable && typeof pressable.props.onPress !== 'function') {
    pressable = pressable.parent;
  }
  if (!pressable) {
    throw new Error(`Text is not inside a pressable button: ${label}`);
  }
  return pressable.props.onPress();
}
function input(root: ReactTestInstance, label: string, value: string) {
  const field = textInput(root, label);
  act(() => field.props.onChangeText(value));
}
function textInput(root: ReactTestInstance, label: string) {
  const field = root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === label);
  if (!field) throw new Error(`Could not find input: ${label}`);
  return field;
}
function typeDigits(root: ReactTestInstance, label: string, digits: string) {
  for (const digit of digits) {
    const field = textInput(root, label);
    const { value, selection } = field.props;
    const start = selection?.start ?? value.length;
    const end = selection?.end ?? start;
    input(root, label, `${value.slice(0, start)}${digit}${value.slice(end)}`);
  }
}
function setSelection(root: ReactTestInstance, label: string, start: number, end = start) {
  const field = textInput(root, label);
  act(() => field.props.onSelectionChange({ nativeEvent: { selection: { start, end } } }));
}
function selectionOf(root: ReactTestInstance, label: string) {
  return textInput(root, label).props.selection;
}
function replaceRange(root: ReactTestInstance, label: string, start: number, end: number, replacement: string) {
  let field = textInput(root, label);
  if (field.props.selection) {
    const pending = field.props.selection;
    setSelection(root, label, pending.start, pending.end);
    field = textInput(root, label);
  }
  setSelection(root, label, start, end);
  input(root, label, `${field.props.value.slice(0, start)}${replacement}${field.props.value.slice(end)}`);
}
function backspace(root: ReactTestInstance, label: string) {
  const field = textInput(root, label);
  const { value, selection } = field.props;
  const start = selection?.start ?? value.length;
  const end = selection?.end ?? start;
  const deleteStart = start === end ? Math.max(0, start - 1) : start;
  input(root, label, `${value.slice(0, deleteStart)}${value.slice(end)}`);
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
  state.platformOS = 'web';
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

test('birth date and time add separators while typing digits and keep the caret after them', async () => {
  await render(<ProfileForm submitLabel="Continue" onSubmit={vi.fn(async () => {})} />);
  const root = renderer!.root;
  typeDigits(root, 'Date of birth', '20000229');
  expect(textInput(root, 'Date of birth').props.value).toBe('2000-02-29');
  expect(selectionOf(root, 'Date of birth')).toBeUndefined();
  expect(textInput(root, 'Date of birth').props.keyboardType).toBe('number-pad');

  setBirthTimeKnown(root);
  typeDigits(root, 'Birth time', '1951');
  expect(textInput(root, 'Birth time').props.value).toBe('19:51');
  expect(selectionOf(root, 'Birth time')).toBeUndefined();
  expect(textInput(root, 'Birth time').props.keyboardType).toBe('number-pad');
});

test('backspace through an automatic separator removes a digit and remains editable', async () => {
  await render(<ProfileForm submitLabel="Continue" onSubmit={vi.fn(async () => {})} />);
  const root = renderer!.root;
  typeDigits(root, 'Date of birth', '1991');
  expect(textInput(root, 'Date of birth').props.value).toBe('1991-');
  backspace(root, 'Date of birth');
  expect(textInput(root, 'Date of birth').props.value).toBe('199');
  expect(selectionOf(root, 'Date of birth')).toEqual({ start: 3, end: 3 });

  setBirthTimeKnown(root);
  typeDigits(root, 'Birth time', '19');
  expect(textInput(root, 'Birth time').props.value).toBe('19:');
  backspace(root, 'Birth time');
  expect(textInput(root, 'Birth time').props.value).toBe('1');
  expect(selectionOf(root, 'Birth time')).toEqual({ start: 1, end: 1 });
});

test('pasting digits or separated dates formats them, and replacing middle digits preserves the cursor', async () => {
  await render(<ProfileForm submitLabel="Continue" onSubmit={vi.fn(async () => {})} />);
  const root = renderer!.root;
  input(root, 'Date of birth', '1991/06/20');
  expect(textInput(root, 'Date of birth').props.value).toBe('1991-06-20');
  expect(selectionOf(root, 'Date of birth')).toEqual({ start: 10, end: 10 });

  replaceRange(root, 'Date of birth', 5, 7, '12');
  expect(textInput(root, 'Date of birth').props.value).toBe('1991-12-20');
  expect(selectionOf(root, 'Date of birth')).toBeUndefined();

  setBirthTimeKnown(root);
  input(root, 'Birth time', '1951');
  expect(textInput(root, 'Birth time').props.value).toBe('19:51');
  replaceRange(root, 'Birth time', 3, 4, '4');
  expect(textInput(root, 'Birth time').props.value).toBe('19:41');
  expect(selectionOf(root, 'Birth time')).toBeUndefined();
});

test('date and time separators do not let a stale native cursor event reorder fast-entered digits', async () => {
  await render(<ProfileForm submitLabel="Continue" onSubmit={vi.fn(async () => {})} />);
  const root = renderer!.root;

  for (const partial of ['1', '19', '199', '1991']) input(root, 'Date of birth', partial);
  expect(textInput(root, 'Date of birth').props.value).toBe('1991-');
  expect(selectionOf(root, 'Date of birth')).toEqual({ start: 5, end: 5 });

  setSelection(root, 'Date of birth', 4);
  expect(selectionOf(root, 'Date of birth')).toEqual({ start: 5, end: 5 });
  input(root, 'Date of birth', '1991-0');
  setSelection(root, 'Date of birth', 6);
  input(root, 'Date of birth', '1991-06');
  expect(textInput(root, 'Date of birth').props.value).toBe('1991-06-');
  expect(selectionOf(root, 'Date of birth')).toEqual({ start: 8, end: 8 });

  for (const partial of ['1', '19']) input(root, 'Birth time', partial);
  expect(textInput(root, 'Birth time').props.value).toBe('19:');
  expect(selectionOf(root, 'Birth time')).toEqual({ start: 3, end: 3 });

  setSelection(root, 'Birth time', 2);
  expect(selectionOf(root, 'Birth time')).toEqual({ start: 3, end: 3 });
  input(root, 'Birth time', '19:5');
  setSelection(root, 'Birth time', 4);
  input(root, 'Birth time', '19:51');
  expect(textInput(root, 'Birth time').props.value).toBe('19:51');
});

test('unknown birth time is opt-in and selected location survives provider reload', async () => {
  await render(<ProfileProvider><OnboardingForm /><ProfileProbe /></ProfileProvider>);
  const root = renderer!.root;

  const unknownChoice = root.findAllByType(Pressable).find(node => node.props.accessibilityRole === 'checkbox');
  expect(unknownChoice?.props.accessibilityState.checked).toBe(false);
  input(root, 'Date of birth', '19910620');
  expect(root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === 'Date of birth')?.props.value).toBe('1991-06-20');
  setBirthTimeKnown(root);
  expect(root.findAllByType(Pressable).find(node => node.props.accessibilityRole === 'checkbox')?.props.accessibilityState.checked).toBe(true);
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

test('date and time fields format digit input, preserve edits, and retain validation-ready values', async () => {
  const saved = vi.fn(async () => {});
  await render(<ProfileForm submitLabel="Continue" onSubmit={saved} />);
  const root = renderer!.root;

  input(root, 'Date of birth', '20000229');
  input(root, 'Birth time', '1951');
  expect(root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === 'Date of birth')?.props.value).toBe('2000-02-29');
  expect(root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === 'Birth time')?.props.value).toBe('19:51');
  const unknownChoice = root.findAllByType(Pressable).find(node => node.props.accessibilityRole === 'checkbox');
  expect(unknownChoice?.props.accessibilityState.checked).toBe(false);
  expect(root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === 'Birth time')?.props.editable).toBe(true);
  act(() => unknownChoice?.props.onPress());
  expect(root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === 'Birth time')?.props.editable).toBe(false);
  act(() => unknownChoice?.props.onPress());
  expect(root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === 'Birth time')?.props.editable).toBe(true);
  expect(root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === 'Birth time')?.props.value).toBe('19:51');
});

test('settings can update the birthplace city and time without changing other profile values', async () => {
  state.storage.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), profile: existingProfile }));
  await render(<ProfileProvider><SettingsScreen /><ProfileProbe /></ProfileProvider>);
  const root = renderer!.root;

  await act(async () => { await pressText(root, 'Profile'); });
  setBirthTimeKnown(root);
  input(root, 'Birth time', '08:45');
  await chooseCity(root, 'Place of birth', selectedBirthPlace);
  await act(async () => { await pressText(root, 'Save Changes'); });

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

  await act(async () => { await pressText(root, 'Profile'); });
  input(root, 'Place of birth', 'Vienna');
  await act(async () => { await pressText(root, 'Save Changes'); });

  expect(profileState.profile).toEqual(existingProfile);
  expect(alertText(root)).toContain('Search for and select your place of birth.');
});

test('saving an unchanged profile succeeds locally and leaves the user on Settings', async () => {
  state.storage.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), profile: existingProfile }));
  await render(<ProfileProvider><SettingsScreen /><ProfileProbe /></ProfileProvider>);
  const root = renderer!.root;

  await act(async () => { await pressText(root, 'Profile'); });
  await act(async () => { await pressText(root, 'Save Changes'); });

  expect(profileState.profile).toEqual(existingProfile);
  expect(textContent(findTextNode(root, 'Birth details saved on this device.')?.props.children)).toBe('Birth details saved on this device.');
  expect(root.findAllByProps({ testID: 'settings-tab-profile' })).toHaveLength(1);
});

test('Back saves valid profile edits before returning to the Settings menu', async () => {
  state.storage.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), profile: existingProfile }));
  await render(<ProfileProvider><SettingsScreen /><ProfileProbe /></ProfileProvider>);
  const root = renderer!.root;

  await act(async () => { await pressText(root, 'Profile'); });
  input(root, 'Date of birth', '1990-01-15');
  setBirthTimeKnown(root);
  input(root, 'Birth time', '08:45');
  await chooseCity(root, 'Place of birth', selectedBirthPlace);
  await act(async () => { await pressText(root, 'Back'); });

  const updatedProfile = {
    ...existingProfile,
    birthDate: '1990-01-15',
    birthTime: { status: 'known', localTime: '08:45' },
    birthPlace: selectedBirthPlace,
  };
  expect(profileState.profile).toEqual(updatedProfile);
  expect(JSON.parse(state.storage.get(LOCAL_KEY)!).profile).toEqual(updatedProfile);
  expect(root.findAllByProps({ testID: 'settings-tab-profile' })).toHaveLength(1);
});

test('Back keeps profile editing open when the draft is invalid', async () => {
  state.storage.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), profile: existingProfile }));
  await render(<ProfileProvider><SettingsScreen /><ProfileProbe /></ProfileProvider>);
  const root = renderer!.root;

  await act(async () => { await pressText(root, 'Profile'); });
  input(root, 'Date of birth', '199001');
  await act(async () => { await pressText(root, 'Back'); });

  expect(profileState.profile).toEqual(existingProfile);
  expect(alertText(root)).toContain('Enter your birth date as YYYY-MM-DD.');
  expect(root.findAllByProps({ testID: 'settings-tab-profile' })).toHaveLength(0);
});

test('an iOS edge swipe returns from a Settings section to the Settings menu', async () => {
  state.platformOS = 'ios';
  state.storage.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), profile: existingProfile }));
  await render(<ProfileProvider><SettingsScreen /><ProfileProbe /></ProfileProvider>);
  const root = renderer!.root;
  const stackOptions = () => root.findAll((node) => String(node.type) === 'StackScreen')[0].props.options;

  await act(async () => { root.findByProps({ testID: 'settings-tab-about' }).props.onPress(); });
  expect(stackOptions().gestureEnabled).toBe(false);
  const edge = root.findAllByProps({ testID: 'settings-edge-swipe-back' })
    .find((node) => String(node.type) === 'View')!.props;
  expect(edge.onMoveShouldSetResponderCapture({}, { x0: 12, dx: 28, dy: 2 })).toBe(true);
  await act(async () => {
    edge.onResponderRelease({}, { x0: 12, dx: 100, dy: 8 });
  });

  expect(findTextNode(root, 'A few things you can shape on this device.')).toBeDefined();
  expect(stackOptions().gestureEnabled).toBe(true);
});

test('About contains the single crystal-image disclosure', async () => {
  state.storage.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), profile: existingProfile }));
  await render(<ProfileProvider><SettingsScreen /><ProfileProbe /></ProfileProvider>);
  const root = renderer!.root;

  await act(async () => { await pressText(root, 'About'); });

  expect(findTextNode(
    root,
    'Some crystal images are AI-generated illustrations, not photographs of verified specimens. Real stones vary in colour, shape, and pattern.',
  )).toBeDefined();
  expect(findTextNode(root, 'About Soul Compass')).toBeDefined();
  expect(findTextNode(root, 'Cosmos')).toBeDefined();
  expect(findTextNode(root, 'Crystals')).toBeDefined();
  expect(findTextNode(root, 'Natal Chart')).toBeDefined();
  expect(findTextNode(root, APP_GUIDE_INTRO)).toBeDefined();
});

test('catalog search keeps collection and hidden-stone changes saved locally', async () => {
  state.storage.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), profile: existingProfile }));
  await render(<ProfileProvider><SettingsScreen /><ProfileProbe /></ProfileProvider>);
  const root = renderer!.root;
  await act(async () => { await pressText(root, 'Preferences'); });
  await act(async () => {
    root.findByProps({ accessibilityLabel: 'Search stones in the collection catalog' }).props.onChangeText('ROSE');
  });
  expect(root.findAllByProps({ testID: 'settings-collect-amethyst' })).toHaveLength(0);
  await act(async () => { root.findByProps({ testID: 'settings-collect-rose-quartz' }).props.onPress(); });
  expect(profileState.preferences.crystalCollection).toContain('rose-quartz');
  await act(async () => {
    root.findByProps({ accessibilityLabel: 'Search stones to hide or restore' }).props.onChangeText('rose');
  });
  await act(async () => { root.findByProps({ testID: 'settings-hide-rose-quartz' }).props.onPress(); });
  expect(profileState.preferences.crystalPreferences.hiddenCrystals).toContain('rose-quartz');
  expect(profileState.profile).toEqual(existingProfile);
  await act(async () => renderer?.unmount());
  await render(<ProfileProvider><ProfileProbe /></ProfileProvider>);
  expect(profileState.preferences.crystalCollection).toContain('rose-quartz');
  expect(profileState.preferences.crystalPreferences.hiddenCrystals).toContain('rose-quartz');
});

test('preferences offers daily feelings without intentions and supports changing or clearing the choice', async () => {
  state.storage.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), profile: existingProfile }));
  await render(<ProfileProvider><SettingsScreen /><ProfileProbe /></ProfileProvider>);
  const root = renderer!.root;
  await act(async () => { await pressText(root, 'Preferences'); });
  expect(findTextNode(root, 'How are you feeling today?')).toBeDefined();
  for (const label of ['Intentions', 'Rest', 'Focus', 'Reflection', 'Courage', 'Connection', 'Change', 'Save custom intentions']) {
    expect(findTextNode(root, label)).toBeUndefined();
  }
  expect(root.findAllByType(TextInput).some(node =>
    node.props.accessibilityLabel === 'Custom intentions, comma separated',
  )).toBe(false);
  expect(root.findAllByType(Text).some(node =>
    textContent(node.props.children).includes('resets at midnight on your device'),
  )).toBe(true);
  const choices = root.findAllByType(Pressable).filter(node =>
    node.props.testID?.startsWith('settings-feeling-'),
  );
  expect(choices).toHaveLength(12);
  const first = choices[0].props.testID;
  const second = choices[1].props.testID;
  await act(async () => { root.findByProps({ testID: first }).props.onPress(); });
  expect(root.findByProps({ testID: first }).props.accessibilityState.checked).toBe(true);
  await act(async () => { root.findByProps({ testID: second }).props.onPress(); });
  expect(root.findByProps({ testID: first }).props.accessibilityState.checked).toBe(false);
  expect(root.findByProps({ testID: second }).props.accessibilityState.checked).toBe(true);
  await act(async () => { root.findByProps({ testID: second }).props.onPress(); });
  expect(profileState.preferences.crystalPreferences.feeling).toBeNull();
  expect(profileState.profile).toEqual(existingProfile);
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
  setBirthTimeKnown(root);
  await act(async () => { await pressText(root, 'Continue'); });
  expect(saved).not.toHaveBeenCalled();
  expect(alertText(root)).toContain('place of birth');
});
