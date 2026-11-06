import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { HomeLocation } from '@/profile/profile';
import { searchHomeCities } from '@/services/geocoding';
import type { HomeCitySearchResult } from '@/services/geocoding';
import { useAppText } from '@/localization';

type Props = {
  label: string;
  value: HomeLocation | null;
  onSelect: (location: HomeLocation | null) => void;
  purpose?: 'home' | 'birth';
};

export function HomeCityPicker({ label, value, onSelect }: Props) {
  const t = useAppText();
  const [query, setQuery] = useState(value?.city ?? '');
  const [results, setResults] = useState<HomeCitySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const active = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function cancel() {
    generation.current += 1;
    active.current?.abort();
    active.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }
  useEffect(() => () => cancel(), []);
  function changeQuery(next: string) {
    cancel();
    setQuery(next); setResults([]); setError(''); setLoading(false);
  }

  async function searchCities() {
    cancel();
    const request = generation.current;
    const search = query.trim();
    if (search.length < 2) {
      setLoading(false);
      setError(t('Enter at least two letters to search.'));
      return;
    }
    setLoading(true);
    setError('');
    setResults([]);
    const controller = new AbortController();
    active.current = controller;
    timer.current = setTimeout(() => controller.abort(), 15_000);
    try {
      const matches = await searchHomeCities(search, controller.signal);
      if (request !== generation.current || controller.signal.aborted) return;
      setResults(matches);
      if (matches.length === 0) setError(t('No matching cities with time-zone data were found.'));
    } catch {
      if (request === generation.current) {
        setError(t('Could not search cities. Check your connection and try again.'));
      }
    } finally {
      if (request === generation.current) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null; active.current = null;
        setLoading(false);
      }
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel={t(label)}
          autoCapitalize="words"
          onChangeText={(text) => {
            changeQuery(text);
            if (value && text !== value.city) onSelect(null);
          }}
          onSubmitEditing={searchCities}
          placeholder={`${t('Search')} ${t(label).toLocaleLowerCase()}`}
          placeholderTextColor="#8B877F"
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        <Pressable accessibilityRole="button" accessibilityLabel={t('Search cities')} accessibilityState={{ busy: loading }} onPress={searchCities} style={styles.searchButton}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.searchText}>{t('Search')}</Text>}
        </Pressable>
      </View>
      {value && (
        <Text style={styles.selected}>
          {t('Selected')}: {value.city}, {value.country} · {value.timeZone}
        </Text>
      )}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {results.map((result) => {
        const location: HomeLocation = {
          city: result.city,
          country: result.country,
          latitude: result.latitude,
          longitude: result.longitude,
          timeZone: result.timeZone,
        };
        return (
          <Pressable
            accessibilityRole="button"
            key={`${result.city}-${result.country}-${result.latitude}-${result.longitude}`}
            onPress={() => {
              cancel();
              onSelect(location);
              setQuery(result.city);
              setResults([]);
              setLoading(false);
            }}
            style={styles.result}
          >
            <Text style={styles.city}>{result.city}{result.admin1 ? `, ${result.admin1}` : ''}</Text>
            <Text style={styles.country}>{result.country} · {result.timeZone}</Text>
          </Pressable>
        );
      })}
      <Text testID="city-search-attribution" style={styles.attribution}>
        {t('Powered by')}{' '}
        <Text
          accessibilityRole="link"
          accessibilityLabel="Geoapify"
          onPress={() => Linking.openURL('https://www.geoapify.com/')}
          style={styles.attributionLink}
        >
          Geoapify
        </Text>
        {' '}· ©{' '}
        <Text
          accessibilityRole="link"
          accessibilityLabel="OpenStreetMap contributors"
          onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}
          style={styles.attributionLink}
        >
          OpenStreetMap contributors
        </Text>
        {' '}·{' '}
        <Text
          accessibilityRole="link"
          accessibilityLabel={t('Geoapify privacy policy')}
          onPress={() => Linking.openURL('https://www.geoapify.com/privacy-policy/')}
          style={styles.attributionLink}
        >
          {t('Privacy')}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D9D3C7',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#25251F',
    backgroundColor: '#FFFEFB',
    fontSize: 15,
  },
  searchButton: {
    minWidth: 78,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#25344D',
    paddingHorizontal: 12,
  },
  searchText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  selected: { color: '#52604F', fontSize: 12, lineHeight: 18 },
  error: { color: '#9C423B', fontSize: 13 },
  result: { borderBottomWidth: 1, borderBottomColor: '#E5E0D7', paddingVertical: 10 },
  city: { color: '#242720', fontSize: 15, fontWeight: '600' },
  country: { color: '#77756F', fontSize: 12, marginTop: 3 },
  attribution: { color: '#89867E', fontSize: 9, lineHeight: 13, marginTop: 2 },
  attributionLink: { color: '#77756F', textDecorationLine: 'underline' },
});
