import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useProfile } from '@/profile/ProfileContext';
import { getChartPrecision, getHomeDateTimeLabel } from '@/profile/profile';
import { useLocalClock } from '@/hooks/useLocalClock';

type Props = { tone: 'dark' | 'light' };

export function ProfileReadingNote({ tone }: Props) {
  const { profile } = useProfile();
  const now = useLocalClock();
  if (!profile) return null;
  const precision = getChartPrecision(profile);
  const dark = tone === 'dark';
  const residence = profile.currentResidence;
  return (
    <View style={[styles.container, dark ? styles.dark : styles.light]}>
      <Text style={[styles.location, dark ? styles.darkText : styles.lightText]}>
        {residence
          ? `${getHomeDateTimeLabel(residence.timeZone, now)} · ${residence.city}, ${residence.country}`
          : 'Current residence not set · add it in Settings for local date and time'}
      </Text>
      <Text style={[styles.note, dark ? styles.darkMuted : styles.lightMuted]}>
        {precision.precisionNote}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  dark: { backgroundColor: 'rgba(255,255,255,0.05)' },
  light: { backgroundColor: 'rgba(77,78,66,0.06)' },
  location: { fontSize: 11, letterSpacing: 0.3 },
  note: { fontSize: 11, lineHeight: 16 },
  darkText: { color: '#E7D9A8' },
  lightText: { color: '#4E5145' },
  darkMuted: { color: '#AEB6C4' },
  lightMuted: { color: '#77756F' },
});
