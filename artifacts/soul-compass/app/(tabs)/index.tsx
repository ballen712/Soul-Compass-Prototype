import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View, Platform, Pressable, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { useRouter, useScrollToTop } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EdgeSwipeBack } from '@/components/EdgeSwipeBack';
import { TabEdgeSwipe } from '@/components/TabEdgeSwipe';
import { TabScreenHeader } from '@/components/TabScreenHeader';
import { CelestialHeader } from '@/components/CelestialHeader';
import { dailyReading } from '@/constants/content';
import { getDailyRituals } from '@/constants/daily-rituals';
import { SCREEN_HORIZONTAL_GUTTER, TAB_SCREEN_SCROLL_BOTTOM_GUTTER } from '@/constants/screen-layout';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/profile/ProfileContext';
import { getDailyPersonalizationContext } from '@/profile/daily-personalization';
import { composeDailyReflection } from '@/profile/daily-reading-composer';
import { useLocalClock } from '@/hooks/useLocalClock';
import { formatAppText, useAppLocale, useAppText } from '@/localization';

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
  'Let one thing be enough today.':
    'An overflowing list can make everything seem equally urgent. This reflection asks you to separate what matters from what is simply making noise. You might finish less and still give the important part of your day better attention.',
  'Notice what is taking center stage.':
    'Sometimes one topic keeps returning—a choice, a conversation, or something you have been putting off. You do not need to obey the loudest demand, but it can help to ask why it is holding your attention. Choose a next step only after you have made that distinction.',
  'Leave room for a useful opening.':
    'A useful opportunity is not always a dramatic invitation. It may be an ordinary question, a new contact, or a chance to test an idea. Stay curious enough to notice it, then check whether it actually fits what you need.',
  'Treat tension as information.':
    'When something rubs you the wrong way, the first feeling is only part of the story. There may be an unmet need, a limit, or a practical problem underneath it. Give yourself a little space to find that part before deciding how to respond.',
  'Notice what is already working.':
    'When things feel easier, it is tempting to move past them without noticing why. A skill, a habit, or support from someone else may be helping. Recognizing that support gives you something practical to return to when another part of the day feels less straightforward.',
  'Let two points of view sit side by side.':
    'Understanding another view does not mean giving up your own. Try separating what each person needs from the solution each person is arguing for. There may be more room to work with than the first disagreement suggests.',
  'Begin with what you know.':
    'You can begin without having the whole answer. Choose a familiar tool, a small routine, or a person you trust, and see what becomes clearer from there. Familiarity is a starting point, not a rule that prevents you from changing course.',
};

const backgroundStars = Array.from({ length: 24 }, (_, index) => ({
  x: ((index * 41 + 19) % 97) / 97,
  y: ((index * 53 + 13) % 101) / 101,
  size: index % 9 === 0 ? 2 : 1.25,
  opacity: 0.25 + (index % 4) * 0.05,
}));

type Detail = {
  title?: string;
  lead?: string;
  body?: string;
  examples: string[];
};

function InfoButton({
  testID,
  label,
  hint,
  color,
  onPress,
}: {
  testID: string;
  label: string;
  hint: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      hitSlop={6}
      onPress={onPress}
      style={styles.infoCircle}
    >
      <Feather name="info" size={15} color={color} />
    </Pressable>
  );
}

