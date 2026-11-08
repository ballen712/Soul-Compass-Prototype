import { Feather } from '@expo/vector-icons';
import { useNatalCalculation } from '@/hooks/useNatalCalculation';
import type { NatalChartResponse } from '@workspace/api-client-react';
import { useFocusEffect, useRouter, useScrollToTop } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EdgeSwipeBack } from '@/components/EdgeSwipeBack';
import { TabEdgeSwipe } from '@/components/TabEdgeSwipe';
import { TabScreenHeader } from '@/components/TabScreenHeader';
import { CelestialHeader } from '@/components/CelestialHeader';
import { NatalChartWheel } from '@/components/NatalChartWheel';
import { useColors } from '@/hooks/useColors';
import { screenTypography } from '@/constants/typography';
import { SCREEN_HORIZONTAL_GUTTER, TAB_SCREEN_SCROLL_BOTTOM_GUTTER } from '@/constants/screen-layout';
import { useProfile } from '@/profile/ProfileContext';
import { formatAppText, useAppLocale, useAppText } from '@/localization';

type Disambiguation = 'earlier' | 'later';
type Palette = ReturnType<typeof useColors>['cosmos'];

const MAJOR = new Set(['conjunction', 'opposition', 'trine', 'square', 'sextile']);
const backgroundStars = Array.from({ length: 24 }, (_, index) => ({
  x: ((index * 41 + 19) % 97) / 97,
  y: ((index * 53 + 13) % 101) / 101,
  size: index % 9 === 0 ? 2 : 1.25,
  opacity: 0.25 + (index % 4) * 0.05,
}));
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
type ChartExplanation = { title: string; body: string; example?: string };
type CopyTranslator = (source: string) => string;
const russianSignGenitives: Record<string, string> = {
  aries: 'Овна',
  taurus: 'Тельца',
  gemini: 'Близнецов',
  cancer: 'Рака',
  leo: 'Льва',
  virgo: 'Девы',
  libra: 'Весов',
  scorpio: 'Скорпиона',
  sagittarius: 'Стрельца',
  capricorn: 'Козерога',
  aquarius: 'Водолея',
  pisces: 'Рыб',
};

function signForCopy(sign: string, translate: CopyTranslator): string {
  if (translate('in') === 'в') {
    return russianSignGenitives[sign.toLowerCase()] ?? translate(cap(sign));
  }
  return translate(cap(sign));
}
const identityCopy: CopyTranslator = (source) => source;

function fillCopy(translate: CopyTranslator, template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.replaceAll(`{${key}}`, String(value)),
    translate(template),
  );
}

const planetThemes: Record<string, string> = {
  sun: 'confidence and your sense of self',
  moon: 'your emotional needs and what helps you feel safe',
  mercury: 'how you think, learn, and communicate',
  venus: 'what you value and how you connect with others',
  mars: 'your energy and how you take action',
  jupiter: 'growth, hope, and new possibilities',
  saturn: 'responsibility, patience, and long-term effort',
  uranus: 'independence and the changes you need',
  neptune: 'imagination and sensitivity',
  pluto: 'trust and deep personal change',
};
const planetDetails: Record<string, string> = {
  sun: 'It can point to what gives you direction and where you want to express yourself, rather than only meeting other people’s expectations.',
  moon: 'It can point to the comfort, closeness, and familiar routines you reach for when you feel tired or uncertain.',
  mercury: 'It can show how you take in information, sort through ideas, and find words for what you think.',
  venus: 'It can show what feels worthwhile, how you build closeness, and what makes a relationship feel balanced to you.',
  mars: 'It can show what gets you moving, how you meet obstacles, and how you express frustration or desire.',
  jupiter: 'It can point to where experience helps you grow, what gives you hope, and which possibilities you want to explore.',
  saturn: 'It can show where you take obligations seriously, where patience is needed, and what you can build through steady effort.',
  uranus: 'It can point to where you need room to do things your own way and where a fresh approach can help you feel unstuck.',
  neptune: 'It can point to where you are imaginative or sensitive, and how art, empathy, or quiet can help you make sense of feelings.',
  pluto: 'It can show where you want to look beneath the surface, build trust, and make changes that last.',
};
const signStyles: Record<string, string> = {
  aries: 'directly and with urgency',
  taurus: 'at a measured, steady pace',
  gemini: 'with curiosity',
  cancer: 'with care for people close to you',
  leo: 'with confidence and warmth',
  virgo: 'practically and with attention to detail',
  libra: 'with an eye for fairness',
  scorpio: 'privately and with intensity',
  sagittarius: 'with openness to new viewpoints',
  capricorn: 'patiently, with long-term goals in mind',
  aquarius: 'independently and in an unconventional way',
  pisces: 'with imagination and sensitivity',
};
const signActions: Record<string, string> = {
  aries: 'make the first move',
  taurus: 'give yourself time before deciding',
  gemini: 'ask a question that opens the conversation',
  cancer: 'check in on how everyone involved is feeling',
  leo: 'share why this matters to you',
  virgo: 'make one practical adjustment',
  libra: 'hear both sides before deciding',
  scorpio: 'look for what is really driving the situation',
  sagittarius: 'look for a wider perspective',
  capricorn: 'take one small step toward a longer-term goal',
  aquarius: 'try an approach people around you have not considered',
  pisces: 'notice what is not being said and respond gently',
};
const planetExampleSituations: Record<string, string> = {
  sun: 'choosing how to spend an afternoon that is yours',
  moon: 'coming home after a busy day',
  mercury: 'hearing an idea you want to understand',
  venus: 'deciding how to spend time with someone you care about',
  mars: 'deciding whether to start a task now',
  jupiter: 'getting a chance to try something unfamiliar',
  saturn: 'starting a goal that will take practice',
  uranus: 'noticing that a familiar routine no longer works',
  neptune: 'having a chance to make something creative',
  pluto: 'facing a change you did not choose',
};
const planetExampleScenes: Record<string, string> = {
  sun: 'you are choosing how to spend an afternoon that is yours',
  moon: 'you are coming home after a busy day',
  mercury: 'you are hearing an idea you want to understand',
  venus: 'you are deciding how to spend time with someone you care about',
  mars: 'you are deciding whether to start a task now',
  jupiter: 'you are getting a chance to try something unfamiliar',
  saturn: 'you are starting a goal that will take practice',
  uranus: 'you are noticing that a familiar routine no longer works',
  neptune: 'you are having a chance to make something creative',
  pluto: 'you are facing a change you did not choose',
};
const planetExampleActions: Record<string, string> = {
  sun: 'give your time to the activity you genuinely care about',
  moon: 'check what would help you feel settled before responding',
  mercury: 'ask a question that clears up one detail',
  venus: 'suggest something you would both enjoy',
  mars: 'start with one concrete step',
  jupiter: 'try one manageable option you have not explored',
  saturn: 'break the goal into a realistic next step',
  uranus: 'test a different way of doing it',
  neptune: 'turn an idea or feeling into something creative',
  pluto: 'be honest about what needs to change',
};
const angleSignStyles: Record<string, string> = {
  aries: 'take initiative before every detail is settled',
  taurus: 'move at a steady pace and choose what feels dependable',
  gemini: 'ask questions, exchange ideas, and adapt as a conversation shifts',
  cancer: 'notice the mood and respond with care',
  leo: 'bring warmth and show what matters to you',
  virgo: 'notice details and look for a practical improvement',
  libra: 'look for common ground and make room for a fair exchange',
  scorpio: 'observe closely, share gradually, and look for sincerity',
  sagittarius: 'look for the wider meaning and stay open to new experiences',
  capricorn: 'take responsibility and plan a few steps ahead',
  aquarius: 'think independently and suggest a fresh approach',
  pisces: 'notice the mood and respond with imagination and sensitivity',
};
const aspectMeanings: Record<string, string> = {
  conjunction: 'These themes blend, so one can bring the other to the surface.',
  opposition: 'You may feel pulled between these needs; finding a workable balance can help.',
  trine: 'These themes tend to support each other with less effort.',
  square: 'These themes can compete for attention and ask you to adjust or choose what matters first.',
  sextile: 'These themes can support each other when you choose to use them together.',
};
type AspectPlacementContext = {
  sign?: string;
  house?: number;
  possibleSigns?: string[];
};
type AspectExplanationContext = {
  first?: AspectPlacementContext;
  second?: AspectPlacementContext;
  referenceOnly?: boolean;
};

