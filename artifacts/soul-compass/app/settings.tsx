import React, { useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileForm, type ProfileFormHandle } from '@/components/ProfileForm';
import { EdgeSwipeBack } from '@/components/EdgeSwipeBack';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useProfile } from '@/profile/ProfileContext';
import { CONSENT_VERSION } from '@/profile/local';
import type { UserProfile } from '@/profile/profile';
import { crystalCatalog } from '@/constants/content';
import { FEELING_OPTIONS } from '@/profile/crystal-guidance';
import { PRODUCT } from '@/constants/product';
import { APP_GUIDE_INTRO } from '@/constants/app-guide';
import { AppGuideCards } from '@/components/AppGuideContent';

const APP_VERSION = '1.0.0';
const slugOf = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const CATALOG = crystalCatalog
  .map((c) => ({ id: slugOf(c.name), name: c.name }))
  .sort((first, second) => first.name.localeCompare(second.name));
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'it', label: 'Italian' },
  { code: 'de', label: 'German' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'ru', label: 'Russian' },
  { code: 'pt', label: 'Portuguese' },
];

type Tab = 'profile' | 'preferences' | 'privacy' | 'about';

function Chip({ label, active, onPress, testID }: { label: string; active: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="switch" accessibilityState={{ checked: active }} onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function FeelingChoice({ option, selected, onPress }: {
  option: (typeof FEELING_OPTIONS)[number];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={`settings-feeling-${option.id}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.feelingChoice, selected && styles.feelingChoiceActive]}
    >
      <View style={styles.feelingCopy}>
        <Text style={[styles.feelingTitle, selected && styles.feelingTitleActive]}>{option.label}</Text>
        <Text style={styles.feelingDescription}>{option.description}</Text>
      </View>
      <View style={[styles.feelingIndicator, selected && styles.feelingIndicatorActive]}>
        {selected ? <View style={styles.feelingDot} /> : null}
      </View>
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
  const profileFormRef = useRef<ProfileFormHandle | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [collectionSearch, setCollectionSearch] = useState('');
  const [hiddenSearch, setHiddenSearch] = useState('');
  const collectionMatches = CATALOG.filter((c) => c.name.toLowerCase().includes(collectionSearch.trim().toLowerCase()));
  const hiddenMatches = CATALOG.filter((c) => c.name.toLowerCase().includes(hiddenSearch.trim().toLowerCase()));

  if (!profile) return null;

  async function run(
    action: () => Promise<void>,
    ok?: string,
    options: { clearMessage?: boolean } = {},
  ) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    if (options.clearMessage !== false) setMessage(null);
    try {
      await action();
      if (ok) setMessage(ok);
    }
    catch (error) { setMessage(error instanceof Error ? error.message : 'That change could not be saved on this device. Please try again.'); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function submit(nextProfile: UserProfile) {
    await saveProfile(nextProfile);
    setTab(null);
    setMessage('Birth details saved on this device.');
  }

  const toggleFeeling = (id: string) => {
    const feeling = preferences.crystalPreferences.feeling === id ? null : id;
    void run(() => savePreferences({
      ...preferences,
      crystalPreferences: { ...preferences.crystalPreferences, feeling },
    }), feeling ? 'Today’s feeling saved. It will guide stone suggestions alongside transits when available.' : 'Today’s feeling cleared.');
  };
  const toggleHidden = (id: string) => {
    const cur = preferences.crystalPreferences.hiddenCrystals;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    void run(() => savePreferences({ ...preferences, crystalPreferences: { ...preferences.crystalPreferences, hiddenCrystals: next } }), 'Hidden stones updated.');
  };

  const padBottom = { paddingBottom: Math.max(insets.bottom, 34) + 24 };
  const sections: { key: Tab; label: string; description: string }[] = [
    { key: 'profile', label: 'Profile', description: 'Birth details and places' },
    { key: 'preferences', label: 'Preferences', description: 'Daily feeling, language and collection' },
    { key: 'privacy', label: 'Privacy', description: 'Permission and local storage' },
    { key: 'about', label: 'About', description: 'How to use the app and support' },
  ];

  function handleBack() {
    if (tab === 'profile') {
      void profileFormRef.current?.save();
      return;
    }
    if (tab) {
      setTab(null);
      setMessage(null);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  return (
    <>
    <Stack.Screen options={{ headerShown: false, gestureEnabled: Platform.OS === 'ios' && tab === null }} />
    <EdgeSwipeBack
      testID="settings-edge-swipe-back"
      enabled={tab !== null}
      onBack={handleBack}
    >
    <SafeAreaView edges={['top']} style={[styles.safeArea, Platform.OS === 'web' && { paddingTop: 67 }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={handleBack} hitSlop={10}>
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
          <ProfileForm ref={profileFormRef} initialProfile={profile} submitLabel="Save Changes" onSubmit={submit} />
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
                <Section
                  title="How are you feeling today?"
                  description="Choose how you feel today, or leave this blank for the usual chart-based suggestions. Your choice resets at midnight on your device. You can change or clear it at any time."
                >
                  <View style={styles.feelingList}>
                    {FEELING_OPTIONS.map((option) => (
                      <FeelingChoice
                        key={option.id}
                        option={option}
                        selected={preferences.crystalPreferences.feeling === option.id}
                        onPress={() => toggleFeeling(option.id)}
                      />
                    ))}
                  </View>
                </Section>
               <Section
                 title="Your collection"
                 description={`This guide currently has ${CATALOG.length} stones. Mark the stones or jewelry you already own to keep track of your collection. Owned stones are marked here and on today's suggestion. Your collection does not limit recommendations.`}
               >
                 <TextInput
                   accessibilityLabel="Search stones in the collection catalog"
                   placeholder="Search stones"
                   value={collectionSearch}
                   onChangeText={setCollectionSearch}
                   autoCorrect={false}
                   style={styles.catalogSearch}
                 />
                 {collectionMatches.length === 0 ? <Text style={styles.body}>No stones match your search.</Text> : null}
                 {collectionMatches.map((c) => {
                  const owned = preferences.crystalCollection.includes(c.id);
                  return (
                    <View key={c.id} style={styles.row}>
                      <Text style={styles.rowLabel}>{c.name}</Text>
                      <Pressable testID={`settings-collect-${c.id}`} accessibilityRole="button" disabled={busy}
                        onPress={() => void run(() => toggleCrystal(c.id), undefined, { clearMessage: false })}
                        style={[styles.smallButton, owned && styles.smallButtonActive]}>
                        <Text style={[styles.smallButtonText, owned && styles.smallButtonTextActive]}>{owned ? 'Remove' : 'Add'}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </Section>
               <Section title="Hidden stones" description="If a stone does not appeal to you, hide it here. Hidden stones will not be suggested. You can restore them at any time.">
                <TextInput
                  accessibilityLabel="Search stones to hide or restore"
                  placeholder="Search stones"
                  value={hiddenSearch}
                  onChangeText={setHiddenSearch}
                  autoCorrect={false}
                  style={styles.catalogSearch}
                />
                {hiddenMatches.length === 0 ? <Text style={styles.body}>No stones match your search.</Text> : null}
                {hiddenMatches.map((c) => {
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
              <Section title="What runs on this device" description="Daily readings, simple rituals, and stone suggestions are worked out here using your saved profile, current home, and today's feeling if you chose one. This information is not sent anywhere for these features." />
              <Section title="What uses the network" description="When you search for a city, only the words you type go through the Soul Compass server to Geoapify. Your saved birth profile is not sent. Geoapify sees the server’s normal connection details; we do not pass along your device IP address or headers. A search happens only when you tap Search." />
              <Section title="City search protection" description="Our server keeps short-lived counters to protect city search. They do not contain raw IP addresses, search terms, profiles, or birth details. The source hashes change each day, and expired records are removed when another search comes in." />
              <Section title="Full natal chart (server)">
                <Text style={styles.body}>
                  If you agree, Soul Compass sends your birth date, your birth time if you know it, and your birthplace coordinates and time zone to calculate your Natal Chart. It does this the first time, or again if you change your birth details. Your name, current home, language, daily feeling, and collection are not sent. The chart is saved on this device, so opening the app does not send the same details again.
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
              <Section title="About Soul Compass" description={APP_GUIDE_INTRO} />
              <Section title="Three ways to explore">
                <AppGuideCards variant="settings" />
              </Section>
              <Section title="Support" description={PRODUCT.supportEmail}>
                <Text style={styles.body}>Please do not email us your birth details or private profile information. The app never attaches them.</Text>
                <Pressable accessibilityRole="link" onPress={() => void run(async () => {
                  await Linking.openURL(`mailto:${PRODUCT.supportEmail}?subject=Soul%20Compass%20support`);
                }, 'Email draft opened. No profile data was attached.')} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Contact support</Text>
                </Pressable>
              </Section>
              <Section
                title="City search privacy"
                description="City search runs only when you tap Search. Only the city words you enter go through the Soul Compass server to Geoapify. Your saved birth profile and device GPS are not sent. Geoapify receives the server’s normal connection details; we do not forward your device IP address or request headers."
              >
                <Pressable
                  testID="about-geoapify-privacy"
                  accessibilityRole="link"
                  onPress={() => void run(async () => {
                    await Linking.openURL('https://www.geoapify.com/privacy-policy/');
                  }, 'Geoapify privacy policy opened.')}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryText}>Geoapify privacy policy</Text>
                </Pressable>
                <Pressable
                  testID="about-osm-copyright"
                  accessibilityRole="link"
                  onPress={() => void run(async () => {
                    await Linking.openURL('https://www.openstreetmap.org/copyright');
                  }, 'OpenStreetMap copyright opened.')}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryText}>OpenStreetMap copyright</Text>
                </Pressable>
              </Section>
              <Section title="Soul Compass" description={`Version ${APP_VERSION}`} />
              <Section title="Crystal images" description="Some crystal images are AI-generated illustrations, not photographs of verified specimens. Real stones vary in colour, shape, and pattern." />
              <Section title="Privacy" description="No account is needed. Your profile, collection, and saved Natal Chart stay on this device. Daily readings and rituals are worked out here. With your permission, birth details are sent to calculate a chart. The same saved chart is not requested again, and you can withdraw permission in Privacy." />
              <Section title="Licenses" description="Astrology calculations use Astronomy Engine (MIT), not a paid ephemeris. City search uses Geoapify and OpenStreetMap data; attribution and provider privacy links appear beside each search. Geoapify’s Free plan allows commercial use within its credit, rate, and feature limits. The app is built with Expo and React Native (MIT). Feather icons are MIT-licensed; Inter uses the SIL Open Font License 1.1. The app is currently in English." />
            </>
          ) : null}
        </KeyboardAwareScrollViewCompat>
      )}
    </SafeAreaView>
    </EdgeSwipeBack>
    </>
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
  catalogSearch: { minHeight: 46, borderWidth: 1, borderColor: '#D9D3C7', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#FFFEFB', color: '#45473F', fontSize: 14 },
  status: { color: '#45473F', fontSize: 13, fontWeight: '600' },
  message: { color: '#58664F', fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#D9D3C7', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFFEFB' },
  chipActive: { backgroundColor: '#58664F', borderColor: '#58664F' },
  chipText: { color: '#45473F', fontSize: 13 },
  chipTextActive: { color: '#F5F1E8' },
  feelingList: { gap: 8 },
  feelingChoice: { borderWidth: 1, borderColor: '#D9D3C7', borderRadius: 14, backgroundColor: '#FFFEFB', paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  feelingChoiceActive: { borderColor: '#58664F', backgroundColor: '#F0F1EB' },
  feelingCopy: { flex: 1, gap: 3 },
  feelingTitle: { color: '#30352D', fontSize: 14, fontWeight: '600' },
  feelingTitleActive: { color: '#58664F' },
  feelingDescription: { color: '#77756F', fontSize: 12, lineHeight: 17 },
  feelingIndicator: { width: 19, height: 19, borderWidth: 1, borderColor: '#A7A79B', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  feelingIndicatorActive: { borderColor: '#58664F' },
  feelingDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#58664F' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#DED9CE' },
  rowLabel: { color: '#25251F', fontSize: 15 },
  smallButton: { borderWidth: 1, borderColor: '#D9D3C7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, minWidth: 76, alignItems: 'center' },
  smallButtonActive: { backgroundColor: '#58664F', borderColor: '#58664F' },
  smallButtonText: { color: '#58664F', fontSize: 13, fontWeight: '600' },
  smallButtonTextActive: { color: '#F5F1E8' },
  secondaryButton: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: '#D9D3C7', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, alignSelf: 'flex-start' },
  secondaryText: { color: '#58664F', fontSize: 14, fontWeight: '600' },
});
