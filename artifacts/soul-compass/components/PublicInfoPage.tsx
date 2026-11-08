import React from 'react';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/profile/ProfileContext';
import { PRODUCT } from '@/constants/product';

export type InfoAction = {
  label: string;
  icon: 'mail' | 'file-text' | 'help-circle';
  route?: './privacy' | './terms' | './support';
  href?: string;
};

export type InfoSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type Props = {
  title: string;
  subtitle: string;
  updated: string;
  sections: InfoSection[];
  actions: InfoAction[];
};

export function PublicInfoPage({ title, subtitle, updated, sections, actions }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useProfile();
  const topPadding = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 16);
  const palette = colors.cosmos;
  const styles = makeStyles(palette);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(profile ? '/(tabs)' : '/onboarding');
  };

  return (
    <SafeAreaView edges={[]} style={[styles.safeArea, { backgroundColor: palette.homeBackground }]}>
      <StatusBar style={colors.mode === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding + 12, paddingBottom: bottomPadding + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={goBack}
              hitSlop={10}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={18} color={palette.secondary} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
            <Text style={styles.wordmark}>SOUL COMPASS</Text>
          </View>

          <View accessibilityRole="alert" style={styles.draftBanner}>
            <Feather name="alert-circle" size={17} color={palette.secondary} />
            <View style={styles.draftCopy}>
              <Text style={styles.draftTitle}>WORKING DRAFT — NOT FOR PUBLICATION</Text>
              <Text style={styles.draftText}>
                This English draft is not legal advice or a final document. Do not rely on it or submit it to an app store until the listed facts and legal review are complete.
              </Text>
            </View>
          </View>

          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.updated}>Last updated: {updated}</Text>

          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
              {section.paragraphs?.map((paragraph, index) => (
                <Text key={`${section.title}-p-${index}`} style={styles.body}>{paragraph}</Text>
              ))}
              {section.bullets?.map((bullet, index) => (
                <View key={`${section.title}-b-${index}`} style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.body}>{bullet}</Text>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="link"
                accessibilityLabel={action.label}
                onPress={() => {
                  if (action.route) router.push(action.route);
                  else if (action.href) void Linking.openURL(action.href);
                }}
                style={styles.action}
              >
                <Feather name={action.icon} size={17} color={palette.secondary} />
                <Text style={styles.actionText}>{action.label}</Text>
                <Feather name="arrow-up-right" size={15} color={palette.mutedForeground} />
              </Pressable>
            ))}
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Email ${PRODUCT.supportName}`}
              onPress={() => void Linking.openURL(`mailto:${PRODUCT.supportEmail}?subject=Soul%20Compass%20support`)}
            >
              <Text style={styles.supportLink}>{PRODUCT.supportName}</Text>
            </Pressable>
            <Text style={styles.footerSeparator}>·</Text>
            <Text style={styles.footerEmail}>{PRODUCT.supportEmail}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(palette: ReturnType<typeof useColors>['cosmos']) {
  return StyleSheet.create({
    safeArea: { flex: 1 },
    scrollContent: { alignItems: 'center', paddingHorizontal: 20 },
    page: { width: '100%', maxWidth: 760 },
    topRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    backButton: { alignItems: 'center', flexDirection: 'row', gap: 7, minHeight: 40 },
    backText: { color: palette.secondary, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
    wordmark: {
      color: palette.mutedForeground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 10,
      letterSpacing: 1.6,
    },
    draftBanner: {
      alignItems: 'flex-start',
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      marginBottom: 22,
      padding: 14,
    },
    draftCopy: { flex: 1, gap: 5 },
    draftTitle: {
      color: palette.secondary,
      fontFamily: 'Inter_700Bold',
      fontSize: 10,
      letterSpacing: 0.7,
    },
    draftText: {
      color: palette.foreground,
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      lineHeight: 19,
    },
    title: {
      color: palette.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 30,
      lineHeight: 37,
      marginBottom: 8,
    },
    subtitle: {
      color: palette.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 22,
    },
    updated: {
      color: palette.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      marginTop: -14,
      marginBottom: 22,
    },
    section: {
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      marginBottom: 12,
      padding: 18,
    },
    sectionTitle: {
      color: palette.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      lineHeight: 23,
      marginBottom: 2,
    },
    body: {
      color: palette.mutedForeground,
      flex: 1,
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      lineHeight: 22,
    },
    bulletRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
    bullet: {
      backgroundColor: palette.secondary,
      borderRadius: 3,
      height: 5,
      marginTop: 9,
      width: 5,
    },
    actions: { gap: 8, marginTop: 10 },
    action: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: 50,
      paddingHorizontal: 14,
    },
    actionText: {
      color: palette.foreground,
      flex: 1,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
    },
    footer: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'center',
      marginTop: 22,
    },
    supportLink: {
      color: palette.secondary,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
      textDecorationLine: 'underline',
    },
    footerSeparator: {
      color: palette.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
    },
    footerEmail: {
      color: palette.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
    },
  });
}
