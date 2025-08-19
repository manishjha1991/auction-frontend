import React, { useEffect, useMemo, useState } from 'react';
import Lottie from 'react-lottie-player';
import announcementAnimation from './animations/Announcment.json';
import '../css/NewsAlerts.css';
import { API_ENDPOINTS } from '../const';
import { FaExchangeAlt, FaHandHolding, FaUnlockAlt, FaStar, FaTrophy } from 'react-icons/fa';

function NewsAlerts() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | trade | pick | release | stats | fixture
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  async function loadFeed() {
    try {
      setLoading(true);
      const res = await fetch(`${API_ENDPOINTS}/api/news/feed`);
      const j = await res.json();
      setFeed(j.items || []);
    } catch (e) {
      setToast('Failed to load news');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFeed(); }, []);

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
        <div className="empty">Loading…</div>
      ) : (
        <>
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


