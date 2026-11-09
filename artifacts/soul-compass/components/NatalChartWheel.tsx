import { Feather } from '@expo/vector-icons';
import type { NatalChartResponse } from '@workspace/api-client-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, TSpan } from 'react-native-svg';
import { SCREEN_HORIZONTAL_GUTTER } from '@/constants/screen-layout';
import type { DailyAstrology } from '@/profile/astrology';

type CalculatedDailyAstrology = Extract<DailyAstrology, { status: 'calculated' }>;
type PlanetPosition = Pick<NatalChartResponse['planets'][number], 'planet' | 'longitude'> & { sign?: string };
type NatalAspect = NatalChartResponse['aspects'][number];
type HouseCusp = NatalChartResponse['houseCusps'][number];
type ChartAngles = NonNullable<NatalChartResponse['angles']>;
type TransitPlanetPosition = { body: string; longitude: number; sign: string };
type TransitAspect = {
  transitBody: string;
  natalBody: string;
  aspect: string;
  maxOrb: number;
  reliability: 'high' | 'limited';
};
type ChartMode = 'natal' | 'transits' | 'combined';
type WheelAspect = {
  first: string;
  second: string;
  type: string;
  orb: number;
  strength: number;
  kind: 'natal' | 'transit';
};
type AspectLine = {
  aspect: WheelAspect;
  index: number;
  key: string;
  first: { x: number; y: number };
  second: { x: number; y: number };
  uncertainMoon: boolean;
};
type PlanetLabel = {
  planet: PlanetPosition;
  label: string;
  width: number;
  fontSize: number;
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
const ASPECT_MEANINGS: Record<string, string> = {
  conjunction: 'These themes blend, so one can bring the other to the surface.',
  opposition: 'You may feel pulled between these needs; finding a workable balance can help.',
  trine: 'These themes tend to support each other with less effort.',
  square: 'These themes can compete for attention and ask you to adjust or choose what matters first.',
  sextile: 'These themes can support each other when you choose to use them together.',
};
const HOUSE_THEMES = [
  'first impressions, new situations, and how you choose to present yourself as you begin',
  'money and belongings, your personal values, and the choices that help you build security',
  'everyday conversations, learning new skills, and exchanging ideas with people around you',
  'home, family, your roots, and the routines that help you feel you belong',
  'creativity, romance, fun, and the things you enjoy making or sharing',
  'daily routines, work, practical responsibilities, and the ways you look after yourself',
  'close one-to-one relationships, cooperation, and the decisions you make with another person',
  'trust, shared money or responsibilities, and the deeper changes that ask you to adapt',
  'learning, travel, new experiences, and the beliefs that guide how you see the world',
  'work, long-term goals, the responsibilities you take on, and how others see your contribution',
  'friendships, communities, shared causes, and the future plans you build with other people',
  'rest, private feelings, time alone, and the quiet moments you need to process life',
] as const;

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
  scale: number,
  rotation: number,
  houseMidpoints: number[],
) {
  const fontSize = Math.max(12, 16 * scale);
  const houseNumberFontSize = Math.max(8, 9 * scale);
  const houseLabelBoxes = houseMidpoints.map((longitude) => {
    const point = polarPoint(longitude, center * 0.625, center, rotation);
    const width = houseNumberFontSize * 0.8;
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
      const label = PLANET_GLYPHS[name] ?? name.slice(0, 1);
      return {
        planet,
        label,
        width: fontSize * 1.15,
        fontSize,
        targetAngle: normalizeDegrees(planet.longitude + rotation),
      };
    })
    .sort((first, second) =>
      second.width - first.width || first.targetAngle - second.targetAngle,
    );

  const markerRadius = center * 0.52;
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
          top: point.y - fontSize * 0.7,
          bottom: point.y + fontSize * 0.35,
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
          top: point.y - fontSize * 0.7,
          bottom: point.y + fontSize * 0.35,
        };
        const farthestCorner = Math.hypot(
          Math.abs(point.x - center) + label.width / 2,
          Math.abs(point.y - center) + fontSize / 2,
        );
        nearbyCandidates.push({ point, distance, offset: tangent, box, farthestCorner });
      }
    }
    const candidates = [...ringCandidates, ...nearbyCandidates].filter((candidate) =>
      candidate.distance <= center * 0.52
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
  transitPlanets = [],
  transitAspects = [],
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
  transitPlanets?: TransitPlanetPosition[];
  transitAspects?: TransitAspect[];
  palette: Palette;
  translate: (source: string) => string;
  locale: string;
  moonSignRange: string[];
  timeKnown: boolean;
  majorAspects: NatalAspect[];
  houseByPlanet?: Map<string, number>;
  houseCusps?: HouseCusp[];
  angles?: ChartAngles | null;
  formatText?: (source: string, values: Record<string, string | number>) => string;
}) {
  const [aspectsVisible, setAspectsVisible] = useState(true);
  const [selectedPlanetName, setSelectedPlanetName] = useState<string | null>(null);
  const [selectedPlanetKind, setSelectedPlanetKind] = useState<'natal' | 'transit'>('natal');
  const [selectedHouseNumber, setSelectedHouseNumber] = useState<number | null>(null);
  const [selectedAspectKey, setSelectedAspectKey] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<ChartMode>('natal');
  const transitsAvailable = transitPlanets.length > 0;
  useEffect(() => {
    if (!transitsAvailable && chartMode !== 'natal') {
      setChartMode('natal');
      setSelectedPlanetName(null);
      setSelectedAspectKey(null);
      setSelectedHouseNumber(null);
    }
  }, [chartMode, transitsAvailable]);
  const { width } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const fallbackWidth = Math.max(180, width - 2 * (SCREEN_HORIZONTAL_GUTTER + 14));
  const availableWidth = measuredWidth && measuredWidth > 0
    ? Math.min(measuredWidth, width)
    : fallbackWidth;
  const size = Math.min(450, Math.max(180, availableWidth));
  const scale = size / 360;
  const center = size / 2;
  const validAngles = timeKnown && angles
    && [angles.ascendant, angles.descendant, angles.midheaven, angles.imumCoeli].every(Number.isFinite)
    ? angles
    : null;
  const actualHouseCusps = timeKnown ? orderedHouseCusps(houseCusps) : [];
  const houseMidpoints = actualHouseCusps.map((cusp, index) =>
    midpointLongitude(cusp.longitude, actualHouseCusps[(index + 1) % actualHouseCusps.length].longitude),
  );
  const rotation = validAngles ? normalizeDegrees(270 - validAngles.ascendant) : 0;
  const zodiacOuterRadius = center * 0.88;
  const zodiacInnerRadius = center * 0.73;
  const signRadius = center * 0.805;
  const planetRadius = center * 0.52;
  const transitPlanetRadius = center * 0.39;
  const houseLabelRadius = center * 0.625;
  const axisLineRadius = center * 0.9;
  const axisLabelRadius = center * 0.93;
  const labels = useMemo(
    () => layoutPlanetLabels(planets, center, scale, rotation, houseMidpoints),
    [planets, center, scale, rotation, houseMidpoints],
  );
  const markers = useMemo(
    () => planets.map((planet) => ({
      planet,
      ...polarPoint(planet.longitude, planetRadius, center, rotation),
    })),
    [planets, planetRadius, center, rotation],
  );
  const transitMarkers = useMemo(
    () => transitPlanets.map(({ body, longitude, sign }) => ({
      planet: body,
      longitude,
      sign,
      ...polarPoint(longitude, transitPlanetRadius, center, rotation),
    })),
    [transitPlanets, transitPlanetRadius, center, rotation],
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
  const transitMarkersByPlanet = useMemo(
    () => new Map(transitMarkers.map((marker) => [marker.planet.toLowerCase(), marker])),
    [transitMarkers],
  );
  const natalAspectModels: WheelAspect[] = useMemo(() => majorAspects
    .filter((aspect) => SUPPORTED_ASPECTS.has(aspect.type.toLowerCase()))
    .map((aspect) => ({
      first: aspect.first,
      second: aspect.second,
      type: aspect.type,
      orb: aspect.orb,
      strength: aspect.strength,
      kind: 'natal',
    })), [majorAspects]);
  const transitAspectModels: WheelAspect[] = useMemo(() => transitAspects
    .filter((aspect) => SUPPORTED_ASPECTS.has(aspect.aspect.toLowerCase()))
    .map((aspect) => ({
      first: aspect.transitBody,
      second: aspect.natalBody,
      type: aspect.aspect,
      orb: aspect.maxOrb,
      strength: 0.65,
      kind: 'transit',
    })), [transitAspects]);
  const natalAspectLines: AspectLine[] = useMemo(() => {
    return majorAspects.flatMap((aspect, index) => {
      if (!SUPPORTED_ASPECTS.has(aspect.type.toLowerCase())) return [];
      const first = markersByPlanet.get(aspect.first.toLowerCase());
      const second = markersByPlanet.get(aspect.second.toLowerCase());
      if (!first || !second) return [];
      return [{
        aspect: natalAspectModels.find((model) =>
          model.first === aspect.first && model.second === aspect.second && model.type === aspect.type,
        )!,
        index,
        key: `natal-${aspect.first.toLowerCase()}-${aspect.type.toLowerCase()}-${aspect.second.toLowerCase()}-${index}`,
        first: { x: first.x, y: first.y },
        second: { x: second.x, y: second.y },
        uncertainMoon: !timeKnown
          && (aspect.first.toLowerCase() === 'moon' || aspect.second.toLowerCase() === 'moon'),
      }];
    });
  }, [majorAspects, markersByPlanet, natalAspectModels, timeKnown]);
  const transitAspectLines: AspectLine[] = useMemo(() => {
    return transitAspects.flatMap((aspect, index) => {
      if (!SUPPORTED_ASPECTS.has(aspect.aspect.toLowerCase())) return [];
      const first = transitMarkersByPlanet.get(aspect.transitBody.toLowerCase());
      const second = markersByPlanet.get(aspect.natalBody.toLowerCase());
      if (!first || !second) return [];
      const model = transitAspectModels.find((candidate) =>
        candidate.first === aspect.transitBody
        && candidate.second === aspect.natalBody
        && candidate.type === aspect.aspect,
      );
      if (!model) return [];
      return [{
        aspect: model,
        index,
        key: `transit-${aspect.transitBody.toLowerCase()}-${aspect.aspect.toLowerCase()}-${aspect.natalBody.toLowerCase()}-${index}`,
        first: { x: first.x, y: first.y },
        second: { x: second.x, y: second.y },
        uncertainMoon: aspect.reliability === 'limited',
      }];
    });
  }, [transitAspects, transitMarkersByPlanet, markersByPlanet, transitAspectModels]);
  const aspectLines = chartMode === 'natal'
    ? natalAspectLines
    : chartMode === 'transits'
      ? transitAspectLines
      : [...natalAspectLines, ...transitAspectLines];
  const selectedPlanetAspects = selectedPlanetName
    ? selectedPlanetKind === 'transit'
      ? transitAspectModels.filter((aspect) =>
        aspect.first.toLowerCase() === selectedPlanetName,
      )
      : [
        ...natalAspectModels.filter((aspect) =>
          aspect.first.toLowerCase() === selectedPlanetName
          || aspect.second.toLowerCase() === selectedPlanetName,
        ),
        ...(chartMode === 'combined'
          ? transitAspectModels.filter((aspect) =>
            aspect.second.toLowerCase() === selectedPlanetName,
          )
          : []),
      ].sort((first, second) => first.orb - second.orb)
    : [];
  const selectedPlanet = selectedPlanetName
    ? selectedPlanetKind === 'transit'
      ? transitMarkers.find((marker) => marker.planet.toLowerCase() === selectedPlanetName)
      : planets.find((planet) => planet.planet.toLowerCase() === selectedPlanetName)
    : undefined;
  const selectedHouseCusp = selectedHouseNumber === null
    ? undefined
    : actualHouseCusps.find((cusp) => cusp.house === selectedHouseNumber);
  const selectedHousePlanets = selectedHouseNumber === null
    ? []
    : planets.filter((planet) =>
      houseByPlanet?.get(planet.planet.toLowerCase()) === selectedHouseNumber,
    );
  const selectedAspectLine = selectedAspectKey === null
    ? undefined
    : aspectLines.find((line) => line.key === selectedAspectKey);
  const selectedPlanetIsUncertainMoon = Boolean(
    selectedPlanet
      && selectedPlanetKind === 'natal'
      && !timeKnown
      && selectedPlanet.planet.toLowerCase() === 'moon',
  );
  const format = formatText ?? ((source: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce(
      (copy, [key, value]) => copy.replaceAll(`{${key}}`, String(value)),
      translate(source),
    ));
  const formatAspectTitle = (aspect: WheelAspect) => format('{first} {aspect} {second}', {
    first: translate(normalizedPlanetName(aspect.first)),
    aspect: translate(aspect.type.toLowerCase()),
    second: translate(normalizedPlanetName(aspect.second)),
  });
  const formatAspectOrb = (aspect: WheelAspect) => {
    const orb = aspect.orb.toLocaleString(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${translate('orb')} ${orb}°`;
  };
  const formatAspectAccessibilityLabel = (aspect: WheelAspect) =>
    `${aspect.kind === 'transit' ? `${translate('Transit aspect')}, ` : ''}${formatAspectTitle(aspect)}, ${formatAspectOrb(aspect)}`;
  const selectPlanet = (planet: PlanetPosition, kind: 'natal' | 'transit' = 'natal') => {
    const key = planet.planet.toLowerCase();
    setSelectedHouseNumber(null);
    setSelectedAspectKey(null);
    if (selectedPlanetName === key && selectedPlanetKind === kind) {
      setSelectedPlanetName(null);
    } else {
      setSelectedPlanetKind(kind);
      setSelectedPlanetName(key);
    }
  };
  const selectHouse = (house: number) => {
    setSelectedPlanetName(null);
    setSelectedAspectKey(null);
    setSelectedHouseNumber((current) => current === house ? null : house);
  };
  const selectAspect = (line: AspectLine) => {
    setSelectedPlanetName(null);
    setSelectedHouseNumber(null);
    setSelectedAspectKey((current) => current === line.key ? null : line.key);
  };
  const summarizePositions = (positions: PlanetPosition[], kind: 'natal' | 'transit') =>
    positions.map((planet) => {
      const name = normalizedPlanetName(planet.planet);
      const isUncertainMoon = kind === 'natal' && !timeKnown && name === 'Moon';
      const position = `${translate(name)} ${formatPlanetPosition(planet.longitude, locale, translate)}`;
      const possibleSigns = isUncertainMoon && moonSignRange.length > 1
        ? ` (${moonSignRange.map((possibleSign) => translate(normalizedPlanetName(possibleSign))).join(', ')})`
        : '';
      return `${position}${isUncertainMoon ? `?${possibleSigns}` : ''}`;
    }).join(', ');
  const natalPositionSummary = summarizePositions(planets, 'natal');
  const transitPositionSummary = summarizePositions(transitMarkers, 'transit');
  const accessiblePositions = chartMode === 'natal'
    ? natalPositionSummary
    : chartMode === 'transits'
      ? transitPositionSummary
      : `${translate('Natal')}: ${natalPositionSummary}. ${translate('Transits')}: ${transitPositionSummary}`;
  const accessibleHeading = chartMode === 'transits'
    ? translate('Current transiting planets')
    : translate('PLANETS');
  const selectMode = (mode: ChartMode) => {
    if (mode !== 'natal' && !transitsAvailable) return;
    setChartMode(mode);
    setSelectedPlanetName(null);
    setSelectedPlanetKind('natal');
    setSelectedHouseNumber(null);
    setSelectedAspectKey(null);
  };
  const modeOptions: { id: ChartMode; label: string }[] = [
    { id: 'natal', label: 'Natal' },
    { id: 'transits', label: 'Transits' },
    { id: 'combined', label: 'Combined' },
  ];

  return (
    <View
      testID="natal-planet-wheel"
      accessible={false}
      accessibilityRole="image"
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        setMeasuredWidth((current) =>
          current !== null && Math.abs(current - nextWidth) < 1 ? current : nextWidth,
        );
      }}
      style={styles.container}
    >
      <Text
        testID="natal-planet-wheel-summary"
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${accessibleHeading}: ${accessiblePositions}`}
        style={styles.accessibilitySummary}
      >
        {`${accessibleHeading}: ${accessiblePositions}`}
      </Text>
      <View testID="natal-chart-mode-switch" style={styles.modeSwitch}>
        {modeOptions.map(({ id, label }) => {
          const selected = chartMode === id;
          const disabled = id !== 'natal' && !transitsAvailable;
          return (
            <Pressable
              key={id}
              testID={`natal-chart-mode-${id}`}
              accessibilityRole="button"
              accessibilityLabel={translate(label)}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => selectMode(id)}
              style={({ pressed }) => [
                styles.modeOption,
                {
                  backgroundColor: selected ? palette.secondary : 'transparent',
                  borderColor: selected ? palette.secondary : palette.border,
                  opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.modeOptionLabel,
                  { color: selected ? palette.card : palette.mutedForeground },
                ]}
              >
                {translate(label)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!transitsAvailable ? (
        <Text
          testID="natal-transit-unavailable"
          style={[styles.transitUnavailable, { color: palette.mutedForeground }]}
        >
          {translate('Transit views are unavailable right now.')}
        </Text>
      ) : null}
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
          strokeWidth={Math.max(0.7, scale)}
          opacity={0.55}
        />
        <Circle
          cx={center}
          cy={center}
          r={zodiacInnerRadius}
          fill="none"
          stroke={palette.border}
          strokeWidth={Math.max(0.7, scale)}
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
              strokeWidth={Math.max(0.6, 0.8 * scale)}
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
              strokeWidth={Math.max(0.65, 0.75 * scale)}
              opacity={0.8}
            />
          );
        })}
        {houseLabels.map(({ house, x, y }) => {
          const cusp = actualHouseCusps.find((candidate) => candidate.house === house);
          if (!cusp) return null;
          const selected = selectedHouseNumber === house;
          const houseTitle = format('House {number}', { number: house });
          const cuspPosition = formatPlanetPosition(cusp.longitude, locale, translate);
          return (
            <React.Fragment key={`house-number-${house}`}>
              <Circle
                testID={`natal-wheel-house-hit-area-${house}`}
                cx={x}
                cy={y}
                r={Math.max(14, 17 * scale)}
                fill="transparent"
                accessible
                accessibilityLabel={`${houseTitle}, ${translate('House cusp')}: ${cuspPosition}`}
                onPress={() => selectHouse(house)}
              />
              <SvgText
                testID={`natal-wheel-house-number-${house}`}
                x={x}
                y={y + 2.7 * scale}
                textAnchor="middle"
                fontFamily="Inter"
                fontSize={Math.max(8, 9 * scale)}
                fontWeight={selected ? '700' : '500'}
                fill={selected ? palette.secondary : palette.mutedForeground}
                accessible={false}
              >
                {house.toLocaleString(locale)}
              </SvgText>
            </React.Fragment>
          );
        })}
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
              strokeWidth={Math.max(0.8, (key === 'asc-dsc' ? 1.35 : 1.05) * scale)}
              strokeDasharray={dash}
              opacity={0.78}
            />
          );
        })}
        {SIGN_GLYPHS.map((glyph, index) => {
          const point = polarPoint(index * 30 + 15, signRadius, center, rotation);
          const fontSize = Math.max(14, 17 * scale);
          return (
            <SvgText
              key={`zodiac-sign-${index}`}
              testID={`natal-zodiac-sign-${index}`}
              x={point.x}
              y={point.y + fontSize * 0.32}
              textAnchor="middle"
              fontFamily="Georgia"
              fontSize={fontSize}
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
              fontSize={Math.max(7.5, 8.5 * scale)}
              fontWeight="600"
              fill={color}
              accessible
              accessibilityLabel={translate(long)}
            >
              {short}
            </SvgText>
          );
        })}
        {aspectsVisible ? aspectLines.map((line) => {
          const { aspect, first, second, uncertainMoon } = line;
          const strength = Number.isFinite(aspect.strength)
            ? Math.max(0, Math.min(1, aspect.strength))
            : 0.5;
          const selectedByPlanet = selectedPlanetName !== null
            && (aspect.kind === 'transit'
              ? (selectedPlanetKind === 'transit' && aspect.first.toLowerCase() === selectedPlanetName)
                || (chartMode === 'combined'
                  && selectedPlanetKind === 'natal'
                  && aspect.second.toLowerCase() === selectedPlanetName)
              : selectedPlanetKind === 'natal'
                && (aspect.first.toLowerCase() === selectedPlanetName
                  || aspect.second.toLowerCase() === selectedPlanetName));
          const selectedByAspect = selectedAspectLine?.key === line.key;
          const selected = selectedByPlanet || selectedByAspect;
          const hasSelection = selectedPlanetName !== null || selectedAspectLine !== undefined;
          const dimmed = hasSelection && !selected;
          const hitLabel = formatAspectAccessibilityLabel(aspect);
          const testPrefix = aspect.kind === 'transit' ? 'natal-transit-aspect' : 'natal-aspect';
          return (
            <React.Fragment key={line.key}>
              <Line
                testID={`${testPrefix}-line-${aspect.type.toLowerCase()}-${aspect.first.toLowerCase()}-${aspect.second.toLowerCase()}`}
                x1={first.x}
                y1={first.y}
                x2={second.x}
                y2={second.y}
                stroke={aspectColor(aspect.type, palette)}
                strokeWidth={Math.max(
                  0.7,
                  (selected ? 1.25 + strength * 0.55 : 0.75 + strength * 0.45) * scale,
                )}
                strokeDasharray={uncertainMoon
                  ? '1 5'
                  : aspect.kind === 'transit'
                    ? '2 3'
                    : ASPECT_DASHES[aspect.type.toLowerCase()]}
                strokeLinecap="round"
                opacity={uncertainMoon
                  ? selected ? 0.5 : 0.18
                  : dimmed ? 0.07 : selected ? 0.94 : 0.28 + strength * 0.38}
                accessible={false}
              />
              <Line
                testID={`${testPrefix}-hit-${aspect.type.toLowerCase()}-${aspect.first.toLowerCase()}-${aspect.second.toLowerCase()}`}
                x1={first.x}
                y1={first.y}
                x2={second.x}
                y2={second.y}
                stroke={aspectColor(aspect.type, palette)}
                strokeWidth={Math.max(18, 22 * scale)}
                strokeLinecap="round"
                opacity={0.01}
                accessible
                accessibilityLabel={hitLabel}
                onPress={() => selectAspect(line)}
              />
            </React.Fragment>
          );
        }) : null}
        {markers.map(({ planet, x, y }) => {
          const name = normalizedPlanetName(planet.planet);
          const isUncertainMoon = !timeKnown && name === 'Moon';
          const label = labelsByPlanet.get(name.toLowerCase());
          const selected = selectedPlanetKind === 'natal' && selectedPlanetName === name.toLowerCase();
          const position = formatPlanetPosition(planet.longitude, locale, translate);
          const summary = `${translate(name)} · ${position}`;
          return (
            <React.Fragment key={planet.planet}>
              {selected ? (
                <Circle
                  testID={`natal-planet-selection-${name.toLowerCase()}`}
                  cx={x}
                  cy={y}
                  r={Math.max(8, 9 * scale)}
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
                r={Math.max(12, 12 * scale)}
                fill="transparent"
                  accessible={chartMode !== 'transits'}
                accessibilityLabel={summary}
                  onPress={chartMode === 'transits' ? undefined : () => selectPlanet(planet, 'natal')}
              />
              <Circle
                testID={`natal-planet-marker-${name.toLowerCase()}`}
                cx={x}
                cy={y}
                r={Math.max(2.5, 3.2 * scale)}
                fill={isUncertainMoon ? palette.card : palette.secondary}
                stroke={isUncertainMoon ? palette.mutedForeground : palette.secondary}
                strokeWidth={1.2 * scale}
                strokeDasharray={isUncertainMoon ? '2 2' : undefined}
                accessible={chartMode !== 'transits'}
                accessibilityLabel={summary}
                onPress={chartMode === 'transits' ? undefined : () => selectPlanet(planet, 'natal')}
              />
              {label ? (
                <SvgText
                  testID={`natal-planet-label-${name.toLowerCase()}`}
                  x={label.x}
                  y={label.y + label.fontSize * 0.3}
                  textAnchor="middle"
                  fontFamily="Inter"
                  fontSize={label.fontSize}
                  opacity={chartMode === 'transits' ? 0.42 : 1}
                  accessible={chartMode !== 'transits'}
                  accessibilityLabel={summary}
                  onPress={chartMode === 'transits' ? undefined : () => selectPlanet(planet, 'natal')}
                >
                  <TSpan
                    testID={`natal-planet-glyph-${name.toLowerCase()}`}
                    fontFamily="Georgia"
                    fill={palette.secondary}
                  >
                    {`${label.label}\uFE0E`}
                  </TSpan>
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
        {chartMode !== 'natal' ? transitMarkers.map(({ planet, longitude, x, y }) => {
          const name = normalizedPlanetName(planet);
          const selected = selectedPlanetKind === 'transit' && selectedPlanetName === name.toLowerCase();
          const position = formatPlanetPosition(longitude, locale, translate);
          const summary = `${translate('Current position')}: ${translate(name)} · ${position}`;
          const glyph = PLANET_GLYPHS[name] ?? name.slice(0, 1);
          return (
            <React.Fragment key={`transit-${planet}`}>
              {selected ? (
                <Circle
                  testID={`natal-transit-planet-selection-${name.toLowerCase()}`}
                  cx={x}
                  cy={y}
                  r={Math.max(10, 11 * scale)}
                  fill="none"
                  stroke={palette.secondary}
                  strokeWidth={1.2 * scale}
                  opacity={0.9}
                />
              ) : null}
              <Circle
                testID={`natal-transit-planet-hit-area-${name.toLowerCase()}`}
                cx={x}
                cy={y}
                r={Math.max(13, 14 * scale)}
                fill="transparent"
                accessible
                accessibilityLabel={summary}
                onPress={() => selectPlanet({ planet, longitude }, 'transit')}
              />
              <Circle
                testID={`natal-transit-planet-marker-${name.toLowerCase()}`}
                cx={x}
                cy={y}
                r={Math.max(7, 8 * scale)}
                fill={palette.card}
                stroke={palette.secondary}
                strokeWidth={1.25 * scale}
                accessible={false}
              />
              <SvgText
                testID={`natal-transit-planet-glyph-${name.toLowerCase()}`}
                x={x}
                y={y + Math.max(3, 3.5 * scale)}
                textAnchor="middle"
                fontFamily="Georgia"
                fontSize={Math.max(9, 10 * scale)}
                fill={palette.secondary}
                accessible={false}
              >
                {`${glyph}\uFE0E`}
              </SvgText>
            </React.Fragment>
          );
        }) : null}
      </Svg>
      {chartMode !== 'natal' && transitAspectLines.length === 0 ? (
        <Text
          testID="natal-transit-no-aspects"
          style={[styles.transitUnavailable, { color: palette.mutedForeground }]}
        >
          {translate('No current transit aspects are close to your natal planets.')}
        </Text>
      ) : null}
      {selectedPlanet ? (
        <View
          testID={`${selectedPlanetKind === 'transit' ? 'natal-transit-planet-detail' : 'natal-planet-detail'}-${selectedPlanet.planet.toLowerCase()}`}
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
              testID={selectedPlanetKind === 'transit' ? 'natal-transit-planet-detail-close' : 'natal-planet-detail-close'}
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
              {translate(selectedPlanetKind === 'transit' ? 'Current position' : 'Position')}
            </Text>
            <Text
              testID={selectedPlanetKind === 'transit' ? 'natal-transit-planet-detail-position' : 'natal-planet-detail-position'}
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
          {selectedPlanetKind === 'natal' && houseByPlanet?.has(selectedPlanet.planet.toLowerCase()) ? (
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
            const aspectLine = aspectLines.find((line) => line.aspect === aspect);
            const orb = aspect.orb.toLocaleString(locale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            });
            return (
              <Pressable
                key={`${aspect.first}-${aspect.type}-${aspect.second}-${index}`}
                testID={`${selectedPlanetKind === 'transit' ? 'natal-transit-planet-detail-aspect' : 'natal-planet-detail-aspect'}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={formatAspectAccessibilityLabel(aspect)}
                disabled={!aspectLine}
                onPress={() => {
                  if (aspectLine) selectAspect(aspectLine);
                }}
                style={styles.detailAspectRow}
              >
                <View style={[styles.detailAspectDot, { backgroundColor: aspectColor(aspect.type, palette) }]} />
                <Text style={[styles.detailAspectText, { color: palette.foreground }]}>
                  {`${translate(otherName)} · ${translate(aspect.type.toLowerCase())} · ${translate('orb')} ${orb}°`}
                </Text>
              </Pressable>
            );
          }) : (
            <Text style={[styles.detailEmpty, { color: palette.mutedForeground }]}>
              {translate('No major aspects for this planet.')}
            </Text>
          )}
        </View>
      ) : null}
      {selectedHouseCusp && selectedHouseNumber !== null ? (
        <View
          testID={`natal-house-detail-${selectedHouseNumber}`}
          accessibilityLiveRegion="polite"
          style={[styles.detailPanel, { borderColor: palette.border }]}
        >
          <View style={styles.detailHeader}>
            <Text style={[styles.detailTitle, { color: palette.foreground }]}>
              {format('House {number}', { number: selectedHouseNumber })}
            </Text>
            <Pressable
              testID="natal-house-detail-close"
              accessibilityRole="button"
              accessibilityLabel={translate('Close house details')}
              hitSlop={8}
              onPress={() => setSelectedHouseNumber(null)}
              style={({ pressed }) => [styles.detailClose, { opacity: pressed ? 0.65 : 1 }]}
            >
              <Feather name="x" size={17} color={palette.secondary} />
            </Pressable>
          </View>
          <View style={styles.detailPositionRow}>
            <Text style={[styles.detailMeta, { color: palette.mutedForeground }]}>
              {translate('House cusp')}
            </Text>
            <Text
              testID="natal-house-detail-position"
              style={[styles.detailPosition, { color: palette.foreground }]}
            >
              {formatPlanetPosition(selectedHouseCusp.longitude, locale, translate)}
            </Text>
          </View>
          <Text
            testID="natal-house-detail-theme"
            style={[styles.detailEmpty, { color: palette.foreground }]}
          >
            {translate(HOUSE_THEMES[selectedHouseNumber - 1])}
          </Text>
          <Text style={[styles.detailSection, { color: palette.secondary }]}>
            {translate('Planets in this house')}
          </Text>
          <Text
            testID="natal-house-detail-planets"
            style={[styles.detailEmpty, { color: palette.mutedForeground }]}
          >
            {selectedHousePlanets.length
              ? selectedHousePlanets
                .map((planet) => translate(normalizedPlanetName(planet.planet)))
                .join(', ')
              : translate('No planets are placed in this house.')}
          </Text>
        </View>
      ) : null}
      {selectedAspectLine ? (
        <View
          testID={`${selectedAspectLine.aspect.kind === 'transit' ? 'natal-transit-aspect-detail' : 'natal-aspect-detail'}-${selectedAspectLine.aspect.type.toLowerCase()}-${selectedAspectLine.aspect.first.toLowerCase()}-${selectedAspectLine.aspect.second.toLowerCase()}`}
          accessibilityLiveRegion="polite"
          style={[styles.detailPanel, { borderColor: palette.border }]}
        >
          <View style={styles.detailHeader}>
            <Text
              testID="natal-aspect-detail-title"
              style={[styles.detailTitle, { color: palette.foreground, flex: 1 }]}
            >
              {formatAspectTitle(selectedAspectLine.aspect)}
            </Text>
            <Pressable
              testID={selectedAspectLine.aspect.kind === 'transit' ? 'natal-transit-aspect-detail-close' : 'natal-aspect-detail-close'}
              accessibilityRole="button"
              accessibilityLabel={translate('Close aspect details')}
              hitSlop={8}
              onPress={() => setSelectedAspectKey(null)}
              style={({ pressed }) => [styles.detailClose, { opacity: pressed ? 0.65 : 1 }]}
            >
              <Feather name="x" size={17} color={palette.secondary} />
            </Pressable>
          </View>
          {selectedAspectLine.aspect.kind === 'transit' ? (
            <Text
              testID="natal-transit-aspect-detail-context"
              style={[styles.detailMeta, { color: palette.mutedForeground }]}
            >
              {translate('Transit aspect')}
            </Text>
          ) : null}
          <Text
            testID="natal-aspect-detail-orb"
            style={[styles.detailMeta, { color: palette.mutedForeground }]}
          >
            {formatAspectOrb(selectedAspectLine.aspect)}
          </Text>
          <Text
            testID="natal-aspect-detail-interpretation"
            style={[styles.detailEmpty, { color: palette.foreground }]}
          >
            {translate(ASPECT_MEANINGS[selectedAspectLine.aspect.type.toLowerCase()])}
          </Text>
          {!timeKnown ? (
            <Text style={[styles.referenceNote, { color: palette.mutedForeground }]}>
              {translate('All placements and aspects represent the reference instant; their exact degrees and motion are time-dependent.')}
            </Text>
          ) : null}
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
  modeSwitch: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  modeOption: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
    minHeight: 32,
    paddingHorizontal: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  modeOptionLabel: {
    fontFamily: 'Inter',
    fontSize: 10.5,
    fontWeight: '600',
  },
  transitUnavailable: {
    alignSelf: 'stretch',
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
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
