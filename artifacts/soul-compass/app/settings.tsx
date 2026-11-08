import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
import { APP_LANGUAGE_LABELS, APP_LOCALES, formatAppText, useAppLocale, useAppText } from '@/localization';
import { useColors } from '@/hooks/useColors';
import { getLocalizedCrystalCopy } from '@/localization/crystal-copy';
import legalContent from '@/constants/legal-documents.json';

const APP_VERSION = '1.0.0';
const slugOf = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const CATALOG = crystalCatalog
  .map((c) => ({ id: slugOf(c.name), name: c.name }))
  .sort((first, second) => first.name.localeCompare(second.name));
const LANGUAGES = APP_LOCALES.map((code) => ({ code, label: APP_LANGUAGE_LABELS[code] }));

type Tab = 'profile' | 'preferences' | 'collection' | 'privacy' | 'about';

const appearanceOptions = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
] as const;

function Chip({ label, active, onPress, testID }: { label: string; active: boolean; onPress: () => void; testID?: string }) {
  const colors = useColors();
  const styles = useMemo(() => createSettingsStyles(colors), [colors.mode]);
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
  const t = useAppText();
  const colors = useColors();
  const styles = useMemo(() => createSettingsStyles(colors), [colors.mode]);
  return (
    <Pressable
      testID={`settings-feeling-${option.id}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.feelingChoice, selected && styles.feelingChoiceActive]}
    >
      <View style={styles.feelingCopy}>
        <Text style={[styles.feelingTitle, selected && styles.feelingTitleActive]}>{t(option.label)}</Text>
        <Text style={styles.feelingDescription}>{t(option.description)}</Text>
      </View>
      <View style={[styles.feelingIndicator, selected && styles.feelingIndicatorActive]}>
        {selected ? <View style={styles.feelingDot} /> : null}
      </View>
    </Pressable>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  const t = useAppText();
  const colors = useColors();
  const styles = useMemo(() => createSettingsStyles(colors), [colors.mode]);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t(title)}</Text>
      {description ? <Text style={styles.body}>{t(description)}</Text> : null}
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const t = useAppText();
  const locale = useAppLocale();
  const colors = useColors();
  const styles = useMemo(() => createSettingsStyles(colors), [colors.mode]);
  const router = useRouter();
  const { section, focus } = useLocalSearchParams<{ section?: string; focus?: string }>();
  const insets = useSafeAreaInsets();
  const {
    profile, saveProfile, preferences, savePreferences, toggleCrystal, privacy,
    setConsent, clearLocalData,
  } = useProfile();
  const [tab, setTab] = useState<Tab | null>(() => section === 'profile' ? 'profile' : null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const profileFormRef = useRef<ProfileFormHandle | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [collectionSearch, setCollectionSearch] = useState('');
  const [hiddenSearch, setHiddenSearch] = useState('');
  useEffect(() => {
    if (section === 'profile') setTab('profile');
  }, [section]);
  const stoneName = (name: string) => getLocalizedCrystalCopy(name, locale)?.name ?? name;
  const collectionMatches = CATALOG.filter((c) =>
    `${c.name} ${stoneName(c.name)}`.toLocaleLowerCase(locale).includes(collectionSearch.trim().toLocaleLowerCase(locale)),
  ).sort((a, b) => stoneName(a.name).localeCompare(stoneName(b.name), locale));
  const hiddenMatches = CATALOG.filter((c) =>
    `${c.name} ${stoneName(c.name)}`.toLocaleLowerCase(locale).includes(hiddenSearch.trim().toLocaleLowerCase(locale)),
  ).sort((a, b) => stoneName(a.name).localeCompare(stoneName(b.name), locale));

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
      if (ok) setMessage(t(ok));
    }
    catch (error) { setMessage(t(error instanceof Error ? error.message : 'That change could not be saved on this device. Please try again.')); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function submit(nextProfile: UserProfile) {
    await saveProfile(nextProfile);
    setTab(null);
    setMessage(t('Birth details saved on this device.'));
  }

  function openDeleteDialog() {
    setDeleteError(null);
    setDeleteDialogVisible(true);
  }

  function closeDeleteDialog() {
    if (busyRef.current) return;
    setDeleteDialogVisible(false);
    setDeleteError(null);
  }

  async function deleteLocalProfile() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setDeleteError(null);
    try {
      await clearLocalData();
      setDeleteDialogVisible(false);
      router.replace('/onboarding');
    } catch (error) {
      setDeleteError(t(error instanceof Error ? error.message : 'Could not finish deleting data. Some information may remain on this device. Chart requests are blocked for now. Please try again before closing the app.'));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
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
  const appearanceControl = (
    <View style={styles.chips}>
      {appearanceOptions.map((option) => (
        <Chip
          key={option.id}
          testID={`appearance-${option.id}`}
          label={t(option.label)}
          active={preferences.appearance === option.id}
          onPress={() => void run(
            () => savePreferences({ ...preferences, appearance: option.id }),
            'Appearance saved.',
          )}
        />
      ))}
    </View>
  );
  const sections: { key: Tab; label: string; description?: string }[] = [
    { key: 'profile', label: 'Profile', description: 'Birth details' },
    { key: 'preferences', label: 'Preferences' },
    { key: 'collection', label: 'Your collection' },
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

  if (!profile) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false, gestureEnabled: Platform.OS === 'ios' }} />
        <SafeAreaView
          edges={['top']}
          style={[styles.safeArea, Platform.OS === 'web' && { paddingTop: 67 }]}
        >
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('Back')} onPress={handleBack} hitSlop={10}>
              <Text style={styles.back}>{t('Back')}</Text>
            </Pressable>
            <Text accessibilityRole="header" style={styles.heading}>{t('Settings')}</Text>
            <View style={styles.spacer} />
          </View>
          <ScrollView
            contentContainerStyle={[styles.menuContent, padBottom]}
            showsVerticalScrollIndicator={false}
          >
            {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
            <Text style={styles.menuIntro}>{t('A few things you can shape before entering your details.')}</Text>
            <Section title="App language" description="Choose the language used throughout Soul Compass.">
              <View style={styles.chips}>
                {LANGUAGES.map((language) => (
                  <Chip
                    key={language.code}
                    label={language.label}
                    active={preferences.language === language.code}
                    onPress={() => void run(
                      () => savePreferences({ ...preferences, language: language.code }),
                      'Language saved.',
                    )}
                  />
                ))}
              </View>
            </Section>
            <Section title="Appearance" description="Choose how Soul Compass looks. System follows your device setting.">
              {appearanceControl}
            </Section>
            <Section title="About Soul Compass" description={APP_GUIDE_INTRO} />
            <Section title="Four ways to explore">
              <AppGuideCards variant="settings" />
            </Section>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
    <Stack.Screen options={{ headerShown: false, gestureEnabled: Platform.OS === 'ios' && tab === null }} />
    <EdgeSwipeBack
      testID="settings-edge-swipe-back"
      enabled={tab !== null && !deleteDialogVisible}
      onBack={handleBack}
    >
    <SafeAreaView edges={['top']} style={[styles.safeArea, Platform.OS === 'web' && { paddingTop: 67 }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('Back')} onPress={handleBack} hitSlop={10}>
          <Text style={styles.back}>{t('Back')}</Text>
        </Pressable>
        <Text style={styles.heading}>{t('Settings')}</Text>
        <View style={styles.spacer} />
      </View>

      {tab === null ? (
        <ScrollView contentContainerStyle={[styles.menuContent, padBottom]} showsVerticalScrollIndicator={false}>
          {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
          <Text style={styles.menuIntro}>{t('A few things you can shape on this device.')}</Text>
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
                  <Text style={styles.menuLabel}>{t(section.label)}</Text>
                  {section.description ? (
                    <Text style={styles.menuDescription}>{t(section.description)}</Text>
                  ) : null}
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : tab === 'profile' ? (
        <>
          <ProfileForm
            ref={profileFormRef}
            initialProfile={profile}
            focusCurrentResidence={focus === 'current-residence'}
            submitLabel="Save Changes"
            onSubmit={submit}
          />
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
              <Section title="App language" description="Choose the language used throughout Soul Compass.">
                <View style={styles.chips}>
                  {[...LANGUAGES, ...(LANGUAGES.some((l) => l.code === preferences.language) || !preferences.language ? [] : [{ code: preferences.language, label: `Saved: ${preferences.language}` }])].map((l) => (
                    <Chip key={l.code} label={l.label} active={preferences.language === l.code}
                       onPress={() => void run(() => savePreferences({ ...preferences, language: l.code }), 'Language saved.')} />
                  ))}
                </View>
              </Section>
              <Section title="Appearance" description="Choose how Soul Compass looks. System follows your device setting.">
                {appearanceControl}
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
            </>
          ) : null}

          {tab === 'collection' ? (
            <>
              <Section
                title="Your collection"
                description={formatAppText(
                  'This guide currently has {count} stones. Mark the stones or jewelry you already own to keep track of your collection. Owned stones are marked here and on today’s suggestion. Your collection does not limit recommendations.',
                  locale,
                  { count: CATALOG.length },
                )}
              >
                <TextInput
                  accessibilityLabel={t('Search stones in the collection catalog')}
                  placeholder={t('Search stones')}
                  value={collectionSearch}
                  onChangeText={setCollectionSearch}
                  autoCorrect={false}
                  style={styles.catalogSearch}
                />
                {collectionMatches.length === 0 ? (
                  <Text style={styles.body}>{t('No stones match your search.')}</Text>
                ) : null}
                {collectionMatches.map((c) => {
                  const owned = preferences.crystalCollection.includes(c.id);
                  return (
                    <View key={c.id} style={styles.row}>
                      <Text style={styles.rowLabel}>{stoneName(c.name)}</Text>
                      <Pressable
                        testID={`settings-collect-${c.id}`}
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => void run(() => toggleCrystal(c.id), undefined, { clearMessage: false })}
                        style={[styles.smallButton, owned && styles.smallButtonActive]}
                      >
                        <Text style={[styles.smallButtonText, owned && styles.smallButtonTextActive]}>
                          {t(owned ? 'Remove' : 'Add')}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </Section>
              <Section
                title="Hidden stones"
                description="If a stone does not appeal to you, hide it here. Hidden stones will not be suggested. You can restore them at any time."
              >
                <TextInput
                  accessibilityLabel={t('Search stones to hide or restore')}
                  placeholder={t('Search stones')}
                  value={hiddenSearch}
                  onChangeText={setHiddenSearch}
                  autoCorrect={false}
                  style={styles.catalogSearch}
                />
                {hiddenMatches.length === 0 ? (
                  <Text style={styles.body}>{t('No stones match your search.')}</Text>
                ) : null}
                {hiddenMatches.map((c) => {
                  const hidden = preferences.crystalPreferences.hiddenCrystals.includes(c.id);
                  return (
                    <View key={c.id} style={styles.row}>
                      <Text style={styles.rowLabel}>{stoneName(c.name)}</Text>
                      <Pressable
                        testID={`settings-hide-${c.id}`}
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => toggleHidden(c.id)}
                        style={[styles.smallButton, hidden && styles.smallButtonActive]}
                      >
                        <Text style={[styles.smallButtonText, hidden && styles.smallButtonTextActive]}>
                          {t(hidden ? 'Restore' : 'Hide')}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </Section>
            </>
          ) : null}

          {tab === 'privacy' ? (
            <>
      <Section title="What runs on this device" description="Daily readings, simple rituals, and stone suggestions are worked out here using your birth city, or your current residence when set, and today’s feeling if you chose one. This information is not sent anywhere for these features." />
              <Section title="What uses the network" description="When you search for a city, only the words you type go through the Soul Compass server to Geoapify. Your saved birth profile is not sent. Geoapify sees the server’s normal connection details; we do not pass along your device IP address or headers. A search happens only when you tap Search." />
              <Section title="City search protection" description="Our server keeps short-lived counters to protect city search. They do not contain raw IP addresses, search terms, profiles, or birth details. The source hashes change each day, and expired records are removed when another search comes in." />
              <Section title="Full natal chart (server)">
                <Text style={styles.body}>
                  {t('If you agree, Soul Compass sends your birth date, your birth time if you know it, and your birthplace coordinates and time zone to calculate your Natal Chart. It does this the first time, or again if you change your birth details. Your name, current home, language, daily feeling, and collection are not sent. The chart is saved on this device, so opening the app does not send the same details again.')}
                </Text>
                <Text style={styles.body}>
                  {t('You can withdraw permission at any time. This stops future requests and cancels or discards an active result when possible, but it cannot undo a request already sent. Your saved chart stays on this device. Requests are not saved for later when you are offline. If a calculation fails, retry it from the message on the Natal Chart screen.')}
                </Text>
                <Text style={styles.status}>
                  {t('Status')}: {t(privacy.astrologyApiConsent ? 'Allowed' : privacy.revokedAt && privacy.consentTimestamp ? 'Withdrawn' : privacy.consentVersion && privacy.consentVersion !== CONSENT_VERSION ? 'Renewal needed' : 'Not allowed')}
                  {privacy.astrologyApiConsent && privacy.consentTimestamp
                    ? ` · ${formatAppText('since {date}', locale, { date: new Date(privacy.consentTimestamp).toLocaleDateString(locale) })}`
                    : ''}
                  {privacy.consentVersion ? ` · ${formatAppText('terms {version}', locale, { version: privacy.consentVersion })}` : ''}
                </Text>
                {privacy.astrologyApiConsent ? (
                  <Pressable testID="consent-revoke" accessibilityRole="button" disabled={busy}
                     onPress={() => void run(() => setConsent(false), 'Permission withdrawn. No further natal chart requests will be sent.')} style={styles.secondaryButton}>
                     <Text style={styles.secondaryText}>{t('Withdraw consent')}</Text>
                  </Pressable>
                ) : (
                  <Pressable testID="consent-review" accessibilityRole="button" onPress={() => router.push('/natal')} style={styles.secondaryButton}>
                    <Text style={styles.secondaryText}>{t('Review on Natal Chart')}</Text>
                  </Pressable>
                )}
              </Section>
              <Section title="Local storage" description="Your profile, preferences, and collection stay in this app on this device. This storage is not encrypted. There is no account, cloud sync, or export. Deleting the app, losing the device, or clearing browser data can erase your information. Your device backup may include app data." />
              <Section
                title="Delete local profile"
                description="Remove your profile and saved details from this device. Soul Compass will return to setup; select a language and enter your details again to continue."
              >
                <Pressable
                  testID="settings-delete-local-data"
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={openDeleteDialog}
                  style={[styles.deleteAction, { borderColor: colors.destructive }]}
                >
                  <Text style={[styles.deleteActionText, { color: colors.destructive }]}>
                    {t('Delete my local data')}
                  </Text>
                </Pressable>
              </Section>
            </>
          ) : null}

          {tab === 'about' ? (
            <>
              <Section title="About Soul Compass" description={APP_GUIDE_INTRO}>
                <Pressable
                  testID="settings-official-website"
                  accessibilityRole="link"
                  onPress={() => void run(async () => {
                    await Linking.openURL(legalContent.publicUrls.about);
                  })}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryText}>{t('Open the Soul Compass website')}</Text>
                </Pressable>
              </Section>
              <Section title="Four ways to explore">
                <AppGuideCards variant="settings" />
              </Section>
              <Section
                title="Legal documents"
                description={formatAppText('Updated: {date}', locale, { date: legalContent.updated })}
              >
                {([
                  { label: 'Privacy Policy', url: legalContent.publicUrls.privacy, testID: 'settings-privacy-policy' },
                  { label: 'Terms of Service', url: legalContent.publicUrls.terms, testID: 'settings-terms-of-service' },
                  { label: 'Contact support', url: legalContent.publicUrls.support, testID: 'settings-support-page' },
                ]).map((link) => (
                  <Pressable
                    key={link.testID}
                    testID={link.testID}
                    accessibilityRole="link"
                    onPress={() => void run(async () => {
                      await Linking.openURL(link.url);
                    })}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryText}>{t(link.label)}</Text>
                  </Pressable>
                ))}
              </Section>
              <Section title={PRODUCT.supportName} description={PRODUCT.supportEmail}>
                <Text style={styles.body}>{t('Please do not email us your birth details or private profile information. The app never attaches them.')}</Text>
                <Pressable accessibilityRole="link" onPress={() => void run(async () => {
                  await Linking.openURL(`mailto:${PRODUCT.supportEmail}?subject=Soul%20Compass%20support`);
                }, 'Email draft opened. No profile data was attached.')} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>{t('Contact support')}</Text>
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
                  <Text style={styles.secondaryText}>{t('Geoapify privacy policy')}</Text>
                </Pressable>
                <Pressable
                  testID="about-osm-copyright"
                  accessibilityRole="link"
                  onPress={() => void run(async () => {
                    await Linking.openURL('https://www.openstreetmap.org/copyright');
                  }, 'OpenStreetMap copyright opened.')}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryText}>{t('OpenStreetMap copyright')}</Text>
                </Pressable>
              </Section>
              <Section title="Soul Compass" description={formatAppText('Version {version}', locale, { version: APP_VERSION })} />
              <Section title="Crystal images" description="Some crystal images are AI-generated illustrations, not photographs of verified specimens. Real stones vary in colour, shape, and pattern." />
              <Section title="Privacy" description="No account is needed. Your profile, collection, and saved Natal Chart stay on this device. Daily readings and rituals are worked out here. With your permission, birth details are sent to calculate a chart. The same saved chart is not requested again, and you can withdraw permission in Privacy." />
              <Section title="Licenses" description="Astrology calculations use Astronomy Engine (MIT), not a paid ephemeris. City search uses Geoapify and OpenStreetMap data; attribution and provider privacy links appear beside each search. Geoapify’s Free plan allows commercial use within its credit, rate, and feature limits. The app is built with Expo and React Native (MIT). Feather icons are MIT-licensed; Inter uses the SIL Open Font License 1.1. Soul Compass is available in English, Hungarian, Italian, German, French, Spanish, and Russian." />
            </>
          ) : null}
        </KeyboardAwareScrollViewCompat>
      )}
    </SafeAreaView>
    </EdgeSwipeBack>
    <Modal
      visible={deleteDialogVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeDeleteDialog}
    >
      <View style={styles.deleteBackdrop}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.deleteSafeArea}>
          <View
            accessibilityViewIsModal
            style={[
              styles.deleteDialog,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.deleteDialogTitle, { color: colors.foreground }]}>
              {t('Delete your local data?')}
            </Text>
            <ScrollView
              style={styles.deleteDialogScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.deleteDialogScrollContent}
            >
              <Text style={[styles.deleteDialogBody, { color: colors.mutedForeground }]}>
                {t('This cannot be undone. It removes your birth details, current home, saved chart, language, daily feeling, preferences, stone collection, and chart permission from this device. You will return to setup and need to enter your details again. Device backups and technical network records are not deleted.')}
              </Text>
              {deleteError ? (
                <Text accessibilityRole="alert" style={[styles.deleteDialogError, { color: colors.destructive }]}>
                  {deleteError}
                </Text>
              ) : null}
            </ScrollView>
            <View style={styles.deleteDialogActions}>
              <Pressable
                testID="cancel-delete-local-data"
                accessibilityRole="button"
                disabled={busy}
                onPress={closeDeleteDialog}
                style={({ pressed }) => [
                  styles.deleteDialogButton,
                  { backgroundColor: colors.background, opacity: pressed || busy ? 0.72 : 1 },
                ]}
              >
                <Text style={[styles.deleteDialogButtonText, { color: colors.foreground }]}>
                  {t('Keep my data')}
                </Text>
              </Pressable>
              <Pressable
                testID="confirm-delete-local-data"
                accessibilityRole="button"
                disabled={busy}
                onPress={() => void deleteLocalProfile()}
                style={({ pressed }) => [
                  styles.deleteDialogButton,
                  { backgroundColor: colors.destructive, opacity: pressed || busy ? 0.72 : 1 },
                ]}
              >
                <Text style={[styles.deleteDialogButtonText, { color: colors.destructiveForeground }]}>
                  {busy ? t('Deleting…') : t('Delete and start over')}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
    </>
  );
}

function createSettingsStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    header: { height: 52, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    back: { color: colors.tint, fontSize: 14 },
    heading: { color: colors.foreground, fontSize: 16, fontWeight: '600' },
    spacer: { width: 34 },
    menuContent: { paddingHorizontal: 24, paddingTop: 18, gap: 20 },
    menuIntro: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20 },
    menuList: { gap: 10 },
    menuButton: { minHeight: 72, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.card, paddingHorizontal: 17, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    menuCopy: { flex: 1, gap: 4 },
    menuLabel: { color: colors.foreground, fontSize: 15, fontWeight: '600' },
    menuDescription: { color: colors.mutedForeground, fontSize: 12, lineHeight: 16 },
    menuArrow: { color: colors.tint, fontSize: 24, marginLeft: 12 },
    content: { paddingHorizontal: 24, paddingTop: 12, gap: 22 },
    section: { gap: 10 },
    sectionTitle: { color: colors.foreground, fontSize: 18, fontWeight: '600' },
    body: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19 },
    catalogSearch: { minHeight: 46, borderWidth: 1, borderColor: colors.input, borderRadius: 12, paddingHorizontal: 14, backgroundColor: colors.card, color: colors.foreground, fontSize: 14 },
    status: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
    message: { color: colors.tint, fontSize: 13 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.card },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.foreground, fontSize: 13 },
    chipTextActive: { color: colors.primaryForeground },
    feelingList: { gap: 8 },
    feelingChoice: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
    feelingChoiceActive: { borderColor: colors.primary, backgroundColor: colors.muted },
    feelingCopy: { flex: 1, gap: 3 },
    feelingTitle: { color: colors.foreground, fontSize: 14, fontWeight: '600' },
    feelingTitleActive: { color: colors.tint },
    feelingDescription: { color: colors.mutedForeground, fontSize: 12, lineHeight: 17 },
    feelingIndicator: { width: 19, height: 19, borderWidth: 1, borderColor: colors.mutedForeground, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    feelingIndicatorActive: { borderColor: colors.tint },
    feelingDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.tint },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLabel: { color: colors.foreground, fontSize: 15 },
    smallButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, minWidth: 76, alignItems: 'center' },
    smallButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    smallButtonText: { color: colors.tint, fontSize: 13, fontWeight: '600' },
    smallButtonTextActive: { color: colors.primaryForeground },
    secondaryButton: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, alignSelf: 'flex-start' },
    secondaryText: { color: colors.tint, fontSize: 14, fontWeight: '600' },
    primaryButton: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, alignSelf: 'stretch' },
    primaryButtonText: { fontSize: 14, fontWeight: '600' },
    deleteAction: { minHeight: 48, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
    deleteActionText: { fontSize: 14, fontWeight: '600' },
    deleteBackdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 18, backgroundColor: colors.scrim },
    deleteSafeArea: { maxHeight: '100%', justifyContent: 'center' },
    deleteDialog: { width: '100%', maxWidth: 440, maxHeight: '85%', alignSelf: 'center', borderWidth: 1, borderRadius: 22, padding: 20, gap: 14 },
    deleteDialogTitle: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
    deleteDialogScroll: { flexShrink: 1, maxHeight: 360 },
    deleteDialogScrollContent: { gap: 12 },
    deleteDialogBody: { fontSize: 14, lineHeight: 21 },
    deleteDialogError: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
    deleteDialogActions: { flexDirection: 'row', gap: 10 },
    deleteDialogButton: { flex: 1, minHeight: 48, borderRadius: 12, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
    deleteDialogButtonText: { fontSize: 13, lineHeight: 17, fontWeight: '600', textAlign: 'center' },
  });
}
