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
  const submit = (profile: UserProfile, natalConsent = false) => saveProfile(profile, natalConsent);

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
      <ProfileForm
        initialDraft={onboardingDraft}
        includeResidence={false}
        includeNatalConsent
        submitLabel="Enter Soul Compass"
        onSubmit={submit}
      />
    </SafeAreaView>
  );
}

function LanguageFlag({ locale }: { locale: AppLocale }) {
  const colors = useColors();
  if (locale === 'en') {
    return (
      <View style={[styles.flagFrame, styles.ukFlagFrame, { borderColor: colors.border }]} accessibilityElementsHidden>
        <Svg width={56} height={28} viewBox="0 0 60 30">
          <Rect width="60" height="30" fill="#012169" />
          <Path d="M0 0L60 30M60 0L0 30" stroke="#FFFFFF" strokeWidth="6" />
          <Path d="M0 0L60 30M60 0L0 30" stroke="#C8102E" strokeWidth="2.2" />
          <Path d="M30 0V30M0 15H60" stroke="#FFFFFF" strokeWidth="10" />
          <Path d="M30 0V30M0 15H60" stroke="#C8102E" strokeWidth="6" />
        </Svg>
      </View>
    );
  }

  if (locale === 'es') {
    return (
      <View style={[styles.flagFrame, styles.spanishFlagFrame, { borderColor: colors.border }]} accessibilityElementsHidden>
        <Svg width={48} height={32} viewBox="0 0 60 40">
          <Rect width="60" height="10" fill="#AA151B" />
          <Rect y="10" width="60" height="20" fill="#F1BF00" />
          <Rect y="30" width="60" height="10" fill="#AA151B" />
          {/* A compact, simplified coat of arms keeps Spain's flag identifiable at icon size. */}
          <Path d="M19 13H27V21.5C27 25.2 23 27.4 23 27.4S19 25.2 19 21.5Z" fill="#F1BF00" stroke="#8C1D22" strokeWidth="0.8" />
          <Path d="M23 13V26.7M19.4 18.5H26.6" stroke="#AA151B" strokeWidth="1.4" />
          <Path d="M19.5 21.8H26.5L23 25.9Z" fill="#6B91B8" stroke="#8C1D22" strokeWidth="0.5" />
          <Path d="M18.5 12.1H27.5L26.7 14.2H19.3Z" fill="#AA151B" stroke="#8C1D22" strokeWidth="0.4" />
          <Path d="M20.1 11.8L20.7 10.4L22 11.2L23 9.9L24 11.2L25.3 10.4L25.9 11.8Z" fill="#F1BF00" stroke="#8C1D22" strokeWidth="0.4" />
        </Svg>
      </View>
    );
  }

  const bands: Record<Exclude<AppLocale, 'en' | 'es'>, { direction: 'row' | 'column'; colors: string[]; weights?: number[] }> = {
    hu: { direction: 'column', colors: ['#CE2939', '#FFFFFF', '#477050'] },
    it: { direction: 'row', colors: ['#009246', '#FFFFFF', '#CE2B37'] },
    de: { direction: 'column', colors: ['#000000', '#DD0000', '#FFCE00'] },
    fr: { direction: 'row', colors: ['#002395', '#FFFFFF', '#ED2939'] },
    ru: { direction: 'column', colors: ['#FFFFFF', '#0039A6', '#D52B1E'] },
  };
  const design = bands[locale];
  return (
    <View
      style={[styles.flagFrame, styles.flag, { flexDirection: design.direction, borderColor: colors.border }]}
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
    width: 56,
    height: 28,
    overflow: 'hidden',
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  flagFrame: {
    overflow: 'hidden',
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ukFlagFrame: { width: 56, height: 28 },
  spanishFlagFrame: { width: 48, height: 32 },
});
