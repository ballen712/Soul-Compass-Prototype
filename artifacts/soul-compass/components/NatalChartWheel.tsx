import type { NatalChartResponse } from '@workspace/api-client-react';
import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

type PlanetPosition = NatalChartResponse['planets'][number];
type Aspect = NatalChartResponse['aspects'][number];
type HouseCusp = NatalChartResponse['houseCusps'][number];
type Angles = NonNullable<NatalChartResponse['angles']>;
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
  radius: number,
  center: number,
  size: number,
  translate: (source: string) => string,
) {
  const sorted = planets
    .map((planet) => {
      const name = normalizedPlanetName(planet.planet);
      const label = translate(name);
      return {
        planet,
        name,
        label,
        width: size < 260
          ? Math.max(34, Math.min(45, 20 + label.length * 3.1))
          : Math.max(42, Math.min(60, 20 + label.length * 4.3)),
        targetAngle: normalizeDegrees(planet.longitude),
      };
    })
    .sort((first, second) => first.targetAngle - second.targetAngle);

  if (sorted.length === 0) return [];

  const requiredGaps = sorted.map((item, index) => {
    const next = sorted[(index + 1) % sorted.length];
    return ((item.width + next.width) / 2 + 5) / radius * (180 / Math.PI);
  });
  const requiredTotal = requiredGaps.reduce((sum, gap) => sum + gap, 0);
  const gapScale = requiredTotal > 359 ? 359 / requiredTotal : 1;
  const minimumGaps = requiredGaps.map((gap) => gap * gapScale);
  const available = 360 - minimumGaps.reduce((sum, gap) => sum + gap, 0);
  const targetGaps = sorted.map((item, index) => {
    const next = sorted[(index + 1) % sorted.length];
    return normalizeDegrees(next.targetAngle - item.targetAngle);
  });
  const surplus = targetGaps.map((gap, index) => Math.max(0, gap - minimumGaps[index]));
  const totalSurplus = surplus.reduce((sum, gap) => sum + gap, 0);
  const displayGaps = minimumGaps.map((gap, index) =>
    gap + (totalSurplus > 0 ? available * surplus[index] / totalSurplus : available / sorted.length),
  );
  const displayAngles: number[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    displayAngles.push(index === 0 ? 0 : displayAngles[index - 1] + displayGaps[index - 1]);
  }

  const offsetX = sorted.reduce(
    (sum, item, index) => sum + Math.cos((item.targetAngle - displayAngles[index]) * Math.PI / 180),
    0,
  );
  const offsetY = sorted.reduce(
    (sum, item, index) => sum + Math.sin((item.targetAngle - displayAngles[index]) * Math.PI / 180),
    0,
  );
  const offset = Math.atan2(offsetY, offsetX) * 180 / Math.PI;

  return sorted.map((item, index) => {
    const angle = normalizeDegrees(displayAngles[index] + offset);
    const point = polarPoint(angle, radius, center);
    return { ...item, angle, x: point.x, y: point.y };
  });
}

