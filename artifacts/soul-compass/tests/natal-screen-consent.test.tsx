import React from 'react';
import { Modal, Text } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { NatalChartResponse } from '@workspace/api-client-react';
import { emptyRecord, LOCAL_KEY, CONSENT_VERSION } from '../profile/local';
import { ProfileProvider } from '../profile/ProfileContext';
import { NatalAutoRefresh, NatalCalculationProvider } from '../hooks/useNatalCalculation';

const state = vi.hoisted(() => ({
  storage: new Map<string, string>(),
  calculate: vi.fn(),
  platformOS: 'web',
  appStateListeners: new Set<(nextState: string) => void>(),
  focusCallback: null as null | (() => void),
  scrollToTopRef: null as null | { current: unknown },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => state.storage.get(key) ?? null,
    setItem: async (key: string, value: string) => { state.storage.set(key, value); },
  },
}));
vi.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));
vi.mock('@workspace/api-client-react', () => ({
  calculateNatalChart: (...args: unknown[]) => state.calculate(...args),
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), navigate: vi.fn() }),
  useFocusEffect: (callback: () => void) => { state.focusCallback = callback; },
  useScrollToTop: (ref: { current: unknown }) => { state.scrollToTopRef = ref; },
}));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'View',
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
vi.mock('react-native', () => ({
  AppState: {
    addEventListener: (_event: string, listener: (nextState: string) => void) => {
      state.appStateListeners.add(listener);
      return { remove: () => state.appStateListeners.delete(listener) };
    },
  },
  Platform: {
    get OS() { return state.platformOS; },
    select: (options: Record<string, unknown>) => options.web ?? options.default,
  },
  PanResponder: { create: (handlers: any) => ({ panHandlers: {
    onMoveShouldSetResponderCapture: handlers.onMoveShouldSetPanResponderCapture,
    onResponderRelease: handlers.onPanResponderRelease,
  } }) },
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  Modal: 'Modal',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: {
    absoluteFill: { top: 0, right: 0, bottom: 0, left: 0 },
    create: (styles: unknown) => styles,
  },
  Text: 'Text',
  View: 'View',
  useWindowDimensions: () => ({ height: 874, width: 402 }),
}));
vi.mock('@/components/SettingsButton', () => ({ SettingsButton: () => null }));
vi.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    cosmos: {
      background: '#111B2B',
      homeBackground: '#070B13',
      surface: '#172438',
      card: '#1D2B40',
      foreground: '#F1EEE6',
      secondary: '#D6C39B',
      mutedForeground: '#A8B0BC',
      border: '#354258',
      divider: '#536074',
    },
  }),
}));

import NatalScreen, { explainAngle, explainAspect, explainPlanet } from '../app/(tabs)/natal';
import { FirstChartConsentPrompt } from '../components/FirstChartConsentPrompt';

let renderer: ReactTestRenderer | undefined;
const chartResult = {
  input: { birthTimeKnown: true },
  calculation: {
    birthTimeResolution: 'known',
    houseStatus: 'available',
  },
  planets: [
    { planet: 'sun', sign: 'Aquarius', degreeInSign: 12.5, retrograde: false, longitude: 312.5, latitude: 0, speedDegreesPerDay: 1 },
    { planet: 'moon', sign: 'Pisces', degreeInSign: 4, retrograde: false, longitude: 334, latitude: 1, speedDegreesPerDay: 13 },
  ],
  planetaryHouses: [{ planet: 'sun', house: 5, cuspDistanceDegrees: 2 }],
  aspects: [{ first: 'sun', second: 'moon', type: 'trine', orb: 1.4, exact: false, applying: true }],
  houseCusps: Array.from({ length: 12 }, (_, index) => ({ house: index + 1, longitude: index * 30 })),
  angles: { ascendant: 0, midheaven: 90, descendant: 180, imumCoeli: 270 },
  moonSignRange: [],
  warnings: [],
} as unknown as NatalChartResponse;

function findText(root: ReactTestInstance, text: string) {
  return root.findAllByType(Text).find((node) => node.props.children === text);
}

