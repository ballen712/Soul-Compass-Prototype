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
  windowWidth: 402,
  appStateListeners: new Set<(nextState: string) => void>(),
  focusCallback: null as null | (() => void),
  scrollToTopRef: null as null | { current: unknown },
  dailyAstrology: { status: 'unavailable' as const, message: 'No current transit fixture.' },
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
vi.mock('../profile/daily-cache', () => ({
  getDailyAstrology: () => state.dailyAstrology,
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
vi.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Circle: 'SvgCircle',
  Line: 'SvgLine',
  Rect: 'SvgRect',
  Text: 'SvgText',
  TSpan: 'SvgTSpan',
}));
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
  useWindowDimensions: () => ({ height: 874, width: state.windowWidth }),
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
      aspectTension: '#E48E83',
      aspectFlow: '#91B3CC',
      aspectConjunction: '#D9C49B',
    },
  }),
}));

import NatalScreen, { explainAngle, explainAspect, explainPlanet } from '../app/(tabs)/natal';
import { NatalChartWheel } from '../components/NatalChartWheel';
import { dailyReadingTranslations } from '../localization/daily-copy';
import { natalTranslations } from '../localization/natal-copy';
import { screenTranslations } from '../localization/screen-copy';
import { formatAppText, translateText, type AppLocale } from '../localization';

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

const interactionPlanets = [
  { planet: 'sun', sign: 'Leo', degreeInSign: 15, retrograde: false, longitude: 135, latitude: 0, speedDegreesPerDay: 1 },
  { planet: 'moon', sign: 'Sagittarius', degreeInSign: 14.4, retrograde: false, longitude: 254.4, latitude: 0, speedDegreesPerDay: 13 },
] as unknown as NatalChartResponse['planets'];
const interactionHouseCusps = Array.from({ length: 12 }, (_, index) => ({
  house: index + 1,
  longitude: index * 30,
})) as NatalChartResponse['houseCusps'];
const interactionAspects = [{
  first: 'sun',
  second: 'moon',
  type: 'trine',
  orb: 0.6,
  exact: false,
  applying: true,
  strength: 0.8,
}] as unknown as NatalChartResponse['aspects'];
const wheelPalette = {
  card: '#192A42',
  border: '#304158',
  foreground: '#F4F0E7',
  secondary: '#D9C49B',
  mutedForeground: '#AAB5C5',
  aspectTension: '#E48E83',
  aspectFlow: '#91B3CC',
  aspectConjunction: '#D9C49B',
};

async function renderInteractionWheel(locale: AppLocale = 'en', timeKnown = true, withTransits = true) {
  const translateCopy = (source: string) => (
    locale === 'en' ? source : natalTranslations[locale][source] ?? source
  );
  await act(async () => {
    renderer = create(
      <NatalChartWheel
        planets={interactionPlanets}
        palette={wheelPalette}
        translate={translateCopy}
        locale={locale}
        moonSignRange={[]}
        timeKnown={timeKnown}
        majorAspects={interactionAspects}
        transitPlanets={withTransits ? [
          { body: 'Mars', longitude: 14.4, sign: 'Aries' },
          { body: 'Venus', longitude: 205, sign: 'Libra' },
        ] : []}
        transitAspects={withTransits ? [
          {
            transitBody: 'Mars',
            natalBody: 'Moon',
            aspect: 'trine',
            maxOrb: 0.6,
            reliability: 'high',
          },
        ] : []}
        houseByPlanet={new Map([['sun', 5], ['moon', 9]])}
        houseCusps={interactionHouseCusps}
        angles={{ ascendant: 0, descendant: 180, midheaven: 270, imumCoeli: 90 }}
      />,
    );
  });
  return renderer!.root;
}

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
  expect(sun.body).toContain('This planet relates to confidence and your sense of self.');
  expect(sun.body).toContain('It can point to what gives you direction and where you want to express yourself');
  expect(sun.body).toContain('In Aquarius, you may approach this part of life independently and in an unconventional way.');
  expect(sun.body).toContain('In everyday life, this might look like: try an approach people around you have not considered.');
  expect(sun.body).toContain('In your 6th House, this theme is most connected to daily routines, work, practical responsibilities, and the ways you look after yourself.');
  expect(sun.body).not.toContain('Together');
  expect(sun.body).not.toMatch(/connected with|In astrology|Astrologers often describe/i);
  expect(sun.example).toContain('Imagine this situation: you are simplifying a task you repeat every day.');
  expect(sun.example).toContain('approach it independently and in an unconventional way');
  expect(sun.example).not.toMatch(/^For example,/);
  expect(sun.example).toContain('give your time to the activity you genuinely care about');

  const moon = explainPlanet('Moon', 'Pisces', 7);
  expect(moon.title).toBe('Moon in Pisces · House 7');
  expect(moon.body).toContain('This planet relates to your emotional needs and what helps you feel safe.');
  expect(moon.body).toContain('It can point to the comfort, closeness, and familiar routines you reach for when you feel tired or uncertain.');
  expect(moon.body).toContain('In Pisces, you may approach this part of life with imagination and sensitivity.');
  expect(moon.body).toContain('In your 7th House, this theme is most connected to close one-to-one relationships, cooperation, and the decisions you make with another person.');
  expect(moon.body).not.toContain('Together');

  const taurusSun = explainPlanet('Sun', 'Taurus', 12);
  expect(taurusSun.example).toContain('Imagine this situation: you are working quietly on something just for yourself.');
  expect(taurusSun.example).toContain('approach it at a measured, steady pace');
  expect(taurusSun.example).toContain('give your time to the activity you genuinely care about');
  expect(taurusSun.example).toContain('rest, private feelings, time alone, and the quiet moments you need to process life');

  const scorpioSun = explainPlanet('Sun', 'Scorpio', 9);
  expect(scorpioSun.body).toContain('In Scorpio, you may approach this part of life privately and with intensity.');
  expect(scorpioSun.body).toContain('In your 9th House, this theme is most connected to learning, travel, new experiences, and the beliefs that guide how you see the world.');
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
        expect(explanation.body).toContain('This planet relates to');
        expect(explanation.body).toContain(`In ${sign}, you may approach this part of life`);
        expect(explanation.body).toContain(`In your ${house === 1 ? '1st' : house === 2 ? '2nd' : house === 3 ? '3rd' : `${house}th`} House, this theme is most connected to`);
        expect(explanation.body).not.toContain('Together');
        expect(explanation.body.split('\n\n')).toHaveLength(3);
        expect(explanation.body.length).toBeGreaterThan(300);
        expect(explanation.body).not.toMatch(/connected with|In astrology|Astrologers often describe/i);
        expect((explanation.example ?? '').length).toBeGreaterThan(150);
        expect(explanation.example).toContain('approach it');
        expect(explanation.example).not.toMatch(/^For example,/);
      }
    }
  }
});

