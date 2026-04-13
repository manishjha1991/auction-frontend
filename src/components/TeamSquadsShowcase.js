import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaTrophy, FaCrown } from 'react-icons/fa';
import { GiCricketBat, GiBowlingStrike, GiGloves } from 'react-icons/gi';
import { API_ENDPOINTS } from '../const';
import PlayerAvatar from './PlayerAvatar';
import PlayerPopup from './PlayerPopup';
import '../css/TeamSquadsShowcase.css';

const normalizeTeamName = (name) => (name || '').trim().toLowerCase();

function hashTheme(teamName) {
  const palettes = [
    { top: '#0f2744', bottom: '#eab308' },
    { top: '#1e40af', bottom: '#dc2626' },
    { top: '#4c1d95', bottom: '#fbbf24' },
    { top: '#0d9488', bottom: '#111827' },
    { top: '#b45309', bottom: '#1c1917' },
    { top: '#be123c', bottom: '#0c4a6e' },
    { top: '#166534', bottom: '#fef08a' },
    { top: '#7c2d12', bottom: '#fde68a' },
  ];
  let h = 0;
  const s = teamName || '';
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return palettes[Math.abs(h) % palettes.length];
}

function teamImageUrl(teamImage) {
  if (!teamImage) return null;
  const t = String(teamImage).trim();
  if (!t) return null;
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  const path = t.replace(/^\/+/, '');
  return `${API_ENDPOINTS}/${path}`;
}

function groupRoster(players) {
  const batters = [];
  const allrounders = [];
  const bowlers = [];
  (players || []).forEach((p) => {
    const role = p.role || '';
    if (role === 'Bowler') bowlers.push(p);
    else if (role === 'Allrounder') allrounders.push(p);
    else batters.push(p);
  });
  const byName = (a, b) => (a.name || '').localeCompare(b.name || '');
  batters.sort(byName);
  allrounders.sort(byName);
  bowlers.sort(byName);
  return { batters, allrounders, bowlers };
}

