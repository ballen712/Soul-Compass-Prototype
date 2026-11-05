import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/profile/ProfileContext';
import { CONSENT_VERSION } from '@/profile/local';

export function FirstChartConsentPrompt() {
  const { profile, loaded, error, privacy, setConsent } = useProfile();
  const colors = useColors().cosmos;
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const hasCurrentConsent = privacy.astrologyApiConsent
      && privacy.consentVersion === CONSENT_VERSION
      && !privacy.revokedAt;
    const shouldAsk = loaded && !error && Boolean(profile) && !hasCurrentConsent && !privacy.revokedAt;
    setVisible(shouldAsk);
    if (!shouldAsk) setMessage(null);
  }, [loaded, error, profile, privacy.astrologyApiConsent, privacy.consentVersion, privacy.revokedAt]);

  async function choose(allowed: boolean) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await setConsent(allowed);
      setVisible(false);
    } catch (cause) {
      setMessage(cause instanceof Error
        ? cause.message
        : 'Your choice could not be saved. No birth details will be sent.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => void choose(false)}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.scrim}>
          <View
            accessibilityViewIsModal
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <ScrollView contentContainerStyle={styles.copy} showsVerticalScrollIndicator={false}>
              <Text style={[styles.eyebrow, { color: colors.secondary }]}>OPTIONAL DEEP DIVE</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>Create your Natal Chart?</Text>
              <Text style={[styles.body, { color: colors.foreground }]}>
                To calculate it, Soul Compass sends your birth date, time if known, and birthplace coordinates and time zone to our server. Your name, residence, preferences and collection are not included.
              </Text>
              <Text style={[styles.body, { color: colors.foreground }]}>
                The result is saved on this device. Opening the app again will not send the same birth details. If you edit them, a new chart may be calculated under this permission. Requests are not queued offline or sent when you reconnect.
              </Text>
              <Text style={[styles.note, { color: colors.mutedForeground }]}>
                Cosmos and Crystals work if you choose “Not now.” You can agree later in Natal Chart. Withdrawing in Settings blocks future requests; a saved chart stays on this device.
              </Text>
              {message ? (
                <Text accessibilityRole="alert" style={[styles.body, { color: colors.foreground }]}>{message}</Text>
              ) : null}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void choose(true)}
              style={[styles.primary, { backgroundColor: colors.secondary, opacity: busy ? 0.6 : 1 }]}
            >
              {busy ? <ActivityIndicator color={colors.background} /> : (
                <Text style={[styles.primaryText, { color: colors.background }]}>Agree and calculate</Text>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void choose(false)}
              style={[styles.secondary, { borderColor: colors.border, opacity: busy ? 0.6 : 1 }]}
            >
              <Text style={[styles.secondaryText, { color: colors.foreground }]}>Not now</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrim: { flex: 1, backgroundColor: 'rgba(7, 12, 20, 0.72)', justifyContent: 'center', padding: 20 },
  card: { alignSelf: 'center', width: '100%', maxWidth: 440, maxHeight: '92%', borderWidth: 1, borderRadius: 22, padding: 22 },
  copy: { gap: 14, paddingBottom: 18 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.7 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 29 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  primary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 13, marginTop: 4 },
  primaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  secondary: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, marginTop: 8 },
  secondaryText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
});
