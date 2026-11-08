import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useScrollToTop } from 'expo-router';
import { ActivityIndicator, FlatList, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
} from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { EdgeSwipeBack } from '@/components/EdgeSwipeBack';
import { TabEdgeSwipe } from '@/components/TabEdgeSwipe';
import {
  crystalCatalog,
  type Crystal,
  type StoneTone,
} from '@/constants/content';
import { useColors } from '@/hooks/useColors';
import { screenTypography } from '@/constants/typography';
import { useProfile } from '@/profile/ProfileContext';
import { getLocalizedCrystalCopy, type CrystalLocale, type LocalizedCrystalCopy } from '@/localization/crystal-copy';
import { useAppLocale, useAppText } from '@/localization';
import {
  calculateNatalElementBalance,
  getCrystalSuggestions,
  getHomeLocalDate,
  getNatalCrystalSuggestions,
} from '@/profile/astrology';
import { FEELING_OPTIONS } from '@/profile/crystal-guidance';
import { getDailyAstrology } from '@/profile/daily-cache';
import { useLocalClock } from '@/hooks/useLocalClock';

import { TabScreenHeader } from '@/components/TabScreenHeader';
import { CelestialHeader } from '@/components/CelestialHeader';
import { SCREEN_HORIZONTAL_GUTTER, TAB_SCREEN_SCROLL_BOTTOM_GUTTER } from '@/constants/screen-layout';

const slugOf = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const MAX_CRYSTAL_IMAGE_ZOOM = 3.5;
const CRYSTAL_IMAGE_ZOOM_RESET_DURATION = 160;
const AnimatedCrystalImage = Animated.createAnimatedComponent(Image);
const AnimatedCrystalArtworkFrame = Animated.createAnimatedComponent(View);

function localizeCrystal(crystal: Crystal, locale: CrystalLocale): LocalizedCrystalCopy {
  return getLocalizedCrystalCopy(crystal.name, locale) ?? {
    name: crystal.name,
    note: crystal.note,
    description: crystal.description,
    guideDescription: crystal.guideDescription,
    specimenDescription: crystal.specimenDescription,
  };
}

function formatCopy(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

const stoneToneColors: Record<StoneTone, { background: string; foreground: string }> = {
  violet: { background: '#2E2840', foreground: '#D0B7F0' },
  blue: { background: '#223544', foreground: '#9CCBDE' },
  green: { background: '#293A32', foreground: '#A9CCA9' },
  pink: { background: '#432D3B', foreground: '#E9B4C7' },
  red: { background: '#442E2A', foreground: '#E2A28B' },
  gold: { background: '#453A28', foreground: '#E9CB84' },
  clear: { background: '#3A3D42', foreground: '#D9E0E4' },
  earth: { background: '#40372D', foreground: '#CBB797' },
  dark: { background: '#252C33', foreground: '#B5C1C8' },
};

function CrystalArtwork({ crystal, size, detailSize }: {
  crystal: Crystal;
  size: 'feature' | 'alternative' | 'catalog' | 'detail';
  detailSize?: number;
}) {
  const tone = stoneToneColors[crystal.tone];
  const locale = useAppLocale();
  const t = useAppText();
  const copy = localizeCrystal(crystal, locale);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const responsiveDetailStyle = size === 'detail' && detailSize !== undefined
    ? { width: detailSize, height: detailSize, alignSelf: 'center' as const }
    : null;
  const zoomScale = useSharedValue(1);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const zoomLayerStyle = useAnimatedStyle(() => ({
    elevation: zoomScale.value > 1.01 ? 20 : 0,
    zIndex: zoomScale.value > 1.01 ? 20 : 0,
  }));
  const zoomStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: zoomScale.value },
      { translateX: panX.value },
      { translateY: panY.value },
    ],
  }));
  const pinchGesture = usePinchGesture({
    onUpdate: ({ scale }) => {
      zoomScale.value = Math.min(MAX_CRYSTAL_IMAGE_ZOOM, Math.max(1, scale));
    },
    onFinalize: () => {
      zoomScale.value = withTiming(1, { duration: CRYSTAL_IMAGE_ZOOM_RESET_DURATION });
      panX.value = withTiming(0, { duration: CRYSTAL_IMAGE_ZOOM_RESET_DURATION });
      panY.value = withTiming(0, { duration: CRYSTAL_IMAGE_ZOOM_RESET_DURATION });
    },
  });
  const panGesture = usePanGesture({
    minPointers: 2,
    maxPointers: 2,
    onUpdate: ({ translationX, translationY }) => {
      const scale = zoomScale.value;
      if (scale <= 1.01) return;
      panX.value = Math.min(screenWidth, Math.max(-screenWidth, translationX));
      panY.value = Math.min(screenHeight, Math.max(-screenHeight, translationY));
    },
  });
  const artworkGesture = useSimultaneousGestures(pinchGesture, panGesture);
  const imageStyle = size === 'feature'
    ? styles.featureImage
    : size === 'alternative'
      ? styles.alternativeImage
      : size === 'catalog'
        ? styles.catalogImage
        : styles.detailImage;
  const imageShapeStyle = size === 'feature'
    ? styles.featureArtworkCorners
    : size === 'detail'
      ? styles.detailArtworkCorners
      : styles.tileArtworkCorners;
  if (crystal.image !== undefined) {
    return (
      <GestureDetector gesture={artworkGesture}>
        <AnimatedCrystalArtworkFrame
          testID={`crystal-artwork-frame-${slugOf(crystal.name)}-${size}`}
          style={[imageStyle, responsiveDetailStyle, styles.artworkViewport, zoomLayerStyle]}
          collapsable={false}
        >
          <AnimatedCrystalImage
            testID={`crystal-artwork-${slugOf(crystal.name)}-${size}`}
            source={crystal.image}
            style={[styles.artworkImage, imageShapeStyle, zoomStyle]}
            resizeMode={size === 'detail' ? 'contain' : 'cover'}
            accessibilityLabel={formatCopy(t('{stone} stone illustration'), { stone: copy.name })}
            collapsable={false}
          />
        </AnimatedCrystalArtworkFrame>
      </GestureDetector>
    );
  }
  return (
    <View
      accessibilityLabel={formatCopy(t('{stone} stone illustration'), { stone: copy.name })}
      style={[
        size === 'feature'
          ? styles.featureImage
          : size === 'detail'
            ? styles.detailImage
            : size === 'catalog'
              ? styles.catalogImage
              : styles.alternativeImage,
        responsiveDetailStyle,
        styles.genericStoneArt,
        { backgroundColor: tone.background },
      ]}
    >
      <Feather
        name="hexagon"
        size={size === 'feature' ? 76 : size === 'detail' ? 68 : 35}
        color={tone.foreground}
      />
      {size === 'feature' ? (
        <Text style={[styles.artworkCaption, { color: tone.foreground }]}>{t('SYMBOLIC ILLUSTRATION')}</Text>
      ) : null}
    </View>
  );
}

