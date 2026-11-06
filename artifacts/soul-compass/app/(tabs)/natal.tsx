import { Feather } from '@expo/vector-icons';
import { useNatalCalculation } from '@/hooks/useNatalCalculation';
import type { NatalChartResponse } from '@workspace/api-client-react';
import { useFocusEffect, useRouter, useScrollToTop } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { EdgeSwipeBack } from '@/components/EdgeSwipeBack';
import { TabEdgeSwipe } from '@/components/TabEdgeSwipe';
import { TabScreenHeader } from '@/components/TabScreenHeader';
import cosmosArt from '../../assets/images/cosmos-starfield.jpg';
import { useColors } from '@/hooks/useColors';
import { screenTypography } from '@/constants/typography';
import { SCREEN_HORIZONTAL_GUTTER } from '@/constants/screen-layout';
import { useProfile } from '@/profile/ProfileContext';

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
const signTones: Record<string, string> = {
  aries: 'taking initiative', taurus: 'steadily and practically',
  gemini: 'with curiosity', cancer: 'with care and a need for security',
  leo: 'with warmth and creativity', virgo: 'with care and attention to detail',
  libra: 'looking for balance and connection', scorpio: 'with depth and a wish to understand',
  sagittarius: 'openly and in search of meaning', capricorn: 'patiently and with a clear goal',
  aquarius: 'independently and with fresh ideas', pisces: 'with imagination and sensitivity',
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
): ChartExplanation {
  const name = cap(planet);
  if (planet.toLowerCase() === 'moon' && uncertainMoonRange && uncertainMoonRange.length > 1) {
    return {
      title: 'Moon sign range',
    body: `The Moon changed signs on your birth date and could be in ${uncertainMoonRange.join(' or ')}. Without a birth time, we cannot tell which one applies. The Moon is about your emotional needs and what helps you feel safe.`,
      example: 'After a demanding day, a quiet moment or a trusted conversation might help you feel settled again.',
    };
  }
  const key = planet.toLowerCase();
  const theme = planetThemes[key] ?? 'a personal theme in your life';
  const signStyle = signStyles[sign.toLowerCase()];
  const signAction = signActions[sign.toLowerCase()] ?? 'approach things in your own way';
  const houseGuide = typeof house === 'number' ? houseGuides[house] : undefined;
  const houseIsKnown = houseGuide !== undefined;
  const bodyParts = [
    `Your ${name} is about ${theme}.`,
    signStyle
      ? `In ${cap(sign)}, you may approach this part of life ${signStyle}.`
      : `In ${cap(sign)}, you may approach this part of life in your own way.`,
    ...(houseGuide
      ? [`In your ${ordinalHouse(house!)} House, this theme is most connected to ${houseGuide.area}.`]
      : []),
  ];
  const body = bodyParts.join('\n\n');
  return {
    title: `${name} in ${cap(sign)}${houseIsKnown ? ` · House ${house}` : ''}`,
    body,
    example: makePlanetExample(key, houseGuide),
  };
}

function makePlanetExample(
  planet: string,
  houseGuide?: { exampleSituation: string },
): string {
  const situation = houseGuide?.exampleSituation ?? planetExampleSituations[planet] ?? 'making an everyday choice';
  const action = planetExampleActions[planet] ?? 'choose one practical next step';
  return `Imagine you're ${situation}; you might ${action}.`;
}

