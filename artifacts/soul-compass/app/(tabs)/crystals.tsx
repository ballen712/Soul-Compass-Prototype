import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsButton } from '@/components/SettingsButton';
import {
  crystalCatalog,
  type Crystal,
  type StoneTone,
} from '@/constants/content';
import { useColors } from '@/hooks/useColors';
import { screenTypography } from '@/constants/typography';
import { useProfile } from '@/profile/ProfileContext';
import {
  calculateNatalElementBalance,
  getCrystalSuggestions,
  getNatalCrystalSuggestions,
} from '@/profile/astrology';
import { getCompanionReason, type NatalCrystalRecommendation } from '@/profile/crystal-guidance';
import { getDailyAstrology } from '@/profile/daily-cache';
import { useLocalClock } from '@/hooks/useLocalClock';

const slugOf = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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

function CrystalArtwork({ crystal, size }: { crystal: Crystal; size: 'feature' | 'alternative' }) {
  const tone = stoneToneColors[crystal.tone];
  if (crystal.image !== undefined) {
    return (
      <Image
        source={crystal.image}
        style={size === 'feature' ? styles.featureImage : styles.alternativeImage}
        resizeMode="cover"
        accessibilityLabel={crystal.imageDescription ?? `${crystal.name} stone`}
      />
    );
  }
  return (
    <View
      accessibilityLabel={`${crystal.name} stone illustration`}
      style={[
        size === 'feature' ? styles.featureImage : styles.alternativeImage,
        styles.genericStoneArt,
        { backgroundColor: tone.background },
      ]}
    >
      <Feather
        name="hexagon"
        size={size === 'feature' ? 76 : 35}
        color={tone.foreground}
      />
      {size === 'feature' ? (
        <Text style={[styles.artworkCaption, { color: tone.foreground }]}>SYMBOLIC ILLUSTRATION</Text>
      ) : null}
    </View>
  );
}

