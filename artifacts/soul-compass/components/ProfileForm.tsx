import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeCityPicker } from '@/components/HomeCityPicker';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ProfileSchema } from '@/profile/local';
import { useAppText } from '@/localization';
import type { HomeLocation, ProfileFormDraft, UserProfile } from '@/profile/profile';
import {
  formatBirthInputChange,
  type BirthInputKind,
  type InputSelection,
} from '@/components/birthInputFormatting';

type Props = {
  initialProfile?: UserProfile | null;
  initialDraft?: ProfileFormDraft | null;
  submitLabel: string;
  onSubmit: (profile: UserProfile) => Promise<void>;
};

export type ProfileFormHandle = {
  save: () => Promise<boolean>;
};

function useFormattedBirthInput(initialValue: string, kind: BirthInputKind) {
  const [value, setValue] = useState(initialValue);
  const [selection, setSelection] = useState<InputSelection | undefined>(undefined);
  const valueRef = useRef(initialValue);
  const selectionRef = useRef<InputSelection>({
    start: initialValue.length,
    end: initialValue.length,
  });
  const pendingSelectionRef = useRef<InputSelection | null>(null);
  const pendingSelectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (pendingSelectionTimerRef.current) clearTimeout(pendingSelectionTimerRef.current);
  }, []);

  function onChangeText(nextText: string) {
    const next = formatBirthInputChange(valueRef.current, nextText, selectionRef.current, kind);
    const formattedText = next.value !== nextText;
    const selectionWasPending = pendingSelectionRef.current !== null;
    valueRef.current = next.value;
    selectionRef.current = next.selection;
    setValue(next.value);
    if (formattedText || selectionWasPending) {
      pendingSelectionRef.current = next.selection;
      setSelection(formattedText ? next.selection : undefined);
      if (pendingSelectionTimerRef.current) clearTimeout(pendingSelectionTimerRef.current);
      pendingSelectionTimerRef.current = setTimeout(() => {
        pendingSelectionRef.current = null;
        pendingSelectionTimerRef.current = null;
        setSelection(undefined);
      }, 160);
    } else {
      pendingSelectionRef.current = null;
      setSelection(undefined);
    }
  }

  function onSelectionChange(nextSelection: InputSelection) {
    const pendingSelection = pendingSelectionRef.current;
    if (pendingSelection) {
      if (
        nextSelection.start !== pendingSelection.start
        || nextSelection.end !== pendingSelection.end
      ) {
        return;
      }
      pendingSelectionRef.current = null;
      if (pendingSelectionTimerRef.current) clearTimeout(pendingSelectionTimerRef.current);
      pendingSelectionTimerRef.current = null;
      setSelection(undefined);
    }
    selectionRef.current = nextSelection;
  }

  return { value, selection, onChangeText, onSelectionChange };
}

export const ProfileForm = React.forwardRef<ProfileFormHandle, Props>(function ProfileForm(
  { initialProfile, initialDraft, submitLabel, onSubmit },
  ref,
) {
  const t = useAppText();
  const initialBirthTime = initialProfile?.birthTime ?? initialDraft?.birthTime;
  const birthDateInput = useFormattedBirthInput(
    initialProfile?.birthDate ?? initialDraft?.birthDate ?? '',
    'date',
  );
  const birthDate = birthDateInput.value;
  const [birthTimeKnown, setBirthTimeKnown] = useState(
    initialBirthTime ? initialBirthTime.status === 'known' : true,
  );
  const birthTimeInput = useFormattedBirthInput(
    initialBirthTime?.status === 'known' ? initialBirthTime.localTime : '',
    'time',
  );
  const birthTime = birthTimeInput.value;
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
  const savingRef = useRef(false);

  async function save(): Promise<boolean> {
    if (savingRef.current) return false;
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
      setError(t('Enter your birth date as YYYY-MM-DD.'));
      return false;
    }
    if (birthTimeKnown && !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) {
      setError(t('Enter your birth time as HH:MM or choose that you do not know it.'));
      return false;
    }
    if (!birthPlace) {
      setError(t('Search for and select your place of birth.'));
      return false;
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
      setError(messages.length
        ? messages.map((message) => t(message)).join(' ')
        : t('Some profile details are invalid. Please review them.'));
      return false;
    }

    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      await onSubmit(parsed.data as UserProfile);
      return true;
    } catch {
      setError(t('Your profile could not be saved. Please try again.'));
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  useImperativeHandle(ref, () => ({ save }), [
    birthDate,
    birthPlace,
    birthTime,
    birthTimeKnown,
    currentResidence,
    onSubmit,
    residenceEnabled,
  ]);

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.scroll}
      bottomOffset={72}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 34) + 48 }]}
    >
      <Text style={styles.title}>{t('A little about you.')}</Text>
      <Text style={styles.description}>
        {t('Add your birth date and birthplace for your chart. Your birth time is optional.')}
      </Text>

      <Text style={styles.label}>{t('DATE OF BIRTH')}</Text>
      <TextInput
        accessibilityLabel={t('Date of birth')}
        keyboardType="number-pad"
        maxLength={10}
        onChangeText={birthDateInput.onChangeText}
        onSelectionChange={(event) => birthDateInput.onSelectionChange(event.nativeEvent.selection)}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#8B877F"
        selection={birthDateInput.selection}
        style={styles.input}
        value={birthDate}
      />

      <Text style={styles.label}>{t('BIRTH TIME')}</Text>
      <TextInput
        accessibilityLabel={t('Birth time')}
        editable={birthTimeKnown}
        keyboardType="number-pad"
        maxLength={5}
        onChangeText={birthTimeInput.onChangeText}
        onSelectionChange={(event) => birthTimeInput.onSelectionChange(event.nativeEvent.selection)}
        placeholder="HH:MM"
        placeholderTextColor="#8B877F"
        selection={birthTimeInput.selection}
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
        <Text style={styles.unknownText}>{t('I don’t know my birth time')}</Text>
      </Pressable>
      {!birthTimeKnown && (
        <Text style={styles.precisionNote}>
          {t('You can continue without it. Your chart will leave out details that depend on birth time.')}
        </Text>
      )}

      <Text style={styles.sectionTitle}>{t(initialProfile ? 'Edit Place of Birth' : 'Place of Birth')}</Text>
      <Text style={styles.sectionDescription}>
        {t('We use this for your birth chart. It is different from where you live now.')}
      </Text>
      <HomeCityPicker label="Place of birth" value={birthPlace} onSelect={setBirthPlace} />

      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>
        {t(initialProfile ? 'Edit Current Residence' : 'Current Residence')}
      </Text>
      <Text style={styles.sectionDescription}>
        {t('Add where you live so daily readings use your local date. You can do this later in Settings.')}
      </Text>
      {residenceEnabled ? (
        <>
          <HomeCityPicker
            label="Current residence"
            value={currentResidence}
            onSelect={setCurrentResidence}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setResidenceEnabled(false);
              setCurrentResidence(null);
            }}
            style={styles.skipResidence}
          >
            <Text style={styles.skipResidenceText}>{t('Skip current residence for now')}</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setResidenceEnabled(true)}
          style={styles.addResidence}
        >
          <Text style={styles.addResidenceText}>{t('Add current residence')}</Text>
        </Pressable>
      )}

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={saving}
        onPress={save}
        style={[styles.submit, saving && styles.submitDisabled]}
      >
        <Text style={styles.submitText}>{saving ? t('Saving…') : t(submitLabel)}</Text>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48, gap: 12 },
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