async function openGuide(root: ReactTestInstance) {
  const toggle = root.findByProps({ testID: 'natal-guide-toggle' });
  if (!toggle.props.accessibilityState?.expanded) {
    await act(async () => { toggle.props.onPress(); });
  }
}

function resumeApp() {
  state.appStateListeners.forEach(listener => listener('active'));
}

test('planet explanations translate sign and house placements into everyday personal language', () => {
  const sun = explainPlanet('Sun', 'Aquarius', 6);
  expect(sun.title).toBe('Sun in Aquarius · House 6');
  expect(sun.body).toContain('Your Sun is about confidence and your sense of self.');
  expect(sun.body).toContain('In Aquarius, you may approach this part of life independently and in an unconventional way.');
  expect(sun.body).toContain('In your 6th House, this theme is most connected to daily routines, work, and self-care.');
  expect(sun.body).not.toContain('Together');
  expect(sun.body).not.toMatch(/connected with|In astrology|Astrologers often describe/i);
  expect(sun.example).toContain("Imagine you're simplifying a task you repeat every day");
  expect(sun.example).not.toMatch(/^For example,/);
  expect(sun.example).toContain('give your time to the activity you genuinely care about');

  const moon = explainPlanet('Moon', 'Pisces', 7);
  expect(moon.title).toBe('Moon in Pisces · House 7');
  expect(moon.body).toContain('Your Moon is about your emotional needs and what helps you feel safe.');
  expect(moon.body).toContain('In Pisces, you may approach this part of life with imagination and sensitivity.');
  expect(moon.body).toContain('In your 7th House, this theme is most connected to close relationships and shared decisions.');
  expect(moon.body).not.toContain('Together');

  const taurusSun = explainPlanet('Sun', 'Taurus', 12);
  expect(taurusSun.example).toBe(
    "Imagine you're working quietly on something just for yourself; you might give your time to the activity you genuinely care about.",
  );

  const scorpioSun = explainPlanet('Sun', 'Scorpio', 9);
  expect(scorpioSun.body).toContain('In Scorpio, you may approach this part of life privately and with intensity.');
  expect(scorpioSun.body).toContain('In your 9th House, this theme is most connected to learning, travel, and the beliefs that guide you.');
});

test('all planet, sign, and house combinations use plain-language explanations', () => {
  const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];

  for (const planet of planets) {
    for (const sign of signs) {
      for (let house = 1; house <= 12; house += 1) {
        const explanation = explainPlanet(planet, sign, house);
        expect(explanation.body).toContain(`Your ${planet} is about`);
        expect(explanation.body).toContain(`In ${sign}, you may approach this part of life`);
        expect(explanation.body).toContain(`In your ${house === 1 ? '1st' : house === 2 ? '2nd' : house === 3 ? '3rd' : `${house}th`} House, this theme is most connected to`);
        expect(explanation.body).not.toContain('Together');
        expect(explanation.body.split('\n\n')).toHaveLength(3);
        expect(explanation.body).not.toMatch(/connected with|In astrology|Astrologers often describe/i);
        expect(explanation.example).toBeTruthy();
        expect(explanation.example).not.toMatch(/^For example,/);
      }
    }
  }
});

test('unknown birth time does not add a house interpretation', () => {
  const sun = explainPlanet('Sun', 'Aquarius');
  expect(sun.title).toBe('Sun in Aquarius');
  expect(sun.body).not.toContain('house');
  expect(sun.example).toContain("Imagine you're choosing how to spend an afternoon that is yours");
  expect(sun.example).toContain('give your time to the activity you genuinely care about');
});

