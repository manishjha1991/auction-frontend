import React, { useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaSearch, FaUsers } from 'react-icons/fa';
import { API_ENDPOINTS } from '../const';
import { resolvePlayerImageUrl } from '../utils/resolvePlayerImageUrl';
import '../css/PlayerTeamHistoryPage.css';

const formatTournamentLabel = (key) => {
  const match = String(key || '').match(/^cpl_(\d+)$/i);
  return match ? `CPL ${match[1]}` : key || 'Current';
};

const PlayerAvatar = ({ player }) => {
  const src = resolvePlayerImageUrl(player.profilePicture);
  if (src) {
    return <img className="pth-player-avatar" src={src} alt="" />;
  }
  return (
    <span className="pth-player-avatar pth-player-avatar--fallback">
      {(player.playerName || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
};

const StatPill = ({ label, value }) => (
  <span className="pth-stat-pill">
    <strong>{value || 0}</strong>
    {label}
  </span>
);

const PlayerTeamHistoryPage = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [openTeams, setOpenTeams] = useState({});

  useEffect(() => {
    let mounted = true;
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_ENDPOINTS}/api/player-stats/team-tournament-history`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load team history');
        if (mounted) setPlayers(Array.isArray(data.players) ? data.players : []);
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load team history');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadHistory();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredPlayers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return players;
    return players.filter((player) => {
      const playerHit = String(player.playerName || '').toLowerCase().includes(needle);
      const teamHit = (player.teams || []).some((team) =>
        [team.teamName, team.teamFullName].some((value) =>
          String(value || '').toLowerCase().includes(needle)
        )
      );
      return playerHit || teamHit;
    });
  }, [players, query]);

  const toggleTeam = (playerId, teamName) => {
    const key = `${playerId}:${teamName}`;
    setOpenTeams((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="pth-page">
      <div className="pth-header">
        <div>
          <span className="pth-eyebrow">CPL archive</span>
          <h1>Player team history</h1>
        </div>
        <div className="pth-search">
          <FaSearch aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search player or team"
            aria-label="Search player or team"
          />
        </div>
      </div>

      {loading && <div className="pth-state">Loading history...</div>}
      {!loading && error && <div className="pth-state pth-state--error">{error}</div>}
      {!loading && !error && filteredPlayers.length === 0 && (
        <div className="pth-state">
          <FaUsers aria-hidden />
          <span>No team history found. Run the backfill script once.</span>
        </div>
      )}

      {!loading && !error && filteredPlayers.length > 0 && (
        <div className="pth-grid">
          {filteredPlayers.map((player) => (
            <section className="pth-player-card" key={player.playerId}>
              <div className="pth-player-head">
                <PlayerAvatar player={player} />
                <div className="pth-player-title">
                  <h2>{player.playerName}</h2>
                  <span>{player.playerRole || 'Player'}</span>
                </div>
                <div className="pth-player-total">
                  <StatPill label="Runs" value={player.totalRuns} />
                  <StatPill label="Wkts" value={player.totalWickets} />
                  <StatPill label="MoM" value={player.totalMom} />
                </div>
              </div>

              <div className="pth-team-list">
                {(player.teams || []).map((team) => {
                  const teamKey = `${player.playerId}:${team.teamName}`;
                  const isOpen = !!openTeams[teamKey];
                  return (
                    <div className="pth-team-block" key={teamKey}>
                      <button
                        type="button"
                        className="pth-team-row"
                        onClick={() => toggleTeam(player.playerId, team.teamName)}
                      >
                        <span className="pth-team-toggle" aria-hidden>
                          {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                        <span className="pth-team-name">
                          <strong>{team.teamName}</strong>
                          {team.teamFullName && team.teamFullName !== team.teamName ? (
                            <small>{team.teamFullName}</small>
                          ) : null}
                        </span>
                        <span className="pth-team-totals">
                          <StatPill label="Runs" value={team.totalRuns} />
                          <StatPill label="Wkts" value={team.totalWickets} />
                          <StatPill label="MoM" value={team.totalMom} />
                        </span>
                      </button>

                      {isOpen && (
                        <div className="pth-tournament-table">
                          <div className="pth-tournament-head">
                            <span>Tournament</span>
                            <span>Runs</span>
                            <span>Wkts</span>
                            <span>MoM</span>
                            <span>Mat</span>
                          </div>
                          {(team.tournaments || []).map((row) => (
                            <div
                              className="pth-tournament-row"
                              key={`${teamKey}:${row.tournamentKey}:${row.tournamentId || ''}`}
                            >
                              <span>{formatTournamentLabel(row.tournamentKey)}</span>
                              <strong>{row.totalRuns || 0}</strong>
                              <strong>{row.totalWickets || 0}</strong>
                              <strong>{row.totalMom || 0}</strong>
                              <strong>{row.matches || 0}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerTeamHistoryPage;
