import { SAMPLE_REPORTS } from '../../shared/report.js';

const KIND_LABELS = { 'email-html': 'Email HTML', 'email-text': 'Email text', 'web-html': 'Web HTML', pdf: 'PDF', png: 'PNG' };

function when(ts) {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function Overview({ saved, history, onOpenStudio, onLoadSample, onOpenSaved, onDuplicate, onDelete }) {
  return (
    <div className="view">
      <header className="welcome">
        <h1>One report. Four formats.</h1>
        <p>
          Write your numbers once. NEXORA renders the same report as an email, a web page, a PDF and a PNG, all
          built from one set of Hyper Elements components.
        </p>
        <div className="welcome-actions">
          <button type="button" className="btn-primary" onClick={onOpenStudio}>Open the report studio</button>
          <button type="button" className="btn-secondary" onClick={() => onLoadSample(SAMPLE_REPORTS[0].id)}>Load a sample report</button>
        </div>
      </header>

      <div className="stats">
        <div className="stat"><span className="stat-num">{saved.length}</span><span>Saved reports</span></div>
        <div className="stat"><span className="stat-num">{history.length}</span><span>Recent exports</span></div>
        <div className="stat"><span className="stat-num">4</span><span>Output formats</span></div>
      </div>

      <div className="columns">
        <section className="panel">
          <h2>Recent reports</h2>
          {saved.length === 0 ? (
            <div className="empty-small">
              <p>No saved reports yet. Open the studio, edit a report and choose Save report.</p>
            </div>
          ) : (
            <ul className="list">
              {saved.slice().sort((a, b) => b.updatedAt - a.updatedAt).map((s) => (
                <li key={s.id}>
                  <div>
                    <strong>{s.name}</strong>
                    <span className="meta">Updated {when(s.updatedAt)}</span>
                  </div>
                  <div className="list-actions">
                    <button type="button" className="btn-quiet" onClick={() => onOpenSaved(s.id)}>Open</button>
                    <button type="button" className="btn-quiet" onClick={() => onDuplicate(s.id)}>Duplicate</button>
                    <button type="button" className="btn-quiet danger" onClick={() => onDelete(s.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2>Export activity</h2>
          {history.length === 0 ? (
            <div className="empty-small"><p>Nothing exported yet. Downloads from the studio show up here.</p></div>
          ) : (
            <ul className="list">
              {history.map((h) => (
                <li key={h.id}>
                  <div>
                    <strong>{KIND_LABELS[h.kind] || h.kind}</strong>
                    <span className="meta">{h.file}</span>
                  </div>
                  <span className="meta">{when(h.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