test('major aspects explain both actual placements in everyday language', () => {
  const sextile = explainAspect('Sun', 'Mars', 'sextile', {
    first: { sign: 'Taurus', house: 12 },
    second: { sign: 'Leo', house: 6 },
  });

  expect(sextile.title).toBe('Sun sextile Mars');
  expect(sextile.body).toContain('Your Sun in Taurus in your 12th House connects confidence and your sense of self with rest, private feelings, and time alone.');
  expect(sextile.body).toContain('Your Mars in Leo in your 6th House connects your energy and how you take action with daily routines, work, and self-care.');
  expect(sextile.body).toContain('These themes can support each other when you choose to use them together.');
  expect(sextile.example).toContain('working quietly on something just for yourself');
  expect(sextile.example).toContain('simplifying a task you repeat every day');
  expect(sextile.body).not.toContain('Your 12th House is about');
  expect(sextile.body).not.toContain('Together');
  expect(sextile.example).not.toMatch(/^For example,/);
  expect(explainAngle('Ascendant', 'Libra').example).toMatch(/^When /);
  expect(explainPlanet('Moon', 'Pisces', undefined, ['Pisces', 'Aries']).example)
    .not.toMatch(/^For example,/);

  const uncertain = explainAspect('Sun', 'Moon', 'square', {
    first: { sign: 'Aquarius' },
    second: { possibleSigns: ['Pisces', 'Aries'] },
    referenceOnly: true,
  });
  expect(uncertain.body).toContain('Its sign could be Pisces or Aries');
  expect(uncertain.body).toContain('use local noon as a reference');
  expect(uncertain.body).not.toMatch(/House \d/);
});

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.storage.clear();
  state.appStateListeners.clear();
  state.focusCallback = null;
  state.scrollToTopRef = null;
  state.platformOS = 'web';
  state.calculate.mockReset().mockResolvedValue(chartResult);
  const profile = {
    birthDate: '2000-01-01',
    birthTime: { status: 'known', localTime: '12:00' },
    birthPlace: { city: 'Example', country: 'Example', latitude: 1, longitude: 1, timeZone: 'UTC' },
    currentResidence: null,
  };
  state.storage.set(LOCAL_KEY, JSON.stringify({ ...emptyRecord(), profile }));
});

afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
  state.focusCallback = null;
  state.scrollToTopRef = null;
});

test('Natal Chart sends no request until Agree, which starts exactly one calculation', async () => {
  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });
  const root = renderer!.root;

  expect(state.calculate).not.toHaveBeenCalled();
  const agree = findText(root, 'Agree');
  expect(agree?.parent?.props.onPress).toBeTypeOf('function');
  await act(async () => { await agree?.parent?.props.onPress(); });

  expect(state.calculate).toHaveBeenCalledTimes(1);
  expect(state.calculate).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(state.calculate.mock.calls[0][0]).toMatchObject({
    birthDate: '2000-01-01',
    birthTime: { status: 'known', localTime: '12:00' },
    birthPlace: { latitude: 1, longitude: 1, timeZone: 'UTC' },
  });
  expect(findText(root, 'PERSONAL NATAL CHART')).toBeDefined();
  expect(findText(root, 'ASCENDANT')).toBeDefined();
  expect(root.findByProps({ testID: 'natal-house-cusp-12' })).toBeDefined();
});

