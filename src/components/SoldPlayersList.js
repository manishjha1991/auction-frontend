import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../css/SoldPlayersList.css';
import PlayerPopup from './PlayerPopup';
import PlayerAvatar from './PlayerAvatar';
import { API_ENDPOINTS } from '../const';
import { FaSearch, FaRedo, FaGavel } from 'react-icons/fa';

const TIER_ORDER = ['icon', 'gold', 'silver', 'emerald', 'sapphire', 'platinum', 'diamond'];

const tierStyle = (type) => {
  const t = (type || '').toLowerCase();
  const map = {
    gold: { bar: '#c9a227', soft: 'rgba(201, 162, 39, 0.12)', ink: '#7a5e12' },
    silver: { bar: '#7a8494', soft: 'rgba(122, 132, 148, 0.14)', ink: '#3d4450' },
    emerald: { bar: '#2d6a4f', soft: 'rgba(45, 106, 79, 0.12)', ink: '#1b4332' },
    sapphire: { bar: '#1d4ed8', soft: 'rgba(29, 78, 216, 0.1)', ink: '#1e3a8a' },
    icon: { bar: '#b4532a', soft: 'rgba(180, 83, 42, 0.12)', ink: '#7c2d12' },
    platinum: { bar: '#64748b', soft: 'rgba(100, 116, 139, 0.14)', ink: '#334155' },
    diamond: { bar: '#0e7490', soft: 'rgba(14, 116, 144, 0.12)', ink: '#155e75' },
  };
  return map[t] || { bar: '#1e3a2f', soft: 'rgba(30, 58, 47, 0.1)', ink: '#1e3a2f' };
};

const SoldPlayersList = () => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        setIsAdmin(user?.isAdmin === true);
      }
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const fetchSoldPlayers = useCallback(async () => {
    const response = await fetch(`${API_ENDPOINTS}/api/players/data`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    setPlayers(Array.isArray(data) ? data.filter((p) => p.status === 'Sold') : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchSoldPlayers();
      } catch (err) {
        console.error('Failed to fetch sold players:', err);
        if (!cancelled) setError('Failed to load sold players. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchSoldPlayers]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await fetchSoldPlayers();
    } catch (err) {
      setError('Failed to refresh. Try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const formatBasePrice = (price) => {
    const value = Number(price);
    if (!Number.isFinite(value)) return '—';
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)} K`;
    return String(value);
  };

  const parsePrice = (p) => {
    const n = Number(p?.biddingPrice ?? p?.basePrice ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const tierOptions = useMemo(() => {
    const set = new Set();
    players.forEach((p) => {
      if (p.type) set.add(String(p.type).toLowerCase());
    });
    const known = TIER_ORDER.filter((t) => set.has(t));
    const rest = [...set].filter((t) => !TIER_ORDER.includes(t)).sort();
    return [...known, ...rest];
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = players.filter((p) => (p.name || '').toLowerCase().includes(q));
    if (typeFilter) {
      list = list.filter((p) => (p.type || '').toLowerCase() === typeFilter);
    }
    return [...list].sort((a, b) => parsePrice(b) - parsePrice(a));
  }, [players, searchQuery, typeFilter]);

  const stats = useMemo(() => {
    const totalHammer = players.reduce((sum, p) => sum + parsePrice(p), 0);
    const teams = new Set(
      players.map((p) => (p.teamName || '').trim()).filter(Boolean)
    );
    return {
      count: players.length,
      totalHammer,
      teamCount: teams.size,
    };
  }, [players]);

  if (loading) {
    return (
      <div className="sold-page sold-page--loading" role="status" aria-live="polite">
        <div className="sold-page__loader">
          <div className="sold-page__loader-ring" aria-hidden />
          <p className="sold-page__loader-text">Loading auction ledger…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sold-page">
        <p className="sold-page__error">{error}</p>
        <div style={{ textAlign: 'center' }}>
          <button type="button" className="sold-page__btn" onClick={handleRefresh}>
            <FaRedo aria-hidden /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sold-page">
      <header className="sold-page__hero">
        <p className="sold-page__kicker">Auction ledger</p>
        <h1 className="sold-page__title">Sold players</h1>
        <p className="sold-page__lede">
          Every player marked sold in the pool — hammer price, winning team, and tier. Tap a card for
          full profile and stats.
        </p>
      </header>

      <div className="sold-page__toolbar">
        <div className="sold-page__search-wrap">
          <span className="sold-page__search-icon" aria-hidden>
            <FaSearch />
          </span>
          <input
            type="search"
            className="sold-page__search"
            placeholder="Search by name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search sold players by name"
          />
        </div>
        <button
          type="button"
          className="sold-page__btn"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-busy={refreshing}
        >
          <FaRedo aria-hidden /> {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {tierOptions.length > 0 && (
        <div className="sold-page__filters" role="group" aria-label="Filter by tier">
          <button
            type="button"
            className={`sold-page__chip${typeFilter === '' ? ' is-active' : ''}`}
            onClick={() => setTypeFilter('')}
          >
            All tiers
          </button>
          {tierOptions.map((t) => (
            <button
              key={t}
              type="button"
              className={`sold-page__chip${typeFilter === t ? ' is-active' : ''}`}
              onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <section className="sold-page__stats" aria-label="Summary">
        <div className="sold-page__stat">
          <div className="sold-page__stat-label">Sold</div>
          <div className="sold-page__stat-value">{stats.count}</div>
          <div className="sold-page__stat-sub">players in ledger</div>
        </div>
        <div className="sold-page__stat">
          <div className="sold-page__stat-label">Total hammer</div>
          <div className="sold-page__stat-value">{formatBasePrice(stats.totalHammer)}</div>
          <div className="sold-page__stat-sub">combined winning bids</div>
        </div>
        <div className="sold-page__stat">
          <div className="sold-page__stat-label">Teams</div>
          <div className="sold-page__stat-value">{stats.teamCount}</div>
          <div className="sold-page__stat-sub">with at least one buy</div>
        </div>
      </section>

      <div className="sold-page__grid" role="list">
        {filteredPlayers.length === 0 ? (
          <div className="sold-page__empty" role="status">
            {searchQuery || typeFilter
              ? 'No sold players match your filters.'
              : 'No sold players yet — the ledger will fill as the auction progresses.'}
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const st = tierStyle(player.type);
            const pid = player.id || player._id;
            return (
              <button
                key={pid ? String(pid) : player.name}
                type="button"
                className="sold-card"
                role="listitem"
                style={{
                  '--sold-tier': st.bar,
                  '--sold-tier-soft': st.soft,
                  '--sold-tier-ink': st.ink,
                }}
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="sold-card__team" title={player.teamName || ''}>
                  {player.teamName?.trim() || 'Team TBC'}
                </div>
                <div className="sold-card__avatar-wrap">
                  <PlayerAvatar profilePicture={player.profilePicture} name={player.name} size={56} />
                </div>
                <h2 className="sold-card__name">{player.name}</h2>
                <div className="sold-card__meta">
                  {player.type ? (
                    <span className="sold-card__tier">{String(player.type)}</span>
                  ) : null}
                  {player.role ? <span className="sold-card__role">{player.role}</span> : null}
                </div>
                <div className="sold-card__price">
                  <FaGavel aria-hidden />
                  <span>{formatBasePrice(player.biddingPrice || player.basePrice)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedPlayer && (
        <PlayerPopup
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          isAdmin={isAdmin}
          onDeactivated={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
};

export default SoldPlayersList;
