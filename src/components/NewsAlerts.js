import React, { useEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'react-lottie-player';
import announcementAnimation from './animations/Announcment.json';
import hittingSixAnimation from './animations/HittingSix.json';
import '../css/NewsAlerts.css';
import { API_ENDPOINTS } from '../const';
import { FaExchangeAlt, FaHandHolding, FaUnlockAlt, FaStar, FaTrophy, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';

function NewsAlerts() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | trade | pick | release | stats | fixture
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef(null);

  async function loadFeed() {
    try {
      setLoading(true);
      setProgress(0);
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      // Fallback progress animation to 90% when content length isn't available
      progressTimerRef.current = setInterval(() => {
        setProgress((p) => (p < 90 ? Math.min(90, p + 2) : p));
      }, 120);
      const res = await fetch(`${API_ENDPOINTS}/api/news/feed`);
      const contentLengthHeader = res.headers.get('Content-Length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : null;

      if (res.body && (totalBytes || typeof ReadableStream !== 'undefined')) {
        const reader = res.body.getReader();
        const chunks = [];
        let receivedBytes = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedBytes += value.length;
          if (totalBytes) {
            const pct = Math.round((receivedBytes / totalBytes) * 100);
            setProgress(Math.max(10, Math.min(99, pct)));
          }
        }
        const blob = new Blob(chunks, { type: 'application/json' });
        const text = await blob.text();
        const j = JSON.parse(text || '{}');
        setFeed(j.items || []);
      } else {
        const j = await res.json();
        setFeed(j.items || []);
      }
    } catch (e) {
      setToast('Failed to load news');
    } finally {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      // Smoothly complete to 100%
      setProgress(100);
      setLoading(false);
    }
  }

  useEffect(() => { loadFeed(); }, []);

  useEffect(() => () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (feed || []).filter((n) => {
      const typeMatch = filter === 'all' ? true : n.kind === filter;
      const text = `${n.title || ''} ${n.body || ''}`.toLowerCase();
      const qMatch = !q || text.includes(q);
      return typeMatch && qMatch;
    });
  }, [feed, filter, query]);

  const kindIcon = (kind) => {
    switch (kind) {
      case 'trade': return <FaExchangeAlt />;
      case 'pick': return <FaHandHolding />;
      case 'release': return <FaUnlockAlt />;
      case 'stats': return <FaStar />;
      case 'fixture': return <FaTrophy />;
      default: return null;
    }
  };

  const counts = useMemo(() => {
    const acc = { trade: 0, pick: 0, release: 0, stats: 0, fixture: 0 };
    (feed || []).forEach(n => { if (acc.hasOwnProperty(n.kind)) acc[n.kind] += 1; });
    return acc;
  }, [feed]);

  const LiveScores = () => {
    const [scores, setScores] = useState([]);
    useEffect(() => {
      let timer;
      async function loadScores() {
        try {
          const r = await fetch(`${API_ENDPOINTS}/api/live-scores`);
          const j = await r.json();
          setScores(Array.isArray(j.items) ? j.items : []);
        } catch {}
      }
      loadScores();
      timer = setInterval(loadScores, 30000);
      return () => { if (timer) clearInterval(timer); };
    }, []);
    if (!scores.length) return null;
    return (
      <div className="live-scores">
        <div className="live-header">Live Scores</div>
        <div className="live-scroller">
          {scores.map(s => {
            const t1 = s.teams?.[0] || 'Team A';
            const t2 = s.teams?.[1] || 'Team B';
            const initials = (name) => String(name || '?').split(' ').map(x => x[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
            const type = String(s.matchType || '').toLowerCase();
            const isLive = /live|progress/i.test(String(s.status || ''));
            const formatDateTime = (iso) => {
              try {
                if (!iso) return '';
                const d = new Date(iso);
                return d.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
              } catch { return ''; }
            };
            const looksLikeId = (txt) => {
              if (!txt) return false;
              const s = String(txt).trim();
              return /^[0-9a-f-]{20,}$/i.test(s);
            };
            const scoreParts = (s.score || '').split('|').map(p => p.trim()).filter(Boolean);
            return (
              <div key={s.id} className={`live-card ${type} ${isLive ? 'is-live' : ''}`}>
                {isLive && <span className="live-ribbon">LIVE</span>}
                <div className="live-top">
                  {!looksLikeId(s.series) && <span className="series">{s.series}</span>}
                  <span className={`badge type ${type || 'other'}`}>{s.matchType || 'Match'}</span>
                </div>
                <div className="team-row">
                  <span className="team-chip">
                    <span className="team-avatar-mini">{initials(t1)}</span>
                    <span className="team-name">{t1}</span>
                  </span>
                  <span className="vs">vs</span>
                  <span className="team-chip">
                    <span className="team-avatar-mini">{initials(t2)}</span>
                    <span className="team-name">{t2}</span>
                  </span>
                </div>
                {scoreParts.length > 0 ? (
                  <div className="score-chips">
                    {scoreParts.map((p, idx) => (
                      <span key={idx} className="score-chip">{p}</span>
                    ))}
                  </div>
                ) : (s.score ? <div className="score-line">{s.score}</div> : null)}
                {s.startsAt && <div className="live-datetime">{formatDateTime(s.startsAt)}</div>}
                <div className="live-bottom">
                  {isLive && <span className="live-dot" aria-label="Live" />}
                  <span className="live-status">{s.status || ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="news-page">
      <div className="news-hero">
        <div className="hero-text">
          <h1>Cricket News & Alerts</h1>
          <p>Trades, picks, releases and big-stat highlights in one place.</p>
        </div>
        <div className="hero-art">
          <Lottie loop play animationData={announcementAnimation} style={{ width: 220, height: 220 }} />
        </div>
      </div>

      <div className="news-toolbar">
        <input
          type="text"
          placeholder="Search news, e.g. trade, pick, release, runs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search news"
        />
        <div className="filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'trade' ? 'active' : ''} onClick={() => setFilter('trade')}>Trades ({counts.trade})</button>
          <button className={filter === 'pick' ? 'active' : ''} onClick={() => setFilter('pick')}>Picks ({counts.pick})</button>
          <button className={filter === 'release' ? 'active' : ''} onClick={() => setFilter('release')}>Releases ({counts.release})</button>
          <button className={filter === 'stats' ? 'active' : ''} onClick={() => setFilter('stats')}>Stats ({counts.stats})</button>
          <button className={filter === 'fixture' ? 'active' : ''} onClick={() => setFilter('fixture')}>Fixtures ({counts.fixture})</button>
        </div>
      </div>

      {loading ? (
        <div className="news-loader">
          <div className="loader-card">
            <div className="loader-art">
              <Lottie loop play animationData={hittingSixAnimation} style={{ width: 160, height: 160 }} />
            </div>
            <div className="loader-title">Fetching the latest buzz…</div>
            <div className="progress-shell" aria-label="Loading progress">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-text">{progress}%</div>
          </div>
        </div>
      ) : (
        <>
          <LiveScores />
          <div className="breaking-ticker">
            <div className="track">
              {(feed || []).filter(n => n.isBreaking).slice(0, 10).map((n, idx) => (
                <span key={idx} className="ticker-item">Breaking: {n.title}</span>
              ))}
            </div>
          </div>
          <div className="news-grid">
            {filtered.map((n, idx) => (
              <article key={idx} className={`news-card ${n.kind} ${n.status}`}>
                <div className="news-header">
                  <div className={`pill ${n.kind}`}>{kindIcon(n.kind)}<span className="pill-text">{n.kind}</span></div>
                  <div className={`status-pill ${n.status}`}>{n.status.replace('_', ' ')}</div>
                </div>
                <h3 className="news-title">{n.title}</h3>
                {n.status === 'admin_pending' && (
                  <div className="accepted-note">
                    <FaCheckCircle style={{ marginRight: 8 }} />Accepted by recipient · Awaiting admin approval
                  </div>
                )}
                {n.status === 'rejected' && (
                  <div className="rejected-note">
                    <FaTimesCircle style={{ marginRight: 8 }} />Proposal rejected
                  </div>
                )}
                {n.status === 'withdrawn' && (
                  <div className="withdrawn-note">
                    <FaTimesCircle style={{ marginRight: 8 }} />Proposal withdrawn
                  </div>
                )}
                {n.body && <p className="news-summary">{n.body}</p>}
                <div className="news-meta">
                  <span className="date">{new Date(n.timestamp).toLocaleString()}</span>
                </div>
              </article>
            ))}
            {filtered.length === 0 && (
              <div className="empty">No news found. Try a different search.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NewsAlerts;