test('Not now refuses consent without a request, including after app restart and resume', async () => {
  const app = (withPrompt: boolean) => (
    <ProfileProvider>
      <NatalCalculationProvider>
        <NatalAutoRefresh />
        {withPrompt ? <FirstChartConsentPrompt /> : null}
        <NatalScreen />
      </NatalCalculationProvider>
    </ProfileProvider>
  );
  await act(async () => { renderer = create(app(true)); });
  const root = renderer!.root;
  expect(root.findAllByType(Modal).filter(modal => modal.props.visible)).toHaveLength(1);
  expect(state.calculate).not.toHaveBeenCalled();

  const notNow = findText(root, 'Not now');
  expect(notNow?.parent?.props.onPress).toBeTypeOf('function');
  await act(async () => { await notNow?.parent?.props.onPress(); });
  expect(root.findAllByType(Modal).filter(modal => modal.props.visible)).toHaveLength(0);
  expect(state.calculate).not.toHaveBeenCalled();

  await act(async () => renderer?.unmount());
  renderer = undefined;
  await act(async () => { renderer = create(app(false)); });
  expect(state.calculate).not.toHaveBeenCalled();
  await act(async () => {
    resumeApp();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
  expect(state.calculate).not.toHaveBeenCalled();
});

test('an offline launch does not retry its chart request when connectivity returns and the app resumes', async () => {
  const record = JSON.parse(state.storage.get(LOCAL_KEY)!);
  record.privacy = {
    astrologyApiConsent: true,
    consentTimestamp: new Date().toISOString(),
    consentVersion: CONSENT_VERSION,
    revokedAt: null,
  };
  state.storage.set(LOCAL_KEY, JSON.stringify(record));
  state.calculate.mockRejectedValueOnce(new Error('offline'));

  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });
  await act(async () => { await new Promise<void>(resolve => setTimeout(resolve, 0)); });
  expect(state.calculate).toHaveBeenCalledTimes(1);

  // The mocked transport now represents a restored connection; resuming stays idle.
  state.calculate.mockResolvedValue(chartResult);
  await act(async () => {
    resumeApp();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
  expect(state.calculate).toHaveBeenCalledTimes(1);
});

test('previously granted current-version permission refreshes automatically at app opening', async () => {
  const record = JSON.parse(state.storage.get(LOCAL_KEY)!);
  record.privacy = {
    astrologyApiConsent: true,
    consentTimestamp: new Date().toISOString(),
    consentVersion: CONSENT_VERSION,
    revokedAt: null,
  };
  state.storage.set(LOCAL_KEY, JSON.stringify(record));

  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });

  expect(state.calculate).toHaveBeenCalledTimes(1);
});

test('older one-time permission is not upgraded silently to automatic refresh', async () => {
  const record = JSON.parse(state.storage.get(LOCAL_KEY)!);
  record.privacy = {
    astrologyApiConsent: true,
    consentTimestamp: new Date().toISOString(),
    consentVersion: '2026-11-04-v1',
    revokedAt: null,
  };
  state.storage.set(LOCAL_KEY, JSON.stringify(record));

  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });

  expect(state.calculate).not.toHaveBeenCalled();
  expect(findText(renderer!.root, 'Agree')).toBeDefined();
});

test('planet, angle and aspect taps use chart placements and the centered explanation can be dismissed', async () => {
  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });
  const root = renderer!.root;
  await act(async () => { await findText(root, 'Agree')?.parent?.props.onPress(); });

  await act(async () => { root.findByProps({ testID: 'natal-planet-sun' }).props.onPress(); });
  expect(findText(root, 'Sun in Aquarius · House 5')).toBeDefined();
  expect(findText(root, 'A hypothetical example')).toBeDefined();
  expect(findText(root, 'A question to reflect on')).toBeUndefined();
  expect(
    findText(root, "Imagine you're showing someone a project you have made; you might give your time to the activity you genuinely care about."),
  ).toBeDefined();
  expect(root.findByProps({ testID: 'natal-explanation-stage' }).props.style.justifyContent).toBe('center');
  expect(root.findAllByType(Text).some((node) => String(node.props.children).includes('House 5'))).toBe(true);
  await act(async () => { root.findByProps({ testID: 'natal-explanation-close' }).props.onPress(); });
  expect(root.findAllByProps({ testID: 'natal-explanation-modal' })).toHaveLength(0);
  await act(async () => { root.findByProps({ testID: 'natal-angle-midheaven' }).props.onPress(); });
  expect(findText(root, 'Midheaven in Cancer')).toBeDefined();
  await act(async () => { root.findByProps({ testID: 'natal-explanation-close' }).props.onPress(); });
  await act(async () => { root.findByProps({ testID: 'natal-aspect-sun-trine-moon' }).props.onPress(); });
  expect(findText(root, 'Sun trine Moon')).toBeDefined();
  expect(findText(root, 'A hypothetical example')).toBeDefined();
  expect(
    root.findAllByType(Text).some((node) =>
      String(node.props.children).includes('Your Sun in Aquarius in your 5th House connects confidence and your sense of self with creativity, romance, and fun.'),
    ),
  ).toBe(true);
  await act(async () => { root.findByProps({ testID: 'natal-explanation-close' }).props.onPress(); });

  await act(async () => { root.findByProps({ testID: 'natal-chart-details-info' }).props.onPress(); });
  expect(findText(root, 'Chart Details')).toBeDefined();
  expect(root.findByProps({ testID: 'natal-technical-info-body' }).props.children)
    .toContain('Longitude is a planet’s place along the zodiac.');
  await act(async () => { root.findByProps({ testID: 'natal-technical-info-close' }).props.onPress(); });
  expect(root.findAllByProps({ testID: 'natal-technical-info-modal' })).toHaveLength(0);

  await act(async () => { root.findByProps({ testID: 'natal-house-cusps-info' }).props.onPress(); });
  expect(findText(root, 'House Cusps')).toBeDefined();
  expect(root.findByProps({ testID: 'natal-technical-info-body' }).props.children)
    .toContain('A cusp is the starting line of a house.');
  await act(async () => { root.findByProps({ testID: 'natal-technical-info-close' }).props.onPress(); });
});