export default function CosmosScreen() {
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  useScrollToTop(scrollRef);
  const colors = useColors();
  const t = useAppText();
  const locale = useAppLocale();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const { profile, preferences } = useProfile();
  const router = useRouter();
  const [activeDetail, setActiveDetail] = useState<
    'reflection' | 'focus' | 'caution' | 'moment' | 'ritual' | 'ideas' | null
  >(null);
  const now = useLocalClock();
  const dailyContext = useMemo(
    () => getDailyPersonalizationContext({ profile, preferences, now, locale, translate: t }),
    [profile, preferences, now, locale, t],
  );
  const astrology = dailyContext.astrology;
  const calculatedReading =
    astrology?.status === 'calculated' ? astrology.reading : null;
  const composedReading = useMemo(
    () => calculatedReading
      ? composeDailyReflection({
          baseReading: calculatedReading,
          analysis: dailyContext.transitAnalysis,
          mood: dailyContext.mood,
          now,
          translate: t,
          format: (source, values) => formatAppText(source, locale, values),
        })
      : null,
    [calculatedReading, dailyContext.mood, dailyContext.transitAnalysis, locale, now, t],
  );
  const reading = composedReading ?? calculatedReading ?? dailyReading;
  const readingBody = composedReading?.body ?? (() => {
    const transitBody = /^Today highlights (.+?)\. (.+)$/.exec(reading.body);
    if (transitBody) {
      return formatAppText('Today highlights {theme}. {explanation}', locale, {
        theme: t(transitBody[1]),
        explanation: t(transitBody[2]),
      });
    }
    const natalBody = /^Your (.+) (sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto) themes offer a starting point for noticing what feels familiar\. You still choose the direction\.$/i.exec(reading.body);
    if (natalBody) {
      const planet = natalBody[2].charAt(0).toUpperCase() + natalBody[2].slice(1).toLowerCase();
      return formatAppText('Your {sign} {planet} themes offer a starting point for noticing what feels familiar. You still choose the direction.', locale, {
        sign: t(natalBody[1]),
        planet: t(planet),
      });
    }
    return t(reading.body);
  })();
  const ritualChoices = getDailyRituals(now, 4);
  const dailyRitual = ritualChoices[0] ?? 'Take three easy breaths before beginning a task.';
  const pageWidth = Math.min(windowWidth - SCREEN_HORIZONTAL_GUTTER * 2, 480);
  const heroBleed = Math.max(0, (windowWidth - pageWidth) / 2);
  const heroHeight = Math.round(windowHeight * 0.42);
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const detail: Detail | null = activeDetail === 'reflection'
    ? {
        title: reading.title,
        body: reflectionExplanations[reading.title] ??
          'This reading is one way to think about the day’s theme and how it might connect with your life. It is not a prediction or instruction. Keep what feels useful and leave the rest.',
        examples: [],
      }
    : activeDetail === 'focus'
      ? {
          lead: reading.favorableFocus,
          body: 'Today’s focus points to something that may feel easier to begin, understand, or move forward. It is not a promise that everything will go smoothly. Choose one useful step and give it your attention; you do not have to finish everything at once.',
          examples: [],
        }
      : activeDetail === 'caution'
        ? {
            lead: reading.gentleCaution,
            body: 'This is a gentle nudge to give one kind of task more time or space, not a warning or a rule. If it can wait, come back to it when you have more time or clarity. If it cannot wait, take it in smaller steps and avoid adding extra pressure.',
            examples: [],
          }
    : activeDetail === 'moment'
      ? {
            lead: reading.reflection,
          body: 'This prompt connects today’s reflection with something real in your life. Think of a task, conversation, or choice that brings the theme to mind. You can sit with the question, write a few words, or leave it unanswered. There is no right answer and no need to act right away.',
          examples: [],
        }
        : activeDetail === 'ritual'
        ? {
              lead: dailyRitual,
              body: 'A small ritual is a brief pause that can help bring your attention back to the present. Try it once in a way that feels comfortable. It is an invitation, not another task you need to get right.',
              examples: [],
            }
          : activeDetail === 'ideas'
            ? {
          examples: ritualChoices.slice(1),
          }
        : null;

  return (
    <TabEdgeSwipe tabIndex={0} testID="tab-edge-swipe-cosmos">
    <SafeAreaView
      edges={[]}
      style={[
        styles.safeArea,
        { backgroundColor: colors.cosmos.homeBackground },
      ]}
    >
      <StatusBar style={colors.mode === 'dark' ? 'light' : 'dark'} />
      <View
        pointerEvents="none"
        accessible={false}
        testID="cosmos-background-stars"
        style={styles.starLayer}
      >
        {backgroundStars.map((star, index) => (
          <View
            key={index}
            style={[
              styles.starDot,
              {
                 backgroundColor: colors.cosmos.star,
                height: star.size,
                left: `${star.x * 100}%`,
                opacity: star.opacity,
                top: `${star.y * 100}%`,
                width: star.size,
              },
            ]}
          />
        ))}
      </View>
      <ScrollView
        ref={scrollRef}
        testID="cosmos-main-scroll"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === 'ios' ? 18 : topInset + 18 },
        ]}
        alwaysBounceVertical={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : 'never'}
        overScrollMode="never"
        accessibilityLabel={t('Daily reflection')}
      >
        <View style={styles.page}>
          <CelestialHeader
            width={windowWidth}
            testID="cosmos-celestial-header"
            height={heroHeight}
            style={{
              top: -(topInset + 18),
              left: -heroBleed,
              right: -heroBleed,
            }}
          />
          <TabScreenHeader
            title="Today’s reflection"
            titleColor={colors.cosmos.foreground}
            afterSpacing={23}
          />

          <View
            testID="cosmos-day-card"
            style={[
              styles.readingCard,
              {
                backgroundColor: colors.cosmos.card,
                borderColor: colors.cosmos.border,
              },
            ]}
          >
            <View style={styles.reflectionPrompt}>
              <View style={styles.readingHeadingRow} testID="cosmos-heading-reflection">
                <View style={styles.readingHeadingCopy}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setActiveDetail('reflection')}
                    style={styles.reflectionCopy}
                  >
                    <Text
                      style={[
                        styles.readingTitle,
                        { color: colors.cosmos.foreground },
                      ]}
                    >
                      {t(reading.title)}
                    </Text>
                    <Text
                      style={[
                        styles.readingBody,
                        { color: colors.cosmos.mutedForeground },
                      ]}
                    >
                      {readingBody}
                    </Text>
                  </Pressable>
                </View>
                <InfoButton
                  testID="cosmos-info-reflection"
                  label={t('Read more about today’s reflection')}
                  hint={t('Opens a simple explanation of the daily reading')}
                  color={colors.cosmos.secondary}
                  onPress={() => setActiveDetail('reflection')}
                />
              </View>
            </View>
            {astrology?.status === 'unavailable' ? (
              <Text style={[styles.calculationNote, { color: colors.cosmos.mutedForeground }]}>
                {t('Your personal reading isn’t available right now. Check your saved details in Settings.')}
              </Text>
            ) : !calculatedReading ? (
              <Text style={[styles.calculationNote, { color: colors.cosmos.mutedForeground }]}>
                {t(dailyReading.status)}
              </Text>
            ) : null}
            {profile && !profile.currentResidence ? (
              <Pressable
                testID="cosmos-add-current-residence"
                accessibilityRole="button"
                accessibilityLabel={t('Add current residence for your daily reflection →')}
                onPress={() => router.push({
                  pathname: '/settings',
                  params: { section: 'profile', focus: 'current-residence' },
                })}
              >
                <Text style={[styles.factorSummary, { color: colors.cosmos.secondary, paddingVertical: 12 }]}>
                  {t('Add current residence for your daily reflection →')}
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
                <View style={styles.guidanceHeading} testID="cosmos-heading-focus">
                  <Text style={[styles.guidanceLabel, { color: colors.cosmos.secondary }]}>
                    {t('Focus for today')}
                  </Text>
                  <InfoButton
                    testID="cosmos-info-focus"
                    label={t('Read more about today’s focus')}
                    hint={t('Opens a deeper note about the daily focus')}
                    color={colors.cosmos.secondary}
                    onPress={() => setActiveDetail('focus')}
                  />
                </View>
                <Text style={[styles.guidanceText, { color: colors.cosmos.foreground }]}>
                  {t(reading.favorableFocus)}
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
                <View style={styles.guidanceHeading} testID="cosmos-heading-caution">
                  <Text style={[styles.guidanceLabel, { color: colors.cosmos.secondary }]}>
                    {t('What to leave for later')}
                  </Text>
                  <InfoButton
                    testID="cosmos-info-caution"
                    label={t('Read more about what to leave for later')}
                    hint={t('Opens a gentle note about what can wait')}
                    color={colors.cosmos.secondary}
                    onPress={() => setActiveDetail('caution')}
                  />
                </View>
                <Text style={[styles.guidanceText, { color: colors.cosmos.foreground }]}>
                  {t(reading.gentleCaution)}
                </Text>
              </View>

            <View
              style={[
                styles.cardRule,
                styles.momentRule,
                { backgroundColor: colors.cosmos.border },
              ]}
            />
            <View style={styles.reflectionSection}>
              <View style={styles.guidanceHeading} testID="cosmos-heading-moment">
                <Text style={[styles.guidanceLabel, { color: colors.cosmos.secondary }]}>
                  {t('A moment to keep')}
                </Text>
                <InfoButton
                  testID="cosmos-info-moment"
                  label={t('Read more about A moment to keep')}
                  hint={t('Opens a simple explanation')}
                  color={colors.cosmos.secondary}
                  onPress={() => setActiveDetail('moment')}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityHint={t('Opens a simple explanation')}
                onPress={() => setActiveDetail('moment')}
                style={styles.reflectionCopy}
              >
                <Text
                  style={[
                    styles.reflectionText,
                    { color: colors.cosmos.foreground },
                  ]}
                >
                  “{t(reading.reflection)}”
                </Text>
              </Pressable>
            </View>
            <View
              style={[
                styles.cardRule,
                styles.ritualRule,
                { backgroundColor: colors.cosmos.border },
              ]}
            />
            <View style={styles.ritualSection}>
              <View style={styles.guidanceHeading} testID="cosmos-heading-ritual">
                <Text style={[styles.guidanceLabel, { color: colors.cosmos.secondary }]}>
                  {t('A small daily ritual')}
                </Text>
                <InfoButton
                  testID="cosmos-info-ritual"
                  label={t('Read more about today’s ritual')}
                  hint={t('Opens a note about the purpose of the ritual')}
                  color={colors.cosmos.secondary}
                  onPress={() => setActiveDetail('ritual')}
                />
              </View>
              <Text style={[styles.ritualAction, { color: colors.cosmos.foreground }]}>
                {t(dailyRitual)}
              </Text>
              <Pressable
                testID="cosmos-ritual-ideas"
                accessibilityRole="button"
                accessibilityLabel={t('Explore other daily ritual ideas')}
                accessibilityHint={t('Opens practical examples')}
                onPress={() => setActiveDetail('ideas')}
                style={({ pressed }) => [
                  styles.ritualButton,
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Text style={[styles.ritualButtonText, { color: colors.cosmos.secondary }]}>
                  {t('Explore other ideas')}
                </Text>
                <Feather name="chevron-right" size={16} color={colors.cosmos.secondary} />
              </Pressable>
            </View>
          </View>

        </View>
      </ScrollView>
      <Modal
        visible={detail !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDetail(null)}
      >
        <EdgeSwipeBack
          testID="cosmos-explanation-edge-swipe-back"
          onBack={() => setActiveDetail(null)}
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
              { backgroundColor: colors.scrim },
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
                    {t(detail.title)}
                  </Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('Close explanation')}
                  hitSlop={8}
                  onPress={() => setActiveDetail(null)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={22} color={colors.cosmos.secondary} />
                </Pressable>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailScrollContent}
              >
                {detail.lead ? (
                  <Text style={[styles.detailLead, { color: colors.cosmos.foreground }]}>
                    {t(detail.lead)}
                  </Text>
                ) : null}
                {detail.body ? (
                  <Text style={[styles.detailBody, { color: colors.cosmos.mutedForeground }]}>
                    {t(detail.body)}
                  </Text>
                ) : null}
                {detail.examples.map((example) => (
                  <View key={example} testID="daily-ritual-option" style={styles.exampleRow}>
                    <View style={[styles.exampleMark, { backgroundColor: colors.cosmos.secondary }]} />
                    <Text style={[styles.exampleText, { color: colors.cosmos.foreground }]}>
                      {t(example)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </SafeAreaView>
        </EdgeSwipeBack>
      </Modal>
    </SafeAreaView>
    </TabEdgeSwipe>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: SCREEN_HORIZONTAL_GUTTER,
    paddingBottom: TAB_SCREEN_SCROLL_BOTTOM_GUTTER,
  },
  page: {
    width: '100%',
    maxWidth: 480,
  },
  starLayer: {
    ...StyleSheet.absoluteFill,
  },
  starDot: {
    borderRadius: 2,
    position: 'absolute',
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 19,
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
    gap: 4,
  },
  readingHeadingCopy: {
    flex: 1,
  },
  infoCircle: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
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
    marginTop: 18,
    marginBottom: 16,
  },
  guidanceSection: {
    gap: 4,
    paddingVertical: 0,
  },
  guidanceHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 42,
  },
  guidanceLabel: {
    flex: 1,
    fontFamily: 'Georgia',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  guidanceText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  guidanceRule: {
    marginTop: 10,
    marginBottom: 10,
  },
  momentRule: {
    marginTop: 14,
    marginBottom: 12,
  },
  reflectionSection: {
    gap: 2,
  },
  reflectionCopy: {
    alignSelf: 'stretch',
    paddingTop: 1,
    paddingBottom: 2,
  },
  reflectionText: {
    fontFamily: 'Georgia',
    fontSize: 18,
    lineHeight: 27,
  },
  ritualRule: {
    marginTop: 14,
    marginBottom: 10,
  },
  ritualSection: {
    gap: 0,
  },
  ritualAction: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
  },
  ritualButton: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 5,
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingRight: 10,
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
  },
  detailCard: {
    alignSelf: 'center',
    borderRadius: 26,
    borderWidth: 1,
    maxHeight: '84%',
    maxWidth: 480,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 16,
    width: '100%',
  },
  detailHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    minHeight: 38,
    paddingRight: 42,
    position: 'relative',
  },
  detailHeaderNoTitle: {
    minHeight: 32,
  },
  detailTitle: {
    flex: 1,
    fontFamily: 'Georgia',
    fontSize: 22,
    lineHeight: 28,
  },
  closeButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: -10,
    top: -10,
    width: 44,
  },
  detailScrollContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  detailBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  detailLead: {
    fontFamily: 'Georgia',
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 10,
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
});