export function explainPlanet(
  planet: string,
  sign: string,
  house?: number,
  uncertainMoonRange?: string[],
  translate: CopyTranslator = identityCopy,
): ChartExplanation {
  const name = translate(cap(planet));
  const localizedSign = signForCopy(sign, translate);
  if (planet.toLowerCase() === 'moon' && uncertainMoonRange && uncertainMoonRange.length > 1) {
    return {
      title: translate('Moon sign range'),
      body: fillCopy(translate, 'The Moon changed signs on your birth date and could be in {signs}. Without a birth time, we cannot tell which one applies. The Moon is about your emotional needs and what helps you feel safe.', {
        signs: uncertainMoonRange.map((item) => signForCopy(item, translate)).join(` ${translate('or')} `),
      }),
      example: translate('After a demanding day, a quiet moment or a trusted conversation might help you feel settled again.'),
    };
  }
  const key = planet.toLowerCase();
  const theme = planetThemes[key] ?? 'a personal theme in your life';
  const signStyle = signStyles[sign.toLowerCase()];
  const signAction = signActions[sign.toLowerCase()];
  const houseGuide = typeof house === 'number' ? houseGuides[house] : undefined;
  const houseIsKnown = houseGuide !== undefined;
  const signDescription = signStyle && signAction
    ? fillCopy(translate, 'In {sign}, you may approach this part of life {style}. In everyday life, this might look like: {action}.', {
      sign: localizedSign,
      style: translate(signStyle),
      action: translate(signAction),
    })
    : translate('You may approach this part of life in a way that feels natural to you.');
  const bodyParts = [
    fillCopy(translate, 'This planet relates to {theme}. {detail}', {
      theme: translate(theme),
      detail: translate(planetDetails[key] ?? 'It can help you notice what matters to you in this part of life.'),
    }),
    signDescription,
    ...(houseGuide
      ? [fillCopy(translate, 'In your {ordinal} House, this theme is most connected to {area}.', {
        ordinal: houseOrdinalForCopy(house!, translate),
        number: house!,
        area: translate(houseGuide.area),
      })]
      : []),
  ];
  const body = bodyParts.join('\n\n');
  const houseSuffix = houseIsKnown ? ` · ${fillCopy(translate, 'House {number}', { number: house! })}` : '';
  return {
    title: fillCopy(translate, '{planet} in {sign}{houseSuffix}', { planet: name, sign: localizedSign, houseSuffix }),
    body,
    example: makePlanetExample(key, signStyle ?? 'with curiosity', houseGuide, translate),
  };
}

function makePlanetExample(
  planet: string,
  signStyle: string,
  houseGuide?: { area: string; exampleSituation: string; exampleScene: string },
  translate: CopyTranslator = identityCopy,
): string {
  const scene = houseGuide?.exampleScene ?? planetExampleScenes[planet] ?? 'you are making an everyday choice';
  const action = planetExampleActions[planet] ?? 'choose one practical next step';
  const values = {
    scene: translate(scene),
    style: translate(signStyle),
    action: translate(action),
    area: translate(houseGuide?.area ?? 'everyday life'),
  };
  return fillCopy(
    translate,
    houseGuide
      ? 'Imagine this situation: {scene}. You might approach it {style}, then choose to {action}. That is one possible way this placement may show up in {area}.'
      : 'Imagine this situation: {scene}. You might approach it {style}, then choose to {action}. That is one possible way this planet’s theme may show up in everyday life.',
    values,
  );
}

const houseGuides: Record<number, { area: string; exampleSituation: string; exampleScene: string }> = {
  1: {
    area: 'first impressions, new situations, and how you choose to present yourself as you begin',
    exampleSituation: 'introducing yourself in a new place',
    exampleScene: 'you are introducing yourself in a new place',
  },
  2: {
    area: 'money and belongings, your personal values, and the choices that help you build security',
    exampleSituation: 'deciding whether a purchase is worth it',
    exampleScene: 'you are deciding whether a purchase is worth it',
  },
  3: {
    area: 'everyday conversations, learning new skills, and exchanging ideas with people around you',
    exampleSituation: 'explaining a new idea to someone',
    exampleScene: 'you are explaining a new idea to someone',
  },
  4: {
    area: 'home, family, your roots, and the routines that help you feel you belong',
    exampleSituation: 'making one corner of home more comfortable',
    exampleScene: 'you are making one corner of your home more comfortable',
  },
  5: {
    area: 'creativity, romance, fun, and the things you enjoy making or sharing',
    exampleSituation: 'showing someone a project you have made',
    exampleScene: 'you are showing someone a project you made',
  },
  6: {
    area: 'daily routines, work, practical responsibilities, and the ways you look after yourself',
    exampleSituation: 'simplifying a task you repeat every day',
    exampleScene: 'you are simplifying a task you repeat every day',
  },
  7: {
    area: 'close one-to-one relationships, cooperation, and the decisions you make with another person',
    exampleSituation: 'making plans with someone close',
    exampleScene: 'you are making plans with someone close',
  },
  8: {
    area: 'trust, shared money or responsibilities, and the deeper changes that ask you to adapt',
    exampleSituation: 'deciding what responsibility to share',
    exampleScene: 'you are deciding what responsibility to share',
  },
  9: {
    area: 'learning, travel, new experiences, and the beliefs that guide how you see the world',
    exampleSituation: 'comparing two different viewpoints',
    exampleScene: 'you are comparing two different viewpoints',
  },
  10: {
    area: 'work, long-term goals, the responsibilities you take on, and how others see your contribution',
    exampleSituation: 'taking responsibility for an important goal',
    exampleScene: 'you are taking responsibility for an important goal',
  },
  11: {
    area: 'friendships, communities, shared causes, and the future plans you build with other people',
    exampleSituation: 'organizing a plan with friends',
    exampleScene: 'you are organizing a plan with friends',
  },
  12: {
    area: 'rest, private feelings, time alone, and the quiet moments you need to process life',
    exampleSituation: 'working quietly on something just for yourself',
    exampleScene: 'you are working quietly on something just for yourself',
  },
};