function CollectionToggle({ name }: { name: string }) {
  const colors = useColors();
  const c = colors.cosmos;
  const { preferences, toggleCrystal } = useProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slug = slugOf(name);
  const inCollection = preferences.crystalCollection.includes(slug);
  async function toggle() {
    if (busy) return;
    setBusy(true); setError(null);
    try { await toggleCrystal(slug); }
    catch { setError('Could not update your collection on this device.'); }
    finally { setBusy(false); }
  }
  const label = inCollection ? 'In Your Collection' : 'Add to Collection';
  return (
    <View style={styles.collectWrap}>
      <Pressable testID={`collect-${slug}`} accessibilityRole="switch" accessibilityLabel={`${name}: ${label}`} accessibilityState={{ checked: inCollection, disabled: busy, busy }} disabled={busy} onPress={toggle}
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
  if (count === 0) return null;
  return (
    <View style={[styles.hiddenNote, { borderColor: colors.crystals.border, backgroundColor: colors.crystals.card }]}>
      <Feather name="eye-off" size={13} color={colors.crystals.secondary} />
      <Text style={[styles.hiddenText, { color: colors.crystals.mutedForeground }]}>
        {count === 1 ? '1 stone is' : `${count} stones are`} hidden. You can restore hidden stones in Settings.
      </Text>
    </View>
  );
}

function describeElementBalance(
  balance: Extract<ReturnType<typeof calculateNatalElementBalance>, { status: 'calculated' }>,
  suggestionCount: number,
) {
  const join = (elements: string[]) => elements.map((element) => element.toLowerCase()).join(' and ');
  const stoneCount = `${suggestionCount} symbolic stone ${suggestionCount === 1 ? 'pairing' : 'pairings'}`;
  if (balance.dominant.length === 4) {
    return `Across ${balance.total} reliable planetary sign placements, the four elements appear in a fairly even mix. Here are ${stoneCount} to explore.`;
  }
  return `Across ${balance.total} reliable planetary sign placements, your chart has more ${join(balance.dominant)} placements and fewer ${join(balance.leastRepresented)}. These ${stoneCount} are reflection prompts, not guaranteed effects.`;
}

export default function CrystalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { preferences, profile } = useProfile();
  const [guideOpen, setGuideOpen] = useState(false);
  const [selectedNatalStone, setSelectedNatalStone] = useState<NatalCrystalRecommendation | null>(null);
  const now = useLocalClock();
  const router = useRouter();
  const hidden = preferences.crystalPreferences.hiddenCrystals;
  const natalElementResult = useMemo(
    () => profile ? calculateNatalElementBalance(profile) : null,
    [profile],
  );
  const natalStoneSuggestions = useMemo(
    () => natalElementResult?.status === 'calculated'
      ? getNatalCrystalSuggestions(natalElementResult, hidden, 8)
      : [],
    [natalElementResult, hidden],
  );
  const astrology = useMemo(
    () => (profile ? getDailyAstrology(profile, now) : null),
    [profile, now],
  );
  const crystalSuggestions = useMemo(
    () => getCrystalSuggestions(
      astrology?.status === 'calculated' ? astrology : undefined,
      {
        ...preferences.crystalPreferences,
        dateKey: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
      },
      3,
    ),
    [astrology, preferences.crystalPreferences, now],
  );
  const recommendation = crystalSuggestions[0] ?? null;
  const catalog = crystalCatalog;
  const alternativeCandidates = crystalSuggestions.length > 0
    ? crystalSuggestions.slice(1).map((suggestion) => suggestion.crystal)
    : [];
  const visibleAlternatives = alternativeCandidates
    .filter((crystal) => !hidden.includes(slugOf(crystal.name)))
    .slice(0, 2);
  const hiddenCount = catalog.filter((crystal) =>
    hidden.includes(slugOf(crystal.name)),
  ).length;
  const noMatchCopy = astrology?.status === 'calculated'
    ? 'No stone is a clear fit for today’s chart and your saved choices. We would rather leave this space open than suggest one at random.'
    : profile
      ? 'A daily transit match is not available, and none of your saved feelings or intentions matched a stone closely enough. We will leave the choice open.'
      : 'Save your birth details or choose a feeling or intention to get a personal suggestion.';

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safeArea,
        { backgroundColor: colors.crystals.background },
        Platform.OS === 'web' && {
          paddingTop: Math.max(insets.top, 67),
        },
      ]}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <View style={styles.brandRow}>
            <Text
              style={[
                styles.brandName,
                { color: colors.crystals.foreground },
              ]}
            >
              SOUL COMPASS
            </Text>
            <View style={styles.brandSpacer} />
            <SettingsButton />
          </View>

          <View style={styles.intro}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.crystals.foreground }]}>The Stone Guide</Text>
              <Pressable
                testID="stone-guide-info"
                accessibilityRole="button"
                accessibilityLabel="About the Stone Guide"
                accessibilityHint="Opens an explanation of daily stone suggestions and your collection"
                onPress={() => {
                  setSelectedNatalStone(null);
                  setGuideOpen(true);
                }}
                style={styles.guideInfoButton}
              >
                <Feather name="info" size={15} color={colors.crystals.secondary} />
              </Pressable>
            </View>
            <Text style={[styles.subtitle, { color: colors.crystals.mutedForeground }]}>Find a stone for today.</Text>
          </View>

          <HiddenNote count={hiddenCount} />
          {hiddenCount === catalog.length ? (
            <View style={[styles.hiddenNote, { borderColor: colors.crystals.border, backgroundColor: colors.crystals.card, flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={[styles.hiddenText, { color: colors.crystals.foreground }]}>All stones are hidden. Restore a stone in Settings to see suggestions again.</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/settings')}>
                <Text style={[styles.collectText, { color: colors.crystals.secondary, paddingVertical: 12 }]}>Open settings</Text>
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
                No clear match today
              </Text>
              <Text style={[styles.emptyBody, { color: colors.cosmos.mutedForeground }]}>
                {noMatchCopy}
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
              style={[
                styles.imageFrame,
                { backgroundColor: colors.crystals.imageSurface },
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
                    ? 'INTENTION COMPANION'
                    : recommendation.basis === 'feeling'
                      ? 'FEELING COMPANION'
                      : 'TODAY’S COMPANION'}
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
                    {recommendation.crystal.name}
                  </Text>
                  <Text
                    style={[
                      styles.crystalNote,
                      { color: colors.cosmos.secondary },
                    ]}
                  >
                    {recommendation.crystal.note}
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
                MORE STONES TO CONSIDER
              </Text>
              <Text
                style={[
                  styles.alternativesTitle,
                  { color: colors.crystals.foreground },
                ]}
              >
                {visibleAlternatives.length === 1 ? 'Another companion' : 'Two other companions'}
              </Text>
            </View>
            <Feather
              name="arrow-down-right"
              size={18}
              color={colors.cosmos.secondary}
            />
          </View>

          <View style={styles.alternativesList}>
            {visibleAlternatives.map((crystal) => (
              <View
                key={crystal.name}
                style={[
                  styles.alternativeCard,
                  {
                    backgroundColor: colors.cosmos.card,
                    borderColor: colors.cosmos.border,
                  },
                ]}
              >
                <CrystalArtwork crystal={crystal} size="alternative" />
                <View style={styles.alternativeCopy}>
                  <Text
                    style={[
                      styles.alternativeName,
                      { color: colors.cosmos.foreground },
                    ]}
                  >
                    {crystal.name}
                  </Text>
                  <Text
                    style={[
                      styles.alternativeNote,
                      { color: colors.cosmos.secondary },
                    ]}
                  >
                    {crystal.note}
                  </Text>
                  <Text style={[styles.alternativeDescription, { color: colors.cosmos.mutedForeground }]}>
                    {getCompanionReason(crystal, recommendation)}
                  </Text>
                  <CollectionToggle name={crystal.name} />
                </View>
              </View>
            ))}
          </View>
          </>
          ) : null}

        </View>
      </ScrollView>
      <Modal
        visible={guideOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (selectedNatalStone) setSelectedNatalStone(null);
          else setGuideOpen(false);
        }}
      >
        <SafeAreaView edges={['top', 'bottom']} style={styles.guideModalStage}>
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.cosmos.homeBackground, opacity: 0.72 },
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
              {selectedNatalStone ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to the Stone Guide"
                  testID="back-to-stone-guide"
                  onPress={() => setSelectedNatalStone(null)}
                  style={styles.guideBackButton}
                >
                  <Feather name="arrow-left" size={17} color={colors.cosmos.secondary} />
                  <Text style={[styles.guideBackText, { color: colors.cosmos.secondary }]}>Back to guide</Text>
                </Pressable>
              ) : (
                <Text style={[styles.guideModalTitle, { color: colors.cosmos.foreground }]}>
                  About the Stone Guide
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close Stone Guide explanation"
                testID="close-stone-guide"
                hitSlop={10}
                onPress={() => {
                  setSelectedNatalStone(null);
                  setGuideOpen(false);
                }}
                style={styles.guideCloseButton}
              >
                <Feather name="x" size={19} color={colors.cosmos.secondary} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.guideModalCopy}
            >
              {selectedNatalStone ? (
                <View style={styles.natalStoneDetail}>
                  <Text style={[styles.natalStoneDetailTitle, { color: colors.cosmos.foreground }]}>
                    {selectedNatalStone.crystal.name}
                  </Text>
                  <Text style={[styles.natalStoneMeta, { color: colors.cosmos.secondary }]}>
                    {selectedNatalStone.element} · {selectedNatalStone.crystal.note}
                  </Text>
                  <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                    {selectedNatalStone.reason}
                  </Text>
                  <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                    {selectedNatalStone.crystal.description}
                  </Text>
                  <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                    This is a symbolic way to reflect on your chart, not a proven effect or a promise. If this stone feels meaningful, you could choose a loose stone or a piece of jewelry and add it to your collection.
                  </Text>
                  <CollectionToggle name={selectedNatalStone.crystal.name} />
                </View>
              ) : (
                <>
                  <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                    The guide includes {crystalCatalog.length} stones and gemstone varieties. Each day shows one main companion and up to two alternatives. Browse or search the full list in Settings under Your collection.
                  </Text>
                  <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                    With your saved birth chart and current city, the daily reading uses your chart and today’s planetary transits. Your city sets the local date; we do not use GPS. The suggested stone reflects the day’s chart theme, your selected feeling, and any intentions you have saved.
                  </Text>
                  <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                    If there is no calculated chart, your selected feeling or an intention can still guide a suggestion. Without either, you will see a sample. Crystal meanings here are traditional symbols and prompts, not promises or health advice.
                  </Text>
                  <View style={styles.natalGuideSection} testID="natal-stone-recommendations">
                    <Text style={[styles.natalStoneSectionTitle, { color: colors.cosmos.foreground }]}>
                      Your birth-chart companions
                    </Text>
                    {natalElementResult?.status === 'calculated' ? (
                      <>
                        <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                          {describeElementBalance(natalElementResult, natalStoneSuggestions.length)}
                        </Text>
                        {!natalElementResult.preciseBirthMoment ? (
                          <Text style={[styles.natalStoneMeta, { color: colors.cosmos.secondary }]}>
                            Your birth time is unknown, so placements that could change during that day are left out.
                          </Text>
                        ) : null}
                        {natalStoneSuggestions.length > 0 ? (
                          <View style={styles.natalStoneList}>
                            {natalStoneSuggestions.map((suggestion, index) => (
                              <Pressable
                                key={suggestion.crystal.name}
                                accessibilityRole="button"
                                accessibilityLabel={`Read why ${suggestion.crystal.name} fits your birth chart`}
                                testID={`natal-stone-${slugOf(suggestion.crystal.name)}`}
                                onPress={() => setSelectedNatalStone(suggestion)}
                                style={[
                                  styles.natalStoneRow,
                                  { borderColor: colors.cosmos.border, backgroundColor: colors.cosmos.surface },
                                ]}
                              >
                                <View style={styles.natalStoneRowCopy}>
                                  <Text style={[styles.natalStoneName, { color: colors.cosmos.foreground }]}>
                                    {index + 1}. {suggestion.crystal.name}
                                  </Text>
                                  <Text style={[styles.natalStoneMeta, { color: colors.cosmos.mutedForeground }]}>
                                    {suggestion.element} · {suggestion.crystal.note}
                                  </Text>
                                </View>
                                <Feather name="chevron-right" size={17} color={colors.cosmos.secondary} />
                              </Pressable>
                            ))}
                          </View>
                        ) : (
                          <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                            The stones you have hidden are left out. Restore some in Settings to see chart-based suggestions.
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                        {profile
                          ? natalElementResult?.message ?? 'A reliable chart summary is not available yet.'
                          : 'Save your birth details to see a local, chart-based list of stones.'}
                      </Text>
                    )}
                    <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                      This birth-chart summary is calculated on your device. Soul Compass uses its own symbolic pairings between chart elements and stone themes; they are reflection prompts, not medical advice or proven effects.
                    </Text>
                  </View>
                  <Text style={[styles.guideModalBody, { color: colors.cosmos.mutedForeground }]}>
                    If you enjoy crystals, use the guide to choose a loose stone or a piece of jewelry—a pendant, ring, or bracelet. Tap “Add to Collection” for stones you already own, so you can see at a glance which companions are already yours.
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
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
    paddingHorizontal: 22,
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
    justifyContent: 'space-between',
  },
  brandSpacer: { flex: 1 },
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
  guideBackButton: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 7,
    minHeight: 34,
  },
  guideBackText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
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
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 64,
    paddingHorizontal: 13,
    paddingVertical: 10,
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
  natalStoneDetail: {
    gap: 13,
  },
  natalStoneDetailTitle: {
    fontFamily: 'Georgia',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 34,
  },
  brandName: {
    ...screenTypography.wordmark,
  },
  intro: {
    marginTop: 38,
    marginBottom: 22,
  },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  title: {
    ...screenTypography.pageTitle,
  },
  subtitle: { ...screenTypography.body, marginTop: 7 },
  featureCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
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
  featureImage: {
    height: '100%',
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
    overflow: 'hidden',
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
