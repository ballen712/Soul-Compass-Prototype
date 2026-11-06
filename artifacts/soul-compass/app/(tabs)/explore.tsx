import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useScrollToTop } from 'expo-router';
import React, { useRef } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabEdgeSwipe } from '@/components/TabEdgeSwipe';
import { TabScreenHeader } from '@/components/TabScreenHeader';
import { SCREEN_HORIZONTAL_GUTTER } from '@/constants/screen-layout';
import { screenTypography } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { useAppText } from '@/localization';
import cosmosArt from '../../assets/images/cosmos-starfield.jpg';

const backgroundStars = Array.from({ length: 24 }, (_, index) => ({
  x: ((index * 41 + 19) % 97) / 97,
  y: ((index * 53 + 13) % 101) / 101,
  size: index % 9 === 0 ? 2 : 1.25,
  opacity: 0.25 + (index % 4) * 0.05,
}));

const features = [
  {
    id: 'tarot',
    title: 'Tarot',
    icon: 'moon' as const,
    description: 'Start with one card for a question on your mind. Larger spreads can come later.',
  },
  {
    id: 'transits',
    title: 'Long-term transits',
    icon: 'activity' as const,
    description: 'Follow longer planetary cycles and how their themes may connect with your chart.',
  },
  {
    id: 'life-directions',
    title: 'Life Directions',
    icon: 'compass' as const,
    description: 'Explore work styles, strengths, and interests that may feel natural to you.',
  },
];

export default function ExploreScreen() {
  const colors = useColors();
  const t = useAppText();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  useScrollToTop(scrollRef);

  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const pageWidth = Math.min(windowWidth - 48, 480);
  const heroBleed = Math.max(0, (windowWidth - pageWidth) / 2);
  const heroHeight = Math.round(windowHeight * 0.38);

  return (
    <TabEdgeSwipe tabIndex={3} testID="tab-edge-swipe-explore">
      <SafeAreaView edges={[]} style={[styles.safeArea, { backgroundColor: colors.cosmos.homeBackground }]}>
        <StatusBar style="light" />
        <View pointerEvents="none" accessible={false} style={styles.starLayer}>
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
                  top: `${star.y * 100}%`,
                  width: star.size,
                },
              ]}
            />
          ))}
        </View>
        <ScrollView
          ref={scrollRef}
          testID="explore-main-scroll"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Platform.OS === 'ios' ? 18 : topInset + 18,
              paddingBottom: Math.max(insets.bottom, 34) + 48,
            },
          ]}
          alwaysBounceVertical={false}
          bounces={false}
          contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : 'never'}
          showsVerticalScrollIndicator={false}
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

            <TabScreenHeader
              title="Explore"
              titleColor={colors.cosmos.foreground}
              subtitleColor={colors.cosmos.mutedForeground}
              subtitle="More ways to reflect, at your pace."
              afterSpacing={28}
            />

            <Text style={[styles.sectionLabel, { color: colors.cosmos.secondary }]}>
              {t('IN DEVELOPMENT')}
            </Text>
            <Text style={[styles.intro, { color: colors.cosmos.mutedForeground }]}>
              {t('Tarot, longer-term transits, and Life Directions are planned for this space. Your daily Cosmos, Crystals, and Natal Chart stay just as they are.')}
            </Text>

            <View style={styles.featureList}>
              {features.map((feature) => (
                <View
                  key={feature.id}
                  testID={`explore-feature-${feature.id}`}
                  accessibilityLabel={`${t(feature.title)}, ${t('PLANNED')}`}
                  style={[
                    styles.featureCard,
                    { backgroundColor: colors.cosmos.card, borderColor: colors.cosmos.border },
                  ]}
                >
                  <View style={styles.featureHeader}>
                    <View style={[styles.featureIcon, { backgroundColor: colors.cosmos.surface }]}>
                      <Feather name={feature.icon} size={18} color={colors.cosmos.secondary} />
                    </View>
                    <View style={styles.featureTitleGroup}>
                      <Text style={[styles.featureTitle, { color: colors.cosmos.foreground }]}>
                        {t(feature.title)}
                      </Text>
                      <Text style={[styles.featureStatus, { color: colors.cosmos.secondary }]}>
                        {t('PLANNED')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.featureDescription, { color: colors.cosmos.mutedForeground }]}>
                    {t(feature.description)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TabEdgeSwipe>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  starLayer: { ...StyleSheet.absoluteFill },
  starDot: { borderRadius: 2, position: 'absolute' },
  heroArt: { overflow: 'hidden', position: 'absolute' },
  heroImage: { height: '100%', position: 'absolute', top: 0, width: '100%' },
  heroFade: { ...StyleSheet.absoluteFill },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: SCREEN_HORIZONTAL_GUTTER,
    paddingBottom: 34,
  },
  page: { width: '100%', maxWidth: 480 },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  intro: {
    ...screenTypography.body,
    marginBottom: 20,
  },
  featureList: { gap: 12 },
  featureCard: {
    borderWidth: 1,
    borderRadius: 24,
    gap: 14,
    padding: 18,
  },
  featureHeader: { alignItems: 'center', flexDirection: 'row', gap: 13 },
  featureIcon: { alignItems: 'center', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  featureTitleGroup: { flex: 1, gap: 4 },
  featureTitle: { fontFamily: 'Georgia', fontSize: 20 },
  featureStatus: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.2 },
  featureDescription: { ...screenTypography.body },
});
