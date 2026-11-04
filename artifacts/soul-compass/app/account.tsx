import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthContext';
import { useProfile } from '@/profile/ProfileContext';
import colors from '@/constants/colors';
import { styles as s } from './sign-in';

const c = colors.light;
const LANGUAGES = [{ code: 'en', label: 'English' }, { code: 'es', label: 'Spanish' }, { code: 'fr', label: 'French' }, { code: 'de', label: 'German' }, { code: 'pt', label: 'Portuguese' }];
const toList = (v: string) => Array.from(new Set(v.split(',').map(x => x.trim().toLowerCase()).filter(Boolean)));
const msg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');

function Btn({ label, onPress, busy, disabled, kind = 'primary', testID }: { label: string; onPress: () => void; busy?: boolean; disabled?: boolean; kind?: 'primary' | 'secondary' | 'danger'; testID?: string }) {
  const off = disabled || busy;
  const box = kind === 'primary' ? s.primary : kind === 'danger' ? [s.primary, { backgroundColor: c.destructive }] : s.secondary;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!off, busy: !!busy }} disabled={off} onPress={onPress} style={[box, off && s.disabled]}>
      {busy ? <ActivityIndicator color={kind === 'secondary' ? c.primary : c.primaryForeground} /> : <Text style={kind === 'secondary' ? s.secondaryText : s.primaryText}>{label}</Text>}
    </Pressable>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const auth = useAuth();
  const p = useProfile();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmImport, setConfirmImport] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [language, setLanguage] = useState(p.preferences.language);
  const [intentions, setIntentions] = useState(p.preferences.crystalPreferences.intentions.join(', '));
  const [hidden, setHidden] = useState(p.preferences.crystalPreferences.hiddenCrystals.join(', '));

  useEffect(() => {
    setLanguage(p.preferences.language);
    setIntentions(p.preferences.crystalPreferences.intentions.join(', '));
    setHidden(p.preferences.crystalPreferences.hiddenCrystals.join(', '));
  }, [p.cloudVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(key: string, action: () => Promise<void>, done?: string) {
    if (busy) return;
    setBusy(key); setError(null); setNotice(null);
    try { await action(); if (done) setNotice(done); } catch (e) { setError(msg(e)); } finally { setBusy(null); }
  }

  const header = (
    <View style={st.header}>
      <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}><Text style={st.back}>Back</Text></Pressable>
      <Text style={st.heading}>Account</Text>
      <View style={{ width: 34 }} />
    </View>
  );
  const wrap = (children: React.ReactNode) => (
    <SafeAreaView edges={['top']} style={s.safe}>
      {header}
      <ScrollView contentContainerStyle={[s.scroll, { paddingTop: 16 }]} keyboardShouldPersistTaps="handled"><View style={s.page}>{children}</View></ScrollView>
    </SafeAreaView>
  );

  if (!auth.configured) return wrap(
    <>
      <Text style={s.eyebrow}>LOCAL MODE</Text>
      <Text style={s.title}>Your compass lives{'\n'}on this device.</Text>
      <Text style={s.body}>Cloud accounts are not set up yet, so there is nothing to sign in to. Your profile remains saved locally and every reading keeps working.</Text>
      <View style={s.pendingCard}><Text style={s.pendingLabel}>SETUP PENDING</Text><Text style={s.body}>Sign-in, sync, language and crystal preferences will become available once cloud accounts are enabled.</Text></View>
      <Btn label="Return to Soul Compass" onPress={() => router.replace('/')} />
    </>,
  );

  if (!auth.ready) return wrap(<ActivityIndicator color={c.primary} style={{ marginTop: 40 }} />);
  if (!auth.session) return wrap(
    <>
      <Text style={s.title}>You are signed out.</Text>
      <Text style={s.body}>Sign in to see your account.</Text>
      <Btn label="Sign in" onPress={() => router.replace('/sign-in')} />
    </>,
  );

  const email = auth.session.user.email ?? 'Signed in';
  const provider = String(auth.session.user.app_metadata?.provider ?? 'email');
  const banners = (
    <>
      {error ? <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text> : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text> : null}
    </>
  );
  const identity = (
    <View style={s.pendingCard}>
      <Text style={s.pendingLabel}>SIGNED IN</Text>
      <Text style={st.identity}>{email}</Text>
      <Text style={st.meta}>via {provider === 'google' ? 'Google' : 'email code'}{p.cloudVersion != null ? `  /  cloud version ${p.cloudVersion}` : ''}</Text>
      <Btn kind="secondary" label="Sign out" busy={busy === 'signout'} disabled={!!busy} onPress={() => run('signout', async () => { await auth.signOut(); router.replace('/sign-in'); })} />
    </View>
  );

  const importBlock = p.localImportAvailable ? (
    <View style={st.section}>
      <Text style={st.sectionTitle}>Profile saved on this device</Text>
      <Text style={s.body}>A profile from before accounts exists on this device. Importing creates your cloud profile from it. It never overwrites an existing cloud profile; if one already exists the local copy stays untouched.</Text>
      {!confirmImport ? (
        <Btn kind="secondary" label="Import this device's profile" disabled={!!busy} onPress={() => setConfirmImport(true)} testID="import-start" />
      ) : (
        <View style={st.confirm}>
          <Text style={st.confirmText}>Create your cloud profile from the copy on this device? After a confirmed save, the local copy is removed from this device.</Text>
          <Btn label="Yes, import" busy={busy === 'import'} disabled={!!busy} onPress={() => run('import', async () => { await p.importLocalProfile(); setConfirmImport(false); }, 'Your profile was imported to the cloud.')} testID="import-confirm" />
          <Btn kind="secondary" label="Cancel" disabled={!!busy} onPress={() => setConfirmImport(false)} />
        </View>
      )}
    </View>
  ) : null;

  if (!p.loaded && !p.error) return wrap(<>{identity}<View style={st.skeleton} /><View style={[st.skeleton, { height: 60 }]} /></>);

  if (p.error && !p.profile) return wrap(
    <>
      {identity}
      <Text style={s.error}>{p.error}</Text>
      <Btn label="Retry sync" busy={busy === 'sync'} onPress={() => run('sync', p.reloadCloud)} />
    </>,
  );

  if (!p.profile) return wrap(
    <>
      <Text style={s.eyebrow}>WELCOME</Text>
      <Text style={s.title}>Let us place{'\n'}your compass.</Text>
      {banners}
      {identity}
      {importBlock}
      <View style={st.section}>
        <Text style={st.sectionTitle}>{p.localImportAvailable ? 'Or start fresh' : 'Create your profile'}</Text>
        <Text style={s.body}>Enter your birth details to begin. {p.localImportAvailable ? 'Starting fresh leaves the local copy on this device.' : ''}</Text>
        <Btn label="Create a new profile" disabled={!!busy} onPress={() => router.push('/onboarding')} />
      </View>
    </>,
  );

  const prefs = p.preferences;
  const dirty = language !== prefs.language || toList(intentions).join() !== prefs.crystalPreferences.intentions.join() || toList(hidden).join() !== prefs.crystalPreferences.hiddenCrystals.join();

  return wrap(
    <>
      <Text style={s.eyebrow}>YOUR ACCOUNT</Text>
      <Text style={s.title}>Held in the cloud.</Text>
      {banners}
      {p.error ? <Text style={s.error}>{p.error}</Text> : null}
      {identity}
      {importBlock}

      <View style={st.section}>
        <Text style={st.sectionTitle}>Preferences</Text>
        <Text style={s.label}>Preferred language</Text>
        <Text style={st.meta}>Saved as a preference. The app itself is currently shown in English.</Text>
        <View style={st.chips}>
          {LANGUAGES.map(l => (
            <Pressable key={l.code} accessibilityRole="radio" accessibilityState={{ selected: language === l.code }} onPress={() => setLanguage(l.code)} style={[st.chip, language === l.code && st.chipOn]}>
              <Text style={[st.chipText, language === l.code && { color: c.primaryForeground }]}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.label}>Crystal intentions</Text>
        <TextInput value={intentions} onChangeText={setIntentions} placeholder="calm, clarity, rest" placeholderTextColor={c.mutedForeground} style={s.input} accessibilityLabel="Crystal intentions, comma separated" autoCapitalize="none" />
        <Text style={s.label}>Hidden crystals</Text>
        <TextInput value={hidden} onChangeText={setHidden} placeholder="labradorite" placeholderTextColor={c.mutedForeground} style={s.input} accessibilityLabel="Hidden crystal names, comma separated" autoCapitalize="none" />
        <Text style={st.meta}>Separate with commas. Collection: {prefs.crystalCollection.length ? prefs.crystalCollection.join(', ') : 'empty'}</Text>
        <Btn label="Save preferences" busy={busy === 'prefs'} disabled={!!busy || !dirty}
          onPress={() => run('prefs', () => p.savePreferences({ ...prefs, language, crystalPreferences: { intentions: toList(intentions), hiddenCrystals: toList(hidden) } }), 'Preferences saved.')} />
        <Btn kind="secondary" label="Sync now" busy={busy === 'sync'} disabled={!!busy} onPress={() => run('sync', p.reloadCloud, 'Synced with the cloud.')} />
      </View>

      <View style={[st.section, { borderColor: '#E3C9C2' }]}>
        <Text style={[st.sectionTitle, { color: c.destructive }]}>Delete account</Text>
        <Text style={s.body}>Permanently deletes your account and all cloud data: profile and preferences. Any older profile still stored only on this device is intentionally left in place.</Text>
        {!deleting ? (
          <Btn kind="secondary" label="Delete my account" disabled={!!busy} onPress={() => setDeleting(true)} />
        ) : (
          <View style={st.confirm}>
            <Text style={st.confirmText}>Type DELETE to confirm. This cannot be undone.</Text>
            <TextInput value={deleteText} onChangeText={setDeleteText} autoCapitalize="characters" accessibilityLabel="Type DELETE to confirm" style={s.input} />
            <Btn kind="danger" label="Delete everything in the cloud" busy={busy === 'delete'} disabled={!!busy || deleteText !== 'DELETE'}
              onPress={() => run('delete', async () => { await p.deleteAccount(); router.replace('/sign-in'); })} testID="delete-confirm" />
            <Btn kind="secondary" label="Cancel" disabled={!!busy} onPress={() => { setDeleting(false); setDeleteText(''); }} />
          </View>
        )}
      </View>
    </>,
  );
}

const st = StyleSheet.create({
  header: { height: 52, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#58664F', fontSize: 14 },
  heading: { color: '#22241F', fontSize: 16, fontWeight: '600' },
  identity: { fontFamily: 'Georgia', fontSize: 21, color: c.foreground, marginTop: 8 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, color: c.mutedForeground, marginTop: 6 },
  section: { marginTop: 22, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.card },
  sectionTitle: { fontFamily: 'Georgia', fontSize: 20, color: c.foreground },
  confirm: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: c.secondary },
  confirmText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19, color: c.secondaryForeground, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: c.border },
  chipOn: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: c.foreground },
  skeleton: { height: 120, borderRadius: 20, backgroundColor: c.secondary, marginTop: 22, opacity: 0.6 },
});
