import './_group.css';

const planets = [
  { name: 'Sun', glyph: '☉', longitude: 100 },
  { name: 'Moon', glyph: '☽', longitude: 220 },
  { name: 'Mercury', glyph: '☿', longitude: 103 },
  { name: 'Venus', glyph: '♀', longitude: 108 },
  { name: 'Mars', glyph: '♂', longitude: 40 },
  { name: 'Jupiter', glyph: '♃', longitude: 10 },
  { name: 'Saturn', glyph: '♄', longitude: 198 },
  { name: 'Uranus', glyph: '♅', longitude: 100 },
  { name: 'Neptune', glyph: '♆', longitude: 155 },
  { name: 'Pluto', glyph: '♇', longitude: 40 },
];

const aspects = [
  ['Sun', 'Moon'],
  ['Sun', 'Mars'],
  ['Mercury', 'Venus'],
  ['Venus', 'Saturn'],
  ['Moon', 'Pluto'],
  ['Jupiter', 'Uranus'],
];

const signs = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const longitudes = new Map(planets.map((planet) => [planet.name, planet.longitude]));

function point(longitude: number, radius: number, center: number) {
  const angle = (longitude - 90) * Math.PI / 180;
  return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
}

export function Current() {
  const size = 276;
  const center = size / 2;

  return (
    <main style={{ minHeight: '100%', padding: '22px 16px 28px', background: '#080F1C', color: '#F4F0E7' }}>
      <section style={{ maxWidth: 358, margin: '0 auto' }}>
        <p style={{ margin: '0 0 13px', color: '#D9C49B', fontSize: 10, letterSpacing: 1.5, fontWeight: 600 }}>
          PERSONAL NATAL CHART
        </p>
        <div style={{ padding: '18px 12px 16px', borderRadius: 22, background: '#192A42', border: '1px solid #304158' }}>
          <p style={{ margin: '0 0 8px', color: '#D9C49B', fontSize: 9, letterSpacing: 1.4, fontWeight: 600 }}>
            PLANETS
          </p>
          <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Current natal chart wheel">
            <circle cx={center} cy={center} r={center - 3} fill="#192A42" stroke="#304158" />
            <circle cx={center} cy={center} r={center - 32} fill="none" stroke="#304158" />
            {signs.map((_, index) => {
              const from = point(index * 30, center - 32, center);
              const to = point(index * 30, center - 3, center);
              return <line key={`divider-${index}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#304158" strokeWidth=".8" />;
            })}
            {signs.map((sign, index) => {
              const location = point(index * 30 + 15, center - 17, center);
              return <text key={`sign-${index}`} x={location.x} y={location.y + 5} textAnchor="middle" fontFamily="Georgia, serif" fontSize="15" fill="#D9C49B">{sign}</text>;
            })}
            {aspects.map(([first, second]) => {
              const a = point(longitudes.get(first) ?? 0, center * .34, center);
              const b = point(longitudes.get(second) ?? 0, center * .34, center);
              return <line key={`${first}-${second}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#D9C49B" strokeWidth=".8" opacity=".3" />;
            })}
            <circle cx={center} cy={center} r="2.5" fill="#D9C49B" />
            {planets.map((planet, index) => {
              const radius = [center * .33, center * .44, center * .55][index % 3];
              const location = point(planet.longitude, radius, center);
              return (
                <g key={planet.name}>
                  <circle cx={location.x} cy={location.y} r="10" fill="#192A42" stroke="#F4F0E7" />
                  <text x={location.x} y={location.y + 4} textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" fill="#F4F0E7">{planet.glyph}</text>
                </g>
              );
            })}
            {[
              { label: 'ASC', longitude: 285 },
              { label: 'MC', longitude: 190 },
            ].map(({ label, longitude }) => {
              const marker = point(longitude, center - 3, center);
              const text = point(longitude, center * .74, center);
              return (
                <g key={label}>
                  <circle cx={marker.x} cy={marker.y} r="3" fill="#D9C49B" />
                  <text x={text.x} y={text.y + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#D9C49B">{label}</text>
                </g>
              );
            })}
          </svg>
          <p style={{ margin: '2px 4px 0', color: '#AAB5C5', fontSize: 11, lineHeight: 1.5 }}>
            Planets and signs are shown around the wheel.
          </p>
        </div>
      </section>
    </main>
  );
}
