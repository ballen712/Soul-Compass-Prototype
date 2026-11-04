import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthContext';
import colors from '@/constants/colors';
import { styles } from '../sign-in';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { completeCallback, configured, session } = useAuth();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const exchange = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    setError(null);
    try {
      if (!configured) throw new Error('Cloud sign-in is not configured yet.');
      const url = Platform.OS === 'web' ? window.location.href : await Linking.getInitialURL();
      if (!url) throw new Error('No sign-in code was received. Start sign-in again.');
      await completeCallback(url);
      if (Platform.OS === 'web') window.history.replaceState(null, '', '/auth/callback');
      router.replace('/account');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in could not be completed.');
    }
  }, [completeCallback, configured, router]);

  useEffect(() => { void exchange(); }, [exchange]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={[styles.scroll, { flex: 1, justifyContent: 'center' }]}>
        <View style={styles.page}>
          <Text style={styles.eyebrow}>SOUL COMPASS  ACCOUNT</Text>
          {error ? (
            <>
              <Text style={styles.title}>Sign-in did not finish.</Text>
              <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>
              {session ? (
                <Pressable accessibilityRole="button" style={styles.primary} onPress={() => router.replace('/account')}><Text style={styles.primaryText}>Go to account</Text></Pressable>
              ) : (
                <Pressable accessibilityRole="button" style={styles.primary} onPress={() => router.replace(configured ? '/sign-in' : '/')}>
                  <Text style={styles.primaryText}>{configured ? 'Start sign-in again' : 'Return to Soul Compass'}</Text>
                </Pressable>
              )}
            </>
          ) : (
            <View accessibilityLabel="Completing sign-in" style={{ alignItems: 'flex-start', gap: 18 }}>
              <Text style={styles.title}>Finding your way in...</Text>
              <ActivityIndicator color={colors.light.primary} />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
