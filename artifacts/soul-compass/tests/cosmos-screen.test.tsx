import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({
  push: vi.fn(),
  getDailyAstrology: vi.fn(),
  profile: null as unknown,
  preferences: {
    language: 'en',
    crystalCollection: [] as string[],
    crystalPreferences: { intentions: [] as string[], hiddenCrystals: [] as string[], feeling: null as string | null, feelingDate: null as string | null },
  },
  scrollToTopRef: null as null | { current: unknown },
}));

vi.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: state.push }),
  useScrollToTop: (ref: { current: unknown }) => { state.scrollToTopRef = ref; },
}));
vi.mock('../assets/images/cosmos-starfield.jpg', () => ({ default: 'cosmos-starfield' }));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
vi.mock('react-native', () => ({
  Image: 'Image',
  Modal: 'Modal',
  PanResponder: { create: (handlers: any) => ({ panHandlers: {
    onMoveShouldSetResponderCapture: handlers.onMoveShouldSetPanResponderCapture,
    onResponderRelease: handlers.onPanResponderRelease,
  } }) },
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
vi.mock('@/profile/ProfileContext', () => ({
  useProfile: () => ({ profile: state.profile, preferences: state.preferences }),
}));
vi.mock('@/profile/daily-cache', () => ({ getDailyAstrology: state.getDailyAstrology }));
vi.mock('@/profile/daily-personalization', () => ({
  getDailyPersonalizationContext: ({ profile, now }: any) => ({
    date: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
    timeZone: null,
    astrology: profile ? state.getDailyAstrology(profile, now) : null,
    transitAnalysis: profile ? state.getDailyAstrology(profile, now)?.transitAnalysis ?? null : null,
    natalProfile: { placements: [], elementBalance: null },
    mood: { selectedMood: null, selectedDay: null },
    crystals: {
      ownedCrystals: [],
      hiddenCrystals: [],
      intentions: [],
      natalRecommendations: [],
      dailyCandidates: [],
    },
  }),
}));
vi.mock('@/hooks/useLocalClock', () => ({ useLocalClock: () => new Date('2026-11-05T12:00:00.000Z') }));

import CosmosScreen from '../app/(tabs)/index';

let renderer: ReactTestRenderer | undefined;

afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
  state.push.mockReset();
  state.getDailyAstrology.mockReset();
  state.profile = null;
  state.scrollToTopRef = null;
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
  expect(screenCopy).toContain('Focus for today');
  expect(screenCopy).toContain('What to leave for later');
  expect(screenCopy).toContain('A moment to keep');
  expect(screenCopy).toContain('A small daily ritual');
  expect(screenCopy).not.toContain('OPTIONAL');
  expect(root.findAllByProps({ name: 'info' })).toHaveLength(5);
  for (const section of ['reflection', 'focus', 'caution', 'moment', 'ritual']) {
    const heading = root.findByProps({ testID: `cosmos-heading-${section}` });
    expect(heading.findByProps({ testID: `cosmos-info-${section}` })).toBeDefined();
  }
  expect(root.findByProps({ testID: 'cosmos-day-card' }).findByProps({ testID: 'cosmos-ritual-ideas' })).toBeDefined();
  expect(root.findAllByProps({ name: 'compass' })).toHaveLength(0);
  expect(root.findAllByProps({ name: 'moon-outline' })).toHaveLength(0);
  expect(root.findAllByProps({ name: 'wind' })).toHaveLength(0);
  expect(root.findAllByProps({ name: 'arrow-up-right' })).toHaveLength(0);
  const starLayer = root.findByProps({ testID: 'cosmos-background-stars' });
  expect(starLayer.props.children).toHaveLength(24);
  expect(starLayer.props.style.bottom).toBe(0);
  const scrollView = root.findByProps({ accessibilityLabel: 'Daily reflection' });
  expect(scrollView.props.testID).toBe('cosmos-main-scroll');
  expect(state.scrollToTopRef).not.toBeNull();
  expect(scrollView.props.bounces).toBe(false);
  expect(scrollView.props.alwaysBounceVertical).toBe(false);
  expect(scrollView.props.overScrollMode).toBe('never');
  expect(scrollView.props.contentInsetAdjustmentBehavior).toBe('automatic');
  expect(scrollView.props.contentContainerStyle[0].paddingBottom).toBe(24);
  expect(scrollView.findAllByProps({ testID: 'cosmos-background-stars' })).toHaveLength(0);
  expect(scrollView.findAllByProps({ testID: 'cosmos-natal-link' })).toHaveLength(0);
  expect(screenCopy).not.toContain('WHEN YOU’RE CURIOUS');
  expect(screenCopy).not.toContain('Explore your Natal Chart');
  expect(screenCopy).toContain('A small daily ritual');
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
  expect(modalCopy).toContain('What deserves my attention?');
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

test('the residence prompt opens Settings directly at Profile and the current-residence section', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.profile = { birthDate: '2000-01-01', currentResidence: null };
  await act(async () => {
    renderer = create(<CosmosScreen />);
  });

  const prompt = renderer!.root.findByProps({ testID: 'cosmos-add-current-residence' });
  await act(async () => { prompt.props.onPress(); });
  expect(state.push).toHaveBeenCalledWith({
    pathname: '/settings',
    params: { section: 'profile', focus: 'current-residence' },
  });
});

test('calculated focus and caution are both visible and readable in the Cosmos card', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.profile = {};
  state.getDailyAstrology.mockReturnValue({
    status: 'calculated',
    reading: {
      label: 'TODAY’S REFLECTION',
      title: 'Treat tension as information.',
      body: 'Today highlights energy and initiative. A mismatch between your needs and the day’s demands may ask for a closer look.',
      favorableFocus: 'Thoughtful problem-solving may work better than rushing to an answer.',
      gentleCaution: 'Give yourself a beat before replying in the heat of the moment.',
      reflection: 'Where would asking for help be wiser than pushing through today?',
      factorSummary: 'Mars square natal Moon · within 0.5°',
    },
  });

  await act(async () => {
    renderer = create(<CosmosScreen />);
  });

  const root = renderer!.root;
  expect(state.getDailyAstrology).toHaveBeenCalled();
  expect(root.findAllByType(Text).map((node) => node.props.children)).toContain(
    'Thoughtful problem-solving may work better than rushing to an answer.',
  );
  expect(root.findAllByType(Text).map((node) => node.props.children)).toContain(
    'Give yourself a beat before replying in the heat of the moment.',
  );

  for (const text of [
    'Thoughtful problem-solving may work better than rushing to an answer.',
    'Give yourself a beat before replying in the heat of the moment.',
  ]) {
    const guidance = root.findAllByType(Text).find((node) => node.props.children === text);
    expect(guidance).toBeDefined();
    const textStyles = Array.isArray(guidance!.props.style)
      ? guidance!.props.style
      : [guidance!.props.style];
    expect(textStyles).toContainEqual(expect.objectContaining({
      fontSize: 14,
      lineHeight: 21,
    }));
  }

  for (const [testID, expectedCopy] of [
    ['cosmos-info-focus', 'Today’s focus points to something that may feel easier'],
    ['cosmos-info-caution', 'This is a gentle nudge to give one kind of task more time'],
  ]) {
    await act(async () => {
      root.findByProps({ testID }).props.onPress();
    });
    const modal = root.findByProps({ testID: 'cosmos-explanation-modal' });
    expect(modal.findAllByType(Text).map((node) => node.props.children).join(' ')).toContain(expectedCopy);
    await act(async () => {
      root.findByProps({ accessibilityLabel: 'Close explanation' }).props.onPress();
    });
  }
});

test('Cosmos displays the transit-to-natal reading composed from shared context', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.profile = {};
  state.getDailyAstrology.mockReturnValue({
    status: 'calculated',
    reading: {
      label: 'TODAY’S REFLECTION',
      title: 'Treat tension as information.',
      body: 'Older generic reading.',
      favorableFocus: 'Older focus.',
      gentleCaution: 'Older caution.',
      reflection: 'Where could you pause before responding?',
      factorSummary: 'Mars square natal Moon.',
    },
    transitAnalysis: {
      dominantAspect: {
        transitBody: 'Mars',
        transitSign: 'Gemini',
        natalBody: 'Moon',
        natalSign: 'Pisces',
        aspect: 'square',
        themeTags: ['energy', 'initiative', 'patience'],
      },
      supportingAspects: [],
    },
  });

  await act(async () => {
    renderer = create(<CosmosScreen />);
  });

  const visibleCopy = renderer!.root.findAllByType(Text)
    .map((node) => node.props.children)
    .filter((value): value is string => typeof value === 'string')
    .join(' ');
  expect(visibleCopy).toContain(
    'Mars in Gemini forms a square with your natal Moon in Pisces.',
  );
  expect(visibleCopy).toContain('links energy and initiative with feelings and daily needs');
  expect(visibleCopy).toContain('eases the tension');
});

