import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileForm } from '@/components/ProfileForm';
import { useProfile } from '@/profile/ProfileContext';
import type { UserProfile } from '@/profile/profile';

export default function OnboardingScreen() {
  const { saveProfile, onboardingDraft } = useProfile();
  const submit = (profile: UserProfile) => saveProfile(profile);
  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, Platform.OS === 'web' && { paddingTop: 67 }]}>
      <View style={styles.welcome}>
        <Text style={styles.welcomeEyebrow}>WELCOME</Text>
        <Text style={styles.welcomeText}>
          Soul Compass offers a short daily reflection, a practical pause, and a stone to sit with. The language stays grounded and understandable. Don't know your birth time? Leave it unknown; some chart details will be skipped.
        </Text>
        <Text style={styles.welcomeText}>
          Current residence is optional and separate from birthplace. It is used only to work out your local date for daily readings; your birthplace is never used for that.
        </Text>
        <Text style={styles.welcomeNote}>
          No account. Your profile, preferences and collection stay on this device. Daily reflections and rituals are calculated here. City search uses the network. Natal Chart is optional: after you agree once, the chart is saved on this device and is recalculated only if your birth details change.
        </Text>
      </View>
      <ProfileForm initialDraft={onboardingDraft} submitLabel="Enter Soul Compass" onSubmit={submit} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F1E8' },
  welcome: { marginHorizontal: 24, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#DED9CE', backgroundColor: '#FBF8F1', gap: 6 },
  welcomeEyebrow: { color: '#8A815F', fontSize: 10, letterSpacing: 1.8 },
  welcomeText: { color: '#55574F', fontSize: 13, lineHeight: 19 },
  welcomeNote: { color: '#77756F', fontSize: 12, lineHeight: 17 },
});
