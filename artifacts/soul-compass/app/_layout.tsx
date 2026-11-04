import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
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
import { setBaseUrl } from '@workspace/api-client-react';
import { AuthProvider, useAuth } from '@/auth/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
setBaseUrl(process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : null);

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { profile, loaded, error, reloadCloud } = useProfile();
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!auth.ready || pathname === '/auth/callback') return;
    if (auth.configured && !auth.session) {
      if (pathname !== '/sign-in') router.replace('/sign-in');
      return;
    }
    if (!loaded || error) return;
    if (!profile && !['/onboarding', '/account'].includes(pathname)) router.replace(auth.configured ? '/account' : '/onboarding');
    else if (profile && pathname === '/onboarding') router.replace('/(tabs)');
    else if (auth.session && pathname === '/sign-in') router.replace(profile ? '/(tabs)' : '/account');
  }, [auth.ready, auth.configured, auth.session, error, loaded, pathname, profile, router]);

  const publicRoute = pathname === '/auth/callback' || pathname === '/sign-in';
  const overlay = !publicRoute && (!auth.ready || (auth.configured && !auth.session) || !loaded || error) ? (
    <View style={{ position: 'absolute', inset: 0, backgroundColor: '#F5F1E8', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {error ? <><Text accessibilityRole="alert">{error}</Text><Pressable onPress={() => void reloadCloud()}><Text>Retry cloud profile</Text></Pressable><Pressable onPress={() => void auth.signOut()}><Text>Sign out</Text></Pressable></> : <ActivityIndicator accessibilityLabel="Loading your account" />}
    </View>
  ) : null;

  return (
    <>
    <Stack key={auth.session?.user.id ?? 'local-or-signed-out'} screenOptions={{ headerBackTitle: 'Back', headerShown: false }}>
      <Stack.Protected guard={!auth.configured || Boolean(auth.session)}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="account" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!auth.configured || !auth.session}>
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
    </Stack>
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
      <AuthProvider>
      <ProfileProvider>
        <ErrorBoundary>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
        </ErrorBoundary>
      </ProfileProvider>
      </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
