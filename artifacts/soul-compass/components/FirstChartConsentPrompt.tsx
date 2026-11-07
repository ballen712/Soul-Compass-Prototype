import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAppText } from '@/localization';
import { useProfile } from '@/profile/ProfileContext';
import { CONSENT_VERSION } from '@/profile/local';

export function FirstChartConsentPrompt() {
  const { profile, loaded, error, privacy, setConsent } = useProfile();
  const t = useAppText();
  const palette = useColors();
  const colors = palette.cosmos;
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
        <View style={[styles.scrim, { backgroundColor: palette.scrim }]}>
          <View
            accessibilityViewIsModal
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <ScrollView contentContainerStyle={styles.copy} showsVerticalScrollIndicator={false}>
              <Text style={[styles.title, { color: colors.foreground }]}>{t('Create your Natal Chart?')}</Text>
              <Text style={[styles.body, { color: colors.foreground }]}>
                {t('We send your birth date, time if known, and birthplace details to our server only to calculate your chart. We do not create an online profile with them. If your chart is saved on this device, we use it instead of sending the same details again.')}
              </Text>
              <Text style={[styles.body, { color: colors.foreground }]}>
                {t('Your profile and chart stay on this device. You can withdraw permission or delete your saved data in Settings at any time. If your birth details change, we may send the updated details for a new calculation.')}
              </Text>
              {message ? (
                <Text accessibilityRole="alert" style={[styles.body, { color: colors.foreground }]}>{message}</Text>
              ) : null}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void choose(true)}
              style={[styles.primary, { backgroundColor: palette.primary, opacity: busy ? 0.6 : 1 }]}
            >
              {busy ? <ActivityIndicator color={palette.primaryForeground} /> : (
                <Text style={[styles.primaryText, { color: palette.primaryForeground }]}>{t('Agree and calculate')}</Text>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void choose(false)}
              style={[styles.secondary, { borderColor: colors.border, opacity: busy ? 0.6 : 1 }]}
            >
              <Text style={[styles.secondaryText, { color: colors.foreground }]}>{t('Not now')}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrim: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { alignSelf: 'center', width: '100%', maxWidth: 440, maxHeight: '92%', borderWidth: 1, borderRadius: 22, padding: 22 },
  copy: { gap: 14, paddingBottom: 18 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 29 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  primary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 13, marginTop: 4 },
  primaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  secondary: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, marginTop: 8 },
  secondaryText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
});
