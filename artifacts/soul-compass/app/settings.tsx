import React, { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileForm } from '@/components/ProfileForm';
import { useProfile } from '@/profile/ProfileContext';
import type { UserProfile } from '@/profile/profile';
import { alternativeCrystals, primaryCrystal } from '@/constants/content';

const APP_VERSION = '1.0.0';
const slugOf = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-');
const CATALOG = [primaryCrystal, ...alternativeCrystals].map((c) => ({ id: slugOf(c.name), name: c.name }));
const INTENTIONS = ['Rest', 'Focus', 'Reflection', 'Courage', 'Connection', 'Change'];
const LANGUAGES = [{ code: 'en', label: 'English' }, { code: 'es', label: 'Spanish' }, { code: 'fr', label: 'French' }, { code: 'de', label: 'German' }, { code: 'pt', label: 'Portuguese' }];

type Tab = 'profile' | 'preferences' | 'privacy' | 'about';

function Chip({ label, active, onPress, testID }: { label: string; active: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="switch" accessibilityState={{ checked: active }} onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description ? <Text style={styles.body}>{description}</Text> : null}
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile, preferences, savePreferences, toggleCrystal, privacy, setConsent } = useProfile();
  const [tab, setTab] = useState<Tab>('profile');
  const [reviewingConsent, setReviewingConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [customIntentions, setCustomIntentions] = useState(preferences.crystalPreferences.intentions.join(', '));

  if (!profile) return null;

  async function run(action: () => Promise<void>, ok: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true); setMessage(null);
    try { await action(); setMessage(ok); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'That change could not be saved on this device. Please try again.'); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function submit(nextProfile: UserProfile) {
    await saveProfile(nextProfile);
    setMessage('Birth details saved on this device.');
  }

  const toggleIntention = (i: string) => {
    const cur = preferences.crystalPreferences.intentions;
    const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i];
    void run(() => savePreferences({ ...preferences, crystalPreferences: { ...preferences.crystalPreferences, intentions: next } }), 'Intentions saved.');
  };
  const toggleHidden = (id: string) => {
    const cur = preferences.crystalPreferences.hiddenCrystals;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    void run(() => savePreferences({ ...preferences, crystalPreferences: { ...preferences.crystalPreferences, hiddenCrystals: next } }), 'Hidden stones updated.');
  };

  const padBottom = { paddingBottom: Math.max(insets.bottom, 34) + 24 };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, Platform.OS === 'web' && { paddingTop: 67 }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={10}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.heading}>Settings</Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        {(['profile', 'preferences', 'privacy', 'about'] as Tab[]).map((t) => (
          <Chip key={t} testID={`settings-tab-${t}`} label={t[0].toUpperCase() + t.slice(1)} active={tab === t} onPress={() => { setTab(t); setMessage(null); }} />
        ))}
      </ScrollView>

      {tab === 'profile' ? (
        <>
          {message ? <Text accessibilityRole="alert" style={[styles.message, { paddingHorizontal: 24 }]}>{message}</Text> : null}
          <ProfileForm initialProfile={profile} submitLabel="Save changes" onSubmit={submit} />
        </>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, padBottom]}>
          {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}

          {tab === 'preferences' ? (
            <>
              <Section title="Language" description="Soul Compass is currently written in English only. This preference is stored for the future and does not translate the app.">
                <View style={styles.chips}>
                  {LANGUAGES.map((l) => (
                    <Chip key={l.code} label={l.label} active={preferences.language === l.code}
                      onPress={() => void run(() => savePreferences({ ...preferences, language: l.code }), 'Language saved.')} />
                  ))}
                </View>
              </Section>
              <Section title="Intentions" description="Words you want to keep in mind. They are saved for you; they do not change which stone is shown.">
                <View style={styles.chips}>
                  {Array.from(new Set([...INTENTIONS, ...preferences.crystalPreferences.intentions])).map((i) => (
                    <Chip key={i} label={i} active={preferences.crystalPreferences.intentions.includes(i)} onPress={() => toggleIntention(i)} />
                  ))}
                </View>
                <TextInput accessibilityLabel="Custom intentions, comma separated" value={customIntentions} onChangeText={setCustomIntentions}
                  placeholder="calm, clarity, rest" style={styles.body} editable={!busy} />
                <Pressable accessibilityRole="button" disabled={busy} onPress={() => void run(() => savePreferences({
                  ...preferences, crystalPreferences: { ...preferences.crystalPreferences,
                    intentions: Array.from(new Set(customIntentions.split(',').map(value => value.trim()).filter(Boolean))) },
                }), 'Intentions saved.')}><Text style={styles.back}>Save custom intentions</Text></Pressable>
              </Section>
              <Section title="Your collection" description="Stones you own or want to keep track of.">
                {CATALOG.map((c) => {
                  const owned = preferences.crystalCollection.includes(c.id);
                  return (
                    <View key={c.id} style={styles.row}>
                      <Text style={styles.rowLabel}>{c.name}</Text>
                      <Pressable testID={`settings-collect-${c.id}`} accessibilityRole="button" disabled={busy}
                        onPress={() => void run(() => toggleCrystal(c.id), owned ? `${c.name} removed.` : `${c.name} added.`)}
                        style={[styles.smallButton, owned && styles.smallButtonActive]}>
                        <Text style={[styles.smallButtonText, owned && styles.smallButtonTextActive]}>{owned ? 'Remove' : 'Add'}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </Section>
              <Section title="Hidden stones" description="Hidden stones will not appear on the Crystals screen. Show them again here at any time.">
                {CATALOG.map((c) => {
                  const hidden = preferences.crystalPreferences.hiddenCrystals.includes(c.id);
                  return (
                    <View key={c.id} style={styles.row}>
                      <Text style={styles.rowLabel}>{c.name}</Text>
                      <Pressable testID={`settings-hide-${c.id}`} accessibilityRole="button" disabled={busy} onPress={() => toggleHidden(c.id)}
                        style={[styles.smallButton, hidden && styles.smallButtonActive]}>
                        <Text style={[styles.smallButtonText, hidden && styles.smallButtonTextActive]}>{hidden ? 'Restore' : 'Hide'}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </Section>
            </>
          ) : null}

          {tab === 'privacy' ? (
            <>
              <Section title="Chart calculations">
                <Text style={styles.body}>
                  To calculate your chart, Soul Compass sends your birth date, birth time if known, and your birthplace coordinates and time zone to the Soul Compass calculation server. This happens only after you agree.
                </Text>
                <Text style={styles.body}>
                  Your profile, preferences, and crystal collection stay on this device. Server calculations need an internet connection. You can withdraw consent at any time.
                </Text>
                <Text style={styles.status}>
                  Status: {privacy.astrologyApiConsent ? 'Allowed' : privacy.revokedAt ? 'Withdrawn' : 'Not allowed'}
                  {privacy.astrologyApiConsent && privacy.consentTimestamp ? ` since ${new Date(privacy.consentTimestamp).toLocaleDateString()}` : ''}
                  {privacy.consentVersion ? ` (terms ${privacy.consentVersion})` : ''}
                </Text>
                {privacy.astrologyApiConsent ? (
                  <Pressable testID="consent-revoke" accessibilityRole="button" disabled={busy}
                    onPress={() => void run(() => setConsent(false), 'Consent withdrawn. Chart calculations are off.')} style={styles.secondaryButton}>
                    <Text style={styles.secondaryText}>Withdraw consent</Text>
                  </Pressable>
                ) : reviewingConsent ? (
                  <View style={styles.consentBox}>
                    <Text style={styles.body}>
                      By choosing I Agree, you allow Soul Compass to send the birth details listed above to its calculation server to produce your chart. Nothing else from your profile is sent.
                    </Text>
                    <View style={styles.buttonRow}>
                      <Pressable testID="consent-agree" accessibilityRole="button" disabled={busy}
                        onPress={() => void run(async () => { await setConsent(true); setReviewingConsent(false); }, 'Consent granted.')} style={styles.primaryButton}>
                        <Text style={styles.primaryText}>I Agree</Text>
                      </Pressable>
                      <Pressable testID="consent-not-now" accessibilityRole="button" onPress={() => setReviewingConsent(false)} style={styles.secondaryButton}>
                        <Text style={styles.secondaryText}>Not Now</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable testID="consent-review" accessibilityRole="button" onPress={() => setReviewingConsent(true)} style={styles.secondaryButton}>
                    <Text style={styles.secondaryText}>Review and allow</Text>
                  </Pressable>
                )}
              </Section>
              <Section title="Local storage" description="AsyncStorage is local storage, not encrypted storage. App deletion, device loss or clearing browser storage may cause data loss. There is no app cloud sync or export/import. Device-level backups may include application data." />
            </>
          ) : null}

          {tab === 'about' ? (
            <>
              <Section title="Soul Compass" description={`Version ${APP_VERSION}`} />
              <Section title="Privacy" description="No account. Profile and collection live on this device. Birth details are sent for chart calculation only with your consent, which you can withdraw in Privacy." />
              <Section title="Licenses" description="Astronomical calculations use Astronomy Engine (MIT), not a paid ephemeris. City lookup uses Open-Meteo and GeoNames data (CC BY 4.0 attribution); their free endpoint has non-commercial restrictions. Built with Expo and React Native (MIT). Feather icons (MIT); Inter (SIL Open Font License 1.1). Readings and stone notes are for reflection, not medical or scientific advice." />
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F1E8' },
  header: { height: 52, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#58664F', fontSize: 14 },
  heading: { color: '#22241F', fontSize: 16, fontWeight: '600' },
  spacer: { width: 34 },
  tabsScroll: { flexGrow: 0 },
  tabs: { paddingHorizontal: 24, gap: 8, paddingBottom: 8 },
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 22 },
  section: { gap: 10 },
  sectionTitle: { color: '#30352D', fontSize: 18, fontWeight: '600' },
  body: { color: '#77756F', fontSize: 13, lineHeight: 19 },
  status: { color: '#45473F', fontSize: 13, fontWeight: '600' },
  message: { color: '#58664F', fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#D9D3C7', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFFEFB' },
  chipActive: { backgroundColor: '#58664F', borderColor: '#58664F' },
  chipText: { color: '#45473F', fontSize: 13 },
  chipTextActive: { color: '#F5F1E8' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#DED9CE' },
  rowLabel: { color: '#25251F', fontSize: 15 },
  smallButton: { borderWidth: 1, borderColor: '#D9D3C7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, minWidth: 76, alignItems: 'center' },
  smallButtonActive: { backgroundColor: '#58664F', borderColor: '#58664F' },
  smallButtonText: { color: '#58664F', fontSize: 13, fontWeight: '600' },
  smallButtonTextActive: { color: '#F5F1E8' },
  consentBox: { gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#D9D3C7', backgroundColor: '#FBF8F1' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  primaryButton: { minHeight: 46, borderRadius: 12, backgroundColor: '#25344D', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryText: { color: '#F5F1E8', fontSize: 14, fontWeight: '600' },
  secondaryButton: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: '#D9D3C7', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, alignSelf: 'flex-start' },
  secondaryText: { color: '#58664F', fontSize: 14, fontWeight: '600' },
});
