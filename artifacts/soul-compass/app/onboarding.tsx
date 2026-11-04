import React from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileForm } from '@/components/ProfileForm';
import { useProfile } from '@/profile/ProfileContext';
import type { UserProfile } from '@/profile/profile';

export default function OnboardingScreen() {
  const { saveProfile, onboardingDraft } = useProfile();
  const router = useRouter();
  const submit = (profile: UserProfile) => saveProfile(profile);
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <Pressable accessibilityRole="link" accessibilityLabel="Open account" onPress={() => router.push('/account')} style={{ alignSelf: 'flex-end', paddingHorizontal: 24, paddingVertical: 12 }}>
        <Text style={{ color: '#58664F', fontSize: 14 }}>Account</Text>
      </Pressable>
      <ProfileForm initialDraft={onboardingDraft} submitLabel="Enter Soul Compass" onSubmit={submit} />
    </SafeAreaView>
  );
}
