import React, { useState, useEffect } from 'react';
import '../css/AdminMatchResults.css';
import { API_ENDPOINTS } from '../const';
import { FaPlus, FaEdit, FaTrash, FaTrophy, FaCalendar, FaUsers, FaFutbol } from 'react-icons/fa';

const AdminMatchResults = () => {
  const [matchResults, setMatchResults] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [formData, setFormData] = useState({
    matchNumber: '',
    matchTitle: '',
    team1: '',
    team2: '',
    winner: '',
    team1Score: '',
    team2Score: '',
    team1Wickets: '',
    team2Wickets: '',
    team1Overs: '',
    team2Overs: '',
    matchDate: '',
    matchVenue: '',
    manOfTheMatch: {
      name: '',
      playerId: '',
      team: '',
      runs: '',
      wickets: '',
      balls: ''
    },
    trophyName: '',
    trophyType: 'league',
    matchType: 'normal',
    margin: '',
    matchStatus: 'completed',
    additionalNotes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchResultsRes, teamsRes, playersRes] = await Promise.all([
        fetch(`${API_ENDPOINTS}/api/match-results`, {
          headers: { 'user-id': JSON.parse(localStorage.getItem('user')).id }
        }),
        fetch(`${API_ENDPOINTS}/api/match-results/teams/list`, {
          headers: { 'user-id': JSON.parse(localStorage.getItem('user')).id }
        }),
        fetch(`${API_ENDPOINTS}/api/match-results/players/list`, {
          headers: { 'user-id': JSON.parse(localStorage.getItem('user')).id }
        })
      ]);

      if (matchResultsRes.ok) {
        const matchData = await matchResultsRes.json();
        setMatchResults(matchData.matchResults || []);
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }

      if (playersRes.ok) {
        const playersData = await playersRes.json();
        setPlayers(playersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('manOfTheMatch.')) {
      const momField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        manOfTheMatch: {
          ...prev.manOfTheMatch,
          [momField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = JSON.parse(localStorage.getItem('user')).id;
      const url = editingMatch 
        ? `${API_ENDPOINTS}/api/match-results/${editingMatch._id}`
        : `${API_ENDPOINTS}/api/match-results`;

      const method = editingMatch ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchData();
        setShowModal(false);
        setEditingMatch(null);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save match result');
      }
    } catch (error) {
      console.error('Error saving match result:', error);
      setError('Failed to save match result');
    }
  };

  const handleEdit = (match) => {
    setEditingMatch(match);
    setFormData({
      matchNumber: match.matchNumber,
      matchTitle: match.matchTitle,
      team1: match.team1,
      team2: match.team2,
      winner: match.winner,
      team1Score: (match.team1Score || 0).toString(),
      team2Score: (match.team2Score || 0).toString(),
      team1Wickets: (match.team1Wickets || 0).toString(),
      team2Wickets: (match.team2Wickets || 0).toString(),
      team1Overs: (match.team1Overs || 0).toString(),
      team2Overs: (match.team2Overs || 0).toString(),
      matchDate: new Date(match.matchDate).toISOString().split('T')[0],
      matchVenue: match.matchVenue,
      manOfTheMatch: {
        name: match.manOfTheMatch.name,
        playerId: match.manOfTheMatch.playerId ? (match.manOfTheMatch.playerId._id || match.manOfTheMatch.playerId) : '',
        team: match.manOfTheMatch.team,
        runs: (match.manOfTheMatch.runs || 0).toString(),
        wickets: (match.manOfTheMatch.wickets || 0).toString(),
        balls: (match.manOfTheMatch.balls || 0).toString()
      },
      trophyName: match.trophyName,
      trophyType: match.trophyType,
      matchType: match.matchType,
      margin: match.margin,
      matchStatus: match.matchStatus,
      additionalNotes: match.additionalNotes
    });
    setShowModal(true);
  };

  const handleDelete = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match result?')) {
      return;
    }

    try {
      const userId = JSON.parse(localStorage.getItem('user')).id;
      const response = await fetch(`${API_ENDPOINTS}/api/match-results/${matchId}`, {
        method: 'DELETE',
        headers: { 'user-id': userId }
      });

      if (response.ok) {
        await fetchData();
      } else {
        setError('Failed to delete match result');
      }
    } catch (error) {
      console.error('Error deleting match result:', error);
      setError('Failed to delete match result');
    }
  };

  const resetForm = () => {
    setFormData({
      matchNumber: '',
      matchTitle: '',
      team1: '',
      team2: '',
      winner: '',
      team1Score: '',
      team2Score: '',
      team1Wickets: '',
      team2Wickets: '',
      team1Overs: '',
      team2Overs: '',
      matchDate: '',
      matchVenue: '',
      manOfTheMatch: {
        name: '',
        playerId: '',
        team: '',
        runs: '',
        wickets: '',
        balls: ''
      },
      trophyName: '',
      trophyType: 'league',
      matchType: 'normal',
      margin: '',
      matchStatus: 'completed',
      additionalNotes: ''
    });
  };

  const openModal = () => {
    resetForm();
    setEditingMatch(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="admin-match-results-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading match results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-match-results-container">
      <div className="header-section">
        <div className="header-content">
          <FaTrophy className="header-icon" />
          <h1 className="header-title">Match Results Management</h1>
          <p className="header-subtitle">Manage match results and trophy data</p>
        </div>
        <button className="add-button" onClick={openModal}>
          <FaPlus className="button-icon" />
          Add Match Result
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="stats-section">
        <div className="stat-card">
          <FaTrophy className="stat-icon" />
          <div className="stat-content">
            <span className="stat-number">{matchResults.length}</span>
            <span className="stat-label">Total Matches</span>
          </div>
        </div>
        <div className="stat-card">
          <FaCalendar className="stat-icon" />
          <div className="stat-content">
            <span className="stat-number">
              {matchResults.filter(m => m.matchStatus === 'completed').length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="stat-card">
          <FaUsers className="stat-icon" />
          <div className="stat-content">
            <span className="stat-number">
              {new Set(matchResults.map(m => m.trophyName)).size}
            </span>
            <span className="stat-label">Trophy Types</span>
          </div>
        </div>
      </div>

      <div className="matches-table">
        <table>
          <thead>
            <tr>
              <th>Match #</th>
              <th>Title</th>
              <th>Teams</th>
              <th>Winner</th>
              <th>Score</th>
              <th>Trophy</th>
              <th>Date</th>
              <th>MoM</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {matchResults.map((match) => (
              <tr key={match._id}>
                <td className="match-number">{match.matchNumber}</td>
                <td className="match-title">{match.matchTitle}</td>
                <td className="teams">
                  <span className="team">{match.team1}</span>
                  <span className="vs">vs</span>
                  <span className="team">{match.team2}</span>
                </td>
                <td className="winner">
                  <span className={`winner-badge ${match.winner}`}>
                    {match.winner === 'team1' ? match.team1 : 
                     match.winner === 'team2' ? match.team2 : 
                     match.winner === 'tie' ? 'Tie' : 'No Result'}
                  </span>
                </td>
                <td className="score">
                  <span className="score-text">
                    {match.team1Score}/{match.team1Wickets} vs {match.team2Score}/{match.team2Wickets}
                  </span>
                </td>
                <td className="trophy">
                  <span className="trophy-name">{match.trophyName}</span>
                  <span className="trophy-type">{match.trophyType}</span>
                </td>
                <td className="date">
                  {new Date(match.matchDate).toLocaleDateString()}
                </td>
                <td className="mom">
                  <span className="mom-name">{match.manOfTheMatch.name}</span>
                  <span className="mom-stats">
                    {match.manOfTheMatch.runs}r {match.manOfTheMatch.wickets}w
                  </span>
                </td>
                <td className="actions">
                  <button 
                    className="edit-btn" 
                    onClick={() => handleEdit(match)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDelete(match._id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMatch ? 'Edit Match Result' : 'Add Match Result'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="match-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Match Number *</label>
                  <input
                    type="text"
                    name="matchNumber"
                    value={formData.matchNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Match Title *</label>
                  <input
                    type="text"
                    name="matchTitle"
                    value={formData.matchTitle}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Team 1 *</label>
                  <select
                    name="team1"
                    value={formData.team1}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Team</option>
                    {teams.map(team => (
                      <option key={team._id} value={team.teamName}>
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Team 2 *</label>
                  <select
                    name="team2"
                    value={formData.team2}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Team</option>
                    {teams.map(team => (
                      <option key={team._id} value={team.teamName}>
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Winner *</label>
                  <select
                    name="winner"
                    value={formData.winner}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Winner</option>
                    <option value="team1">Team 1</option>
                    <option value="team2">Team 2</option>
                    <option value="tie">Tie</option>
                    <option value="no_result">No Result</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Team 1 Score *</label>
                  <input
                    type="number"
                    name="team1Score"
                    value={formData.team1Score}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Team 2 Score *</label>
                  <input
                    type="number"
                    name="team2Score"
                    value={formData.team2Score}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Team 1 Wickets</label>
                  <input
                    type="number"
                    name="team1Wickets"
                    value={formData.team1Wickets}
                    onChange={handleInputChange}
                    min="0"
                    max="10"
                  />
                </div>

                <div className="form-group">
                  <label>Team 2 Wickets</label>
                  <input
                    type="number"
                    name="team2Wickets"
                    value={formData.team2Wickets}
                    onChange={handleInputChange}
                    min="0"
                    max="10"
                  />
                </div>

                <div className="form-group">
                  <label>Team 1 Overs</label>
                  <input
                    type="number"
                    name="team1Overs"
                    value={formData.team1Overs}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>Team 2 Overs</label>
                  <input
                    type="number"
                    name="team2Overs"
                    value={formData.team2Overs}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>Match Date *</label>
                  <input
                    type="date"
                    name="matchDate"
                    value={formData.matchDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Match Venue *</label>
                  <input
                    type="text"
                    name="matchVenue"
                    value={formData.matchVenue}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Margin *</label>
                  <input
                    type="text"
                    name="margin"
                    value={formData.margin}
                    onChange={handleInputChange}
                    placeholder="e.g., 5 wickets, 25 runs"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Trophy Name *</label>
                  <input
                    type="text"
                    name="trophyName"
                    value={formData.trophyName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Trophy Type</label>
                  <select
                    name="trophyType"
                    value={formData.trophyType}
                    onChange={handleInputChange}
                  >
                    <option value="league">League</option>
                    <option value="playoff">Playoff</option>
                    <option value="final">Final</option>
                    <option value="semi_final">Semi Final</option>
                    <option value="quarter_final">Quarter Final</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Match Type</label>
                  <select
                    name="matchType"
                    value={formData.matchType}
                    onChange={handleInputChange}
                  >
                    <option value="normal">Normal</option>
                    <option value="playoff">Playoff</option>
                    <option value="final">Final</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Match Status</label>
                  <select
                    name="matchStatus"
                    value={formData.matchStatus}
                    onChange={handleInputChange}
                  >
                    <option value="completed">Completed</option>
                    <option value="abandoned">Abandoned</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Man of the Match Name *</label>
                  <input
                    type="text"
                    name="manOfTheMatch.name"
                    value={formData.manOfTheMatch.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>MoM Team *</label>
                  <input
                    type="text"
                    name="manOfTheMatch.team"
                    value={formData.manOfTheMatch.team}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>MoM Runs</label>
                  <input
                    type="number"
                    name="manOfTheMatch.runs"
                    value={formData.manOfTheMatch.runs}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>MoM Wickets</label>
                  <input
                    type="number"
                    name="manOfTheMatch.wickets"
                    value={formData.manOfTheMatch.wickets}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>MoM Balls</label>
                  <input
                    type="number"
                    name="manOfTheMatch.balls"
                    value={formData.manOfTheMatch.balls}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Additional Notes</label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingMatch ? 'Update' : 'Create'} Match Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMatchResults;
