import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_GUIDE_SEEN_KEY } from '@/constants/app-guide';
import { AppGuideCards } from '@/components/AppGuideContent';
import { useColors } from '@/hooks/useColors';
import { CONSENT_VERSION } from '@/profile/local';
import { useProfile } from '@/profile/ProfileContext';

export function FirstRunAppGuide() {
  const colors = useColors();
  const { profile, loaded, error, privacy } = useProfile();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const natalConsentResolved = privacy.revokedAt !== null
    || (privacy.astrologyApiConsent && privacy.consentVersion === CONSENT_VERSION);
  const canShow = loaded && !error && Boolean(profile) && natalConsentResolved;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(APP_GUIDE_SEEN_KEY)
      .then((seen) => {
        if (!active) return;
        setVisible(seen !== 'true');
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        setVisible(true);
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const dismiss = async () => {
    try {
      await AsyncStorage.setItem(APP_GUIDE_SEEN_KEY, 'true');
    } catch {
      console.warn('Could not save the Soul Compass introduction preference.');
    }
    setVisible(false);
  };

  return (
    <Modal
      visible={ready && visible && canShow}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => void dismiss()}
    >
      <View style={[styles.backdrop, { backgroundColor: 'rgba(7, 11, 19, 0.78)' }]}>
        <SafeAreaView style={styles.safeArea}>
          <View
            accessibilityViewIsModal
            style={[
              styles.dialog,
              {
                backgroundColor: colors.cosmos.background,
                borderColor: colors.cosmos.border,
              },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={[styles.eyebrow, { color: colors.cosmos.secondary }]}>WELCOME</Text>
                <Text style={[styles.title, { color: colors.cosmos.foreground }]}>
                  A quick guide to Soul Compass
                </Text>
              </View>
              <Pressable
                testID="first-run-guide-close"
                accessibilityRole="button"
                accessibilityLabel="Close introduction"
                onPress={() => void dismiss()}
                hitSlop={12}
                style={styles.close}
              >
                <Feather name="x" size={20} color={colors.cosmos.foreground} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <Text style={[styles.label, { color: colors.cosmos.secondary }]}>
                FOUR WAYS TO EXPLORE
              </Text>
              <AppGuideCards variant="modal" />
            </ScrollView>
            <Pressable
              testID="first-run-guide-start"
              accessibilityRole="button"
              onPress={() => void dismiss()}
              style={[styles.action, { backgroundColor: colors.cosmos.secondary }]}
            >
              <Text style={[styles.actionText, { color: colors.cosmos.background }]}>
                Explore the app
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 16 },
  safeArea: { maxHeight: '100%', justifyContent: 'center' },
  dialog: { maxHeight: '97%', borderWidth: 1, borderRadius: 24, padding: 18 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  headerCopy: { flex: 1, gap: 5 },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_600SemiBold' },
  title: { fontSize: 22, lineHeight: 28, fontFamily: 'Inter_600SemiBold' },
  close: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  content: { gap: 10, paddingBottom: 10 },
  label: { fontSize: 10, letterSpacing: 1.4, fontFamily: 'Inter_600SemiBold' },
  action: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  actionText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
