import type { NatalChartResponse } from '@workspace/api-client-react';
import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

type PlanetPosition = NatalChartResponse['planets'][number];
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

const PLANET_LANES = [50, 64, 78] as const;
const DEFAULT_LANE = PLANET_LANES[1];

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

function layoutPlanets(planets: PlanetPosition[], center: number) {
  const placed: Array<{
    planet: PlanetPosition;
    x: number;
    y: number;
    radius: number;
  }> = [];

  const sorted = [...planets].sort((first, second) => first.longitude - second.longitude);
  for (const planet of sorted) {
    const candidates = PLANET_LANES.map((radius) => ({
      radius,
      ...polarPoint(planet.longitude, radius, center),
    }));
    const best = candidates.reduce((bestCandidate, candidate) => {
      const clearance = placed.length
        ? Math.min(...placed.map((item) => Math.hypot(item.x - candidate.x, item.y - candidate.y)))
        : Number.POSITIVE_INFINITY;
      const bestClearance = placed.length
        ? Math.min(...placed.map((item) => Math.hypot(item.x - bestCandidate.x, item.y - bestCandidate.y)))
        : Number.POSITIVE_INFINITY;
      return clearance > bestClearance ? candidate : bestCandidate;
    });
    placed.push({ planet, ...best });
  }

  return placed;
}

export function NatalChartWheel({
  planets,
  palette,
  translate,
  locale,
  moonSignRange,
  timeKnown,
}: {
  planets: PlanetPosition[];
  palette: Palette;
  translate: (source: string) => string;
  locale: string;
  moonSignRange: string[];
  timeKnown: boolean;
}) {
  const { width } = useWindowDimensions();
  const size = Math.min(276, Math.max(220, width - 116));
  const center = size / 2;
  const markers = useMemo(() => layoutPlanets(planets, center), [planets, center]);

  const accessiblePositions = planets.map((planet) => {
    const name = normalizedPlanetName(planet.planet);
    const sign = normalizedPlanetName(planet.sign);
    const degree = planet.degreeInSign.toLocaleString(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const isUncertainMoon = !timeKnown
      && name === 'Moon'
      && moonSignRange.length > 1;
    const position = `${translate(name)} ${translate('in')} ${translate(sign)} ${degree}°`;
    return isUncertainMoon ? `${position}?` : position;
  }).join(', ');

  return (
    <View
      testID="natal-planet-wheel"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${translate('PLANETS')}: ${accessiblePositions}`}
      style={styles.container}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={center - 3}
          fill={palette.card}
          stroke={palette.border}
          strokeWidth={1}
        />
        <Circle
          cx={center}
          cy={center}
          r={center - 32}
          fill="none"
          stroke={palette.border}
          strokeWidth={1}
        />
        {SIGN_GLYPHS.map((_, index) => {
          const innerPoint = polarPoint(index * 30, center - 32, center);
          const outerPoint = polarPoint(index * 30, center - 3, center);
          return (
            <Line
              key={`zodiac-divider-${index}`}
              x1={innerPoint.x}
              y1={innerPoint.y}
              x2={outerPoint.x}
              y2={outerPoint.y}
              stroke={palette.border}
              strokeWidth={0.8}
            />
          );
        })}
        {SIGN_GLYPHS.map((glyph, index) => {
          const point = polarPoint(index * 30 + 15, center - 17, center);
          return (
            <SvgText
              key={`zodiac-sign-${index}`}
              testID={`natal-zodiac-sign-${index}`}
              x={point.x}
              y={point.y + 5}
              textAnchor="middle"
              fontFamily="serif"
              fontSize={15}
              fill={palette.secondary}
            >
              {glyph}
            </SvgText>
          );
        })}
        <Circle
          cx={center}
          cy={center}
          r={30}
          fill={palette.card}
          stroke={palette.border}
          strokeWidth={1}
        />
        <Circle cx={center} cy={center} r={2} fill={palette.secondary} />
        {markers.map(({ planet, x, y, radius }) => {
          const name = normalizedPlanetName(planet.planet);
          const glyph = PLANET_GLYPHS[name] ?? name.slice(0, 1);
          const isUncertainMoon = !timeKnown
            && name === 'Moon'
            && moonSignRange.length > 1;
          const exactPoint = polarPoint(planet.longitude, DEFAULT_LANE, center);
          const color = name === 'Sun' || name === 'Moon'
            ? palette.secondary
            : palette.foreground;
          return (
            <React.Fragment key={planet.planet}>
              {Math.abs(radius - DEFAULT_LANE) > 0.5 ? (
                <Line
                  x1={exactPoint.x}
                  y1={exactPoint.y}
                  x2={x}
                  y2={y}
                  stroke={palette.mutedForeground}
                  strokeWidth={0.8}
                  opacity={0.72}
                />
              ) : null}
              <Circle
                testID={`natal-planet-marker-${name.toLowerCase()}`}
                cx={x}
                cy={y}
                r={10}
                fill={palette.card}
                stroke={isUncertainMoon ? palette.mutedForeground : color}
                strokeWidth={1}
                strokeDasharray={isUncertainMoon ? '2 2' : undefined}
              />
              <SvgText
                testID={`natal-planet-glyph-${name.toLowerCase()}`}
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontFamily="serif"
                fontSize={13}
                fill={color}
              >
                {glyph}
              </SvgText>
              {isUncertainMoon ? (
                <SvgText
                  x={x + 8}
                  y={y - 7}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight="700"
                  fill={palette.mutedForeground}
                >
                  ?
                </SvgText>
              ) : null}
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
