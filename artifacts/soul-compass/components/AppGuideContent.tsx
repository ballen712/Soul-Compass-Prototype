import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { APP_GUIDE_TABS } from '@/constants/app-guide';
import { useColors } from '@/hooks/useColors';
import { useAppText } from '@/localization';

export function AppGuideCards({ variant = 'settings' }: { variant?: 'modal' | 'settings' }) {
  const colors = useColors();
  const t = useAppText();
  const isModal = variant === 'modal';
  const foreground = isModal ? colors.cosmos.foreground : colors.foreground;
  const muted = isModal ? colors.cosmos.mutedForeground : colors.mutedForeground;
  const card = isModal ? colors.cosmos.surface : colors.card;
  const border = isModal ? colors.cosmos.border : colors.border;

  return (
    <View style={styles.list}>
      {APP_GUIDE_TABS.map((item) => (
        <View
          key={item.title}
          testID={`app-guide-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
          style={[
            styles.card,
            isModal && styles.modalCard,
            { backgroundColor: card, borderColor: border },
          ]}
        >
          <Text style={[styles.cardTitle, isModal && styles.modalCardTitle, { color: foreground }]}>
          {t(item.title)}
          </Text>
          <Text
            style={[
              styles.cardDescription,
              isModal && styles.modalCardDescription,
              { color: muted },
            ]}
          >
            {t(isModal || !('settingsDescription' in item) ? item.description : item.settingsDescription)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 5 },
  modalCard: { padding: 10, gap: 3, borderRadius: 14 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  modalCardTitle: { fontSize: 14 },
  cardDescription: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  modalCardDescription: { fontSize: 12, lineHeight: 16 },
});
