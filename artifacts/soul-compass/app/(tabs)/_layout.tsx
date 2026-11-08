import React from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAppText } from '@/localization';

const tabLabelTextStyle: TextStyle = {
  flexShrink: 1,
  fontFamily: 'Inter_600SemiBold',
  fontSize: 8.5,
  lineHeight: 11,
  letterSpacing: 0.2,
  textAlign: 'center',
  width: '100%',
};

const tabLabelContainerStyle: ViewStyle = {
  alignItems: 'center',
  height: 22,
  justifyContent: 'center',
  minWidth: 0,
  width: '100%',
};

function FixedTabLabel({
  color,
  children,
}: {
  color: TextStyle['color'] | null;
  children: string;
}) {
  return (
    <View style={tabLabelContainerStyle}>
      <Text numberOfLines={2} style={[tabLabelTextStyle, color == null ? undefined : { color }]}>
        {children}
      </Text>
    </View>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const t = useAppText();
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navigation.foreground,
        tabBarInactiveTintColor: colors.navigation.mutedForeground,
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
          paddingHorizontal: 0,
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
          title: t('COSMOS'),
          tabBarLabel: FixedTabLabel,
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
          title: t('CRYSTALS'),
          tabBarLabel: FixedTabLabel,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name="diamond-stone"
              size={20}
              color={focused ? colors.navigation.foreground : colors.navigation.mutedForeground}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="natal"
        options={{
          title: t('NATAL CHART'),
          tabBarLabel: FixedTabLabel,
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
      <Tabs.Screen
        name="explore"
        options={{
          title: t('EXPLORE'),
          tabBarLabel: FixedTabLabel,
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="compass"
              size={19}
              color={focused ? colors.navigation.foreground : colors.navigation.mutedForeground}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function LiquidGlassTabLayout() {
  const colors = useColors();
  const t = useAppText();
  const labelStyle = {
    default: {
      color: colors.navigation.mutedForeground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 9,
    },
    selected: {
      color: colors.navigation.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 9,
    },
  } as const;

  return (
    <NativeTabs
      iconColor={{
        default: colors.navigation.mutedForeground,
        selected: colors.navigation.foreground,
      }}
      labelStyle={labelStyle}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} />
        <NativeTabs.Trigger.Label>{t('COSMOS')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="crystals">
        <NativeTabs.Trigger.Icon sf={{ default: 'diamond', selected: 'diamond.fill' }} />
        <NativeTabs.Trigger.Label>{t('CRYSTALS')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="natal">
        <NativeTabs.Trigger.Icon sf={{ default: 'scope', selected: 'scope' }} />
        <NativeTabs.Trigger.Label>{t('NATAL CHART')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon sf={{ default: 'safari', selected: 'safari.fill' }} />
        <NativeTabs.Trigger.Label>{t('EXPLORE')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return <LiquidGlassTabLayout />;
  }
  return <ClassicTabLayout />;
}
