import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FaBoxOpen, FaUserMinus, FaExchangeAlt, FaChartBar, FaSyncAlt, FaTimes, FaSearch } from 'react-icons/fa';
import { API_ENDPOINTS } from '../const';
import '../css/AdminTradeActivity.css';

function AdminTradeActivity() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [popupTeam, setPopupTeam] = useState(null);
  const [popupDetails, setPopupDetails] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTeamIds, setSearchTeamIds] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('user');
    if (cached) setUser(JSON.parse(cached));
  }, []);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/admin-tools/team-trade-activity?adminUserId=${user.id}`);
      if (!r.ok) throw new Error('Failed to load');
      const j = await r.json();
      setTeams(j.teams || []);
    } catch (e) {
      setError(e.message || 'Failed to load team trade activity');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) load();
  }, [user?.id, load]);

  const openPopup = useCallback(async (team) => {
    setPopupTeam(team);
    setPopupDetails(null);
    setPopupLoading(true);
    try {
      const r = await fetch(
        `${API_ENDPOINTS}/api/admin-tools/team-trade-activity/${team.userId}/details?adminUserId=${user?.id}`
      );
      if (!r.ok) throw new Error('Failed to load details');
      const j = await r.json();
      setPopupDetails(j);
    } catch (e) {
      setPopupDetails({ error: e.message });
    } finally {
      setPopupLoading(false);
    }
  }, [user?.id]);

  const closePopup = useCallback(() => {
    setPopupTeam(null);
    setPopupDetails(null);
  }, []);

  // Debounced search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSearchTeamIds(null);
      return;
    }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const r = await fetch(
          `${API_ENDPOINTS}/api/admin-tools/team-trade-activity/search?q=${encodeURIComponent(q)}&adminUserId=${user?.id}`
        );
        if (r.ok) {
          const j = await r.json();
          setSearchTeamIds(j.teamIds || []);
        } else {
          setSearchTeamIds([]);
        }
      } catch {
        setSearchTeamIds([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, user?.id]);

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return teams;
    if (searchTeamIds === null) return teams;
    if (searchTeamIds.length === 0) return [];
    return teams.filter((t) => searchTeamIds.includes(t.userId));
  }, [teams, searchQuery, searchTeamIds]);

  if (!user) {
    return (
      <div className="admin-trade-activity-page">
        <p>Please log in to view this page.</p>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="admin-trade-activity-page">
        <p>Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="admin-trade-activity-page">
      <div className="ata-header">
        <h1 className="ata-title">
          <FaChartBar className="ata-title-icon" />
          Team Trade Activity
        </h1>
        <p className="ata-subtitle">
          Picks, releases & trades by team • <strong>Used</strong> should equal trades + releases + picks that were{' '}
          <em>not</em> same-tier paired to a release (see slot math on each card).
        </p>
        <button className="ata-refresh" onClick={load} disabled={loading}>
          <FaSyncAlt className={loading ? 'spin' : ''} /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="ata-error">{error}</div>}

      <div className="ata-search-wrap">
        <FaSearch className="ata-search-icon" />
        <input
          type="search"
          className="ata-search-input"
          placeholder="Search team or player (min 2 chars)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search team or player"
        />
        {searchLoading && <span className="ata-search-loading">Searching...</span>}
        {searchQuery.trim().length >= 2 && !searchLoading && filteredTeams.length > 0 && (
          <span className="ata-search-count">{filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {loading && teams.length === 0 ? (
        <div className="ata-loading">Loading teams...</div>
      ) : (
        <div className="ata-grid">
          {filteredTeams.map((t) => (
            <div
              key={t.userId}
              className="ata-card ata-card-clickable"
              onClick={() => openPopup(t)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openPopup(t)}
            >
              <div className="ata-card-header">
                <h2 className="ata-team-name">{t.teamName}</h2>
                <div className="ata-usage-badges">
                  <span className="ata-badge ata-used">
                    Used: {t.tradesUsed}/{t.cap}
                  </span>
                  <span className="ata-badge ata-remaining">
                    Left: {t.remaining}
                  </span>
                </div>
              </div>
              <div className="ata-stats">
                <div className="ata-stat">
                  <FaBoxOpen className="ata-stat-icon ata-pick" />
                  <span className="ata-stat-label">Picks</span>
                  <span className="ata-stat-value">{t.picks}</span>
                </div>
                <div className="ata-stat">
                  <FaUserMinus className="ata-stat-icon ata-release" />
                  <span className="ata-stat-label">Releases</span>
                  <span className="ata-stat-value">{t.releases}</span>
                </div>
                <div className="ata-stat">
                  <FaExchangeAlt className="ata-stat-icon ata-trade" />
                  <span className="ata-stat-label">Trades</span>
                  <span className="ata-stat-value">{t.trades}</span>
                </div>
              </div>
              <p className="ata-slot-math" title="Same-tier release + unsold pick uses one pick row but only one extra slot on top of the release.">
                Slot math: {t.trades} trade{t.trades !== 1 ? 's' : ''} + {t.releases} release
                {t.releases !== 1 ? 's' : ''} + {t.standalonePicks ?? 0} standalone pick
                {(t.standalonePicks ?? 0) !== 1 ? 's' : ''}
                {typeof t.pairedPicks === 'number' && t.pairedPicks > 0
                  ? ` (${t.pairedPicks} pick${t.pairedPicks !== 1 ? 's' : ''} paired to a release)`
                  : ''}{' '}
                = <strong>{t.expectedTradesUsed ?? '—'}</strong> expected
              </p>
              {typeof t.usageDrift === 'number' && t.usageDrift !== 0 && (
                <p className="ata-drift-warn">
                  Stored {t.tradesUsed} differs from expected {t.expectedTradesUsed} by {t.usageDrift > 0 ? '+' : ''}
                  {t.usageDrift}. Check manual DB edits or legacy approvals.
                </p>
              )}
              <p className="ata-card-hint">Click to view players involved</p>
            </div>
          ))}
        </div>
      )}

      {!loading && teams.length === 0 && !error && (
        <div className="ata-empty">No teams found.</div>
      )}

      {!loading && teams.length > 0 && searchQuery.trim().length >= 2 && filteredTeams.length === 0 && !searchLoading && (
        <div className="ata-empty">No teams found for &quot;{searchQuery.trim()}&quot;</div>
      )}

      {popupTeam && (
        <div className="ata-popup-overlay" onClick={closePopup}>
          <div className="ata-popup" onClick={(e) => e.stopPropagation()}>
            <div className="ata-popup-header">
              <h2>{popupTeam.teamName} – Players Involved</h2>
              <button className="ata-popup-close" onClick={closePopup} aria-label="Close">
                <FaTimes />
              </button>
            </div>
            {popupTeam && typeof popupTeam.expectedTradesUsed === 'number' && (
              <div className="ata-popup-reconcile">
                <strong>Why “Used” is {popupTeam.tradesUsed}:</strong> each completed trade with this team +1; each
                approved release +1; each approved unsold pick +1 except picks paired to a same-tier release (no extra slot beyond the release). Reconciles to{' '}
                <strong>
                  {popupTeam.trades} + {popupTeam.releases} + {popupTeam.standalonePicks ?? 0} ={' '}
                  {popupTeam.expectedTradesUsed}
                </strong>{' '}
                expected
                {typeof popupTeam.usageDrift === 'number' && popupTeam.usageDrift !== 0 && (
                  <span className="ata-drift-inline">
                    {' '}
                    (stored − expected = {popupTeam.usageDrift > 0 ? '+' : ''}
                    {popupTeam.usageDrift})
                  </span>
                )}
                .
              </div>
            )}
            {popupLoading ? (
              <div className="ata-popup-loading">Loading...</div>
            ) : popupDetails?.error ? (
              <div className="ata-popup-error">{popupDetails.error}</div>
            ) : popupDetails ? (
              <div className="ata-popup-content">
                <section className="ata-popup-section">
                  <h3><FaUserMinus className="ata-release" /> Releases ({popupDetails.releases?.length || 0})</h3>
                  <ul className="ata-player-list">
                    {(popupDetails.releases || []).map((r, i) => (
                      <li key={i} className={`ata-player-item type-${(r.player?.type || '').toLowerCase()}`}>
                        {r.player?.name || 'Unknown'} <span className={`ata-type-badge type-${(r.player?.type || '').toLowerCase()}`}>{r.player?.type || '—'}</span>
                      </li>
                    ))}
                    {(!popupDetails.releases || popupDetails.releases.length === 0) && <li className="ata-empty-list">None</li>}
                  </ul>
                </section>
                <section className="ata-popup-section">
                  <h3><FaBoxOpen className="ata-pick" /> Picks ({popupDetails.picks?.length || 0})</h3>
                  <ul className="ata-player-list">
                    {(popupDetails.picks || []).map((p, i) => (
                      <li key={i} className={`ata-player-item type-${(p.player?.type || '').toLowerCase()}`}>
                        {p.player?.name || 'Unknown'} <span className={`ata-type-badge type-${(p.player?.type || '').toLowerCase()}`}>{p.player?.type || '—'}</span>
                      </li>
                    ))}
                    {(!popupDetails.picks || popupDetails.picks.length === 0) && <li className="ata-empty-list">None</li>}
                  </ul>
                </section>
                <section className="ata-popup-section">
                  <h3><FaExchangeAlt className="ata-trade" /> Trades ({popupDetails.trades?.length || 0})</h3>
                  <ul className="ata-player-list ata-trade-list">
                    {(popupDetails.trades || []).map((t, i) => (
                      <li key={i}>
                        <span className="ata-trade-pair">
                          <span className="ata-trade-player-wrap">
                            <span className={`ata-trade-player type-${(t.offeredPlayer?.type || '').toLowerCase()}`}>{t.offeredPlayer?.name || '?'}</span>
                            <span className={`ata-type-badge type-${(t.offeredPlayer?.type || '').toLowerCase()}`}>{t.offeredPlayer?.type || '—'}</span>
                          </span>
                          <span className="ata-trade-arrow">↔</span>
                          <span className="ata-trade-player-wrap">
                            <span className={`ata-trade-player type-${(t.requestedPlayer?.type || '').toLowerCase()}`}>{t.requestedPlayer?.name || '?'}</span>
                            <span className={`ata-type-badge type-${(t.requestedPlayer?.type || '').toLowerCase()}`}>{t.requestedPlayer?.type || '—'}</span>
                          </span>
                        </span>
                        <span className="ata-trade-meta">
                          {t.direction === 'out' ? '→' : '←'} {t.otherTeam || 'Unknown'}
                        </span>
                      </li>
                    ))}
                    {(!popupDetails.trades || popupDetails.trades.length === 0) && <li className="ata-empty-list">None</li>}
                  </ul>
                </section>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTradeActivity;
