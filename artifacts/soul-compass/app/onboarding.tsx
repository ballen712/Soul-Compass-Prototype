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
import Svg, { Path, Rect } from 'react-native-svg';
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
import { TabScreenHeader } from '@/components/TabScreenHeader';

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
        style={[
          styles.safeArea,
          { backgroundColor: colors.cosmos.homeBackground },
          Platform.OS === 'web' && { paddingTop: 67 },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.languageContent}
          showsVerticalScrollIndicator={false}
        >
          <TabScreenHeader
            title="Choose your language"
            titleColor={colors.cosmos.foreground}
            subtitleColor={colors.cosmos.mutedForeground}
            titleStyle={styles.languageTitle}
            subtitle={
              <Text>
                {t('Tap a language to continue')}. {t('You can change this later in Settings.')}
              </Text>
            }
            afterSpacing={0}
          />

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
                  accessibilityHint={t('Select this language to continue')}
                  accessibilityState={{ selected, disabled: savingLanguage }}
                  disabled={savingLanguage}
                  onPress={() => void chooseLanguage(locale)}
                  style={({ pressed }) => [
                    styles.languageOption,
                    {
                      backgroundColor: colors.cosmos.card,
                      borderColor: selected ? colors.cosmos.secondary : colors.cosmos.border,
                      opacity: pressed || savingLanguage ? 0.78 : 1,
                    },
                  ]}
                >
                  <LanguageFlag locale={locale} />
                  {savingThis ? (
                    <View style={[styles.languageStatus, { backgroundColor: colors.cosmos.homeBackground }]}>
                      <ActivityIndicator size="small" color={colors.cosmos.secondary} />
                    </View>
                  ) : selected ? (
                    <View
                      style={[
                        styles.languageStatus,
                        {
                          backgroundColor: colors.cosmos.homeBackground,
                          borderColor: colors.cosmos.secondary,
                        },
                      ]}
                    >
                      <Feather name="check" size={11} color={colors.cosmos.secondary} />
                    </View>
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
      <View style={[styles.welcome, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.welcomeEyebrow, { color: colors.tint }]}>{t('WELCOME')}</Text>
        <Text style={[styles.welcomeText, { color: colors.foreground }]}>
          {t('Soul Compass gives you a short daily reflection and a simple idea to carry with you. You can also explore a birth chart and find a stone to reflect on. Don’t know your birth time? Leave it blank; some chart details will be left out.')}
        </Text>
        <Text style={[styles.welcomeText, { color: colors.foreground }]}>
          {t('Where you live now is optional and separate from your birthplace. We use it only to match daily readings to your local date.')}
        </Text>
        <Text style={[styles.welcomeNote, { color: colors.mutedForeground }]}>
          {t('No account is needed. Your profile, preferences, and stone collection stay on this device. Daily readings are worked out here. City search uses the internet. The Natal Chart is optional: if you agree, your birth details are sent to calculate it. The chart is saved here and updated only if you change those details.')}
        </Text>
      </View>
      <ProfileForm initialDraft={onboardingDraft} includeResidence={false} submitLabel="Enter Soul Compass" onSubmit={submit} />
    </SafeAreaView>
  );
}

function LanguageFlag({ locale }: { locale: AppLocale }) {
  const colors = useColors();
  if (locale === 'en') {
    return (
      <View style={[styles.flagFrame, { borderColor: colors.border }]} accessibilityElementsHidden>
        <Svg width={48} height={24} viewBox="0 0 60 30">
          <Rect width="60" height="30" fill="#012169" />
          <Path d="M0 0L60 30H47L0 6ZM60 0L0 30H13L60 6Z" fill="#FFFFFF" />
          <Path d="M0 0L60 30H54L0 3ZM60 0L0 30H6L60 3Z" fill="#C8102E" />
          <Path d="M30 0V30M0 15H60" stroke="#FFFFFF" strokeWidth="10" />
          <Path d="M30 0V30M0 15H60" stroke="#C8102E" strokeWidth="6" />
        </Svg>
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
      style={[styles.flag, { flexDirection: design.direction, borderColor: colors.border }]}
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
  languageContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 30 },
  languageTitle: { fontSize: 32, lineHeight: 39, letterSpacing: -0.6 },
  languageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 30 },
  languageOption: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 18,
    position: 'relative',
  },
  languageStatus: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  languageError: { marginTop: 16, fontSize: 13, lineHeight: 19 },
  flag: {
    width: 48,
    height: 24,
    overflow: 'hidden',
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  flagFrame: {
    width: 48,
    height: 24,
    overflow: 'hidden',
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  flagDiagonal: { position: 'absolute', width: 62, height: 4, top: 10, left: -7 },
  flagDiagonalRed: { position: 'absolute', width: 62, height: 1.8, top: 11.1, left: -7, backgroundColor: '#C8102E' },
  flagCrossHorizontal: { position: 'absolute', top: 8, left: 0, right: 0 },
  flagCrossVertical: { position: 'absolute', top: 0, bottom: 0, left: 20 },
  welcome: { marginHorizontal: 24, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  welcomeEyebrow: { fontSize: 10, letterSpacing: 1.8 },
  welcomeText: { fontSize: 13, lineHeight: 19 },
  welcomeNote: { fontSize: 12, lineHeight: 17 },
});
