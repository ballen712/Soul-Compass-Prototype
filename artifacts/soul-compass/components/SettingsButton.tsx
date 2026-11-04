import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function SettingsButton() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityLabel="Open settings"
      accessibilityRole="button"
      onPress={() => router.push('/settings')}
      style={styles.button}
    >
      <Feather name="settings" size={16} color="#B7AD8E" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
});
