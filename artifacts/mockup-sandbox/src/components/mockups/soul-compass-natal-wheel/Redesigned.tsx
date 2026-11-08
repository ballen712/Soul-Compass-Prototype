import './_group.css';

type Planet = { name: string; glyph: string; longitude: number; sign: string; degree: string };

const planets: Planet[] = [
  { name: 'Sun', glyph: '☉', longitude: 100, sign: 'Cancer', degree: '10°' },
  { name: 'Moon', glyph: '☽', longitude: 220, sign: 'Scorpio', degree: '10°' },
  { name: 'Mercury', glyph: '☿', longitude: 103, sign: 'Cancer', degree: '13°' },
  { name: 'Venus', glyph: '♀', longitude: 108, sign: 'Cancer', degree: '18°' },
  { name: 'Mars', glyph: '♂', longitude: 40, sign: 'Taurus', degree: '10°' },
  { name: 'Jupiter', glyph: '♃', longitude: 10, sign: 'Aries', degree: '10°' },
  { name: 'Saturn', glyph: '♄', longitude: 198, sign: 'Libra', degree: '18°' },
  { name: 'Uranus', glyph: '♅', longitude: 100, sign: 'Cancer', degree: '10°' },
  { name: 'Neptune', glyph: '♆', longitude: 155, sign: 'Virgo', degree: '5°' },
  { name: 'Pluto', glyph: '♇', longitude: 40, sign: 'Taurus', degree: '10°' },
];

const aspects = [
  ['Sun', 'Moon', 'trine'],
  ['Sun', 'Mars', 'sextile'],
  ['Mercury', 'Venus', 'conjunction'],
  ['Venus', 'Saturn', 'square'],
  ['Moon', 'Pluto', 'opposition'],
  ['Jupiter', 'Uranus', 'square'],
];

const signs = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const laneFactors = [.14, .19, .24, .29, .34, .39, .44, .49, .54, .59];

function point(longitude: number, radius: number, center: number) {
  const angle = (longitude - 90) * Math.PI / 180;
  return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
}

function normalize(value: number) {
  return ((value % 360) + 360) % 360;
}