export function NatalChartWheel({
  planets,
  palette,
  translate,
  locale,
  moonSignRange,
  timeKnown,
  angles,
  houseCusps,
  majorAspects,
}: {
  planets: PlanetPosition[];
  palette: Palette;
  translate: (source: string) => string;
  locale: string;
  moonSignRange: string[];
  timeKnown: boolean;
  angles: Angles | null;
  houseCusps: HouseCusp[];
  majorAspects: Aspect[];
}) {
  const { width } = useWindowDimensions();
  const size = Math.min(354, Math.max(220, width - 78));
  const center = size / 2;
  const outerRadius = center * 0.93;
  const zodiacInnerRadius = center * 0.78;
  const signRadius = center * 0.855;
  const planetRadius = center * (size < 260 ? 0.61 : 0.64);
  const labelRadius = center * 0.71;
  const houseRingRadius = center * (size < 260 ? 0.46 : 0.48);
  const houseLabelRadius = center * 0.36;
  const labels = useMemo(
    () => layoutPlanetLabels(planets, labelRadius, center, size, translate),
    [planets, labelRadius, center, size, translate],
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
  const orderedHouses = useMemo(
    () => [...houseCusps].sort((first, second) => first.house - second.house),
    [houseCusps],
  );
  const houseLabels = useMemo(
    () => orderedHouses.map((house, index) => {
      const next = orderedHouses[(index + 1) % orderedHouses.length];
      const midpoint = next
        ? normalizeDegrees(house.longitude + normalizeDegrees(next.longitude - house.longitude) / 2)
        : house.longitude;
      return {
        house: house.house,
        ...polarPoint(midpoint, houseLabelRadius, center),
      };
    }),
    [orderedHouses, houseLabelRadius, center],
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
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill={palette.card}
          stroke={palette.border}
          strokeWidth={1}
        />
        <Circle
          cx={center}
          cy={center}
          r={zodiacInnerRadius}
          fill="none"
          stroke={palette.border}
          strokeWidth={1}
          opacity={0.55}
        />
        <Circle
          cx={center}
          cy={center}
          r={planetRadius}
          fill="none"
          stroke={palette.border}
          strokeWidth={0.9}
          opacity={0.7}
        />
        <Circle
          cx={center}
          cy={center}
          r={houseRingRadius}
          fill="none"
          stroke={palette.border}
          strokeWidth={0.8}
          opacity={0.55}
        />
        {SIGN_GLYPHS.map((_, index) => {
          const innerPoint = polarPoint(index * 30, zodiacInnerRadius, center);
          const outerPoint = polarPoint(index * 30, outerRadius, center);
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
        {orderedHouses.map((house) => {
          const point = polarPoint(house.longitude, houseRingRadius, center);
          return (
            <Line
              key={`house-cusp-${house.house}`}
              testID={`natal-house-cusp-line-${house.house}`}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke={palette.border}
              strokeWidth={0.65}
              opacity={0.65}
            />
          );
        })}
        {houseLabels.map(({ house, x, y }) => (
          <SvgText
            key={`house-number-${house}`}
            testID={`natal-house-number-${house}`}
            x={x}
            y={y + 2.5}
            textAnchor="middle"
            fontFamily="Inter"
            fontSize={size < 260 ? 6.5 : 7.5}
            fill={palette.mutedForeground}
          >
            {house}
          </SvgText>
        ))}
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
              fontSize={size < 260 ? 12 : 14}
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
              strokeWidth={0.8 + strength * 0.25}
              strokeDasharray={uncertainMoon ? '1 5' : ASPECT_DASHES[aspect.type.toLowerCase()]}
              strokeLinecap="round"
              opacity={uncertainMoon ? 0.2 : 0.32 + strength * 0.2}
            />
          );
        })}
        {angles ? (
          [
            { key: 'asc', label: 'ASC', longitude: angles.ascendant },
            { key: 'mc', label: 'MC', longitude: angles.midheaven },
          ].map(({ key, label, longitude }) => {
            const point = polarPoint(longitude, outerRadius, center);
            const tickStart = polarPoint(longitude, outerRadius - 7, center);
            const labelPoint = polarPoint(longitude, outerRadius - 19, center);
            return (
              <React.Fragment key={key}>
                <Line
                  x1={tickStart.x}
                  y1={tickStart.y}
                  x2={point.x}
                  y2={point.y}
                  stroke={palette.secondary}
                  strokeWidth={1.4}
                />
                <Circle
                  testID={`natal-angle-marker-${key}`}
                  cx={point.x}
                  cy={point.y}
                  r={2.8}
                  fill={palette.secondary}
                />
                <SvgText
                  x={labelPoint.x}
                  y={labelPoint.y + 3}
                  textAnchor="middle"
                  fontFamily="Inter"
                  fontSize={8}
                  fontWeight="700"
                  fill={palette.secondary}
                >
                  {label}
                </SvgText>
              </React.Fragment>
            );
          })
        ) : null}
        {markers.map(({ planet, x, y }) => {
          const name = normalizedPlanetName(planet.planet);
          const isUncertainMoon = !timeKnown && name === 'Moon';
          const label = labelsByPlanet.get(name.toLowerCase());
          if (!label) return null;
          return (
            <React.Fragment key={planet.planet}>
              <Line
                testID={`natal-planet-leader-${name.toLowerCase()}`}
                x1={x}
                y1={y}
                x2={label.x}
                y2={label.y}
                stroke={palette.mutedForeground}
                strokeWidth={0.6}
                opacity={0.42}
              />
              <Circle
                testID={`natal-planet-marker-${name.toLowerCase()}`}
                cx={x}
                cy={y}
                r={size < 260 ? 2.8 : 3.2}
                fill={isUncertainMoon ? palette.card : palette.secondary}
                stroke={isUncertainMoon ? palette.mutedForeground : palette.secondary}
                strokeWidth={1.2}
                strokeDasharray={isUncertainMoon ? '2 2' : undefined}
              />
              <Rect
                testID={`natal-planet-label-${name.toLowerCase()}`}
                x={label.x - label.width / 2}
                y={label.y - 9}
                width={label.width}
                height={18}
                rx={9}
                fill={palette.card}
                stroke={isUncertainMoon ? palette.mutedForeground : palette.border}
                strokeWidth={0.9}
                strokeDasharray={isUncertainMoon ? '2 2' : undefined}
              />
              <SvgText
                testID={`natal-planet-glyph-${name.toLowerCase()}`}
                x={label.x - label.width / 2 + 10}
                y={label.y + 3}
                textAnchor="middle"
                fontFamily="Inter"
                fontSize={size < 260 ? 9.5 : 11}
                fill={palette.secondary}
              >
                {`${PLANET_GLYPHS[name] ?? name.slice(0, 1)}\uFE0E`}
              </SvgText>
              <SvgText
                testID={`natal-planet-name-${name.toLowerCase()}`}
                x={label.x - label.width / 2 + 19}
                y={label.y + 3}
                textAnchor="start"
                fontFamily="Inter"
                fontSize={size < 260 ? 7.4 : 8.5}
                fontWeight="600"
                fill={palette.foreground}
              >
                {label.label}
              </SvgText>
              {isUncertainMoon ? (
                <SvgText
                  x={label.x + label.width / 2 - 3}
                  y={label.y - 5}
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
