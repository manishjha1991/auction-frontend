import React, { useEffect, useMemo, useState } from 'react';
import {
  FaBowlingBall,
  FaBalanceScale,
  FaMedal,
  FaFireAlt,
  FaChevronDown,
  FaChevronUp,
  FaCrown,
} from 'react-icons/fa';
import '../css/TopRankingsPage.css';
import { API_ENDPOINTS } from '../const';
import { resolvePlayerImageUrl } from '../utils/resolvePlayerImageUrl';

const formatMetricValue = (value) =>
  typeof value === 'number' ? value.toLocaleString('en-IN') : value;

/** Fantasy-style tie-break: runs + 22 × wickets (same order of magnitude as CPL helpers). */
const impactScore = (p) =>
  (Number(p.totalRuns) || 0) + (Number(p.totalWickets) || 0) * 22;

const SpotlightCard = ({
  title,
  subtitle,
  player,
  statLine,
  accentClass,
}) => {
  if (!player) {
    return (
      <div className={`spotlight-card spotlight-card--empty ${accentClass}`}>
        <p className="spotlight-eyebrow">{title}</p>
        <p className="spotlight-empty">No data yet</p>
      </div>
    );
  }
  return (
    <div className={`spotlight-card ${accentClass}`}>
      <div className="spotlight-card-inner">
        <div className="spotlight-copy">
          <p className="spotlight-eyebrow">{title}</p>
          {subtitle ? <p className="spotlight-subtitle">{subtitle}</p> : null}
          <div className="spotlight-name-row">
            {player.teamLogo ? (
              <img
                src={resolveImageUrl(player.teamLogo)}
                alt=""
                className="spotlight-team-logo"
              />
            ) : null}
            <h3 className="spotlight-name">{player.name}</h3>
          </div>
          <p className="spotlight-stat-line">{statLine}</p>
        </div>
        {player.profilePicture ? (
          <img
            className="spotlight-portrait"
            src={resolveImageUrl(player.profilePicture)}
            alt=""
          />
        ) : (
          <div className="spotlight-portrait spotlight-portrait--fallback" aria-hidden>
            {String(player.name || '?').slice(0, 1)}
          </div>
        )}
      </div>
    </div>
  );
};

const resolveImageUrl = (src) =>
  resolvePlayerImageUrl(src) || '/images/logo512.png';

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
        const response = await fetch(
          `${API_ENDPOINTS}/api/player/players/data?includeInactive=true&nocache=1&t=${Date.now()}`
        );
        if (!response.ok) {
          throw new Error('Unable to load players');
        }
        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data.map((player) => ({
              ...player,
              totalRuns: Number(player.totalRuns) || 0,
              totalWickets: Number(player.totalWickets) || 0,
              momCount: Number(player.momCount) || 0,
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
        // Batsman/WicketKeeper; Allrounder has no "bat" substring so must be listed explicitly.
        const isBatterRole =
          role.includes('bat') ||
          role.includes('keeper') ||
          role.includes('allrounder');
        return p.totalRuns > 0 && isBatterRole;
      })
      .sort((a, b) => b.totalRuns - a.totalRuns);
  }, [players]);

  const allBowlers = useMemo(() => {
    return players
      .filter((p) => {
        const role = (p.role || '').toLowerCase();
        return role.includes('bowl') && !role.includes('all');
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

  const mostRunsPlayer = useMemo(() => {
    if (!players.length) return null;
    const withRuns = players.filter((p) => (p.totalRuns || 0) > 0);
    if (!withRuns.length) return null;
    return [...withRuns].sort((a, b) => b.totalRuns - a.totalRuns)[0];
  }, [players]);

  const mostWicketsPlayer = useMemo(() => {
    if (!players.length) return null;
    const withWkts = players.filter((p) => (p.totalWickets || 0) > 0);
    if (!withWkts.length) return null;
    return [...withWkts].sort((a, b) => b.totalWickets - a.totalWickets)[0];
  }, [players]);

  const { mvpPlayer, mvpByMom } = useMemo(() => {
    if (!players.length) return { mvpPlayer: null, mvpByMom: false };
    const withMom = players.filter((p) => (p.momCount || 0) > 0);
    if (withMom.length) {
      const sorted = [...withMom].sort((a, b) => {
        const mc = (b.momCount || 0) - (a.momCount || 0);
        if (mc !== 0) return mc;
        return impactScore(b) - impactScore(a);
      });
      return { mvpPlayer: sorted[0], mvpByMom: true };
    }
    const sorted = [...players].sort(
      (a, b) => impactScore(b) - impactScore(a)
    );
    const top = sorted[0];
    if (!top || impactScore(top) <= 0) return { mvpPlayer: null, mvpByMom: false };
    return { mvpPlayer: top, mvpByMom: false };
  }, [players]);

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
        <>
          <section className="rankings-spotlight" aria-label="League leaders">
            <div className="rankings-spotlight-head">
              <FaCrown className="rankings-spotlight-crown" aria-hidden />
              <div>
                <h1 className="rankings-spotlight-title">League leaders</h1>
                <p className="rankings-spotlight-desc">
                  Most runs, most wickets, and MVP (Man of the Match awards, or impact score if no MoM
                  data).
                </p>
              </div>
            </div>
            <div className="rankings-spotlight-grid">
              <SpotlightCard
                title="Most runs"
                subtitle="All players · cumulative"
                player={mostRunsPlayer}
                statLine={
                  mostRunsPlayer
                    ? `${formatMetricValue(mostRunsPlayer.totalRuns)} runs`
                    : ''
                }
                accentClass="spotlight--runs"
              />
              <SpotlightCard
                title="Most wickets"
                subtitle="All players · cumulative"
                player={mostWicketsPlayer}
                statLine={
                  mostWicketsPlayer
                    ? `${formatMetricValue(mostWicketsPlayer.totalWickets)} wickets`
                    : ''
                }
                accentClass="spotlight--wickets"
              />
              <SpotlightCard
                title="MVP"
                subtitle={
                  mvpByMom
                    ? 'Man of the Match awards (then impact score)'
                    : 'Impact score: runs + 22 × wickets'
                }
                player={mvpPlayer}
                statLine={
                  mvpPlayer
                    ? mvpByMom
                      ? `${formatMetricValue(mvpPlayer.momCount)}× MoM · ${formatMetricValue(
                          mvpPlayer.totalRuns
                        )} runs · ${formatMetricValue(mvpPlayer.totalWickets)} wkts`
                      : `Score ${formatMetricValue(impactScore(mvpPlayer))} · ${formatMetricValue(
                          mvpPlayer.totalRuns
                        )} runs · ${formatMetricValue(mvpPlayer.totalWickets)} wkts`
                    : ''
                }
                accentClass="spotlight--mvp"
              />
            </div>
          </section>

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
        </>
      )}
    </div>
  );
};

export default TopRankingsPage;