function ordinalHouse(house: number): string {
  if (house % 100 >= 11 && house % 100 <= 13) return `${house}th`;
  if (house % 10 === 1) return `${house}st`;
  if (house % 10 === 2) return `${house}nd`;
  if (house % 10 === 3) return `${house}rd`;
  return `${house}th`;
}

function houseOrdinalForCopy(house: number, translate: CopyTranslator): string {
  if (translate('in') === 'в') return `${house}-м`;
  return translate(ordinalHouse(house));
}

export function explainAspect(
  first: string,
  second: string,
  type: string,
  context: AspectExplanationContext = {},
  translate: CopyTranslator = identityCopy,
): ChartExplanation {
  const kind = type.toLowerCase();
  const firstKey = first.toLowerCase();
  const secondKey = second.toLowerCase();
  const firstPlacement = context.first ?? {};
  const secondPlacement = context.second ?? {};
  const describe = (planet: string, placement: AspectPlacementContext) => {
    const key = planet.toLowerCase();
    const name = translate(cap(planet));
    const focus = translate(planetThemes[key] ?? 'this part of your life');
    const houseGuide = typeof placement.house === 'number' ? houseGuides[placement.house] : undefined;
    const signStyle = placement.sign ? signStyles[placement.sign.toLowerCase()] : undefined;
    const signName = placement.sign ? signForCopy(placement.sign, translate) : '';
    const houseSuffix = houseGuide && placement.house
      ? fillCopy(translate, ' in your {ordinal} House', {
        ordinal: houseOrdinalForCopy(placement.house, translate),
        number: placement.house,
      })
      : '';
    const area = houseGuide
      ? fillCopy(translate, ' with {area}', { area: translate(houseGuide.area) })
      : '';
    const focusSentence = placement.sign && houseGuide
      ? fillCopy(translate, 'Your {planet} in {sign}{houseSuffix} connects {focus}{area}.', {
        planet: name, sign: signName, houseSuffix, focus, area,
      })
      : placement.sign
        ? fillCopy(translate, 'Your {planet} in {sign} is about {focus}.', {
          planet: name, sign: signName, focus,
        })
        : houseGuide
          ? fillCopy(translate, 'Your {planet}{houseSuffix} is about {focus}{area}.', {
            planet: name, houseSuffix, focus, area,
          })
          : fillCopy(translate, 'Your {planet} is about {focus}.', {
        planet: name, focus, area,
      });
    const signDetail = placement.sign && signStyle
      ? ` ${fillCopy(translate, 'You may approach this part of life {style}.', { style: translate(signStyle) })}`
      : '';
    const uncertainMoonDetail = placement.possibleSigns && placement.possibleSigns.length > 1
      ? ` ${fillCopy(translate, 'Its sign could be {signs}.', {
        signs: placement.possibleSigns.map((item) => translate(cap(item))).join(` ${translate('or')} `),
      })}`
      : '';
    return `${focusSentence}${signDetail}${uncertainMoonDetail}`;
  };
  const firstSituation = firstPlacement.house
    ? houseGuides[firstPlacement.house]?.exampleSituation
    : undefined;
  const secondSituation = secondPlacement.house
    ? houseGuides[secondPlacement.house]?.exampleSituation
    : undefined;
  const firstAction = translate(planetExampleActions[firstKey] ?? 'choose one practical next step');
  const secondAction = translate(planetExampleActions[secondKey] ?? 'make room for another need');
  const firstExampleSituation = translate(firstSituation ?? planetExampleSituations[firstKey] ?? 'making an everyday choice');
  const secondExampleSituation = translate(secondSituation ?? planetExampleSituations[secondKey] ?? 'responding to another need');
  const tenseAspect = kind === 'opposition' || kind === 'square';
  const example = tenseAspect
    ? fillCopy(translate, 'You may want to {firstAction} in {firstSituation}, while also needing to {secondAction} in {secondSituation}. Both needs can matter.', {
      firstAction, firstSituation: firstExampleSituation, secondAction, secondSituation: secondExampleSituation,
    })
    : fillCopy(translate, 'For instance, in {firstSituation}, you might {firstAction}. Later, in {secondSituation}, you could {secondAction}.', {
      firstAction, firstSituation: firstExampleSituation, secondAction, secondSituation: secondExampleSituation,
    });
  const referenceNote = context.referenceOnly
    ? ` ${translate('For an unknown birth time, these calculations use local noon as a reference and may shift.')}`
    : '';
  const personalLink = aspectMeanings[kind]
    ?? 'These two themes are connected and may affect each other in everyday life.';
  return {
    title: fillCopy(translate, '{first} {aspect} {second}', {
      first: translate(cap(first)),
      aspect: translate(kind),
      second: translate(cap(second)),
    }),
    body: `${describe(first, firstPlacement)}\n\n${describe(second, secondPlacement)}\n\n${translate(personalLink)}${referenceNote}`,
    example,
  };
}

