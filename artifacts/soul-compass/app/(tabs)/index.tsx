import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, View, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsButton } from '@/components/SettingsButton';
import { dailyReading } from '@/constants/content';
import cosmosArt from '../../assets/images/cosmos-art.jpg';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/profile/ProfileContext';
import { getDailyAstrology } from '@/profile/daily-cache';
import { useLocalClock } from '@/hooks/useLocalClock';

const reflectionExplanations: Record<string, string> = {
  'A quieter kind of clarity.':
    'Choose one conversation, task, or feeling that needs your attention now. The rest can wait; you do not have to solve everything at once.',
  'Bring one strong theme into focus.':
    'This is about choosing one small action instead of splitting your attention across everything. Treat it as a prompt, not a prediction.',
  'Notice a small opening.':
    'Look for a manageable step toward something you value. It is an idea to consider, not a promise that an opportunity will appear.',
  'Make room for a different response.':
    'If something feels difficult, pause and name it. Then consider one expectation or response you could adjust; you do not have to fix everything.',
  'Use what feels naturally available.':
    'Start with a skill, habit, or support you already have, and use it for one practical task. This is a suggestion, not a rule.',
  'Consider both sides before deciding.':
    'Give another point of view a fair hearing alongside your own before making a commitment. You can still decide what fits for you.',
  'Return to a steady point.':
    'When things feel unclear, think of a familiar quality, routine, or strength that could help you choose one next step. It is a prompt for reflection, not a fixed description or prediction.',
};

const dailyRituals = [
  'Take three comfortable breaths before beginning a task.',
  'Write down one thing you want to give attention today.',
  'Step outside briefly and notice the light, sounds, or air.',
  'Pause to stretch your shoulders before your next task.',
];