test('Natal Chart guide starts closed, centers its title, and closes again on re-entry', async () => {
  const record = JSON.parse(state.storage.get(LOCAL_KEY)!);
  record.privacy = {
    astrologyApiConsent: true,
    consentTimestamp: new Date().toISOString(),
    consentVersion: CONSENT_VERSION,
    revokedAt: null,
  };
  state.storage.set(LOCAL_KEY, JSON.stringify(record));
  state.platformOS = 'ios';

  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });

  const root = renderer!.root;
  expect(findText(root, 'NATAL CHART')).toBeUndefined();
  expect(findText(root, 'HOW TO READ THIS')).toBeDefined();
  expect(findText(root, 'Your birth chart is a map of where the planets were when you were born. Astrologers use it to talk about life themes. You do not need to know astrology: start with the parts that sound familiar and leave the rest.')).toBeUndefined();
  const guideToggle = root.findByProps({ testID: 'natal-guide-toggle' });
  expect(guideToggle.props.accessibilityState).toEqual({ expanded: false });
  expect(guideToggle.props.style).toEqual(expect.objectContaining({
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  }));
  const guideTitle = root.findByProps({ testID: 'natal-guide-title' });
  expect(guideTitle.props.style).toEqual(expect.objectContaining({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  }));

  await act(async () => { guideToggle.props.onPress(); });
  expect(findText(root, 'Your birth chart is a map of where the planets were when you were born. Astrologers use it to talk about life themes. You do not need to know astrology: start with the parts that sound familiar and leave the rest.')).toBeDefined();
  expect(root.findByProps({ testID: 'natal-guide-toggle' }).props.accessibilityState).toEqual({ expanded: true });
  await act(async () => { state.focusCallback?.(); });
  expect(findText(root, 'Your birth chart is a map of where the planets were when you were born. Astrologers use it to talk about life themes. You do not need to know astrology: start with the parts that sound familiar and leave the rest.')).toBeUndefined();
  expect(root.findByProps({ testID: 'natal-guide-toggle' }).props.accessibilityState).toEqual({ expanded: false });
  expect(root.findAllByProps({ testID: 'natal-details-toggle' })).toHaveLength(0);
  expect(findText(root, 'CHART DETAILS')).toBeDefined();
  expect(findText(root, 'HOUSE CUSPS')).toBeDefined();
  expect(root.findByProps({ testID: 'natal-house-cusp-12' })).toBeDefined();
  expect(root.findAllByType(Text).some((node) =>
    String(node.props.children).includes('Astrology is a traditional symbolic practice'),
  )).toBe(false);

  const scrollView = root.findByProps({ accessibilityLabel: 'Natal chart' });
  expect(scrollView.props.testID).toBe('natal-main-scroll');
  expect(state.scrollToTopRef).not.toBeNull();
  expect(scrollView.props.contentInsetAdjustmentBehavior).toBe('automatic');
  expect(scrollView.props.contentContainerStyle[1].paddingBottom).toBe(32);
});

