import type { NatalChartResponse } from '@workspace/api-client-react';
import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, TSpan } from 'react-native-svg';

type PlanetPosition = NatalChartResponse['planets'][number];
type Aspect = NatalChartResponse['aspects'][number];
type PlanetLabel = {
  planet: PlanetPosition;
  name: string;
  label: string;
  width: number;
  targetAngle: number;
};
type Palette = {
  card: string;
  border: string;
  foreground: string;
  secondary: string;
  mutedForeground: string;
};

const SIGN_GLYPHS = [
  '♈', '♉', '♊', '♋', '♌', '♍',
  '♎', '♏', '♐', '♑', '♒', '♓',
] as const;

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
};

const ASPECT_DASHES: Record<string, string | undefined> = {
  conjunction: undefined,
  sextile: '1 3',
  square: '4 3',
  trine: undefined,
  opposition: '5 3',
};

function normalizedPlanetName(value: string) {
  return value ? `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}` : value;
}

function polarPoint(longitude: number, radius: number, center: number) {
  const radians = (((longitude % 360) + 360) % 360 - 90) * Math.PI / 180;
  return {
    x: center + Math.cos(radians) * radius,
    y: center + Math.sin(radians) * radius,
  };
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function layoutPlanetLabels(
  planets: PlanetPosition[],
  center: number,
  baseSize: number,
  scale: number,
  translate: (source: string) => string,
) {
  const fontSize = (baseSize < 260 ? 6.8 : 7.6) * scale;
  const labels: PlanetLabel[] = planets
    .map((planet) => {
      const name = normalizedPlanetName(planet.planet);
      const label = translate(name);
      return {
        planet,
        name,
        label,
        width: Math.max(32, Math.min(68, 20 + label.length * 4.2)) * scale,
        targetAngle: normalizeDegrees(planet.longitude),
      };
    })
    .sort((first, second) =>
      second.width - first.width || first.targetAngle - second.targetAngle,
    );

  const markerRadius = center * 0.5;
  const radii = [0.42, 0.35, 0.28].map((ratio) => center * ratio);
  const angleOffsets = [0, 6, -6, 12, -12, 18, -18, 24, -24, 30, -30, 36, -36];
  const placed: Array<{
    label: PlanetLabel & { x: number; y: number };
    box: { left: number; right: number; top: number; bottom: number };
  }> = [];

  for (const label of labels) {
    const marker = polarPoint(label.planet.longitude, markerRadius, center);
    const ringCandidates = radii.flatMap((radius) => angleOffsets.map((offset) => {
      const angle = label.targetAngle + offset;
      const point = polarPoint(angle, radius, center);
      const distance = Math.hypot(point.x - marker.x, point.y - marker.y);
      const box = {
        left: point.x - label.width / 2 - scale,
        right: point.x + label.width / 2 + scale,
        top: point.y - fontSize + 1.5 * scale,
        bottom: point.y + 3.5 * scale,
      };
      const farthestCorner = Math.hypot(
        Math.abs(point.x - center) + label.width / 2,
        Math.abs(point.y - center) + fontSize / 2,
      );
      return { point, distance, offset, box, farthestCorner };
    }));
    const inwardX = (center - marker.x) / markerRadius;
    const inwardY = (center - marker.y) / markerRadius;
    const tangentX = -inwardY;
    const tangentY = inwardX;
    const nearbyCandidates: Array<{
      point: { x: number; y: number };
      distance: number;
      offset: number;
      box: { left: number; right: number; top: number; bottom: number };
      farthestCorner: number;
    }> = [];
    for (let inward = 8 * scale; inward <= 80 * scale; inward += 8 * scale) {
      for (let tangent = -72 * scale; tangent <= 72 * scale; tangent += 8 * scale) {
        const point = {
          x: marker.x + inwardX * inward + tangentX * tangent,
          y: marker.y + inwardY * inward + tangentY * tangent,
        };
        const distance = Math.hypot(point.x - marker.x, point.y - marker.y);
        const box = {
          left: point.x - label.width / 2 - scale,
          right: point.x + label.width / 2 + scale,
          top: point.y - fontSize + 1.5 * scale,
          bottom: point.y + 3.5 * scale,
        };
        const farthestCorner = Math.hypot(
          Math.abs(point.x - center) + label.width / 2,
          Math.abs(point.y - center) + fontSize / 2,
        );
        nearbyCandidates.push({ point, distance, offset: tangent, box, farthestCorner });
      }
    }
    const candidates = [...ringCandidates, ...nearbyCandidates].filter((candidate) =>
      candidate.distance <= center * 0.5
      && candidate.farthestCorner <= center * 0.57,
    ).filter(({ box }) =>
      marker.x < box.left - 2
      || marker.x > box.right + 2
      || marker.y < box.top - 2
      || marker.y > box.bottom + 2,
    ).sort((first, second) =>
      first.distance - second.distance || Math.abs(first.offset) - Math.abs(second.offset),
    );

    const available = candidates.find(({ box }) =>
      placed.every((other) =>
        box.right + 2 <= other.box.left
        || box.left - 2 >= other.box.right
        || box.bottom + 2 <= other.box.top
        || box.top - 2 >= other.box.bottom,
      ),
    );
    const candidate = available;
    if (!candidate) continue;
    placed.push({
      label: { ...label, x: candidate.point.x, y: candidate.point.y },
      box: candidate.box,
    });
  }

  return placed.map(({ label }) => label);
}

export function NatalChartWheel({
  planets,
  palette,
  translate,
  locale,
  moonSignRange,
  timeKnown,
  majorAspects,
}: {
  planets: PlanetPosition[];
  palette: Palette;
  translate: (source: string) => string;
  locale: string;
  moonSignRange: string[];
  timeKnown: boolean;
  majorAspects: Aspect[];
}) {
  const { width } = useWindowDimensions();
  const baseSize = Math.min(380, Math.max(220, width - 64));
  const size = Math.min(450, width - 12, Math.round(baseSize * 1.18));
  const scale = size / baseSize;
  const center = size / 2;
  const zodiacOuterRadius = center * 0.74;
  const zodiacInnerRadius = center * 0.59;
  const signRadius = center * 0.665;
  const planetRadius = center * 0.5;
  const labels = useMemo(
    () => layoutPlanetLabels(planets, center, baseSize, scale, translate),
    [planets, center, baseSize, scale, translate],
  );
  const markers = useMemo(
    () => planets.map((planet) => ({
      planet,
      ...polarPoint(planet.longitude, planetRadius, center),
    })),
    [planets, planetRadius, center],
  );
  const labelsByPlanet = useMemo(
    () => new Map(labels.map((label) => [label.planet.planet.toLowerCase(), label])),
    [labels],
  );
  const markersByPlanet = useMemo(
    () => new Map(markers.map((marker) => [marker.planet.planet.toLowerCase(), marker])),
    [markers],
  );
  const aspectLines = useMemo(() => {
    return majorAspects.flatMap((aspect, index) => {
      const first = markersByPlanet.get(aspect.first.toLowerCase());
      const second = markersByPlanet.get(aspect.second.toLowerCase());
      if (!first || !second) return [];
      return [{
        aspect,
        index,
        first: { x: first.x, y: first.y },
        second: { x: second.x, y: second.y },
        uncertainMoon: !timeKnown
          && (aspect.first.toLowerCase() === 'moon' || aspect.second.toLowerCase() === 'moon'),
      }];
    });
  }, [majorAspects, markersByPlanet, timeKnown]);

  const accessiblePositions = planets.map((planet) => {
    const name = normalizedPlanetName(planet.planet);
    const sign = normalizedPlanetName(planet.sign);
    const degree = planet.degreeInSign.toLocaleString(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const isUncertainMoon = !timeKnown && name === 'Moon';
    const position = `${translate(name)} ${translate('in')} ${translate(sign)} ${degree}°`;
    const possibleSigns = isUncertainMoon && moonSignRange.length > 1
      ? ` (${moonSignRange.map((possibleSign) => translate(normalizedPlanetName(possibleSign))).join(', ')})`
      : '';
    return isUncertainMoon ? `${position}?${possibleSigns}` : position;
  }).join(', ');

  return (
    <View
      testID="natal-planet-wheel"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${translate('PLANETS')}: ${accessiblePositions}`}
      style={styles.container}
    >
      <Svg
        testID="natal-chart-wheel-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <Circle
          cx={center}
          cy={center}
          r={zodiacOuterRadius}
          fill="none"
          stroke={palette.border}
          strokeWidth={scale}
          opacity={0.55}
        />
        <Circle
          cx={center}
          cy={center}
          r={zodiacInnerRadius}
          fill="none"
          stroke={palette.border}
          strokeWidth={scale}
          opacity={0.55}
        />
        <Circle
          cx={center}
          cy={center}
          r={planetRadius}
          fill="none"
          stroke={palette.border}
          strokeWidth={0.9 * scale}
          opacity={0.7}
        />
        {SIGN_GLYPHS.map((_, index) => {
          const innerPoint = polarPoint(index * 30, zodiacInnerRadius, center);
          const outerPoint = polarPoint(index * 30, zodiacOuterRadius, center);
          return (
            <Line
              key={`zodiac-divider-${index}`}
              x1={innerPoint.x}
              y1={innerPoint.y}
              x2={outerPoint.x}
              y2={outerPoint.y}
              stroke={palette.border}
              strokeWidth={0.8 * scale}
            />
          );
        })}
        {SIGN_GLYPHS.map((glyph, index) => {
          const point = polarPoint(index * 30 + 15, signRadius, center);
          return (
            <SvgText
              key={`zodiac-sign-${index}`}
              testID={`natal-zodiac-sign-${index}`}
              x={point.x}
              y={point.y + 5}
              textAnchor="middle"
              fontFamily="Georgia"
              fontSize={(baseSize < 260 ? 12 : 14) * scale}
              fill={palette.secondary}
            >
              {`${glyph}\uFE0E`}
            </SvgText>
          );
        })}
        {aspectLines.map(({ aspect, index, first, second, uncertainMoon }) => {
          const strength = Number.isFinite(aspect.strength)
            ? Math.max(0, Math.min(1, aspect.strength))
            : 0.5;
          return (
            <Line
              key={`${aspect.type}-${aspect.first}-${aspect.second}-${index}`}
              testID={`natal-aspect-line-${aspect.type}-${aspect.first.toLowerCase()}-${aspect.second.toLowerCase()}`}
              x1={first.x}
              y1={first.y}
              x2={second.x}
              y2={second.y}
              stroke={palette.secondary}
              strokeWidth={(0.8 + strength * 0.25) * scale}
              strokeDasharray={uncertainMoon ? '1 5' : ASPECT_DASHES[aspect.type.toLowerCase()]}
              strokeLinecap="round"
              opacity={uncertainMoon ? 0.2 : 0.32 + strength * 0.2}
            />
          );
        })}
        {markers.map(({ planet, x, y }) => {
          const name = normalizedPlanetName(planet.planet);
          const isUncertainMoon = !timeKnown && name === 'Moon';
          const label = labelsByPlanet.get(name.toLowerCase());
          if (!label) return null;
          return (
            <React.Fragment key={planet.planet}>
              <Circle
                testID={`natal-planet-marker-${name.toLowerCase()}`}
                cx={x}
                cy={y}
                r={(baseSize < 260 ? 2.8 : 3.2) * scale}
                fill={isUncertainMoon ? palette.card : palette.secondary}
                stroke={isUncertainMoon ? palette.mutedForeground : palette.secondary}
                strokeWidth={1.2 * scale}
                strokeDasharray={isUncertainMoon ? '2 2' : undefined}
              />
              <SvgText
                testID={`natal-planet-label-${name.toLowerCase()}`}
                x={label.x}
                y={label.y + 2.5 * scale}
                textAnchor="middle"
                fontFamily="Inter"
                fontSize={(baseSize < 260 ? 6.8 : 7.6) * scale}
              >
                <TSpan
                  testID={`natal-planet-glyph-${name.toLowerCase()}`}
                  fontFamily="Georgia"
                  fill={palette.secondary}
                >
                  {`${PLANET_GLYPHS[name] ?? name.slice(0, 1)}\uFE0E`}
                </TSpan>
                <TSpan
                  testID={`natal-planet-name-${name.toLowerCase()}`}
                  fontFamily="Inter"
                  fontWeight="600"
                  fill={palette.foreground}
                >
                  {` ${label.label}`}
                </TSpan>
                {isUncertainMoon ? (
                  <TSpan fill={palette.mutedForeground}>?</TSpan>
                ) : null}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
