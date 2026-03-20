import React, { useCallback, useEffect, useState } from 'react';
import { FaSyncAlt, FaChartLine, FaTrophy, FaGlobe, FaFilePdf } from 'react-icons/fa';
import { API_ENDPOINTS } from '../const';
import { useSocket } from '../contexts/SocketContext';
import '../css/CplCompositeReport.css';

const POLL_MS = 45000;

export default function CplCompositeReport() {
  const { socket, isConnected } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/cpl-report/pdf`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `PDF failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cpl-qualification-overview-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      window.alert(e.message || 'Could not download PDF');
    } finally {
      setPdfLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/cpl-report/snapshot`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || `HTTP ${res.status}`);
      }
      setData(json);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message || 'Failed to load report');
      setData(null);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const onUpdate = () => {
      load();
    };
    socket.on('points_table_updated', onUpdate);
    return () => socket.off('points_table_updated', onUpdate);
  }, [socket, load]);

  useEffect(() => {
    const id = setInterval(() => load(), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  if (loading && !data) {
    return (
      <div className="cpl-report-page">
        <div className="cpl-report-loading">Loading qualification overview…</div>
      </div>
    );
  }

  return (
    <div className="cpl-report-page">
      <header className="cpl-report-hero">
        <h1>Qualification overview</h1>
        <p>
          See how teams stack across the <strong>last three CPL seasons</strong> — a single picture that helps judge
          who&apos;s in the mix for <strong>World Cup</strong> and other qualification storylines. Per-season tables
          and methodology are below; numbers are live from your databases.
        </p>
        <div className="cpl-report-live-row">
          <span className={`cpl-report-live ${isConnected ? '' : 'cpl-report-live-off'}`}>
            <span className="cpl-report-live-dot" aria-hidden />
            {isConnected ? 'Live updates on' : 'Reconnecting…'}
          </span>
          <button type="button" className="cpl-report-refresh" onClick={() => load()} disabled={fetching}>
            <FaSyncAlt className={fetching ? 'spinning' : ''} />
            Refresh now
          </button>
          <button
            type="button"
            className="cpl-report-pdf-btn"
            onClick={downloadPdf}
            disabled={pdfLoading}
            title="Download current data as PDF"
          >
            <FaFilePdf />
            {pdfLoading ? 'PDF…' : 'Download PDF'}
          </button>
        </div>
        <p className="cpl-report-update-help">
          <strong>This page stays up to date:</strong> it refetches when match results / points change (live socket) and
          about every 45 seconds as a backup. <strong>A PDF is a frozen snapshot</strong> from the moment you download it
          — it does not change by itself. Click <strong>Download PDF</strong> again anytime for fresh numbers.
        </p>
        {data?.reportDatabases?.length > 0 && (
          <p className="cpl-report-meta">
            Databases: {data.reportDatabases.join(' → ')}
            {data.runningDbHint ? ` · anchor: ${data.runningDbHint}` : ''}
          </p>
        )}
        {lastRefresh && (
          <p className="cpl-report-meta">
            Last updated: {lastRefresh.toLocaleString()}
            {data?.generatedAt && ` · Server: ${new Date(data.generatedAt).toLocaleTimeString()}`}
          </p>
        )}
      </header>

      {error && (
        <div className="cpl-report-banner-err" role="alert">
          {error}
        </div>
      )}

      <div className="cpl-report-wrap">
        {data?.composite?.rows?.length > 0 && (
          <section className="cpl-report-card cpl-report-composite cpl-report-card--featured">
            <div className="cpl-report-card-head">
              <h2>
                <FaTrophy style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Who&apos;s in the qualification mix?
              </h2>
              <span>Live · Higher combined score = stronger run across recent CPLs</span>
            </div>
            <div className="cpl-report-card-body">
              <p className="cpl-report-qual-intro">
                This ranking blends points, NRR, and fairness across your last three season databases. It&apos;s a
                guide for narratives like <strong>World Cup</strong> spots, playoffs, and momentum — not a substitute
                for the official selection rules (see notes at the bottom). The top six in this table use{' '}
                <strong className="cpl-report-top6-text">green text</strong> so they stand out.
              </p>
              <div className="cpl-report-table-wrap">
                <table className="cpl-report-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Team</th>
                      {data.composite.columns.map((c) => (
                        <th key={c.dbName}>{c.label}</th>
                      ))}
                      <th>Combined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.composite.rows.map((row) => (
                      <tr key={row.teamKey} className={row.rank <= 6 ? 'cpl-report-row--top6' : ''}>
                        <td>
                          <span className={`cpl-report-rank-pill ${row.rank <= 3 ? 'top3' : ''}`}>
                            {row.rank}
                          </span>
                        </td>
                        <td className="cpl-report-team" title={row.teamName}>
                          {row.teamName}
                        </td>
                        {data.composite.columns.map((c) => (
                          <td key={c.dbName}>
                            {row.byDb[c.dbName] != null ? Number(row.byDb[c.dbName]).toFixed(2) : '—'}
                          </td>
                        ))}
                        <td>
                          <strong>{Number(row.finalAvg).toFixed(2)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {data?.formulas && (
          <section className="cpl-report-card">
            <div className="cpl-report-card-head">
              <h2>
                <FaChartLine style={{ marginRight: 8, verticalAlign: 'middle' }} />
                How the combined score is built
              </h2>
              <span>Same logic as your workbook formulas</span>
            </div>
            <div className="cpl-report-card-body">
              {data.formulas.map((f) => (
                <div key={f.step} className="cpl-report-formula-step">
                  <strong>
                    {f.step}: {f.title}
                  </strong>
                  {f.detail ? <span>{f.detail}</span> : null}
                </div>
              ))}
            </div>
          </section>
        )}

        {data?.seasons?.map((season) => (
          <section key={season.dbName} className="cpl-report-card">
            <div className="cpl-report-card-head">
              <h2>{season.label}</h2>
              <span>
                {season.ok
                  ? `${season.table?.length || 0} teams · ${season.fixtureCount ?? '—'} results`
                  : 'Could not load'}
              </span>
            </div>
            <div className="cpl-report-card-body">
              {!season.ok && <div className="cpl-report-err">{season.error || 'Error'}</div>}
              {season.ok && season.table?.length > 0 && (
                <div className="cpl-report-table-wrap">
                  <table className="cpl-report-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Team</th>
                        <th>Pts</th>
                        <th>NRR</th>
                        <th>Fair</th>
                        <th>Played</th>
                        <th>W</th>
                        <th>L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {season.table.map((row) => (
                        <tr key={`${season.dbName}-${row.rank}-${row.teamName}`}>
                          <td>{row.rank}</td>
                          <td className="cpl-report-team" title={row.teamName}>
                            {row.teamName}
                          </td>
                          <td>{row.points}</td>
                          <td>{row.nrr}</td>
                          <td>{row.fairness}</td>
                          <td>{row.matchesPlayed}</td>
                          <td>{row.wins}</td>
                          <td>{row.losses}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ))}

        {data?.worldCupNotes && (
          <aside className="cpl-report-note">
            <h3>
              <FaGlobe style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Championship qualification — overview
            </h3>
            <ul>
              {data.worldCupNotes.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
