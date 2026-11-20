import { SAMPLE_REPORTS, THEMES } from '../../shared/report.js';

export default function Templates({ currentTheme, onUseTheme, onLoadSample }) {
  return (
    <div className="view">
      <header className="view-head">
        <h1>Templates</h1>
        <p>Themes change how every format looks. Sample reports give you realistic data to start from.</p>
      </header>

      <h2 className="section-title">Themes</h2>
      <div className="cards">
        {Object.values(THEMES).map((t) => (
          <article key={t.id} className={`card${currentTheme === t.id ? ' is-current' : ''}`}>
            <div className={`theme-swatch theme-${t.id}`} aria-hidden="true">
              <span className="swatch-head" />
              <span className="swatch-line" />
              <span className="swatch-line short" />
            </div>
            <h3>{t.label}</h3>
            <p>{t.description}</p>
            <button type="button" className="btn-secondary" onClick={() => onUseTheme(t.id)} disabled={currentTheme === t.id}>
              {currentTheme === t.id ? 'In use' : 'Use this theme'}
            </button>
          </article>
        ))}
      </div>

      <h2 className="section-title">Sample reports</h2>
      <div className="cards">
        {SAMPLE_REPORTS.map((s) => (
          <article key={s.id} className="card">
            <h3>{s.name}</h3>
            <p>{s.data.report.summary.slice(0, 120)}…</p>
            <button type="button" className="btn-secondary" onClick={() => onLoadSample(s.id)}>Load this sample</button>
          </article>
        ))}
      </div>
    </div>
  );
}
