import React, { useState, useEffect, useMemo } from 'react';
import { FaBowlingBall, FaSearch, FaPen, FaTimes, FaTrophy } from 'react-icons/fa';
import { MdSportsCricket } from 'react-icons/md';
import { GiGloves } from 'react-icons/gi';
import '../css/PlayerStatsList.css';
import { API_ENDPOINTS } from '../const';

const roleMeta = (role) => {
  const r = String(role || '').toLowerCase();
  if (r.includes('keeper')) {
    return { label: 'Keeper', tone: 'keeper', Icon: GiGloves };
  }
  if (r.includes('bowl') && !r.includes('all')) {
    return { label: 'Bowler', tone: 'bowler', Icon: FaBowlingBall };
  }
  if (r.includes('all')) {
    return { label: 'All-rounder', tone: 'allrounder', Icon: MdSportsCricket };
  }
  return { label: 'Batter', tone: 'batter', Icon: MdSportsCricket };
};

const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

const PlayerStatsList = () => {
  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  });

  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState('batting');
  const [players, setPlayers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [allTeams, setAllTeams] = useState([]);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [worldCupMode, setWorldCupMode] = useState(false);
  const [runningTournaments, setRunningTournaments] = useState([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [existingEntries, setExistingEntries] = useState([]);
  const [existingEntriesLoading, setExistingEntriesLoading] = useState(false);
  const [selectedExistingEntryId, setSelectedExistingEntryId] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    battingRuns: '',
    battingBalls: '',
    bowlingRunsGiven: '',
    bowlingBallsBowled: '',
    wicketsTaken: '',
    opponentUserId: '',
    isMom: false,
    isPlayoffScore: false,
    wcStage: '',
    tournamentId: '',
    saveMode: 'update',
  });

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const userId = currentUser?.id;
        if (!userId) {
          console.error('User ID not found in localStorage');
          return;
        }
        const response = await fetch(
          `${API_ENDPOINTS}/api/player-stats/list?userId=${userId}`,
          { method: 'GET' }
        );

        if (response.ok) {
          const data = await response.json();
          const formattedPlayers = data.players.map((player, index) => ({
            id: player._id || `player-${index}`,
            name: player.name || 'Unknown Player',
            type: player.type,
            role: player.role,
            matchPerformance: {
              batting: player.matchPerformance?.batting || [],
              bowling: player.matchPerformance?.bowling || [],
            },
            totalStats: {
              batting: { runs: player.totalStats?.batting?.runs || 0 },
              bowling: { wickets: player.totalStats?.bowling?.wickets || 0 },
            },
          }));
          setPlayers(formattedPlayers);
        } else {
          console.error('Failed to fetch player stats');
        }
      } catch (error) {
        console.error('Error fetching player stats:', error);
      }
    };

    fetchPlayers();
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS}/api/users/teams`);
        if (response.ok) {
          const data = await response.json();
          const teamsArray = Array.isArray(data)
            ? data
            : Array.isArray(data?.teams)
            ? data.teams
            : [];
          setAllTeams(teamsArray);
        } else {
          console.error('Failed to fetch teams');
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };

    fetchTeams();
  }, []);

  useEffect(() => {
    const fetchSettingsAndTournaments = async () => {
      try {
        setTournamentsLoading(true);
        const [settingsResponse, tournamentsResponse] = await Promise.all([
          fetch(`${API_ENDPOINTS}/api/settings`),
          fetch(`${API_ENDPOINTS}/api/tournaments?limit=100`, {
            headers: currentUser?.id ? { 'user-id': currentUser.id } : {},
          }),
        ]);

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          const wcEnabled =
            settingsData?.worldCupMode === true || settingsData?.worldCupMode === 'true';
          setWorldCupMode(wcEnabled);
          if (wcEnabled) {
            setFormData((prev) => ({ ...prev, isPlayoffScore: false }));
          }
        }

        if (tournamentsResponse.ok) {
          const data = await tournamentsResponse.json();
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.tournaments)
            ? data.tournaments
            : [];
          const now = Date.now();
          const runningOnly = list.filter((tn) => {
            if (!tn) return false;
            if (tn.status === 'running') return true;
            const start = tn.startDate ? new Date(tn.startDate).getTime() : null;
            const end = tn.endDate ? new Date(tn.endDate).getTime() : null;
            return !!(start && end && start <= now && now <= end);
          });
          setRunningTournaments(runningOnly);
        }
      } catch (error) {
        console.error('Error fetching settings/tournaments:', error);
      } finally {
        setTournamentsLoading(false);
      }
    };

    fetchSettingsAndTournaments();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!worldCupMode) {
      setFormData((prev) => ({
        ...prev,
        wcStage: '',
        tournamentId: '',
      }));
    }
  }, [worldCupMode]);

  const openModal = (playerName) => {
    setExpandedPlayer(playerName);
    setActiveTab('batting');
    setIsEditing(false);
    setSubmitMessage('');
    setSelectedExistingEntryId('');
    setExistingEntries([]);
    setFormData({
      battingRuns: '',
      battingBalls: '',
      bowlingRunsGiven: '',
      bowlingBallsBowled: '',
      wicketsTaken: '',
      opponentUserId: '',
      isMom: false,
      isPlayoffScore: false,
      wcStage: '',
      tournamentId: '',
      saveMode: 'update',
    });
  };

  const closeModal = () => {
    setExpandedPlayer(null);
    setIsEditing(false);
  };

  const toggleTab = (tab) => {
    setActiveTab(tab);
  };

  const selectedPlayer = players.find((player) => player.name === expandedPlayer);

  useEffect(() => {
    const fetchExistingEntries = async () => {
      if (!selectedPlayer?.id) return;
      try {
        setExistingEntriesLoading(true);
        const res = await fetch(`${API_ENDPOINTS}/api/player-stats/stats/${selectedPlayer.id}`);
        if (!res.ok) {
          setExistingEntries([]);
          return;
        }
        const data = await res.json();
        const entries = Array.isArray(data?.stats) ? data.stats : [];
        entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setExistingEntries(entries);
      } catch (error) {
        console.error('Error fetching existing stats entries:', error);
        setExistingEntries([]);
      } finally {
        setExistingEntriesLoading(false);
      }
    };

    fetchExistingEntries();
  }, [selectedPlayer?.id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'saveMode' && value === 'create') {
      setSelectedExistingEntryId('');
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    }, 10);
  };

  const handleExistingEntrySelect = (entryId) => {
    setSelectedExistingEntryId(entryId);
    const entry = existingEntries.find((item) => String(item.id) === String(entryId));
    if (!entry) return;

    setFormData((prev) => ({
      ...prev,
      battingRuns: entry.battingStats?.runs ?? '',
      battingBalls: entry.battingStats?.balls ?? '',
      bowlingRunsGiven: entry.bowlingStats?.runsGiven ?? '',
      bowlingBallsBowled: entry.bowlingStats?.ballsBowled ?? '',
      wicketsTaken: entry.bowlingStats?.wickets ?? '',
      opponentUserId: entry.opponentUserId ? String(entry.opponentUserId) : '',
      isMom: !!entry.isMom,
      isPlayoffScore: !!entry.metadata?.isPlayoffScore,
      wcStage: entry.metadata?.isWcScore ? entry.metadata?.wcStage || '' : '',
      tournamentId: entry.metadata?.isWcScore ? (entry.tournamentId ? String(entry.tournamentId) : '') : '',
      saveMode: 'update',
    }));
    setSubmitMessage(`Loaded existing entry from ${new Date(entry.createdAt).toLocaleString('en-IN')}`);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = currentUser?.id;
      if (!userId) {
        setSubmitMessage('User not found!');
        return;
      }

      const confirmMessage = [
        `Save stats for ${selectedPlayer?.name || 'this player'}?`,
        '',
        `Mode: ${formData.saveMode === 'create' ? 'Create new entry' : 'Update existing entry'}`,
        formData.saveMode === 'update' && selectedExistingEntryId ? `Editing entry: ${selectedExistingEntryId}` : null,
        `Opponent selected: ${formData.opponentUserId ? 'Yes' : 'No'}`,
        worldCupMode && formData.wcStage ? `WC Stage: ${formData.wcStage}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) {
        setSubmitMessage('Save cancelled.');
        return;
      }

      const payload = {
        playerId: selectedPlayer.id,
        userId,
        opponentUserId: formData.opponentUserId,
        battingStats: {
          runs: Number(formData.battingRuns),
          balls: Number(formData.battingBalls),
        },
        bowlingStats: {
          runsGiven: Number(formData.bowlingRunsGiven),
          ballsBowled: Number(formData.bowlingBallsBowled),
        },
        wicketsTaken: Number(formData.wicketsTaken),
        isMom: formData.isMom,
        isPlayoffScore: worldCupMode ? false : formData.isPlayoffScore,
        isWcScore: !!formData.wcStage,
        wcStage: formData.wcStage || null,
        tournamentId: formData.wcStage ? formData.tournamentId : null,
        forceCreate: formData.saveMode === 'create',
      };

      if (formData.wcStage && !formData.tournamentId) {
        setSubmitMessage('Please select a tournament for World Cup stage entry.');
        return;
      }

      const res = await fetch(`${API_ENDPOINTS}/api/player-stats/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await res.json();
        setSubmitMessage('Stats saved successfully!');
        setSuccessMessage(`Stats saved for ${selectedPlayer.name}`);
        setSelectedExistingEntryId('');
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        setSubmitMessage('Error saving stats.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitMessage('Error submitting form.');
    }
  };

  const filteredPlayers = useMemo(
    () =>
      players.filter((player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [players, searchTerm]
  );

  const totals = useMemo(() => {
    let runs = 0;
    let wkts = 0;
    players.forEach((p) => {
      runs += Number(p.totalStats?.batting?.runs) || 0;
      wkts += Number(p.totalStats?.bowling?.wickets) || 0;
    });
    return { runs, wkts, count: players.length };
  }, [players]);

  return (
    <div className="psl-page">
      <header className="psl-header">
        <div className="psl-header-title">
          <span className="psl-kicker">Squad performance</span>
          <h1>Player Stats</h1>
          <p className="psl-subtitle">
            Tap any card to review match-by-match splits or log fresh figures.
          </p>
        </div>
        <div className="psl-header-stats" aria-label="Squad totals">
          <div className="psl-stat">
            <span className="psl-stat-label">Players</span>
            <span className="psl-stat-value">{totals.count}</span>
          </div>
          <div className="psl-stat psl-stat--runs">
            <span className="psl-stat-label">Runs</span>
            <span className="psl-stat-value">{totals.runs.toLocaleString('en-IN')}</span>
          </div>
          <div className="psl-stat psl-stat--wkts">
            <span className="psl-stat-label">Wickets</span>
            <span className="psl-stat-value">{totals.wkts}</span>
          </div>
        </div>
      </header>

      <div className="psl-search">
        <FaSearch aria-hidden />
        <input
          type="text"
          className="psl-search-input"
          placeholder="Search player by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="psl-search-clear"
            aria-label="Clear search"
            onClick={() => setSearchTerm('')}
          >
            <FaTimes />
          </button>
        )}
      </div>

      {filteredPlayers.length === 0 ? (
        <div className="psl-empty">
          {players.length === 0
            ? 'No players yet. Once your squad is picked they will show up here.'
            : `No players match “${searchTerm}”.`}
        </div>
      ) : (
        <div className="psl-grid">
          {filteredPlayers.map((player) => {
            const meta = roleMeta(player.role);
            const RoleIcon = meta.Icon;
            return (
              <button
                type="button"
                className={`psl-card psl-card--${meta.tone}`}
                key={player.id || player.name}
                onClick={() => openModal(player.name)}
              >
                <div className="psl-card-top">
                  <span className="psl-avatar" aria-hidden>
                    {initialsOf(player.name)}
                  </span>
                  <div className="psl-card-id">
                    <h3 className="psl-card-name">{player.name}</h3>
                    <span className={`psl-role-pill psl-role-pill--${meta.tone}`}>
                      <RoleIcon aria-hidden /> {meta.label}
                    </span>
                  </div>
                </div>
                <div className="psl-card-stats">
                  <div className="psl-card-stat psl-card-stat--runs">
                    <MdSportsCricket aria-hidden />
                    <div>
                      <span className="psl-card-stat-label">Runs</span>
                      <strong>{player.totalStats.batting.runs}</strong>
                    </div>
                  </div>
                  <div className="psl-card-stat psl-card-stat--wkts">
                    <FaBowlingBall aria-hidden />
                    <div>
                      <span className="psl-card-stat-label">Wickets</span>
                      <strong>{player.totalStats.bowling.wickets}</strong>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {expandedPlayer && selectedPlayer && (
        <div className="psl-modal-overlay" onClick={closeModal}>
          <div
            className="psl-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedPlayer.name} stats`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="psl-modal-head">
              <div className="psl-modal-identity">
                <span className="psl-modal-avatar" aria-hidden>
                  {initialsOf(selectedPlayer.name)}
                </span>
                <div>
                  <h2 className="psl-modal-title">{selectedPlayer.name}</h2>
                  {selectedPlayer.role && (
                    <span
                      className={`psl-role-pill psl-role-pill--${roleMeta(selectedPlayer.role).tone}`}
                    >
                      {(() => {
                        const Icon = roleMeta(selectedPlayer.role).Icon;
                        return <Icon aria-hidden />;
                      })()}{' '}
                      {roleMeta(selectedPlayer.role).label}
                    </span>
                  )}
                </div>
              </div>
              <button className="psl-modal-close" onClick={closeModal} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <div className="psl-modal-summary">
              <div className="psl-summary-pill psl-summary-pill--runs">
                <span className="psl-summary-label">Total Runs</span>
                <strong>{selectedPlayer.totalStats.batting.runs}</strong>
              </div>
              <div className="psl-summary-pill psl-summary-pill--wkts">
                <span className="psl-summary-label">Total Wickets</span>
                <strong>{selectedPlayer.totalStats.bowling.wickets}</strong>
              </div>
            </div>

            {!isEditing && (
              <button
                className="psl-edit-btn"
                onClick={() => setIsEditing(true)}
              >
                <FaPen aria-hidden /> Edit Stats
              </button>
            )}

            {isEditing ? (
              <form onSubmit={handleFormSubmit} className="psl-form stats-form">
                <div className="psl-form-section">
                  <h4 className="psl-form-heading">Batting</h4>
                  <div className="psl-form-grid">
                    <div className="psl-field form-group">
                      <label>Runs</label>
                      <input
                        type="number"
                        name="battingRuns"
                        value={formData.battingRuns}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="psl-field form-group">
                      <label>Balls</label>
                      <input
                        type="number"
                        name="battingBalls"
                        value={formData.battingBalls}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="psl-form-section">
                  <h4 className="psl-form-heading">Bowling</h4>
                  <div className="psl-form-grid">
                    <div className="psl-field form-group">
                      <label>Runs given</label>
                      <input
                        type="number"
                        name="bowlingRunsGiven"
                        value={formData.bowlingRunsGiven}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="psl-field form-group">
                      <label>Balls bowled</label>
                      <input
                        type="number"
                        name="bowlingBallsBowled"
                        value={formData.bowlingBallsBowled}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="psl-field form-group">
                      <label>Wickets taken</label>
                      <input
                        type="number"
                        name="wicketsTaken"
                        value={formData.wicketsTaken}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="psl-form-section">
                  <h4 className="psl-form-heading">Match</h4>
                  <div className="psl-field form-group">
                    <label>Save mode</label>
                    <select name="saveMode" value={formData.saveMode} onChange={handleInputChange}>
                      <option value="update">Update existing entry (fix wrong data)</option>
                      <option value="create">Create new entry</option>
                    </select>
                  </div>

                  {formData.saveMode === 'update' && (
                    <div className="psl-field form-group">
                      <label>Existing entry to modify</label>
                      <select
                        name="existingEntryId"
                        value={selectedExistingEntryId}
                        onChange={(e) => handleExistingEntrySelect(e.target.value)}
                      >
                        <option value="">
                          {existingEntriesLoading ? 'Loading entries...' : 'Select existing entry'}
                        </option>
                        {existingEntries.map((entry) => {
                          const dateLabel = entry.createdAt
                            ? new Date(entry.createdAt).toLocaleDateString('en-IN')
                            : 'Unknown date';
                          const stageLabel = entry.metadata?.isWcScore
                            ? ` | ${String(entry.metadata?.wcStage || '').toUpperCase()}`
                            : entry.metadata?.isPlayoffScore
                            ? ' | PLAYOFF'
                            : '';
                          const opponentLabel = entry.opponent || 'Unknown opponent';
                          const scoreLabel = `${entry.battingStats?.runs || 0}/${entry.battingStats?.balls || 0}`;
                          return (
                            <option key={entry.id} value={entry.id}>
                              {`${dateLabel} | vs ${opponentLabel}${stageLabel} | ${scoreLabel}`}
                            </option>
                          );
                        })}
                      </select>
                      <small style={{ color: '#666' }}>
                        Selecting an entry will auto-populate the form with that record.
                      </small>
                    </div>
                  )}

                  <div className="psl-field form-group">
                    <label>Opponent team</label>
                    <select
                      name="opponentUserId"
                      value={formData.opponentUserId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select opponent team</option>
                      {allTeams
                        .filter((team) => {
                          if (currentUser && team.teamName === currentUser.teamName) return false;
                          if (selectedPlayer && team.teamName === selectedPlayer.ownerTeamName) return false;
                          return true;
                        })
                        .map((team) => (
                          <option key={team._id} value={team._id}>
                            {team.teamName}
                          </option>
                        ))}
                    </select>
                  </div>

                  {worldCupMode && (
                    <>
                      <div className="psl-field form-group">
                        <label>World Cup stage</label>
                        <select
                          name="wcStage"
                          value={formData.wcStage}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select stage</option>
                          <option value="super8">Super 8</option>
                          <option value="semi">Semi</option>
                          <option value="final">Final</option>
                        </select>
                      </div>
                      <div className="psl-field form-group">
                        <label>Tournament</label>
                        <select
                          name="tournamentId"
                          value={formData.tournamentId}
                          onChange={handleInputChange}
                          required={!!formData.wcStage}
                          disabled={tournamentsLoading}
                        >
                          <option value="">
                            {tournamentsLoading ? 'Loading tournaments...' : 'Select tournament'}
                          </option>
                          {runningTournaments.map((tn) => (
                            <option key={tn._id} value={tn._id}>
                              {tn.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="checkbox-card-grid">
                    <label
                      className={`playoff-checkbox-wrapper lite ${formData.isMom ? 'checked' : ''}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="playoff-checkbox"
                        name="isMom"
                        checked={formData.isMom}
                        onChange={handleCheckboxChange}
                      />
                      <span className="playoff-checkbox-label">
                        <span className="playoff-icon">✨</span>
                        <span className="checkbox-text">
                          <span className="checkbox-title">Man of the Match</span>
                          <span className="checkbox-subtitle">Highlights standout performer</span>
                        </span>
                      </span>
                    </label>

                    {!worldCupMode && (
                      <label
                        className={`playoff-checkbox-wrapper lite playoff-accent ${formData.isPlayoffScore ? 'checked' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="playoff-checkbox"
                          name="isPlayoffScore"
                          checked={formData.isPlayoffScore}
                          onChange={handleCheckboxChange}
                        />
                        <span className="playoff-checkbox-label">
                          <span className="playoff-icon">🏆</span>
                          <span className="checkbox-text">
                            <span className="checkbox-title">Playoff Score</span>
                            <span className="checkbox-subtitle">Track post-season stats</span>
                          </span>
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="psl-form-buttons form-buttons">
                  <button
                    type="button"
                    className="psl-btn psl-btn--ghost form-cancel-btn"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="psl-btn psl-btn--primary form-submit-btn">
                    Save stats
                  </button>
                </div>
                {submitMessage && <p className="psl-submit-message">{submitMessage}</p>}
              </form>
            ) : (
              <>
                <div className="psl-tabs">
                  <button
                    className={`psl-tab ${activeTab === 'batting' ? 'is-active' : ''}`}
                    onClick={() => toggleTab('batting')}
                  >
                    <MdSportsCricket aria-hidden /> Batting
                  </button>
                  <button
                    className={`psl-tab ${activeTab === 'bowling' ? 'is-active' : ''}`}
                    onClick={() => toggleTab('bowling')}
                  >
                    <FaBowlingBall aria-hidden /> Bowling
                  </button>
                </div>

                {activeTab === 'batting' && (
                  <div className="psl-match-grid">
                    {selectedPlayer.matchPerformance.batting.length > 0 ? (
                      selectedPlayer.matchPerformance.batting.map((match, index) => (
                        <div
                          className={`psl-match-card ${match.mom ? 'is-mom' : ''}`}
                          key={`bat-${index}`}
                        >
                          <header>
                            <span className="psl-match-label">Match {match.match}</span>
                            <span className="psl-match-vs">vs {match.against}</span>
                          </header>
                          <dl>
                            <div>
                              <dt>Runs</dt>
                              <dd>{match.runs}</dd>
                            </div>
                            <div>
                              <dt>Balls</dt>
                              <dd>{match.balls}</dd>
                            </div>
                          </dl>
                          {match.mom && (
                            <span className="psl-mom-chip">
                              <FaTrophy aria-hidden /> Man of the Match
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="psl-match-empty">No batting stats available.</p>
                    )}
                  </div>
                )}

                {activeTab === 'bowling' && (
                  <div className="psl-match-grid">
                    {selectedPlayer.matchPerformance.bowling.length > 0 ? (
                      selectedPlayer.matchPerformance.bowling.map((match, index) => (
                        <div
                          className={`psl-match-card ${match.mom ? 'is-mom' : ''}`}
                          key={`bowl-${index}`}
                        >
                          <header>
                            <span className="psl-match-label">Match {match.match}</span>
                            <span className="psl-match-vs">vs {match.against}</span>
                          </header>
                          <dl>
                            <div>
                              <dt>Overs</dt>
                              <dd>{match.overs}</dd>
                            </div>
                            <div>
                              <dt>Wickets</dt>
                              <dd>{match.wickets}</dd>
                            </div>
                            <div>
                              <dt>Runs</dt>
                              <dd>{match.runs}</dd>
                            </div>
                          </dl>
                          {match.mom && (
                            <span className="psl-mom-chip">
                              <FaTrophy aria-hidden /> Man of the Match
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="psl-match-empty">No bowling stats available.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <>
          <div
            className="psl-success-overlay"
            onClick={() => setShowSuccessPopup(false)}
          />
          <div className="psl-success-popup">
            <span aria-hidden>✅</span>
            {successMessage}
          </div>
        </>
      )}
    </div>
  );
};

export default PlayerStatsList;
