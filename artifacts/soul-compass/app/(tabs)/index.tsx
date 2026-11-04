import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileReadingNote } from '@/components/ProfileReadingNote';
import { PlanetarySnapshot } from '@/components/PlanetarySnapshot';
import { SettingsButton } from '@/components/SettingsButton';
import { dailyReading } from '@/constants/content';
import { useColors } from '@/hooks/useColors';

export default function CosmosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safeArea,
        { backgroundColor: colors.cosmos.background },
        Platform.OS === 'web' && {
          paddingTop: Math.max(insets.top, 67),
        },
      ]}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <View style={styles.brandRow}>
            <View
              style={[
                styles.brandMark,
                { borderColor: colors.cosmos.secondary },
              ]}
            >
              <Feather
                name="compass"
                size={16}
                color={colors.cosmos.secondary}
              />
            </View>
            <Text
              style={[
                styles.brandName,
                { color: colors.cosmos.foreground },
              ]}
            >
              SOUL COMPASS
            </Text>
            <View
              style={[
                styles.brandDivider,
                { backgroundColor: colors.cosmos.divider },
              ]}
            />
            <Text
              style={[
                styles.brandCaption,
                { color: colors.cosmos.mutedForeground },
              ]}
            >
              DAILY PRACTICE
            </Text>
            <SettingsButton />
          </View>
          <ProfileReadingNote tone="dark" />

          <View style={styles.intro}>
            <View style={styles.eyebrowRow}>
              <View
                style={[
                  styles.eyebrowLine,
                  { backgroundColor: colors.cosmos.secondary },
                ]}
              />
              <Text
                style={[
                  styles.eyebrow,
                  { color: colors.cosmos.secondary },
                ]}
              >
                {dailyReading.label}
              </Text>
            </View>
            <Text
              style={[
                styles.title,
                { color: colors.cosmos.foreground },
              ]}
            >
              Find your way{"\n"}back to yourself.
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: colors.cosmos.mutedForeground },
              ]}
            >
              A gentle reading for the day ahead.
            </Text>
          </View>

          <View
            style={[
              styles.readingCard,
              {
                backgroundColor: colors.cosmos.card,
                borderColor: colors.cosmos.border,
              },
            ]}
          >
            <View style={styles.cardTopline}>
              <View style={styles.cardLabelGroup}>
                <Ionicons
                  name="sparkles-outline"
                  size={16}
                  color={colors.cosmos.secondary}
                />
                <Text
                  style={[
                    styles.cardLabel,
                    { color: colors.cosmos.secondary },
                  ]}
                >
                  YOUR ORIENTATION
                </Text>
              </View>
              <Text
                style={[
                  styles.cardIndex,
                  { color: colors.cosmos.mutedForeground },
                ]}
              >
                01 / 01
              </Text>
            </View>

            <Text
              style={[
                styles.readingTitle,
                { color: colors.cosmos.foreground },
              ]}
            >
              {dailyReading.title}
            </Text>
            <Text
              style={[
                styles.readingBody,
                { color: colors.cosmos.mutedForeground },
              ]}
            >
              {dailyReading.body}
            </Text>

            <View
              style={[
                styles.cardRule,
                { backgroundColor: colors.cosmos.border },
              ]}
            />

            <View style={styles.reflectionRow}>
              <View
                style={[
                  styles.reflectionIcon,
                  { borderColor: colors.cosmos.reflectionBorder },
                ]}
              >
                <Feather
                  name="sun"
                  size={16}
                  color={colors.cosmos.secondary}
                />
              </View>
              <View style={styles.reflectionCopy}>
                <Text
                  style={[
                    styles.reflectionLabel,
                    { color: colors.cosmos.secondary },
                  ]}
                >
                  A MOMENT TO KEEP
                </Text>
                <Text
                  style={[
                    styles.reflectionText,
                    { color: colors.cosmos.foreground },
                  ]}
                >
                  “{dailyReading.reflection}”
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.focusRow}>
            <Text
              style={[
                styles.focusLabel,
                { color: colors.cosmos.mutedForeground },
              ]}
            >
              TODAY’S FOCUS
            </Text>
            <View style={styles.focusValue}>
              <View
                style={[
                  styles.focusDot,
                  { backgroundColor: colors.cosmos.secondary },
                ]}
              />
              <Text
                style={[
                  styles.focusText,
                  { color: colors.cosmos.foreground },
                ]}
              >
                {dailyReading.focus}
              </Text>
            </View>
          </View>

          <PlanetarySnapshot />

          <View style={styles.footerMark}>
            <View
              style={[
                styles.footerLine,
                { backgroundColor: colors.cosmos.border },
              ]}
            />
            <Ionicons
              name="moon-outline"
              size={14}
              color={colors.cosmos.mutedForeground}
            />
            <View
              style={[
                styles.footerLine,
                { backgroundColor: colors.cosmos.border },
              ]}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 34,
  },
  page: {
    width: '100%',
    maxWidth: 480,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  brandMark: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    marginRight: 10,
    width: 32,
  },
  brandName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.7,
  },
  brandDivider: {
    height: 13,
    marginHorizontal: 10,
    width: 1,
  },
  brandCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 8,
    letterSpacing: 1.3,
  },
  intro: {
    marginTop: 46,
    marginBottom: 28,
  },
  eyebrowRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  eyebrowLine: {
    height: 1,
    marginRight: 9,
    width: 22,
  },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.9,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 38,
    fontWeight: '400',
    letterSpacing: -1.1,
    lineHeight: 45,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
  },
  readingCard: {
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 23,
  },
  cardTopline: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 23,
  },
  cardLabelGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cardLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.5,
  },
  cardIndex: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    letterSpacing: 1.1,
  },
  readingTitle: {
    fontFamily: 'Georgia',
    fontSize: 26,
    fontWeight: '400',
    letterSpacing: -0.4,
    lineHeight: 33,
    maxWidth: 300,
  },
  readingBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 23,
    marginTop: 12,
  },
  cardRule: {
    height: 1,
    marginVertical: 22,
  },
  reflectionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  reflectionIcon: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  reflectionCopy: {
    flex: 1,
    paddingTop: 2,
  },
  reflectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  reflectionText: {
    fontFamily: 'Georgia',
    fontSize: 17,
    lineHeight: 24,
  },
  focusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 23,
    paddingHorizontal: 2,
  },
  focusLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.5,
  },
  focusValue: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  focusDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  focusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  footerMark: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
    marginTop: 31,
  },
  footerLine: {
    height: 1,
    maxWidth: 70,
    width: '24%',
  },
});