test('timed chart keeps angles but omits Placidus houses when the location cannot support them', async () => {
  state.calculate.mockResolvedValue({
    ...chartResult,
    calculation: { ...chartResult.calculation, houseStatus: 'unavailable' },
    houseCusps: [],
    planetaryHouses: [],
    warnings: ['Placidus houses are unavailable at this latitude.'],
  });
  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });

  const root = renderer!.root;
  await act(async () => { await findText(root, 'Agree')?.parent?.props.onPress(); });
  await openGuide(root);
  expect(root.findByProps({ testID: 'natal-angle-ascendant' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-angle-midheaven' })).toBeDefined();
  expect(root.findAllByProps({ testID: 'natal-house-cusp-12' })).toHaveLength(0);
  expect(root.findByProps({ testID: 'natal-planet-sun' }).props.accessibilityLabel).not.toContain('house');
  expect(root.findAllByType(Text).some((node) =>
    String(node.props.children).includes('no substitute house system was used'),
  )).toBe(true);
});

test('timed chart omits angle tiles when the calculation cannot provide angles', async () => {
  state.calculate.mockResolvedValue({
    ...chartResult,
    calculation: { ...chartResult.calculation, houseStatus: 'unavailable' },
    angles: null,
    houseCusps: [],
    planetaryHouses: [],
    warnings: ['Angles are unavailable at this location.'],
  });
  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });

  const root = renderer!.root;
  await act(async () => { await findText(root, 'Agree')?.parent?.props.onPress(); });
  await openGuide(root);
  expect(root.findAllByProps({ testID: 'natal-angle-ascendant' })).toHaveLength(0);
  expect(root.findAllByProps({ testID: 'natal-angle-midheaven' })).toHaveLength(0);
  expect(root.findAllByProps({ testID: 'natal-house-cusp-12' })).toHaveLength(0);
  expect(root.findAllByType(Text).some((node) =>
    String(node.props.children).includes('Angle values could not be calculated'),
  )).toBe(true);
});

test('unknown-time chart omits angles and houses and clearly marks personalized data', async () => {
  const record = JSON.parse(state.storage.get(LOCAL_KEY)!);
  record.profile.birthTime = { status: 'unknown' };
  state.storage.set(LOCAL_KEY, JSON.stringify(record));
  state.calculate.mockResolvedValue({
    ...chartResult,
    input: { birthTimeKnown: false },
    calculation: {
      ...chartResult.calculation,
      birthTimeResolution: 'unknown-reference-local-noon',
      houseStatus: 'unknown-birth-time',
    },
    moonSignRange: ['Aquarius', 'Pisces'],
  });
  await act(async () => {
    renderer = create(
      <ProfileProvider>
        <NatalCalculationProvider>
          <NatalAutoRefresh />
          <NatalScreen />
        </NatalCalculationProvider>
      </ProfileProvider>,
    );
  });
  const root = renderer!.root;
  await act(async () => { await findText(root, 'Agree')?.parent?.props.onPress(); });
  expect(state.calculate.mock.calls[0][0]).toMatchObject({
    birthDate: '2000-01-01',
    birthTime: { status: 'unknown' },
    birthPlace: { latitude: 1, longitude: 1, timeZone: 'UTC' },
  });
  expect(findText(root, 'PERSONAL NATAL CHART')).toBeDefined();
  expect(root.findAllByType(Text).some((node) => String(node.props.children).includes('This is a sample'))).toBe(false);
  expect(findText(root, 'ASCENDANT')).toBeUndefined();
  expect(findText(root, 'MIDHEAVEN')).toBeUndefined();
  expect(root.findAllByProps({ testID: 'natal-house-cusp-12' })).toHaveLength(0);
  expect(root.findByProps({ testID: 'natal-planet-sun' }).props.accessibilityLabel).not.toContain('house');
  await openGuide(root);
  expect(root.findAllByType(Text).some((node) =>
    String(node.props.children).includes('Houses depend on your exact birth time'),
  )).toBe(true);
  await act(async () => { root.findByProps({ testID: 'natal-planet-moon' }).props.onPress(); });
  expect(findText(root, 'Moon sign range')).toBeDefined();
  expect(root.findAllByType(Text).some((node) => String(node.props.children).includes('Aquarius or Pisces'))).toBe(true);
});
