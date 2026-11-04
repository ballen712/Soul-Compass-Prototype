import React from 'react';
import { Feather } from '@expo/vector-icons';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'sparkles', selected: 'sparkles' }}
        />
        <NativeTabs.Trigger.Label>COSMOS</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="crystals">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'diamond', selected: 'diamond.fill' }}
        />
        <NativeTabs.Trigger.Label>CRYSTALS</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="natal">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'circle.circle', selected: 'circle.circle.fill' }}
        />
        <NativeTabs.Trigger.Label>NATAL</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navigation.foreground,
        tabBarInactiveTintColor: colors.navigation.mutedForeground,
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 9,
          letterSpacing: 1.4,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.navigation.background,
          borderTopWidth: 1,
          borderTopColor: colors.navigation.border,
          elevation: 0,
          ...(isWeb ? { height: 84, paddingBottom: 0 } : {}),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'COSMOS',
          tabBarIcon: ({ color, focused }) =>
            <Feather
              name="sun"
              size={19}
              color={
                focused
                  ? colors.navigation.foreground
                  : colors.navigation.mutedForeground
              }
            />,
        }}
      />
      <Tabs.Screen
        name="crystals"
        options={{
          title: 'CRYSTALS',
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="hexagon"
              size={19}
              color={
                focused
                  ? colors.navigation.foreground
                  : colors.navigation.mutedForeground
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="natal"
        options={{
          title: 'NATAL',
          tabBarIcon: ({ focused }) => (
            <Feather
              name="target"
              size={19}
              color={
                focused
                  ? colors.navigation.foreground
                  : colors.navigation.mutedForeground
              }
            />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
