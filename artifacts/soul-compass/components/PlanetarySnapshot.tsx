import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCalculatePlanetaryPositions } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

export function PlanetarySnapshot() {
  const colors = useColors();
  const positions = useCalculatePlanetaryPositions();
  const refresh = positions.mutate;

  useEffect(() => {
    refresh({ data: { atUtc: new Date().toISOString() } });
  }, [refresh]);

  return (
    <View style={[styles.card, { backgroundColor: colors.cosmos.card, borderColor: colors.cosmos.border }]}>
      <View style={styles.header}>
        <View style={styles.headingBlock}>
          <Text style={[styles.kicker, { color: colors.cosmos.secondary }]}>LIVE ASTRONOMICAL DATA</Text>
          <Text style={[styles.title, { color: colors.cosmos.foreground }]}>Current sky snapshot</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={positions.isPending}
          onPress={() => refresh({ data: { atUtc: new Date().toISOString() } })}
          style={styles.refresh}
        >
          {positions.isPending
            ? <ActivityIndicator color={colors.cosmos.secondary} size="small" />
            : <Text style={[styles.refreshText, { color: colors.cosmos.secondary }]}>Refresh</Text>}
        </Pressable>
      </View>

      <Text style={[styles.caption, { color: colors.cosmos.mutedForeground }]}>
        Geocentric planetary positions at one UTC instant. This is not a personalized horoscope or a daily transit reading.
      </Text>

      {positions.data ? (
        <>
          <Text style={[styles.timestamp, { color: colors.cosmos.mutedForeground }]}>
            {new Date(positions.data.input.atUtc).toLocaleString('en', { timeZone: 'UTC', timeZoneName: 'short' })}
          </Text>
          <View style={styles.grid}>
            {positions.data.positions.map((position) => (
              <View key={position.planet} style={[styles.planet, { borderColor: colors.cosmos.border }]}>
                <Text style={[styles.planetName, { color: colors.cosmos.foreground }]}>{position.planet}</Text>
                <Text style={[styles.planetSign, { color: colors.cosmos.secondary }]}>
                  {position.sign} {position.degreeInSign.toFixed(1)}°
                </Text>
                <Text style={[styles.planetMotion, { color: colors.cosmos.mutedForeground }]}>
                  {position.retrograde ? 'Retrograde' : 'Direct'}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : positions.isPending ? (
        <Text style={[styles.status, { color: colors.cosmos.mutedForeground }]}>Calculating positions…</Text>
      ) : positions.isError ? (
        <Text accessibilityRole="alert" style={styles.error}>Astronomy data is temporarily unavailable. The sample reading above is unchanged.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 1, marginTop: 24, padding: 18 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  headingBlock: { flex: 1, gap: 5 },
  kicker: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.2 },
  title: { fontFamily: 'Georgia', fontSize: 20, lineHeight: 26 },
  refresh: { minHeight: 36, minWidth: 54, justifyContent: 'center', alignItems: 'center' },
  refreshText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 10 },
  timestamp: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  planet: { borderWidth: 1, borderRadius: 12, minWidth: '30%', flexGrow: 1, padding: 9 },
  planetName: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  planetSign: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 3 },
  planetMotion: { fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 4 },
  status: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 16 },
  error: { color: '#D48D7D', fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 14 },
});