function CollectionToggle({ name }: { name: string }) {
  const colors = useColors();
  const c = colors.cosmos;
  const locale = useAppLocale();
  const t = useAppText();
  const displayName = getLocalizedCrystalCopy(name, locale)?.name ?? name;
  const { preferences, toggleCrystal } = useProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slug = slugOf(name);
  const inCollection = preferences.crystalCollection.includes(slug);
  async function toggle() {
    if (busy) return;
    setBusy(true); setError(null);
    try { await toggleCrystal(slug); }
    catch { setError(t('Could not update your collection on this device.')); }
    finally { setBusy(false); }
  }
  const label = inCollection ? t('In Your Collection') : t('Add to Collection');
  return (
    <View style={styles.collectWrap}>
      <Pressable testID={`collect-${slug}`} accessibilityRole="switch" accessibilityLabel={`${displayName}: ${label}`} accessibilityState={{ checked: inCollection, disabled: busy, busy }} disabled={busy} onPress={toggle}
        style={[styles.collectButton, { borderColor: c.border }, inCollection && { backgroundColor: c.secondary, borderColor: c.secondary }]}>
        {busy ? <ActivityIndicator size="small" color={c.secondary} /> : <Feather name={inCollection ? 'check' : 'plus'} size={11} color={inCollection ? c.homeBackground : c.secondary} />}
        <Text style={[styles.collectText, { color: inCollection ? c.homeBackground : c.secondary }]}>{label}</Text>
      </Pressable>
      {error ? <Text style={[styles.collectError, { color: colors.destructive }]}>{error}</Text> : null}
    </View>
  );
}

function HiddenNote({ count }: { count: number }) {
  const colors = useColors();
  const t = useAppText();
  if (count === 0) return null;
  const copy = count === 1
    ? formatCopy(t('{count} stone is hidden. You can restore hidden stones in Settings.'), { count })
    : formatCopy(t('{count} stones are hidden. You can restore hidden stones in Settings.'), { count });
  return (
    <View style={[styles.hiddenNote, { borderColor: colors.crystals.border, backgroundColor: colors.crystals.card }]}>
      <Feather name="eye-off" size={13} color={colors.crystals.secondary} />
      <Text style={[styles.hiddenText, { color: colors.crystals.mutedForeground }]}>
        {copy}
      </Text>
    </View>
  );
}

function describeElementBalance(
  balance: Extract<ReturnType<typeof calculateNatalElementBalance>, { status: 'calculated' }>,
  suggestionCount: number,
  t: (source: string) => string,
) {
  if (balance.dominant.length === 4) {
    return formatCopy(t('Looking at {total} reliable planetary placements in your chart, the four elements are fairly balanced. These {count} suggestions connect with qualities in your birth chart.'), {
      total: balance.total,
      count: suggestionCount,
    });
  }
  const join = (elements: string[]) => {
    const translated = elements.map((element) => t(element));
    return translated.length < 2
      ? translated[0] ?? ''
      : formatCopy(t('{theme1} and {theme2}'), {
        theme1: translated[0],
        theme2: translated.slice(1).join(t(', ')),
      });
  };
  return formatCopy(t('Looking at {total} reliable planetary placements, your chart shows more {dominant} and fewer {least} placements. These {count} suggestions connect with qualities in your birth chart.'), {
    total: balance.total,
    dominant: join(balance.dominant),
    least: join(balance.leastRepresented),
    count: suggestionCount,
  });
}