export default function CosmosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const router = useRouter();
  const [activeDetail, setActiveDetail] = useState<'reflection' | 'moment' | 'ritual' | null>(null);
  const now = useLocalClock();
  const astrology = useMemo(
    () => (profile ? getDailyAstrology(profile, now) : null),
    [profile, now],
  );
  const calculatedReading =
    astrology?.status === 'calculated' ? astrology.reading : null;
  const reading = calculatedReading ?? dailyReading;
  const localDateKey =
    now.getFullYear() * 10_000 + (now.getMonth() + 1) * 100 + now.getDate();
  const dailyRitual = dailyRituals[localDateKey % dailyRituals.length];
  const detail = activeDetail === 'reflection'
    ? {
        title: 'A plain-language read',
        body: reflectionExplanations[reading.title] ??
          'Use this as one idea to think over, not a prediction or instruction. Keep what feels useful and leave the rest.',
        examples: [],
      }
    : activeDetail === 'moment'
      ? {
          title: 'About this question',
            body: 'Notice when a related choice, task, or conversation comes up. You can answer in a few words, think it over, or leave it unanswered. There is no need to act on it right away.',
            question: reading.reflection,
          examples: [],
        }
      : activeDetail === 'ritual'
        ? {
            title: 'A small daily ritual',
            body: 'Optional: choose one small action, or skip it. These are simple prompts for attention, not a way to cause a particular result.',
              examples: dailyRituals.filter((ritual) => ritual !== dailyRitual),
          }
        : null;

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
        contentInsetAdjustmentBehavior="never"
        accessibilityLabel="Daily reflection"
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

          <View style={styles.hero} accessibilityRole="header">
            <Image
              source={cosmosArt}
              accessibilityLabel="A crescent moon above a quiet horizon, traced with delicate celestial orbits"
              resizeMode="cover"
              style={styles.heroImage}
            />
            <View style={[styles.heroShade, { backgroundColor: colors.cosmos.background }]} />
            <View style={styles.heroCopy}>
              <View style={styles.eyebrowRow}>
                <View style={[styles.eyebrowLine, { backgroundColor: colors.cosmos.secondary }]} />
                <Text style={[styles.eyebrow, { color: colors.cosmos.secondary }]}>
                  {calculatedReading ? 'A DAILY PAUSE' : dailyReading.label}
                </Text>
              </View>
              <Text style={[styles.title, { color: colors.cosmos.foreground }]}>Today’s reflection</Text>
            </View>
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open a plain-language explanation of today’s reflection"
              accessibilityHint="Opens a short explanation"
              onPress={() => setActiveDetail('reflection')}
              style={styles.reflectionPrompt}
            >
              <View style={styles.readingHeadingRow}>
                <Text
                  style={[
                    styles.readingTitle,
                    { color: colors.cosmos.foreground },
                  ]}
                >
                  {reading.title}
                </Text>
                <Feather
                  name="info"
                  size={15}
                  color={colors.cosmos.secondary}
                  style={styles.promptIndicator}
                />
              </View>
              <Text
                style={[
                  styles.readingBody,
                  { color: colors.cosmos.mutedForeground },
                ]}
              >
                {reading.body}
              </Text>
            </Pressable>
            {astrology?.status === 'unavailable' ? (
              <Text style={[styles.calculationNote, { color: colors.cosmos.mutedForeground }]}>
                A personal reflection isn’t available right now. Review your saved details in Settings.
              </Text>
            ) : !calculatedReading ? (
              <Text style={[styles.calculationNote, { color: colors.cosmos.mutedForeground }]}>
                {dailyReading.status}
              </Text>
            ) : null}
            {profile && !profile.currentResidence ? (
              <Pressable accessibilityRole="button" onPress={() => router.push('/settings')}>
                <Text style={[styles.factorSummary, { color: colors.cosmos.secondary, paddingVertical: 12 }]}>
                  Add current residence for your daily reflection →
                </Text>
              </Pressable>
            ) : null}
            <View
              style={[
                styles.cardRule,
                { backgroundColor: colors.cosmos.border },
              ]}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="About A moment to keep"
              accessibilityHint="Opens a simple explanation"
              onPress={() => setActiveDetail('moment')}
              style={styles.reflectionRow}
            >
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
                  “{reading.reflection}”
                </Text>
              </View>
              <Feather name="chevron-right" size={15} color={colors.cosmos.secondary} />
            </Pressable>
          </View>

          <View
            style={[
              styles.ritualCard,
              {
                backgroundColor: colors.cosmos.card,
                borderColor: colors.cosmos.border,
              },
            ]}
          >
            <View style={styles.ritualCopy}>
              <View style={styles.ritualHeadingRow}>
                <Feather name="wind" size={15} color={colors.cosmos.secondary} />
                <Text style={[styles.ritualTitle, { color: colors.cosmos.foreground }]}>
                  A small daily ritual
                </Text>
              </View>
              <Text style={[styles.ritualAction, { color: colors.cosmos.foreground }]}>
                {dailyRitual}
              </Text>
            </View>
            <View style={styles.ritualFooter}>
              <Text style={[styles.ritualNote, { color: colors.cosmos.mutedForeground }]}>
                OPTIONAL
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="See a few optional daily ritual ideas"
                accessibilityHint="Opens practical examples"
                onPress={() => setActiveDetail('ritual')}
                style={({ pressed }) => [
                  styles.ritualButton,
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Text style={[styles.ritualButtonText, { color: colors.cosmos.secondary }]}>
                  More ideas
                </Text>
                <Feather name="arrow-up-right" size={14} color={colors.cosmos.secondary} />
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explore your optional Natal Chart"
            accessibilityHint="Opens your birth chart"
            testID="cosmos-natal-link"
            onPress={() => router.push('/(tabs)/natal')}
            style={({ pressed }) => [styles.natalLink, { borderColor: colors.cosmos.border, opacity: pressed ? 0.72 : 1 }]}
          >
            <View style={styles.natalLinkCopy}>
              <Text style={[styles.natalLinkEyebrow, { color: colors.cosmos.secondary }]}>WHEN YOU’RE CURIOUS</Text>
              <Text style={[styles.natalLinkTitle, { color: colors.cosmos.foreground }]}>Explore your Natal Chart</Text>
            </View>
            <Feather name="arrow-up-right" size={17} color={colors.cosmos.secondary} />
          </Pressable>

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
      <Modal
        visible={detail !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDetail(null)}
      >
        <SafeAreaView
          edges={['top', 'bottom']}
          style={styles.modalSafeArea}
          testID="cosmos-explanation-stage"
        >
          <View
            pointerEvents="none"
            style={[
              styles.modalScrim,
              { backgroundColor: colors.cosmos.foreground },
            ]}
          />
          {detail ? (
            <View
              accessibilityViewIsModal
              testID="cosmos-explanation-modal"
              style={[
                styles.detailCard,
                {
                  backgroundColor: colors.cosmos.card,
                  borderColor: colors.cosmos.border,
                },
              ]}
            >
              <View style={styles.detailHeader}>
                <View style={styles.detailHeadingCopy}>
                  <Text
                    accessibilityRole="header"
                    style={[styles.detailTitle, { color: colors.cosmos.foreground }]}
                  >
                    {detail.title}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close explanation"
                  hitSlop={8}
                  onPress={() => setActiveDetail(null)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={19} color={colors.cosmos.secondary} />
                </Pressable>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailScrollContent}
              >
                {'question' in detail ? (
                  <Text style={[styles.detailQuestion, { color: colors.cosmos.foreground }]}>
                    “{detail.question}”
                  </Text>
                ) : null}
                <Text style={[styles.detailBody, { color: colors.cosmos.mutedForeground }]}>
                  {detail.body}
                </Text>
                {detail.examples.map((example) => (
                  <View key={example} style={styles.exampleRow}>
                    <View style={[styles.exampleMark, { backgroundColor: colors.cosmos.secondary }]} />
                    <Text style={[styles.exampleText, { color: colors.cosmos.foreground }]}>
                      {example}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 23,
    paddingTop: 18,
    paddingBottom: 48,
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
    marginTop: 45,
    marginBottom: 23,
  },
  hero: {
    height: 218,
    justifyContent: 'flex-end',
    marginBottom: 20,
    marginHorizontal: -23,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    height: '100%',
    position: 'absolute',
    right: -16,
    top: 0,
    width: '78%',
  },
  heroShade: {
    ...StyleSheet.absoluteFill,
    opacity: 0.38,
  },
  heroCopy: { paddingHorizontal: 23, paddingBottom: 13 },
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
    fontSize: 40,
    fontWeight: '400',
    letterSpacing: -1.1,
    lineHeight: 48,
  },
  orbit: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 100,
    borderWidth: 1,
    height: 84,
    justifyContent: 'center',
    marginBottom: 25,
    width: 84,
  },
  orbitInner: {
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  orbitCore: {
    borderRadius: 18,
    height: 19,
    opacity: 0.9,
    transform: [{ rotate: '45deg' }],
    width: 19,
  },
  orbitDot: {
    borderRadius: 3,
    height: 6,
    position: 'absolute',
    right: 8,
    top: 9,
    width: 6,
  },
  orbitDotSmall: {
    borderRadius: 3,
    bottom: 9,
    height: 4,
    left: 9,
    position: 'absolute',
    width: 4,
  },
  reflectionPrompt: {
    minHeight: 44,
  },
  readingCard: {
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 23,
    paddingTop: 25,
    paddingBottom: 23,
  },
  readingTitle: {
    fontFamily: 'Georgia',
    fontSize: 28,
    flex: 1,
    fontWeight: '400',
    letterSpacing: -0.4,
    lineHeight: 36,
    maxWidth: 300,
  },
  readingHeadingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  promptIndicator: {
    marginTop: 8,
  },
  readingBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 25,
    marginTop: 14,
  },
  calculationNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 13,
  },
  factorSummary: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  cardRule: {
    height: 1,
    marginTop: 25,
    marginBottom: 24,
  },
  reflectionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    minHeight: 44,
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
    fontSize: 18,
    lineHeight: 27,
  },
  ritualCard: {
    alignItems: 'stretch',
    borderRadius: 21,
    borderWidth: 1,
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  ritualCopy: {
    flex: 1,
  },
  ritualHeadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ritualTitle: {
    fontFamily: 'Georgia',
    fontSize: 17,
    lineHeight: 23,
  },
  ritualNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    letterSpacing: 1.1,
  },
  ritualAction: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  ritualFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  ritualButton: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  ritualButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },
  modalSafeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalScrim: {
    ...StyleSheet.absoluteFill,
    opacity: 0.28,
  },
  detailCard: {
    alignSelf: 'center',
    borderRadius: 26,
    borderWidth: 1,
    maxHeight: '84%',
    maxWidth: 480,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingTop: 20,
    width: '100%',
  },
  detailHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  detailHeadingCopy: {
    flex: 1,
    paddingTop: 7,
  },
  detailTitle: {
    fontFamily: 'Georgia',
    fontSize: 25,
    lineHeight: 32,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  detailScrollContent: {
    paddingTop: 12,
    paddingBottom: 26,
  },
  detailBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  detailQuestion: {
    fontFamily: 'Georgia',
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 16,
  },
  exampleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 11,
    paddingVertical: 9,
  },
  exampleMark: {
    borderRadius: 2,
    height: 5,
    marginTop: 8,
    transform: [{ rotate: '45deg' }],
    width: 5,
  },
  exampleText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
  },
  footerMark: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
    marginTop: 23,
  },
  natalLink: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    minHeight: 70,
    paddingHorizontal: 17,
  },
  natalLinkCopy: { gap: 5 },
  natalLinkEyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 8, letterSpacing: 1.4 },
  natalLinkTitle: { fontFamily: 'Georgia', fontSize: 16 },
  footerLine: {
    height: 1,
    maxWidth: 70,
    width: '24%',
  },
});
