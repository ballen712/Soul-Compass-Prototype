import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export function SettingsButton() {
  const router = useRouter();
  const colors = useColors();
  return (
    <Pressable
      testID="settings-button"
      accessibilityLabel="Open settings"
      accessibilityRole="button"
      onPress={() => router.push('/settings')}
      style={styles.button}
    >
      <Feather name="settings" size={16} color={colors.cosmos.secondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
});
