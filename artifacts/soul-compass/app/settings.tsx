import React, { useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileForm } from '@/components/ProfileForm';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useProfile } from '@/profile/ProfileContext';
import { CONSENT_VERSION } from '@/profile/local';
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
  const [tab, setTab] = useState<Tab | null>(null);
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
    setTab(null);
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
  const sections: { key: Tab; label: string; description: string }[] = [
    { key: 'profile', label: 'Profile', description: 'Birth details and places' },
    { key: 'preferences', label: 'Preferences', description: 'Intentions, language and collection' },
    { key: 'privacy', label: 'Privacy', description: 'Permission and local storage' },
    { key: 'about', label: 'About', description: 'Support and provider licenses' },
  ];

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, Platform.OS === 'web' && { paddingTop: 67 }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => {
          if (tab) {
            setTab(null);
            setMessage(null);
          } else if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
        }} hitSlop={10}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.heading}>Settings</Text>
        <View style={styles.spacer} />
      </View>

      {tab === null ? (
        <ScrollView contentContainerStyle={[styles.menuContent, padBottom]} showsVerticalScrollIndicator={false}>
          {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
          <Text style={styles.menuIntro}>A few things you can shape on this device.</Text>
          <View style={styles.menuList}>
            {sections.map((section) => (
              <Pressable
                key={section.key}
                testID={`settings-tab-${section.key}`}
                accessibilityRole="button"
                onPress={() => { setTab(section.key); setMessage(null); }}
                style={styles.menuButton}
              >
                <View style={styles.menuCopy}>
                  <Text style={styles.menuLabel}>{section.label}</Text>
                  <Text style={styles.menuDescription}>{section.description}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : tab === 'profile' ? (
        <>
          <ProfileForm initialProfile={profile} submitLabel="Save Changes" onSubmit={submit} />
        </>
      ) : (
        <KeyboardAwareScrollViewCompat
          style={styles.scroll}
          bottomOffset={48}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, padBottom]}
        >
          {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}

          {tab === 'preferences' ? (
            <>
               <Section title="Future language preference" description="The app is currently in English. Your choice is saved for a future version; it will not translate screens today.">
                <View style={styles.chips}>
                  {[...LANGUAGES, ...(LANGUAGES.some((l) => l.code === preferences.language) || !preferences.language ? [] : [{ code: preferences.language, label: `Saved: ${preferences.language}` }])].map((l) => (
                    <Chip key={l.code} label={l.label} active={preferences.language === l.code}
                      onPress={() => void run(() => savePreferences({ ...preferences, language: l.code }), 'Future language preference saved. The app stays in English.')} />
                  ))}
                </View>
              </Section>
               <Section title="Intentions" description="Use intentions to help choose a stone that fits what matters to you. You can get suggestions for stones you do not own. A personal daily reading can also affect a suggestion. We recognize Rest, Focus, Reflection, Courage, Connection, Change, calm, clarity, stillness, curiosity, and intuition. Other words are saved but do not change the match. These are reflection prompts, not predictions or health advice.">
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
               <Section title="Your collection" description="Keep track of stones you own or are interested in. Your collection does not limit which stones can be suggested.">
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
               <Section title="Hidden stones" description="Hidden stones stay off the Crystals screen until you restore them here.">
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
              <Section title="What runs on this device" description="Daily readings, simple rituals, and stone suggestions are worked out here using your saved profile, current home, and intentions. This information is not sent anywhere for these features." />
              <Section title="What uses the network" description="When you search for a city, only the words you type go through the Soul Compass server to Geoapify. Your saved birth profile is not sent. Geoapify sees the server’s normal connection details; we do not pass along your device IP address or headers. A search happens only when you tap Search." />
              <Section title="City search protection" description="Our server keeps short-lived counters to protect city search. They do not contain raw IP addresses, search terms, profiles, or birth details. The source hashes change each day, and expired records are removed when another search comes in." />
              <Section title="Full natal chart (server)">
                <Text style={styles.body}>
                  If you agree, Soul Compass sends your birth date, your birth time if you know it, and your birthplace coordinates and time zone to calculate your Natal Chart. It does this the first time, or again if you change your birth details. Your name, current home, language, intentions, and collection are not sent. The chart is saved on this device, so opening the app does not send the same details again.
                </Text>
                <Text style={styles.body}>
                  You can withdraw permission at any time. This stops future requests and cancels or discards an active result when possible, but it cannot undo a request already sent. Your saved chart stays on this device. Requests are not saved for later when you are offline. If a calculation fails, retry it from the message on the Natal Chart screen.
                </Text>
                <Text style={styles.status}>
                  Status: {privacy.astrologyApiConsent ? 'Allowed' : privacy.revokedAt && privacy.consentTimestamp ? 'Withdrawn' : privacy.consentVersion && privacy.consentVersion !== CONSENT_VERSION ? 'Renewal needed' : 'Not allowed'}
                  {privacy.astrologyApiConsent && privacy.consentTimestamp ? ` since ${new Date(privacy.consentTimestamp).toLocaleDateString()}` : ''}
                  {privacy.consentVersion ? ` (terms ${privacy.consentVersion})` : ''}
                </Text>
                {privacy.astrologyApiConsent ? (
                  <Pressable testID="consent-revoke" accessibilityRole="button" disabled={busy}
                    onPress={() => void run(() => setConsent(false), 'Permission withdrawn. No further natal chart requests will be sent.')} style={styles.secondaryButton}>
                    <Text style={styles.secondaryText}>Withdraw consent</Text>
                  </Pressable>
                ) : (
                  <Pressable testID="consent-review" accessibilityRole="button" onPress={() => router.push('/natal')} style={styles.secondaryButton}>
                    <Text style={styles.secondaryText}>Review on Natal Chart</Text>
                  </Pressable>
                )}
              </Section>
              <Section title="Local storage" description="Your profile, preferences, and collection stay in this app on this device. This storage is not encrypted. There is no account, cloud sync, or export. Deleting the app, losing the device, or clearing browser data can erase your information. Your device backup may include app data." />
            </>
          ) : null}

          {tab === 'about' ? (
            <>
              <Section title="Support" description={PRODUCT.supportEmail}>
                <Text style={styles.body}>Please do not email us your birth details or private profile information. The app never attaches them.</Text>
                <Pressable accessibilityRole="link" onPress={() => void run(async () => {
                  await Linking.openURL(`mailto:${PRODUCT.supportEmail}?subject=Soul%20Compass%20support`);
                }, 'Email draft opened. No profile data was attached.')} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Contact support</Text>
                </Pressable>
              </Section>
              <Section title="Soul Compass" description={`Version ${APP_VERSION}`} />
              <Section title="Privacy" description="No account is needed. Your profile, collection, and saved Natal Chart stay on this device. Daily readings and rituals are worked out here. With your permission, birth details are sent to calculate a chart. The same saved chart is not requested again, and you can withdraw permission in Privacy." />
              <Section title="Licenses" description="Astrology calculations use Astronomy Engine (MIT), not a paid ephemeris. City search uses Geoapify and OpenStreetMap data; attribution and provider privacy links appear beside each search. Geoapify’s Free plan allows commercial use within its credit, rate, and feature limits. The app is built with Expo and React Native (MIT). Feather icons are MIT-licensed; Inter uses the SIL Open Font License 1.1. Readings and stone notes use traditional symbolism for reflection, not medical or scientific advice. The app is currently in English." />
            </>
          ) : null}
        </KeyboardAwareScrollViewCompat>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F1E8' },
  scroll: { flex: 1 },
  header: { height: 52, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#58664F', fontSize: 14 },
  heading: { color: '#22241F', fontSize: 16, fontWeight: '600' },
  spacer: { width: 34 },
  menuContent: { paddingHorizontal: 24, paddingTop: 18, gap: 20 },
  menuIntro: { color: '#77756F', fontSize: 14, lineHeight: 20 },
  menuList: { gap: 10 },
  menuButton: { minHeight: 72, borderWidth: 1, borderColor: '#D9D3C7', borderRadius: 16, backgroundColor: '#FFFEFB', paddingHorizontal: 17, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuCopy: { flex: 1, gap: 4 },
  menuLabel: { color: '#30352D', fontSize: 15, fontWeight: '600' },
  menuDescription: { color: '#77756F', fontSize: 12, lineHeight: 16 },
  menuArrow: { color: '#58664F', fontSize: 24, marginLeft: 12 },
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
  secondaryButton: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: '#D9D3C7', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, alignSelf: 'flex-start' },
  secondaryText: { color: '#58664F', fontSize: 14, fontWeight: '600' },
});
