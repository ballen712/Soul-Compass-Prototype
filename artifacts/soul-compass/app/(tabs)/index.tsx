import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, View, Platform, Pressable, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsButton } from '@/components/SettingsButton';
import { dailyReading } from '@/constants/content';
import cosmosArt from '../../assets/images/cosmos-starfield.jpg';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/profile/ProfileContext';
import { getDailyAstrology } from '@/profile/daily-cache';
import { useLocalClock } from '@/hooks/useLocalClock';

const reflectionExplanations: Record<string, string> = {
  'Focus on one thing at a time.':
    'This is a reminder to choose what matters, not to clear every task on your list. Give one task or conversation your attention, then return to the rest when you are ready. You do not have to solve everything at once.',
  'Focus on what matters most.':
    'The day’s theme points toward choosing rather than doing more. Notice which task, conversation, or decision matters most to you, and give it some unhurried attention. One useful step is enough for now.',
  'Take one small step.':
    'A useful start does not need to be a big move. Think of something you care about, then choose the easiest practical step you can take today. You can see what you learn before deciding what comes next.',
  'Pause and try another approach.':
    'If something feels harder than expected, that does not mean the whole day is going badly. Pause and name what is getting in the way. Then look for one part you can change instead of pushing harder at everything.',
  'Use a strength you already have.':
    'You may not need a completely new answer. Think of a skill, habit, or kind of support that has helped you before, and bring it to one practical task. Keep what works for you and leave the rest.',
  'Hear both sides before deciding.':
    'When two needs or points of view are in tension, give each a fair hearing before you decide. Listening does not mean agreeing with everyone; it can help you see what matters and choose what feels right for you.',
  'Start with what you know.':
    'When you are unsure what to do next, begin with something familiar. A skill or routine you trust may help you take one practical step without needing to know the whole way forward.',
};

const dailyRituals = [
  'Take three comfortable breaths before beginning a task.',
  'Write down one thing you want to give attention today.',
  'Step outside briefly and notice the light, sounds, or air.',
  'Pause to stretch your shoulders before your next task.',
];

const backgroundStars = Array.from({ length: 64 }, (_, index) => ({
  x: ((index * 41 + 19) % 97) / 97,
  y: 0.34 + (((index * 53 + 13) % 127) / 127) * 2.45,
  size: index % 9 === 0 ? 2 : 1.25,
  opacity: 0.25 + (index % 4) * 0.05,
}));

type Detail = {
  title?: string;
  body: string;
  examples: string[];
};