export function explainAngle(label: string, sign: string, translate: CopyTranslator = identityCopy): ChartExplanation {
  const isAscendant = label.toLowerCase() === 'ascendant';
  const angle = translate(label);
  const signName = signForCopy(sign, translate);
  const signStyle = translate(angleSignStyles[sign.toLowerCase()] ?? 'approach things in your own way');
  const exampleAction = translate(signActions[sign.toLowerCase()] ?? 'make one practical adjustment');
  return {
    title: fillCopy(translate, '{angle} in {sign}', { angle, sign: signName }),
    body: fillCopy(
      translate,
      isAscendant
        ? 'Your Ascendant in {sign} describes how you tend to enter unfamiliar situations and the first impression you may give. With {sign} here, you may tend to {style}. You may notice this in how you begin conversations, settle into a new place, or respond when plans change. It is your opening style, not the whole of your personality.'
        : 'Your Midheaven in {sign} points to the direction you may want to build over time: the work you do, the responsibilities you choose, and the contribution you want to make. With {sign} here, you may work toward long-term goals by {style}. This can shape many kinds of work or projects; it does not point to one required job. You may feel more engaged where this approach is useful.',
      { sign: signName, style: signStyle },
    ),
    example: fillCopy(
      translate,
      isAscendant
        ? 'Imagine joining a group where you know no one. A possible first response is: “{action}.” This small moment can show how your {sign} Ascendant shapes a first impression; as you feel at ease, other sides of you can come forward.'
        : 'Imagine a team project has become difficult. A possible next step is: “{action}.” This shows one way your {sign} Midheaven could shape your contribution, without naming one exact career.',
      { sign: signName, action: exampleAction },
    ),
  };
}

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function dms(deg: number) {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}\u00B0 ${String(m).padStart(2, '0')}\u2032`;
}
function lonLabel(lon: number, translate: CopyTranslator = identityCopy) {
  const n = ((lon % 360) + 360) % 360;
  return `${dms(n % 30)} ${translate(SIGNS[Math.floor(n / 30)])}`;
}
function signAt(lon: number, translate: CopyTranslator = identityCopy) {
  const n = ((lon % 360) + 360) % 360;
  return translate(SIGNS[Math.floor(n / 30)]);
}
function errorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      for (const k of ['message', 'error']) if (typeof d[k] === 'string') return d[k] as string;
    }
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return 'The chart could not be calculated.';
}
function apiErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const data = (err as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;
  const code = (data as Record<string, unknown>).code;
  return typeof code === 'string' ? code : null;
}

export default function NatalScreen() {
  const t = useAppText();
  const locale = useAppLocale();
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  useScrollToTop(scrollRef);
  const colors = useColors();
  const c = colors.cosmos;
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const router = useRouter();
  const { profile, loaded, privacy, setConsent, canCalculate } = useProfile();
  const chart = useNatalCalculation();
  const [disambiguation, setDisambiguation] = useState<Disambiguation | null>(null);
  const [activeExplanation, setActiveExplanation] = useState<ChartExplanation | null>(null);
  const [declined, setDeclined] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const submit = (choice: Disambiguation | null) => { void chart.calculate(choice); };
  useEffect(() => { setDisambiguation(null); }, [profile]);
  useEffect(() => {
    if (!loaded || !profile || !canCalculate() || chart.data || chart.isPending || chart.isError) return;
    void chart.refreshOncePerSession();
  }, [loaded, profile, canCalculate, chart.data, chart.isPending, chart.isError, chart.refreshOncePerSession]);
  async function agree() {
    if (consentBusy) return;
    setConsentBusy(true); setConsentError(null);
    try {
      await setConsent(true);
      setDeclined(false);
    }
    catch (error) {
      setConsentError(error instanceof Error ? error.message : 'Permission could not be saved.');
    }
    finally { setConsentBusy(false); }
  }
  async function reviewRejectedConsent() {
    if (consentBusy) return;
    setConsentBusy(true); setConsentError(null);
    try {
      await setConsent(false);
      setDeclined(false);
    } catch (error) {
      setConsentError(error instanceof Error ? error.message : 'Permission could not be saved.');
    } finally { setConsentBusy(false); }
  }

  const choose = (choice: Disambiguation) => {
    setDisambiguation(choice);
    submit(choice);
  };

  const code = chart.isError ? apiErrorCode(chart.error) : null;
  const consentRejected = code === 'CONSENT_REQUIRED' || code === 'CONSENT_INVALID';
  const msg = chart.isError ? errorMessage(chart.error) : '';
  const twice = code === 'BIRTH_TIME_AMBIGUOUS' || /occurred twice/i.test(msg);
  const data = chart.data;
  const savedChoice = chart.disambiguation ?? disambiguation;
  const timeKnown = profile?.birthTime.status === 'known';
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const pageWidth = Math.min(windowWidth - 48, 480);
  const heroBleed = Math.max(0, (windowWidth - pageWidth) / 2);
  const heroHeight = Math.round(windowHeight * 0.42);

  return (
    <TabEdgeSwipe tabIndex={2} testID="tab-edge-swipe-natal">
    <SafeAreaView
      edges={[]}
      style={[styles.safeArea, { backgroundColor: c.homeBackground }]}
    >
      <StatusBar style={colors.mode === 'dark' ? 'light' : 'dark'} />
      <View pointerEvents="none" accessible={false} style={styles.starLayer}>
        {backgroundStars.map((star, index) => (
          <View
            key={index}
            style={[
              styles.starDot,
              {
                backgroundColor: c.star,
                height: star.size,
                left: `${star.x * 100}%`,
                opacity: star.opacity,
                top: `${star.y * 100}%`,
                width: star.size,
              },
            ]}
          />
        ))}
      </View>
      <ScrollView
        ref={scrollRef}
        testID="natal-main-scroll"
        accessibilityLabel={t('Natal chart')}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Platform.OS === 'ios' ? 18 : topInset + 18,
          },
        ]}
        alwaysBounceVertical={false}
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : 'never'}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <CelestialHeader
            width={windowWidth}
            testID="natal-celestial-header"
            height={heroHeight}
            style={{
              top: -(topInset + 18),
              left: -heroBleed,
              right: -heroBleed,
            }}
          />
          <TabScreenHeader
            title={'The Sky of the Day\nYou Arrived'}
            titleColor={c.foreground}
            subtitleColor={c.mutedForeground}
            subtitle={profile ? (
              <>
                {profile.birthDate}
                {profile.birthTime.status === 'known'
                  ? formatAppText(' at {time}', locale, { time: profile.birthTime.localTime })
                  : `, ${t('time unknown')}`}
                {` \u00B7 ${profile.birthPlace.city}, ${profile.birthPlace.country}`}
                {'\n'}{t('Tropical zodiac.')}
              </>
            ) : undefined}
            afterSpacing={7}
          />

          {!loaded ? (
            <Skeleton c={c} />
          ) : profile && chart.isPending && canCalculate() ? (
            <ChartLoading c={c} />
          ) : !profile ? (
            <Card c={c}>
              <Text style={[styles.cardTitle, { color: c.foreground }]}>{t('No birth details yet')}</Text>
              <Text style={[styles.body, { color: c.mutedForeground }]}>{t('Add your birth date, time and place to calculate a chart.')}</Text>
              <Btn c={c} label="Open settings" icon="settings" onPress={() => router.push('/settings')} />
            </Card>
          ) : data ? (
            <>
              {chart.cacheWarning ? (
                <Card c={c}>
                  <Text accessibilityRole="alert" style={[styles.body, { color: c.foreground }]}>{t(chart.cacheWarning)}</Text>
                </Card>
              ) : null}
              <ChartView
                c={c}
                data={data}
                timeKnown={timeKnown}
                disambiguation={savedChoice}
                onExplain={setActiveExplanation}
              />
            </>
          ) : !privacy.astrologyApiConsent || !canCalculate() ? (
            <Card c={c}>
              <Text style={[styles.cardTitle, { color: c.foreground }]}>{t('Your permission comes first')}</Text>
              <Text style={[styles.body, { color: c.foreground }]}>
                {t('We send your birth date, time if known, and birthplace details to our server only to calculate your chart. We do not create an online profile with them. If your chart is saved on this device, we use it instead of sending the same details again.')}
              </Text>
              <Text style={[styles.body, { color: c.mutedForeground }]}>
                {t('Your profile and chart stay on this device. You can withdraw permission or delete your saved data in Settings at any time. If your birth details change, we may send the updated details for a new calculation.')}
              </Text>
              {consentError ? <Text accessibilityRole="alert" style={[styles.body, { color: c.foreground }]}>{t(consentError)}</Text> : null}
              {declined ? (
                <>
                  <Text style={[styles.body, { color: c.foreground }]}>{t('No birth details were sent. Your local profile and collection still work.')}</Text>
                  <Btn c={c} label="Review permission" onPress={() => setDeclined(false)} />
                </>
              ) : consentBusy ? (
                <Text style={[styles.body, { color: c.foreground }]}>{t('Saving permission…')}</Text>
              ) : (
                <>
                  <Btn c={c} label="Agree" onPress={() => void agree()} />
                  <Btn c={c} label="Not Now" onPress={() => setDeclined(true)} />
                </>
              )}
            </Card>
          ) : chart.isError ? (
            <Card c={c}>
              {consentRejected ? (
                <>
                  <Text accessibilityRole="header" style={[styles.cardTitle, { color: c.foreground }]}>
                    {t('Your permission comes first')}
                  </Text>
                  {consentBusy ? (
                    <Text style={[styles.body, { color: c.foreground }]}>{t('Saving permission…')}</Text>
                  ) : (
                    <Btn
                      c={c}
                      label="Review permission"
                      testID="natal-server-consent-review"
                      onPress={() => void reviewRejectedConsent()}
                    />
                  )}
                </>
              ) : (
                <>
                  <Label c={c} icon="alert-circle" text={twice ? 'CLOCK CHANGE' : 'COULD NOT CALCULATE'} />
                  {!twice ? (
                    <Text style={[styles.body, { color: c.foreground }]} testID="natal-error-message">{t(msg)}</Text>
                  ) : null}
                  {twice ? (
                    <>
                      <Text style={[styles.body, { color: c.mutedForeground }]}>
                        {formatAppText('The clocks changed that night, so {time} happened twice. Choose which time to use for this chart. Your saved profile will not change.', locale, {
                          time: profile.birthTime.status === 'known' ? profile.birthTime.localTime : t('this time'),
                        })}
                      </Text>
                      <View style={styles.choiceRow}>
                        <Btn c={c} label="Earlier occurrence" onPress={() => choose('earlier')} active={disambiguation === 'earlier'} />
                        <Btn c={c} label="Later occurrence" onPress={() => choose('later')} active={disambiguation === 'later'} />
                      </View>
                    </>
                  ) : (
                    <View style={styles.choiceRow}>
                      <Btn c={c} label="Try again" icon="refresh-cw" onPress={() => submit(disambiguation)} />
                      <Btn c={c} label="Edit birth details" icon="settings" onPress={() => router.push('/settings')} />
                    </View>
                  )}
                </>
              )}
            </Card>
          ) : (
            <Card c={c}>
              <Text style={[styles.cardTitle, { color: c.foreground }]}>{t('Your chart hasn’t loaded yet')}</Text>
              <Text style={[styles.body, { color: c.mutedForeground }]}>
                {t('Check your connection and try again.')}
              </Text>
              <Btn c={c} label="Try again" icon="refresh-cw" onPress={() => submit(null)} />
            </Card>
          )}
        </View>
      </ScrollView>
      <Modal
        visible={activeExplanation !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setActiveExplanation(null)}
      >
        <EdgeSwipeBack
          testID="natal-explanation-edge-swipe-back"
          onBack={() => setActiveExplanation(null)}
        >
        <SafeAreaView edges={['top', 'bottom']} style={styles.explanationSafeArea} testID="natal-explanation-stage">
          <View pointerEvents="none" style={[styles.explanationScrim, { backgroundColor: colors.scrim }]} />
          {activeExplanation ? (
            <View
              accessibilityViewIsModal
              accessibilityRole="alert"
              testID="natal-explanation-modal"
              style={[styles.explanationCard, { backgroundColor: c.card, borderColor: c.border }]}
            >
              <View style={styles.explanationHeader}>
                <Text accessibilityRole="header" style={[styles.explanationTitle, { color: c.foreground }]}>
                  {activeExplanation.title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('Close chart explanation')}
                  testID="natal-explanation-close"
                  hitSlop={8}
                  onPress={() => setActiveExplanation(null)}
                  style={styles.explanationClose}
                >
                  <Feather name="x" size={19} color={c.secondary} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.explanationBody}>
                <Text style={[styles.body, { color: c.mutedForeground }]}>{activeExplanation.body}</Text>
                {activeExplanation.example ? (
                  <>
                    <Text style={[styles.explanationExampleLabel, { color: c.secondary }]}>
                      {t('A hypothetical example')}
                    </Text>
                    <Text style={[styles.explanationExample, { color: c.foreground }]}>
                      {activeExplanation.example}
                    </Text>
                  </>
                ) : null}
              </ScrollView>
            </View>
          ) : null}
        </SafeAreaView>
        </EdgeSwipeBack>
      </Modal>
    </SafeAreaView>
    </TabEdgeSwipe>
  );
}

function ChartView({ c, data, timeKnown, disambiguation, onExplain }: {
  c: Palette; data: NatalChartResponse; timeKnown: boolean; disambiguation: Disambiguation | null; onExplain: (explanation: ChartExplanation) => void;
}) {
  const t = useAppText();
  const locale = useAppLocale();
  const [guideOpen, setGuideOpen] = useState(false);
  const [infoTopic, setInfoTopic] = useState<'chart-details' | 'house-cusps' | null>(null);
  const infoCopy = infoTopic ? chartInfoCopy[infoTopic] : null;
  useFocusEffect(useCallback(() => {
    setGuideOpen(false);
  }, []));
  const hasKnownBirthMoment = timeKnown
    && data.input.birthTimeKnown
    && data.calculation.birthTimeResolution === 'known';
  const housesAvailable = hasKnownBirthMoment
    && data.calculation.houseStatus === 'available'
    && data.houseCusps.length > 0;
  const houses = useMemo(
    () => new Map((housesAvailable ? data.planetaryHouses : []).map((h) => [h.planet.toLowerCase(), h.house])),
    [data.planetaryHouses, housesAvailable],
  );
  const planetsByName = useMemo(
    () => new Map(data.planets.map((planet) => [planet.planet.toLowerCase(), planet])),
    [data.planets],
  );
  const aspectPlacement = (planet: string): AspectPlacementContext => {
    const key = planet.toLowerCase();
    const position = planetsByName.get(key);
    const uncertainMoon = key === 'moon'
      && !hasKnownBirthMoment
      && data.moonSignRange.length > 1;
    return {
      sign: uncertainMoon ? undefined : position?.sign,
      house: housesAvailable ? houses.get(key) : undefined,
      possibleSigns: uncertainMoon ? data.moonSignRange : undefined,
    };
  };
  const localizeWarning = (warning: string) => {
    const repeated = /^Repeated local time: the (earlier|later) occurrence was explicitly selected\.$/.exec(warning);
    if (repeated) {
      return formatAppText('Repeated local time: the {occurrence} occurrence was explicitly selected.', locale, {
        occurrence: t(repeated[1] === 'earlier' ? 'first' : 'second'),
      });
    }
    const moonRange = /^The Moon changes sign during this local birth day; possible signs: (.+)\.$/.exec(warning);
    if (moonRange) {
      const signs = moonRange[1].split(', ').map((sign) => t(sign)).join(', ');
      return formatAppText('The Moon changes sign during this local birth day; possible signs: {signs}.', locale, { signs });
    }
    return t(warning);
  };
  const aspects = data.aspects.filter((a) => MAJOR.has(a.type.toLowerCase()));
  const angles = hasKnownBirthMoment ? data.angles : null;

  return (
    <View style={{ gap: 18 }}>
      <Label c={c} icon="user" text="PERSONAL NATAL CHART" />
      <Card c={c}>
        <Text style={[styles.chartWheelLabel, { color: c.secondary }]}>
          {t('PLANETS')}
        </Text>
        <NatalChartWheel
          planets={data.planets}
          palette={c}
          translate={t}
          locale={locale}
          moonSignRange={data.moonSignRange}
          timeKnown={hasKnownBirthMoment}
        />
      </Card>
      <Guide
        c={c}
        timeKnown={timeKnown}
        housesAvailable={housesAvailable}
        anglesAvailable={angles !== null}
        open={guideOpen}
        onToggle={() => setGuideOpen((value) => !value)}
      />
      {disambiguation ? (
        <Card c={c}>
          <Text style={[styles.body, { color: c.mutedForeground }]}>
            {formatAppText('Using the {occurrence} occurrence of your birth time for this chart only.', locale, {
              occurrence: t(disambiguation === 'earlier' ? 'first' : 'second'),
            })}
          </Text>
        </Card>
      ) : null}

      {!timeKnown ? (
        <Card c={c}>
          <Label c={c} icon="clock" text="BIRTH TIME UNKNOWN" />
          <Text style={[styles.body, { color: c.mutedForeground }]}>
            {t('Since your birth time is unknown, noon is used only as a reference. Your rising sign, Midheaven, and houses are left out because they depend on the exact time.')}
          </Text>
          {data.moonSignRange.length > 1 ? (
            <Text style={[styles.body, { color: c.foreground }]}>
              {formatAppText('The Moon changed signs during your birth date: {signs}. Without a birth time, we cannot tell which sign applies.', locale, {
                signs: data.moonSignRange.map((sign) => t(sign)).join(t(' or ')),
              })}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {angles ? (
        <View style={styles.angleRow}>
          <AngleTile
            c={c}
            label="ASCENDANT"
            hint="Rising sign"
            value={lonLabel(angles.ascendant, t)}
            testID="natal-angle-ascendant"
            onPress={() => onExplain(explainAngle('Ascendant', signAt(angles.ascendant), t))}
          />
          <AngleTile
            c={c}
            label="MIDHEAVEN"
            hint="MC"
            value={lonLabel(angles.midheaven, t)}
            testID="natal-angle-midheaven"
            onPress={() => onExplain(explainAngle('Midheaven', signAt(angles.midheaven), t))}
          />
        </View>
      ) : null}

      <Card c={c}>
        <Label c={c} icon="disc" text="PLANETS" />
        {data.planets.map((p, i) => {
          const house = hasKnownBirthMoment ? houses.get(p.planet.toLowerCase()) : undefined;
          const uncertainMoon = !timeKnown && p.planet.toLowerCase() === 'moon' && data.moonSignRange.length > 1;
          return (
            <Pressable
              key={p.planet}
              accessibilityRole="button"
              accessibilityLabel={formatAppText('Explain {item}', locale, {
                item: fillCopy(t, '{planet} in {sign}{houseSuffix}', {
                  planet: t(cap(p.planet)),
                  sign: uncertainMoon
                    ? data.moonSignRange.map((sign) => t(sign)).join(t(' or '))
                    : signForCopy(p.sign, t),
                  houseSuffix: house ? ` · ${formatAppText('House {number}', locale, { number: house })}` : '',
                }),
              })}
              accessibilityHint={t('Opens a short, reflective explanation')}
              testID={`natal-planet-${p.planet.toLowerCase()}`}
              onPress={() => onExplain(explainPlanet(p.planet, p.sign, house, uncertainMoon ? data.moonSignRange : undefined, t))}
              style={({ pressed }) => [styles.rowPressable, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }, { opacity: pressed ? 0.72 : 1 }]}
            >
              <Text style={[styles.rowName, { color: c.foreground }]}>{t(cap(p.planet))}</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[styles.rowValue, { color: c.foreground }]}>
                  {uncertainMoon ? data.moonSignRange.map((sign) => t(sign)).join(` ${t('or')} `) : `${dms(p.degreeInSign)} ${t(cap(p.sign))}`}
                </Text>
                <Text style={[styles.rowMeta, { color: c.mutedForeground }]}>
                  {[
                    house ? formatAppText('House {number}', locale, { number: house }) : null,
                    p.retrograde ? t('Retrograde') : null,
                  ].filter(Boolean).join(' \u00B7 ') || '\u2014'}
                </Text>
              </View>
              <Feather name="chevron-right" size={14} color={c.secondary} />
            </Pressable>
          );
        })}
      </Card>

      <Card c={c}>
        <Label c={c} icon="git-merge" text="MAJOR ASPECTS" />
        {aspects.length === 0 ? (
          <Text style={[styles.body, { color: c.mutedForeground }]}>{t('No major planetary connections are close to your birth chart today.')}</Text>
        ) : aspects.map((a, i) => (
          <Pressable
            key={`${a.first}-${a.second}-${a.type}`}
            accessibilityRole="button"
            accessibilityLabel={formatAppText('Explain {item}', locale, {
              item: fillCopy(t, '{first} {aspect} {second}', {
                first: t(cap(a.first)), aspect: t(a.type.toLowerCase()), second: t(cap(a.second)),
              }),
            })}
            accessibilityHint={t('Opens a plain-language explanation using your chart')}
            testID={`natal-aspect-${a.first.toLowerCase()}-${a.type.toLowerCase()}-${a.second.toLowerCase()}`}
            onPress={() => onExplain(explainAspect(a.first, a.second, a.type, {
              first: aspectPlacement(a.first),
              second: aspectPlacement(a.second),
              referenceOnly: !hasKnownBirthMoment,
            }, t))}
            style={({ pressed }) => [styles.rowPressable, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }, { opacity: pressed ? 0.72 : 1 }]}
          >
            <Text style={[styles.rowName, { color: c.foreground, flex: 1 }]}>
              {fillCopy(t, '{first} {aspect} {second}', {
                first: t(cap(a.first)), aspect: t(a.type.toLowerCase()), second: t(cap(a.second)),
              })}
            </Text>
            <Text style={[styles.rowMeta, { color: c.mutedForeground }]}>
              {t('orb')} {a.orb.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}°{a.exact ? ` · ${t('Exact').toLocaleLowerCase(locale)}` : ''}{a.applying === null ? '' : a.applying ? ` · ${t('Applying').toLocaleLowerCase(locale)}` : ` · ${t('Separating').toLocaleLowerCase(locale)}`}
            </Text>
            <Feather name="chevron-right" size={14} color={c.secondary} />
          </Pressable>
        ))}
      </Card>

      {data.warnings.length > 0 ? (
        <Card c={c}>
          <Label c={c} icon="info" text="NOTES FROM THE CALCULATION" />
          {data.warnings.map((w) => <Text key={w} style={[styles.body, { color: c.mutedForeground }]}>{localizeWarning(w)}</Text>)}
        </Card>
      ) : null}

      <Card c={c}>
        <Label
          c={c}
          icon="sliders"
          text="CHART DETAILS"
          onInfo={() => setInfoTopic('chart-details')}
          infoTestID="natal-chart-details-info"
        />
        {data.planets.map((p) => (
          <View key={p.planet} style={styles.detailRow}>
            <Text style={[styles.rowMeta, { color: c.foreground, flex: 1 }]}>{t(cap(p.planet))}</Text>
            <Text style={[styles.mono, { color: c.mutedForeground }]}>
              {t('longitude')} {p.longitude.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}°  {t('latitude')} {p.latitude.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}°  {p.speedDegreesPerDay.toLocaleString(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}°/d
            </Text>
          </View>
        ))}
        {housesAvailable ? (
          <>
            <View style={[styles.rule, { backgroundColor: c.border }]} />
            <Label
              c={c}
              icon="grid"
              text="HOUSE CUSPS"
              onInfo={() => setInfoTopic('house-cusps')}
              infoTestID="natal-house-cusps-info"
            />
            {data.houseCusps.map((h) => (
              <View key={h.house} testID={`natal-house-cusp-${h.house}`} style={styles.detailRow}>
                <Text style={[styles.rowMeta, { color: c.foreground, flex: 1 }]}>{formatAppText('House {number}', locale, { number: h.house })}</Text>
                <Text style={[styles.mono, { color: c.mutedForeground }]}>{lonLabel(h.longitude, t)}</Text>
              </View>
            ))}
          </>
        ) : null}
        {angles ? (
          <Text style={[styles.mono, { color: c.mutedForeground, marginTop: 10 }]}>
            DSC {lonLabel(angles.descendant, t)}  IC {lonLabel(angles.imumCoeli, t)}
          </Text>
        ) : null}
      </Card>
      <Modal
        visible={infoCopy !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setInfoTopic(null)}
      >
        <EdgeSwipeBack
          testID="natal-technical-info-edge-swipe"
          onBack={() => setInfoTopic(null)}
        >
          <SafeAreaView edges={['top', 'bottom']} style={styles.explanationSafeArea}>
            <View pointerEvents="none" style={[styles.explanationScrim, { backgroundColor: c.scrim }]} />
            {infoCopy ? (
              <View
                accessibilityViewIsModal
                accessibilityRole="alert"
                testID="natal-technical-info-modal"
                style={[styles.explanationCard, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <View style={styles.explanationHeader}>
                  <Text accessibilityRole="header" style={[styles.explanationTitle, { color: c.foreground }]}>
                    {t(infoCopy.title)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('Close chart details explanation')}
                    testID="natal-technical-info-close"
                    hitSlop={8}
                    onPress={() => setInfoTopic(null)}
                    style={styles.explanationClose}
                  >
                    <Feather name="x" size={19} color={c.secondary} />
                  </Pressable>
                </View>
                <Text style={[styles.body, { color: c.mutedForeground, marginTop: 12 }]} testID="natal-technical-info-body">
                  {t(infoCopy.body)}
                </Text>
              </View>
            ) : null}
          </SafeAreaView>
        </EdgeSwipeBack>
      </Modal>
    </View>
  );
}

const chartInfoCopy = {
  'chart-details': {
    title: 'Chart Details',
    body: 'These are the exact numbers used to calculate your chart. Longitude is a planet’s place along the zodiac. Latitude shows how far north or south it is from the Sun’s path. Speed shows how much its position changes each day. You can skip these numbers if you only want the reading.',
  },
  'house-cusps': {
    title: 'House Cusps',
    body: 'A cusp is the starting line of a house. The sign and degree show where that part of the chart begins. The twelve houses group areas of life such as home, work, and relationships. These numbers are technical, so you can skip them if you prefer the plain-language reading.',
  },
} as const;

function Guide({
  c,
  timeKnown,
  housesAvailable,
  anglesAvailable,
  open,
  onToggle,
}: {
  c: Palette;
  timeKnown: boolean;
  housesAvailable: boolean;
  anglesAvailable: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useAppText();
  const items: [string, string][] = [
    ['Chart method', !timeKnown
      ? 'This chart uses the tropical zodiac. Placidus houses depend on your exact birth time, so they are omitted.'
      : housesAvailable
        ? 'This chart uses the tropical zodiac, a common Western way of mapping the signs, and Placidus to divide the chart into twelve houses.'
        : 'This chart uses the tropical zodiac. Placidus houses could not be calculated for this location, so no substitute house system was used.'],
    ['Planets', 'Each planet is a different part of everyday life. The Sun is about what makes you feel like yourself; the Moon, what you feel and what helps you feel safe; Mercury, how you think, learn, and put ideas into words.'],
    ['Signs', 'A sign describes the style a theme may take: for example, direct, steady, curious, or imaginative.'],
    ['Houses', !timeKnown
      ? 'Houses depend on your exact birth time, so they are left out when that time is unknown.'
      : housesAvailable
        ? 'A house points to an area of everyday life—such as home, work, or relationships—where a theme may show up.'
        : 'Placidus houses were unavailable for this location, so no house placements are shown.'],
    ['Angles', !timeKnown
      ? 'The Ascendant and Midheaven depend on your exact birth time, so they are not shown here.'
      : anglesAvailable
        ? 'The Ascendant is linked with how you approach new situations. The Midheaven is linked with work and the part of life others see.'
        : 'Angle values could not be calculated for this chart, so they are not shown.'],
    ['Aspects', 'An aspect is the angle between two planets. Astrologers use it to describe how their themes may support or challenge each other. A smaller “orb” means the angle is closer to exact.'],
    ['Retrograde', 'From Earth, a planet can sometimes look as if it is moving backward. It is only how it appears in the sky; in astrology it adds a symbolic detail, not a problem you need to fix.'],
  ];
  return (
    <Card c={c} compact>
      <Pressable
        testID="natal-guide-toggle"
        accessibilityRole="button"
        accessibilityLabel={t('How to read this')}
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={[styles.guideHead, open && styles.guideHeadOpen]}
      >
        <View testID="natal-guide-title" style={styles.guideTitleCenter}>
          <Feather name="book-open" size={12} color={c.secondary} />
          <Text style={[styles.label, { color: c.secondary }]}>{t('HOW TO READ THIS')}</Text>
        </View>
        <View pointerEvents="none" style={styles.guideChevronWrap}>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color={c.secondary} />
        </View>
      </Pressable>
      {open ? (
        <>
          <Text style={[styles.body, { color: c.foreground }]}>
            {t('Your birth chart is a map of where the planets were when you were born. Astrologers use it to talk about life themes. You do not need to know astrology: start with the parts that sound familiar and leave the rest.')}
          </Text>
          {items.map(([k, v]) => (
              <Text key={k} style={[styles.body, { color: c.mutedForeground }]}>
                <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold' }}>{t(k)}. </Text>{t(v)}
            </Text>
          ))}
        </>
      ) : null}
    </Card>
  );
}
function Card({ c, children, compact = false }: { c: Palette; children: React.ReactNode; compact?: boolean }) {
  return (
    <View
      style={[
        styles.card,
        compact && styles.compactCard,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      {children}
    </View>
  );
}
function Label({
  c,
  icon,
  text,
  onInfo,
  infoTestID,
}: {
  c: Palette;
  icon: React.ComponentProps<typeof Feather>['name'];
  text: string;
  onInfo?: () => void;
  infoTestID?: string;
}) {
  const t = useAppText();
  const locale = useAppLocale();
  return (
    <View style={styles.labelRow}>
      <Feather name={icon} size={14} color={c.secondary} />
      <Text style={[styles.label, { color: c.secondary }]}>{t(text)}</Text>
      {onInfo ? (
        <Pressable
          testID={infoTestID}
          accessibilityRole="button"
          accessibilityLabel={formatAppText('About {item}', locale, { item: t(text) })}
          accessibilityHint={t('Opens a short explanation')}
          hitSlop={8}
          onPress={onInfo}
          style={styles.labelInfoButton}
        >
          <Feather name="info" size={14} color={c.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
}
function AngleTile({ c, label, hint, value, onPress, testID }: { c: Palette; label: string; hint: string; value: string; onPress: () => void; testID: string }) {
  const t = useAppText();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t(hint)}: ${value.split(' ').slice(-1)[0]}`}
      accessibilityHint={t('Opens a short, reflective explanation')}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.card, styles.angleTile, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.72 : 1 }]}
    >
      <View style={styles.angleTileHeader}>
        <Text style={[styles.label, { color: c.secondary }]}>{t(label)}</Text>
        <Feather name="chevron-right" size={13} color={c.secondary} />
      </View>
      <Text style={[styles.angleValue, { color: c.foreground }]}>{value}</Text>
      <Text style={[styles.rowMeta, { color: c.mutedForeground }]}>{t(hint)}</Text>
    </Pressable>
  );
}
function Btn({ c, label, icon, onPress, active, testID }: { c: Palette; label: string; icon?: React.ComponentProps<typeof Feather>['name']; onPress: () => void; active?: boolean; testID?: string }) {
  const t = useAppText();
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.btn, { borderColor: c.secondary, backgroundColor: active ? c.secondary : 'transparent', opacity: pressed ? 0.7 : 1 }]}>
      {icon ? <Feather name={icon} size={13} color={active ? c.background : c.secondary} /> : null}
      <Text style={[styles.btnText, { color: active ? c.background : c.secondary }]}>{t(label)}</Text>
    </Pressable>
  );
}
function Skeleton({ c }: { c: Palette }) {
  return (
    <View style={{ gap: 18 }}>
      {[110, 260, 180].map((h) => (
        <View key={h} style={[styles.card, { height: h, backgroundColor: c.surface, borderColor: c.border, opacity: 0.7 }]} />
      ))}
    </View>
  );
}
function ChartLoading({ c }: { c: Palette }) {
  const t = useAppText();
  return (
    <Card c={c}>
      <View style={styles.loadingRow}>
        <ActivityIndicator color={c.secondary} />
        <Text style={[styles.body, { color: c.foreground, marginBottom: 0 }]}>
          {t('Preparing your Natal Chart…')}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  starLayer: { ...StyleSheet.absoluteFill },
  starDot: { borderRadius: 2, position: 'absolute' },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: SCREEN_HORIZONTAL_GUTTER,
    paddingBottom: TAB_SCREEN_SCROLL_BOTTOM_GUTTER,
  },
  page: { width: '100%', maxWidth: 480 },
  card: { borderRadius: 28, borderWidth: 1, paddingHorizontal: 22, paddingVertical: 20 },
  compactCard: { borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8 },
  cardTitle: { fontFamily: 'Georgia', fontSize: 22, marginBottom: 8 },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 12 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.5 },
  chartWheelLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.5, marginBottom: 8, textAlign: 'center' },
  labelInfoButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  body: { ...screenTypography.body, marginBottom: 8 },
  loadingRow: { alignItems: 'center', flexDirection: 'row', gap: 14, minHeight: 42 },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  row: { alignItems: 'center', flexDirection: 'row', paddingVertical: 11, gap: 12 },
  rowPressable: { alignItems: 'center', flexDirection: 'row', paddingVertical: 11, gap: 12, minHeight: 52 },
  rowName: { fontFamily: 'Georgia', fontSize: 16 },
  rowValue: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  rowMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 10 },
  detailRow: { alignItems: 'center', flexDirection: 'row', paddingVertical: 5 },
  rule: { height: 1, marginVertical: 16 },
  angleRow: { flexDirection: 'row', gap: 12 },
  angleTile: { flex: 1, paddingVertical: 18 },
  angleTileHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  angleValue: { fontFamily: 'Georgia', fontSize: 19, marginTop: 10 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  btn: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 9 },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  guideHead: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    position: 'relative',
  },
  guideHeadOpen: { marginBottom: 10 },
  guideTitleCenter: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center' },
  guideChevronWrap: {
    alignItems: 'flex-end',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 24,
  },
  explanationSafeArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 20 },
  explanationScrim: { ...StyleSheet.absoluteFill, opacity: 0.76 },
  explanationCard: { alignSelf: 'center', width: '100%', maxWidth: 440, maxHeight: '88%', borderWidth: 1, borderRadius: 24, paddingHorizontal: 22, paddingTop: 18 },
  explanationHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  explanationTitle: { flex: 1, fontFamily: 'Georgia', fontSize: 24, lineHeight: 31, paddingTop: 8 },
  explanationClose: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  explanationBody: { paddingTop: 10, paddingBottom: 24 },
  explanationExampleLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 18,
    textTransform: 'uppercase',
  },
  explanationExample: { fontFamily: 'Georgia', fontSize: 17, lineHeight: 25, marginTop: 6 },
});
