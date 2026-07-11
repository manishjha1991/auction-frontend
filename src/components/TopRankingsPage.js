import React, { useEffect, useMemo, useState } from 'react';
import {
  FaBowlingBall,
  FaBalanceScale,
  FaFireAlt,
  FaChevronDown,
  FaChevronUp,
  FaCrown,
  FaTrophy,
  FaChartLine,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import '../css/TopRankingsPage.css';
import { API_ENDPOINTS } from '../const';
import { resolvePlayerImageUrl } from '../utils/resolvePlayerImageUrl';

const formatMetricValue = (value) =>
  typeof value === 'number' ? value.toLocaleString('en-IN') : value;

const MIN_RANKING_MATCHES = 50;

const isBattingRole = (role = '') => {
  const text = String(role || '').toLowerCase();
  return text.includes('bat') || text.includes('keeper') || text.includes('allrounder');
};

const isBowlingRole = (role = '') => {
  const text = String(role || '').toLowerCase();
  return text.includes('bowl') || text.includes('allrounder') || text.includes('keeper');
};

/** Fantasy-style tie-break: runs + 22 × wickets (same order of magnitude as CPL helpers). */
const impactScore = (p) =>
  (Number(p.totalRuns) || 0) + (Number(p.totalWickets) || 0) * 22;

const toVenueRates = (venue) => {
  const matches = Math.max(1, Number(venue?.matches) || 0);
  const runs = Number(venue?.batting?.runs) || 0;
  const wickets = Number(venue?.bowling?.wickets) || 0;
  const runsPerMatch = runs / matches;
  const wicketsPerMatch = wickets / matches;
  const runsPerWicket = wickets > 0 ? runs / wickets : Number.POSITIVE_INFINITY;
  return { matches, runs, wickets, runsPerMatch, wicketsPerMatch, runsPerWicket };
};

const resolveImageUrl = (src) =>
  resolvePlayerImageUrl(src) || '/images/logo512.png';

const tierClass = (type = '') => {
  const text = (type || '').toLowerCase();
  if (text.includes('sapphire')) return 'tier-sapphire';
  if (text.includes('emerald')) return 'tier-emerald';
  if (text.includes('gold')) return 'tier-gold';
  if (text.includes('silver')) return 'tier-silver';
  return 'tier-default';
};

const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

const SpotlightCard = ({ title, subtitle, player, statLine, accentClass, icon }) => {
  if (!player) {
    return (
      <div className={`rk-spot-card rk-spot-card--empty ${accentClass}`}>
        <p className="rk-spot-eyebrow">
          {icon}
          {title}
        </p>
        <p className="rk-spot-empty">No data yet</p>
      </div>
    );
  }
  return (
    <div className={`rk-spot-card ${accentClass}`}>
      <p className="rk-spot-eyebrow">
        {icon}
        {title}
      </p>
      <div className="rk-spot-body">
        {player.profilePicture ? (
          <img
            className="rk-spot-portrait"
            src={resolveImageUrl(player.profilePicture)}
            alt=""
          />
        ) : (
          <div className="rk-spot-portrait rk-spot-portrait--fallback" aria-hidden>
            {initialsOf(player.name)}
          </div>
        )}
        <div className="rk-spot-meta">
          <div className="rk-spot-name-row">
            {player.teamLogo ? (
              <img
                src={resolveImageUrl(player.teamLogo)}
                alt=""
                className="rk-spot-team-logo"
              />
            ) : null}
            <h3 className="rk-spot-name">{player.name}</h3>
          </div>
          <p className="rk-spot-stat">{statLine}</p>
          {subtitle ? <p className="rk-spot-sub">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
};

const VenueSpotlightCard = ({
  title,
  subtitle,
  venue,
  statLine,
  metaLine,
  accentClass,
  icon,
}) => {
  if (!venue) {
    return (
      <div className={`rk-spot-card rk-spot-card--empty ${accentClass}`}>
        <p className="rk-spot-eyebrow">
          {icon}
          {title}
        </p>
        <p className="rk-spot-empty">No venue data yet</p>
      </div>
    );
  }
  return (
    <div className={`rk-spot-card rk-spot-card--venue ${accentClass}`}>
      <p className="rk-spot-eyebrow">
        {icon}
        {title}
      </p>
      <div className="rk-spot-body rk-spot-body--venue">
        <div className="rk-spot-venue-pin" aria-hidden>
          <FaMapMarkerAlt />
        </div>
        <div className="rk-spot-meta">
          <h3 className="rk-spot-name rk-spot-venue-name" title={venue.venue}>
            {venue.venue}
          </h3>
          <p className="rk-spot-stat">{statLine}</p>
          {metaLine ? <p className="rk-spot-sub">{metaLine}</p> : null}
          {subtitle ? <p className="rk-spot-sub rk-spot-sub--soft">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
};

const PodiumTile = ({ player, rank, metricLabel, metricValue }) => {
  if (!player) {
    return (
      <div className={`rk-podium rk-podium--${rank} rk-podium--empty`}>
        <div className="rk-podium-rank">{rank}</div>
        <div className="rk-podium-placeholder">—</div>
      </div>
    );
  }
  return (
    <div
      className={`rk-podium rk-podium--${rank} ${tierClass(player.type)}`}
    >
      <div className="rk-podium-rank">
        {rank === 1 ? <FaCrown aria-hidden /> : null}
        <span>{rank}</span>
      </div>
      <div className="rk-podium-avatar-wrap">
        {player.profilePicture ? (
          <img
            className="rk-podium-avatar"
            src={resolveImageUrl(player.profilePicture)}
            alt=""
          />
        ) : (
          <div className="rk-podium-avatar rk-podium-avatar--fallback" aria-hidden>
            {initialsOf(player.name)}
          </div>
        )}
        {player.teamLogo ? (
          <img
            src={resolveImageUrl(player.teamLogo)}
            alt=""
            className="rk-podium-team"
          />
        ) : null}
      </div>
      <p className="rk-podium-name">{player.name}</p>
      <p className="rk-podium-metric">
        <strong>{metricValue}</strong>
        <span>{metricLabel}</span>
      </p>
    </div>
  );
};

const ListRow = ({ player, rank, metricLabel, metricValue }) => (
  <div className={`rk-row ${tierClass(player.type)}`}>
    <div className="rk-row-rank">{String(rank).padStart(2, '0')}</div>
    <div className="rk-row-identity">
      {player.teamLogo ? (
        <img
          src={resolveImageUrl(player.teamLogo)}
          alt=""
          className="rk-row-logo"
        />
      ) : (
        <span className="rk-row-logo rk-row-logo--fallback" aria-hidden>
          {initialsOf(player.name)}
        </span>
      )}
      <div className="rk-row-meta">
        <p className="rk-row-name">{player.name}</p>
        {player.teamName ? (
          <p className="rk-row-team">{player.teamName}</p>
        ) : null}
      </div>
    </div>
    <div className="rk-row-metric">
      <strong>{metricValue}</strong>
      <span>{metricLabel}</span>
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

  const first = topData[0] || null;
  const second = topData[1] || null;
  const third = topData[2] || null;
  const restTop = topData.slice(3);

  return (
    <section className={`rk-section rk-section--${variant}`}>
      <header className="rk-section-head">
        <div className="rk-section-icon">{icon}</div>
        <div>
          <h2>{title}</h2>
          <p>Live CPL rankings driven by cumulative stats</p>
        </div>
      </header>

      {topData.length === 0 ? (
        <div className="rk-empty">{emptyText}</div>
      ) : (
        <>
          <div className="rk-podium-row">
            <PodiumTile
              player={second}
              rank={2}
              metricLabel={metricLabel}
              metricValue={second ? metricAccessor(second) : ''}
            />
            <PodiumTile
              player={first}
              rank={1}
              metricLabel={metricLabel}
              metricValue={first ? metricAccessor(first) : ''}
            />
            <PodiumTile
              player={third}
              rank={3}
              metricLabel={metricLabel}
              metricValue={third ? metricAccessor(third) : ''}
            />
          </div>

          {restTop.length > 0 && (
            <div className="rk-list">
              {restTop.map((player, idx) => (
                <ListRow
                  key={player.id}
                  player={player}
                  rank={idx + 4}
                  metricLabel={metricLabel}
                  metricValue={metricAccessor(player)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {fullData.length > 0 && (
        <div className="rk-full">
          <button
            type="button"
            className="rk-full-toggle"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            <span>Full rankings · {fullData.length}</span>
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {expanded && (
            <div className="rk-full-scroll">
              {fullData.map((player, idx) => (
                <ListRow
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
  const [activeCategory, setActiveCategory] = useState('batting');
  const [venueAggregates, setVenueAggregates] = useState([]);

  useEffect(() => {
    if (loading || typeof window === 'undefined') return;
    let cancelled = false;
    const fetchVenueAggregates = async () => {
      try {
        const response = await fetch(
          `${API_ENDPOINTS}/api/player-stats/venue-aggregate?scope=all`
        );
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setVenueAggregates(Array.isArray(data?.venues) ? data.venues : []);
        }
      } catch (_) {
        // Spotlight is best-effort; silent on failure so it doesn't block rankings.
      }
    };
    let idleHandle;
    const run = () => {
      if (!cancelled) void fetchVenueAggregates();
    };
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleHandle = window.requestIdleCallback(run, { timeout: 2500 });
    } else {
      idleHandle = window.setTimeout(run, 50);
    }
    return () => {
      cancelled = true;
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        window.cancelIdleCallback(idleHandle);
      } else {
        window.clearTimeout(idleHandle);
      }
    };
  }, [loading]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_ENDPOINTS}/api/player/players/data?includeInactive=true`
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
              totalBalls: Number(player.totalBalls) || 0,
              totalRunsGiven: Number(player.totalRunsGiven) || 0,
              totalBallsBowled: Number(player.totalBallsBowled) || 0,
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

  const runFactoryVenue = useMemo(() => {
    if (!venueAggregates.length) return null;
    const withRuns = venueAggregates.filter((v) => Number(v?.batting?.runs) > 0);
    if (!withRuns.length) return null;
    // Batting paradise: high runs per match with minimum sample size.
    return [...withRuns]
      .filter((v) => (Number(v?.matches) || 0) >= 3)
      .sort((a, b) => {
        const ar = toVenueRates(a);
        const br = toVenueRates(b);
        return br.runsPerMatch - ar.runsPerMatch;
      })[0] || null;
  }, [venueAggregates]);

  const wicketGraveyardVenue = useMemo(() => {
    if (!venueAggregates.length) return null;
    const withWkts = venueAggregates.filter((v) => Number(v?.bowling?.wickets) > 0);
    if (!withWkts.length) return null;
    // True bowling paradise index:
    // - more wickets per match is better
    // - fewer runs per wicket is better
    // - fewer runs per match is better
    // Also exclude the selected run-factory venue so one venue can't top both.
    const runFactoryKey = String(runFactoryVenue?.venue || '').trim().toLowerCase();
    const candidates = [...withWkts].filter((v) => {
      const key = String(v?.venue || '').trim().toLowerCase();
      return (Number(v?.matches) || 0) >= 3 && key !== runFactoryKey;
    });
    return (
      candidates.sort((a, b) => {
        const ar = toVenueRates(a);
        const br = toVenueRates(b);
        const aIndex =
          ar.wicketsPerMatch * 35 +
          220 / Math.max(ar.runsPerWicket, 1) +
          260 / Math.max(ar.runsPerMatch, 1);
        const bIndex =
          br.wicketsPerMatch * 35 +
          220 / Math.max(br.runsPerWicket, 1) +
          260 / Math.max(br.runsPerMatch, 1);
        return bIndex - aIndex;
      })[0] || null
    );
  }, [venueAggregates, runFactoryVenue]);

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

  const rateLeaders = useMemo(() => {
    const eligible = players.filter((p) => (p.matchesPlayed || 0) >= MIN_RANKING_MATCHES);

    const battingEligible = eligible
      .filter((p) => isBattingRole(p.role) && (p.totalBalls || 0) > 0)
      .map((p) => ({
        ...p,
        battingStrikeRate: Number(((p.totalRuns * 100) / p.totalBalls).toFixed(2)),
        battingAverageProxy: Number((p.totalRuns / Math.max(1, p.matchesPlayed)).toFixed(2)),
      }));

    const bowlingEligible = eligible
      .filter((p) => isBowlingRole(p.role) && (p.totalWickets || 0) > 0 && (p.totalBallsBowled || 0) > 0)
      .map((p) => ({
        ...p,
        bowlingStrikeRate: Number((p.totalBallsBowled / p.totalWickets).toFixed(2)),
        bowlingAverage: Number((p.totalRunsGiven / p.totalWickets).toFixed(2)),
      }));

    const highestBattingSr = [...battingEligible].sort(
      (a, b) => b.battingStrikeRate - a.battingStrikeRate
    )[0] || null;
    const highestBattingAvg = [...battingEligible].sort(
      (a, b) => b.battingAverageProxy - a.battingAverageProxy
    )[0] || null;

    // ICC-style bowling leaders: lower is better for SR and average.
    const bestBowlingSr = [...bowlingEligible].sort(
      (a, b) => a.bowlingStrikeRate - b.bowlingStrikeRate
    )[0] || null;
    const bestBowlingAvg = [...bowlingEligible].sort(
      (a, b) => a.bowlingAverage - b.bowlingAverage
    )[0] || null;

    return {
      highestBattingSr,
      highestBattingAvg,
      bestBowlingSr,
      bestBowlingAvg,
    };
  }, [players]);

  const categories = useMemo(
    () => [
      {
        id: 'batting',
        label: 'Batters',
        icon: <FaFireAlt aria-hidden />,
        count: allBatters.length,
      },
      {
        id: 'bowling',
        label: 'Bowlers',
        icon: <FaBowlingBall aria-hidden />,
        count: allBowlers.length,
      },
      {
        id: 'allrounder',
        label: 'All-rounders',
        icon: <FaBalanceScale aria-hidden />,
        count: allAllRounders.length,
      },
    ],
    [allBatters.length, allBowlers.length, allAllRounders.length]
  );

  return (
    <div className="rk-page">
      <header className="rk-hero">
        <div className="rk-hero-copy">
          <span className="rk-hero-kicker">
            <FaTrophy aria-hidden /> CPL season · live
          </span>
          <h1>Rankings</h1>
          <p className="rk-hero-sub">
            Cumulative performance across every match. Tap a category to dive in.
          </p>
        </div>
        {fetchedAt && (
          <span className="rk-hero-refresh">
            Refreshed{' '}
            {fetchedAt.toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        )}
      </header>

      {loading && <div className="rk-state">Crunching numbers…</div>}
      {error && !loading && <div className="rk-state rk-state--error">{error}</div>}

      {!loading && !error && (
        <>
          <section className="rk-spotlight" aria-label="League leaders">
            <div className="rk-spotlight-head">
              <FaCrown className="rk-spotlight-crown" aria-hidden />
              <div>
                <h2>League leaders</h2>
                <p>
                  Most runs, most wickets & MVP (MoM awards, with impact score as
                  fallback).
                </p>
              </div>
            </div>
            <div className="rk-spotlight-scroll">
              <SpotlightCard
                title="Most runs"
                subtitle="All players · cumulative"
                player={mostRunsPlayer}
                statLine={
                  mostRunsPlayer
                    ? `${formatMetricValue(mostRunsPlayer.totalRuns)} runs`
                    : ''
                }
                accentClass="rk-spot-card--runs"
                icon={<FaFireAlt aria-hidden />}
              />
              <SpotlightCard
                title="Most wickets"
                subtitle="All players · cumulative"
                player={mostWicketsPlayer}
                statLine={
                  mostWicketsPlayer
                    ? `${formatMetricValue(mostWicketsPlayer.totalWickets)} wkts`
                    : ''
                }
                accentClass="rk-spot-card--wkts"
                icon={<FaBowlingBall aria-hidden />}
              />
              <SpotlightCard
                title="MVP"
                subtitle={
                  mvpByMom
                    ? 'MoM awards · impact tie-break'
                    : 'Impact score: runs + 22 × wkts'
                }
                player={mvpPlayer}
                statLine={
                  mvpPlayer
                    ? mvpByMom
                      ? `${formatMetricValue(mvpPlayer.momCount)}× MoM · ${formatMetricValue(
                          mvpPlayer.totalRuns
                        )} R · ${formatMetricValue(mvpPlayer.totalWickets)} W`
                      : `${formatMetricValue(impactScore(mvpPlayer))} pts · ${formatMetricValue(
                          mvpPlayer.totalRuns
                        )} R · ${formatMetricValue(mvpPlayer.totalWickets)} W`
                    : ''
                }
                accentClass="rk-spot-card--mvp"
                icon={<FaChartLine aria-hidden />}
              />
              <SpotlightCard
                title="Highest Batting SR"
                subtitle={`Min ${MIN_RANKING_MATCHES} matches · Bat/WK/AR`}
                player={rateLeaders.highestBattingSr}
                statLine={
                  rateLeaders.highestBattingSr
                    ? `${formatMetricValue(rateLeaders.highestBattingSr.battingStrikeRate)} SR`
                    : ''
                }
                accentClass="rk-spot-card--bat-sr"
                icon={<FaFireAlt aria-hidden />}
              />
              <SpotlightCard
                title="Highest Batting Avg"
                subtitle={`Min ${MIN_RANKING_MATCHES} matches · Bat/WK/AR`}
                player={rateLeaders.highestBattingAvg}
                statLine={
                  rateLeaders.highestBattingAvg
                    ? `${formatMetricValue(rateLeaders.highestBattingAvg.battingAverageProxy)} avg`
                    : ''
                }
                accentClass="rk-spot-card--bat-avg"
                icon={<FaChartLine aria-hidden />}
              />
              <SpotlightCard
                title="Best Bowling SR"
                subtitle={`Min ${MIN_RANKING_MATCHES} matches · lower is better`}
                player={rateLeaders.bestBowlingSr}
                statLine={
                  rateLeaders.bestBowlingSr
                    ? `${formatMetricValue(rateLeaders.bestBowlingSr.bowlingStrikeRate)} balls/wkt`
                    : ''
                }
                accentClass="rk-spot-card--bowl-sr"
                icon={<FaBowlingBall aria-hidden />}
              />
              <SpotlightCard
                title="Best Bowling Avg"
                subtitle={`Min ${MIN_RANKING_MATCHES} matches · lower is better`}
                player={rateLeaders.bestBowlingAvg}
                statLine={
                  rateLeaders.bestBowlingAvg
                    ? `${formatMetricValue(rateLeaders.bestBowlingAvg.bowlingAverage)} runs/wkt`
                    : ''
                }
                accentClass="rk-spot-card--bowl-avg"
                icon={<FaBalanceScale aria-hidden />}
              />
              <VenueSpotlightCard
                title="Run Factory"
                subtitle="Highest-scoring ground"
                venue={runFactoryVenue}
                statLine={
                  runFactoryVenue
                    ? `${formatMetricValue(
                        Number((toVenueRates(runFactoryVenue).runsPerMatch || 0).toFixed(1))
                      )} runs/match`
                    : ''
                }
                metaLine={
                  runFactoryVenue
                    ? `${formatMetricValue(runFactoryVenue.matches || 0)} ${
                        (runFactoryVenue.matches || 0) === 1 ? 'match' : 'matches'
                      } · ${formatMetricValue(runFactoryVenue.batting?.runs || 0)} total runs`
                    : ''
                }
                accentClass="rk-spot-card--run-factory"
                icon={<FaFireAlt aria-hidden />}
              />
              <VenueSpotlightCard
                title="Bowler's Paradise"
                subtitle="Bowling-friendly index (not just total wickets)"
                venue={wicketGraveyardVenue}
                statLine={
                  wicketGraveyardVenue
                    ? `${formatMetricValue(
                        Number((toVenueRates(wicketGraveyardVenue).wicketsPerMatch || 0).toFixed(2))
                      )} wkts/match`
                    : ''
                }
                metaLine={
                  wicketGraveyardVenue
                    ? `${formatMetricValue(wicketGraveyardVenue.matches || 0)} ${
                        (wicketGraveyardVenue.matches || 0) === 1 ? 'match' : 'matches'
                      } · ${formatMetricValue(
                        Number((toVenueRates(wicketGraveyardVenue).runsPerWicket || 0).toFixed(2))
                      )} runs/wicket`
                    : ''
                }
                accentClass="rk-spot-card--paradise"
                icon={<FaBowlingBall aria-hidden />}
              />
            </div>
          </section>

          <nav className="rk-tabs" role="tablist" aria-label="Ranking categories">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.id}
                className={`rk-tab ${
                  activeCategory === cat.id ? 'is-active' : ''
                } rk-tab--${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="rk-tab-icon">{cat.icon}</span>
                <span className="rk-tab-text">
                  <span className="rk-tab-label">{cat.label}</span>
                  <span className="rk-tab-count">{cat.count}</span>
                </span>
              </button>
            ))}
          </nav>

          {activeCategory === 'batting' && (
            <RankingSection
              title="Top CPL Batters"
              icon={<FaFireAlt aria-hidden />}
              topData={topBatters}
              fullData={allBatters}
              metricLabel="Runs"
              metricAccessor={(p) => formatMetricValue(p.totalRuns)}
              emptyText="No batting records yet."
              variant="batting"
            />
          )}

          {activeCategory === 'bowling' && (
            <RankingSection
              title="Top CPL Bowlers"
              icon={<FaBowlingBall aria-hidden />}
              topData={topBowlers}
              fullData={allBowlers}
              metricLabel="Wickets"
              metricAccessor={(p) => formatMetricValue(p.totalWickets)}
              emptyText="No bowling records yet."
              variant="bowling"
            />
          )}

          {activeCategory === 'allrounder' && (
            <RankingSection
              title="Top CPL All-Rounders"
              icon={<FaBalanceScale aria-hidden />}
              topData={topAllRounders}
              fullData={allAllRounders}
              metricLabel="Runs · Wkts"
              metricAccessor={(p) =>
                `${formatMetricValue(p.totalRuns)} · ${formatMetricValue(p.totalWickets)}`
              }
              emptyText="Need players contributing with both bat and ball."
              variant="allrounder"
            />
          )}
        </>
      )}
    </div>
  );
};

export default TopRankingsPage;