export default function CosmosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
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
  const pageWidth = Math.min(windowWidth - 46, 480);
  const heroBleed = Math.max(0, (windowWidth - pageWidth) / 2);
  const heroHeight = Math.round(windowHeight * 0.46);
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const dailyRitual = dailyRituals[localDateKey % dailyRituals.length];
  const detail: Detail | null = activeDetail === 'reflection'
    ? {
        body: reflectionExplanations[reading.title] ??
          'This reading is one way to think about the day’s theme and how it might connect with your life. It is not a prediction or instruction. Keep what feels useful and leave the rest.',
        examples: [],
      }
    : activeDetail === 'moment'
      ? {
          body: 'This prompt connects today’s reflection with something real in your life. Think of a task, conversation, or choice that brings the theme to mind. You can sit with the question, write a few words, or leave it unanswered. There is no right answer and no need to act right away.',
          examples: [],
        }
      : activeDetail === 'ritual'
        ? {
            title: 'Other ideas for today',
            body: 'Choose one if it feels useful, or skip them. These are simple ways to pause, not rules you need to follow.',
            examples: dailyRituals.filter((ritual) => ritual !== dailyRitual),
          }
        : null;

  return (
    <SafeAreaView
      edges={[]}
      style={[
        styles.safeArea,
        { backgroundColor: colors.cosmos.homeBackground },
      ]}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 18 },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        accessibilityLabel="Daily reflection"
      >
        <View style={styles.page}>
          <View
            pointerEvents="none"
            style={[
              styles.heroArt,
              {
                top: -(topInset + 18),
                left: -heroBleed,
                right: -heroBleed,
                height: heroHeight,
              },
            ]}
          >
            <Image
              source={cosmosArt}
              accessibilityLabel="A quiet field of stars in a deep navy sky"
              resizeMode="cover"
              style={styles.heroImage}
            />
            <LinearGradient
              colors={['transparent', 'transparent', colors.cosmos.homeBackground]}
              locations={[0, 0.46, 1]}
              style={styles.heroFade}
            />
          </View>
          <View
            pointerEvents="none"
            accessible={false}
            testID="cosmos-background-stars"
            style={[
              styles.starLayer,
              {
                top: -(topInset + 18),
                left: -heroBleed,
                right: -heroBleed,
                height: windowHeight * 2.85,
              },
            ]}
          >
            {backgroundStars.map((star, index) => (
              <View
                key={index}
                style={[
                  styles.starDot,
                  {
                    backgroundColor: colors.cosmos.foreground,
                    height: star.size,
                    left: `${star.x * 100}%`,
                    opacity: star.opacity,
                    top: windowHeight * star.y,
                    width: star.size,
                  },
                ]}
              />
            ))}
          </View>
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
              accessibilityLabel="Read more about today’s reflection"
              accessibilityHint="Opens a simple explanation of the daily reading"
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
                <View style={styles.infoCircle}>
                  <Feather name="info" size={15} color={colors.cosmos.secondary} />
                </View>
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
                Your personal reading isn’t available right now. Check your saved details in Settings.
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

              <View style={styles.guidanceSection}>
                <Text style={[styles.guidanceLabel, { color: colors.cosmos.secondary }]}>
                  FOCUS FOR TODAY
                </Text>
                <Text style={[styles.guidanceText, { color: colors.cosmos.foreground }]}>
                  {reading.favorableFocus}
                </Text>
              </View>

              <View
                style={[
                  styles.cardRule,
                  styles.guidanceRule,
                  { backgroundColor: colors.cosmos.border },
                ]}
              />

              <View style={styles.guidanceSection}>
                <Text style={[styles.guidanceLabel, { color: colors.cosmos.secondary }]}>
                  WHAT TO LEAVE FOR LATER
                </Text>
                <Text style={[styles.guidanceText, { color: colors.cosmos.foreground }]}>
                  {reading.gentleCaution}
                </Text>
              </View>

            <View
              style={[
                styles.cardRule,
                styles.momentRule,
                { backgroundColor: colors.cosmos.border },
              ]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Read more about A moment to keep"
              accessibilityHint="Opens a simple explanation"
              onPress={() => setActiveDetail('moment')}
              style={styles.reflectionRow}
            >
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
              <View style={styles.infoCircle}>
                <Feather name="info" size={15} color={colors.cosmos.secondary} />
              </View>
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
              <Text style={[styles.ritualTitle, { color: colors.cosmos.foreground }]}>
                A small daily ritual
              </Text>
              <Text style={[styles.ritualAction, { color: colors.cosmos.foreground }]}>
                {dailyRitual}
              </Text>
            </View>
            <View style={styles.ritualFooter}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Explore other daily ritual ideas"
                accessibilityHint="Opens practical examples"
                onPress={() => setActiveDetail('ritual')}
                style={({ pressed }) => [
                  styles.ritualButton,
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Text style={[styles.ritualButtonText, { color: colors.cosmos.secondary }]}>
                  Explore other ideas
                </Text>
                <View style={styles.infoCircle}>
                  <Feather name="info" size={15} color={colors.cosmos.secondary} />
                </View>
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
          </Pressable>
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
              <View style={[styles.detailHeader, !detail.title && styles.detailHeaderNoTitle]}>
                {detail.title ? (
                  <Text
                    accessibilityRole="header"
                    style={[styles.detailTitle, { color: colors.cosmos.foreground }]}
                  >
                    {detail.title}
                  </Text>
                ) : null}
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
    paddingBottom: 16,
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
    height: 140,
    justifyContent: 'flex-end',
    marginBottom: 10,
    marginHorizontal: -23,
    position: 'relative',
  },
  heroArt: {
    overflow: 'hidden',
    position: 'absolute',
  },
  heroImage: {
    height: '100%',
    position: 'absolute',
    width: '100%',
    top: 0,
  },
  heroFade: {
    ...StyleSheet.absoluteFill,
  },
  starLayer: {
    position: 'absolute',
  },
  starDot: {
    borderRadius: 2,
    position: 'absolute',
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
  infoCircle: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
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
  guidanceSection: {
    gap: 7,
    paddingVertical: 3,
  },
  guidanceLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.35,
  },
  guidanceText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  guidanceRule: {
    marginTop: 15,
    marginBottom: 15,
  },
  momentRule: {
    marginTop: 22,
    marginBottom: 18,
  },
  reflectionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    minHeight: 44,
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
  ritualTitle: {
    fontFamily: 'Georgia',
    fontSize: 17,
    lineHeight: 23,
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
    justifyContent: 'flex-end',
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
    fontSize: 11,
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
  detailHeaderNoTitle: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 44,
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
  natalLink: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 14,
    minHeight: 70,
    paddingHorizontal: 17,
  },
  natalLinkCopy: { gap: 5 },
  natalLinkEyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 8, letterSpacing: 1.4 },
  natalLinkTitle: { fontFamily: 'Georgia', fontSize: 16 },
});
