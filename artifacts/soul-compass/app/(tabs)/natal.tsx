import { Feather } from '@expo/vector-icons';
import { useNatalCalculation } from '@/hooks/useNatalCalculation';
import type { NatalChartResponse } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsButton } from '@/components/SettingsButton';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/profile/ProfileContext';

type Disambiguation = 'earlier' | 'later';
type Palette = ReturnType<typeof useColors>['cosmos'];

const MAJOR = new Set(['conjunction', 'opposition', 'trine', 'square', 'sextile']);
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
type ChartExplanation = { title: string; body: string; question?: string };

const planetThemes: Record<string, string> = {
  sun: 'confidence and your sense of self', moon: 'your feelings and what helps you feel safe',
  mercury: 'thinking and communication', venus: 'close connections and what matters to you',
  mars: 'energy and taking action', jupiter: 'growth and seeing the bigger picture',
  saturn: 'responsibility and routines', uranus: 'change and doing things your own way',
  neptune: 'imagination and ideals', pluto: 'deep change and personal boundaries',
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
  conjunction: 'brings the two themes together',
  opposition: 'puts the two themes in tension and can bring balance into focus',
  trine: 'shows an easier connection between the two themes',
  square: 'points to tension that may call for a new approach',
  sextile: 'can point to a chance for the themes to support each other',
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
      body: `The Moon changed signs during your birth date: ${uncertainMoonRange.join(' or ')}. Without a birth time, we cannot tell which sign applies, so this chart leaves it open. In astrology, the Moon is linked with feelings and what helps you feel safe.`,
      question: 'What helps you feel settled when things change?',
    };
  }
  const theme = planetThemes[planet.toLowerCase()];
  const tone = signTones[sign.toLowerCase()];
  const placement = `${name} is in ${cap(sign)}${house ? `, House ${house} (${houseThemes[house] ?? 'part of everyday life'})` : ''}.`;
  return {
    title: `${name} in ${cap(sign)}${house ? ` · House ${house}` : ''}`,
    body: `In astrology, ${name.toLowerCase()} is linked with ${theme ?? 'a personal theme'}. ${placement}${tone ? ` Astrologers often describe ${cap(sign)} as ${tone}.` : ''} Use this as a way to reflect, not as a label.`,
    question: `Where do you notice ${theme ?? 'this theme'} in your life?`,
  };
}

const houseThemes: Record<number, string> = {
  1: 'self and first impressions', 2: 'resources and personal values', 3: 'learning and everyday communication',
  4: 'home and roots', 5: 'creativity and play', 6: 'routines and practical care',
  7: 'close partnerships', 8: 'shared resources and change', 9: 'learning and wider horizons',
  10: 'work and public life', 11: 'friendships and shared aims', 12: 'rest and inner life',
};

export function explainAspect(first: string, second: string, type: string): ChartExplanation {
  const firstTheme = planetThemes[first.toLowerCase()] ?? `${first.toLowerCase()} themes`;
  const secondTheme = planetThemes[second.toLowerCase()] ?? `${second.toLowerCase()} themes`;
  const link = aspectMeanings[type.toLowerCase()] ?? 'describes a relationship between the two themes';
  return {
    title: `${cap(first)} ${type.toLowerCase()} ${cap(second)}`,
    body: `In astrology, this aspect ${link}: ${firstTheme} and ${secondTheme}. You may experience these themes in your own way. Use this as a prompt to reflect, not a fixed answer.`,
    question: `How do ${firstTheme} and ${secondTheme} show up for you?`,
  };
}

