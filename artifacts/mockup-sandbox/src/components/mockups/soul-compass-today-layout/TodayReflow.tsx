import { useState } from 'react';
import './todayreflow.css';

const rituals = [
  'Take three easy breaths before beginning a task.',
  'Step outside for a moment and notice the sky.',
  'Put one small thing back where it belongs.',
];

export function TodayReflow() {
  const [ritualIndex, setRitualIndex] = useState(0);
  const [showNote, setShowNote] = useState(false);
  const [activeTab, setActiveTab] = useState('Today');

  return (
    <main className="today-reflow">
      <div className="tr-sky" aria-hidden="true">
        <span className="tr-star tr-star-a">✳</span>
        <span className="tr-star tr-star-b">·</span>
        <span className="tr-star tr-star-c">✦</span>
        <span className="tr-orbit" />
      </div>
      <div className="tr-shell">
        <header className="tr-header">
          <div className="tr-brand">
            <span className="tr-mark">✦</span>
            <span>SOUL COMPASS</span>
          </div>
          <button className="tr-date" type="button" onClick={() => setShowNote(!showNote)}>
            THURSDAY <span>·</span> 18 JUL
          </button>
        </header>

        <section className="tr-intro">
          <p className="tr-eyebrow">YOUR DAILY REFLECTION</p>
          <h1>A little room<br />to <em>begin again.</em></h1>
          <div className="tr-intro-foot">
            <span className="tr-moon">◔</span>
            <p>Today is for choosing what matters<br />and letting the rest wait.</p>
            <button aria-label="Read about today's reflection" className="tr-info" onClick={() => setShowNote(!showNote)}>i</button>
          </div>
        </section>

        {showNote && (
          <aside className="tr-note">
            This is a gentle prompt, not a prediction. Keep what feels useful and leave the rest.
            <button type="button" onClick={() => setShowNote(false)} aria-label="Close note">×</button>
          </aside>
        )}

        <section className="tr-guidance" aria-label="Daily guidance">
          <article className="tr-guidance-item tr-focus">
            <div className="tr-label"><span>01</span> FOCUS FOR TODAY</div>
            <p>Give one useful step your full attention.</p>
            <span className="tr-arrow">↗</span>
          </article>
          <article className="tr-guidance-item tr-later">
            <div className="tr-label"><span>02</span> LET THIS WAIT</div>
            <p>You don’t have to solve everything at once.</p>
            <span className="tr-arrow">↘</span>
          </article>
        </section>

        <section className="tr-keepsake">
          <div className="tr-keepsake-top">
            <span className="tr-label"><span>03</span> A MOMENT TO KEEP</span>
            <span className="tr-ornament">✧</span>
          </div>
          <blockquote>“Notice what is taking<br />center stage.”</blockquote>
          <div className="tr-keepsake-bottom">
            <span>PAUSE · NOTICE · CHOOSE</span>
            <button type="button" onClick={() => setShowNote(!showNote)}>WHY THIS?</button>
          </div>
        </section>

        <section className="tr-ritual">
          <div className="tr-ritual-icon" aria-hidden="true">◌</div>
          <div className="tr-ritual-copy">
            <div className="tr-label"><span>04</span> A SMALL DAILY RITUAL</div>
            <p>{rituals[ritualIndex]}</p>
          </div>
          <button
            className="tr-next"
            type="button"
            aria-label="Explore another ritual idea"
            onClick={() => setRitualIndex((ritualIndex + 1) % rituals.length)}
          >↻</button>
        </section>

        <footer className="tr-footer">
          <span>STAY WITH WHAT FEELS TRUE</span><span className="tr-footer-star">✦</span>
        </footer>
        <nav className="tr-tabs" aria-label="Main navigation">
          {[
            { name: 'Today', symbol: '◒' },
            { name: 'Crystals', symbol: '◇' },
            { name: 'Chart', symbol: '◉' },
          ].map((tab) => (
            <button
              key={tab.name}
              type="button"
              className={activeTab === tab.name ? 'tr-tab tr-tab-active' : 'tr-tab'}
              onClick={() => setActiveTab(tab.name)}
              aria-current={activeTab === tab.name ? 'page' : undefined}
            >
              <span>{tab.symbol}</span>{tab.name}
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}
