import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { screenTypography } from '@/constants/typography';
import { SettingsButton } from '@/components/SettingsButton';
import { useAppText } from '@/localization';

type TabScreenHeaderProps = {
  title: string;
  titleColor: string;
  subtitleColor?: string;
  subtitle?: ReactNode;
  titleAccessory?: ReactNode;
  afterSpacing: number;
};

export function TabScreenHeader({
  title,
  titleColor,
  subtitleColor,
  subtitle,
  titleAccessory,
  afterSpacing,
}: TabScreenHeaderProps) {
  const t = useAppText();
  const localizedSubtitle = typeof subtitle === 'string' ? t(subtitle) : subtitle;
  return (
    <View style={{ marginBottom: afterSpacing }}>
      <View style={styles.brandRow}>
        <Text style={[styles.brandName, { color: titleColor }]}>
          SOUL COMPASS
        </Text>
        <SettingsButton />
      </View>
      <View style={styles.heading}>
        <View style={styles.titleRow}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: titleColor }]}
          >
            {t(title)}
          </Text>
          {titleAccessory}
        </View>
        {localizedSubtitle !== undefined && localizedSubtitle !== null ? (
          <Text style={[styles.subtitle, { color: subtitleColor ?? titleColor }]}>
            {localizedSubtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 34,
    justifyContent: 'space-between',
  },
  brandName: {
    ...screenTypography.wordmark,
  },
  heading: {
    marginTop: 44,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 4,
  },
  title: {
    ...screenTypography.pageTitle,
    flexShrink: 1,
  },
  subtitle: {
    ...screenTypography.body,
    marginTop: 7,
  },
});
