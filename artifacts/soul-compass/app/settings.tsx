import React, { useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileForm } from '@/components/ProfileForm';
import { useProfile } from '@/profile/ProfileContext';
import type { UserProfile } from '@/profile/profile';
import { alternativeCrystals, samplePrimaryCrystal } from '@/constants/content';
import { PRODUCT } from '@/constants/product';

const APP_VERSION = '1.0.0';
const slugOf = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-');
const CATALOG = [samplePrimaryCrystal, ...alternativeCrystals].map((c) => ({ id: slugOf(c.name), name: c.name }));
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
              <Section title="Future language preference" description="English is the only language available right now. Choosing another option only records your preference for possible future versions. It does not translate any screen today.">
                <View style={styles.chips}>
                  {[...LANGUAGES, ...(LANGUAGES.some((l) => l.code === preferences.language) || !preferences.language ? [] : [{ code: preferences.language, label: `Saved: ${preferences.language}` }])].map((l) => (
                    <Chip key={l.code} label={l.label} active={preferences.language === l.code}
                      onPress={() => void run(() => savePreferences({ ...preferences, language: l.code }), 'Future language preference saved. The app stays in English.')} />
                  ))}
                </View>
              </Section>
              <Section title="Intentions" description="Recognized intentions help rank a stone from the full catalog, owned or not. With a daily chart available, its leading theme also contributes. Rest, Focus, Reflection, Courage, Connection, Change, calm, clarity, stillness, curiosity and intuition are recognized; other words stay saved without an automatic match. This is reflection, not a prediction or health advice.">
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
              <Section title="Your collection" description="Stones you own or want to keep track of. Your collection does not limit which stone can be suggested.">
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
              <Section title="What runs on this device" description="Daily reflections and crystal suggestions are calculated on this device with Astronomy Engine, using your saved profile, current residence and intentions. Nothing from these is sent anywhere." />
              <Section title="What uses the network" description="City search sends only your typed query through the Soul Compass server to Geoapify, not your saved birth profile. Geoapify receives normal server connection metadata; we do not forward your device IP or headers. The current-sky snapshot sends only the current time to the Soul Compass server. Search runs only when you tap Search." />
              <Section title="Full natal chart (server)">
                <Text style={styles.body}>
                  The full natal chart is calculated on the Soul Compass server. It is only requested after you allow it here or on the Natal tab and then tap Calculate; opening a screen never sends it. The request contains your birth date, birth time if known, and your birthplace coordinates and time zone. Your name, residence, language, intentions and collection are not included.
                </Text>
                <Text style={styles.body}>
                  You can withdraw permission at any time. Withdrawing stops future requests but cannot undo a request already sent. This calculation needs an internet connection.
                </Text>
                <Text style={styles.status}>
                  Status: {privacy.astrologyApiConsent ? 'Allowed' : privacy.revokedAt ? 'Withdrawn' : 'Not allowed'}
                  {privacy.astrologyApiConsent && privacy.consentTimestamp ? ` since ${new Date(privacy.consentTimestamp).toLocaleDateString()}` : ''}
                  {privacy.consentVersion ? ` (terms ${privacy.consentVersion})` : ''}
                </Text>
                {privacy.astrologyApiConsent ? (
                  <Pressable testID="consent-revoke" accessibilityRole="button" disabled={busy}
                    onPress={() => void run(() => setConsent(false), 'Permission withdrawn. No further natal chart requests will be sent.')} style={styles.secondaryButton}>
                    <Text style={styles.secondaryText}>Withdraw consent</Text>
                  </Pressable>
                ) : reviewingConsent ? (
                  <View style={styles.consentBox}>
                    <Text style={styles.body}>
                      By choosing I Agree, you allow Soul Compass to send the birth details listed above to its calculation server when you tap Calculate on the Natal tab. Nothing else from your profile is sent.
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
              <Section title="Local storage" description="Your profile, preferences and collection are kept in this app's local storage, which is not encrypted. There is no account, cloud sync, or export. Deleting the app, losing the device or clearing browser data can erase it permanently. Your operating system's device backups may include this app's data." />
            </>
          ) : null}

          {tab === 'about' ? (
            <>
              <Section title="Support" description={PRODUCT.supportEmail}>
                <Text style={styles.body}>Please do not email birth details or private profile data. The app never attaches them automatically.</Text>
                <Pressable accessibilityRole="link" onPress={() => void run(async () => {
                  await Linking.openURL(`mailto:${PRODUCT.supportEmail}?subject=Soul%20Compass%20support`);
                }, 'Email draft opened. No profile data was attached.')} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Contact support</Text>
                </Pressable>
              </Section>
              <Section title="Soul Compass" description={`Version ${APP_VERSION}`} />
              <Section title="Privacy" description="No account. Profile and collection are stored on this device. Daily reflections are calculated on-device. Birth details go to the server only for a natal chart you request after giving permission, which you can withdraw in Privacy." />
              <Section title="Licenses" description="Astronomical calculations use Astronomy Engine (MIT), not a paid ephemeris. City lookup is powered by Geoapify with © OpenStreetMap contributors; attribution and provider privacy links appear beside each city search. The Free plan permits commercial use within its credits, request-rate and feature limits. Built with Expo and React Native (MIT). Feather icons (MIT); Inter (SIL Open Font License 1.1). Readings and stone notes draw on traditional symbolism for reflection; they are not medical or scientific advice. The app is in English only." />
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
