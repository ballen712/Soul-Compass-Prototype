import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileForm } from '@/components/ProfileForm';
import { useProfile } from '@/profile/ProfileContext';
import type { UserProfile } from '@/profile/profile';
import {
  APP_LANGUAGE_LABELS,
  APP_LOCALES,
  normalizeAppLocale,
  translateText,
  useAppText,
  type AppLocale,
} from '@/localization';
import { useColors } from '@/hooks/useColors';

export default function OnboardingScreen() {
  const { saveProfile, onboardingDraft, preferences, savePreferences } = useProfile();
  const colors = useColors();
  const t = useAppText();
  const [languageConfirmed, setLanguageConfirmed] = useState(false);
  const [draftLocale, setDraftLocale] = useState<AppLocale | null>(null);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState('');
  const selectedLocale = draftLocale ?? normalizeAppLocale(preferences.language);
  const submit = (profile: UserProfile) => saveProfile(profile);

  async function chooseLanguage(locale: AppLocale) {
    if (savingLanguage) return;
    setDraftLocale(locale);
    setLanguageError('');
    setSavingLanguage(true);
    try {
      await savePreferences({ ...preferences, language: locale });
      setLanguageConfirmed(true);
    } catch {
      setDraftLocale(null);
      setLanguageError(translateText('Language could not be saved. Please try again.', locale));
    } finally {
      setSavingLanguage(false);
    }
  }

  if (!languageConfirmed) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.languageContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.languageBrand}>
            <Feather name="star" size={15} color={colors.tint} />
            <Text style={[styles.languageBrandText, { color: colors.foreground }]}>
              SOUL COMPASS
            </Text>
          </View>
          <Text style={[styles.languageTitle, { color: colors.foreground }]}>
            {t('Choose your language')}
          </Text>
          <Text style={[styles.languageDescription, { color: colors.mutedForeground }]}>
            {t('Tap a language to continue')} {t('You can change this later in Settings.')}
          </Text>

          <View style={styles.languageGrid}>
            {APP_LOCALES.map((locale) => {
              const selected = selectedLocale === locale;
              const savingThis = savingLanguage && draftLocale === locale;
              return (
                <Pressable
                  key={locale}
                  testID={`language-option-${locale}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('Select language')}: ${APP_LANGUAGE_LABELS[locale]}`}
                  accessibilityState={{ selected, disabled: savingLanguage }}
                  disabled={savingLanguage}
                  onPress={() => void chooseLanguage(locale)}
                  style={({ pressed }) => [
                    styles.languageOption,
                    {
                      backgroundColor: colors.card,
                      borderColor: selected ? colors.tint : colors.border,
                      borderRadius: colors.radius / 2,
                      opacity: pressed || savingLanguage ? 0.78 : 1,
                    },
                  ]}
                >
                  <LanguageFlag locale={locale} />
                  <Text
                    numberOfLines={1}
                    style={[styles.languageOptionText, { color: colors.foreground }]}
                  >
                    {APP_LANGUAGE_LABELS[locale]}
                  </Text>
                  {savingThis ? (
                    <ActivityIndicator size="small" color={colors.tint} />
                  ) : selected ? (
                    <Feather name="check" size={16} color={colors.tint} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          {languageError ? (
            <Text accessibilityRole="alert" style={[styles.languageError, { color: colors.destructive }]}>
              {languageError}
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safeArea,
        { backgroundColor: colors.background },
        Platform.OS === 'web' && { paddingTop: 67 },
      ]}
    >
      <View style={styles.welcome}>
        <Text style={styles.welcomeEyebrow}>{t('WELCOME')}</Text>
        <Text style={styles.welcomeText}>
          {t('Soul Compass gives you a short daily reflection and a simple idea to carry with you. You can also explore a birth chart and find a stone to reflect on. Don’t know your birth time? Leave it blank; some chart details will be left out.')}
        </Text>
        <Text style={styles.welcomeText}>
          {t('Where you live now is optional and separate from your birthplace. We use it only to match daily readings to your local date.')}
        </Text>
        <Text style={styles.welcomeNote}>
          {t('No account is needed. Your profile, preferences, and stone collection stay on this device. Daily readings are worked out here. City search uses the internet. The Natal Chart is optional: if you agree, your birth details are sent to calculate it. The chart is saved here and updated only if you change those details.')}
        </Text>
      </View>
      <ProfileForm initialDraft={onboardingDraft} submitLabel="Enter Soul Compass" onSubmit={submit} />
    </SafeAreaView>
  );
}

function LanguageFlag({ locale }: { locale: AppLocale }) {
  if (locale === 'en') {
    return (
      <View style={[styles.flag, { backgroundColor: '#012169' }]} accessibilityElementsHidden>
        <View style={[styles.flagDiagonal, { backgroundColor: '#FFFFFF', transform: [{ rotate: '32deg' }] }]} />
        <View style={[styles.flagDiagonal, { backgroundColor: '#FFFFFF', transform: [{ rotate: '-32deg' }] }]} />
        <View style={[styles.flagDiagonalRed, { transform: [{ rotate: '32deg' }] }]} />
        <View style={[styles.flagDiagonalRed, { transform: [{ rotate: '-32deg' }] }]} />
        <View style={[styles.flagCrossHorizontal, { height: 7, backgroundColor: '#FFFFFF' }]} />
        <View style={[styles.flagCrossVertical, { width: 7, backgroundColor: '#FFFFFF' }]} />
        <View style={[styles.flagCrossHorizontal, { height: 3, backgroundColor: '#C8102E' }]} />
        <View style={[styles.flagCrossVertical, { width: 3, backgroundColor: '#C8102E' }]} />
      </View>
    );
  }

  const bands: Record<Exclude<AppLocale, 'en'>, { direction: 'row' | 'column'; colors: string[]; weights?: number[] }> = {
    hu: { direction: 'column', colors: ['#CE2939', '#FFFFFF', '#477050'] },
    it: { direction: 'row', colors: ['#009246', '#FFFFFF', '#CE2B37'] },
    de: { direction: 'column', colors: ['#000000', '#DD0000', '#FFCE00'] },
    fr: { direction: 'row', colors: ['#002395', '#FFFFFF', '#ED2939'] },
    es: { direction: 'column', colors: ['#AA151B', '#F1BF00', '#AA151B'], weights: [1, 2, 1] },
    ru: { direction: 'column', colors: ['#FFFFFF', '#0039A6', '#D52B1E'] },
  };
  const design = bands[locale];
  return (
    <View
      style={[styles.flag, { flexDirection: design.direction }]}
      accessibilityElementsHidden
    >
      {design.colors.map((color, index) => (
        <View
          key={`${locale}-${index}`}
          style={{ flex: design.weights?.[index] ?? 1, backgroundColor: color }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  languageContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 30 },
  languageBrand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 22 },
  languageBrandText: { fontSize: 11, letterSpacing: 2.1, fontWeight: '600' },
  languageTitle: { fontSize: 30, lineHeight: 37, fontWeight: '400' },
  languageDescription: { fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 24 },
  languageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  languageOption: {
    width: '48%',
    minHeight: 62,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
  },
  languageOptionText: { flex: 1, fontSize: 14, fontWeight: '500' },
  languageError: { marginTop: 16, fontSize: 13, lineHeight: 19 },
  flag: {
    width: 28,
    height: 19,
    overflow: 'hidden',
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(48, 52, 47, 0.18)',
  },
  flagDiagonal: { position: 'absolute', width: 38, height: 4, top: 7, left: -5 },
  flagDiagonalRed: { position: 'absolute', width: 38, height: 1.5, top: 8.2, left: -5, backgroundColor: '#C8102E' },
  flagCrossHorizontal: { position: 'absolute', top: 6, left: 0, right: 0 },
  flagCrossVertical: { position: 'absolute', top: 0, bottom: 0, left: 10 },
  welcome: { marginHorizontal: 24, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#DED9CE', backgroundColor: '#FBF8F1', gap: 6 },
  welcomeEyebrow: { color: '#8A815F', fontSize: 10, letterSpacing: 1.8 },
  welcomeText: { color: '#55574F', fontSize: 13, lineHeight: 19 },
  welcomeNote: { color: '#77756F', fontSize: 12, lineHeight: 17 },
});