test('the ritual belongs to the day card while other ideas remain a separate action', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await act(async () => {
    renderer = create(<CosmosScreen />);
  });
  const root = renderer!.root;
  const ideasButton = root.findByProps({
    accessibilityLabel: 'Explore other daily ritual ideas',
  });
  const dayCard = root.findByProps({ testID: 'cosmos-day-card' });
  expect(dayCard.findByProps({ testID: 'cosmos-info-focus' })).toBeDefined();
  expect(dayCard.findByProps({ testID: 'cosmos-info-caution' })).toBeDefined();
  expect(dayCard.findByProps({ testID: 'cosmos-info-moment' })).toBeDefined();
  expect(dayCard.findByProps({ testID: 'cosmos-info-ritual' })).toBeDefined();
  expect(dayCard.findByProps({ testID: 'cosmos-ritual-ideas' })).toBeDefined();
  expect(ideasButton.findAllByProps({ name: 'info' })).toHaveLength(0);

  await act(async () => {
    root.findByProps({ testID: 'cosmos-info-ritual' }).props.onPress();
  });
  const ritualModal = root.findByProps({ testID: 'cosmos-explanation-modal' });
  expect(ritualModal.findAllByType(Text).map((node) => node.props.children).join(' ')).toContain(
    'A small ritual is a brief pause that can help bring your attention back to the present.',
  );
  await act(async () => {
    root.findByProps({ accessibilityLabel: 'Close explanation' }).props.onPress();
  });

  await act(async () => { ideasButton.props.onPress(); });
  const modal = root.findByProps({ testID: 'cosmos-explanation-modal' });
  const modalCopy = modal.findAllByType(Text).map((node) => node.props.children);
  expect(modalCopy).not.toContain('Other ideas for today');
  expect(modalCopy.join(' ')).not.toContain('Here are three other small ideas for today');
  expect(modal.findByProps({ accessibilityLabel: 'Close explanation' })).toBeDefined();
  expect(modalCopy).not.toContain('OPTIONAL');
  expect(modal.findAllByProps({ testID: 'daily-ritual-option' })).toHaveLength(3);
  await act(async () => {
    modal.findByProps({ accessibilityLabel: 'Close explanation' }).props.onPress();
  });
  expect(root.findAllByProps({ testID: 'cosmos-explanation-modal' })).toHaveLength(0);
});
