import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../const';
import '../css/TeamShowcase.css';

const TeamShowcase = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedPlayer, setDraggedPlayer] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS}/api/team-showcase/teams`);
      const data = await response.json();
      if (data.success) {
        console.log('Teams data received:', data.teams);
        console.log('First team structure:', data.teams[0]);
        console.log('First team _id:', data.teams[0]?._id);
        setTeams(data.teams);
      } else {
        console.error('Failed to fetch teams:', data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamClick = async (teamId) => {
    try {
      console.log('Clicking team with ID:', teamId);
      const response = await fetch(`${API_ENDPOINTS}/api/team-showcase/teams/${teamId}`);
      const data = await response.json();
      if (data.success) {
        console.log('Team data received:', data.team);
        console.log('Team _id field:', data.team._id);
        console.log('Team keys:', Object.keys(data.team));
        
        // Ensure the team has an id field
        if (!data.team.id) {
          console.error('Team data missing id field:', data.team);
          alert('Error: Team data is missing ID. Please try again.');
          return;
        }
        
        setSelectedTeam(data.team);
        setShowPopup(true);
      } else {
        console.error('Failed to fetch team:', data);
        alert('Failed to load team data. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
      alert('Error loading team data. Please try again.');
    }
  };

  const closePopup = () => {
    console.log('Close button clicked!');
    setShowPopup(false);
    setSelectedTeam(null);
    setIsReordering(false);
  };

  const handleDragStart = (e, player) => {
    setDraggedPlayer(player);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetPlayer) => {
    e.preventDefault();
    if (!draggedPlayer || !selectedTeam) return;

    const newPlayers = [...selectedTeam.players];
    const draggedIndex = newPlayers.findIndex(p => p.id === draggedPlayer.id);
    const targetIndex = newPlayers.findIndex(p => p.id === targetPlayer.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder players
    const [removed] = newPlayers.splice(draggedIndex, 1);
    newPlayers.splice(targetIndex, 0, removed);

    setSelectedTeam({
      ...selectedTeam,
      players: newPlayers
    });

    setDraggedPlayer(null);
  };

  // Touch events for mobile
  const handleTouchStart = (e, player) => {
    setDraggedPlayer(player);
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
  };

  const handleTouchEnd = (e, targetPlayer) => {
    e.preventDefault();
    if (!draggedPlayer || !selectedTeam) return;

    const newPlayers = [...selectedTeam.players];
    const draggedIndex = newPlayers.findIndex(p => p.id === draggedPlayer.id);
    const targetIndex = newPlayers.findIndex(p => p.id === targetPlayer.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder players
    const [removed] = newPlayers.splice(draggedIndex, 1);
    newPlayers.splice(targetIndex, 0, removed);

    setSelectedTeam({
      ...selectedTeam,
      players: newPlayers
    });

    setDraggedPlayer(null);
  };

  const savePlayerOrder = async () => {
    if (!selectedTeam) {
      console.error('No selected team');
      return;
    }

    console.log('Selected team object:', selectedTeam);
    console.log('Selected team _id:', selectedTeam._id);

    // Try to get team ID from different possible fields
    const teamId = selectedTeam.id || selectedTeam._id || selectedTeam.teamId;
    
    if (!teamId) {
      console.error('No team ID found in:', Object.keys(selectedTeam));
      alert('Error: Team ID not found. Please try again.');
      return;
    }

    try {
      const playerOrders = selectedTeam.players.map((player, index) => ({
        playerId: player.id,
        order: index
      }));

      console.log('Using team ID:', teamId);
      console.log('Sending player orders:', playerOrders);

      const response = await fetch(`${API_ENDPOINTS}/api/team-showcase/teams/${teamId}/player-order`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerOrders })
      });

      const result = await response.json();
      
      if (response.ok) {
        setIsReordering(false);
        alert(result.message || 'Player order saved successfully!');
        
        // Refresh the team data to show the updated order
        await handleTeamClick(teamId);
      } else {
        alert(result.message || 'Failed to save player order');
      }
    } catch (error) {
      console.error('Error saving player order:', error);
      alert('Error saving player order');
    }
  };

  const renderTrophy = (count) => {
    if (count === 0) return null;
    
    return (
      <div className="trophy-container">
        {Array.from({ length: Math.min(count, 5) }, (_, i) => (
          <div key={i} className="trophy-icon">
            🏆
          </div>
        ))}
        {count > 5 && <span className="trophy-count">+{count - 5}</span>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="team-showcase">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading teams...</p>
        </div>
      </div>
    );
  }

  // Dynamic background styling based on selected team
  const getBackgroundStyle = () => {
    if (selectedTeam && showPopup) {
      const teamColor = selectedTeam.teamColor || '#3B82F6';
      return {
        '--team-color': teamColor,
        '--team-gradient': `linear-gradient(135deg, 
          ${teamColor}15 0%, 
          ${teamColor}25 20%, 
          #0f0f23 40%, 
          #1a1a2e 70%, 
          ${teamColor}10 100%
        )`
      };
    }
    return {
      '--team-color': '#3B82F6',
      '--team-gradient': 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
    };
  };

  return (
    <div className="team-showcase" style={getBackgroundStyle()}>
      <div className="showcase-header">
        <h1>🏆 Team Showcase</h1>
        <p>Click on any team to view their complete lineup and achievements</p>
      </div>

      <div className="teams-grid">
        {teams.map((team) => (
          <div
            key={team._id}
            className="team-card"
            style={{ 
              '--team-color': team.teamColor || '#3B82F6',
              '--team-gradient': `linear-gradient(135deg, 
                ${team.teamColor || '#3B82F6'}20 0%, 
                ${team.teamColor || '#3B82F6'}10 50%, 
                transparent 100%
              )`
            }}
            onClick={() => handleTeamClick(team._id)}
          >
            <div className="team-card-header">
              <div className="team-logo">
                {team.teamImage ? (
                  <img src={`${API_ENDPOINTS}${team.teamImage}`} alt={team.teamName} />
                ) : (
                  <div className="default-logo">⚽</div>
                )}
              </div>
              <div className="team-info">
                <h3 className="team-name">{team.teamName}</h3>
                <p className="team-captain">👑 {team.captain || 'Captain TBD'}</p>
                {team.group && (
                  <span className="team-group">Group {team.group}</span>
                )}
              </div>
            </div>
            
            <div className="team-card-body">
              <p className="team-brief">{team.teamBrief}</p>
              <div className="team-achievements">
                {renderTrophy(team.trophiesWon)}
                {team.trophiesWon === 0 && (
                  <span className="no-trophies">Rising Stars</span>
                )}
              </div>
            </div>

            <div className="team-card-footer">
              <div className="team-motto">"{team.teamMotto}"</div>
              <div className="click-hint">Click to view lineup →</div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Details Popup */}
      {showPopup && selectedTeam && (
        <div className="popup-overlay" onClick={closePopup}>
          <div 
            className="team-popup" 
            onClick={(e) => e.stopPropagation()}
            style={{
              '--team-color': selectedTeam.teamColor || '#3B82F6'
            }}
          >
            <div className="popup-header">
              <button 
                className="close-btn" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closePopup();
                }}
                type="button"
              >
                ×
              </button>
              
                                  <div className="popup-header-content">
                      <div className="team-logo-section">
                        <div className="team-logo-container">
                          {selectedTeam.teamImage ? (
                            <img src={`${API_ENDPOINTS}${selectedTeam.teamImage}`} alt={selectedTeam.teamName} />
                          ) : (
                            <div className="default-team-logo">🏏</div>
                          )}
                        </div>
                        <div className="team-name-display" style={{ '--team-color': selectedTeam.teamColor || '#3B82F6' }}>
                          {selectedTeam.teamName}
                        </div>
                        <div className="tournament-badge">
                          <span className="tournament-icon">🏆</span>
                          <span className="tournament-text">CPL</span>
                        </div>
                      </div>
                    </div>
            </div>

            <div className="popup-body">
              {isReordering && (
                <div className="reorder-controls">
                  <button 
                    className="save-order-btn"
                    onClick={savePlayerOrder}
                  >
                    💾 Save Order
                  </button>
                  <button 
                    className="cancel-reorder-btn"
                    onClick={() => setIsReordering(false)}
                  >
                    ❌ Cancel
                  </button>
                </div>
              )}
              
              {!isReordering && (
                <div className="reorder-toggle">
                  <button 
                    className="reorder-btn"
                    onClick={() => setIsReordering(true)}
                    title="Reorder Players"
                  >
                    <span className="reorder-icon">↕️</span>
                  </button>
                </div>
              )}

              <div className="players-list">
                {selectedTeam.players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`player-card ${
                      player.isCaptain ? 'captain' : player.isViceCaptain ? 'vice-captain' : ''
                    } ${isReordering ? 'draggable' : ''}`}
                    style={{
                      '--team-color': selectedTeam.teamColor || '#3B82F6'
                    }}
                    draggable={isReordering}
                    onDragStart={(e) => handleDragStart(e, player)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, player)}
                    onTouchStart={(e) => handleTouchStart(e, player)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={(e) => handleTouchEnd(e, player)}
                  >
                    <div className="player-name">
                      {isReordering && <span className="drag-handle">⋮⋮</span>}
                      {player.name}
                      {(player.isCaptain || player.isViceCaptain) && (
                        <span className="leadership-suffix">
                          {player.isCaptain ? ' (C)' : ' (VC)'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamShowcase;
