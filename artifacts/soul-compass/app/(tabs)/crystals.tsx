import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileReadingNote } from '@/components/ProfileReadingNote';
import { SettingsButton } from '@/components/SettingsButton';
import { alternativeCrystals, primaryCrystal } from '@/constants/content';
import { useColors } from '@/hooks/useColors';

export default function CrystalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

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
            <SettingsButton />
          </View>
          <ProfileReadingNote tone="light" />

          <View style={styles.intro}>
            <View style={styles.eyebrowRow}>
              <View
                style={[
                  styles.eyebrowLine,
                  { backgroundColor: colors.crystals.secondary },
                ]}
              />
              <Text
                style={[
                  styles.eyebrow,
                  { color: colors.crystals.secondary },
                ]}
              >
                A MOMENT WITH MINERAL
              </Text>
            </View>
            <Text
              style={[
                styles.title,
                { color: colors.crystals.foreground },
              ]}
            >
              Find a stone{"\n"}to meet you here.
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: colors.crystals.mutedForeground },
              ]}
            >
              Natural forms, chosen for the feeling they evoke.
            </Text>
          </View>

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
                source={primaryCrystal.image}
                style={styles.featureImage}
                resizeMode="cover"
                accessibilityLabel={primaryCrystal.imageDescription}
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
                  STONE FOR TODAY
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
                    {primaryCrystal.name}
                  </Text>
                  <Text
                    style={[
                      styles.crystalNote,
                      { color: colors.crystals.secondary },
                    ]}
                  >
                    {primaryCrystal.note}
                  </Text>
                </View>
                <View
                  style={[
                    styles.crystalSeal,
                    { borderColor: colors.crystals.border },
                  ]}
                >
                  <Feather
                    name="sun"
                    size={17}
                    color={colors.crystals.secondary}
                  />
                </View>
              </View>
              <Text
                style={[
                  styles.crystalDescription,
                  { color: colors.crystals.mutedForeground },
                ]}
              >
                {primaryCrystal.description}
              </Text>
            </View>
          </View>

          <View style={styles.alternativesHeader}>
            <View>
              <Text
                style={[
                  styles.alternativesEyebrow,
                  { color: colors.crystals.mutedForeground },
                ]}
              >
                IF YOU FEEL CALLED ELSEWHERE
              </Text>
              <Text
                style={[
                  styles.alternativesTitle,
                  { color: colors.crystals.foreground },
                ]}
              >
                Two other companions
              </Text>
            </View>
            <Feather
              name="arrow-down-right"
              size={18}
              color={colors.crystals.secondary}
            />
          </View>

          <View style={styles.alternativesList}>
            {alternativeCrystals.map((crystal) => (
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
                  <Text
                    style={[
                      styles.alternativeDescription,
                      { color: colors.crystals.mutedForeground },
                    ]}
                    numberOfLines={2}
                  >
                    {crystal.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

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
  eyebrowRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  eyebrowLine: {
    height: 1,
    marginRight: 9,
    width: 22,
  },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.7,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 35,
    fontWeight: '400',
    letterSpacing: -0.9,
    lineHeight: 41,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
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
  crystalSeal: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    height: 39,
    justifyContent: 'center',
    marginLeft: 12,
    width: 39,
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
