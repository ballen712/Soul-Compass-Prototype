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
          No account needed. Your profile and crystal collection are saved only on this device. Chart calculations use our server only if you agree to it later in Settings.
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
});
