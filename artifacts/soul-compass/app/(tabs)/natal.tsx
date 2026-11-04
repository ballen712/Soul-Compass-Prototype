import { Feather } from '@expo/vector-icons';
import { useNatalCalculation } from '@/hooks/useNatalCalculation';
import type { NatalChartResponse } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsButton } from '@/components/SettingsButton';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/profile/ProfileContext';

type Disambiguation = 'earlier' | 'later';
type Palette = ReturnType<typeof useColors>['cosmos'];

const MAJOR = new Set(['conjunction', 'opposition', 'trine', 'square', 'sextile']);
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

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
  const [declined, setDeclined] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  useEffect(() => { setDisambiguation(null); }, [profile]);
  const submit = (choice: Disambiguation | null) => { void chart.calculate(choice); };
  async function agree() {
    if (consentBusy) return;
    setConsentBusy(true); setConsentError(null);
    try { await setConsent(true); setDeclined(false); }
    catch (error) { setConsentError(error instanceof Error ? error.message : 'Permission could not be saved.'); }
    finally { setConsentBusy(false); }
  }

  const choose = (choice: Disambiguation) => {
    setDisambiguation(choice);
    submit(choice);
  };

  const msg = chart.isError ? errorMessage(chart.error) : '';
  const twice = /occurred twice/i.test(msg);
  const data = chart.data;
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
            <Text style={[styles.brandCaption, { color: c.mutedForeground }]}>BIRTH CHART</Text>
            <SettingsButton />
          </View>

          <View style={styles.intro}>
            <View style={styles.eyebrowRow}>
              <View style={[styles.eyebrowLine, { backgroundColor: c.secondary }]} />
              <Text style={[styles.eyebrow, { color: c.secondary }]}>YOUR NATAL CHART</Text>
            </View>
            <Text style={[styles.title, { color: c.foreground }]}>The sky on the{'\n'}day you arrived.</Text>
            {profile ? (
              <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
                {profile.birthDate}
                {profile.birthTime.status === 'known' ? ` at ${profile.birthTime.localTime}` : ', time unknown'}
                {` \u00B7 ${profile.birthPlace.city}, ${profile.birthPlace.country}`}
                {'\n'}Tropical zodiac, Placidus houses.
              </Text>
            ) : null}
          </View>

          {!loaded || (profile && chart.isPending && canCalculate()) ? (
            <Skeleton c={c} />
          ) : !profile ? (
            <Card c={c}>
              <Text style={[styles.cardTitle, { color: c.foreground }]}>No birth details yet</Text>
              <Text style={[styles.body, { color: c.mutedForeground }]}>Add your birth date, time and place to calculate a chart.</Text>
              <Btn c={c} label="Open settings" icon="settings" onPress={() => router.push('/settings')} />
            </Card>
          ) : !privacy.astrologyApiConsent || !canCalculate() ? (
            <Card c={c}>
              <Text style={[styles.cardTitle, { color: c.foreground }]}>Your permission comes first</Text>
              <Text style={[styles.body, { color: c.foreground }]}>
                To calculate your natal chart, Soul Compass sends your birth date, birth time when known,
                birthplace coordinates and timezone to the Soul Compass calculation server.
                Your profile, residence, language, intentions and crystal collection stay stored on this device
                and are not included in this request. Internet access is required.
                You can withdraw permission at any time in Settings. This cannot undo a request already sent.
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
                  <Btn c={c} label="I Agree" onPress={() => void agree()} />
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
                    Clocks were turned back that night, so {profile.birthTime.status === 'known' ? profile.birthTime.localTime : 'this time'} happened twice. Choose which occurrence to use for this chart. Your profile is not changed.
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
          ) : data ? (
            <ChartView c={c} data={data} timeKnown={timeKnown} disambiguation={disambiguation} showDetails={showDetails} toggle={() => setShowDetails((v) => !v)} onClear={() => { setDisambiguation(null); submit(null); }} />
          ) : (
            <Card c={c}>
              <Text style={[styles.cardTitle, { color: c.foreground }]}>Ready when you are</Text>
              <Text style={[styles.body, { color: c.foreground }]}>Permission is saved. Birth details are sent only when you request a chart, never automatically on opening this screen.</Text>
              <Btn c={c} label="Calculate chart" onPress={() => submit(null)} />
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChartView({ c, data, timeKnown, disambiguation, showDetails, toggle, onClear }: {
  c: Palette; data: NatalChartResponse; timeKnown: boolean; disambiguation: Disambiguation | null; showDetails: boolean; toggle: () => void; onClear: () => void;
}) {
  const houses = useMemo(() => new Map(data.planetaryHouses.map((h) => [h.planet, h.house])), [data.planetaryHouses]);
  const aspects = data.aspects.filter((a) => MAJOR.has(a.type.toLowerCase()));
  const angles = timeKnown ? data.angles : null;

  return (
    <View style={{ gap: 18 }}>
      <Guide c={c} timeKnown={timeKnown} />
      {disambiguation ? (
        <Card c={c}>
          <Text style={[styles.body, { color: c.mutedForeground }]}>
            Using the {disambiguation} occurrence of your birth time for this chart only.
          </Text>
          <Pressable onPress={onClear}><Text style={[styles.link, { color: c.secondary }]}>Reset choice</Text></Pressable>
        </Card>
      ) : null}

      {!timeKnown ? (
        <Card c={c}>
          <Label c={c} icon="clock" text="BIRTH TIME UNKNOWN" />
          <Text style={[styles.body, { color: c.mutedForeground }]}>
            Positions are calculated for 12:00 noon local time as a reference. The Ascendant, Midheaven and houses depend on the exact time, so they are left out.
          </Text>
          {data.moonSignRange.length > 1 ? (
            <Text style={[styles.body, { color: c.foreground }]}>
              The Moon moves quickly. During your birth date it was in {data.moonSignRange.join(' or ')}, so your Moon sign is uncertain.
            </Text>
          ) : null}
        </Card>
      ) : null}

      {angles ? (
        <View style={styles.angleRow}>
          <AngleTile c={c} label="ASCENDANT" hint="Rising sign" value={lonLabel(angles.ascendant)} />
          <AngleTile c={c} label="MIDHEAVEN" hint="MC" value={lonLabel(angles.midheaven)} />
        </View>
      ) : null}

      <Card c={c}>
        <Label c={c} icon="disc" text="PLANETS" />
        {data.planets.map((p, i) => {
          const house = timeKnown ? houses.get(p.planet) : undefined;
          const uncertainMoon = !timeKnown && p.planet.toLowerCase() === 'moon' && data.moonSignRange.length > 1;
          return (
            <View key={p.planet} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
              <Text style={[styles.rowName, { color: c.foreground }]}>{cap(p.planet)}</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[styles.rowValue, { color: c.foreground }]}>
                  {uncertainMoon ? data.moonSignRange.join(' / ') : `${dms(p.degreeInSign)} ${cap(p.sign)}`}
                </Text>
                <Text style={[styles.rowMeta, { color: c.mutedForeground }]}>
                  {[house ? `House ${house}` : null, p.retrograde ? 'Retrograde' : null, uncertainMoon ? `noon: ${dms(p.degreeInSign)} ${cap(p.sign)}` : null].filter(Boolean).join(' \u00B7 ') || '\u2014'}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>

      <Card c={c}>
        <Label c={c} icon="git-merge" text="MAJOR ASPECTS" />
        {aspects.length === 0 ? (
          <Text style={[styles.body, { color: c.mutedForeground }]}>No major aspects within orb.</Text>
        ) : aspects.map((a, i) => (
          <View key={`${a.first}-${a.second}-${a.type}`} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
            <Text style={[styles.rowName, { color: c.foreground, flex: 1 }]}>{cap(a.first)} {a.type.toLowerCase()} {cap(a.second)}</Text>
            <Text style={[styles.rowMeta, { color: c.mutedForeground }]}>
              orb {a.orb.toFixed(1)}°{a.exact ? ' \u00B7 exact' : ''}{a.applying === null ? '' : a.applying ? ' \u00B7 applying' : ' \u00B7 separating'}
            </Text>
          </View>
        ))}
      </Card>

      {data.warnings.length > 0 ? (
        <Card c={c}>
          <Label c={c} icon="info" text="NOTES FROM THE CALCULATION" />
          {data.warnings.map((w) => <Text key={w} style={[styles.body, { color: c.mutedForeground }]}>{w}</Text>)}
        </Card>
      ) : null}

      <Pressable onPress={toggle} style={[styles.detailsToggle, { borderColor: c.border }]} testID="natal-details-toggle">
        <Text style={[styles.label, { color: c.secondary }]}>{showDetails ? 'HIDE TECHNICAL DETAILS' : 'SHOW TECHNICAL DETAILS'}</Text>
        <Feather name={showDetails ? 'chevron-up' : 'chevron-down'} size={14} color={c.secondary} />
      </Pressable>

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
    ['Planets', 'The bodies listed below and where they were at your birth.'],
    ['Signs', 'Twelve 30\u00B0 slices of the zodiac. A position like 14\u00B0 Leo means 14 degrees into Leo.'],
    ['Houses', timeKnown ? 'Twelve divisions based on your birth time and place, showing where each planet fell locally.' : 'Need an exact birth time, so they are not shown for your chart.'],
    ['Aspects', 'Notable angles between two planets. Orb is how far from exact the angle is.'],
  ];
  return (
    <Card c={c}>
      <Pressable testID="natal-guide-toggle" accessibilityRole="button" onPress={() => setOpen((v) => !v)} style={styles.guideHead}>
        <Label c={c} icon="book-open" text="HOW TO READ THIS" />
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color={c.secondary} />
      </Pressable>
      {open ? (
        <>
          {items.map(([k, v]) => (
            <Text key={k} style={[styles.body, { color: c.mutedForeground }]}>
              <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold' }}>{k}. </Text>{v}
            </Text>
          ))}
          <Text style={[styles.body, { color: c.mutedForeground }]}>
            The positions are astronomical calculations. What they mean comes from astrological tradition and symbolism, not scientific evidence; use them as prompts for reflection.
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
function AngleTile({ c, label, hint, value }: { c: Palette; label: string; hint: string; value: string }) {
  return (
    <View style={[styles.card, styles.angleTile, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.label, { color: c.secondary }]}>{label}</Text>
      <Text style={[styles.angleValue, { color: c.foreground }]}>{value}</Text>
      <Text style={[styles.rowMeta, { color: c.mutedForeground }]}>{hint}</Text>
    </View>
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
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  row: { alignItems: 'center', flexDirection: 'row', paddingVertical: 11, gap: 12 },
  rowName: { fontFamily: 'Georgia', fontSize: 16 },
  rowValue: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  rowMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 10 },
  detailRow: { alignItems: 'center', flexDirection: 'row', paddingVertical: 5 },
  rule: { height: 1, marginVertical: 16 },
  angleRow: { flexDirection: 'row', gap: 12 },
  angleTile: { flex: 1, paddingVertical: 18 },
  angleValue: { fontFamily: 'Georgia', fontSize: 19, marginTop: 10 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  btn: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 9 },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  guideHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  detailsToggle: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 12 },
});
