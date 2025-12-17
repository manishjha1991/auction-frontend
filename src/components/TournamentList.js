import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../const';
import { FaCalendarAlt, FaUsers, FaTrophy, FaEdit, FaTrash, FaPlus, FaImage, FaTimes, FaTable, FaList } from 'react-icons/fa';
import './TournamentList.css';

const TournamentList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, running, completed
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [user, setUser] = useState(null);
  const [subscriptionCount, setSubscriptionCount] = useState(0);

  useEffect(() => {
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        // User loaded successfully
      } catch (error) {
        console.error('Error parsing user data:', error);
        setError('Invalid user data');
      }
    } else {
      console.log('No user found in localStorage');
      setError('User not authenticated');
    }
    fetchTournaments();
    fetchSubscriptionCount();
  }, []);

  const fetchSubscriptionCount = async () => {
    try {
      const cachedUser = localStorage.getItem('user');
      if (!cachedUser) return;
      
      const userData = JSON.parse(cachedUser);
      const userId = userData.id || userData._id;
      
      if (!userId) return;
      
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/subscription-count`, {
        headers: {
          'user-id': userId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionCount(data.subscriptionCount);
      }
    } catch (error) {
      console.error('Error fetching subscription count:', error);
    }
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cachedUser = localStorage.getItem('user');
      if (!cachedUser) {
        throw new Error('User not authenticated - no user data found');
      }
      
      const userData = JSON.parse(cachedUser);
      const userId = userData.id || userData._id;
      
      if (!userId) {
        throw new Error('User not authenticated - no user ID found');
      }
      
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments`, {
        headers: {
          'user-id': userId
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch tournaments: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Backend can return either:
      // - an array of tournaments (default for limit >= 100 or no limit)
      // - an object { tournaments: [...], totalPages, currentPage, total } when limit < 100
      if (Array.isArray(data)) {
        setTournaments(data);
      } else if (data && Array.isArray(data.tournaments)) {
        setTournaments(data.tournaments);
      } else {
        setTournaments([]);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setError(error.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const getTournamentStatus = (tournament) => {
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);

    if (startDate > now) return 'upcoming';
    if (endDate < now) return 'completed';
    return 'running';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return '#3B82F6';
      case 'running': return '#10B981';
      case 'completed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'running': return 'Running';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    if (filter === 'all') return true;
    if (filter === 'my') return tournament.isUserSubscribed;
    return getTournamentStatus(tournament) === filter;
  });

  const handleSubscribe = async (tournamentId) => {
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournamentId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to subscribe');
      }

      await fetchTournaments();
      await fetchSubscriptionCount();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUnsubscribe = async (tournamentId) => {
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournamentId}/subscribe`, {
        method: 'DELETE',
        headers: {
          'user-id': user.id
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unsubscribe');
      }

      await fetchTournaments();
      await fetchSubscriptionCount();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRemoveTeam = async (tournamentId, userId) => {
    if (!window.confirm('Are you sure you want to remove this team from the tournament?')) {
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournamentId}/teams/${userId}`, {
        method: 'DELETE',
        headers: {
          'user-id': user._id
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove team');
      }

      await fetchTournaments();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteTournament = async (tournamentId) => {
    if (!window.confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: {
          'user-id': user._id
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete tournament');
      }

      await fetchTournaments();
    } catch (error) {
      alert(error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleTournamentClick = (tournament) => {
    setSelectedTournament(tournament);
    setShowDetailModal(true);
  };

  const canSubscribe = (tournament) => {
    // Admin cannot subscribe to tournaments
    if (user && user.isAdmin) return false;
    if (tournament.isUserSubscribed) return false;
    if (tournament.slotsLeft === 0) return false;
    if (getTournamentStatus(tournament) === 'completed') return false;
    if (subscriptionCount >= 2) return false;
    return true;
  };

  const canWithdraw = (tournament) => {
    if (!tournament.isUserSubscribed) return false;
    if (tournament.isLocked) return false;
    if (getTournamentStatus(tournament) === 'completed') return false;
    return true;
  };

  if (loading) {
    return (
      <div className="tournament-container">
        <div className="loading">Loading tournaments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tournament-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="tournament-container">
      <div className="tournament-header">
        <h1>CPL Tournaments</h1>
        {user && user.isAdmin && (
          <button 
            className="create-tournament-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <FaPlus /> Create Tournament
          </button>
        )}
      </div>

      <div className="tournament-filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Tournaments
        </button>
        <button 
          className={filter === 'my' ? 'active' : ''}
          onClick={() => setFilter('my')}
        >
          My Tournaments
        </button>
        <button 
          className={filter === 'upcoming' ? 'active' : ''}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={filter === 'running' ? 'active' : ''}
          onClick={() => setFilter('running')}
        >
          Running
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      <div className="tournament-grid">
        {filteredTournaments.map((tournament) => {
          const status = getTournamentStatus(tournament);
          const isSubscribed = tournament.isUserSubscribed;
          
          return (
            <div key={tournament._id} className="tournament-card" onClick={() => handleTournamentClick(tournament)}>
              <div className="tournament-image">
                {tournament.tournamentImage ? (
                  <img 
                    src={`${API_ENDPOINTS}${tournament.tournamentImage}`} 
                    alt={tournament.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="default-image" style={{ display: tournament.tournamentImage ? 'none' : 'flex' }}>
                  <FaTrophy />
                </div>
                <div className="tournament-status" style={{ backgroundColor: getStatusColor(status) }}>
                  {getStatusText(status)}
                </div>
                {tournament.isLocked && (
                  <div className="tournament-locked" style={{ backgroundColor: '#dc3545' }}>
                    🔒 Locked
                  </div>
                )}
                {tournament.winner?.teamName && (
                  <div className="tournament-winner-badge" style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#000',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.5)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: '2px solid #FF8C00'
                  }}>
                    <span>🏆</span>
                    <span>Winner: {tournament.winner.teamName}</span>
                  </div>
                )}
              </div>

              <div className="tournament-info">
                <h3>{tournament.name}</h3>
                {tournament.description && (
                  <p className="tournament-description">{tournament.description}</p>
                )}
                
                <div className="tournament-details">
                  <div className="detail-item">
                    <FaCalendarAlt />
                    <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <FaUsers />
                    <span>{tournament.subscriptionCount}/{tournament.maxSlots} teams</span>
                    <span className="slots-left">({tournament.slotsLeft} slots left)</span>
                  </div>
                </div>

                <div className="subscribed-teams">
                  <h4>Subscribed Teams:</h4>
                  <div className="team-list">
                    {tournament.subscribedTeams.map((team, index) => (
                      <div key={index} className="team-item">
                        <img 
                          src={team.teamImage ? `${API_ENDPOINTS}${team.teamImage}` : '/images/default-team.png'} 
                          alt={team.teamName}
                          className="team-logo"
                          onError={(e) => {
                            e.target.src = '/images/default-team.png';
                          }}
                        />
                        <span className="team-name">{team.teamName}</span>
                        {user && user.isAdmin && (
                          <button 
                            className="remove-team-btn"
                            onClick={() => handleRemoveTeam(tournament._id, team.userId)}
                            title="Remove team"
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="tournament-actions">
                  {user && user.isAdmin && (
                    <div className="admin-actions">
                      <button 
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTournament(tournament);
                          setShowEditModal(true);
                        }}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTournament(tournament._id);
                        }}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTournaments.length === 0 && (
        <div className="no-tournaments">
          <FaTrophy />
          <h3>No tournaments found</h3>
          <p>No tournaments match your current filter.</p>
        </div>
      )}

      {showCreateModal && (
        <CreateTournamentModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTournaments();
          }}
        />
      )}

      {showEditModal && editingTournament && (
        <EditTournamentModal 
          tournament={editingTournament}
          onClose={() => {
            setShowEditModal(false);
            setEditingTournament(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingTournament(null);
            fetchTournaments();
          }}
        />
      )}

      {showDetailModal && selectedTournament && (
        <TournamentDetailModal 
          tournament={selectedTournament}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTournament(null);
          }}
          onSubscribe={() => {
            handleSubscribe(selectedTournament._id);
            setShowDetailModal(false);
          }}
          onUnsubscribe={() => {
            handleUnsubscribe(selectedTournament._id);
            setShowDetailModal(false);
          }}
          canSubscribe={canSubscribe(selectedTournament)}
          isSubscribed={selectedTournament.isUserSubscribed}
        />
      )}
    </div>
  );
};

// Create Tournament Modal Component
const CreateTournamentModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    maxSlots: 8,
    tournamentImage: null
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        tournamentImage: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('maxSlots', formData.maxSlots);
      
      if (formData.tournamentImage) {
        formDataToSend.append('tournamentImage', formData.tournamentImage);
      }

      const cachedUser = localStorage.getItem('user');
      const userId = cachedUser ? JSON.parse(cachedUser).id : null;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments`, {
        method: 'POST',
        headers: {
          'user-id': userId
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create tournament');
      }

      onSuccess();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Tournament</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tournament-form">
          <div className="form-group">
            <label>Tournament Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter tournament name"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter tournament description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Max Teams *</label>
            <input
              type="number"
              name="maxSlots"
              value={formData.maxSlots}
              onChange={handleInputChange}
              required
              min="1"
              max="20"
            />
          </div>

          <div className="form-group">
            <label>Tournament Image</label>
            <div className="image-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                id="tournament-image"
                style={{ display: 'none' }}
              />
              <label htmlFor="tournament-image" className="image-upload-btn">
                <FaImage /> Choose Image
              </label>
              {formData.tournamentImage && (
                <span className="selected-file">{formData.tournamentImage.name}</span>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Tournament Modal Component
const EditTournamentModal = ({ tournament, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: tournament.name,
    description: tournament.description || '',
    startDate: tournament.startDate.split('T')[0],
    endDate: tournament.endDate.split('T')[0],
    maxSlots: tournament.maxSlots,
    tournamentImage: null
  });
  const [loading, setLoading] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [subscribedTeams, setSubscribedTeams] = useState(tournament.subscribedTeams || []);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        tournamentImage: file
      }));
    }
  };

  // Fetch available teams (teams not yet subscribed)
  useEffect(() => {
    const fetchAvailableTeams = async () => {
      setLoadingTeams(true);
      try {
        const cachedUser = localStorage.getItem('user');
        const userId = cachedUser ? JSON.parse(cachedUser).id : null;
        
        const response = await fetch(`${API_ENDPOINTS}/api/users/teams`, {
          headers: {
            'user-id': userId
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const teams = data.teams || data || [];
          
          // Filter out teams that are already subscribed
          const subscribedTeamIds = subscribedTeams.map(team => team.userId?._id || team.userId || team.userId?.toString());
          const available = teams.filter(team => 
            team._id && 
            !subscribedTeamIds.includes(team._id.toString()) &&
            team.isActive !== false &&
            team.teamName && 
            team.teamName !== 'NA'
          );
          
          setAvailableTeams(available);
        }
      } catch (error) {
        console.error('Error fetching available teams:', error);
      } finally {
        setLoadingTeams(false);
      }
    };
    
    if (showTeamManagement) {
      fetchAvailableTeams();
    }
  }, [showTeamManagement, subscribedTeams]);

  // Add team to tournament
  const handleAddTeam = async (teamUserId) => {
    try {
      const cachedUser = localStorage.getItem('user');
      const userId = cachedUser ? JSON.parse(cachedUser).id : null;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournament._id}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({ userId: teamUserId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add team');
      }

      // Refresh tournament data to get updated subscribed teams
      const tournamentResponse = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournament._id}`, {
        headers: {
          'user-id': userId
        }
      });
      
      if (tournamentResponse.ok) {
        const updatedTournament = await tournamentResponse.json();
        setSubscribedTeams(updatedTournament.subscribedTeams || []);
        // Refresh available teams
        const teamsResponse = await fetch(`${API_ENDPOINTS}/api/users/teams`, {
          headers: {
            'user-id': userId
          }
        });
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          const teams = teamsData.teams || teamsData || [];
          const subscribedTeamIds = (updatedTournament.subscribedTeams || []).map(team => team.userId?._id || team.userId || team.userId?.toString());
          const available = teams.filter(team => 
            team._id && 
            !subscribedTeamIds.includes(team._id.toString()) &&
            team.isActive !== false &&
            team.teamName && 
            team.teamName !== 'NA'
          );
          setAvailableTeams(available);
        }
      }
    } catch (error) {
      alert(error.message);
    }
  };

  // Remove team from tournament
  const handleRemoveTeam = async (teamUserId) => {
    if (!window.confirm('Are you sure you want to remove this team from the tournament?')) {
      return;
    }

    try {
      const cachedUser = localStorage.getItem('user');
      const userId = cachedUser ? JSON.parse(cachedUser).id : null;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournament._id}/teams/${teamUserId}`, {
        method: 'DELETE',
        headers: {
          'user-id': userId
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove team');
      }

      // Refresh tournament data to get updated subscribed teams
      const tournamentResponse = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournament._id}`, {
        headers: {
          'user-id': userId
        }
      });
      
      if (tournamentResponse.ok) {
        const updatedTournament = await tournamentResponse.json();
        setSubscribedTeams(updatedTournament.subscribedTeams || []);
        // Refresh available teams
        const teamsResponse = await fetch(`${API_ENDPOINTS}/api/users/teams`, {
          headers: {
            'user-id': userId
          }
        });
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          const teams = teamsData.teams || teamsData || [];
          const subscribedTeamIds = (updatedTournament.subscribedTeams || []).map(team => team.userId?._id || team.userId || team.userId?.toString());
          const available = teams.filter(team => 
            team._id && 
            !subscribedTeamIds.includes(team._id.toString()) &&
            team.isActive !== false &&
            team.teamName && 
            team.teamName !== 'NA'
          );
          setAvailableTeams(available);
        }
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('maxSlots', formData.maxSlots);
      
      if (formData.tournamentImage) {
        formDataToSend.append('tournamentImage', formData.tournamentImage);
      }

      const cachedUser = localStorage.getItem('user');
      const userId = cachedUser ? JSON.parse(cachedUser).id : null;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournament._id}`, {
        method: 'PUT',
        headers: {
          'user-id': userId
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tournament');
      }

      onSuccess();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Tournament</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tournament-form">
          <div className="form-group">
            <label>Tournament Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter tournament name"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter tournament description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Max Teams *</label>
            <input
              type="number"
              name="maxSlots"
              value={formData.maxSlots}
              onChange={handleInputChange}
              required
              min="1"
              max="20"
            />
          </div>

          <div className="form-group">
            <label>Tournament Image</label>
            <div className="image-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                id="edit-tournament-image"
                style={{ display: 'none' }}
              />
              <label htmlFor="edit-tournament-image" className="image-upload-btn">
                <FaImage /> Choose New Image
              </label>
              {formData.tournamentImage && (
                <span className="selected-file">{formData.tournamentImage.name}</span>
              )}
              {tournament.tournamentImage && !formData.tournamentImage && (
                <div className="current-image">
                  <img src={`${API_ENDPOINTS}${tournament.tournamentImage}`} alt="Current" />
                  <span>Current image</span>
                </div>
              )}
            </div>
          </div>

          {/* Team Management Section */}
          <div className="form-group" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ marginBottom: 0, fontSize: '1.1rem', fontWeight: '600' }}>Manage Teams</label>
              <button
                type="button"
                onClick={() => setShowTeamManagement(!showTeamManagement)}
                style={{
                  background: showTeamManagement ? '#ef4444' : '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                {showTeamManagement ? 'Hide Teams' : 'Show Teams'}
              </button>
            </div>

            {showTeamManagement && (
              <div style={{ marginTop: '1rem' }}>
                {/* Subscribed Teams */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                    Subscribed Teams ({subscribedTeams.length}/{formData.maxSlots})
                  </h4>
                  {subscribedTeams.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No teams subscribed yet.</p>
                  ) : (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                      gap: '0.75rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      padding: '0.5rem',
                      background: '#f9fafb',
                      borderRadius: '8px'
                    }}>
                      {subscribedTeams.map((team, index) => (
                        <div
                          key={team.userId?._id || team.userId || index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            background: 'white',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                            {team.teamImage && (
                              <img
                                src={`${API_ENDPOINTS}${team.teamImage}`}
                                alt={team.teamName}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                              {team.teamName || 'Unknown Team'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveTeam(team.userId?._id || team.userId)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            title="Remove team"
                          >
                            <FaTimes /> Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Teams */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                    Available Teams ({availableTeams.length})
                  </h4>
                  {loadingTeams ? (
                    <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading teams...</p>
                  ) : availableTeams.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No available teams to add.</p>
                  ) : (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                      gap: '0.75rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      padding: '0.5rem',
                      background: '#f9fafb',
                      borderRadius: '8px'
                    }}>
                      {availableTeams.map((team) => (
                        <div
                          key={team._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            background: 'white',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                            {team.teamImage && (
                              <img
                                src={`${API_ENDPOINTS}${team.teamImage}`}
                                alt={team.teamName}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                              {team.teamName || 'Unknown Team'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddTeam(team._id)}
                            disabled={subscribedTeams.length >= formData.maxSlots}
                            style={{
                              background: subscribedTeams.length >= formData.maxSlots ? '#d1d5db' : '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '0.25rem 0.5rem',
                              cursor: subscribedTeams.length >= formData.maxSlots ? 'not-allowed' : 'pointer',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              opacity: subscribedTeams.length >= formData.maxSlots ? 0.6 : 1
                            }}
                            title={subscribedTeams.length >= formData.maxSlots ? 'Tournament is full' : 'Add team'}
                          >
                            <FaPlus /> Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Tournament Detail Modal Component
const TournamentDetailModal = ({ tournament, onClose, onSubscribe, onUnsubscribe, canSubscribe, isSubscribed }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [fixtures, setFixtures] = useState([]);
  const [pointTable, setPointTable] = useState([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [loadingPointTable, setLoadingPointTable] = useState(false);
  const [showEditFixtureModal, setShowEditFixtureModal] = useState(false);
  const [editingFixture, setEditingFixture] = useState(null);
  const [roundRobinStatus, setRoundRobinStatus] = useState(null);
  const [generatingKnockout, setGeneratingKnockout] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return '#3B82F6';
      case 'running': return '#10B981';
      case 'completed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'running': return 'Running';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const getTournamentStatus = (tournament) => {
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);

    if (startDate > now) return 'upcoming';
    if (endDate < now) return 'completed';
    return 'running';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const fetchFixtures = async () => {
    setLoadingFixtures(true);
    try {
      const cachedUser = localStorage.getItem('user');
      const userId = cachedUser ? JSON.parse(cachedUser).id : null;
      
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournament._id}/fixtures`, {
        headers: {
          'user-id': userId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFixtures(data.fixtures || []);
      } else {
        console.error('Failed to fetch fixtures');
        setFixtures([]);
      }
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      setFixtures([]);
    } finally {
      setLoadingFixtures(false);
    }
  };

  const fetchPointTable = async () => {
    setLoadingPointTable(true);
    try {
      const cachedUser = localStorage.getItem('user');
      const userId = cachedUser ? JSON.parse(cachedUser).id : null;
      
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournament._id}/point-table`, {
        headers: {
          'user-id': userId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPointTable(data.pointTable || []);
      } else {
        console.error('Failed to fetch point table');
        setPointTable([]);
      }
    } catch (error) {
      console.error('Error fetching point table:', error);
      setPointTable([]);
    } finally {
      setLoadingPointTable(false);
    }
  };

  const fetchRoundRobinStatus = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournament._id}/round-robin-status`);
      if (response.ok) {
        const data = await response.json();
        setRoundRobinStatus(data);
      }
    } catch (error) {
      console.error('Error fetching round-robin status:', error);
    }
  };

  const generateKnockout = async () => {
    try {
      setGeneratingKnockout(true);
      const cachedUser = localStorage.getItem('user');
      const userId = cachedUser ? JSON.parse(cachedUser).id : null;
      
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournament._id}/generate-knockout`, {
        method: 'POST',
        headers: {
          'user-id': userId
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Knockout fixtures generated! Semi-finals: ${data.top4[0].teamName} vs ${data.top4[3].teamName}, ${data.top4[1].teamName} vs ${data.top4[2].teamName}`);
        fetchFixtures();
        fetchRoundRobinStatus();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate knockout fixtures');
      }
    } catch (error) {
      console.error('Error generating knockout:', error);
      alert('Failed to generate knockout fixtures');
    } finally {
      setGeneratingKnockout(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'fixtures') {
      fetchFixtures();
      fetchRoundRobinStatus(); // Check for all tournaments, not just World Cup
    } else if (activeTab === 'points') {
      fetchPointTable();
      fetchRoundRobinStatus(); // Also check status for point table to show Q/E icons
    }
  }, [activeTab]);

  const status = getTournamentStatus(tournament);

  return (
    <div className="modal-overlay">
      <div className="modal-content tournament-detail-modal">
        <div className="modal-header">
          <h2>{tournament.name}</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="tournament-detail-content">
          <div className="tournament-detail-header">
            <div className="tournament-detail-image">
              {tournament.tournamentImage ? (
                <img 
                  src={`${API_ENDPOINTS}${tournament.tournamentImage}`} 
                  alt={tournament.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="default-image" style={{ display: tournament.tournamentImage ? 'none' : 'flex' }}>
                <FaTrophy />
              </div>
              <div className="tournament-status" style={{ backgroundColor: getStatusColor(status) }}>
                {getStatusText(status)}
              </div>
              {tournament.winner?.teamName && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  color: '#000',
                  padding: '1rem 1.5rem',
                  borderRadius: '15px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  boxShadow: '0 6px 20px rgba(255, 215, 0, 0.6)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '3px solid #FF8C00',
                  animation: 'pulse 2s infinite'
                }}>
                  <span style={{ fontSize: '2rem' }}>🏆</span>
                  <span>CHAMPION</span>
                  <span style={{ fontSize: '0.9rem', textAlign: 'center' }}>{tournament.winner.teamName}</span>
                  {tournament.winner.teamImage && (
                    <img 
                      src={`${API_ENDPOINTS}${tournament.winner.teamImage}`}
                      alt={tournament.winner.teamName}
                      style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #FF8C00' }}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="tournament-detail-info">
              {tournament.description && (
                <p className="tournament-description">{tournament.description}</p>
              )}
              
              <div className="tournament-details">
                <div className="detail-item">
                  <FaCalendarAlt />
                  <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
                </div>
                
                <div className="detail-item">
                  <FaUsers />
                  <span>{tournament.subscriptionCount}/{tournament.maxSlots} teams</span>
                  <span className="slots-left">({tournament.slotsLeft} slots left)</span>
                </div>
              </div>

              {/* Only show add/remove team buttons for admins */}
              {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).isAdmin && (
                <div className="tournament-detail-actions">
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    Admin: Use the remove button (×) next to each team to remove them from the tournament.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="tournament-detail-tabs">
            <button 
              className={activeTab === 'info' ? 'active' : ''}
              onClick={() => setActiveTab('info')}
            >
              Tournament Info
            </button>
            <button 
              className={activeTab === 'fixtures' ? 'active' : ''}
              onClick={() => setActiveTab('fixtures')}
            >
              <FaList /> Fixtures
            </button>
            <button 
              className={activeTab === 'points' ? 'active' : ''}
              onClick={() => setActiveTab('points')}
            >
              <FaTable /> Points Table
            </button>
            {(localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).isAdmin) || isSubscribed ? (
              <button 
                className={activeTab === 'manage' ? 'active' : ''}
                onClick={() => setActiveTab('manage')}
              >
                <FaEdit /> {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).isAdmin ? 'Manage' : 'My Fixtures'}
              </button>
            ) : null}
          </div>

          <div className="tournament-detail-tab-content">
            {activeTab === 'info' && (
              <div className="tournament-info-content">
                <h3>Subscribed Teams</h3>
                <div className="team-list">
                  {tournament.subscribedTeams.map((team, index) => (
                    <div key={index} className="team-item">
                      <img 
                        src={team.teamImage ? `${API_ENDPOINTS}${team.teamImage}` : '/images/default-team.png'} 
                        alt={team.teamName}
                        className="team-logo"
                        onError={(e) => {
                          e.target.src = '/images/default-team.png';
                        }}
                      />
                      <span className="team-name">{team.teamName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'fixtures' && (
              <div className="fixtures-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Tournament Fixtures</h3>
                  {roundRobinStatus && roundRobinStatus.canGenerateKnockout && (
                    (() => {
                      const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
                      const isAdmin = currentUser?.isAdmin;
                      return isAdmin ? (
                        <button
                          onClick={generateKnockout}
                          disabled={generatingKnockout}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '8px',
                            cursor: generatingKnockout ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            opacity: generatingKnockout ? 0.7 : 1
                          }}
                        >
                          {generatingKnockout ? 'Generating...' : 'Initialize Knockout (Top 4)'}
                        </button>
                      ) : null;
                    })()
                  )}
                </div>
                {roundRobinStatus && (
                  <div style={{ 
                    padding: '0.75rem', 
                    marginBottom: '1rem', 
                    background: roundRobinStatus.allComplete ? '#d4edda' : '#fff3cd',
                    borderRadius: '8px',
                    color: roundRobinStatus.allComplete ? '#155724' : '#856404'
                  }}>
                    <strong>Round-Robin Progress:</strong> {roundRobinStatus.completedRoundRobin}/{roundRobinStatus.totalRoundRobin} matches completed
                    {roundRobinStatus.allComplete && !roundRobinStatus.hasKnockout && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        ✅ All round-robin matches complete! Click "Initialize Knockout" to create semi-finals and final.
                      </div>
                    )}
                  </div>
                )}
                {loadingFixtures ? (
                  <div className="loading">Loading fixtures...</div>
                ) : fixtures.length === 0 ? (
                  <div className="no-fixtures">
                    <p>No fixtures generated yet. Admin can generate round-robin fixtures from the Manage tab.</p>
                  </div>
                ) : (
                  <div className="fixtures-list">
                    {(() => {
                      // Separate round-robin and knockout fixtures
                      const roundRobinFixtures = fixtures.filter(f => 
                        !f.team1?.includes('Winner of') && !f.team1?.includes('Top ')
                      );
                      const knockoutFixtures = fixtures.filter(f => 
                        f.team1?.includes('Winner of') || f.team1?.includes('Top ')
                      );
                      
                      return (
                        <>
                          {roundRobinFixtures.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                              <h4 style={{ 
                                color: '#374151', 
                                fontSize: '1.1rem', 
                                fontWeight: '600', 
                                marginBottom: '1rem',
                                paddingBottom: '0.5rem',
                                borderBottom: '2px solid #e5e7eb'
                              }}>
                                Round-Robin Matches ({roundRobinFixtures.length})
                              </h4>
                              {roundRobinFixtures.map((fixture, index) => (
                                <div key={index} className={`fixture-card ${fixture.winner ? 'completed' : 'pending'}`}>
                                  <div className="fixture-header">
                                    <span className="match-number">Match #{index + 1}</span>
                          {(() => {
                            const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
                            const isAdmin = currentUser?.isAdmin;
                            
                            // Only admin can edit fixtures
                            if (isAdmin) {
                              return (
                                <button 
                                  className="edit-fixture-btn"
                                  onClick={() => {
                                    setEditingFixture({ ...fixture, fixtureIndex: index });
                                    setShowEditFixtureModal(true);
                                  }}
                                >
                                  <FaEdit /> Edit
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="fixture-body">
                          <div className={`team-section ${fixture.winner === fixture.team1 ? 'winner' : fixture.winner ? 'loser' : ''}`}>
                            <span className="team-name">{fixture.team1}</span>
                            {fixture.team1Score !== undefined && (
                              <span className="team-score">{fixture.team1Score}</span>
                            )}
                          </div>
                          <div className="vs-section">VS</div>
                          <div className={`team-section ${fixture.winner === fixture.team2 ? 'winner' : fixture.winner ? 'loser' : ''}`}>
                            <span className="team-name">{fixture.team2}</span>
                            {fixture.team2Score !== undefined && (
                              <span className="team-score">{fixture.team2Score}</span>
                            )}
                          </div>
                        </div>
                        {fixture.margin && (
                          <div className="fixture-margin">
                            Margin: {fixture.margin}
                          </div>
                        )}
                        {fixture.mom && fixture.mom.name && (
                          <div className="fixture-mom">
                            <div className="mom-header">⭐ Man of the Match</div>
                            <div className="mom-info">
                              <div><strong>{fixture.mom.name}</strong></div>
                              {fixture.mom.score && <div>Batting: {fixture.mom.score}</div>}
                              {fixture.mom.wickets && <div>Wickets: {fixture.mom.wickets}</div>}
                            </div>
                          </div>
                        )}
                        {fixture.winner && (
                          <div className="fixture-winner-badge">
                            🏆 Winner: {fixture.winner}
                          </div>
                        )}
                      </div>
                    ))}
                            </div>
                          )}
                          {knockoutFixtures.length > 0 && (
                            <div>
                              <h4 style={{ 
                                color: '#FF8C00', 
                                fontSize: '1.2rem', 
                                fontWeight: 'bold', 
                                marginBottom: '1rem',
                                marginTop: '2rem',
                                paddingBottom: '0.5rem',
                                borderBottom: '3px solid #FFD700',
                                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%)',
                                padding: '0.75rem',
                                borderRadius: '8px'
                              }}>
                                🏆 Knockout Stage ({knockoutFixtures.length} matches)
                              </h4>
                              {knockoutFixtures.map((fixture, index) => {
                                const fixtureIndex = roundRobinFixtures.length + index;
                                const matchLabel = fixture.team1 === 'Winner of Semi-Final 1' 
                                  ? '🏆 FINAL' 
                                  : (index === 0 ? '⚡ SEMI-FINAL 1 (Top 1 vs Top 4)' : '⚡ SEMI-FINAL 2 (Top 2 vs Top 3)');
                                
                                return (
                                  <div key={fixtureIndex} className={`fixture-card ${fixture.winner ? 'completed' : 'pending'}`} style={{ 
                                    border: '3px solid #FFD700', 
                                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%)',
                                    marginBottom: '1rem'
                                  }}>
                                    <div className="fixture-header">
                                      <span className="match-number" style={{ color: '#FF8C00', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                        {matchLabel}
                                      </span>
                                      {(() => {
                                        const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
                                        const isAdmin = currentUser?.isAdmin;
                                        
                                        // Only admin can edit fixtures
                                        if (isAdmin) {
                                          return (
                                            <button 
                                              className="edit-fixture-btn"
                                              onClick={() => {
                                                setEditingFixture({ ...fixture, fixtureIndex: fixtureIndex });
                                                setShowEditFixtureModal(true);
                                              }}
                                            >
                                              <FaEdit /> Edit
                                            </button>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                    <div className="fixture-body">
                                      <div className={`team-section ${fixture.winner === fixture.team1 ? 'winner' : fixture.winner ? 'loser' : ''}`}>
                                        <span className="team-name">{fixture.team1}</span>
                                        {fixture.team1Score !== undefined && (
                                          <span className="team-score">{fixture.team1Score}</span>
                                        )}
                                      </div>
                                      <div className="vs-section">VS</div>
                                      <div className={`team-section ${fixture.winner === fixture.team2 ? 'winner' : fixture.winner ? 'loser' : ''}`}>
                                        <span className="team-name">{fixture.team2}</span>
                                        {fixture.team2Score !== undefined && (
                                          <span className="team-score">{fixture.team2Score}</span>
                                        )}
                                      </div>
                                    </div>
                                    {fixture.margin && (
                                      <div className="fixture-margin">
                                        Margin: {fixture.margin}
                                      </div>
                                    )}
                                    {fixture.mom && fixture.mom.name && (
                                      <div className="fixture-mom">
                                        <div className="mom-header">⭐ Man of the Match</div>
                                        <div className="mom-info">
                                          <div><strong>{fixture.mom.name}</strong></div>
                                          {fixture.mom.score && <div>Batting: {fixture.mom.score}</div>}
                                          {fixture.mom.wickets && <div>Wickets: {fixture.mom.wickets}</div>}
                                        </div>
                                      </div>
                                    )}
                                    {fixture.winner && (
                                      <div className="fixture-winner-badge">
                                        🏆 Winner: {fixture.winner}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'points' && (
              <div className="points-content">
                <h3>Points Table</h3>
                {loadingPointTable ? (
                  <div className="loading">Loading points table...</div>
                ) : (
                  <div className="points-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Team</th>
                          <th>Matches</th>
                          <th>Won</th>
                          <th>Lost</th>
                          <th>Points</th>
                          <th>Fairness</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pointTable.map((team, index) => {
                          // Check if all round-robin matches are complete to show Q/E icons
                          const allRoundRobinComplete = roundRobinStatus?.allComplete || false;
                          const showQ = allRoundRobinComplete && index < 4; // Top 4 get Q icon
                          const showE = allRoundRobinComplete && index >= 4; // Last 4 get E icon
                          
                          return (
                            <tr key={index}>
                              <td>
                                {team.teamName}
                                {showQ && (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: '8px',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    background: '#28a745',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    lineHeight: '1',
                                    fontWeight: '800'
                                  }} title="Qualified (Top 4)">Q</span>
                                )}
                                {showE && (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: '8px',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    background: '#dc3545',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    lineHeight: '1',
                                    fontWeight: '800'
                                  }} title="Eliminated">E</span>
                                )}
                              </td>
                              <td>{team.matches}</td>
                              <td>{team.won}</td>
                              <td>{team.lost}</td>
                              <td>{team.points}</td>
                              <td>
                                <span className={`fairness-tag fairness-${team.fairness > 70 ? 'high' : team.fairness > 40 ? 'medium' : 'low'}`}>
                                  {team.fairness}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'manage' && (
              <div className="manage-content">
                <h3>{localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).isAdmin ? 'Tournament Management' : 'My Tournament Fixtures'}</h3>
                <div className="admin-management">
                  {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).isAdmin && (
                    <div className="management-section">
                      <h4>Fixture Management</h4>
                      {tournament.tournamentFixtures && tournament.tournamentFixtures.length > 0 ? (
                        <>
                          <p>✅ Fixtures have been generated. Click below to view and edit fixtures.</p>
                          <div className="fixtures-info">
                            <span>Total Fixtures: <strong>{tournament.tournamentFixtures.length}</strong></span>
                          </div>
                          <button 
                            className="manage-btn" 
                            onClick={() => setActiveTab('fixtures')}
                          >
                            <FaList /> View & Edit Fixtures
                          </button>
                        </>
                      ) : (
                        <>
                          <p>Generate round-robin fixtures where each team plays with every other team. Point table will be automatically initialized.</p>
                          <button 
                          className="manage-btn generate-fixtures-btn" 
                          onClick={async () => {
                            if (!window.confirm('Generate round-robin fixtures for all subscribed teams? This will create a match between every pair of teams.')) {
                              return;
                            }
                            
                            try {
                              const cachedUser = localStorage.getItem('user');
                              const userId = cachedUser ? JSON.parse(cachedUser).id : null;
                              
                              const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournament._id}/generate-fixtures`, {
                                method: 'POST',
                                headers: {
                                  'user-id': userId,
                                  'Content-Type': 'application/json'
                                }
                              });

                              if (response.ok) {
                                const data = await response.json();
                                alert(`Success! Generated ${data.fixtures.length} fixtures for ${data.teamsCount} teams.`);
                                // Refresh to show fixtures
                                window.location.reload();
                              } else {
                                const errorData = await response.json();
                                alert(errorData.error || 'Failed to generate fixtures');
                              }
                            } catch (error) {
                              alert('Error generating fixtures');
                            }
                          }}
                        >
                          <FaList /> Generate Round-Robin Fixtures
                        </button>
                      </>
                    )}
                    </div>
                  )}
                  
                  {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).isAdmin && (
                    <div className="management-section">
                    <h4>Point Table</h4>
                    <p>Point table shows all subscribed teams and updates automatically when match results are entered.</p>
                    <button className="manage-btn" onClick={() => setActiveTab('points')}>
                      <FaTable /> View Point Table
                    </button>
                    </div>
                  )}
                  
                  {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).isAdmin && (
                    <div className="management-section">
                    <h4>Tournament Lock</h4>
                    <p>Lock tournament to prevent team withdrawals. Once locked, teams cannot withdraw from the tournament.</p>
                    <button 
                      className={`manage-btn ${tournament.isLocked ? 'locked-btn' : 'unlock-btn'}`}
                      onClick={async () => {
                        try {
                          const cachedUser = localStorage.getItem('user');
                          const userId = cachedUser ? JSON.parse(cachedUser).id : null;
                          
                          const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournament._id}/lock`, {
                            method: 'POST',
                            headers: {
                              'user-id': userId
                            }
                          });

                          if (response.ok) {
                            const data = await response.json();
                            alert(data.message);
                            // Refresh tournament data
                            window.location.reload();
                          } else {
                            const errorData = await response.json();
                            alert(errorData.error || 'Failed to toggle tournament lock');
                          }
                        } catch (error) {
                          alert('Error toggling tournament lock');
                        }
                      }}
                    >
                      {tournament.isLocked ? '🔓 Unlock Tournament' : '🔒 Lock Tournament'}
                    </button>
                    </div>
                  )}
                  
                  {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).isAdmin && (
                    <div className="management-section">
                    <h4>Tournament Settings</h4>
                    <p>Update tournament details, dates, and other settings by clicking the Edit button on the tournament card.</p>
                    <button className="manage-btn" onClick={onClose}>
                      <FaEdit /> Close & Edit Tournament
                    </button>
                    </div>
                  )}
                  
                  {/* For enrolled users (non-admin) - show fixture editing options */}
                  {!localStorage.getItem('user') || !JSON.parse(localStorage.getItem('user')).isAdmin ? (
                    <>
                      <div className="management-section">
                        <h4>My Fixtures</h4>
                        <p>You can edit fixture results for matches involving your team. Click below to view and edit your matches.</p>
                        <div className="fixtures-info">
                          <span>Your Team: <strong>{localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).teamName}</strong></span>
                        </div>
                        <button className="manage-btn" onClick={() => setActiveTab('fixtures')}>
                          <FaList /> View & Edit My Fixtures
                        </button>
                      </div>
                      
                      <div className="management-section">
                        <h4>Point Table</h4>
                        <p>View tournament standings. Point table updates automatically when match results are entered.</p>
                        <button className="manage-btn" onClick={() => setActiveTab('points')}>
                          <FaTable /> View Point Table
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showEditFixtureModal && editingFixture && (
        <EditFixtureModal 
          fixture={editingFixture}
          tournamentId={tournament._id}
          onClose={() => {
            setShowEditFixtureModal(false);
            setEditingFixture(null);
          }}
          onSuccess={() => {
            setShowEditFixtureModal(false);
            setEditingFixture(null);
            fetchFixtures();
            fetchPointTable();
          }}
        />
      )}
    </div>
  );
};

// Edit Fixture Modal Component
const EditFixtureModal = ({ fixture, tournamentId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    team1: fixture.team1,
    team2: fixture.team2,
    winner: fixture.winner || '',
    margin: fixture.margin || '',
    team1Score: fixture.team1Score || '',
    team2Score: fixture.team2Score || '',
    team1Fairness: fixture.team1Fairness || '',
    team2Fairness: fixture.team2Fairness || '',
    mom: {
      name: fixture.mom?.name || '',
      score: fixture.mom?.score || '',
      wickets: fixture.mom?.wickets || ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMomChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      mom: {
        ...prev.mom,
        [name]: value
      }
    }));
  };

  // Load players from both teams (from fixture details)
  useEffect(() => {
    const allPlayers = [
      ...(fixture.team1Details?.players || []),
      ...(fixture.team2Details?.players || [])
    ];
    setPlayers(allPlayers.map(p => p.name));
  }, [fixture]);

  const handleWinnerChange = (value) => {
    setFormData(prev => ({ ...prev, winner: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cachedUser = localStorage.getItem('user');
      const userId = cachedUser ? JSON.parse(cachedUser).id : null;
      
      // Prepare data with proper type conversion (matching main fixture format)
      const updateData = {
        winner: formData.winner,
        margin: formData.margin,
        team1Score: formData.team1Score,
        team2Score: formData.team2Score,
        team1Fairness: formData.team1Fairness ? Number(formData.team1Fairness) : 0,
        team2Fairness: formData.team2Fairness ? Number(formData.team2Fairness) : 0,
        mom: {
          name: formData.mom.name || null,
          score: formData.mom.score ? Number(formData.mom.score) : null,
          wickets: formData.mom.wickets ? Number(formData.mom.wickets) : null
        }
      };
      
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournamentId}/fixtures/${fixture.fixtureIndex}`, {
        method: 'PUT',
        headers: {
          'user-id': userId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update fixture');
      }

      alert('Fixture updated successfully! Point table has been updated.');
      onSuccess();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Fixture</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tournament-form">
          <div className="fixture-teams-display">
            <div className="team-display">
              <strong>{formData.team1}</strong>
            </div>
            <div className="vs-display">VS</div>
            <div className="team-display">
              <strong>{formData.team2}</strong>
            </div>
          </div>

          <div className="form-group">
            <label>Winner</label>
            <select
              name="winner"
              value={formData.winner}
              onChange={(e) => handleWinnerChange(e.target.value)}
            >
              <option value="">-- Select Winner --</option>
              <option value={formData.team1}>{formData.team1}</option>
              <option value={formData.team2}>{formData.team2}</option>
            </select>
          </div>

          <div className="form-group">
            <label>Margin (e.g., 5 runs or 2 wickets)</label>
            <input
              type="text"
              name="margin"
              value={formData.margin}
              onChange={handleInputChange}
              placeholder="e.g., 5 runs or 2 wickets"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{formData.team1} Score</label>
              <input
                type="text"
                name="team1Score"
                value={formData.team1Score}
                onChange={handleInputChange}
                placeholder="Enter score"
              />
            </div>

            <div className="form-group">
              <label>{formData.team2} Score</label>
              <input
                type="text"
                name="team2Score"
                value={formData.team2Score}
                onChange={handleInputChange}
                placeholder="Enter score"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Man of the Match</label>
            <select
              name="momName"
              value={formData.mom.name}
              onChange={(e) => handleMomChange('name', e.target.value)}
            >
              <option value="">-- Select Man of the Match --</option>
              {players.map((player, idx) => (
                <option key={idx} value={player}>{player}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>MoM Batting Score</label>
              <input
                type="number"
                name="momScore"
                value={formData.mom.score}
                onChange={(e) => handleMomChange('score', e.target.value)}
                placeholder="Batting score"
              />
            </div>

            <div className="form-group">
              <label>MoM Bowling Wickets</label>
              <input
                type="number"
                name="momWickets"
                value={formData.mom.wickets}
                onChange={(e) => handleMomChange('wickets', e.target.value)}
                placeholder="Wickets taken"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fairness for {formData.team1}</label>
              <input
                type="number"
                name="team1Fairness"
                value={formData.team1Fairness}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (Number(value) >= 0 && Number(value) <= 9999 && value.length <= 4)) {
                    handleInputChange(e);
                  }
                }}
                placeholder="0-9999"
                min="0"
                max="9999"
              />
            </div>

            <div className="form-group">
              <label>Fairness for {formData.team2}</label>
              <input
                type="number"
                name="team2Fairness"
                value={formData.team2Fairness}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (Number(value) >= 0 && Number(value) <= 9999 && value.length <= 4)) {
                    handleInputChange(e);
                  }
                }}
                placeholder="0-9999"
                min="0"
                max="9999"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Fixture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TournamentList;
