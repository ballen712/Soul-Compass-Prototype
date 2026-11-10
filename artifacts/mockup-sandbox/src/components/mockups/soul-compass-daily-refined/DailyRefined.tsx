import { useState } from 'react';
import './dailyrefined.css';

const rituals = [
  'Take three easy breaths before beginning a task.',
  'Step outside for a moment and notice the sky.',
  'Put one small thing back where it belongs.',
];

const tabs = [
  { name: 'Cosmos', icon: 'sun' },
  { name: 'Crystals', icon: 'crystal' },
  { name: 'Natal', icon: 'orbit' },
  { name: 'Explore', icon: 'compass' },
];

function Symbol({ name }: { name: string }) {
  if (name === 'sun') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>;
  if (name === 'crystal') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 5-8 13L4 8l8-5Z" /><path d="m4 8 8 2 8-2m-8-5v7" /></svg>;
  if (name === 'orbit') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.5" /><ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(-32 12 12)" /><circle cx="18.8" cy="7.7" r="1" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7.5" /><path d="m16.5 16.5 4 4M11 7v4l2.5 1.5" /></svg>;
}

export function DailyRefined() {
  const [ritualIndex, setRitualIndex] = useState(0);
  const [showNote, setShowNote] = useState(false);
  const [activeTab, setActiveTab] = useState('Cosmos');
  const [saved, setSaved] = useState(false);

  return (
    <main className="daily-refined">
      <div className="dr-sky" aria-hidden="true">
        <span className="dr-star dr-star-one">✦</span>
        <span className="dr-star dr-star-two">·</span>
        <span className="dr-star dr-star-three">✧</span>
        <span className="dr-constellation dr-constellation-a" />
        <span className="dr-constellation dr-constellation-b" />
        <span className="dr-orbit" />
        <span className="dr-orbit dr-orbit-inner" />
      </div>

      <div className="dr-shell">
        <header className="dr-header">
          <div className="dr-brand"><span className="dr-brand-mark">✧</span><span>SOUL COMPASS</span></div>
          <button className="dr-date" type="button" onClick={() => setShowNote(!showNote)} aria-label="Open today's date details">
            <span className="dr-date-dot" /> THU <span className="dr-date-divider">/</span> 18 JUL
          </button>
        </header>

        <section className="dr-intro">
          <div className="dr-kicker"><span className="dr-kicker-line" /> YOUR DAILY REFLECTION</div>
          <h1>A little room<br />to <em>begin again.</em></h1>
          <div className="dr-intro-bottom">
            <div className="dr-moon" aria-hidden="true"><span /></div>
            <p>Today is for choosing what matters<br className="dr-desktop-break" /> and letting the rest wait.</p>
            <button className="dr-info" type="button" onClick={() => setShowNote(!showNote)} aria-label="Read about today's reflection">i</button>
          </div>
        </section>

        {showNote && (
          <aside className="dr-note" role="status">
            <span>This is a gentle prompt, not a prediction. Keep what feels useful and leave the rest.</span>
            <button type="button" onClick={() => setShowNote(false)} aria-label="Close explanation">×</button>
          </aside>
        )}

        <section className="dr-guidance" aria-label="Daily guidance">
          <article className="dr-guidance-item dr-focus">
            <div className="dr-label"><span>01</span><span>FOCUS FOR TODAY</span></div>
            <p>Give one useful step<br />your full attention.</p>
            <span className="dr-arrow" aria-hidden="true">↗</span>
            <span className="dr-guidance-rule" />
          </article>
          <article className="dr-guidance-item dr-later">
            <div className="dr-label"><span>02</span><span>LET THIS WAIT</span></div>
            <p>You don’t have to solve<br />everything at once.</p>
            <span className="dr-arrow" aria-hidden="true">↘</span>
          </article>
        </section>

        <section className="dr-keepsake">
          <div className="dr-keepsake-top">
            <div className="dr-label"><span>03</span><span>A MOMENT TO KEEP</span></div>
            <button type="button" className={saved ? 'dr-save dr-is-saved' : 'dr-save'} onClick={() => setSaved(!saved)} aria-label={saved ? 'Remove saved reflection' : 'Save reflection'}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16.3 3.7 10a3.8 3.8 0 0 1 5.4-5.4l.9.9.9-.9a3.8 3.8 0 0 1 5.4 5.4L10 16.3Z" /></svg>
            </button>
          </div>
          <blockquote>“Notice what is<br className="dr-quote-break" /> taking center stage.”</blockquote>
          <div className="dr-keepsake-bottom">
            <span>PAUSE <i>·</i> NOTICE <i>·</i> CHOOSE</span>
            <button type="button" onClick={() => setShowNote(!showNote)}>WHY THIS?</button>
          </div>
        </section>

        <section className="dr-ritual">
          <div className="dr-ritual-seal" aria-hidden="true"><span>✧</span></div>
          <div className="dr-ritual-copy">
            <div className="dr-label"><span>04</span><span>A SMALL DAILY RITUAL</span></div>
            <p>{rituals[ritualIndex]}</p>
          </div>
          <button className="dr-next" type="button" aria-label="Show another ritual" onClick={() => setRitualIndex((ritualIndex + 1) % rituals.length)}>↻</button>
        </section>

        <footer className="dr-footer"><span>STAY WITH WHAT FEELS TRUE</span><span className="dr-footer-star">✦</span></footer>
        <nav className="dr-tabs" aria-label="Main navigation">
          {tabs.map((tab) => (
            <button key={tab.name} type="button" className={activeTab === tab.name ? 'dr-tab dr-tab-active' : 'dr-tab'} onClick={() => setActiveTab(tab.name)} aria-current={activeTab === tab.name ? 'page' : undefined}>
              <span className="dr-tab-icon"><Symbol name={tab.icon} /></span><span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}