function createWheelLayout(size: number, palette: { card: string; foreground: string; muted: string; secondary: string; border: string }) {
  const center = size / 2;
  const ringRadius = center * .87;
  const labelRadius = center * .66;
  const longitudes = new Map(planets.map((planet) => [planet.name, planet.longitude]));
  const markers = [...planets].sort((a, b) => a.longitude - b.longitude).map((planet, index) => {
    const factor = laneFactors[index % laneFactors.length];
    return { planet, ...point(planet.longitude, center * factor, center) };
  });
  const labelWidths = planets.map((planet) => Math.max(42, Math.min(60, 20 + planet.name.length * 4.3)));
  const ordered = planets
    .map((planet, index) => ({ planet, width: labelWidths[index], target: normalize(planet.longitude) }))
    .sort((a, b) => a.target - b.target);
  const minGaps = ordered.map((item, index) => {
    const next = ordered[(index + 1) % ordered.length];
    return ((item.width + next.width) / 2 + 5) / labelRadius * 180 / Math.PI;
  });
  const totalMinimum = minGaps.reduce((sum, gap) => sum + gap, 0);
  const scaledMinimum = minGaps.map((gap) => gap * (totalMinimum > 359 ? 359 / totalMinimum : 1));
  const targetGaps = ordered.map((item, index) => normalize(ordered[(index + 1) % ordered.length].target - item.target));
  const surplus = targetGaps.map((gap, index) => Math.max(0, gap - scaledMinimum[index]));
  const surplusTotal = surplus.reduce((sum, value) => sum + value, 0);
  const extra = 360 - scaledMinimum.reduce((sum, gap) => sum + gap, 0);
  const displayGaps = scaledMinimum.map((gap, index) => gap + (surplusTotal ? extra * surplus[index] / surplusTotal : extra / ordered.length));
  const displayAngles: number[] = [];
  ordered.forEach((_, index) => displayAngles.push(index === 0 ? 0 : displayAngles[index - 1] + displayGaps[index - 1]));
  const diffX = ordered.reduce((sum, item, index) => sum + Math.cos((item.target - displayAngles[index]) * Math.PI / 180), 0);
  const diffY = ordered.reduce((sum, item, index) => sum + Math.sin((item.target - displayAngles[index]) * Math.PI / 180), 0);
  const offset = Math.atan2(diffY, diffX) * 180 / Math.PI;
  const labels = ordered.map((item, index) => ({
    ...item,
    ...point(normalize(displayAngles[index] + offset), labelRadius, center),
  }));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Natal chart wheel">
      <circle cx={center} cy={center} r={ringRadius} fill={palette.card} stroke={palette.border} strokeWidth="1.1" />
      <circle cx={center} cy={center} r={center * .27} fill="none" stroke={palette.border} strokeWidth=".8" opacity=".55" />
      {signs.map((_, index) => {
        const start = point(index * 30, ringRadius - 6, center);
        const end = point(index * 30, ringRadius, center);
        return <line key={`tick-${index}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={palette.border} strokeWidth=".8" />;
      })}
      {signs.map((glyph, index) => {
        const sign = point(index * 30 + 15, center - 10, center);
        return <text key={`sign-${index}`} x={sign.x} y={sign.y + 5} textAnchor="middle" fontFamily="Georgia, serif" fontSize="14" fill={palette.secondary}>{`${glyph}\uFE0E`}</text>;
      })}
      {aspects.map(([first, second, type]) => {
        const a = point(longitudes.get(first) ?? 0, center * .34, center);
        const b = point(longitudes.get(second) ?? 0, center * .34, center);
        return <line key={`${first}-${type}-${second}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={palette.secondary} strokeWidth=".9" strokeDasharray="1 3" strokeLinecap="round" opacity=".42" />;
      })}
      {markers.map(({ planet, x, y }) => (
        <circle key={`planet-${planet.name}`} cx={x} cy={y} r="3.2" fill={palette.secondary} stroke={palette.card} strokeWidth="1" />
      ))}
      {labels.map(({ planet, width, x, y }) => {
        const marker = markers.find((item) => item.planet.name === planet.name)!;
        const uncertain = planet.name === 'Moon';
        return (
          <g key={`label-${planet.name}`}>
            <line x1={marker.x} y1={marker.y} x2={x} y2={y} stroke={palette.muted} strokeWidth=".6" opacity=".42" />
            <rect x={x - width / 2} y={y - 9} width={width} height="18" rx="9" fill={palette.card} stroke={uncertain ? palette.muted : palette.border} strokeWidth=".9" strokeDasharray={uncertain ? '2 2' : undefined} />
            <text x={x - width / 2 + 10} y={y + 3} textAnchor="middle" fontFamily="Georgia, serif" fontSize="11" fill={palette.secondary}>{`${planet.glyph}\uFE0E`}</text>
            <text x={x - width / 2 + 19} y={y + 3} textAnchor="start" fontFamily="Inter, sans-serif" fontSize="8.5" fontWeight="600" fill={palette.foreground}>{planet.name}</text>
            {planet.name === 'Moon' ? <text x={x + width / 2 - 3} y={y - 5} textAnchor="middle" fontSize="8" fontWeight="700" fill={palette.muted}>?</text> : null}
          </g>
        );
      })}
      {[
        { label: 'ASC', longitude: 285 },
        { label: 'MC', longitude: 190 },
      ].map(({ label, longitude }) => {
        const marker = point(longitude, ringRadius, center);
        const tick = point(longitude, ringRadius - 7, center);
        const text = point(longitude, ringRadius - 19, center);
        return (
          <g key={label}>
            <line x1={tick.x} y1={tick.y} x2={marker.x} y2={marker.y} stroke={palette.secondary} strokeWidth="1.4" />
            <circle cx={marker.x} cy={marker.y} r="2.8" fill={palette.secondary} />
            <text x={text.x} y={text.y + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill={palette.secondary}>{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

const palettes = {
  dark: {
    background: '#080F1C', card: '#192A42', foreground: '#F4F0E7',
    muted: '#AAB5C5', secondary: '#D9C49B', border: '#304158',
  },
  light: {
    background: '#F4F0E7', card: '#EAE4D8', foreground: '#292A26',
    muted: '#706F69', secondary: '#8B7143', border: '#D7D0C3',
  },
};

export function Redesigned() {
  return (
    <main style={{ minHeight: '100%', padding: 18, background: '#0B1220', color: '#F4F0E7' }}>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        {(Object.entries(palettes) as [keyof typeof palettes, typeof palettes.dark][]).map(([mode, palette]) => (
          <section key={mode} style={{ width: 350, padding: 16, borderRadius: 22, background: palette.background, color: palette.foreground, border: `1px solid ${palette.border}` }}>
            <p style={{ margin: '0 0 5px', color: palette.secondary, fontSize: 9, letterSpacing: 1.5, fontWeight: 600 }}>
              PERSONAL NATAL CHART · {mode.toUpperCase()} THEME
            </p>
            <h2 style={{ margin: '0 0 12px', fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 21 }}>
              Planets in your chart
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {createWheelLayout(322, palette)}
            </div>
            <p style={{ margin: '5px 3px 0', color: palette.muted, fontSize: 10, lineHeight: 1.5 }}>
              Dotted lines connect major aspects. The Moon is marked when its exact position is uncertain.
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