const houseGuides: Record<number, { area: string; exampleSituation: string }> = {
  1: {
    area: 'first impressions and the way you begin things',
    exampleSituation: 'introducing yourself in a new place',
  },
  2: {
    area: 'money, personal values, and security',
    exampleSituation: 'deciding whether a purchase is worth it',
  },
  3: {
    area: 'everyday conversations and learning',
    exampleSituation: 'explaining a new idea to someone',
  },
  4: {
    area: 'home, family, and belonging',
    exampleSituation: 'making one corner of home more comfortable',
  },
  5: {
    area: 'creativity, romance, and fun',
    exampleSituation: 'showing someone a project you have made',
  },
  6: {
    area: 'daily routines, work, and self-care',
    exampleSituation: 'simplifying a task you repeat every day',
  },
  7: {
    area: 'close relationships and shared decisions',
    exampleSituation: 'making plans with someone close',
  },
  8: {
    area: 'trust, shared responsibilities, and deep change',
    exampleSituation: 'deciding what responsibility to share',
  },
  9: {
    area: 'learning, travel, and the beliefs that guide you',
    exampleSituation: 'comparing two different viewpoints',
  },
  10: {
    area: 'work, long-term goals, and your public role',
    exampleSituation: 'taking responsibility for an important goal',
  },
  11: {
    area: 'friendships, communities, and future plans',
    exampleSituation: 'organizing a plan with friends',
  },
  12: {
    area: 'rest, private feelings, and time alone',
    exampleSituation: 'working quietly on something just for yourself',
  },
};

function ordinalHouse(house: number): string {
  if (house % 100 >= 11 && house % 100 <= 13) return `${house}th`;
  if (house % 10 === 1) return `${house}st`;
  if (house % 10 === 2) return `${house}nd`;
  if (house % 10 === 3) return `${house}rd`;
  return `${house}th`;
}
export function explainAspect(
  first: string,
  second: string,
  type: string,
  context: AspectExplanationContext = {},
): ChartExplanation {
  const kind = type.toLowerCase();
  const firstKey = first.toLowerCase();
  const secondKey = second.toLowerCase();
  const firstPlacement = context.first ?? {};
  const secondPlacement = context.second ?? {};
  const describe = (planet: string, placement: AspectPlacementContext) => {
    const key = planet.toLowerCase();
    const name = cap(planet);
    const focus = planetThemes[key] ?? 'this part of your life';
    const houseGuide = typeof placement.house === 'number' ? houseGuides[placement.house] : undefined;
    const signStyle = placement.sign ? signStyles[placement.sign.toLowerCase()] : undefined;
    const signText = placement.sign ? ` in ${cap(placement.sign)}` : '';
    const houseText = houseGuide && placement.house
      ? ` in your ${ordinalHouse(placement.house)} House`
      : '';
    const area = houseGuide ? ` with ${houseGuide.area}` : '';
    const focusSentence = houseGuide
      ? `Your ${name}${signText}${houseText} connects ${focus}${area}.`
      : `Your ${name}${signText}${houseText} is about ${focus}.`;
    const signDetail = placement.sign && signStyle
      ? ` You may approach this part of life ${signStyle}.`
      : '';
    const uncertainMoonDetail = placement.possibleSigns && placement.possibleSigns.length > 1
      ? ` Its sign could be ${placement.possibleSigns.join(' or ')}.`
      : '';
    return `${focusSentence}${signDetail}${uncertainMoonDetail}`;
  };
  const firstSituation = firstPlacement.house
    ? houseGuides[firstPlacement.house]?.exampleSituation
    : undefined;
  const secondSituation = secondPlacement.house
    ? houseGuides[secondPlacement.house]?.exampleSituation
    : undefined;
  const firstAction = planetExampleActions[firstKey] ?? 'choose one practical next step';
  const secondAction = planetExampleActions[secondKey] ?? 'make room for another need';
  const firstExampleSituation = firstSituation ?? planetExampleSituations[firstKey] ?? 'making an everyday choice';
  const secondExampleSituation = secondSituation ?? planetExampleSituations[secondKey] ?? 'responding to another need';
  const tenseAspect = kind === 'opposition' || kind === 'square';
  const example = tenseAspect
    ? `You might feel pulled between wanting to ${firstAction} when you're ${firstExampleSituation} and needing to ${secondAction} when you're ${secondExampleSituation}.`
    : `You might ${firstAction} when you're ${firstExampleSituation}, then ${secondAction} when you're ${secondExampleSituation}.`;
  const referenceNote = context.referenceOnly
    ? ' For an unknown birth time, these calculations use local noon as a reference and may shift.'
    : '';
  const personalLink = aspectMeanings[kind]
    ?? 'These two themes are connected and may affect each other in everyday life.';
  return {
    title: `${cap(first)} ${type.toLowerCase()} ${cap(second)}`,
    body: `${describe(first, firstPlacement)}\n\n${describe(second, secondPlacement)}\n\n${personalLink}${referenceNote}`,
    example,
  };
}

