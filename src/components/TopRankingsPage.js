import React, { useEffect, useMemo, useState } from 'react';
import {
  FaBowlingBall,
  FaBalanceScale,
  FaMedal,
  FaFireAlt,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import '../css/TopRankingsPage.css';
import { API_ENDPOINTS } from '../const';

const formatMetricValue = (value) =>
  typeof value === 'number' ? value.toLocaleString('en-IN') : value;

const resolveImageUrl = (src) => {
  if (!src) return '/images/logo512.png';
  if (src.startsWith('http')) return src;
  return `${API_ENDPOINTS}/${src.replace(/^\/+/, '')}`;
};

const FeaturedCard = ({ player, metricLabel, metricValue }) => {
  if (!player) return null;
  return (
    <div className={`featured-card ${tierClass(player.type)}`}>
      <div className="featured-left">
        <p className="featured-label">#1 Ranked</p>
        <div className="featured-name-row">
          <img
            src={resolveImageUrl(player.teamLogo)}
            alt={`${player.teamName || 'Free Agent'} logo`}
          />
          <h3>{player.name}</h3>
        </div>
        <div className="featured-metric">
          <span>{metricLabel}</span>
          <strong>{metricValue}</strong>
        </div>
      </div>
      {player.profilePicture && (
        <div className="featured-avatar">
          <img
            src={resolveImageUrl(player.profilePicture)}
            alt={`${player.name} portrait`}
          />
        </div>
      )}
    </div>
  );
};

const tierClass = (type = '') => {
  const text = (type || '').toLowerCase();
  if (text.includes('sapphire')) return 'tier-sapphire';
  if (text.includes('emerald')) return 'tier-emerald';
  if (text.includes('gold')) return 'tier-gold';
  if (text.includes('silver')) return 'tier-silver';
  return 'tier-default';
};

const TopRow = ({ player, rank, metricLabel, metricValue }) => (
  <div className={`top-row ${tierClass(player.type)}`}>
    <div className="top-rank">
      <span>{String(rank).padStart(2, '0')}</span>
      <FaMedal />
    </div>
    <div className="top-player">
      <img
        src={resolveImageUrl(player.teamLogo)}
        alt={`${player.teamName || 'Free Agent'} logo`}
      />
      <div>
        <p className={`player-name ${tierClass(player.type)}`}>{player.name}</p>
      </div>
    </div>
    <div className="top-metric">
      <span>{metricLabel}</span>
      <strong>{metricValue}</strong>
    </div>
  </div>
);

const FullRow = ({ player, rank, metricLabel, metricValue }) => (
  <div className={`full-row ${tierClass(player.type)}`}>
    <div className="full-rank">{rank}</div>
    <div className="full-team">
      <img
        src={resolveImageUrl(player.teamLogo)}
        alt={`${player.teamName || 'Free Agent'} logo`}
      />
      <div>
        <p className={`player-name ${tierClass(player.type)}`}>{player.name}</p>
      </div>
    </div>
    <div className="full-metric">
      <span>{metricLabel}</span>
      <strong>{metricValue}</strong>
    </div>
  </div>
);

const RankingSection = ({
  title,
  icon,
  topData,
  fullData,
  metricLabel,
  metricAccessor,
  emptyText,
  variant,
}) => {
  const [expanded, setExpanded] = useState(false);
  const featured = topData[0];
  return (
    <section className={`ranking-section ${variant}`}>
      <header>
        <div className="title">
          {icon}
          <div>
            <h2>{title}</h2>
            <p>Live CPL rankings driven by cumulative stats</p>
          </div>
        </div>
      </header>

      {featured ? (
        <FeaturedCard
          player={featured}
          metricLabel={metricLabel}
          metricValue={metricAccessor(featured)}
        />
      ) : (
        <div className="empty-state">{emptyText}</div>
      )}

      {topData.length > 1 && (
        <div className="top-list">
          {topData.slice(1).map((player, idx) => (
            <TopRow
              key={player.id}
              player={player}
              rank={idx + 2}
              metricLabel={metricLabel}
              metricValue={metricAccessor(player)}
            />
          ))}
        </div>
      )}

      {fullData.length > 0 && (
        <div className="full-rankings">
          <button
            className="full-heading"
            onClick={() => setExpanded((prev) => !prev)}
          >
            <span>Full Rankings ({fullData.length})</span>
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {expanded && (
            <div className="full-scroll">
              {fullData.map((player, idx) => (
                <FullRow
                  key={`full-${player.id}`}
                  player={player}
                  rank={idx + 1}
                  metricLabel={metricLabel}
                  metricValue={metricAccessor(player)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const TopRankingsPage = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_ENDPOINTS}/api/player/players/data`);
        if (!response.ok) {
          throw new Error('Unable to load players');
        }
        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data.map((player) => ({
              ...player,
              totalRuns: Number(player.totalRuns) || 0,
              totalWickets: Number(player.totalWickets) || 0,
              matchesPlayed: Number(player.matchesPlayed) || 0,
            }))
          : [];
        setPlayers(normalized);
        setError(null);
        setFetchedAt(new Date());
      } catch (err) {
        setError(err.message || 'Failed to load rankings');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const allBatters = useMemo(() => {
    return players
      .filter((p) => {
        const role = (p.role || '').toLowerCase();
        const isBatterRole = role.includes('bat') || role.includes('keeper');
        return p.totalRuns > 0 && isBatterRole && !role.includes('all');
      })
      .sort((a, b) => b.totalRuns - a.totalRuns);
  }, [players]);

  const allBowlers = useMemo(() => {
    return players
      .filter((p) => {
        const role = (p.role || '').toLowerCase();
        return p.totalWickets > 0 && role.includes('bowl') && !role.includes('all');
      })
      .sort((a, b) => b.totalWickets - a.totalWickets);
  }, [players]);

  const allAllRounders = useMemo(() => {
    if (!players.length) return [];
    const runsMax = Math.max(...players.map((p) => p.totalRuns || 0), 1);
    const wktsMax = Math.max(...players.map((p) => p.totalWickets || 0), 1);

    const excludedIds = new Set([
      ...allBatters.slice(0, 5).map((p) => String(p.id)),
      ...allBowlers.slice(0, 5).map((p) => String(p.id)),
    ]);

    return players
      .filter(
        (p) =>
          !excludedIds.has(String(p.id)) &&
          p.totalRuns > 0 &&
          p.totalWickets > 0 &&
          (p.role || '').toLowerCase().includes('all')
      )
      .map((p) => ({
        ...p,
        allrounderScore:
          (p.totalRuns / runsMax) * 0.5 + (p.totalWickets / wktsMax) * 0.5,
      }))
      .sort((a, b) => b.allrounderScore - a.allrounderScore);
  }, [players, allBatters, allBowlers]);

  const topBatters = useMemo(() => allBatters.slice(0, 5), [allBatters]);
  const topBowlers = useMemo(() => allBowlers.slice(0, 5), [allBowlers]);
  const topAllRounders = useMemo(() => allAllRounders.slice(0, 5), [allAllRounders]);

  return (
    <div className="rankings-page">
      {fetchedAt && (
        <div className="rankings-banner">
          Last refreshed&nbsp;
          {fetchedAt.toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </div>
      )}

      {loading && <div className="rankings-state">Crunching numbers…</div>}
      {error && !loading && <div className="rankings-state error">{error}</div>}

      {!loading && !error && (
        <div className="rankings-grid">
          <RankingSection
            title="Top 5 CPL Batters"
            icon={<FaFireAlt />}
            topData={topBatters}
            fullData={allBatters}
            metricLabel="Total Runs"
            metricAccessor={(p) => formatMetricValue(p.totalRuns)}
            emptyText="No batting records yet."
            variant="batting"
          />
          <RankingSection
            title="Top 5 CPL Bowlers"
            icon={<FaBowlingBall />}
            topData={topBowlers}
            fullData={allBowlers}
            metricLabel="Total Wickets"
            metricAccessor={(p) => formatMetricValue(p.totalWickets)}
            emptyText="No bowling records yet."
            variant="bowling"
          />
          <RankingSection
            title="Top 5 CPL All-Rounders"
            icon={<FaBalanceScale />}
            topData={topAllRounders}
            fullData={allAllRounders}
            metricLabel="Runs · Wickets"
            metricAccessor={(p) =>
              `${formatMetricValue(p.totalRuns)} · ${formatMetricValue(p.totalWickets)}`
            }
            emptyText="Need players contributing with both bat and ball."
            variant="allrounder"
          />
        </div>
      )}
    </div>
  );
};

export default TopRankingsPage;

