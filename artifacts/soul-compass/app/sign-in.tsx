import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthContext';
import colors from '@/constants/colors';

const c = colors.light;
type Busy = null | 'google' | 'send' | 'verify';

export default function SignInScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(kind: Exclude<Busy, null>, action: () => Promise<void>) {
    if (busy) return;
    setBusy(kind); setError(null); setNotice(null); auth.clearError();
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(null); }
  }
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const send = () => run('send', async () => { await auth.sendEmailCode(email); setSentTo(email.trim().toLowerCase()); setCode(''); setNotice('A code is on its way. Check your inbox.'); });
  const verify = () => run('verify', async () => { if (!sentTo) return; await auth.verifyEmailCode(sentTo, code); router.replace('/account'); });

  if (!auth.configured) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.page}>
            <Text style={styles.eyebrow}>SOUL COMPASS  ACCOUNT</Text>
            <Text style={styles.title}>Cloud sign-in{'\n'}is not set up yet.</Text>
            <Text style={styles.body}>Accounts are still being configured for this space. Your profile stays on this device and the app works as before. No sign-in will be attempted.</Text>
            <View style={styles.pendingCard} accessibilityRole="summary">
              <Text style={styles.pendingLabel}>SETUP PENDING</Text>
              <Text style={styles.body}>Google and email sign-in will appear here once cloud accounts are enabled.</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.primary}>
              <Text style={styles.primaryText}>Return to Soul Compass</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const shownError = error ?? auth.error;
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.page}>
          <Text style={styles.eyebrow}>SOUL COMPASS  ACCOUNT</Text>
          <Text style={styles.title}>Keep your compass{'\n'}with you.</Text>
          <Text style={styles.body}>Sign in to keep your profile and crystal preferences across devices.</Text>

          {shownError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{shownError}</Text> : null}
          {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}

          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!busy, busy: busy === 'google' }} disabled={!!busy}
            onPress={() => run('google', auth.signInGoogle)} style={[styles.primary, busy && styles.disabled]} testID="google-sign-in">
            {busy === 'google' ? <ActivityIndicator color={c.primaryForeground} /> : <Text style={styles.primaryText}>Continue with Google</Text>}
          </Pressable>

          <View style={styles.dividerRow}><View style={styles.line} /><Text style={styles.dividerText}>OR WITH EMAIL</Text><View style={styles.line} /></View>

          {!sentTo ? (
            <>
              <Text style={styles.label}>Email address</Text>
              <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address"
                accessibilityLabel="Email address" placeholder="you@example.com" placeholderTextColor={c.mutedForeground} style={styles.input}
                editable={!busy} onSubmitEditing={() => validEmail && send()} />
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: !validEmail || !!busy }} disabled={!validEmail || !!busy}
                onPress={send} style={[styles.secondary, (!validEmail || busy) && styles.disabled]} testID="send-code">
                {busy === 'send' ? <ActivityIndicator color={c.primary} /> : <Text style={styles.secondaryText}>Continue with Email code</Text>}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>Code sent to {sentTo}</Text>
              <TextInput value={code} onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 10))} keyboardType="number-pad"
                autoComplete={Platform.OS === 'web' ? 'one-time-code' : 'sms-otp'} accessibilityLabel="One-time code" placeholder="Enter code"
                placeholderTextColor={c.mutedForeground} style={[styles.input, styles.code]} editable={!busy} />
              <Pressable accessibilityRole="button" disabled={code.length < 6 || !!busy} accessibilityState={{ disabled: code.length < 6 || !!busy }}
                onPress={verify} style={[styles.primary, (code.length < 6 || busy) && styles.disabled]} testID="verify-code">
                {busy === 'verify' ? <ActivityIndicator color={c.primaryForeground} /> : <Text style={styles.primaryText}>Verify and continue</Text>}
              </Pressable>
              <View style={styles.row}>
                <Pressable accessibilityRole="button" disabled={!!busy} onPress={() => run('send', async () => { await auth.sendEmailCode(sentTo); setNotice('A new code was sent.'); })}>
                  <Text style={styles.link}>{busy === 'send' ? 'Sending...' : 'Resend code'}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={!!busy} onPress={() => { setSentTo(null); setCode(''); setNotice(null); setError(null); }}>
                  <Text style={styles.link}>Use another email</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  scroll: { alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'web' ? 67 : 32, paddingBottom: 48 },
  page: { width: '100%', maxWidth: 440 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.7, color: c.primary, marginBottom: 14 },
  title: { fontFamily: 'Georgia', fontSize: 33, lineHeight: 40, letterSpacing: -0.8, color: c.foreground },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 21, color: c.mutedForeground, marginTop: 10 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: c.foreground, marginTop: 18, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: c.border, backgroundColor: c.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 15, color: c.foreground },
  code: { letterSpacing: 6, fontSize: 20, textAlign: 'center' },
  primary: { marginTop: 22, minHeight: 50, borderRadius: 25, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: c.primaryForeground },
  secondary: { marginTop: 14, minHeight: 48, borderRadius: 24, borderWidth: 1, borderColor: c.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  secondaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: c.primary },
  disabled: { opacity: 0.45 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28 },
  line: { flex: 1, height: 1, backgroundColor: c.border },
  dividerText: { fontFamily: 'Inter_600SemiBold', fontSize: 8, letterSpacing: 1.3, color: c.mutedForeground },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  link: { fontFamily: 'Inter_500Medium', fontSize: 13, color: c.primary, paddingVertical: 6 },
  error: { marginTop: 18, padding: 12, borderRadius: 12, backgroundColor: '#F3E3DE', color: c.destructive, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19 },
  notice: { marginTop: 18, padding: 12, borderRadius: 12, backgroundColor: c.secondary, color: c.secondaryForeground, fontFamily: 'Inter_500Medium', fontSize: 13 },
  pendingCard: { marginTop: 24, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.card },
  pendingLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.5, color: c.tint },
});
