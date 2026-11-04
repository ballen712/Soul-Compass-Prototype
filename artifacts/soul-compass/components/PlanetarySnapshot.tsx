import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCalculatePlanetaryPositions } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

export function PlanetarySnapshot() {
  const colors = useColors();
  const c = colors.cosmos;
  const positions = useCalculatePlanetaryPositions();
  const refresh = positions.mutate;
  const request = () => refresh({ data: { atUtc: new Date().toISOString() } });

  useEffect(() => {
    refresh({ data: { atUtc: new Date().toISOString() } });
  }, [refresh]);

  const list = positions.data?.positions ?? [];

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.header}>
        <View style={styles.headingBlock}>
          <Text style={[styles.kicker, { color: c.secondary }]}>CURRENT SKY</Text>
          <Text style={[styles.title, { color: c.foreground }]}>Where the planets are now</Text>
        </View>
        <Pressable
          testID="snapshot-refresh"
          accessibilityRole="button"
          accessibilityLabel="Refresh planetary positions"
          disabled={positions.isPending}
          onPress={request}
          style={[styles.refresh, { opacity: positions.isPending ? 0.5 : 1 }]}
        >
          <Text style={[styles.refreshText, { color: c.secondary }]}>{positions.isPending ? 'Updating' : 'Refresh'}</Text>
        </Pressable>
      </View>

      <Text style={[styles.caption, { color: c.mutedForeground }]}>
        Each tile shows a planet's position along the zodiac as seen from Earth at one moment (UTC): the sign, how many degrees into that sign, and whether it appears to move backward (retrograde). It is the same sky for everyone, not a personal reading. Only the current time is sent to the Soul Compass server for this; no profile details.
      </Text>

      {positions.isPending && !positions.data ? (
        <View style={styles.grid} accessibilityLabel="Loading planetary positions">
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[styles.planet, styles.skeleton, { borderColor: c.border, backgroundColor: c.surface }]} />
          ))}
        </View>
      ) : positions.isError ? (
        <View style={styles.errorBox}>
          <Text accessibilityRole="alert" style={styles.error}>
            Positions could not be loaded. This needs an internet connection. Your daily reflection above is calculated on this device and is unaffected.
          </Text>
          <Pressable testID="snapshot-retry" accessibilityRole="button" onPress={request} style={[styles.retry, { borderColor: c.secondary }]}>
            <Text style={[styles.refreshText, { color: c.secondary }]}>Try again</Text>
          </Pressable>
        </View>
      ) : positions.data && list.length === 0 ? (
        <Text style={[styles.status, { color: c.mutedForeground }]}>No positions were returned for this moment. Tap Refresh to ask again.</Text>
      ) : positions.data ? (
        <>
          <Text style={[styles.timestamp, { color: c.mutedForeground }]}>
            {new Date(positions.data.input.atUtc).toLocaleString('en', { timeZone: 'UTC', timeZoneName: 'short' })}
          </Text>
          <View style={styles.grid}>
            {list.map((position) => (
              <View key={position.planet} style={[styles.planet, { borderColor: c.border }]}>
                <Text style={[styles.planetName, { color: c.foreground }]}>{position.planet}</Text>
                <Text style={[styles.planetSign, { color: c.secondary }]}>
                  {position.sign} {position.degreeInSign.toFixed(1)}°
                </Text>
                <Text style={[styles.planetMotion, { color: c.mutedForeground }]}>
                  {position.retrograde ? 'Retrograde' : 'Direct'}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={[styles.status, { color: c.mutedForeground }]}>Tap Refresh to load the current positions.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 1, marginTop: 24, padding: 18 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  headingBlock: { flex: 1, gap: 5 },
  kicker: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.2 },
  title: { fontFamily: 'Georgia', fontSize: 20, lineHeight: 26 },
  refresh: { minHeight: 44, minWidth: 64, justifyContent: 'center', alignItems: 'center' },
  refreshText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 10 },
  timestamp: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  planet: { borderWidth: 1, borderRadius: 12, minWidth: '30%', flexGrow: 1, padding: 9 },
  skeleton: { height: 58, opacity: 0.6 },
  planetName: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  planetSign: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 3 },
  planetMotion: { fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 4 },
  status: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 16 },
  errorBox: { marginTop: 14, gap: 10 },
  error: { color: '#D48D7D', fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  retry: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, minHeight: 40, justifyContent: 'center' },
});
