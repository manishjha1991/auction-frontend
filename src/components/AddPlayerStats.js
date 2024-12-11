import React, { useState } from 'react';
import '../css/AddPlayerStats.css';

const AddPlayerStats = ({ players, teams }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState('bat');
  const [formData, setFormData] = useState({
    matchNumber: '',
    totalRuns: '',
    totalBalls: '',
    isMom: false,
    versusTeam: '',
    runsGiven: '',
    totalWickets: '',
  });

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setFormData({
      matchNumber: '',
      totalRuns: '',
      totalBalls: '',
      isMom: false,
      versusTeam: '',
      runsGiven: '',
      totalWickets: '',
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Submitted:', formData);
    alert('Data submitted successfully!');
  };

  return (
    <div className="player-list-container">
      <h1 className="title">Sold Players</h1>
      <ul className="player-list">
        {players.map((player) => (
          <li
            key={player.id}
            className="player-item"
            onClick={() => handlePlayerClick(player)}
          >
            {player.name}
          </li>
        ))}
      </ul>

      {selectedPlayer && (
        <div className="details-container">
          <h2 className="player-name">{selectedPlayer.name}</h2>
          <div className="tab-buttons">
            <button
              className={`tab-button ${activeTab === 'bat' ? 'active' : ''}`}
              onClick={() => handleTabChange('bat')}
            >
              Bat
            </button>
            <button
              className={`tab-button ${activeTab === 'ball' ? 'active' : ''}`}
              onClick={() => handleTabChange('ball')}
            >
              Ball
            </button>
          </div>

          {activeTab === 'bat' && (
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Match Number:</label>
                <input
                  type="text"
                  name="matchNumber"
                  value={formData.matchNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Total Runs:</label>
                <input
                  type="number"
                  name="totalRuns"
                  value={formData.totalRuns}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Total Balls Faced:</label>
                <input
                  type="number"
                  name="totalBalls"
                  value={formData.totalBalls}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Player of the Match:</label>
                <input
                  type="checkbox"
                  name="isMom"
                  checked={formData.isMom}
                  onChange={handleInputChange}
                />
              </div>
              <button className="submit-button" type="submit">Submit</button>
            </form>
          )}

          {activeTab === 'ball' && (
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Match Number:</label>
                <input
                  type="text"
                  name="matchNumber"
                  value={formData.matchNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Versus Team:</label>
                <select
                  name="versusTeam"
                  value={formData.versusTeam}
                  onChange={handleInputChange}
                >
                  <option value="">Select Team</option>
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Total Runs Given:</label>
                <input
                  type="number"
                  name="runsGiven"
                  value={formData.runsGiven}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Total Wickets Taken:</label>
                <input
                  type="number"
                  name="totalWickets"
                  value={formData.totalWickets}
                  onChange={handleInputChange}
                />
              </div>
              <button className="submit-button" type="submit">Submit</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default AddPlayerStats;