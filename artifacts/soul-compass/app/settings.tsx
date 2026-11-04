import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileForm } from '@/components/ProfileForm';
import { useProfile } from '@/profile/ProfileContext';
import type { UserProfile } from '@/profile/profile';

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, saveProfile } = useProfile();
  if (!profile) return null;

  async function submit(nextProfile: UserProfile) {
    await saveProfile(nextProfile);
    router.back();
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.heading}>Settings</Text>
        <View style={styles.spacer} />
      </View>
      <ProfileForm initialProfile={profile} submitLabel="Save changes" onSubmit={submit} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F1E8' },
  header: { height: 52, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#58664F', fontSize: 14 },
  heading: { color: '#22241F', fontSize: 16, fontWeight: '600' },
  spacer: { width: 34 },
});
