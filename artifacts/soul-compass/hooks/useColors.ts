import { useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';
import { AppearanceContext } from '@/profile/context';
import type { AppearancePreference } from '@/profile/local';
export type AppColorMode = 'light' | 'dark';

export function resolveAppColorMode(
  preference: AppearancePreference,
  systemScheme: AppColorMode | null,
): AppColorMode {
  return preference === 'system' ? systemScheme ?? 'light' : preference;
}

/**
 * Returns the design tokens for the current color scheme.
 *
 * The saved preference can follow the device or force either palette.
 * A missing preference uses System, which keeps older local profiles and
 * isolated component previews on the platform default.
 */
export function useColors() {
  const systemScheme = useColorScheme();
  const preference = useContext(AppearanceContext);
  const mode = resolveAppColorMode(preference, systemScheme);
  const palette = mode === 'dark' ? colors.dark : colors.light;
  return useMemo(() => ({ ...palette, radius: colors.radius, mode }), [palette, mode]);
}