export default function CrystalsScreen() {
  const colors = useColors();
  const locale = useAppLocale();
  const t = useAppText();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const detailImageSize = Math.max(1, Math.min(320, windowWidth - 56, windowHeight * 0.34));
  const pageWidth = Math.min(windowWidth - SCREEN_HORIZONTAL_GUTTER * 2, 480);
  const heroBleed = Math.max(0, (windowWidth - pageWidth) / 2);
  const heroHeight = Math.round(windowHeight * 0.42);
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const { preferences, profile, savePreferences } = useProfile();
  const [guideOpen, setGuideOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [collectionSearch, setCollectionSearch] = useState('');
  const [selectedCollectionStone, setSelectedCollectionStone] = useState<Crystal | null>(null);
  const [feelingPickerOpen, setFeelingPickerOpen] = useState(false);
  const [feelingSaving, setFeelingSaving] = useState(false);
  const [feelingSaveError, setFeelingSaveError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  useScrollToTop(scrollRef);
  const collectionListRef = useRef<FlatList<Crystal> | null>(null);
  const collectionScrollOffsetRef = useRef(0);
  const restoreCollectionIndexRef = useRef<number | null>(null);
  const restoreCollectionRetryCountRef = useRef(0);
  const collectionListViewportHeightRef = useRef(0);
  const pendingCatalogStoneRef = useRef<Crystal | null>(null);
  const pendingCatalogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const now = useLocalClock();
  const router = useRouter();
  const hidden = preferences.crystalPreferences.hiddenCrystals;
  const selectedFeeling = FEELING_OPTIONS.find(
    (option) => option.id === preferences.crystalPreferences.feeling,
  );
  const chooseFeeling = async (id: string) => {
    if (feelingSaving) return;
    const feeling = preferences.crystalPreferences.feeling === id ? null : id;
    setFeelingSaving(true);
    setFeelingSaveError(null);
    try {
      await savePreferences({
        ...preferences,
        crystalPreferences: { ...preferences.crystalPreferences, feeling },
      });
      setFeelingPickerOpen(false);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch {
      setFeelingSaveError(t('That change could not be saved on this device. Please try again.'));
    } finally {
      setFeelingSaving(false);
    }
  };
  const translateStoneName = (name: string) =>
    getLocalizedCrystalCopy(name, locale)?.name ?? name;
  const natalElementResult = useMemo(
    () => profile ? calculateNatalElementBalance(profile) : null,
    [profile],
  );
  const natalStoneSuggestions = useMemo(
    () => natalElementResult?.status === 'calculated'
      ? getNatalCrystalSuggestions(natalElementResult, hidden, 8, t, translateStoneName)
      : [],
    [natalElementResult, hidden, t, locale],
  );
  const astrology = useMemo(
    () => (profile ? getDailyAstrology(profile, now) : null),
    [profile, now],
  );
  const crystalSuggestions = useMemo(
    () => getCrystalSuggestions(
      astrology?.status === 'calculated' ? astrology : undefined,
      {
        hiddenCrystals: preferences.crystalPreferences.hiddenCrystals,
        feeling: preferences.crystalPreferences.feeling,
        dateKey: profile
          ? getHomeLocalDate(now, profile.currentResidence ?? profile.birthPlace)
          : `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
      },
      3,
      t,
      translateStoneName,
    ),
    [astrology, preferences.crystalPreferences, now, t, locale],
  );
  const recommendation = crystalSuggestions[0] ?? null;
  const catalog = crystalCatalog;
  const alternativeCandidates = crystalSuggestions.length > 0
    ? crystalSuggestions.slice(1)
    : [];
  const visibleAlternatives = alternativeCandidates
    .filter((suggestion) =>
      suggestion.crystal.name !== recommendation?.crystal.name
      && !hidden.includes(slugOf(suggestion.crystal.name)),
    )
    .slice(0, 2);
  const catalogMatches = useMemo(() => {
    const query = collectionSearch.trim().toLocaleLowerCase();
    return query
      ? catalog.filter((crystal) =>
        `${crystal.name} ${crystal.note} ${crystal.specimenDescription} ${Object.values(localizeCrystal(crystal, locale)).join(' ')}`
          .toLocaleLowerCase()
          .includes(query),
      )
      : catalog;
  }, [collectionSearch, catalog, locale]);
  const hiddenCount = catalog.filter((crystal) =>
    hidden.includes(slugOf(crystal.name)),
  ).length;
  const noMatchCopy = astrology?.status === 'calculated'
    ? 'Today’s chart did not give us a clear link to a stone. We will leave the choice open rather than pick one at random.'
    : profile
      ? 'A daily transit match is not available, and your feeling did not give a clear match. We will leave the choice open.'
      : 'Save your birth details or choose how you feel today to get a personal suggestion.';

  const returnToCollection = () => {
    const targetIndex = selectedCollectionStone
      ? catalogMatches.findIndex((stone) => stone.name === selectedCollectionStone.name)
      : -1;
    if (targetIndex >= 0) {
      restoreCollectionIndexRef.current = targetIndex;
      restoreCollectionRetryCountRef.current = 0;
      collectionListRef.current?.scrollToIndex({
        index: targetIndex,
        viewPosition: 0.5,
        animated: false,
      });
    } else {
      restoreCollectionIndexRef.current = null;
      collectionListRef.current?.scrollToOffset({
        offset: collectionScrollOffsetRef.current,
        animated: false,
      });
    }
    setSelectedCollectionStone(null);
  };
  const closeCollection = () => {
    restoreCollectionIndexRef.current = null;
    restoreCollectionRetryCountRef.current = 0;
    collectionScrollOffsetRef.current = 0;
    setSelectedCollectionStone(null);
    setCollectionOpen(false);
  };
  const openPendingCatalogStone = () => {
    const stone = pendingCatalogStoneRef.current;
    if (!stone) return;
    pendingCatalogStoneRef.current = null;
    if (pendingCatalogTimerRef.current) {
      clearTimeout(pendingCatalogTimerRef.current);
      pendingCatalogTimerRef.current = null;
    }
    setCollectionSearch('');
    setSelectedCollectionStone(stone);
    setCollectionOpen(true);
  };
  const openRecommendedStoneInCatalog = (stone: Crystal) => {
    pendingCatalogStoneRef.current = stone;
    setGuideOpen(false);
    if (pendingCatalogTimerRef.current) clearTimeout(pendingCatalogTimerRef.current);
    // onDismiss is reliable on iOS. Keep a fallback for platforms that do not emit it.
    pendingCatalogTimerRef.current = setTimeout(openPendingCatalogStone, 400);
  };
  useEffect(() => () => {
    if (pendingCatalogTimerRef.current) clearTimeout(pendingCatalogTimerRef.current);
  }, []);
  const closeStoneGuide = () => {
    pendingCatalogStoneRef.current = null;
    if (pendingCatalogTimerRef.current) {
      clearTimeout(pendingCatalogTimerRef.current);
      pendingCatalogTimerRef.current = null;
    }
    setGuideOpen(false);
  };

  return (
    <TabEdgeSwipe tabIndex={1} testID="tab-edge-swipe-crystals">
    <SafeAreaView
      edges={[]}
      style={[
        styles.safeArea,
        { backgroundColor: colors.crystals.background },
      ]}
    >
      <StatusBar style={colors.mode === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        ref={scrollRef}
        testID="crystals-main-scroll"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Platform.OS === 'ios' ? 18 : topInset + 18,
          },
        ]}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : 'never'}
        alwaysBounceVertical={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <CelestialHeader
            width={windowWidth}
            height={heroHeight}
            fadeColor={colors.crystals.background}
            testID="crystals-celestial-header"
            style={{
              top: -(topInset + 18),
              left: -heroBleed,
              right: -heroBleed,
            }}
          />
          <TabScreenHeader
            title="The Stone Guide"
            titleColor={colors.crystals.foreground}
            subtitleColor={colors.crystals.mutedForeground}
            subtitle="Find a stone for today."
            afterSpacing={16}
            titleAccessory={
              <Pressable
                testID="stone-guide-info"
                accessibilityRole="button"
                accessibilityLabel={t('About the Stone Guide')}
                accessibilityHint={t('Opens an explanation of daily stone suggestions and your collection')}
                onPress={() => {
                  setGuideOpen(true);
                }}
                style={styles.guideInfoButton}
              >
                <Feather name="info" size={15} color={colors.crystals.secondary} />
              </Pressable>
            }
          />

          <HiddenNote count={hiddenCount} />
          {hiddenCount === catalog.length ? (
            <View style={[styles.hiddenNote, { borderColor: colors.crystals.border, backgroundColor: colors.crystals.card, flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={[styles.hiddenText, { color: colors.crystals.foreground }]}>{t('All stones are hidden. Restore a stone in Settings to see suggestions again.')}</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/settings')}>
                <Text style={[styles.collectText, { color: colors.crystals.secondary, paddingVertical: 12 }]}>{t('Open settings')}</Text>
              </Pressable>
            </View>
          ) : null}
          {!recommendation && hiddenCount < catalog.length ? (
            <View
              testID="no-daily-stone"
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.cosmos.card,
                  borderColor: colors.cosmos.border,
                },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: colors.cosmos.foreground }]}>
                {t('No clear match today')}
              </Text>
              <Text style={[styles.emptyBody, { color: colors.cosmos.mutedForeground }]}>
        {t(noMatchCopy)}
              </Text>
            </View>
          ) : null}
          {recommendation ? (
          <View
            style={[
              styles.featureCard,
              {
                backgroundColor: colors.cosmos.card,
                borderColor: colors.cosmos.border,
              },
            ]}
          >
            <View
              testID="crystal-feature-image-frame"
              style={[
                styles.imageFrame,
                { backgroundColor: colors.crystals.artworkBackdrop },
              ]}
            >
              <CrystalArtwork crystal={recommendation.crystal} size="feature" />
              <View
                style={[
                  styles.imageTag,
                  { backgroundColor: colors.crystals.badgeBackground },
                ]}
              >
                <Text
                  style={[
                    styles.imageTagText,
                    { color: colors.crystals.badgeForeground },
                  ]}
                >
                  {recommendation.basis === 'intention'
                    ? t('INTENTION COMPANION')
                    : recommendation.basis === 'feeling'
                      ? t('FEELING COMPANION')
                      : t('TODAY’S COMPANION')}
                </Text>
              </View>
            </View>
            <View style={styles.featureCopy}>
              <View style={styles.crystalHeadingRow}>
                <View style={styles.crystalNameBlock}>
                  <Text
                    style={[
                      styles.crystalName,
                      { color: colors.cosmos.foreground },
                    ]}
                  >
                    {localizeCrystal(recommendation.crystal, locale).name}
                  </Text>
                  <Text
                    style={[
                      styles.crystalNote,
                      { color: colors.cosmos.secondary },
                    ]}
                  >
                    {localizeCrystal(recommendation.crystal, locale).note}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.crystalDescription,
                  { color: colors.cosmos.mutedForeground },
                ]}
              >
                {recommendation.reason}
              </Text>
              <CollectionToggle name={recommendation.crystal.name} />
            </View>
          </View>
          ) : null}

          {visibleAlternatives.length > 0 ? (
          <>
          <View style={styles.alternativesHeader}>
            <View>
              <Text
                style={[
                  styles.alternativesEyebrow,
                  { color: colors.crystals.mutedForeground },
                ]}
              >
                {t('MORE STONES TO CONSIDER')}
              </Text>
              <Text
                style={[
                  styles.alternativesTitle,
                  { color: colors.crystals.foreground },
                ]}
              >
                {visibleAlternatives.length === 1 ? t('Another companion') : t('Two other companions')}
              </Text>
            </View>
            <Feather
              name="arrow-down-right"
              size={18}
              color={colors.cosmos.secondary}
            />
          </View>

          <View style={styles.alternativesList}>
            {visibleAlternatives.map((suggestion) => (
              <View
                key={suggestion.crystal.name}
                style={[
                  styles.alternativeCard,
                  {
                    backgroundColor: colors.cosmos.card,
                    borderColor: colors.cosmos.border,
                  },
                ]}
              >
                <CrystalArtwork crystal={suggestion.crystal} size="alternative" />
                <View style={styles.alternativeCopy}>
                  <Text
                    style={[
                      styles.alternativeName,
                      { color: colors.cosmos.foreground },
                    ]}
                  >
                    {localizeCrystal(suggestion.crystal, locale).name}
                  </Text>
                  <Text
                    style={[
                      styles.alternativeNote,
                      { color: colors.cosmos.secondary },
                    ]}
                  >
                    {localizeCrystal(suggestion.crystal, locale).note}
                  </Text>
                  <Text style={[styles.alternativeDescription, { color: colors.cosmos.mutedForeground }]}>
                    {suggestion.reason}
                  </Text>
                  <CollectionToggle name={suggestion.crystal.name} />
                </View>
              </View>
            ))}
          </View>
          </>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={formatCopy(t('Explore the full crystal collection, {count} stones'), { count: catalog.length })}
            testID="open-crystal-collection"
            onPress={() => {
              setCollectionSearch('');
              setSelectedCollectionStone(null);
              collectionScrollOffsetRef.current = 0;
              restoreCollectionIndexRef.current = null;
              restoreCollectionRetryCountRef.current = 0;
              setCollectionOpen(true);
            }}
            style={[
              styles.catalogButton,
              {
                backgroundColor: colors.cosmos.card,
                borderColor: colors.cosmos.border,
              },
            ]}
          >
            <View style={styles.catalogButtonIcon}>
              <Feather name="grid" size={17} color={colors.cosmos.secondary} />
            </View>
            <View style={styles.catalogButtonCopy}>
              <Text style={[styles.catalogButtonTitle, { color: colors.cosmos.foreground }]}>
                {t('Explore the full collection')}
              </Text>
              <Text style={[styles.catalogButtonSubtitle, { color: colors.cosmos.mutedForeground }]}>
                {formatCopy(t('{count} stones · Browse images and notes'), { count: catalog.length })}
              </Text>
            </View>
            <Feather name="chevron-right" size={19} color={colors.cosmos.secondary} />
          </Pressable>

          <View
            testID="crystal-feeling-section"
            style={[
              styles.feelingSection,
              {
                backgroundColor: colors.crystals.card,
                borderColor: colors.crystals.border,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                selectedFeeling
                  ? `${t('How are you feeling today?')}: ${t(selectedFeeling.label)}`
                  : t('How are you feeling today?')
              }
              accessibilityState={{ expanded: feelingPickerOpen }}
              testID="crystal-feeling-picker-toggle"
              onPress={() => setFeelingPickerOpen((open) => !open)}
              style={styles.feelingSectionHeader}
            >
              <View style={styles.feelingSectionCopy}>
                <Text style={[styles.feelingSectionTitle, { color: colors.crystals.foreground }]}>
                  {t('How are you feeling today?')}
                </Text>
                {selectedFeeling ? (
                  <Text style={[styles.feelingSelectedLabel, { color: colors.crystals.secondary }]}>
                    {t(selectedFeeling.label)}
                  </Text>
                ) : null}
              </View>
              {feelingSaving ? (
                <ActivityIndicator size="small" color={colors.crystals.secondary} />
              ) : (
                <Feather
                  name={feelingPickerOpen ? 'chevron-up' : 'chevron-down'}
                  size={19}
                  color={colors.crystals.secondary}
                />
              )}
            </Pressable>
            {feelingPickerOpen ? (
              <View style={styles.feelingPickerContent}>
                <Text style={[styles.feelingPickerHint, { color: colors.crystals.mutedForeground }]}>
                  {t('Choose how you feel today, or leave this blank for the usual chart-based suggestions. Your choice resets at midnight on your device. You can change or clear it at any time.')}
                </Text>
                <View style={styles.feelingOptionsGrid}>
                  {FEELING_OPTIONS.map((option) => {
                    const selected = preferences.crystalPreferences.feeling === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected, disabled: feelingSaving }}
                        disabled={feelingSaving}
                        testID={`crystal-feeling-option-${option.id}`}
                        onPress={() => { void chooseFeeling(option.id); }}
                        style={[
                          styles.feelingOption,
                          {
                            backgroundColor: selected ? colors.crystals.background : colors.crystals.card,
                            borderColor: selected ? colors.crystals.secondary : colors.crystals.border,
                          },
                        ]}
                      >
                        <View style={styles.feelingOptionHeader}>
                          <Text style={[styles.feelingOptionTitle, { color: colors.crystals.foreground }]}>
                            {t(option.label)}
                          </Text>
                          {selected ? (
                            <Feather name="check-circle" size={14} color={colors.crystals.secondary} />
                          ) : null}
                        </View>
                        <Text style={[styles.feelingOptionDescription, { color: colors.crystals.mutedForeground }]}>
                          {t(option.description)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {feelingSaveError ? (
                  <Text accessibilityRole="alert" style={[styles.feelingSaveError, { color: colors.destructive }]}>
                    {feelingSaveError}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

        </View>
      </ScrollView>
      <Modal
        visible={guideOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeStoneGuide}
        onDismiss={openPendingCatalogStone}
      >
        <EdgeSwipeBack
          testID="stone-guide-edge-swipe-back"
          onBack={closeStoneGuide}
        >
        <SafeAreaView edges={['top', 'bottom']} style={styles.guideModalStage}>
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.scrim },
            ]}
          />
          <View
            accessibilityViewIsModal
            testID="stone-guide-modal"
            style={[
              styles.guideModalCard,
              {
                backgroundColor: colors.cosmos.card,
                borderColor: colors.cosmos.border,
              },
            ]}
          >
            <View style={styles.guideModalHeader}>
              <Text style={[styles.guideModalTitle, { color: colors.cosmos.foreground }]}>
                {t('About the Stone Guide')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('Close Stone Guide explanation')}
                testID="close-stone-guide"
                hitSlop={10}
                onPress={closeStoneGuide}
                style={styles.guideCloseButton}
              >
                <Feather name="x" size={19} color={colors.cosmos.secondary} />
              </Pressable>
            </View>
            <ScrollView
              testID="stone-guide-scroll"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.guideModalCopy}
            >
              <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                {formatCopy(t('The guide includes {count} stones and gemstone varieties. A day may have one main companion and up to two alternatives, but only when there is a clear match. Some days no stone is suggested. Browse or search the full list in Settings under Your collection.'), { count: crystalCatalog.length })}
              </Text>
              <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                {t('With your saved birth chart and current city, the daily reading uses your chart and today’s geocentric planetary positions. Your city’s time zone sets the local date and daily tie-break; its coordinates do not directly change the stone match. We do not use GPS. You can also choose how you feel today to guide the suggestion. That choice resets at midnight on your device; without a choice, the guide uses the chart alone.')}
              </Text>
              <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                {t('If there is no calculated chart, today’s selected feeling can still guide a suggestion. Without a clear personal match, no stone is shown—we do not fill the space with samples.')}
              </Text>
              <View style={styles.natalGuideSection} testID="natal-stone-recommendations">
                <Text style={[styles.natalStoneSectionTitle, { color: colors.cosmos.foreground }]}>
                  {t('Your birth-chart companions')}
                </Text>
                {natalElementResult?.status === 'calculated' ? (
                  <>
                    <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                      {describeElementBalance(natalElementResult, natalStoneSuggestions.length, t)}
                    </Text>
                    {!natalElementResult.preciseBirthMoment ? (
                      <Text style={[styles.natalStoneMeta, { color: colors.cosmos.secondary }]}>
                        {t('Your birth time is unknown, so placements that could change during that day are left out.')}
                      </Text>
                    ) : null}
                    {natalStoneSuggestions.length > 0 ? (
                      <View style={styles.natalStoneList}>
                        {natalStoneSuggestions.map((suggestion, index) => {
                          const crystalCopy = localizeCrystal(suggestion.crystal, locale);
                          return (
                            <Pressable
                              key={suggestion.crystal.name}
                              accessibilityRole="button"
                              accessibilityLabel={formatCopy(t('Read about {stone}'), { stone: crystalCopy.name })}
                              testID={`natal-stone-${slugOf(suggestion.crystal.name)}`}
                              onPress={() => openRecommendedStoneInCatalog(suggestion.crystal)}
                              style={[
                                styles.natalStoneRow,
                                { borderColor: colors.cosmos.border, backgroundColor: colors.cosmos.surface },
                              ]}
                            >
                              <View style={styles.natalStoneRowTop}>
                                <View
                                  testID={`natal-stone-artwork-${slugOf(suggestion.crystal.name)}`}
                                  style={[
                                    styles.natalStoneArtwork,
                                    { backgroundColor: colors.crystals.imageSurface },
                                  ]}
                                >
                                  <CrystalArtwork crystal={suggestion.crystal} size="catalog" />
                                </View>
                                <View style={styles.natalStoneRowCopy}>
                                  <Text style={[styles.natalStoneName, { color: colors.cosmos.foreground }]}>
                                    {index + 1}. {crystalCopy.name}
                                  </Text>
                                  <Text style={[styles.natalStoneMeta, { color: colors.cosmos.mutedForeground }]}>
                                    {t(suggestion.element)} · {crystalCopy.note}
                                  </Text>
                                </View>
                                <Feather name="chevron-right" size={17} color={colors.cosmos.secondary} />
                              </View>
                              <Text style={[styles.natalStoneReason, { color: colors.cosmos.mutedForeground }]}>
                                {suggestion.reason}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                        {t('The stones you have hidden are left out. Restore some in Settings to see chart-based suggestions.')}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                    {profile
                      ? t(natalElementResult?.message ?? 'A reliable chart summary is not available yet.')
                      : t('Save your birth details to see a local, chart-based list of stones.')}
                  </Text>
                )}
                <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                  {t('These stones are matched to the qualities that stand out in your chart.')}
                </Text>
              </View>
              <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                {t('If you enjoy crystals, use the guide to choose a loose stone or a piece of jewelry—a pendant, ring, or bracelet. Tap “Add to Collection” for stones you already own, so you can see at a glance which companions are already yours.')}
              </Text>
            </ScrollView>
          </View>
        </SafeAreaView>
        </EdgeSwipeBack>
      </Modal>
      <Modal
        visible={collectionOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          if (selectedCollectionStone) returnToCollection();
          else closeCollection();
        }}
      >
        <EdgeSwipeBack
          testID="crystal-catalog-edge-swipe-back"
          onBack={() => {
            if (selectedCollectionStone) returnToCollection();
            else closeCollection();
          }}
        >
        <View
          testID="crystal-collection-stage"
          style={[
            styles.collectionStage,
            {
              backgroundColor: colors.crystals.background,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <View style={styles.collectionHeader}>
            {selectedCollectionStone ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('Back to all stones')}
                testID="back-to-crystal-catalog"
                onPress={returnToCollection}
                style={styles.collectionBackButton}
              >
                  <Feather name="arrow-left" size={15} color={colors.crystals.secondary} />
                <Text style={[styles.collectionBackText, { color: colors.crystals.secondary }]}>{t('All stones')}</Text>
              </Pressable>
            ) : (
              <View style={styles.collectionHeading}>
                <Text style={[styles.collectionTitle, { color: colors.crystals.foreground }]}>
                  {t('The full collection')}
                </Text>
                <Text style={[styles.collectionCount, { color: colors.crystals.mutedForeground }]}>
                  {formatCopy(t('{count} stones to explore'), { count: catalog.length })}
                </Text>
              </View>
            )}
            {selectedCollectionStone ? (
              <Text
                numberOfLines={1}
                style={[styles.collectionDetailHeaderTitle, { color: colors.crystals.foreground }]}
              >
                {localizeCrystal(selectedCollectionStone, locale).name}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Close the full collection')}
              testID="close-crystal-catalog"
              onPress={closeCollection}
              style={styles.collectionCloseButton}
            >
                <Feather name="x" size={18} color={colors.crystals.foreground} />
            </Pressable>
          </View>

          <View style={styles.collectionContentStage}>
          {selectedCollectionStone ? (
            <ScrollView
              style={[
                styles.collectionDetailOverlay,
                { backgroundColor: colors.crystals.background },
              ]}
              contentContainerStyle={styles.collectionDetailContent}
              showsVerticalScrollIndicator={false}
            >
              <CrystalArtwork crystal={selectedCollectionStone} size="detail" detailSize={detailImageSize} />
              <Text style={[styles.collectionSectionLabel, { color: colors.crystals.secondary }]}>
                {t('WHAT IT LOOKS LIKE')}
              </Text>
              <Text style={[styles.collectionDetailBody, { color: colors.crystals.foreground }]}>
                {localizeCrystal(selectedCollectionStone, locale).specimenDescription}
              </Text>
              <Text style={[styles.collectionSectionLabel, { color: colors.crystals.secondary }]}>
                {t('GOOD FOR')}
              </Text>
              <Text style={[styles.collectionDetailBody, { color: colors.crystals.foreground }]}>
                {localizeCrystal(selectedCollectionStone, locale).guideDescription}
              </Text>
              <Text style={[styles.collectionSectionLabel, { color: colors.crystals.secondary }]}>
                {t('GUIDE THEMES')}
              </Text>
              <View style={styles.collectionThemeList}>
                {selectedCollectionStone.themes.map((theme) => (
                  <View
                    key={theme}
                    testID={`collection-theme-${slugOf(theme)}`}
                    style={[
                      styles.collectionThemePill,
                      {
                        backgroundColor: colors.crystals.card,
                        borderColor: colors.crystals.border,
                      },
                    ]}
                  >
                    <Text style={[styles.collectionThemeText, { color: colors.crystals.foreground }]}>
                      {t(theme)}
                    </Text>
                  </View>
                ))}
              </View>
              <CollectionToggle name={selectedCollectionStone.name} />
            </ScrollView>
          ) : null}
          {collectionOpen ? (
            <View
              testID="collection-catalog-background"
              style={[
                styles.collectionListPane,
                selectedCollectionStone ? styles.collectionListHidden : null,
              ]}
              pointerEvents={selectedCollectionStone ? 'none' : 'auto'}
              accessibilityElementsHidden={Boolean(selectedCollectionStone)}
              importantForAccessibility={selectedCollectionStone ? 'no-hide-descendants' : 'auto'}
            >
            <KeyboardAvoidingView
              style={styles.collectionListKeyboard}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View
                style={[
                  styles.collectionSearchWrap,
                  {
                    backgroundColor: colors.crystals.card,
                    borderColor: colors.crystals.border,
                  },
                ]}
              >
                <Feather name="search" size={17} color={colors.crystals.mutedForeground} />
                <TextInput
                  accessibilityLabel={t('Search stones')}
                  testID="crystal-catalog-search"
                  value={collectionSearch}
                  onChangeText={setCollectionSearch}
                  placeholder={t('Search stones or themes')}
                  placeholderTextColor={colors.crystals.mutedForeground}
                  returnKeyType="search"
                  style={[styles.collectionSearchInput, { color: colors.crystals.foreground }]}
                />
              </View>
              <Text style={[styles.collectionResults, { color: colors.crystals.mutedForeground }]}>
                {formatCopy(
                  t(catalogMatches.length === 1 ? '{count} stone' : '{count} stones'),
                  { count: catalogMatches.length },
                )}
              </Text>
              <View
                testID="collection-list-viewport"
                style={styles.collectionListViewport}
                onLayout={(event) => {
                  collectionListViewportHeightRef.current = event.nativeEvent.layout.height;
                }}
              >
                <FlatList
                  ref={collectionListRef}
                  testID="full-crystal-catalog-list"
                  data={catalogMatches}
                  keyExtractor={(stone) => stone.name}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.collectionList}
                  onScroll={(event) => {
                    collectionScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
                  }}
                  scrollEventThrottle={16}
                  onScrollToIndexFailed={(info) => {
                    const targetIndex = restoreCollectionIndexRef.current;
                    if (targetIndex === null || info.index !== targetIndex) return;
                    const averageLength = Math.max(info.averageItemLength, 1);
                    const estimatedOffset = Math.max(
                      0,
                      averageLength * targetIndex
                        - collectionListViewportHeightRef.current / 2
                        + averageLength / 2,
                    );
                    collectionListRef.current?.scrollToOffset({
                      offset: estimatedOffset,
                      animated: false,
                    });
                    if (restoreCollectionRetryCountRef.current >= 3) {
                      restoreCollectionIndexRef.current = null;
                      return;
                    }
                    restoreCollectionRetryCountRef.current += 1;
                    setTimeout(() => {
                      if (restoreCollectionIndexRef.current !== targetIndex) return;
                      collectionListRef.current?.scrollToIndex({
                        index: targetIndex,
                        viewPosition: 0.5,
                        animated: false,
                      });
                    }, 180);
                  }}
                  renderItem={({ item: stone }) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={formatCopy(t('Read about {stone}'), {
                        stone: localizeCrystal(stone, locale).name,
                      })}
                      testID={`catalog-stone-${slugOf(stone.name)}`}
                      onPress={() => setSelectedCollectionStone(stone)}
                      style={[
                        styles.catalogStoneRow,
                        {
                          backgroundColor: colors.crystals.card,
                          borderColor: colors.crystals.border,
                        },
                      ]}
                    >
                      <CrystalArtwork crystal={stone} size="catalog" />
                      <View style={styles.catalogStoneCopy}>
                        <Text style={[styles.catalogStoneName, { color: colors.crystals.foreground }]}>
                          {localizeCrystal(stone, locale).name}
                        </Text>
                        <Text style={[styles.catalogStoneNote, { color: colors.crystals.secondary }]}>
                          {localizeCrystal(stone, locale).note}
                        </Text>
                        <Text
                          numberOfLines={2}
                          style={[styles.catalogStoneDescription, { color: colors.crystals.mutedForeground }]}
                        >
                          {localizeCrystal(stone, locale).specimenDescription}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={colors.crystals.secondary} />
                    </Pressable>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.catalogSeparator} />}
                  ListEmptyComponent={(
                    <Text style={[styles.collectionEmpty, { color: colors.crystals.mutedForeground }]}>
                      {t('No stones match that search. Try a different name or theme.')}
                    </Text>
                  )}
                />
              </View>
            </KeyboardAvoidingView>
            </View>
          ) : null}
          </View>
        </View>
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
  guideInfoButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  guideModalStage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  guideModalCard: {
    alignSelf: 'center',
    borderRadius: 28,
    borderWidth: 1,
    maxHeight: '82%',
    maxWidth: 440,
    padding: 22,
    width: '100%',
  },
  guideModalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  guideModalTitle: {
    flex: 1,
    fontFamily: 'Georgia',
    fontSize: 22,
    marginRight: 12,
  },
  guideCloseButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  guideModalCopy: {
    gap: 15,
    paddingBottom: 2,
  },
  guideModalBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  natalGuideSection: {
    gap: 11,
    marginTop: 3,
  },
  natalStoneSectionTitle: {
    fontFamily: 'Georgia',
    fontSize: 21,
    fontWeight: '400',
    lineHeight: 27,
  },
  natalStoneList: {
    gap: 8,
  },
  natalStoneRow: {
    borderRadius: 15,
    borderWidth: 1,
    gap: 9,
    padding: 12,
  },
  natalStoneRowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
  },
  natalStoneArtwork: {
    borderRadius: 14,
    height: 72,
    width: 72,
  },
  natalStoneRowCopy: {
    flex: 1,
    gap: 4,
  },
  natalStoneName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 19,
  },
  natalStoneMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  natalStoneReason: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
  },
  catalogButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 13,
    marginTop: 24,
    minHeight: 82,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  catalogButtonIcon: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  feelingSection: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    marginTop: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  feelingSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 38,
  },
  feelingSectionCopy: { flex: 1, gap: 3 },
  feelingSectionTitle: {
    fontFamily: 'Georgia',
    fontSize: 18,
    lineHeight: 23,
  },
  feelingSelectedLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 16,
  },
  feelingPickerContent: { gap: 12 },
  feelingPickerHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
  feelingOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feelingOption: {
    borderRadius: 15,
    borderWidth: 1,
    gap: 6,
    minHeight: 88,
    padding: 10,
    width: '48%',
  },
  feelingOptionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'space-between',
  },
  feelingOptionTitle: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
  },
  feelingOptionDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 14,
  },
  feelingSaveError: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  catalogButtonCopy: {
    flex: 1,
    gap: 5,
  },
  catalogButtonTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  catalogButtonSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  collectionStage: {
    flex: 1,
  },
  collectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  collectionHeading: {
    flex: 1,
    gap: 4,
  },
  collectionTitle: {
    fontFamily: 'Georgia',
    fontSize: 24,
    lineHeight: 29,
  },
  collectionCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  collectionBackButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    minHeight: 44,
  },
  collectionBackText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  collectionDetailHeaderTitle: {
    flex: 1,
    fontFamily: 'Georgia',
    fontSize: 18,
    textAlign: 'center',
  },
  collectionContentStage: {
    flex: 1,
    position: 'relative',
  },
  collectionDetailOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  collectionCloseButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  collectionListPane: {
    flex: 1,
    paddingHorizontal: 20,
  },
  collectionListHidden: {
    opacity: 0,
  },
  collectionListKeyboard: {
    flex: 1,
  },
  collectionListViewport: { flex: 1 },
  collectionSearchWrap: {
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  collectionSearchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    minHeight: 46,
  },
  collectionResults: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  collectionList: {
    paddingBottom: 30,
  },
  catalogStoneRow: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 102,
    padding: 10,
  },
  catalogStoneCopy: {
    flex: 1,
    gap: 4,
  },
  catalogStoneName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  catalogStoneNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  catalogStoneDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
  catalogSeparator: {
    height: 10,
  },
  collectionEmpty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    paddingVertical: 24,
  },
  collectionDetailContent: {
    alignSelf: 'center',
    gap: 12,
    maxWidth: 480,
    paddingBottom: 42,
    paddingHorizontal: 22,
    paddingTop: 8,
    width: '100%',
  },
  collectionSectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 1.1,
    marginTop: 6,
  },
  collectionDetailBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 23,
  },
  collectionThemeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  collectionThemePill: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  collectionThemeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 17,
  },
  collectionDisclaimer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },
  featureCard: {
    borderRadius: 28,
    borderWidth: 1,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  emptyTitle: {
    fontFamily: 'Georgia',
    fontSize: 21,
    fontWeight: '400',
    lineHeight: 27,
  },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  imageFrame: {
    height: 226,
    position: 'relative',
    width: '100%',
  },
  artworkViewport: {
    overflow: 'visible',
    position: 'relative',
  },
  artworkImage: {
    height: '100%',
    width: '100%',
  },
  featureArtworkCorners: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  detailArtworkCorners: {
    borderRadius: 20,
  },
  tileArtworkCorners: {
    borderRadius: 13,
  },
  featureImage: {
    height: '100%',
    width: '100%',
  },
  catalogImage: {
    borderRadius: 13,
    height: 72,
    width: 72,
  },
  detailImage: {
    aspectRatio: 1,
    borderRadius: 20,
    width: '100%',
  },
  genericStoneArt: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  artworkCaption: { fontFamily: 'Inter_500Medium', fontSize: 9, letterSpacing: 1.5 },
  imageTag: {
    borderRadius: 20,
    left: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    top: 15,
  },
  imageTagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    letterSpacing: 1.3,
  },
  featureCopy: {
    paddingHorizontal: 19,
    paddingTop: 19,
    paddingBottom: 21,
  },
  crystalHeadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  crystalNameBlock: {
    flex: 1,
  },
  crystalName: {
    fontFamily: 'Georgia',
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  crystalNote: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.2,
    marginTop: 5,
  },
  crystalDescription: {
    ...screenTypography.body,
    marginTop: 15,
  },
  alternativesHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 29,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  alternativesEyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    letterSpacing: 1.3,
    marginBottom: 7,
  },
  alternativesTitle: {
    fontFamily: 'Georgia',
    fontSize: 21,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  alternativesList: {
    gap: 11,
  },
  alternativeCard: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 112,
    padding: 10,
  },
  alternativeImage: {
    borderRadius: 13,
    height: 90,
    width: 86,
  },
  alternativeCopy: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 4,
  },
  alternativeName: {
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '400',
  },
  alternativeNote: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    marginTop: 3,
  },
  alternativeDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  collectWrap: { marginTop: 10, alignItems: 'flex-start' },
  collectButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, minHeight: 28 },
  collectText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  collectError: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  hiddenNote: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 },
  hiddenText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
});
