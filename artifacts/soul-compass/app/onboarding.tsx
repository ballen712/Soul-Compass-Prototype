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
          Soul Compass gives you a short daily reflection and a simple idea to carry with you. You can also explore a birth chart and find a stone to reflect on. Don’t know your birth time? Leave it blank; some chart details will be left out.
        </Text>
        <Text style={styles.welcomeText}>
          Where you live now is optional and separate from your birthplace. We use it only to match daily readings to your local date.
        </Text>
        <Text style={styles.welcomeNote}>
          No account is needed. Your profile, preferences, and stone collection stay on this device. Daily readings are worked out here. City search uses the internet. The Natal Chart is optional: if you agree, your birth details are sent to calculate it. The chart is saved here and updated only if you change those details.
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
