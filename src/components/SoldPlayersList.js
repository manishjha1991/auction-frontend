import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../css/SoldPlayersList.css';
import PlayerPopup from './PlayerPopup';
import PlayerAvatar from './PlayerAvatar';
import { API_ENDPOINTS } from '../const';
import { FaSearch, FaRedo, FaGavel } from 'react-icons/fa';

const TIER_ORDER = ['icon', 'gold', 'silver', 'emerald', 'sapphire', 'platinum', 'diamond'];

/** Matches Player model enum order; extras appended alphabetically. */
const ROLE_ORDER = ['Batsman', 'Bowler', 'Allrounder', 'WicketKeeper'];

/** Tier slug for CSS — matches Profile team cards (`.up-card.{tier}` / `.up-tier-pill--{tier}`). */
const tierKeyFromType = (type) => {
  const t = String(type || '')
    .toLowerCase()
    .trim();
  if (!t) return 'default';
  if (TIER_ORDER.includes(t)) return t;
  return 'default';
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
  const [roleFilter, setRoleFilter] = useState('');
  /** Narrow screens: 4 cards per row — smaller avatar */
  const [isCompactGrid, setIsCompactGrid] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 639px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsCompactGrid(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

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

  /** Exact `role` strings as stored in DB (e.g. Batsman, WicketKeeper). */
  const roleOptions = useMemo(() => {
    const set = new Set();
    players.forEach((p) => {
      const r = p.role != null ? String(p.role).trim() : '';
      if (r) set.add(r);
    });
    const known = ROLE_ORDER.filter((r) => set.has(r));
    const rest = [...set]
      .filter((r) => !ROLE_ORDER.includes(r))
      .sort((a, b) => a.localeCompare(b));
    return [...known, ...rest];
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = players.filter((p) => (p.name || '').toLowerCase().includes(q));
    if (typeFilter) {
      list = list.filter((p) => (p.type || '').toLowerCase() === typeFilter);
    }
    if (roleFilter) {
      list = list.filter((p) => String(p.role || '').trim() === roleFilter);
    }
    return [...list].sort((a, b) => parsePrice(b) - parsePrice(a));
  }, [players, searchQuery, typeFilter, roleFilter]);

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
              className={`sold-page__chip sold-page__chip--tier-${t}${typeFilter === t ? ' is-active' : ''}`}
              onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {roleOptions.length > 0 && (
        <div className="sold-page__filters sold-page__filters--role" role="group" aria-label="Filter by role">
          <button
            type="button"
            className={`sold-page__chip sold-page__chip--role${roleFilter === '' ? ' is-active' : ''}`}
            onClick={() => setRoleFilter('')}
          >
            All roles
          </button>
          {roleOptions.map((r) => (
            <button
              key={r}
              type="button"
              className={`sold-page__chip sold-page__chip--role${roleFilter === r ? ' is-active' : ''}`}
              onClick={() => setRoleFilter(roleFilter === r ? '' : r)}
            >
              {r}
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
            {searchQuery || typeFilter || roleFilter
              ? 'No sold players match your filters.'
              : 'No sold players yet — the ledger will fill as the auction progresses.'}
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const tier = tierKeyFromType(player.type);
            const pid = player.id || player._id;
            const fullTeam = player.teamName?.trim() || '';
            return (
              <button
                key={pid ? String(pid) : player.name}
                type="button"
                className={`sold-card sold-card--${tier}`}
                role="listitem"
                aria-label={`${player.name}${fullTeam ? `, ${fullTeam}` : ''}${player.role ? `, ${player.role}` : ''}`}
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="sold-card__banner" title={fullTeam || 'Team not set'}>
                  <span className="sold-card__banner-text">{fullTeam || '—'}</span>
                </div>
                <div className="sold-card__body">
                  <div className="sold-card__avatar-wrap">
                    <PlayerAvatar
                      profilePicture={player.profilePicture}
                      name={player.name}
                      size={isCompactGrid ? 36 : 56}
                    />
                  </div>
                  <h2 className="sold-card__name">{player.name}</h2>
                  <div className="sold-card__meta">
                    {player.type ? (
                      <span className={`sold-card__tier sold-card__tier--${tier}`}>{String(player.type)}</span>
                    ) : null}
                    {player.role ? <span className="sold-card__role">{player.role}</span> : null}
                  </div>
                  <div className="sold-card__price">
                    <FaGavel aria-hidden />
                    <span>{formatBasePrice(player.biddingPrice || player.basePrice)}</span>
                  </div>
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
