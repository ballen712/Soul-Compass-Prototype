import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileForm } from '@/components/ProfileForm';
import { useProfile } from '@/profile/ProfileContext';
import type { UserProfile } from '@/profile/profile';

export default function OnboardingScreen() {
  const { saveProfile } = useProfile();
  const submit = (profile: UserProfile) => saveProfile(profile);
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <ProfileForm submitLabel="Enter Soul Compass" onSubmit={submit} />
    </SafeAreaView>
  );
}