test('unknown birth time does not add a house interpretation', () => {
  const sun = explainPlanet('Sun', 'Aquarius');
  expect(sun.title).toBe('Sun in Aquarius');
  expect(sun.body).not.toContain('house');
  expect(sun.example).toContain('Imagine this situation: you are choosing how to spend an afternoon that is yours');
  expect(sun.example).toContain('give your time to the activity you genuinely care about');
});

test('major aspects explain both actual placements in everyday language', () => {
  const sextile = explainAspect('Sun', 'Mars', 'sextile', {
    first: { sign: 'Taurus', house: 12 },
    second: { sign: 'Leo', house: 6 },
  });

  expect(sextile.title).toBe('Sun sextile Mars');
  expect(sextile.body).toContain('Your Sun in Taurus in your 12th House connects confidence and your sense of self with rest, private feelings, time alone, and the quiet moments you need to process life.');
  expect(sextile.body).toContain('Your Mars in Leo in your 6th House connects your energy and how you take action with daily routines, work, practical responsibilities, and the ways you look after yourself.');
  expect(sextile.body).toContain('These themes can support each other when you choose to use them together.');
  expect(sextile.example).toContain('working quietly on something just for yourself');
  expect(sextile.example).toContain('simplifying a task you repeat every day');
  expect(sextile.body).not.toContain('Your 12th House is about');
  expect(sextile.body).not.toContain('Together');
  expect(sextile.example).not.toMatch(/^For example,/);
  expect(explainAngle('Ascendant', 'Libra').example).toMatch(/^Imagine joining a group/);
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
  state.windowWidth = 402;
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

test('server consent rejection returns to the existing consent step before a retry', async () => {
  state.calculate.mockRejectedValueOnce({
    data: { code: 'CONSENT_REQUIRED', error: 'Your permission comes first.' },
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
  const agree = findText(root, 'Agree');
  await act(async () => {
    await agree?.parent?.props.onPress();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });

  expect(state.calculate).toHaveBeenCalledTimes(1);
  expect(findText(root, 'Your permission comes first')).toBeDefined();
  const review = root.findByProps({ testID: 'natal-server-consent-review' });
  await act(async () => { await review.props.onPress(); });

  const localRecord = JSON.parse(state.storage.get(LOCAL_KEY)!);
  expect(localRecord.privacy.astrologyApiConsent).toBe(false);
  expect(findText(root, 'Agree')).toBeDefined();
  expect(state.calculate).toHaveBeenCalledTimes(1);

  const agreeAgain = findText(root, 'Agree');
  await act(async () => {
    await agreeAgain?.parent?.props.onPress();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
  expect(state.calculate).toHaveBeenCalledTimes(2);
});

test('users can enter Natal Chart without consent; no request is made until they agree', async () => {
  const app = () => (
    <ProfileProvider>
      <NatalCalculationProvider>
        <NatalAutoRefresh />
        <NatalScreen />
      </NatalCalculationProvider>
    </ProfileProvider>
  );
  await act(async () => { renderer = create(app()); });
  const root = renderer!.root;
  expect(state.calculate).not.toHaveBeenCalled();

  const agree = findText(root, 'Agree');
  expect(agree?.parent?.props.onPress).toBeTypeOf('function');
  const notNow = findText(root, 'Not Now');
  expect(notNow?.parent?.props.onPress).toBeTypeOf('function');
  expect(state.calculate).not.toHaveBeenCalled();

  await act(async () => renderer?.unmount());
  renderer = undefined;
  await act(async () => { renderer = create(app()); });
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

  const wheel = root.findByProps({ testID: 'natal-planet-wheel' });
  expect(wheel.props.accessibilityRole).toBe('image');
  expect(wheel.props.accessible).toBe(false);
  const wheelSummary = root.findByProps({ testID: 'natal-planet-wheel-summary' });
  expect(wheelSummary.props.accessibilityLabel).toContain('Sun');
  expect(wheelSummary.props.accessibilityLabel).toContain('Moon');
  expect(root.findByProps({ testID: 'natal-planet-glyph-sun' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-planet-glyph-moon' })).toBeDefined();
  expect(root.findAll((node) =>
    typeof node.props.testID === 'string' && node.props.testID.startsWith('natal-planet-name-'),
  )).toHaveLength(0);
  expect(root.findByProps({ testID: 'natal-planet-label-sun' }).props.accessibilityLabel).toContain('Sun');
  expect(root.findByProps({ testID: 'natal-planet-label-moon' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-zodiac-sign-0' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-zodiac-sign-11' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-wheel-house-number-1' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-wheel-house-number-12' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-wheel-house-cusp-1' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-angle-axis-asc-dsc' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-angle-axis-mc-ic' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-angle-label-asc' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-angle-label-dsc' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-angle-label-mc' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-angle-label-ic' })).toBeDefined();
  expect(root.findAll((node) =>
    typeof node.props.testID === 'string'
      && node.props.testID.startsWith('natal-planet-leader-'),
  )).toHaveLength(0);
  expect(root.findByProps({ testID: 'natal-aspect-line-trine-sun-moon' })).toBeDefined();

  await act(async () => { root.findByProps({ testID: 'natal-planet-sun' }).props.onPress(); });
  expect(findText(root, 'Sun in Aquarius · House 5')).toBeDefined();
  expect(findText(root, 'A hypothetical example')).toBeDefined();
  expect(findText(root, 'A question to reflect on')).toBeUndefined();
  expect(findText(root, explainPlanet('Sun', 'Aquarius', 5).example!)).toBeDefined();
  expect(root.findByProps({ testID: 'natal-explanation-stage' }).props.style.justifyContent).toBe('center');
  expect(root.findAllByType(Text).some((node) => String(node.props.children).includes('House 5'))).toBe(true);
  await act(async () => { root.findByProps({ testID: 'natal-explanation-close' }).props.onPress(); });
  expect(root.findAllByProps({ testID: 'natal-explanation-modal' })).toHaveLength(0);
  await act(async () => { root.findByProps({ testID: 'natal-angle-midheaven' }).props.onPress(); });
  expect(findText(root, 'Midheaven in Cancer')).toBeDefined();
  expect(
    root.findAllByType(Text).some((node) =>
      String(node.props.children).includes('Your Midheaven in Cancer points to the direction'),
    ),
  ).toBe(true);
  expect(
    root.findAllByType(Text).some((node) =>
      String(node.props.children).includes('Imagine a team project has become difficult.'),
    ),
  ).toBe(true);
  expect(
    root.findAllByType(Text).some((node) =>
      String(node.props.children).includes('Treat it as a prompt, not a fixed description'),
    ),
  ).toBe(false);
  await act(async () => { root.findByProps({ testID: 'natal-explanation-close' }).props.onPress(); });
  await act(async () => { root.findByProps({ testID: 'natal-aspect-sun-trine-moon' }).props.onPress(); });
  expect(findText(root, 'Sun trine Moon')).toBeDefined();
  expect(findText(root, 'A hypothetical example')).toBeDefined();
  expect(
    root.findAllByType(Text).some((node) =>
      String(node.props.children).includes('Your Sun in Aquarius in your 5th House connects confidence and your sense of self with creativity, romance, fun, and the things you enjoy making or sharing.'),
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
  expect(guideToggle.props.style).toContainEqual(expect.objectContaining({
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  }));
  expect(guideToggle.props.style).toContainEqual(expect.objectContaining({ minHeight: 44 }));
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
  expect(scrollView.props.contentContainerStyle[0].paddingBottom).toBe(24);
  expect(scrollView.props.bounces).toBe(false);
  expect(scrollView.props.alwaysBounceVertical).toBe(false);
  expect(scrollView.props.overScrollMode).toBe('never');
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
  expect(root.findAllByProps({ testID: 'natal-wheel-house-number-1' })).toHaveLength(0);
  expect(root.findByProps({ testID: 'natal-angle-axis-asc-dsc' })).toBeDefined();
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
  expect(root.findAllByProps({ testID: 'natal-wheel-house-number-1' })).toHaveLength(0);
  expect(root.findAllByProps({ testID: 'natal-angle-axis-asc-dsc' })).toHaveLength(0);
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
  expect(root.findAllByProps({ testID: 'natal-wheel-house-number-1' })).toHaveLength(0);
  expect(root.findAllByProps({ testID: 'natal-angle-axis-asc-dsc' })).toHaveLength(0);
  expect(root.findAllByProps({ testID: 'natal-angle-label-asc' })).toHaveLength(0);
  expect(root.findByProps({ testID: 'natal-planet-marker-moon' }).props.strokeDasharray).toBe('2 2');
  expect(root.findByProps({ testID: 'natal-planet-glyph-moon' })).toBeDefined();
  expect(root.findAllByProps({ testID: 'natal-angle-marker-asc' })).toHaveLength(0);
  expect(root.findAllByProps({ testID: 'natal-angle-marker-mc' })).toHaveLength(0);
  expect(root.findByProps({ testID: 'natal-aspect-line-trine-sun-moon' }).props.strokeDasharray).toBe('1 5');
  expect(root.findByProps({ testID: 'natal-planet-sun' }).props.accessibilityLabel).not.toContain('house');
  await openGuide(root);
  expect(root.findAllByType(Text).some((node) =>
    String(node.props.children).includes('Houses depend on your exact birth time'),
  )).toBe(true);
  await act(async () => { root.findByProps({ testID: 'natal-planet-moon' }).props.onPress(); });
  expect(findText(root, 'Moon sign range')).toBeDefined();
  expect(root.findAllByType(Text).some((node) => String(node.props.children).includes('Aquarius or Pisces'))).toBe(true);
});

test('house ring uses unequal cusp longitudes and the calculated angle axes', async () => {
  const planets = [
    { planet: 'Sun', sign: 'Taurus', degreeInSign: 0, longitude: 30, latitude: 0, speedDegreesPerDay: 1, retrograde: false },
  ] as unknown as NatalChartResponse['planets'];
  const houseCusps = [
    30, 50, 95, 120, 150, 180, 210, 230, 275, 300, 330, 0,
  ].map((longitude, index) => ({ house: index + 1, longitude }));
  const angles = {
    ascendant: 30,
    descendant: 210,
    midheaven: 300,
    imumCoeli: 120,
  };

  await act(async () => {
    renderer = create(
      <NatalChartWheel
        planets={planets}
        palette={{
          card: '#192A42',
          border: '#304158',
          foreground: '#F4F0E7',
          secondary: '#D9C49B',
          mutedForeground: '#AAB5C5',
          aspectTension: '#E48E83',
          aspectFlow: '#91B3CC',
          aspectConjunction: '#D9C49B',
        }}
        translate={(copy) => copy}
        locale="en"
        moonSignRange={[]}
        timeKnown
        majorAspects={[]}
        houseCusps={houseCusps}
        angles={angles}
      />,
    );
  });

  const root = renderer!.root;
  const size = Number(root.findByProps({ testID: 'natal-chart-wheel-svg' }).props.width);
  const center = size / 2;
  const scale = size / 360;
  const ascendantAxis = root.findByProps({ testID: 'natal-angle-axis-asc-dsc' }).props;
  expect(ascendantAxis.x1).toBeLessThan(center);
  expect(ascendantAxis.x2).toBeGreaterThan(center);
  expect(ascendantAxis.y1).toBeCloseTo(center, 4);
  expect(ascendantAxis.y2).toBeCloseTo(center, 4);
  expect(root.findByProps({ testID: 'natal-angle-axis-mc-ic' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-angle-label-asc' }).props.accessibilityLabel).toBe('Ascendant');
  expect(root.findByProps({ testID: 'natal-angle-label-dsc' }).props.accessibilityLabel).toBe('Descendant');

  const cuspOne = root.findByProps({ testID: 'natal-wheel-house-cusp-1' }).props;
  expect(Math.hypot(cuspOne.x1 - center, cuspOne.y1 - center)).toBeCloseTo(center * 0.52, 2);
  expect(Math.hypot(cuspOne.x2 - center, cuspOne.y2 - center)).toBeCloseTo(center * 0.73, 2);
  for (let house = 1; house <= 12; house += 1) {
    const houseHitArea = root.findByProps({ testID: `natal-wheel-house-hit-area-${house}` });
    expect(houseHitArea.props.accessible).toBe(true);
    expect(houseHitArea.props.accessibilityLabel).toContain(`House ${house}`);
  }

  const houseOne = root.findByProps({ testID: 'natal-wheel-house-number-1' }).props;
  const houseTwo = root.findByProps({ testID: 'natal-wheel-house-number-2' }).props;
  const labelAngle = (label: { x: number; y: number }) => (
    (Math.atan2(label.y - 2.7 * scale - center, label.x - center) * 180 / Math.PI + 360) % 360
  );
  const houseAngleDifference = (
    labelAngle(houseTwo as { x: number; y: number })
    - labelAngle(houseOne as { x: number; y: number })
    + 360
  ) % 360;
  expect(houseAngleDifference).toBeCloseTo(32.5, 1);
});

test.each([320, 375, 393, 402])(
  'the wheel fits a tight planet cluster without overlap at %i-point width',
  async (screenWidth) => {
  state.windowWidth = screenWidth;
  const planetNames = [
    'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
    'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
  ];
  const planets = planetNames.map((planet, index) => ({
    planet,
    sign: 'Cancer',
    degreeInSign: 10 + index / 10,
    retrograde: false,
    longitude: 101 + index * 0.4,
    latitude: 0,
    speedDegreesPerDay: 0,
  })) as unknown as NatalChartResponse['planets'];
  const majorTypes = ['conjunction', 'sextile', 'square', 'trine', 'opposition'];
  const aspects = majorTypes.map((type, index) => ({
    first: planetNames[index],
    second: planetNames[index + 1],
    type,
    orb: 1,
    exact: false,
    applying: true,
    strength: 0.5,
  })) as unknown as NatalChartResponse['aspects'];

  await act(async () => {
    renderer = create(
      <NatalChartWheel
        planets={planets}
        palette={{
          card: '#192A42',
          border: '#304158',
          foreground: '#F4F0E7',
          secondary: '#D9C49B',
          mutedForeground: '#AAB5C5',
          aspectTension: '#E48E83',
          aspectFlow: '#91B3CC',
          aspectConjunction: '#D9C49B',
        }}
        translate={(copy) => copy}
        locale="en"
        moonSignRange={[]}
        timeKnown
        majorAspects={aspects}
        houseCusps={Array.from({ length: 12 }, (_, index) => ({
          house: index + 1,
          longitude: index * 30,
        }))}
        angles={{ ascendant: 0, descendant: 180, midheaven: 270, imumCoeli: 90 }}
      />,
    );
  });

  const root = renderer!.root;
  await act(async () => {
    root.findByProps({ testID: 'natal-planet-wheel' }).props.onLayout({
      nativeEvent: { layout: { width: screenWidth - 76 } },
    });
  });
  const wheelSvg = root.findByProps({ testID: 'natal-chart-wheel-svg' });
  expect(Number(wheelSvg.props.width)).toBeLessThanOrEqual(screenWidth - 76);
  expect(Number(wheelSvg.props.width)).toBeGreaterThan(screenWidth * 0.65);
  const center = Number(wheelSvg.props.width) / 2;
  const labels = root.findAll((node) =>
    typeof node.props.testID === 'string' && node.props.testID.startsWith('natal-planet-label-'),
  );
  expect(labels).toHaveLength(10);
  const markers = planetNames.map((planet) =>
    root.findByProps({ testID: `natal-planet-marker-${planet.toLowerCase()}` }).props,
  );
  const markerRadii = markers.map((marker) => Math.hypot(marker.cx - center, marker.cy - center));
  expect(Math.max(...markerRadii) - Math.min(...markerRadii)).toBeLessThan(0.001);
  const signGlyph = root.findByProps({ testID: 'natal-zodiac-sign-0' }).props;
  const radiusFromCenter = (x: number, y: number) => Math.hypot(x - center, y - center);
  const signRingRadius = radiusFromCenter(
    signGlyph.x,
    signGlyph.y - Number(signGlyph.fontSize) * 0.32,
  );
  const labelBoxes = labels.map((label) => {
    const width = label.props.fontSize * 1.15;
    const labelCenterY = label.props.y - label.props.fontSize * 0.3;
    const radius = radiusFromCenter(label.props.x, labelCenterY);
    expect(radius).toBeLessThan(signRingRadius);
    const planet = String(label.props.testID).replace('natal-planet-label-', '');
    const marker = root.findByProps({ testID: `natal-planet-marker-${planet}` }).props;
    const markerDistance = Math.hypot(
      label.props.x - marker.cx,
      labelCenterY - marker.cy,
    );
    expect(markerDistance).toBeLessThanOrEqual(center * 0.52 + 0.01);
    return {
      x: label.props.x - width / 2,
      y: labelCenterY - label.props.fontSize * 0.7,
      width,
      height: label.props.fontSize * 1.05,
      testID: label.props.testID,
    };
  });

  for (let first = 0; first < labelBoxes.length; first += 1) {
    for (let second = first + 1; second < labelBoxes.length; second += 1) {
      const a = labelBoxes[first];
      const b = labelBoxes[second];
      const overlaps = a.x < b.x + b.width
        && a.x + a.width > b.x
        && a.y < b.y + b.height
        && a.y + a.height > b.y;
      expect(overlaps, `${a.testID} and ${b.testID}: ${JSON.stringify({ a, b })}`).toBe(false);
    }
  }

  const expectedAspectDashes: Array<string | undefined> = [
    undefined,
    '1 3',
    '4 3',
    undefined,
    '5 3',
  ];
  for (let index = 0; index < majorTypes.length; index += 1) {
    const line = root.findByProps({
      testID: `natal-aspect-line-${majorTypes[index]}-${planetNames[index].toLowerCase()}-${planetNames[index + 1].toLowerCase()}`,
    });
    const firstMarker = root.findByProps({
      testID: `natal-planet-marker-${planetNames[index].toLowerCase()}`,
    }).props;
    const secondMarker = root.findByProps({
      testID: `natal-planet-marker-${planetNames[index + 1].toLowerCase()}`,
    }).props;
    expect(line.props.x1).toBe(firstMarker.cx);
    expect(line.props.y1).toBe(firstMarker.cy);
    expect(line.props.x2).toBe(secondMarker.cx);
    expect(line.props.y2).toBe(secondMarker.cy);
    expect(line.props.strokeDasharray).toBe(expectedAspectDashes[index]);
  }
  expect(root.findAllByProps({ cx: center, cy: center, r: 2.5 })).toHaveLength(0);
});

test('house taps show the cusp, planets inside it, and its plain-language theme', async () => {
  const root = await renderInteractionWheel();
  const houseFive = root.findByProps({ testID: 'natal-wheel-house-hit-area-5' });
  expect(houseFive.props.accessible).toBe(true);
  expect(houseFive.props.accessibilityLabel).toContain('House 5');

  await act(async () => {
    houseFive.props.onPress();
  });
  expect(root.findByProps({ testID: 'natal-house-detail-5' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-house-detail-position' }).props.children)
    .toBe('00° 00′ Leo');
  expect(root.findByProps({ testID: 'natal-house-detail-theme' }).props.children)
    .toBe('creativity, romance, fun, and the things you enjoy making or sharing');
  expect(root.findByProps({ testID: 'natal-house-detail-planets' }).props.children).toBe('Sun');

  await act(async () => {
    root.findByProps({ testID: 'natal-wheel-house-hit-area-2' }).props.onPress();
  });
  expect(root.findAllByProps({ testID: 'natal-house-detail-5' })).toHaveLength(0);
  expect(root.findByProps({ testID: 'natal-house-detail-planets' }).props.children)
    .toBe('No planets are placed in this house.');
  await act(async () => {
    root.findByProps({ testID: 'natal-house-detail-close' }).props.onPress();
  });
  expect(root.findAllByProps({ testID: 'natal-house-detail-2' })).toHaveLength(0);
});

test('unknown birth time never exposes house or angle controls', async () => {
  const root = await renderInteractionWheel('en', false);
  expect(root.findAll((node) =>
    typeof node.props.testID === 'string'
      && node.props.testID.startsWith('natal-wheel-house-hit-area-'),
  )).toHaveLength(0);
  expect(root.findAll((node) =>
    typeof node.props.testID === 'string'
      && node.props.testID.startsWith('natal-angle-axis-'),
  )).toHaveLength(0);
});

test('chart modes localize labels in all seven app languages', () => {
  const keys = [
    'Natal',
    'Transits',
    'Combined',
    'Current transiting planets',
    'Current position',
    'Transit aspect',
    'Transit views are unavailable right now.',
    'No current transit aspects are close to your natal planets.',
  ];
  for (const locale of ['hu', 'it', 'de', 'fr', 'es', 'ru'] as const) {
    for (const key of keys) {
      expect(natalTranslations[locale][key], `${locale} translation for ${key}`).toBeTruthy();
    }
  }
});

test('transit and combined modes draw the current positions and aspects to natal planets', async () => {
  const root = await renderInteractionWheel();
  await act(async () => {
    root.findByProps({ testID: 'natal-chart-mode-transits' }).props.onPress();
  });
  expect(root.findByProps({ testID: 'natal-transit-planet-marker-mars' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-transit-aspect-line-trine-mars-moon' })).toBeDefined();
  expect(root.findAllByProps({ testID: 'natal-aspect-line-trine-sun-moon' })).toHaveLength(0);

  await act(async () => {
    root.findByProps({ testID: 'natal-transit-planet-hit-area-mars' }).props.onPress();
  });
  expect(root.findByProps({ testID: 'natal-transit-planet-detail-mars' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-transit-planet-detail-position' }).props.children)
    .toBe('14° 24′ Aries');
  await act(async () => {
    root.findByProps({ testID: 'natal-transit-planet-detail-aspect-0' }).props.onPress();
  });
  expect(root.findByProps({ testID: 'natal-transit-aspect-detail-trine-mars-moon' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-transit-aspect-detail-context' }).props.children)
    .toBe('Transit aspect');
  await act(async () => {
    root.findByProps({ testID: 'natal-transit-aspect-detail-close' }).props.onPress();
    root.findByProps({ testID: 'natal-chart-mode-combined' }).props.onPress();
  });
  expect(root.findByProps({ testID: 'natal-transit-aspect-line-trine-mars-moon' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-aspect-line-trine-sun-moon' })).toBeDefined();
});

test('transit modes are disabled when no current positions are available', async () => {
  const root = await renderInteractionWheel('en', true, false);
  expect(root.findByProps({ testID: 'natal-chart-mode-transits' }).props.accessibilityState.disabled).toBe(true);
  expect(root.findByProps({ testID: 'natal-transit-unavailable' }).props.children)
    .toBe('Transit views are unavailable right now.');
});

test('aspect lines and planet aspect rows open the same accessible detail panel', async () => {
  const root = await renderInteractionWheel();
  const aspectHit = root.findByProps({ testID: 'natal-aspect-hit-trine-sun-moon' });
  expect(aspectHit.props.accessible).toBe(true);
  expect(aspectHit.props.accessibilityLabel).toBe('Sun trine Moon, orb 0.6°');

  await act(async () => {
    aspectHit.props.onPress();
  });
  expect(root.findByProps({ testID: 'natal-aspect-detail-trine-sun-moon' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-aspect-detail-title' }).props.children)
    .toBe('Sun trine Moon');
  expect(root.findByProps({ testID: 'natal-aspect-detail-orb' }).props.children)
    .toBe('orb 0.6°');
  expect(root.findByProps({ testID: 'natal-aspect-detail-interpretation' }).props.children)
    .toBe('These themes tend to support each other with less effort.');

  await act(async () => {
    root.findByProps({ testID: 'natal-aspect-detail-close' }).props.onPress();
    root.findByProps({ testID: 'natal-planet-hit-area-sun' }).props.onPress();
  });
  expect(root.findByProps({ testID: 'natal-planet-detail-sun' })).toBeDefined();
  await act(async () => {
    root.findByProps({ testID: 'natal-planet-detail-aspect-0' }).props.onPress();
  });
  expect(root.findByProps({ testID: 'natal-aspect-detail-trine-sun-moon' })).toBeDefined();
});

test.each([0, 90, 180, 270])(
  'all planet labels stay near a clustered marker at longitude %i',
  async (baseLongitude) => {
    const planetNames = [
      'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
      'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
    ];
    const planets = planetNames.map((planet, index) => ({
      planet,
      sign: 'Cancer',
      degreeInSign: 10,
      retrograde: false,
      longitude: baseLongitude + index * 0.25,
      latitude: 0,
      speedDegreesPerDay: 0,
    })) as unknown as NatalChartResponse['planets'];

    let renderer: ReactTestRenderer;
    await act(async () => {
      renderer = create(
        <NatalChartWheel
          planets={planets}
          palette={{
            card: '#192A42',
            border: '#304158',
            foreground: '#F4F0E7',
            secondary: '#D9C49B',
            mutedForeground: '#AAB5C5',
          aspectTension: '#E48E83',
          aspectFlow: '#91B3CC',
          aspectConjunction: '#D9C49B',
          }}
          translate={(copy) => copy}
          locale="en"
          moonSignRange={[]}
          timeKnown
          majorAspects={[]}
        />,
      );
    });

    const root = renderer!.root;
    const center = Number(root.findByProps({ testID: 'natal-chart-wheel-svg' }).props.width) / 2;
    const labels = root.findAll((node) =>
      typeof node.props.testID === 'string' && node.props.testID.startsWith('natal-planet-label-'),
    );
    expect(labels).toHaveLength(planetNames.length);
    const boxes = labels.map((label) => {
      const planet = String(label.props.testID).replace('natal-planet-label-', '');
      const marker = root.findByProps({ testID: `natal-planet-marker-${planet}` }).props;
      const fontSize = Number(label.props.fontSize);
      const labelCenterY = label.props.y - fontSize * 0.3;
      const markerDistance = Math.hypot(
        label.props.x - marker.cx,
        labelCenterY - marker.cy,
      );
      expect(markerDistance).toBeLessThanOrEqual(center * 0.52 + 0.01);
      const width = fontSize * 1.15;
      return {
        left: label.props.x - width / 2,
        right: label.props.x + width / 2,
        top: labelCenterY - fontSize * 0.7,
        bottom: labelCenterY + fontSize * 0.35,
        testID: label.props.testID,
      };
    });

    for (let first = 0; first < boxes.length; first += 1) {
      for (let second = first + 1; second < boxes.length; second += 1) {
        const a = boxes[first];
        const b = boxes[second];
        const overlaps = a.left < b.right
          && a.right > b.left
          && a.top < b.bottom
          && a.bottom > b.top;
        expect(overlaps, `${a.testID} and ${b.testID}`).toBe(false);
      }
    }
  },
);

test('wheel aspect controls, selection details, and highlighted aspects use chart data', async () => {
  const planets = [
    { planet: 'Sun', sign: 'Aquarius', degreeInSign: 12.5, longitude: 312.5, latitude: 0, speedDegreesPerDay: 1, retrograde: false },
    { planet: 'Moon', sign: 'Pisces', degreeInSign: 12, longitude: 342, latitude: 1, speedDegreesPerDay: 13, retrograde: false },
    { planet: 'Mercury', sign: 'Taurus', degreeInSign: 20, longitude: 50, latitude: 0, speedDegreesPerDay: 1, retrograde: false },
    { planet: 'Mars', sign: 'Gemini', degreeInSign: 20, longitude: 80, latitude: 0, speedDegreesPerDay: 0.5, retrograde: false },
  ] as unknown as NatalChartResponse['planets'];
  const aspects = [
    { first: 'Sun', second: 'Mercury', type: 'conjunction', orb: 0.5, exact: true, applying: null, strength: 0.95 },
    { first: 'Sun', second: 'Moon', type: 'trine', orb: 1.4, exact: false, applying: true, strength: 0.85 },
    { first: 'Mercury', second: 'Mars', type: 'square', orb: 3.2, exact: false, applying: false, strength: 0.35 },
  ] as unknown as NatalChartResponse['aspects'];

  await act(async () => {
    renderer = create(
      <NatalChartWheel
        planets={planets}
        palette={{
          card: '#192A42',
          border: '#304158',
          foreground: '#F4F0E7',
          secondary: '#D9C49B',
          mutedForeground: '#AAB5C5',
          aspectTension: '#E48E83',
          aspectFlow: '#91B3CC',
          aspectConjunction: '#D9C49B',
        }}
        translate={(copy) => copy}
        locale="en"
        moonSignRange={[]}
        timeKnown
        majorAspects={aspects}
        houseByPlanet={new Map([['sun', 5]])}
        formatText={(source, values) => Object.entries(values).reduce(
          (copy, [key, value]) => copy.replaceAll(`{${key}}`, String(value)),
          source,
        )}
      />,
    );
  });

  const root = renderer!.root;
  expect(root.findByProps({ testID: 'natal-aspect-line-conjunction-sun-mercury' }).props.stroke).toBe('#D9C49B');
  expect(root.findByProps({ testID: 'natal-aspect-line-trine-sun-moon' }).props.stroke).toBe('#91B3CC');
  expect(root.findByProps({ testID: 'natal-aspect-line-square-mercury-mars' }).props.stroke).toBe('#E48E83');

  await act(async () => {
    root.findByProps({ testID: 'natal-planet-hit-area-sun' }).props.onPress();
  });
  expect(root.findByProps({ testID: 'natal-planet-detail-sun' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-planet-detail-position' }).props.children).toBe('12° 30′ Aquarius');
  expect(findText(root, 'House 5')).toBeDefined();
  expect(root.findAllByType(Text).some((node) =>
    String(node.props.children).includes('Moon · trine · orb 1.4°'),
  )).toBe(true);
  expect(root.findByProps({ testID: 'natal-aspect-line-trine-sun-moon' }).props.opacity).toBe(0.94);
  expect(root.findByProps({ testID: 'natal-aspect-line-square-mercury-mars' }).props.opacity).toBe(0.07);

  await act(async () => {
    root.findByProps({ testID: 'natal-aspect-toggle' }).props.onPress();
  });
  expect(root.findAll((node) =>
    typeof node.props.testID === 'string' && node.props.testID.startsWith('natal-aspect-line-'),
  )).toHaveLength(0);
  await act(async () => {
    root.findByProps({ testID: 'natal-planet-detail-close' }).props.onPress();
  });
  expect(root.findAllByProps({ testID: 'natal-planet-detail-sun' })).toHaveLength(0);
});

test('unknown-time planet details disclose the noon reference and omit house placement', async () => {
  const planets = [
    { planet: 'Moon', sign: 'Aquarius', degreeInSign: 28, longitude: 328, latitude: 1, speedDegreesPerDay: 13, retrograde: false },
  ] as unknown as NatalChartResponse['planets'];

  await act(async () => {
    renderer = create(
      <NatalChartWheel
        planets={planets}
        palette={{
          card: '#192A42',
          border: '#304158',
          foreground: '#F4F0E7',
          secondary: '#D9C49B',
          mutedForeground: '#AAB5C5',
          aspectTension: '#E48E83',
          aspectFlow: '#91B3CC',
          aspectConjunction: '#D9C49B',
        }}
        translate={(copy) => copy}
        locale="en"
        moonSignRange={['Aquarius', 'Pisces']}
        timeKnown={false}
        majorAspects={[]}
      />,
    );
  });

  const root = renderer!.root;
  await act(async () => {
    root.findByProps({ testID: 'natal-planet-hit-area-moon' }).props.onPress();
  });
  expect(root.findByProps({ testID: 'natal-planet-detail-position' }).props.children).toBe('Aquarius or Pisces');
  expect(root.findAllByProps({ testID: 'natal-planet-detail-aspect-0' })).toHaveLength(0);
  expect(root.findAllByProps({ testID: 'natal-planet-detail-sun' })).toHaveLength(0);
  expect(root.findAllByType(Text).some((node) =>
    String(node.props.children).includes('All placements and aspects represent the reference instant'),
  )).toBe(true);
});

const supportedTranslationLocales: Exclude<AppLocale, 'en'>[] = ['hu', 'it', 'de', 'fr', 'es', 'ru'];

test.each(supportedTranslationLocales)('wheel interaction copy exists in %s', (locale) => {
  const sources = [
    'House {number}',
    'House cusp',
    'Planets in this house',
    'No planets are placed in this house.',
    'Close house details',
    'Close aspect details',
    'orb',
    'These themes blend, so one can bring the other to the surface.',
    'You may feel pulled between these needs; finding a workable balance can help.',
    'These themes tend to support each other with less effort.',
    'These themes can compete for attention and ask you to adjust or choose what matters first.',
    'These themes can support each other when you choose to use them together.',
    'first impressions, new situations, and how you choose to present yourself as you begin',
    'money and belongings, your personal values, and the choices that help you build security',
    'everyday conversations, learning new skills, and exchanging ideas with people around you',
    'home, family, your roots, and the routines that help you feel you belong',
    'creativity, romance, fun, and the things you enjoy making or sharing',
    'daily routines, work, practical responsibilities, and the ways you look after yourself',
    'close one-to-one relationships, cooperation, and the decisions you make with another person',
    'trust, shared money or responsibilities, and the deeper changes that ask you to adapt',
    'learning, travel, new experiences, and the beliefs that guide how you see the world',
    'work, long-term goals, the responsibilities you take on, and how others see your contribution',
    'friendships, communities, shared causes, and the future plans you build with other people',
    'rest, private feelings, time alone, and the quiet moments you need to process life',
  ];
  for (const source of sources) {
    expect(natalTranslations[locale][source]?.trim(), `${locale}: ${source}`).toBeTruthy();
  }
});

test('house and aspect details render with Russian labels and localized degrees', async () => {
  const root = await renderInteractionWheel('ru');
  await act(async () => {
    root.findByProps({ testID: 'natal-wheel-house-hit-area-5' }).props.onPress();
  });
  expect(root.findByProps({ testID: 'natal-house-detail-5' })).toBeDefined();
  expect(root.findByProps({ testID: 'natal-house-detail-position' }).props.children)
    .toBe('00° 00′ Лев');
  expect(root.findByProps({ testID: 'natal-house-detail-planets' }).props.children)
    .toBe('Солнце');
  expect(root.findByProps({ testID: 'natal-house-detail-close' }).props.accessibilityLabel)
    .toBe('Закрыть сведения о доме');

  await act(async () => {
    root.findByProps({ testID: 'natal-aspect-hit-trine-sun-moon' }).props.onPress();
  });
  expect(root.findByProps({ testID: 'natal-aspect-detail-title' }).props.children)
    .toBe('Солнце тригон Луна');
  expect(root.findByProps({ testID: 'natal-aspect-detail-orb' }).props.children)
    .toBe('орбис 0,6°');
  expect(root.findByProps({ testID: 'natal-aspect-detail-interpretation' }).props.children)
    .toBe(natalTranslations.ru['These themes tend to support each other with less effort.']);
});

test('screen, natal, and daily-reading dictionaries have matching keys in all six translated locales', () => {
  for (const dictionary of [screenTranslations, natalTranslations, dailyReadingTranslations]) {
    const keysByLocale = supportedTranslationLocales.map((locale) => Object.keys(dictionary[locale]).sort());
    for (const keys of keysByLocale.slice(1)) expect(keys).toEqual(keysByLocale[0]);
    for (const locale of supportedTranslationLocales) {
      for (const [source, translation] of Object.entries(dictionary[locale])) {
        expect(translation.trim(), `${locale}: ${source}`).not.toBe('');
        if (translation !== source) {
          expect(translateText(source, locale), `${locale}: ${source} lookup`).not.toBe(source);
        }
      }
    }
  }
});

test.each(supportedTranslationLocales)('personal natal explanations are localized in %s', (locale) => {
  const t = (source: string) => translateText(source, locale);
  const planet = explainPlanet('Sun', 'Aquarius', 6, undefined, t);
  const aspect = explainAspect('Sun', 'Mars', 'sextile', {
    first: { sign: 'Taurus', house: 12 },
    second: { sign: 'Leo', house: 6 },
  }, t);
  const ascendant = explainAngle('Ascendant', 'Cancer', t);
  const midheaven = explainAngle('Midheaven', 'Capricorn', t);

  expect(planet.body).not.toContain('This planet relates to');
  expect(planet.body).not.toContain('In Aquarius,');
  expect(planet.body).not.toContain('In your 6th House');
  expect(planet.example).not.toContain('Imagine this situation:');
  expect(planet.example).not.toContain('you are');
  if (locale === 'ru') {
    expect(planet.example).toContain('Представь такую ситуацию: ты упрощаешь задачу, которую выполняешь каждый день.');
    expect(planet.example).toContain('в таких сферах жизни: повседневные привычки');
    expect(planet.title).toContain('Солнце в знаке Водолея');
    expect(planet.body).toContain('В знаке Водолея');
    expect(planet.body).toContain('В 6-м доме');
    expect(aspect.body).toContain('Планета «Солнце» в знаке Тельца в 12-м доме');
    expect(ascendant.title).toBe('Асцендент в знаке Рака');
    expect(midheaven.title).toBe('Середина неба в знаке Козерога');
  }
  expect(aspect.title).not.toBe('Sun sextile Mars');
  expect(aspect.body).not.toContain('Your Sun in Taurus');
  expect(aspect.body).not.toContain('Your Mars in Leo');
  expect(ascendant.body).not.toContain('In astrology,');
  expect(midheaven.body).not.toContain('In astrology,');
  expect(ascendant.body).not.toContain('Treat it as a prompt, not a fixed description');
  expect(midheaven.body).not.toContain('Treat it as a prompt, not a fixed description');
  expect(ascendant.body).toContain(t('notice the mood and respond with care'));
  expect(midheaven.body).toContain(t('take responsibility and plan a few steps ahead'));
  expect(ascendant.example).toContain(t('check in on how everyone involved is feeling'));
  expect(midheaven.example).toContain(t('take one small step toward a longer-term goal'));
  expect(ascendant.body).not.toContain('Your Ascendant in');
  expect(midheaven.body).not.toContain('Your Midheaven in');
  expect(ascendant.example).not.toContain('Imagine joining a group');
  expect(midheaven.example).not.toContain('Imagine a team project');
  for (const value of [
    planet.body, planet.example, aspect.title, aspect.body,
    ascendant.body, ascendant.example, midheaven.body, midheaven.example,
  ]) {
    expect(value).not.toMatch(/\{(?:planet|sign|house|focus|area|situation|action|angle|meaning|tone)\}/);
  }

  const angleCases = [
    ['Aries', 'take initiative before every detail is settled', 'make the first move'],
    ['Taurus', 'move at a steady pace and choose what feels dependable', 'give yourself time before deciding'],
    ['Gemini', 'ask questions, exchange ideas, and adapt as a conversation shifts', 'ask a question that opens the conversation'],
    ['Cancer', 'notice the mood and respond with care', 'check in on how everyone involved is feeling'],
    ['Leo', 'bring warmth and show what matters to you', 'share why this matters to you'],
    ['Virgo', 'notice details and look for a practical improvement', 'make one practical adjustment'],
    ['Libra', 'look for common ground and make room for a fair exchange', 'hear both sides before deciding'],
    ['Scorpio', 'observe closely, share gradually, and look for sincerity', 'look for what is really driving the situation'],
    ['Sagittarius', 'look for the wider meaning and stay open to new experiences', 'look for a wider perspective'],
    ['Capricorn', 'take responsibility and plan a few steps ahead', 'take one small step toward a longer-term goal'],
    ['Aquarius', 'think independently and suggest a fresh approach', 'try an approach people around you have not considered'],
    ['Pisces', 'notice the mood and respond with imagination and sensitivity', 'notice what is not being said and respond gently'],
  ];
  for (const [sign, style, action] of angleCases) {
    const rising = explainAngle('Ascendant', sign, t);
    const career = explainAngle('Midheaven', sign, t);
    expect(rising.body).toContain(t(style));
    expect(career.body).toContain(t(style));
    expect(rising.example).toContain(t(action));
    expect(career.example).toContain(t(action));
    expect(rising.body).not.toContain(style);
    expect(career.body).not.toContain(style);
    expect(rising.example).not.toContain(action);
    expect(career.example).not.toContain(action);
  }
});

test('Russian sign names and house numbers use the correct grammatical case', () => {
  const t = (source: string) => translateText(source, 'ru');
  const signCases: [string, string][] = [
    ['Aries', 'Овна'],
    ['Taurus', 'Тельца'],
    ['Gemini', 'Близнецов'],
    ['Cancer', 'Рака'],
    ['Leo', 'Льва'],
    ['Virgo', 'Девы'],
    ['Libra', 'Весов'],
    ['Scorpio', 'Скорпиона'],
    ['Sagittarius', 'Стрельца'],
    ['Capricorn', 'Козерога'],
    ['Aquarius', 'Водолея'],
    ['Pisces', 'Рыб'],
  ];

  for (const [sign, genitive] of signCases) {
    expect(explainPlanet('Sun', sign, 1, undefined, t).title).toContain(`в знаке ${genitive}`);
    expect(explainPlanet('Sun', sign, 1, undefined, t).body).toContain(`В знаке ${genitive}`);
    expect(explainAngle('Ascendant', sign, t).title).toContain(`в знаке ${genitive}`);
  }
  for (let house = 1; house <= 12; house += 1) {
    expect(explainPlanet('Sun', 'Aquarius', house, undefined, t).body).toContain(`В ${house}-м доме`);
  }
});

test.each(supportedTranslationLocales)('calculated daily reflection copy is localized in %s', (locale) => {
  const body = formatAppText('Today highlights {theme}. {explanation}', locale, {
    theme: translateText('energy and initiative', locale),
    explanation: translateText('A practiced skill or routine can help you make steady progress.', locale),
  });

  expect(body).not.toContain('Today highlights');
  expect(body).not.toContain('energy and initiative');
  expect(body).not.toContain('A practiced skill');
  expect(body).not.toMatch(/\{(?:theme|explanation)\}/);
});
