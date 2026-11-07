import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ProfileProvider, useProfile } from '@/profile/ProfileContext';
import { NatalAutoRefresh, NatalCalculationProvider } from '@/hooks/useNatalCalculation';
import { setBaseUrl } from '@workspace/api-client-react';
import { FirstChartConsentPrompt } from '@/components/FirstChartConsentPrompt';
import { AppLocaleProvider, useAppText } from '@/localization';
import { useColors } from '@/hooks/useColors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
setBaseUrl(process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : null);

const queryClient = new QueryClient();

function RootLayoutNav() {
  const t = useAppText();
  const colors = useColors();
  const { profile, loaded, error, reloadLocal } = useProfile();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loaded || error) return;
    const isPublicInfoPage = pathname === '/privacy' || pathname === '/support';
    if (!profile && pathname !== '/onboarding' && !isPublicInfoPage) router.replace('/onboarding');
    else if (profile && pathname === '/onboarding') router.replace('/(tabs)');
  }, [loaded, error, pathname, profile, router]);

  const overlay = !loaded || error ? (
    <View style={{ position: 'absolute', inset: 0, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {error ? <><Text accessibilityRole="alert" style={{ color: colors.foreground }}>{t(error)}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('Retry local storage')} onPress={() => void reloadLocal()}><Text style={{ color: colors.tint }}>{t('Retry local storage')}</Text></Pressable></> : <ActivityIndicator accessibilityLabel={t('Loading your local profile')} color={colors.tint} />}
    </View>
  ) : null;

  return (
    <>
    <StatusBar style={colors.mode === 'dark' ? 'light' : 'dark'} />
    <NatalAutoRefresh />
    <Stack screenOptions={{ headerBackTitle: 'Back', headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="support" options={{ headerShown: false }} />
    </Stack>
    <FirstChartConsentPrompt />
    {overlay}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <AppLocaleProvider>
          <NatalCalculationProvider>
            <ErrorBoundary>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
            </ErrorBoundary>
          </NatalCalculationProvider>
        </AppLocaleProvider>
      </ProfileProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
