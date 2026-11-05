import React, { useMemo, useRef } from 'react';
import { PanResponder, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

const TAB_COUNT = 3;
const EDGE_WIDTH = 32;
const CLAIM_DISTANCE = 20;
const SWITCH_DISTANCE = 76;
const HORIZONTAL_BIAS = 1.25;
const TAB_HREFS = ['/(tabs)', '/(tabs)/crystals', '/(tabs)/natal'] as const;

type GestureInput = {
  enabled: boolean;
  tabIndex: number;
  width: number;
  x0: number;
  dx: number;
  dy: number;
};

export function tabSwipeTarget({ enabled, tabIndex, width, x0, dx, dy }: GestureInput) {
  if (!enabled || Math.abs(dx) < SWITCH_DISTANCE || Math.abs(dx) <= Math.abs(dy) * HORIZONTAL_BIAS) {
    return null;
  }
  if (x0 <= EDGE_WIDTH && dx > 0) return (tabIndex + TAB_COUNT - 1) % TAB_COUNT;
  if (x0 >= width - EDGE_WIDTH && dx < 0) return (tabIndex + 1) % TAB_COUNT;
  return null;
}

function shouldClaim({ enabled, tabIndex, width, x0, dx, dy }: GestureInput) {
  if (!enabled || Math.abs(dx) < CLAIM_DISTANCE || Math.abs(dx) <= Math.abs(dy) * HORIZONTAL_BIAS) {
    return false;
  }
  if (x0 <= EDGE_WIDTH && dx > 0) return true;
  if (x0 >= width - EDGE_WIDTH && dx < 0) return true;
  return false;
}

type Props = {
  children: React.ReactNode;
  tabIndex: number;
  enabled?: boolean;
  testID?: string;
};

export function TabEdgeSwipe({
  children,
  tabIndex,
  enabled = true,
  testID,
}: Props) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const navigateRef = useRef(router.navigate);
  navigateRef.current = router.navigate;

  const responder = useMemo(() => {
    if (Platform.OS !== 'ios' || !enabled) return null;
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_event, gesture) =>
        shouldClaim({ enabled, tabIndex, width, x0: gesture.x0, dx: gesture.dx, dy: gesture.dy }),
      onPanResponderRelease: (_event, gesture) => {
        const target = tabSwipeTarget({
          enabled, tabIndex, width, x0: gesture.x0, dx: gesture.dx, dy: gesture.dy,
        });
        if (target !== null) navigateRef.current(TAB_HREFS[target]);
      },
    });
  }, [enabled, tabIndex, width]);

  return (
    <View
      testID={testID}
      collapsable={false}
      style={styles.fill}
      {...(responder?.panHandlers ?? {})}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