export function explainAngle(label: string, sign: string): ChartExplanation {
  const isAscendant = label.toLowerCase() === 'ascendant';
  return {
    title: `${label} in ${cap(sign)}`,
    body: `In astrology, the ${label} is linked with ${isAscendant ? 'how you approach new situations' : 'your long-term direction, work, and public life'}. ${cap(sign)} is often described as doing this ${signTones[sign.toLowerCase()] ?? 'in its own way'}. Treat it as a prompt, not a fixed description.`,
    question: `Does this way of approaching ${isAscendant ? 'new situations' : 'your direction'} feel familiar?`,
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
  const colors = useColors();
  const c = colors.cosmos;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, loaded, privacy, setConsent, canCalculate } = useProfile();
  const chart = useNatalCalculation();
  const [disambiguation, setDisambiguation] = useState<Disambiguation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
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

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: c.background }, Platform.OS === 'web' && { paddingTop: Math.max(insets.top, 67) }]}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <View style={styles.brandRow}>
            <View style={[styles.brandMark, { borderColor: c.secondary }]}>
              <Feather name="target" size={16} color={c.secondary} />
            </View>
            <Text style={[styles.brandName, { color: c.foreground }]}>SOUL COMPASS</Text>
            <View style={[styles.brandDivider, { backgroundColor: c.divider }]} />
            <Text style={[styles.brandCaption, { color: c.mutedForeground }]}>NATAL CHART</Text>
            <SettingsButton />
          </View>

          <View style={styles.intro}>
            <View style={styles.eyebrowRow}>
              <View style={[styles.eyebrowLine, { backgroundColor: c.secondary }]} />
              <Text style={[styles.eyebrow, { color: c.secondary }]}>NATAL CHART</Text>
            </View>
            <Text style={[styles.title, { color: c.foreground }]}>The Sky of the Day{'\n'}You Arrived</Text>
            {profile ? (
              <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
                {profile.birthDate}
                {profile.birthTime.status === 'known' ? ` at ${profile.birthTime.localTime}` : ', time unknown'}
                {` \u00B7 ${profile.birthPlace.city}, ${profile.birthPlace.country}`}
                {'\n'}Tropical zodiac, Placidus houses.
              </Text>
            ) : null}
          </View>

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
                showDetails={showDetails}
                toggle={() => setShowDetails((v) => !v)}
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
                {activeExplanation.question ? (
                  <Text style={[styles.explanationQuestion, { color: c.foreground }]}>{activeExplanation.question}</Text>
                ) : null}
              </ScrollView>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function ChartView({ c, data, timeKnown, disambiguation, showDetails, toggle, onExplain }: {
  c: Palette; data: NatalChartResponse; timeKnown: boolean; disambiguation: Disambiguation | null; showDetails: boolean; toggle: () => void; onExplain: (explanation: ChartExplanation) => void;
}) {
  const houses = useMemo(() => new Map(data.planetaryHouses.map((h) => [h.planet, h.house])), [data.planetaryHouses]);
  const aspects = data.aspects.filter((a) => MAJOR.has(a.type.toLowerCase()));
  const angles = timeKnown ? data.angles : null;

  return (
    <View style={{ gap: 18 }}>
      <Guide c={c} timeKnown={timeKnown} />
      <Pressable onPress={toggle} style={[styles.detailsToggle, { borderColor: c.border }]} testID="natal-details-toggle">
        <Text style={[styles.label, { color: c.secondary }]}>{showDetails ? 'HIDE TECHNICAL DETAILS' : 'SHOW TECHNICAL DETAILS'}</Text>
        <Feather name={showDetails ? 'chevron-up' : 'chevron-down'} size={14} color={c.secondary} />
      </Pressable>
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
          const house = timeKnown ? houses.get(p.planet) : undefined;
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
            accessibilityHint="Opens a short, reflective explanation"
            testID={`natal-aspect-${a.first.toLowerCase()}-${a.type.toLowerCase()}-${a.second.toLowerCase()}`}
            onPress={() => onExplain(explainAspect(a.first, a.second, a.type))}
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

      {showDetails ? (
        <Card c={c}>
          <Label c={c} icon="sliders" text="LATITUDE AND DAILY SPEED" />
          {data.planets.map((p) => (
            <View key={p.planet} style={styles.detailRow}>
              <Text style={[styles.rowMeta, { color: c.foreground, flex: 1 }]}>{cap(p.planet)}</Text>
              <Text style={[styles.mono, { color: c.mutedForeground }]}>
                lon {p.longitude.toFixed(2)}°  lat {p.latitude.toFixed(2)}°  {p.speedDegreesPerDay.toFixed(3)}°/d
              </Text>
            </View>
          ))}
          {timeKnown && data.houseCusps.length > 0 ? (
            <>
              <View style={[styles.rule, { backgroundColor: c.border }]} />
              <Label c={c} icon="grid" text="HOUSE CUSPS" />
              {data.houseCusps.map((h) => (
                <View key={h.house} style={styles.detailRow}>
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
      ) : null}
    </View>
  );
}

function Guide({ c, timeKnown }: { c: Palette; timeKnown: boolean }) {
  const [open, setOpen] = useState(false);
  const items: [string, string][] = [
    ['Planets', 'Kinds of needs or drives, such as communication or connection.'],
    ['Signs', 'The style or expression those needs may take.'],
    ['Houses', timeKnown ? 'Life areas where a theme may show up, based on birth time and place.' : 'Life areas based on exact birth time; they are left out of this chart.'],
    ['Angles', timeKnown ? 'The Ascendant relates to first impressions; the Midheaven is often linked with public or working direction.' : 'The Ascendant and Midheaven depend on birth time, so they are not shown here.'],
    ['Aspects', 'How two planetary themes interact. Orb tells how close the angle is to exact.'],
    ['Retrograde', 'A planet can appear to move backward from our viewpoint. In astrology, this is a symbolic detail, not a problem to fix.'],
  ];
  return (
    <Card c={c}>
      <Pressable testID="natal-guide-toggle" accessibilityRole="button" onPress={() => setOpen((v) => !v)} style={styles.guideHead}>
        <Label c={c} icon="book-open" text="HOW TO READ THIS" />
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color={c.secondary} />
      </Pressable>
      {open ? (
        <>
          <Text style={[styles.body, { color: c.foreground }]}>
            A simple starting point: planet = what, sign = how, house = where. Tap an entry to explore its symbolism.
          </Text>
          {items.map(([k, v]) => (
            <Text key={k} style={[styles.body, { color: c.mutedForeground }]}>
              <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold' }}>{k}. </Text>{v}
            </Text>
          ))}
          <Text style={[styles.guideNote, { color: c.mutedForeground }]}>
            Astrology is a traditional symbolic practice, not evidence or a verdict. Treat this as a reflection prompt and keep only what feels useful.
          </Text>
        </>
      ) : null}
    </Card>
  );
}
function Card({ c, children }: { c: Palette; children: React.ReactNode }) {
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>{children}</View>;
}
function Label({ c, icon, text }: { c: Palette; icon: React.ComponentProps<typeof Feather>['name']; text: string }) {
  return (
    <View style={styles.labelRow}>
      <Feather name={icon} size={14} color={c.secondary} />
      <Text style={[styles.label, { color: c.secondary }]}>{text}</Text>
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
  scrollContent: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 14, paddingBottom: 34 },
  page: { width: '100%', maxWidth: 480 },
  brandRow: { alignItems: 'center', flexDirection: 'row' },
  brandMark: { alignItems: 'center', borderRadius: 16, borderWidth: 1, height: 32, justifyContent: 'center', marginRight: 10, width: 32 },
  brandName: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.7 },
  brandDivider: { height: 13, marginHorizontal: 10, width: 1 },
  brandCaption: { fontFamily: 'Inter_400Regular', fontSize: 8, letterSpacing: 1.3 },
  intro: { marginTop: 46, marginBottom: 28 },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 16 },
  eyebrowLine: { height: 1, marginRight: 9, width: 22 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.9 },
  title: { fontFamily: 'Georgia', fontSize: 38, fontWeight: '400', letterSpacing: -1.1, lineHeight: 45 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 21, marginTop: 14 },
  card: { borderRadius: 26, borderWidth: 1, paddingHorizontal: 22, paddingVertical: 20 },
  cardTitle: { fontFamily: 'Georgia', fontSize: 22, marginBottom: 8 },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 12 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.5 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, marginBottom: 8 },
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
  guideHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  detailsToggle: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 12 },
  guideNote: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 19, marginTop: 3 },
  explanationSafeArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 20 },
  explanationScrim: { ...StyleSheet.absoluteFill, opacity: 0.76 },
  explanationCard: { alignSelf: 'center', width: '100%', maxWidth: 440, maxHeight: '88%', borderWidth: 1, borderRadius: 24, paddingHorizontal: 22, paddingTop: 18 },
  explanationHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  explanationTitle: { flex: 1, fontFamily: 'Georgia', fontSize: 24, lineHeight: 31, paddingTop: 8 },
  explanationClose: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  explanationBody: { paddingTop: 10, paddingBottom: 24 },
  explanationQuestion: { fontFamily: 'Georgia', fontSize: 18, lineHeight: 26, marginTop: 6 },
});
