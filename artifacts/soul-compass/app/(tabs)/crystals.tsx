import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsButton } from '@/components/SettingsButton';
import { alternativeCrystals, samplePrimaryCrystal } from '@/constants/content';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/profile/ProfileContext';
import {
  getCrystalRecommendation,
  getIntentionRecommendation,
  getSampleCrystal,
} from '@/profile/astrology';
import { getCompanionReason } from '@/profile/crystal-guidance';
import { getDailyAstrology } from '@/profile/daily-cache';
import { useLocalClock } from '@/hooks/useLocalClock';

const slugOf = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-');

function CollectionToggle({ name }: { name: string }) {
  const colors = useColors();
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
        style={[styles.collectButton, { borderColor: colors.crystals.border }, inCollection && { backgroundColor: colors.crystals.secondary, borderColor: colors.crystals.secondary }]}>
        {busy ? <ActivityIndicator size="small" color={colors.crystals.secondary} /> : <Feather name={inCollection ? 'check' : 'plus'} size={11} color={inCollection ? colors.crystals.card : colors.crystals.secondary} />}
        <Text style={[styles.collectText, { color: inCollection ? colors.crystals.card : colors.crystals.secondary }]}>{label}</Text>
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

export default function CrystalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { preferences, profile } = useProfile();
  const [guideOpen, setGuideOpen] = useState(false);
  const now = useLocalClock();
  const router = useRouter();
  const hidden = preferences.crystalPreferences.hiddenCrystals;
  const astrology = useMemo(
    () => (profile ? getDailyAstrology(profile, now) : null),
    [profile, now],
  );
  const recommendation =
    astrology?.status === 'calculated'
      ? getCrystalRecommendation(astrology, preferences.crystalPreferences)
      : getIntentionRecommendation(preferences.crystalPreferences);
  const featuredCrystal = recommendation?.crystal ?? getSampleCrystal();
  const catalog = [samplePrimaryCrystal, ...alternativeCrystals];
  const showPrimary = !hidden.includes(slugOf(featuredCrystal.name));
  const visibleAlternatives = catalog.filter(
    (crystal) =>
      crystal.name !== featuredCrystal.name &&
      !hidden.includes(slugOf(crystal.name)),
  );
  const hiddenCount = catalog.filter((crystal) =>
    hidden.includes(slugOf(crystal.name)),
  ).length;

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
            <View
              style={[
                styles.brandMark,
                { borderColor: colors.crystals.secondary },
              ]}
            >
              <Feather
                name="hexagon"
                size={15}
                color={colors.crystals.secondary}
              />
            </View>
            <Text
              style={[
                styles.brandName,
                { color: colors.crystals.foreground },
              ]}
            >
              SOUL COMPASS
            </Text>
            <View
              style={[
                styles.brandDivider,
                { backgroundColor: colors.crystals.border },
              ]}
            />
            <Text
              style={[
                styles.brandCaption,
                { color: colors.crystals.mutedForeground },
              ]}
            >
              THE STONE GUIDE
            </Text>
            <Pressable
              testID="stone-guide-info"
              accessibilityRole="button"
              accessibilityLabel="About the Stone Guide"
              accessibilityHint="Opens an explanation of daily stone suggestions and your collection"
              onPress={() => setGuideOpen(true)}
              style={[
                styles.guideInfoButton,
                { borderColor: colors.crystals.border },
              ]}
            >
              <Feather name="info" size={15} color={colors.crystals.secondary} />
            </Pressable>
            <SettingsButton />
          </View>

          <View style={styles.intro}>
            <Text
              style={[
                styles.title,
                { color: colors.crystals.foreground },
              ]}
            >
              Find a stone for today.
            </Text>
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
          {showPrimary ? (
          <View
            style={[
              styles.featureCard,
              {
                backgroundColor: colors.crystals.card,
                borderColor: colors.crystals.border,
              },
            ]}
          >
            <View
              style={[
                styles.imageFrame,
                { backgroundColor: colors.crystals.imageSurface },
              ]}
            >
              <Image
                source={featuredCrystal.image}
                style={styles.featureImage}
                resizeMode="cover"
                accessibilityLabel={featuredCrystal.imageDescription}
              />
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
                  {recommendation
                    ? recommendation.basis === 'intention'
                      ? 'INTENTION COMPANION'
                      : recommendation.basis === 'feeling'
                        ? 'FEELING COMPANION'
                        : 'TODAY’S COMPANION'
                    : 'SAMPLE ONLY'}
                </Text>
              </View>
            </View>
            <View style={styles.featureCopy}>
              <View style={styles.crystalHeadingRow}>
                <View style={styles.crystalNameBlock}>
                  <Text
                    style={[
                      styles.crystalName,
                      { color: colors.crystals.foreground },
                    ]}
                  >
                    {featuredCrystal.name}
                  </Text>
                  <Text
                    style={[
                      styles.crystalNote,
                      { color: colors.crystals.secondary },
                    ]}
                  >
                    {featuredCrystal.note}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.crystalDescription,
                  { color: colors.crystals.mutedForeground },
                ]}
              >
                {recommendation?.reason ?? 'This is a sample suggestion. Moonstone is traditionally linked with reflection. Choose a feeling or intention in Settings for a more personal suggestion.'}
              </Text>
              <CollectionToggle name={featuredCrystal.name} />
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
              color={colors.crystals.secondary}
            />
          </View>

          <View style={styles.alternativesList}>
            {visibleAlternatives.map((crystal) => (
              <View
                key={crystal.name}
                style={[
                  styles.alternativeCard,
                  {
                    backgroundColor: colors.crystals.card,
                    borderColor: colors.crystals.border,
                  },
                ]}
              >
                <Image
                  source={crystal.image}
                  style={styles.alternativeImage}
                  resizeMode="cover"
                  accessibilityLabel={crystal.imageDescription}
                />
                <View style={styles.alternativeCopy}>
                  <Text
                    style={[
                      styles.alternativeName,
                      { color: colors.crystals.foreground },
                    ]}
                  >
                    {crystal.name}
                  </Text>
                  <Text
                    style={[
                      styles.alternativeNote,
                      { color: colors.crystals.secondary },
                    ]}
                  >
                    {crystal.note}
                  </Text>
                  <Text style={[styles.alternativeDescription, { color: colors.crystals.mutedForeground }]}>
                    {getCompanionReason(crystal, recommendation)}
                  </Text>
                  <CollectionToggle name={crystal.name} />
                </View>
              </View>
            ))}
          </View>
          </>
          ) : null}

          <View style={styles.footerMark}>
            <View
              style={[
                styles.footerLine,
                { backgroundColor: colors.crystals.border },
              ]}
            />
            <Feather
              name="circle"
              size={13}
              color={colors.crystals.secondary}
            />
            <View
              style={[
                styles.footerLine,
                { backgroundColor: colors.crystals.border },
              ]}
            />
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={guideOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setGuideOpen(false)}
      >
        <SafeAreaView edges={['top', 'bottom']} style={styles.guideModalStage}>
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.crystals.foreground, opacity: 0.58 },
            ]}
          />
          <View
            accessibilityViewIsModal
            testID="stone-guide-modal"
            style={[
              styles.guideModalCard,
              {
                backgroundColor: colors.crystals.card,
                borderColor: colors.crystals.border,
              },
            ]}
          >
            <View style={styles.guideModalHeader}>
              <Text style={[styles.guideModalTitle, { color: colors.crystals.foreground }]}>
                About the Stone Guide
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close Stone Guide explanation"
                testID="close-stone-guide"
                hitSlop={10}
                onPress={() => setGuideOpen(false)}
                style={styles.guideCloseButton}
              >
                <Feather name="x" size={19} color={colors.crystals.foreground} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.guideModalCopy}
            >
              <Text style={[styles.guideModalBody, { color: colors.crystals.foreground }]}>
                With your saved birth chart and current city, the daily reading uses your chart and today’s planetary transits. Your city sets the local date; we do not use GPS. The suggested stone reflects the day’s chart theme, your selected feeling, and any intentions you have saved.
              </Text>
              <Text style={[styles.guideModalBody, { color: colors.crystals.foreground }]}>
                If there is no calculated chart, your selected feeling or an intention can still guide a suggestion. Without either, you will see a sample. Crystal meanings here are traditional symbols and prompts, not promises or health advice.
              </Text>
              <Text style={[styles.guideModalBody, { color: colors.crystals.foreground }]}>
                If you enjoy crystals, use the guide to choose a loose stone or a piece of jewelry—a pendant, ring, or bracelet. Tap “Add to Collection” for stones you already own, so you can see at a glance which companions are already yours.
              </Text>
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
  },
  guideInfoButton: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginLeft: 8,
    width: 44,
  },
  guideModalStage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  guideModalCard: {
    alignSelf: 'center',
    borderRadius: 22,
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
    letterSpacing: 1.1,
  },
  intro: {
    marginTop: 38,
    marginBottom: 22,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 35,
    fontWeight: '400',
    letterSpacing: -0.9,
    lineHeight: 41,
  },
  featureCard: {
    borderRadius: 25,
    borderWidth: 1,
    overflow: 'hidden',
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
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 21,
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
    borderRadius: 20,
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
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  collectWrap: { marginTop: 10, alignItems: 'flex-start' },
  collectButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, minHeight: 28 },
  collectText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  collectError: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  hiddenNote: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 },
  hiddenText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  footerMark: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
    justifyContent: 'center',
    marginTop: 26,
  },
  footerLine: {
    height: 1,
    maxWidth: 72,
    width: '24%',
  },
});
