import React from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
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

export default function TabLayout() {
  return <ClassicTabLayout />;
}
