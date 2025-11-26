import React, { useEffect, useMemo, useState } from 'react';
import '../css/TournamentPoster.css';
import { API_ENDPOINTS } from '../const';

const FALLBACK_TEAMS = [
  { teamName: 'Royal Challengers', abbreviation: 'RC' },
  { teamName: 'Mumbai Mavericks', abbreviation: 'MM' },
  { teamName: 'Sun Kings', abbreviation: 'SK' },
  { teamName: 'Delhi Dominators', abbreviation: 'DD' },
  { teamName: 'Hyderabad Heat', abbreviation: 'HH' },
  { teamName: 'Punjab Pulse', abbreviation: 'PP' },
  { teamName: 'Lucknow Lynx', abbreviation: 'LL' },
  { teamName: 'Gujarat Guardians', abbreviation: 'GG' },
  { teamName: 'Jaipur Hurricanes', abbreviation: 'JH' },
  { teamName: 'Chennai Chargers', abbreviation: 'CC' },
];

const getLabel = (team) => team?.abbreviation || team?.teamShortName || team?.shortName || '';
const getDisplayName = (team) => team?.teamName || team?.name || '—';

const TournamentPoster = ({ compact = false, asLoader = false }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTeams = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_ENDPOINTS}/api/users/teams`);
        const data = await res.json();
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setTeams(data);
        } else if (Array.isArray(data?.teams)) {
          setTeams(data.teams);
        } else {
          setTeams(FALLBACK_TEAMS);
        }
        setError(null);
      } catch (err) {
        console.error('Poster teams fetch failed', err);
        if (!isMounted) return;
        setError('Unable to sync live teams');
        setTeams(FALLBACK_TEAMS);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTeams();
    return () => {
      isMounted = false;
    };
  }, []);

  const [leftTeams, rightTeams] = useMemo(() => {
    const sorted = [...(teams.length ? teams : FALLBACK_TEAMS)].sort((a, b) =>
      getDisplayName(a).localeCompare(getDisplayName(b)),
    );
    const mid = Math.ceil(sorted.length / 2);
    return [sorted.slice(0, mid), sorted.slice(mid)];
  }, [teams]);

  const renderColumn = (list, offset = 0) =>
    list.map((team, idx) => (
      <div className="poster-team" key={`${getDisplayName(team)}-${idx}`}>
        <span className="poster-team-rank">{idx + 1 + offset}</span>
        <span className="poster-team-name">{getDisplayName(team)}</span>
        {getLabel(team) && <span className="poster-team-badge">{getLabel(team)}</span>}
      </div>
    ));

  return (
    <section
      className={`poster-shell${compact ? ' poster--compact' : ''}${asLoader || loading ? ' poster--loader' : ''}`}
    >
      <div className="poster-header">
        <div>
          <p className="poster-overline">CPL 2025 • Ownership Grid</p>
          <h2 className="poster-title">20 Teams. One Trophy.</h2>
          <p className="poster-subtitle">Live auction feed · Powered by Admin Control</p>
        </div>
        <div className={`poster-pill${error ? ' warning' : ''}`}>
          {error ? 'Offline mode' : loading ? 'Syncing…' : 'Live'}
        </div>
      </div>

      <div className="poster-body">
        <div className="poster-column">{renderColumn(leftTeams)}</div>
        <div className="poster-centerpiece">
          <img src="/images/icc_champions_trophy.jpg" alt="CPL Championship Trophy" />
          <h3>CPL TITLE</h3>
          <p>India & Sri Lanka · Season 14</p>
        </div>
        <div className="poster-column">{renderColumn(rightTeams, leftTeams.length)}</div>
      </div>

      {(asLoader || loading) && (
        <p className="poster-loader-text">Fetching live squads & syncing auction room…</p>
      )}
    </section>
  );
};

export default TournamentPoster;

