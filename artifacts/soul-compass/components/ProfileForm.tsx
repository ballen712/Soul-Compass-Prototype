import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { HomeCityPicker } from '@/components/HomeCityPicker';
import type { HomeLocation, UserProfile } from '@/profile/profile';

type Props = {
  initialProfile?: UserProfile | null;
  submitLabel: string;
  onSubmit: (profile: UserProfile) => Promise<void>;
};

export function ProfileForm({ initialProfile, submitLabel, onSubmit }: Props) {
  const [birthDate, setBirthDate] = useState(initialProfile?.birthDate ?? '');
  const [birthTimeKnown, setBirthTimeKnown] = useState(initialProfile?.birthTime.status === 'known');
  const [birthTime, setBirthTime] = useState(
    initialProfile?.birthTime.status === 'known' ? initialProfile.birthTime.localTime : '',
  );
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(
    initialProfile?.homeLocation ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    const dateParts = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const validDate = dateParts
      ? new Date(Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3])))
      : null;
    if (
      !dateParts ||
      !validDate ||
      validDate.getUTCFullYear() !== Number(dateParts[1]) ||
      validDate.getUTCMonth() !== Number(dateParts[2]) - 1 ||
      validDate.getUTCDate() !== Number(dateParts[3])
    ) {
      setError('Enter your birth date as YYYY-MM-DD.');
      return;
    }
    if (birthTimeKnown && !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) {
      setError('Enter your birth time as HH:MM or choose that you do not know it.');
      return;
    }
    if (!homeLocation) {
      setError('Search for and select your home city.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSubmit({
        birthDate,
        birthTime: birthTimeKnown
          ? { status: 'known', localTime: birthTime }
          : { status: 'unknown' },
        homeLocation,
      });
    } catch {
      setError('Your profile could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>YOUR PERSONAL COMPASS</Text>
      <Text style={styles.title}>A little about you.</Text>
      <Text style={styles.description}>
        Your birth details help shape future readings. Your home city sets the local day for them.
      </Text>

      <Text style={styles.label}>DATE OF BIRTH</Text>
      <TextInput
        accessibilityLabel="Date of birth"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        onChangeText={setBirthDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#8B877F"
        style={styles.input}
        value={birthDate}
      />

      <Text style={styles.label}>BIRTH TIME</Text>
      <TextInput
        accessibilityLabel="Birth time"
        editable={birthTimeKnown}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        onChangeText={setBirthTime}
        placeholder="HH:MM"
        placeholderTextColor="#8B877F"
        style={[styles.input, !birthTimeKnown && styles.disabledInput]}
        value={birthTime}
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !birthTimeKnown }}
        onPress={() => {
          setBirthTimeKnown((known) => !known);
          setError('');
        }}
        style={styles.unknownOption}
      >
        <View style={[styles.checkbox, !birthTimeKnown && styles.checkboxChecked]}>
          {!birthTimeKnown && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.unknownText}>I don’t know my birth time</Text>
      </Pressable>
      {!birthTimeKnown && (
        <Text style={styles.precisionNote}>
          You can continue without a time. Readings will avoid time-sensitive chart details.
        </Text>
      )}

      <Text style={styles.label}>HOME CITY</Text>
      <HomeCityPicker value={homeLocation} onSelect={setHomeLocation} />

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={saving}
        onPress={save}
        style={[styles.submit, saving && styles.submitDisabled]}
      >
        <Text style={styles.submitText}>{saving ? 'Saving…' : submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48, gap: 12 },
  eyebrow: { color: '#8A815F', fontSize: 11, letterSpacing: 2, marginTop: 8 },
  title: { color: '#22241F', fontSize: 32, lineHeight: 40, fontWeight: '400', marginTop: 6 },
  description: { color: '#77756F', fontSize: 15, lineHeight: 23, marginBottom: 12 },
  label: { color: '#55574F', fontSize: 11, letterSpacing: 1.4, marginTop: 12 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D9D3C7',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#25251F',
    backgroundColor: '#FFFEFB',
    fontSize: 15,
  },
  disabledInput: { opacity: 0.5 },
  unknownOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: '#7D806E', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#58664F', borderColor: '#58664F' },
  checkmark: { color: '#FFFFFF', fontSize: 13, lineHeight: 16 },
  unknownText: { color: '#45473F', fontSize: 14 },
  precisionNote: { color: '#77756F', fontSize: 13, lineHeight: 19, marginTop: -4 },
  error: { color: '#9C423B', fontSize: 13 },
  submit: { minHeight: 52, borderRadius: 14, backgroundColor: '#25344D', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
});