export default function TeamSquadsShowcase() {
  const [teams, setTeams] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [worldCupWinsByTeam, setWorldCupWinsByTeam] = useState({});
  const [worldCupYearsByTeam, setWorldCupYearsByTeam] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterGroups, setRosterGroups] = useState(null);
  const [squadPlayerPopup, setSquadPlayerPopup] = useState(null);
  const [squadCaptain, setSquadCaptain] = useState(null);
  const [heroLogoFailed, setHeroLogoFailed] = useState(false);
  const [viewerId, setViewerId] = useState(null);
  const [viewerIsAdmin, setViewerIsAdmin] = useState(false);
  const [savingCaptain, setSavingCaptain] = useState(false);

  const teamStats = useMemo(() => {
    const map = new Map();
    teams.forEach((t) => {
      const key = normalizeTeamName(t.teamName);
      const wins = (matchResults || []).filter((m) => {
        if (!m.winner || m.winner === 'tie' || m.winner === 'no_result') return false;
        const winning = m.winner === 'team1' ? m.team1 : m.team2;
        return normalizeTeamName(winning) === key;
      });
      const years = [
        ...new Set(
          wins
            .map((m) => {
              const d = m.matchDate ? new Date(m.matchDate) : null;
              return d && !Number.isNaN(d.getTime()) ? d.getFullYear() : null;
            })
            .filter(Boolean)
        ),
      ].sort((a, b) => a - b);
      map.set(t.teamName, {
        cplWins: wins.length,
        cplYears: years,
        wcWins: worldCupWinsByTeam[key] || 0,
        wcYears: worldCupYearsByTeam[key] || [],
      });
    });
    return map;
  }, [teams, matchResults, worldCupWinsByTeam, worldCupYearsByTeam]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamsRes, matchRes] = await Promise.all([
        fetch(`${API_ENDPOINTS}/api/users/teams`),
        fetch(`${API_ENDPOINTS}/api/match-results/public`),
      ]);
      if (!teamsRes.ok) throw new Error('Failed to load teams');
      if (!matchRes.ok) throw new Error('Failed to load match results');
      const teamsJson = await teamsRes.json();
      const matchJson = await matchRes.json();
      const teamsList = teamsJson.teams || teamsJson || [];
      const matches = matchJson.matchResults || matchJson || [];
      setTeams(Array.isArray(teamsList) ? teamsList : []);
      setMatchResults(Array.isArray(matches) ? matches : []);

      const wcCount = {};
      const wcYears = {};
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user?.id || user?._id;
        if (userId) {
          const tRes = await fetch(
            `${API_ENDPOINTS}/api/tournaments?status=completed&limit=100`,
            { headers: { 'user-id': userId } }
          );
          if (tRes.ok) {
            const tJson = await tRes.json();
            const list = tJson.tournaments || tJson || [];
            list
              .filter(
                (x) =>
                  x.name &&
                  String(x.name).startsWith('World Cup') &&
                  x.status === 'completed' &&
                  x.winner?.teamName
              )
              .forEach((x) => {
                const k = normalizeTeamName(x.winner.teamName);
                wcCount[k] = (wcCount[k] || 0) + 1;
                const y = x.endDate
                  ? new Date(x.endDate).getFullYear()
                  : x.startDate
                    ? new Date(x.startDate).getFullYear()
                    : null;
                if (y && !Number.isNaN(y)) {
                  if (!wcYears[k]) wcYears[k] = [];
                  wcYears[k].push(y);
                }
              });
            Object.keys(wcYears).forEach((k) => {
              wcYears[k] = [...new Set(wcYears[k])].sort((a, b) => a - b);
            });
          }
        }
      } catch {
        /* optional */
      }
      setWorldCupWinsByTeam(wcCount);
      setWorldCupYearsByTeam(wcYears);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setViewerId(u?.id || u?._id || null);
      setViewerIsAdmin(u?.isAdmin === true);
    } catch {
      setViewerId(null);
      setViewerIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    setHeroLogoFailed(false);
  }, [selectedTeam?._id]);

  const openTeam = async (team) => {
    setSelectedTeam(team);
    setRosterGroups(null);
    setSquadCaptain(null);
    setRosterLoading(true);
    try {
      const id = team._id;
      if (!id) throw new Error('Missing team id');
      const r = await fetch(`${API_ENDPOINTS}/api/users/${id}/roster`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || 'Roster failed');
      setRosterGroups(groupRoster(j.players || []));
      setSquadCaptain(j.captain || null);
    } catch (e) {
      setRosterGroups({ batters: [], allrounders: [], bowlers: [], _err: e.message });
    } finally {
      setRosterLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedTeam(null);
    setRosterGroups(null);
    setSquadCaptain(null);
  };

  const canManageCaptain =
    selectedTeam &&
    viewerId &&
    (String(viewerId) === String(selectedTeam._id) || viewerIsAdmin);

  const persistCaptain = async (playerId) => {
    if (!selectedTeam?._id || !viewerId || savingCaptain) return;
    setSavingCaptain(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/users/${selectedTeam._id}/captain`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: playerId || null, requesterUserId: viewerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not update captain');
      setSquadCaptain(data.captain || null);
    } catch (e) {
      alert(e.message || 'Could not update captain');
    } finally {
      setSavingCaptain(false);
    }
  };

  if (loading) {
    return (
      <div className="tss-page">
        <div className="tss-loading">Loading teams…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="tss-page">
        <div className="tss-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="tss-page">
      <header className="tss-header">
        <h1 className="tss-title">Team squads</h1>
        <p className="tss-sub">
          Hover a card for CPL &amp; World Cup wins. Tap a team to see batters, all-rounders, and bowlers.
        </p>
      </header>

      <div className="tss-grid">
        {teams.map((team) => {
          const theme = hashTheme(team.teamName);
          const stats = teamStats.get(team.teamName) || {
            cplWins: 0,
            cplYears: [],
            wcWins: 0,
            wcYears: [],
          };
          const logo = teamImageUrl(team.teamImage);
          const abbr =
            team.abbreviation ||
            (team.teamName || '')
              .split(/\s+/)
              .map((w) => w[0])
              .join('')
              .slice(0, 4)
              .toUpperCase();

          return (
            <button
              key={team._id || team.teamName}
              type="button"
              className="tss-card"
              onClick={() => openTeam(team)}
            >
              <div
                className="tss-card-visual"
                style={{
                  '--tss-top': theme.top,
                  '--tss-bottom': theme.bottom,
                }}
              >
                <div className="tss-card-top">
                  {logo ? (
                    <img src={logo} alt="" className="tss-card-logo" />
                  ) : (
                    <span className="tss-card-logo-fallback">{abbr}</span>
                  )}
                </div>
                <div className="tss-card-bottom">
                  <span className="tss-card-name">{team.teamName}</span>
                  <span className="tss-card-chips">
                    CPL {stats.cplWins} · WC {stats.wcWins}
                  </span>
                </div>
                <div className="tss-card-hover" aria-hidden>
                  <FaTrophy className="tss-card-trophy" />
                  <div className="tss-card-hover-stats">
                    <span>CPL wins: {stats.cplWins}</span>
                    <span>World Cup: {stats.wcWins}</span>
                    {stats.cplYears.length > 0 && (
                      <span className="tss-card-years">
                        {stats.cplYears.join(' · ')}
                      </span>
                    )}
                    {stats.wcYears.length > 0 && (
                      <span className="tss-card-years wc">
                        WC: {stats.wcYears.join(' · ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedTeam && (
        <div className="tss-modal-overlay" onClick={closeModal} role="presentation">
          <div
            className="tss-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tss-modal-title"
          >
            <button type="button" className="tss-modal-close" onClick={closeModal}>
              ×
            </button>
            {(() => {
              const st = teamStats.get(selectedTeam.teamName);
              const logo = teamImageUrl(selectedTeam.teamImage);
              const heroAbbr =
                selectedTeam.abbreviation ||
                (selectedTeam.teamName || '')
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 4)
                  .toUpperCase();
              return (
                <div className="tss-modal-hero">
                  <div className="tss-modal-hero-bg" aria-hidden />
                  <div className="tss-modal-hero-inner">
                    <div className="tss-modal-hero-logo-wrap">
                      {logo && !heroLogoFailed ? (
                        <img
                          src={logo}
                          alt=""
                          className="tss-modal-hero-logo"
                          onError={() => setHeroLogoFailed(true)}
                        />
                      ) : (
                        <span className="tss-modal-hero-logo-fallback">{heroAbbr}</span>
                      )}
                    </div>
                    <div className="tss-modal-hero-copy">
                      <h2 id="tss-modal-title">{selectedTeam.teamName}</h2>
                      <div className="tss-modal-trophies">
                        <FaTrophy />
                        <span>
                          CPL wins: {st?.cplWins ?? 0}
                          {st?.cplYears?.length > 0 && (
                            <span className="tss-modal-years">
                              {' '}
                              ({st.cplYears.join(' · ')})
                            </span>
                          )}
                        </span>
                        <span className="tss-modal-wc">
                          World Cup: {st?.wcWins ?? 0}
                          {st?.wcYears?.length > 0 && (
                            <span className="tss-modal-years">
                              {' '}
                              ({st.wcYears.join(' · ')})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="tss-modal-body">
              <div className="tss-squad-details">
                <div className="tss-detail-row">
                  <span className="tss-detail-label">Captain</span>
                  <span className="tss-detail-sep" aria-hidden>
                    –
                  </span>
                  <span className="tss-detail-value">
                    {squadCaptain?.name || '—'}
                  </span>
                </div>
                {canManageCaptain && squadCaptain && (
                  <button
                    type="button"
                    className="tss-clear-captain"
                    disabled={savingCaptain}
                    onClick={() => persistCaptain(null)}
                  >
                    Clear captain
                  </button>
                )}
                {canManageCaptain && !squadCaptain && (
                  <p className="tss-captain-hint">
                    Tap the crown on a player below to set captain.
                  </p>
                )}
              </div>
              {rosterLoading && <div className="tss-roster-loading">Loading squad…</div>}
              {!rosterLoading && rosterGroups?._err && (
                <div className="tss-roster-err">{rosterGroups._err}</div>
              )}
              {!rosterLoading && rosterGroups && !rosterGroups._err && (
                <>
                  <RosterSection
                    title="Batters"
                    players={rosterGroups.batters}
                    captainId={squadCaptain?.id}
                    canSetCaptain={canManageCaptain}
                    savingCaptain={savingCaptain}
                    onMakeCaptain={(p) => persistCaptain(p.id)}
                    onPlayerClick={(p) =>
                      setSquadPlayerPopup({ id: p.id, _id: p.id, name: p.name })
                    }
                  />
                  <RosterSection
                    title="All-rounders"
                    players={rosterGroups.allrounders}
                    captainId={squadCaptain?.id}
                    canSetCaptain={canManageCaptain}
                    savingCaptain={savingCaptain}
                    onMakeCaptain={(p) => persistCaptain(p.id)}
                    onPlayerClick={(p) =>
                      setSquadPlayerPopup({ id: p.id, _id: p.id, name: p.name })
                    }
                  />
                  <RosterSection
                    title="Bowlers"
                    players={rosterGroups.bowlers}
                    captainId={squadCaptain?.id}
                    canSetCaptain={canManageCaptain}
                    savingCaptain={savingCaptain}
                    onMakeCaptain={(p) => persistCaptain(p.id)}
                    onPlayerClick={(p) =>
                      setSquadPlayerPopup({ id: p.id, _id: p.id, name: p.name })
                    }
                  />
                  {rosterGroups.batters.length === 0 &&
                    rosterGroups.allrounders.length === 0 &&
                    rosterGroups.bowlers.length === 0 && (
                      <p className="tss-roster-empty">No players in this squad yet.</p>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {squadPlayerPopup && (
        <PlayerPopup
          player={squadPlayerPopup}
          onClose={() => setSquadPlayerPopup(null)}
          hideAuctionActions
        />
      )}
    </div>
  );
}

function RosterSection({
  title,
  players,
  onPlayerClick,
  captainId,
  canSetCaptain,
  onMakeCaptain,
  savingCaptain,
}) {
  if (!players || players.length === 0) return null;
  return (
    <section className="tss-section">
      <h3 className="tss-section-title">{title}</h3>
      <div className="tss-player-grid">
        {players.map((p) => {
          const isCaptain = captainId && String(captainId) === String(p.id);
          return (
          <div
            key={p.id}
            className={`tss-player-card${isCaptain ? ' tss-player-card--captain' : ''}`}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onPlayerClick?.(p);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPlayerClick?.(p);
              }
            }}
          >
            <div className="tss-player-photo">
              <PlayerAvatar
                profilePicture={p.profilePicture}
                name={p.name}
                size={72}
                className="tss-player-avatar"
              />
              <span className="tss-player-role-badge" title={p.role}>
                <RoleBadge role={p.role} />
              </span>
              {canSetCaptain && (
                <button
                  type="button"
                  className={`tss-captain-btn${isCaptain ? ' tss-captain-btn--active' : ''}`}
                  title={isCaptain ? 'Captain' : 'Set as captain'}
                  disabled={savingCaptain}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMakeCaptain?.(p);
                  }}
                >
                  <FaCrown />
                </button>
              )}
              {!canSetCaptain && isCaptain && (
                <span className="tss-captain-badge" title="Captain" aria-label="Captain">
                  <FaCrown />
                </span>
              )}
            </div>
            <div className="tss-player-meta">
              <div className="tss-player-name">{(p.name || '').toUpperCase()}</div>
              <div className="tss-player-role">{p.role || 'Player'}</div>
              {p.type && <div className="tss-player-type">{p.type}</div>}
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
}


function RoleBadge({ role }) {
  const cls = 'tss-role-ico';
  switch (role) {
    case 'Bowler':
      return <GiBowlingStrike className={cls} aria-hidden />;
    case 'Allrounder':
      return <GiCricketBat className={cls} aria-hidden />;
    case 'WicketKeeper':
      return <GiGloves className={cls} aria-hidden />;
    default:
      return <GiCricketBat className={cls} aria-hidden />;
  }
}