export function explainAngle(label: string, sign: string): ChartExplanation {
  const isAscendant = label.toLowerCase() === 'ascendant';
  return {
    title: `${label} in ${cap(sign)}`,
    body: `In astrology, the ${label} is linked with ${isAscendant ? 'how you approach new situations' : 'your long-term direction, work, and public life'}. ${cap(sign)} is often described as doing this ${signTones[sign.toLowerCase()] ?? 'in its own way'}. Treat it as a prompt, not a fixed description.`,
    example: `When ${isAscendant ? 'meeting someone new' : 'thinking about a long-term goal'}, you might ${signActions[sign.toLowerCase()] ?? 'approach it in your own way'}.`,
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
function lonLabel(lon: number) {
  const n = ((lon % 360) + 360) % 360;
  return `${dms(n % 30)} ${SIGNS[Math.floor(n / 30)]}`;
}
function signAt(lon: number) {
  const n = ((lon % 360) + 360) % 360;
  return SIGNS[Math.floor(n / 30)];
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

export default function NatalScreen() {
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

  const choose = (choice: Disambiguation) => {
    setDisambiguation(choice);
    submit(choice);
  };

  const msg = chart.isError ? errorMessage(chart.error) : '';
  const twice = /occurred twice/i.test(msg);
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
      <StatusBar style="light" />
      <View pointerEvents="none" accessible={false} style={styles.starLayer}>
        {backgroundStars.map((star, index) => (
          <View
            key={index}
            style={[
              styles.starDot,
              {
                backgroundColor: c.foreground,
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
        accessibilityLabel="Natal chart"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Platform.OS === 'ios' ? 18 : topInset + 18,
            paddingBottom: Platform.OS === 'ios' ? 32 : 34,
          },
        ]}
        alwaysBounceVertical={false}
        bounces={false}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : 'never'}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <View
            pointerEvents="none"
            style={[
              styles.heroArt,
              {
                top: -(topInset + 18),
                left: -heroBleed,
                right: -heroBleed,
                height: heroHeight,
              },
            ]}
          >
            <Image
              source={cosmosArt}
              accessibilityLabel="A quiet field of stars in a deep navy sky"
              resizeMode="cover"
              style={styles.heroImage}
            />
            <LinearGradient
              colors={['transparent', 'transparent', c.homeBackground]}
              locations={[0, 0.46, 1]}
              style={styles.heroFade}
            />
          </View>
          <TabScreenHeader
            title={'The Sky of the Day\nYou Arrived'}
            titleColor={c.foreground}
            subtitleColor={c.mutedForeground}
            subtitle={profile ? (
              <>
                {profile.birthDate}
                {profile.birthTime.status === 'known' ? ` at ${profile.birthTime.localTime}` : ', time unknown'}
                {` \u00B7 ${profile.birthPlace.city}, ${profile.birthPlace.country}`}
                {'\n'}Tropical zodiac.
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
              <Text style={[styles.cardTitle, { color: c.foreground }]}>No birth details yet</Text>
              <Text style={[styles.body, { color: c.mutedForeground }]}>Add your birth date, time and place to calculate a chart.</Text>
              <Btn c={c} label="Open settings" icon="settings" onPress={() => router.push('/settings')} />
            </Card>
          ) : data ? (
            <>
              {chart.cacheWarning ? (
                <Card c={c}>
                  <Text accessibilityRole="alert" style={[styles.body, { color: c.foreground }]}>{chart.cacheWarning}</Text>
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
              <Text style={[styles.cardTitle, { color: c.foreground }]}>Your permission comes first</Text>
              <Text style={[styles.body, { color: c.foreground }]}>
                If you agree, we send your birth date, your birth time if you know it, and your birthplace coordinates and time zone to calculate your Natal Chart. We do not send your name, current home, language, intentions, or collection. The chart is saved on this device, so opening the app does not send the same details again. If you change your birth details, we may calculate a new chart.
              </Text>
              <Text style={[styles.body, { color: c.mutedForeground }]}>
                You can withdraw permission in Settings. Your saved chart stays on this device. If you are offline, the request is not saved for later.
              </Text>
              {consentError ? <Text accessibilityRole="alert" style={[styles.body, { color: c.foreground }]}>{consentError}</Text> : null}
              {declined ? (
                <>
                  <Text style={[styles.body, { color: c.foreground }]}>No birth details were sent. Your local profile and collection still work.</Text>
                  <Btn c={c} label="Review permission" onPress={() => setDeclined(false)} />
                </>
              ) : consentBusy ? (
                <Text style={[styles.body, { color: c.foreground }]}>Saving permission…</Text>
              ) : (
                <>
                  <Btn c={c} label="Agree" onPress={() => void agree()} />
                  <Btn c={c} label="Not Now" onPress={() => setDeclined(true)} />
                </>
              )}
            </Card>
          ) : chart.isError ? (
            <Card c={c}>
              <Label c={c} icon="alert-circle" text={twice ? 'CLOCK CHANGE' : 'COULD NOT CALCULATE'} />
              <Text style={[styles.body, { color: c.foreground }]} testID="natal-error-message">{msg}</Text>
              {twice ? (
                <>
                  <Text style={[styles.body, { color: c.mutedForeground }]}>
                    The clocks changed that night, so {profile.birthTime.status === 'known' ? profile.birthTime.localTime : 'this time'} happened twice. Choose which time to use for this chart. Your saved profile will not change.
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
            </Card>
          ) : (
            <Card c={c}>
              <Text style={[styles.cardTitle, { color: c.foreground }]}>Your chart hasn’t loaded yet</Text>
              <Text style={[styles.body, { color: c.mutedForeground }]}>
                Check your connection and try again.
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
          <View pointerEvents="none" style={[styles.explanationScrim, { backgroundColor: c.background }]} />
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
                  accessibilityLabel="Close chart explanation"
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
                      A hypothetical example
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
  const aspects = data.aspects.filter((a) => MAJOR.has(a.type.toLowerCase()));
  const angles = hasKnownBirthMoment ? data.angles : null;

  return (
    <View style={{ gap: 18 }}>
      <Label c={c} icon="user" text="PERSONAL NATAL CHART" />
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
            Using the {disambiguation} occurrence of your birth time for this chart only.
          </Text>
        </Card>
      ) : null}

      {!timeKnown ? (
        <Card c={c}>
          <Label c={c} icon="clock" text="BIRTH TIME UNKNOWN" />
          <Text style={[styles.body, { color: c.mutedForeground }]}>
            Since your birth time is unknown, noon is used only as a reference. Your rising sign, Midheaven, and houses are left out because they depend on the exact time.
          </Text>
          {data.moonSignRange.length > 1 ? (
            <Text style={[styles.body, { color: c.foreground }]}>
              The Moon changed signs during your birth date: {data.moonSignRange.join(' or ')}. Without a birth time, we cannot tell which sign applies.
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
            value={lonLabel(angles.ascendant)}
            testID="natal-angle-ascendant"
            onPress={() => onExplain(explainAngle('Ascendant', signAt(angles.ascendant)))}
          />
          <AngleTile
            c={c}
            label="MIDHEAVEN"
            hint="MC"
            value={lonLabel(angles.midheaven)}
            testID="natal-angle-midheaven"
            onPress={() => onExplain(explainAngle('Midheaven', signAt(angles.midheaven)))}
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
              accessibilityLabel={`Explain ${cap(p.planet)} in ${uncertainMoon ? data.moonSignRange.join(' or ') : cap(p.sign)}${house ? `, house ${house}` : ''}`}
              accessibilityHint="Opens a short, reflective explanation"
              testID={`natal-planet-${p.planet.toLowerCase()}`}
              onPress={() => onExplain(explainPlanet(p.planet, p.sign, house, uncertainMoon ? data.moonSignRange : undefined))}
              style={({ pressed }) => [styles.rowPressable, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }, { opacity: pressed ? 0.72 : 1 }]}
            >
              <Text style={[styles.rowName, { color: c.foreground }]}>{cap(p.planet)}</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[styles.rowValue, { color: c.foreground }]}>
                  {uncertainMoon ? data.moonSignRange.join(' / ') : `${dms(p.degreeInSign)} ${cap(p.sign)}`}
                </Text>
                <Text style={[styles.rowMeta, { color: c.mutedForeground }]}>
                  {[house ? `House ${house}` : null, p.retrograde ? 'Retrograde' : null].filter(Boolean).join(' \u00B7 ') || '\u2014'}
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
          <Text style={[styles.body, { color: c.mutedForeground }]}>No major planetary connections are close to your birth chart today.</Text>
        ) : aspects.map((a, i) => (
          <Pressable
            key={`${a.first}-${a.second}-${a.type}`}
            accessibilityRole="button"
            accessibilityLabel={`Explain ${cap(a.first)} ${a.type.toLowerCase()} ${cap(a.second)}`}
            accessibilityHint="Opens a plain-language explanation using your chart"
            testID={`natal-aspect-${a.first.toLowerCase()}-${a.type.toLowerCase()}-${a.second.toLowerCase()}`}
            onPress={() => onExplain(explainAspect(a.first, a.second, a.type, {
              first: aspectPlacement(a.first),
              second: aspectPlacement(a.second),
              referenceOnly: !hasKnownBirthMoment,
            }))}
            style={({ pressed }) => [styles.rowPressable, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }, { opacity: pressed ? 0.72 : 1 }]}
          >
            <Text style={[styles.rowName, { color: c.foreground, flex: 1 }]}>{cap(a.first)} {a.type.toLowerCase()} {cap(a.second)}</Text>
            <Text style={[styles.rowMeta, { color: c.mutedForeground }]}>
              orb {a.orb.toFixed(1)}°{a.exact ? ' \u00B7 exact' : ''}{a.applying === null ? '' : a.applying ? ' \u00B7 applying' : ' \u00B7 separating'}
            </Text>
            <Feather name="chevron-right" size={14} color={c.secondary} />
          </Pressable>
        ))}
      </Card>

      {data.warnings.length > 0 ? (
        <Card c={c}>
          <Label c={c} icon="info" text="NOTES FROM THE CALCULATION" />
          {data.warnings.map((w) => <Text key={w} style={[styles.body, { color: c.mutedForeground }]}>{w}</Text>)}
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
            <Text style={[styles.rowMeta, { color: c.foreground, flex: 1 }]}>{cap(p.planet)}</Text>
            <Text style={[styles.mono, { color: c.mutedForeground }]}>
              lon {p.longitude.toFixed(2)}°  lat {p.latitude.toFixed(2)}°  {p.speedDegreesPerDay.toFixed(3)}°/d
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
                <Text style={[styles.rowMeta, { color: c.foreground, flex: 1 }]}>House {h.house}</Text>
                <Text style={[styles.mono, { color: c.mutedForeground }]}>{lonLabel(h.longitude)}</Text>
              </View>
            ))}
          </>
        ) : null}
        {angles ? (
          <Text style={[styles.mono, { color: c.mutedForeground, marginTop: 10 }]}>
            DSC {lonLabel(angles.descendant)}  IC {lonLabel(angles.imumCoeli)}
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
            <View pointerEvents="none" style={[styles.explanationScrim, { backgroundColor: c.background }]} />
            {infoCopy ? (
              <View
                accessibilityViewIsModal
                accessibilityRole="alert"
                testID="natal-technical-info-modal"
                style={[styles.explanationCard, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <View style={styles.explanationHeader}>
                  <Text accessibilityRole="header" style={[styles.explanationTitle, { color: c.foreground }]}>
                    {infoCopy.title}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close chart details explanation"
                    testID="natal-technical-info-close"
                    hitSlop={8}
                    onPress={() => setInfoTopic(null)}
                    style={styles.explanationClose}
                  >
                    <Feather name="x" size={19} color={c.secondary} />
                  </Pressable>
                </View>
                <Text style={[styles.body, { color: c.mutedForeground, marginTop: 12 }]} testID="natal-technical-info-body">
                  {infoCopy.body}
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
    <Card c={c}>
      <Pressable
        testID="natal-guide-toggle"
        accessibilityRole="button"
        accessibilityLabel="How to read this"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={styles.guideHead}
      >
        <View testID="natal-guide-title" style={styles.guideTitleCenter}>
          <Feather name="book-open" size={14} color={c.secondary} />
          <Text style={[styles.label, { color: c.secondary }]}>HOW TO READ THIS</Text>
        </View>
        <View pointerEvents="none" style={styles.guideChevronWrap}>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color={c.secondary} />
        </View>
      </Pressable>
      {open ? (
        <>
          <Text style={[styles.body, { color: c.foreground }]}>
            Your birth chart is a map of where the planets were when you were born. Astrologers use it to talk about life themes. You do not need to know astrology: start with the parts that sound familiar and leave the rest.
          </Text>
          {items.map(([k, v]) => (
            <Text key={k} style={[styles.body, { color: c.mutedForeground }]}>
              <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold' }}>{k}. </Text>{v}
            </Text>
          ))}
        </>
      ) : null}
    </Card>
  );
}
function Card({ c, children }: { c: Palette; children: React.ReactNode }) {
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>{children}</View>;
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
  return (
    <View style={styles.labelRow}>
      <Feather name={icon} size={14} color={c.secondary} />
      <Text style={[styles.label, { color: c.secondary }]}>{text}</Text>
      {onInfo ? (
        <Pressable
          testID={infoTestID}
          accessibilityRole="button"
          accessibilityLabel={`About ${text.toLowerCase()}`}
          accessibilityHint="Opens a short explanation"
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Explain ${label.toLowerCase()} in ${value.split(' ').slice(-1)[0]}`}
      accessibilityHint="Opens a short, reflective explanation"
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.card, styles.angleTile, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.72 : 1 }]}
    >
      <View style={styles.angleTileHeader}>
        <Text style={[styles.label, { color: c.secondary }]}>{label}</Text>
        <Feather name="chevron-right" size={13} color={c.secondary} />
      </View>
      <Text style={[styles.angleValue, { color: c.foreground }]}>{value}</Text>
      <Text style={[styles.rowMeta, { color: c.mutedForeground }]}>{hint}</Text>
    </Pressable>
  );
}
function Btn({ c, label, icon, onPress, active }: { c: Palette; label: string; icon?: React.ComponentProps<typeof Feather>['name']; onPress: () => void; active?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, { borderColor: c.secondary, backgroundColor: active ? c.secondary : 'transparent', opacity: pressed ? 0.7 : 1 }]}>
      {icon ? <Feather name={icon} size={13} color={active ? c.background : c.secondary} /> : null}
      <Text style={[styles.btnText, { color: active ? c.background : c.secondary }]}>{label}</Text>
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
  return (
    <Card c={c}>
      <View style={styles.loadingRow}>
        <ActivityIndicator color={c.secondary} />
        <Text style={[styles.body, { color: c.foreground, marginBottom: 0 }]}>
          Preparing your Natal Chart…
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  starLayer: { ...StyleSheet.absoluteFill },
  starDot: { borderRadius: 2, position: 'absolute' },
  heroArt: { overflow: 'hidden', position: 'absolute' },
  heroImage: { height: '100%', position: 'absolute', top: 0, width: '100%' },
  heroFade: { ...StyleSheet.absoluteFill },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: SCREEN_HORIZONTAL_GUTTER,
    paddingBottom: 34,
  },
  page: { width: '100%', maxWidth: 480 },
  card: { borderRadius: 28, borderWidth: 1, paddingHorizontal: 22, paddingVertical: 20 },
  cardTitle: { fontFamily: 'Georgia', fontSize: 22, marginBottom: 8 },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 12 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.5 },
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
    marginBottom: 12,
    minHeight: 32,
    position: 'relative',
  },
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
