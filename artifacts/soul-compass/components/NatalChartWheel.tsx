import { Feather } from '@expo/vector-icons';
import type { NatalChartResponse } from '@workspace/api-client-react';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, TSpan } from 'react-native-svg';

type PlanetPosition = NatalChartResponse['planets'][number];
type Aspect = NatalChartResponse['aspects'][number];
type HouseCusp = NatalChartResponse['houseCusps'][number];
type ChartAngles = NonNullable<NatalChartResponse['angles']>;
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
  aspectTension: string;
  aspectFlow: string;
  aspectConjunction: string;
};

const SIGN_GLYPHS = [
  '♈', '♉', '♊', '♋', '♌', '♍',
  '♎', '♏', '♐', '♑', '♒', '♓',
] as const;
const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
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
const SUPPORTED_ASPECTS = new Set(Object.keys(ASPECT_DASHES));

function aspectColor(type: string, palette: Palette) {
  const normalized = type.toLowerCase();
  if (normalized === 'conjunction') return palette.aspectConjunction;
  if (normalized === 'trine' || normalized === 'sextile') return palette.aspectFlow;
  return palette.aspectTension;
}

function normalizedPlanetName(value: string) {
  return value ? `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}` : value;
}

function polarPoint(longitude: number, radius: number, center: number, rotation = 0) {
  const radians = (normalizeDegrees(longitude) + rotation - 90) * Math.PI / 180;
  return {
    x: center + Math.cos(radians) * radius,
    y: center + Math.sin(radians) * radius,
  };
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function orderedHouseCusps(cusps: HouseCusp[]) {
  if (cusps.length !== 12) return [];
  const ordered = cusps.slice().sort((first, second) => first.house - second.house);
  if (ordered.some((cusp, index) =>
    cusp.house !== index + 1 || !Number.isFinite(cusp.longitude))) return [];
  const spans = ordered.map((cusp, index) =>
    normalizeDegrees(ordered[(index + 1) % ordered.length].longitude - cusp.longitude),
  );
  return spans.every((span) => span > 1e-8) ? ordered : [];
}

function midpointLongitude(first: number, second: number) {
  return normalizeDegrees(first + normalizeDegrees(second - first) / 2);
}

function boxesOverlap(
  first: { left: number; right: number; top: number; bottom: number },
  second: { left: number; right: number; top: number; bottom: number },
  padding = 0,
) {
  return first.left < second.right + padding
    && first.right + padding > second.left
    && first.top < second.bottom + padding
    && first.bottom + padding > second.top;
}

function formatPlanetPosition(longitude: number, locale: string, translate: (source: string) => string) {
  const totalArcMinutes = Math.round(normalizeDegrees(longitude) * 60) % (360 * 60);
  const signIndex = Math.floor(totalArcMinutes / (30 * 60));
  const withinSignMinutes = totalArcMinutes % (30 * 60);
  const degrees = Math.floor(withinSignMinutes / 60);
  const minutes = withinSignMinutes % 60;
  return `${degrees.toLocaleString(locale, { minimumIntegerDigits: 2, useGrouping: false })}° ${String(minutes).padStart(2, '0')}′ ${translate(SIGN_NAMES[signIndex])}`;
}

function layoutPlanetLabels(
  planets: PlanetPosition[],
  center: number,
  baseSize: number,
  scale: number,
  translate: (source: string) => string,
  rotation: number,
  houseMidpoints: number[],
) {
  const fontSize = (baseSize < 260 ? 6.8 : 7.6) * scale;
  const houseNumberFontSize = (baseSize < 260 ? 8 : 9) * scale;
  const houseLabelBoxes = houseMidpoints.map((longitude) => {
    const point = polarPoint(longitude, center * 0.545, center, rotation);
    const width = 7 * scale;
    return {
      left: point.x - width / 2,
      right: point.x + width / 2,
      top: point.y - houseNumberFontSize + 2 * scale,
      bottom: point.y + 3 * scale,
    };
  });
  const labels: PlanetLabel[] = planets
    .map((planet) => {
      const name = normalizedPlanetName(planet.planet);
      const label = translate(name);
      return {
        planet,
        name,
        label,
        width: Math.max(32, Math.min(68, 20 + label.length * 4.2)) * scale,
        targetAngle: normalizeDegrees(planet.longitude + rotation),
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
    const marker = polarPoint(label.planet.longitude, markerRadius, center, rotation);
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
      !houseLabelBoxes.some((houseBox) => boxesOverlap(box, houseBox, 2 * scale))
      && placed.every((other) => !boxesOverlap(box, other.box, 2 * scale)),
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
  houseByPlanet,
  houseCusps = [],
  angles = null,
  formatText,
}: {
  planets: PlanetPosition[];
  palette: Palette;
  translate: (source: string) => string;
  locale: string;
  moonSignRange: string[];
  timeKnown: boolean;
  majorAspects: Aspect[];
  houseByPlanet?: Map<string, number>;
  houseCusps?: HouseCusp[];
  angles?: ChartAngles | null;
  formatText?: (source: string, values: Record<string, string | number>) => string;
}) {
  const [aspectsVisible, setAspectsVisible] = useState(true);
  const [selectedPlanetName, setSelectedPlanetName] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const baseSize = Math.min(380, Math.max(220, width - 64));
  const size = Math.min(450, width - 12, Math.round(baseSize * 1.18));
  const scale = size / baseSize;
  const center = size / 2;
  const validAngles = angles
    && [angles.ascendant, angles.descendant, angles.midheaven, angles.imumCoeli].every(Number.isFinite)
    ? angles
    : null;
  const actualHouseCusps = orderedHouseCusps(houseCusps);
  const houseMidpoints = actualHouseCusps.map((cusp, index) =>
    midpointLongitude(cusp.longitude, actualHouseCusps[(index + 1) % actualHouseCusps.length].longitude),
  );
  const rotation = validAngles ? normalizeDegrees(270 - validAngles.ascendant) : 0;
  const zodiacOuterRadius = center * 0.74;
  const zodiacInnerRadius = center * 0.59;
  const signRadius = center * 0.665;
  const planetRadius = center * 0.5;
  const houseLabelRadius = center * 0.545;
  const axisLineRadius = center * 0.79;
  const axisLabelRadius = center * 0.84;
  const labels = useMemo(
    () => layoutPlanetLabels(planets, center, baseSize, scale, translate, rotation, houseMidpoints),
    [planets, center, baseSize, scale, translate, rotation, houseMidpoints],
  );
  const markers = useMemo(
    () => planets.map((planet) => ({
      planet,
      ...polarPoint(planet.longitude, planetRadius, center, rotation),
    })),
    [planets, planetRadius, center, rotation],
  );
  const houseLabels = actualHouseCusps.map((cusp, index) => {
    const point = polarPoint(houseMidpoints[index], houseLabelRadius, center, rotation);
    return { house: cusp.house, ...point };
  });
  const axes = validAngles ? [
    {
      key: 'asc-dsc',
      first: validAngles.ascendant,
      second: validAngles.descendant,
      color: palette.secondary,
      dash: undefined,
    },
    {
      key: 'mc-ic',
      first: validAngles.midheaven,
      second: validAngles.imumCoeli,
      color: palette.mutedForeground,
      dash: '3 3',
    },
  ] : [];
  const angleLabels = validAngles ? [
    { key: 'asc', short: 'ASC', long: 'Ascendant', longitude: validAngles.ascendant, color: palette.secondary },
    { key: 'dsc', short: 'DSC', long: 'Descendant', longitude: validAngles.descendant, color: palette.secondary },
    { key: 'mc', short: 'MC', long: 'Midheaven', longitude: validAngles.midheaven, color: palette.mutedForeground },
    { key: 'ic', short: 'IC', long: 'Imum Coeli', longitude: validAngles.imumCoeli, color: palette.mutedForeground },
  ] : [];
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
      if (!SUPPORTED_ASPECTS.has(aspect.type.toLowerCase())) return [];
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
    const isUncertainMoon = !timeKnown && name === 'Moon';
    const position = `${translate(name)} ${formatPlanetPosition(planet.longitude, locale, translate)}`;
    const possibleSigns = isUncertainMoon && moonSignRange.length > 1
      ? ` (${moonSignRange.map((possibleSign) => translate(normalizedPlanetName(possibleSign))).join(', ')})`
      : '';
    return isUncertainMoon ? `${position}?${possibleSigns}` : position;
  }).join(', ');
  const selectedPlanet = selectedPlanetName
    ? planets.find((planet) => planet.planet.toLowerCase() === selectedPlanetName)
    : undefined;
  const selectedPlanetIsUncertainMoon = Boolean(
    selectedPlanet && !timeKnown && selectedPlanet.planet.toLowerCase() === 'moon',
  );
  const selectedPlanetAspects = selectedPlanet
    ? majorAspects
      .filter((aspect) => SUPPORTED_ASPECTS.has(aspect.type.toLowerCase())
        && (aspect.first.toLowerCase() === selectedPlanetName
          || aspect.second.toLowerCase() === selectedPlanetName))
      .slice()
      .sort((first, second) => first.orb - second.orb)
    : [];
  const format = formatText ?? ((source: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce(
      (copy, [key, value]) => copy.replaceAll(`{${key}}`, String(value)),
      translate(source),
    ));
  const selectPlanet = (planet: PlanetPosition) => {
    const key = planet.planet.toLowerCase();
    setSelectedPlanetName((current) => current === key ? null : key);
  };

  return (
    <View
      testID="natal-planet-wheel"
      accessible={false}
      accessibilityRole="image"
      style={styles.container}
    >
      <Text
        testID="natal-planet-wheel-summary"
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${translate('PLANETS')}: ${accessiblePositions}`}
        style={styles.accessibilitySummary}
      >
        {`${translate('PLANETS')}: ${accessiblePositions}`}
      </Text>
      <Pressable
        testID="natal-aspect-toggle"
        accessibilityRole="switch"
        accessibilityLabel={translate(aspectsVisible ? 'Hide aspect lines' : 'Show aspect lines')}
        accessibilityState={{ checked: aspectsVisible }}
        onPress={() => setAspectsVisible((visible) => !visible)}
        style={({ pressed }) => [styles.aspectToggle, { opacity: pressed ? 0.68 : 1 }]}
      >
        <Feather name={aspectsVisible ? 'eye' : 'eye-off'} size={14} color={palette.secondary} />
        <Text style={[styles.aspectToggleLabel, { color: palette.secondary }]}>
          {translate('Aspects')}
        </Text>
      </Pressable>
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
          const innerPoint = polarPoint(index * 30, zodiacInnerRadius, center, rotation);
          const outerPoint = polarPoint(index * 30, zodiacOuterRadius, center, rotation);
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
        {actualHouseCusps.map((cusp) => {
          const innerPoint = polarPoint(cusp.longitude, planetRadius, center, rotation);
          const outerPoint = polarPoint(cusp.longitude, zodiacInnerRadius, center, rotation);
          return (
            <Line
              key={`house-cusp-${cusp.house}`}
              testID={`natal-wheel-house-cusp-${cusp.house}`}
              x1={innerPoint.x}
              y1={innerPoint.y}
              x2={outerPoint.x}
              y2={outerPoint.y}
              stroke={palette.border}
              strokeWidth={0.75 * scale}
              opacity={0.8}
            />
          );
        })}
        {houseLabels.map(({ house, x, y }) => (
          <SvgText
            key={`house-number-${house}`}
            testID={`natal-wheel-house-number-${house}`}
            x={x}
            y={y + 2.7 * scale}
            textAnchor="middle"
            fontFamily="Inter"
            fontSize={(baseSize < 260 ? 8 : 9) * scale}
            fill={palette.mutedForeground}
            accessible
            accessibilityLabel={format('House {number}', { number: house })}
          >
            {house.toLocaleString(locale)}
          </SvgText>
        ))}
        {axes.map(({ key, first, second, color, dash }) => {
          const firstPoint = polarPoint(first, axisLineRadius, center, rotation);
          const secondPoint = polarPoint(second, axisLineRadius, center, rotation);
          return (
            <Line
              key={`angle-axis-${key}`}
              testID={`natal-angle-axis-${key}`}
              x1={firstPoint.x}
              y1={firstPoint.y}
              x2={secondPoint.x}
              y2={secondPoint.y}
              stroke={color}
              strokeWidth={(key === 'asc-dsc' ? 1.35 : 1.05) * scale}
              strokeDasharray={dash}
              opacity={0.78}
            />
          );
        })}
        {SIGN_GLYPHS.map((glyph, index) => {
          const point = polarPoint(index * 30 + 15, signRadius, center, rotation);
          return (
            <SvgText
              key={`zodiac-sign-${index}`}
              testID={`natal-zodiac-sign-${index}`}
              x={point.x}
              y={point.y + 5}
              textAnchor="middle"
              fontFamily="Georgia"
              fontSize={(baseSize < 260 ? 13 : 16) * scale}
              fill={palette.secondary}
            >
              {`${glyph}\uFE0E`}
            </SvgText>
          );
        })}
        {angleLabels.map(({ key, short, long, longitude, color }) => {
          const point = polarPoint(longitude, axisLabelRadius, center, rotation);
          return (
            <SvgText
              key={`angle-label-${key}`}
              testID={`natal-angle-label-${key}`}
              x={point.x}
              y={point.y + 2.5 * scale}
              textAnchor="middle"
              fontFamily="Inter"
              fontSize={(baseSize < 260 ? 6.8 : 7.6) * scale}
              fontWeight="600"
              fill={color}
              accessible
              accessibilityLabel={translate(long)}
            >
              {short}
            </SvgText>
          );
        })}
        {aspectsVisible ? aspectLines.map(({ aspect, index, first, second, uncertainMoon }) => {
          const strength = Number.isFinite(aspect.strength)
            ? Math.max(0, Math.min(1, aspect.strength))
            : 0.5;
          const selected = selectedPlanetName !== null
            && (aspect.first.toLowerCase() === selectedPlanetName
              || aspect.second.toLowerCase() === selectedPlanetName);
          const dimmed = selectedPlanetName !== null && !selected;
          return (
            <Line
              key={`${aspect.type}-${aspect.first}-${aspect.second}-${index}`}
              testID={`natal-aspect-line-${aspect.type}-${aspect.first.toLowerCase()}-${aspect.second.toLowerCase()}`}
              x1={first.x}
              y1={first.y}
              x2={second.x}
              y2={second.y}
              stroke={aspectColor(aspect.type, palette)}
              strokeWidth={(selected ? 1.25 + strength * 0.55 : 0.75 + strength * 0.45) * scale}
              strokeDasharray={uncertainMoon ? '1 5' : ASPECT_DASHES[aspect.type.toLowerCase()]}
              strokeLinecap="round"
              opacity={uncertainMoon
                ? selected ? 0.5 : 0.18
                : dimmed ? 0.07 : selected ? 0.94 : 0.28 + strength * 0.38}
            />
          );
        }) : null}
        {markers.map(({ planet, x, y }) => {
          const name = normalizedPlanetName(planet.planet);
          const isUncertainMoon = !timeKnown && name === 'Moon';
          const label = labelsByPlanet.get(name.toLowerCase());
          const selected = selectedPlanetName === name.toLowerCase();
          const position = formatPlanetPosition(planet.longitude, locale, translate);
          const summary = `${translate(name)} · ${position}`;
          return (
            <React.Fragment key={planet.planet}>
              {selected ? (
                <Circle
                  testID={`natal-planet-selection-${name.toLowerCase()}`}
                  cx={x}
                  cy={y}
                  r={9 * scale}
                  fill="none"
                  stroke={palette.secondary}
                  strokeWidth={1.2 * scale}
                  opacity={0.9}
                />
              ) : null}
              <Circle
                testID={`natal-planet-hit-area-${name.toLowerCase()}`}
                cx={x}
                cy={y}
                r={12 * scale}
                fill="transparent"
                accessible
                accessibilityLabel={summary}
                onPress={() => selectPlanet(planet)}
              />
              <Circle
                testID={`natal-planet-marker-${name.toLowerCase()}`}
                cx={x}
                cy={y}
                r={(baseSize < 260 ? 2.8 : 3.2) * scale}
                fill={isUncertainMoon ? palette.card : palette.secondary}
                stroke={isUncertainMoon ? palette.mutedForeground : palette.secondary}
                strokeWidth={1.2 * scale}
                strokeDasharray={isUncertainMoon ? '2 2' : undefined}
                accessible
                accessibilityLabel={summary}
                onPress={() => selectPlanet(planet)}
              />
              {label ? (
                <SvgText
                  testID={`natal-planet-label-${name.toLowerCase()}`}
                  x={label.x}
                  y={label.y + 2.5 * scale}
                  textAnchor="middle"
                  fontFamily="Inter"
                  fontSize={(baseSize < 260 ? 6.8 : 7.6) * scale}
                  accessible
                  accessibilityLabel={summary}
                  onPress={() => selectPlanet(planet)}
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
                    fill={selected ? palette.secondary : palette.foreground}
                  >
                    {` ${label.label}`}
                  </TSpan>
                  {isUncertainMoon ? (
                    <TSpan fill={palette.mutedForeground}>?</TSpan>
                  ) : null}
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>
      {selectedPlanet ? (
        <View
          testID={`natal-planet-detail-${selectedPlanet.planet.toLowerCase()}`}
          accessibilityLiveRegion="polite"
          style={[styles.detailPanel, { borderColor: palette.border }]}
        >
          <View style={styles.detailHeader}>
            <View style={styles.detailTitleRow}>
              <Text style={[styles.detailGlyph, { color: palette.secondary }]}>
                {`${PLANET_GLYPHS[normalizedPlanetName(selectedPlanet.planet)] ?? ''}\uFE0E`}
              </Text>
              <Text style={[styles.detailTitle, { color: palette.foreground }]}>
                {translate(normalizedPlanetName(selectedPlanet.planet))}
              </Text>
            </View>
            <Pressable
              testID="natal-planet-detail-close"
              accessibilityRole="button"
              accessibilityLabel={translate('Close planet details')}
              hitSlop={8}
              onPress={() => setSelectedPlanetName(null)}
              style={({ pressed }) => [styles.detailClose, { opacity: pressed ? 0.65 : 1 }]}
            >
              <Feather name="x" size={17} color={palette.secondary} />
            </Pressable>
          </View>
          <View style={styles.detailPositionRow}>
            <Text style={[styles.detailMeta, { color: palette.mutedForeground }]}>
              {translate('Position')}
            </Text>
            <Text
              testID="natal-planet-detail-position"
              style={[styles.detailPosition, { color: palette.foreground }]}
            >
              {selectedPlanetIsUncertainMoon && moonSignRange.length > 1
                ? moonSignRange.map((sign) => translate(normalizedPlanetName(sign))).join(` ${translate('or')} `)
                : formatPlanetPosition(selectedPlanet.longitude, locale, translate)}
            </Text>
          </View>
          {!timeKnown ? (
            <Text style={[styles.referenceNote, { color: palette.mutedForeground }]}>
              {translate('All placements and aspects represent the reference instant; their exact degrees and motion are time-dependent.')}
            </Text>
          ) : null}
          {houseByPlanet?.has(selectedPlanet.planet.toLowerCase()) ? (
            <Text style={[styles.detailHouse, { color: palette.mutedForeground }]}>
              {format('House {number}', {
                number: houseByPlanet.get(selectedPlanet.planet.toLowerCase())!,
              })}
            </Text>
          ) : null}
          <Text style={[styles.detailSection, { color: palette.secondary }]}>
            {translate('Aspects')}
          </Text>
          {selectedPlanetAspects.length ? selectedPlanetAspects.map((aspect, index) => {
            const otherPlanet = aspect.first.toLowerCase() === selectedPlanetName
              ? aspect.second
              : aspect.first;
            const otherName = normalizedPlanetName(otherPlanet);
            const orb = aspect.orb.toLocaleString(locale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            });
            return (
              <View
                key={`${aspect.first}-${aspect.type}-${aspect.second}-${index}`}
                testID={`natal-planet-detail-aspect-${index}`}
                style={styles.detailAspectRow}
              >
                <View style={[styles.detailAspectDot, { backgroundColor: aspectColor(aspect.type, palette) }]} />
                <Text style={[styles.detailAspectText, { color: palette.foreground }]}>
                  {`${translate(otherName)} · ${translate(aspect.type.toLowerCase())} · ${translate('orb')} ${orb}°`}
                </Text>
              </View>
            );
          }) : (
            <Text style={[styles.detailEmpty, { color: palette.mutedForeground }]}>
              {translate('No major aspects for this planet.')}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  accessibilitySummary: {
    height: 1,
    width: 1,
    opacity: 0.01,
    position: 'absolute',
  },
  aspectToggle: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 30,
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  aspectToggleLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  detailPanel: {
    alignSelf: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 12,
    gap: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailGlyph: {
    fontFamily: 'Georgia',
    fontSize: 20,
  },
  detailTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
  },
  detailClose: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  detailPositionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  detailMeta: {
    fontFamily: 'Inter',
    fontSize: 12,
  },
  detailPosition: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
  },
  referenceNote: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 16,
  },
  detailHouse: {
    fontFamily: 'Inter',
    fontSize: 12,
  },
  detailSection: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  detailAspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailAspectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  detailAspectText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 12,
  },
  detailEmpty: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 17,
  },
});
