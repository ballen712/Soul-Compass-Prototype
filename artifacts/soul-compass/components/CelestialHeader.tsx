import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

const constellations = [
  [[24, 67], [66, 82], [92, 54], [123, 73], [154, 48]],
  [[245, 39], [270, 67], [307, 52], [338, 80], [371, 62]],
  [[170, 119], [196, 101], [222, 121], [246, 108]],
] as const;

const stars = [
  [24, 67, 1.7], [48, 76, 0.9], [66, 82, 1.5], [92, 54, 1.8], [123, 73, 1.35],
  [154, 48, 1.7], [183, 33, 0.95], [208, 76, 1.05], [245, 39, 1.5], [270, 67, 1.8],
  [307, 52, 1.25], [338, 80, 1.65], [371, 62, 1.2], [170, 119, 1.4], [196, 101, 1.8],
  [222, 121, 1.1], [246, 108, 1.5], [42, 142, 0.85], [104, 121, 0.9], [286, 135, 0.85],
  [353, 125, 1.05], [136, 25, 0.9], [324, 27, 0.8],
] as const;

function withAlpha(color: string, alpha: number) {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (!match) return color;
  const [, red, green, blue] = match;
  return `rgba(${parseInt(red, 16)}, ${parseInt(green, 16)}, ${parseInt(blue, 16)}, ${alpha})`;
}

export function CelestialHeader({
  width,
  height,
  fadeColor,
  style,
  testID,
}: {
  width: number;
  height: number;
  fadeColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const colors = useColors();
  const scale = width / 390;
  const backgroundColor = fadeColor ?? colors.cosmos.homeBackground;

  return (
    <View
      pointerEvents="none"
      accessible={false}
      testID={testID}
      style={[styles.container, { height }, style]}
    >
      {constellations.flatMap((points, groupIndex) =>
        points.slice(0, -1).map((start, index) => {
          const end = points[index + 1];
          const dx = end[0] - start[0];
          const dy = end[1] - start[1];
          const lineWidth = Math.hypot(dx, dy) * scale;
          return (
            <View
              key={`line-${groupIndex}-${index}`}
              style={{
                position: 'absolute',
                width: lineWidth,
                height: 0.7,
                left: ((start[0] + end[0]) / 2) * scale - lineWidth / 2,
                top: ((start[1] + end[1]) / 2) * scale - 0.35,
                transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                backgroundColor: groupIndex === 1 ? colors.cosmos.constellationSecondary : colors.cosmos.constellation,
              }}
            />
          );
        }),
      )}
      {stars.map(([cx, cy, radius], index) => {
        const diameter = radius * 2 * scale;
        return (
          <View
            key={`star-${index}`}
            style={{
              position: 'absolute',
              width: diameter,
              height: diameter,
              left: cx * scale - diameter / 2,
              top: cy * scale - diameter / 2,
              borderRadius: diameter / 2,
              backgroundColor: colors.cosmos.star,
            }}
          />
        );
      })}
      <LinearGradient
        colors={[
          withAlpha(backgroundColor, 0),
          withAlpha(backgroundColor, 0.7),
          backgroundColor,
        ]}
        locations={[0.34, 0.73, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
});
