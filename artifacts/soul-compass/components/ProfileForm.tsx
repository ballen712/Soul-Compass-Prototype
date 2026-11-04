import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeCityPicker } from '@/components/HomeCityPicker';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ProfileSchema } from '@/profile/local';
import type { HomeLocation, ProfileFormDraft, UserProfile } from '@/profile/profile';

type Props = {
  initialProfile?: UserProfile | null;
  initialDraft?: ProfileFormDraft | null;
  submitLabel: string;
  onSubmit: (profile: UserProfile) => Promise<void>;
};

export function ProfileForm({ initialProfile, initialDraft, submitLabel, onSubmit }: Props) {
  const initialBirthTime = initialProfile?.birthTime ?? initialDraft?.birthTime;
  const [birthDate, setBirthDate] = useState(initialProfile?.birthDate ?? initialDraft?.birthDate ?? '');
  const [birthTimeKnown, setBirthTimeKnown] = useState(initialBirthTime?.status === 'known');
  const [birthTime, setBirthTime] = useState(
    initialBirthTime?.status === 'known' ? initialBirthTime.localTime : '',
  );
  const [birthPlace, setBirthPlace] = useState<HomeLocation | null>(
    initialProfile?.birthPlace ?? null,
  );
  const [currentResidence, setCurrentResidence] = useState<HomeLocation | null>(
    initialProfile?.currentResidence ?? initialDraft?.currentResidence ?? null,
  );
  const insets = useSafeAreaInsets();
  const [residenceEnabled, setResidenceEnabled] = useState(
    initialProfile ? initialProfile.currentResidence != null : true,
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
    if (!birthPlace) {
      setError('Search for and select your place of birth.');
      return;
    }

    const candidate: UserProfile = {
      birthDate,
      birthTime: birthTimeKnown
        ? { status: 'known', localTime: birthTime }
        : { status: 'unknown' },
      birthPlace,
      currentResidence: residenceEnabled ? currentResidence : null,
    };
    const parsed = ProfileSchema.safeParse(candidate);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message).filter(Boolean);
      setError(messages.length ? messages.join(' ') : 'Some profile details are invalid. Please review them.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSubmit(parsed.data as UserProfile);
    } catch {
      setError('Your profile could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAwareScrollViewCompat
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 34) + 48 }]}
    >
      <Text style={styles.eyebrow}>YOUR PERSONAL COMPASS</Text>
      <Text style={styles.title}>A little about you.</Text>
      <Text style={styles.description}>
        Your birthplace is essential for a future natal chart. Birth time is optional.
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
          {!birthTimeKnown && <View style={styles.checkmark} />}
        </View>
        <Text style={styles.unknownText}>I don’t know my birth time</Text>
      </Pressable>
      {!birthTimeKnown && (
        <Text style={styles.precisionNote}>
          You can continue without a time. Readings will avoid time-sensitive chart details.
        </Text>
      )}

      <Text style={styles.sectionTitle}>{initialProfile ? 'Edit Place of Birth' : 'Place of Birth'}</Text>
      <Text style={styles.sectionDescription}>Required for natal-chart calculations. This is where you were born, not where you live now.</Text>
      <HomeCityPicker label="Place of birth" value={birthPlace} onSelect={setBirthPlace} />

      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>{initialProfile ? 'Edit Current Residence' : 'Current Residence'}</Text>
      <Text style={styles.sectionDescription}>Recommended for local dates and location-dependent daily readings. You can add this later in Settings.</Text>
      {residenceEnabled ? (
        <>
          <HomeCityPicker label="Current residence" value={currentResidence} onSelect={setCurrentResidence} />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setResidenceEnabled(false);
              setCurrentResidence(null);
            }}
            style={styles.skipResidence}
          >
            <Text style={styles.skipResidenceText}>Skip current residence for now</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setResidenceEnabled(true)}
          style={styles.addResidence}
        >
          <Text style={styles.addResidenceText}>Add current residence</Text>
        </Pressable>
      )}

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={saving}
        onPress={save}
        style={[styles.submit, saving && styles.submitDisabled]}
      >
        <Text style={styles.submitText}>{saving ? 'Saving…' : submitLabel}</Text>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48, gap: 12 },
  eyebrow: { color: '#8A815F', fontSize: 11, letterSpacing: 2, marginTop: 8 },
  title: { color: '#22241F', fontSize: 32, lineHeight: 40, fontWeight: '400', marginTop: 6 },
  description: { color: '#77756F', fontSize: 15, lineHeight: 23, marginBottom: 12 },
  label: { color: '#55574F', fontSize: 11, letterSpacing: 1.4, marginTop: 12 },
  sectionTitle: { color: '#30352D', fontSize: 18, fontWeight: '600', marginTop: 14 },
  sectionDescription: { color: '#77756F', fontSize: 13, lineHeight: 19 },
  sectionDivider: { height: 1, backgroundColor: '#DED9CE', marginTop: 10 },
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
  checkmark: { width: 8, height: 8, borderRadius: 2, backgroundColor: '#FFFFFF' },
  unknownText: { color: '#45473F', fontSize: 14 },
  precisionNote: { color: '#77756F', fontSize: 13, lineHeight: 19, marginTop: -4 },
  skipResidence: { alignSelf: 'flex-start', paddingVertical: 6 },
  skipResidenceText: { color: '#58664F', fontSize: 13, textDecorationLine: 'underline' },
  addResidence: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: '#D9D3C7', alignItems: 'center', justifyContent: 'center' },
  addResidenceText: { color: '#58664F', fontSize: 14, fontWeight: '600' },
  error: { color: '#9C423B', fontSize: 13 },
  submit: { minHeight: 52, borderRadius: 14, backgroundColor: '#25344D', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
});
