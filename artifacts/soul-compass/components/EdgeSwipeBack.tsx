import React, { useMemo, useRef } from 'react';
import { PanResponder, Platform, StyleSheet, View } from 'react-native';

type Props = {
  children: React.ReactNode;
  onBack: () => void;
  enabled?: boolean;
  testID?: string;
};

const EDGE_WIDTH = 28;
const ACTIVATION_DISTANCE = 24;
const BACK_DISTANCE = 76;

export function EdgeSwipeBack({
  children,
  onBack,
  enabled = true,
  testID,
}: Props) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  const responder = useMemo(() => {
    if (!enabled || Platform.OS !== 'ios') return null;
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_event, gesture) =>
        gesture.x0 <= EDGE_WIDTH
        && gesture.dx >= ACTIVATION_DISTANCE
        && gesture.dx > Math.abs(gesture.dy) * 1.2,
      onPanResponderRelease: (_event, gesture) => {
        if (
          gesture.x0 <= EDGE_WIDTH
          && gesture.dx >= BACK_DISTANCE
          && gesture.dx > Math.abs(gesture.dy) * 1.2
        ) {
          onBackRef.current();
        }
      },
    });
  }, [enabled]);

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
