import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { HomeLocation } from '@/profile/profile';

type SearchResult = {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

type Props = {
  value: HomeLocation | null;
  onSelect: (location: HomeLocation) => void;
};

export function HomeCityPicker({ value, onSelect }: Props) {
  const [query, setQuery] = useState(value?.city ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function searchCities() {
    const search = query.trim();
    if (search.length < 2) {
      setError('Enter at least two letters to search.');
      return;
    }
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search)}&count=8&language=en&format=json`,
      );
      if (!response.ok) throw new Error('City search is temporarily unavailable.');
      const data = (await response.json()) as { results?: SearchResult[] };
      const matches = (data.results ?? []).filter(
        (result) => result.timezone && Number.isFinite(result.latitude) && Number.isFinite(result.longitude),
      );
      setResults(matches);
      if (matches.length === 0) setError('No matching cities with time-zone data were found.');
    } catch {
      setError('Could not search cities. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel="Home city"
          autoCapitalize="words"
          onChangeText={setQuery}
          onSubmitEditing={searchCities}
          placeholder="Search your home city"
          placeholderTextColor="#8B877F"
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        <Pressable accessibilityRole="button" onPress={searchCities} style={styles.searchButton}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.searchText}>Search</Text>}
        </Pressable>
      </View>
      {value && (
        <Text style={styles.selected}>
          Selected: {value.city}, {value.country} · {value.timeZone}
        </Text>
      )}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {results.map((result) => {
        const location: HomeLocation = {
          city: result.name,
          country: result.country,
          latitude: result.latitude,
          longitude: result.longitude,
          timeZone: result.timezone!,
        };
        return (
          <Pressable
            accessibilityRole="button"
            key={`${result.name}-${result.latitude}-${result.longitude}`}
            onPress={() => {
              onSelect(location);
              setQuery(result.name);
              setResults([]);
            }}
            style={styles.result}
          >
            <Text style={styles.city}>{result.name}{result.admin1 ? `, ${result.admin1}` : ''}</Text>
            <Text style={styles.country}>{result.country} · {result.timezone}</Text>
          </Pressable>
        );
      })}
      <Text style={styles.attribution}>Search uses Open-Meteo city data. No GPS location is requested.</Text>
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
  attribution: { color: '#89867E', fontSize: 11, lineHeight: 16 },
});
