import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../const';
import { FaCalendarAlt, FaUsers, FaTrophy, FaEdit, FaTrash, FaPlus, FaImage, FaTimes, FaTable, FaList, FaSearch } from 'react-icons/fa';
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
      // Use user.id or user._id (handle both cases)
      const userId = user?.id || user?._id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: {
          'user-id': userId
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
  const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const isAdmin = currentUser?.isAdmin;
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'points');
  const [fixtures, setFixtures] = useState([]);
  const [pointTable, setPointTable] = useState([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [loadingPointTable, setLoadingPointTable] = useState(false);
  const [showEditFixtureModal, setShowEditFixtureModal] = useState(false);
  const [editingFixture, setEditingFixture] = useState(null);
  const [roundRobinStatus, setRoundRobinStatus] = useState(null);
  const [generatingKnockout, setGeneratingKnockout] = useState(false);
  const [fixtureSearchQuery, setFixtureSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamFixtures, setTeamFixtures] = useState([]);
  const [showTeamDetails, setShowTeamDetails] = useState(false);

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

  const calculateQualificationPercentage = (team, index, allTeams) => {
    // If all round-robin matches are complete, show 100% for top 4, 0% for others
    if (roundRobinStatus?.allComplete) {
      return index < 4 ? 100 : 0;
    }

    const teamPoints = Number(team.points) || 0;
    const teamMatches = Number(team.matches) || 0;
    const teamFairness = Number(team.fairness) || 0;
    const teamWon = Number(team.won) || 0;
    const totalTeams = allTeams.length;
    const maxMatches = totalTeams - 1; // Round-robin: each team plays (n-1) matches
    const remainingMatches = maxMatches - teamMatches;
    
    // If no matches played yet, return 50% (neutral)
    if (teamMatches === 0) {
      return 50;
    }

    // Calculate average fairness per match
    const avgFairnessPerMatch = teamMatches > 0 ? teamFairness / teamMatches : 0;
    const targetAvgFairness = 550; // Average fairness target
    const fairnessRatio = avgFairnessPerMatch / targetAvgFairness; // Ratio to target (1.0 = perfect)
    
    // Calculate min and max possible points
    const minPoints = teamPoints; // If lose all remaining
    const maxPoints = teamPoints + (remainingMatches * 2); // If win all remaining
    
    // Calculate min and max possible fairness
    const minFairness = teamFairness; // If get 0 fairness in remaining
    const maxFairness = teamFairness + (remainingMatches * targetAvgFairness); // If get average fairness
    
    // Get other teams' data (excluding current team)
    const otherTeams = allTeams.filter((t, i) => i !== index);
    
    // Calculate what 4th place team currently has
    const sortedOthers = [...otherTeams].sort((a, b) => {
      const pointsDiff = (Number(b.points) || 0) - (Number(a.points) || 0);
      if (pointsDiff !== 0) return pointsDiff;
      return (Number(b.fairness) || 0) - (Number(a.fairness) || 0);
    });
    
    const fourthPlaceTeam = sortedOthers[3] || sortedOthers[sortedOthers.length - 1];
    const fourthPlacePoints = Number(fourthPlaceTeam?.points) || 0;
    const fourthPlaceFairness = Number(fourthPlaceTeam?.fairness) || 0;
    const fourthPlaceMatches = Number(fourthPlaceTeam?.matches) || 0;
    const fourthPlaceRemaining = maxMatches - fourthPlaceMatches;
    
    // Calculate 4th place team's max possible points
    const fourthPlaceMaxPoints = fourthPlacePoints + (fourthPlaceRemaining * 2);
    
    // Check if team is mathematically eliminated
    if (maxPoints < fourthPlacePoints) {
      // Even if team wins all remaining, can't catch 4th place
      return 0;
    }
    
    // Check if team has already clinched (mathematically)
    if (minPoints > fourthPlaceMaxPoints) {
      // Even if 4th place wins all remaining, can't catch this team
      return 100;
    }
    
    // Calculate probability based on multiple factors
    let basePercentage = 0;
    
    // Factor 1: Current position (0-40 points)
    if (index < 4) {
      basePercentage = 60 - (index * 8); // 60% for 1st, 52% for 2nd, 44% for 3rd, 36% for 4th
    } else {
      basePercentage = Math.max(30 - ((index - 3) * 5), 0); // Decreasing for lower positions
    }
    
    // Factor 2: Points gap (0-25 points)
    const pointsGap = teamPoints - fourthPlacePoints;
    let pointsFactor = 0;
    if (pointsGap > 0) {
      // Ahead of 4th place
      pointsFactor = Math.min(pointsGap * 3, 25);
    } else {
      // Behind 4th place
      pointsFactor = Math.max(pointsGap * 2, -20);
    }
    
    // Factor 3: Fairness advantage (0-20 points)
    // Teams with higher fairness have better chance (fairness matters for tie-breakers)
    const fairnessGap = teamFairness - fourthPlaceFairness;
    let fairnessFactor = 0;
    if (fairnessGap > 0) {
      fairnessFactor = Math.min(fairnessGap / 50, 20); // 50 fairness = 1% bonus, max 20%
    } else {
      fairnessFactor = Math.max(fairnessGap / 50, -15); // Penalty for lower fairness
    }
    
    // Factor 4: Fairness performance (0-15 points)
    // If team is performing well in fairness (close to 550 avg), they have better chance
    let fairnessPerformanceFactor = 0;
    if (fairnessRatio >= 1.0) {
      // Above average fairness
      fairnessPerformanceFactor = 15;
    } else if (fairnessRatio >= 0.8) {
      // Close to average
      fairnessPerformanceFactor = 10;
    } else if (fairnessRatio >= 0.6) {
      // Below average but acceptable
      fairnessPerformanceFactor = 5;
    } else {
      // Poor fairness performance
      fairnessPerformanceFactor = -10;
    }
    
    // Factor 5: Remaining matches opportunity (0-10 points)
    const remainingFactor = Math.min(remainingMatches * 2, 10);
    
    // Factor 6: Win rate (0-10 points)
    const winRate = teamMatches > 0 ? teamWon / teamMatches : 0;
    const winRateFactor = winRate * 10; // 100% win rate = 10% bonus
    
    // Calculate final percentage
    let finalPercentage = basePercentage + pointsFactor + fairnessFactor + 
                          fairnessPerformanceFactor + remainingFactor + winRateFactor;
    
    // Adjust based on realistic scenarios
    // If team needs to win all remaining matches to qualify, reduce probability
    const pointsNeeded = Math.max(0, fourthPlacePoints + 1 - teamPoints);
    const winsNeeded = Math.ceil(pointsNeeded / 2);
    if (winsNeeded > remainingMatches) {
      // Can't mathematically qualify
      finalPercentage = 0;
    } else if (winsNeeded === remainingMatches) {
      // Must win all remaining to qualify
      finalPercentage = finalPercentage * 0.5; // Reduce by 50%
    } else if (winsNeeded > remainingMatches * 0.7) {
      // Need to win more than 70% of remaining
      finalPercentage = finalPercentage * 0.7; // Reduce by 30%
    }
    
    // Special case: If two teams have same points, fairness becomes critical
    if (Math.abs(teamPoints - fourthPlacePoints) <= 2 && index >= 3) {
      if (teamFairness > fourthPlaceFairness) {
        finalPercentage += 5; // Small boost for better fairness
      } else {
        finalPercentage -= 5; // Small penalty for worse fairness
      }
    }
    
    return Math.round(Math.max(0, Math.min(100, finalPercentage)));
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

  const fetchTeamFixtures = async (teamName, fixturesToFilter = null) => {
    try {
      const fixturesToUse = fixturesToFilter || fixtures;
      
      // Filter fixtures where the team is either team1 or team2
      const teamMatches = fixturesToUse.filter(fixture => 
        fixture.team1 === teamName || fixture.team2 === teamName
      );
      
      // Sort: completed matches first (by index), then pending matches
      teamMatches.sort((a, b) => {
        const aHasResult = !!a.winner;
        const bHasResult = !!b.winner;
        
        // If one has result and other doesn't, prioritize the one with result
        if (aHasResult && !bHasResult) return -1;
        if (!aHasResult && bHasResult) return 1;
        
        // If both have same status, maintain original order
        return 0;
      });
      
      setTeamFixtures(teamMatches);
    } catch (error) {
      console.error('Error filtering team fixtures:', error);
      setTeamFixtures([]);
    }
  };

  const handleTeamClick = async (team) => {
    setSelectedTeam(team);
    setShowTeamDetails(true);
    
    // Ensure fixtures are loaded before filtering
    if (fixtures.length === 0) {
      await fetchFixtures();
      // After fetching, filter with the new fixtures
      // We'll use useEffect to handle this
    } else {
      // Fixtures already loaded, filter immediately
      fetchTeamFixtures(team.teamName);
    }
  };

  const closeTeamDetails = () => {
    setShowTeamDetails(false);
    setSelectedTeam(null);
    setTeamFixtures([]);
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

  // Refetch team fixtures when fixtures change (if team details modal is open)
  useEffect(() => {
    if (showTeamDetails && selectedTeam && fixtures.length > 0) {
      fetchTeamFixtures(selectedTeam.teamName, fixtures);
    }
  }, [fixtures, showTeamDetails, selectedTeam]);

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
          <div className="tournament-detail-tabs">
            <button 
              className={activeTab === 'points' ? 'active' : ''}
              onClick={() => setActiveTab('points')}
            >
              <FaTable /> Points Table
            </button>
            <button 
              className={activeTab === 'fixtures' ? 'active' : ''}
              onClick={() => setActiveTab('fixtures')}
            >
              <FaList /> Fixtures
            </button>
            {isAdmin && (
              <button 
                className={activeTab === 'manage' ? 'active' : ''}
                onClick={() => setActiveTab('manage')}
              >
                <FaEdit /> Manage
              </button>
            )}
          </div>

          <div className="tournament-detail-tab-content">
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
                  <>
                    {/* Search Bar */}
                    <div style={{
                      marginBottom: '1.5rem',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <FaSearch style={{
                          position: 'absolute',
                          left: '15px',
                          color: '#6b7280',
                          fontSize: '1rem'
                        }} />
                        <input
                          type="text"
                          placeholder="Search fixtures by team name..."
                          value={fixtureSearchQuery}
                          onChange={(e) => setFixtureSearchQuery(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 15px 12px 45px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#667eea';
                            e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                          }}
                        />
                        {fixtureSearchQuery && (
                          <button
                            onClick={() => setFixtureSearchQuery('')}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#6b7280',
                              padding: '5px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Clear search"
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="fixtures-list">
                      {(() => {
                        // Filter fixtures based on search query
                        const filterFixtures = (fixtureList) => {
                          if (!fixtureSearchQuery.trim()) return fixtureList;
                          const query = fixtureSearchQuery.toLowerCase();
                          return fixtureList.filter(f => 
                            f.team1?.toLowerCase().includes(query) ||
                            f.team2?.toLowerCase().includes(query) ||
                            f.winner?.toLowerCase().includes(query) ||
                            f.mom?.name?.toLowerCase().includes(query)
                          );
                        };

                        // Sort fixtures: completed first, then pending
                        const sortFixtures = (fixtureList) => {
                          return [...fixtureList].sort((a, b) => {
                            const aCompleted = !!a.winner;
                            const bCompleted = !!b.winner;
                            if (aCompleted && !bCompleted) return -1;
                            if (!aCompleted && bCompleted) return 1;
                            return 0;
                          });
                        };

                        // Separate round-robin and knockout fixtures
                        let roundRobinFixtures = fixtures.filter(f => 
                          !f.team1?.includes('Winner of') && !f.team1?.includes('Top ')
                        );
                        let knockoutFixtures = fixtures.filter(f => 
                          f.team1?.includes('Winner of') || f.team1?.includes('Top ')
                        );

                        // Sort both lists
                        roundRobinFixtures = sortFixtures(roundRobinFixtures);
                        knockoutFixtures = sortFixtures(knockoutFixtures);

                        // Filter based on search
                        roundRobinFixtures = filterFixtures(roundRobinFixtures);
                        knockoutFixtures = filterFixtures(knockoutFixtures);
                      
                        const hasNoResults = fixtureSearchQuery && roundRobinFixtures.length === 0 && knockoutFixtures.length === 0;
                      
                      return (
                        <>
                          {hasNoResults ? (
                            <div style={{
                              textAlign: 'center',
                              padding: '3rem 1rem',
                              color: '#6b7280'
                            }}>
                              <FaSearch style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
                              <p style={{ fontSize: '1.1rem', margin: 0 }}>No fixtures found matching "{fixtureSearchQuery}"</p>
                              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>Try searching with a different team name</p>
                            </div>
                          ) : (
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
                              {roundRobinFixtures.map((fixture, index) => {
                                // Find the actual index in the original fixtures array
                                // Match by team names and other unique properties to find exact fixture
                                const actualIndex = fixtures.findIndex(f => {
                                  // Must match both teams
                                  const teamsMatch = (f.team1 === fixture.team1 && f.team2 === fixture.team2) ||
                                                    (f.team1 === fixture.team2 && f.team2 === fixture.team1);
                                  if (!teamsMatch) return false;
                                  
                                  // Must be round-robin (not knockout)
                                  const isRoundRobin = !f.team1?.includes('Winner of') && !f.team1?.includes('Top ');
                                  if (!isRoundRobin) return false;
                                  
                                  // If scores exist, they should match
                                  if (fixture.team1Score !== undefined && f.team1Score !== fixture.team1Score) return false;
                                  if (fixture.team2Score !== undefined && f.team2Score !== fixture.team2Score) return false;
                                  
                                  return true;
                                });
                                
                                return (
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
                                    setEditingFixture({ ...fixture, fixtureIndex: actualIndex !== -1 ? actualIndex : index });
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
                            {fixture.team1Fairness !== undefined && fixture.team1Fairness !== null && (
                              <span className="team-fairness" style={{
                                fontSize: '0.75rem',
                                marginTop: '4px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: fixture.winner === fixture.team1 ? '#d4edda' : fixture.winner ? '#f8d7da' : '#e9ecef',
                                color: fixture.winner === fixture.team1 ? '#155724' : fixture.winner ? '#721c24' : '#495057',
                                fontWeight: '600'
                              }}>
                                Fairness: {fixture.team1Fairness}
                              </span>
                            )}
                          </div>
                          <div className="vs-section">VS</div>
                          <div className={`team-section ${fixture.winner === fixture.team2 ? 'winner' : fixture.winner ? 'loser' : ''}`}>
                            <span className="team-name">{fixture.team2}</span>
                            {fixture.team2Score !== undefined && (
                              <span className="team-score">{fixture.team2Score}</span>
                            )}
                            {fixture.team2Fairness !== undefined && fixture.team2Fairness !== null && (
                              <span className="team-fairness" style={{
                                fontSize: '0.75rem',
                                marginTop: '4px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: fixture.winner === fixture.team2 ? '#d4edda' : fixture.winner ? '#f8d7da' : '#e9ecef',
                                color: fixture.winner === fixture.team2 ? '#155724' : fixture.winner ? '#721c24' : '#495057',
                                fontWeight: '600'
                              }}>
                                Fairness: {fixture.team2Fairness}
                              </span>
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
                                // Find the actual index in the original fixtures array
                                // Match by team names and knockout stage identifiers
                                const actualIndex = fixtures.findIndex(f => {
                                  // Must match both teams exactly
                                  const teamsMatch = f.team1 === fixture.team1 && f.team2 === fixture.team2;
                                  if (!teamsMatch) return false;
                                  
                                  // Must be knockout (has Winner of or Top)
                                  const isKnockout = f.team1?.includes('Winner of') || f.team1?.includes('Top ') || 
                                                    f.team2?.includes('Winner of') || f.team2?.includes('Top ');
                                  if (!isKnockout) return false;
                                  
                                  // If scores exist, they should match
                                  if (fixture.team1Score !== undefined && f.team1Score !== fixture.team1Score) return false;
                                  if (fixture.team2Score !== undefined && f.team2Score !== fixture.team2Score) return false;
                                  
                                  return true;
                                });
                                
                                const matchLabel = fixture.team1 === 'Winner of Semi-Final 1' 
                                  ? '🏆 FINAL' 
                                  : (index === 0 ? '⚡ SEMI-FINAL 1 (Top 1 vs Top 4)' : '⚡ SEMI-FINAL 2 (Top 2 vs Top 3)');
                                
                                return (
                                  <div key={actualIndex !== -1 ? actualIndex : index} className={`fixture-card ${fixture.winner ? 'completed' : 'pending'}`} style={{ 
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
                                                setEditingFixture({ ...fixture, fixtureIndex: actualIndex !== -1 ? actualIndex : fixtures.length + index });
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
                                        {fixture.team1Fairness !== undefined && fixture.team1Fairness !== null && (
                                          <span className="team-fairness" style={{
                                            fontSize: '0.75rem',
                                            marginTop: '4px',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: fixture.winner === fixture.team1 ? '#d4edda' : fixture.winner ? '#f8d7da' : '#e9ecef',
                                            color: fixture.winner === fixture.team1 ? '#155724' : fixture.winner ? '#721c24' : '#495057',
                                            fontWeight: '600'
                                          }}>
                                            Fairness: {fixture.team1Fairness}
                                          </span>
                                        )}
                                      </div>
                                      <div className="vs-section">VS</div>
                                      <div className={`team-section ${fixture.winner === fixture.team2 ? 'winner' : fixture.winner ? 'loser' : ''}`}>
                                        <span className="team-name">{fixture.team2}</span>
                                        {fixture.team2Score !== undefined && (
                                          <span className="team-score">{fixture.team2Score}</span>
                                        )}
                                        {fixture.team2Fairness !== undefined && fixture.team2Fairness !== null && (
                                          <span className="team-fairness" style={{
                                            fontSize: '0.75rem',
                                            marginTop: '4px',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: fixture.winner === fixture.team2 ? '#d4edda' : fixture.winner ? '#f8d7da' : '#e9ecef',
                                            color: fixture.winner === fixture.team2 ? '#155724' : fixture.winner ? '#721c24' : '#495057',
                                            fontWeight: '600'
                                          }}>
                                            Fairness: {fixture.team2Fairness}
                                          </span>
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
                          )}
                        </>
                      );
                    })()}
                  </div>
                  </>
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
                          <th>M</th>
                          <th>Won</th>
                          <th>Lost</th>
                          <th>Points</th>
                          <th>Fairness</th>
                          <th>Q%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pointTable.map((team, index) => {
                          // Check if all round-robin matches are complete to show Q/E icons
                          const allRoundRobinComplete = roundRobinStatus?.allComplete || false;
                          const showQ = allRoundRobinComplete && index < 4; // Top 4 get Q icon
                          const showE = allRoundRobinComplete && index >= 4; // Last 4 get E icon
                          
                          // Calculate qualification percentage
                          const qualPercentage = calculateQualificationPercentage(team, index, pointTable);
                          
                          return (
                            <tr 
                              key={index}
                              onClick={() => handleTeamClick(team)}
                              style={{
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8fafc';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '';
                              }}
                              title={`${team.teamName} - Click to view match history`}
                            >
                              <td>
                                <span 
                                  style={{ 
                                    color: '#3b82f6',
                                    fontWeight: '500'
                                  }}
                                >
                                  {team.abbreviation || team.teamName}
                                </span>
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
                              <td style={{ textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  background: qualPercentage >= 70 ? '#d4edda' : qualPercentage >= 40 ? '#fff3cd' : '#f8d7da',
                                  color: qualPercentage >= 70 ? '#155724' : qualPercentage >= 40 ? '#856404' : '#721c24',
                                  minWidth: '45px',
                                  whiteSpace: 'nowrap'
                                }} title={`Qualification Chance: ${qualPercentage}%`}>
                                  {qualPercentage}%
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
                    <h4>Reset Tournament Winner</h4>
                    <p>Reset the tournament winner if it was incorrectly set. This will clear the winner badge and set status back to 'running'.</p>
                    <button 
                      className="manage-btn danger-btn"
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to reset the tournament winner? This action cannot be undone.')) {
                          return;
                        }
                        try {
                          const cachedUser = localStorage.getItem('user');
                          const userId = cachedUser ? JSON.parse(cachedUser).id : null;
                          
                          const response = await fetch(`${API_ENDPOINTS}/api/tournaments/${tournament._id}/reset-winner`, {
                            method: 'POST',
                            headers: {
                              'user-id': userId
                            }
                          });

                          if (response.ok) {
                            alert('Tournament winner reset successfully!');
                            onClose();
                            window.location.reload(); // Reload to refresh tournament list
                          } else {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to reset winner');
                          }
                        } catch (error) {
                          alert(error.message);
                        }
                      }}
                      style={{
                        background: '#dc2626',
                        color: 'white'
                      }}
                    >
                      🔄 Reset Winner
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

      {/* Team Details Modal */}
      {showTeamDetails && selectedTeam && (
        <div className="modal-overlay" onClick={closeTeamDetails} style={{ zIndex: 2000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {selectedTeam.teamImage && (
                  <img 
                    src={`${API_ENDPOINTS}${selectedTeam.teamImage}`} 
                    alt={selectedTeam.teamName}
                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                )}
                {selectedTeam.abbreviation || selectedTeam.teamName} - Match History
              </h2>
              <button className="close-btn" onClick={closeTeamDetails}>
                <FaTimes />
              </button>
            </div>

            <div style={{ padding: '25px 30px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: '15px',
                marginBottom: '25px'
              }}>
                <div style={{ 
                  background: '#e8f5e9', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  border: '2px solid #4caf50'
                }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2e7d32' }}>
                    {selectedTeam.won || 0}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>Wins</div>
                </div>
                <div style={{ 
                  background: '#ffebee', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  border: '2px solid #f44336'
                }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#c62828' }}>
                    {selectedTeam.lost || 0}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>Losses</div>
                </div>
                <div style={{ 
                  background: '#e3f2fd', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  border: '2px solid #2196f3'
                }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1565c0' }}>
                    {selectedTeam.points || 0}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>Points</div>
                </div>
                <div style={{ 
                  background: '#fff3e0', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  border: '2px solid #ff9800'
                }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e65100' }}>
                    {selectedTeam.fairness || 0}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>Fairness</div>
                </div>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  border: '2px solid #757575'
                }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#424242' }}>
                    {selectedTeam.matches || 0}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>Matches</div>
                </div>
              </div>

              <h3 style={{ color: '#374151', marginBottom: '1rem', fontSize: '1.2rem' }}>Match History</h3>
              {teamFixtures.length > 0 ? (
                <div className="points-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Opponent</th>
                        <th>Result</th>
                        <th>Score</th>
                        <th>Fairness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamFixtures.map((fixture, index) => {
                        const isTeam1 = fixture.team1 === selectedTeam.teamName;
                        const opponent = isTeam1 ? fixture.team2 : fixture.team1;
                        
                        let result = 'vs';
                        let resultText = 'vs';
                        let resultColor = '#6c757d';
                        
                        if (fixture.winner) {
                          if (fixture.winner === selectedTeam.teamName) {
                            result = 'win';
                            resultText = 'Won';
                            resultColor = '#28a745';
                            if (fixture.margin) {
                              resultText += ` by ${fixture.margin}`;
                            }
                          } else {
                            result = 'loss';
                            resultText = 'Lost';
                            resultColor = '#dc3545';
                            if (fixture.margin) {
                              resultText += ` by ${fixture.margin}`;
                            }
                          }
                        }

                        // Get score for this team
                        const teamScore = isTeam1 ? fixture.team1Score : fixture.team2Score;
                        const opponentScore = isTeam1 ? fixture.team2Score : fixture.team1Score;
                        let scoreText = '-';
                        if (teamScore !== undefined && teamScore !== null && opponentScore !== undefined && opponentScore !== null) {
                          scoreText = `${teamScore} - ${opponentScore}`;
                        } else if (teamScore !== undefined && teamScore !== null) {
                          scoreText = `${teamScore} - TBD`;
                        } else if (opponentScore !== undefined && opponentScore !== null) {
                          scoreText = `TBD - ${opponentScore}`;
                        } else if (fixture.winner) {
                          scoreText = 'Score not available';
                        } else {
                          scoreText = 'TBD';
                        }

                        // Get fairness for this team
                        const teamFairness = isTeam1 ? fixture.team1Fairness : fixture.team2Fairness;

                        return (
                          <tr key={index}>
                            <td style={{ fontWeight: '500' }}>{opponent}</td>
                            <td style={{ color: resultColor, fontWeight: 'bold' }}>{resultText}</td>
                            <td>{scoreText}</td>
                            <td style={{ textAlign: 'center' }}>
                              {teamFairness ? (
                                <span className={`fairness-tag fairness-${teamFairness > 70 ? 'high' : teamFairness > 40 ? 'medium' : 'low'}`}>
                                  {teamFairness}
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
                  No matches found for this team in this tournament.
                </div>
              )}
            </div>
          </div>
        </div>
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
  const [errors, setErrors] = useState({});

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

  const validateForm = () => {
    const newErrors = {};

    // Validate Winner
    if (!formData.winner || formData.winner.trim() === '') {
      newErrors.winner = 'Winner is required';
    }

    // Validate Margin
    if (!formData.margin || formData.margin.trim() === '') {
      newErrors.margin = 'Margin is required';
    }

    // Validate Team1 Score
    if (!formData.team1Score || formData.team1Score.toString().trim() === '') {
      newErrors.team1Score = `${formData.team1} score is required`;
    }

    // Validate Team2 Score
    if (!formData.team2Score || formData.team2Score.toString().trim() === '') {
      newErrors.team2Score = `${formData.team2} score is required`;
    }

    // Validate Man of the Match
    if (!formData.mom.name || formData.mom.name.trim() === '') {
      newErrors.momName = 'Man of the Match is required';
    }

    // Validate MoM Batting Score
    if (!formData.mom.score || formData.mom.score.toString().trim() === '') {
      newErrors.momScore = 'MoM Batting Score is required';
    }

    // Validate MoM Bowling Wickets (0 is a valid value)
    if (formData.mom.wickets === '' || formData.mom.wickets === null || formData.mom.wickets === undefined) {
      newErrors.momWickets = 'MoM Bowling Wickets is required';
    } else if (Number(formData.mom.wickets) < 0) {
      newErrors.momWickets = 'MoM Bowling Wickets cannot be negative';
    }

    // Validate Team1 Fairness
    if (!formData.team1Fairness || formData.team1Fairness.toString().trim() === '') {
      newErrors.team1Fairness = `Fairness for ${formData.team1} is required`;
    }

    // Validate Team2 Fairness
    if (!formData.team2Fairness || formData.team2Fairness.toString().trim() === '') {
      newErrors.team2Fairness = `Fairness for ${formData.team2} is required`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

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
            <label>Winner *</label>
            <select
              name="winner"
              value={formData.winner}
              onChange={(e) => {
                handleWinnerChange(e.target.value);
                if (errors.winner) {
                  setErrors(prev => ({ ...prev, winner: '' }));
                }
              }}
              required
              style={{ borderColor: errors.winner ? '#dc3545' : '' }}
            >
              <option value="">-- Select Winner --</option>
              <option value={formData.team1}>{formData.team1}</option>
              <option value={formData.team2}>{formData.team2}</option>
            </select>
            {errors.winner && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.winner}</span>}
          </div>

          <div className="form-group">
            <label>Margin (e.g., 5 runs or 2 wickets) *</label>
            <input
              type="text"
              name="margin"
              value={formData.margin}
              onChange={(e) => {
                handleInputChange(e);
                if (errors.margin) {
                  setErrors(prev => ({ ...prev, margin: '' }));
                }
              }}
              placeholder="e.g., 5 runs or 2 wickets"
              required
              style={{ borderColor: errors.margin ? '#dc3545' : '' }}
            />
            {errors.margin && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.margin}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{formData.team1} Score *</label>
              <input
                type="text"
                name="team1Score"
                value={formData.team1Score}
                onChange={(e) => {
                  handleInputChange(e);
                  if (errors.team1Score) {
                    setErrors(prev => ({ ...prev, team1Score: '' }));
                  }
                }}
                placeholder="Enter score"
                required
                style={{ borderColor: errors.team1Score ? '#dc3545' : '' }}
              />
              {errors.team1Score && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.team1Score}</span>}
            </div>

            <div className="form-group">
              <label>{formData.team2} Score *</label>
              <input
                type="text"
                name="team2Score"
                value={formData.team2Score}
                onChange={(e) => {
                  handleInputChange(e);
                  if (errors.team2Score) {
                    setErrors(prev => ({ ...prev, team2Score: '' }));
                  }
                }}
                placeholder="Enter score"
                required
                style={{ borderColor: errors.team2Score ? '#dc3545' : '' }}
              />
              {errors.team2Score && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.team2Score}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Man of the Match *</label>
            <select
              name="momName"
              value={formData.mom.name}
              onChange={(e) => {
                handleMomChange('name', e.target.value);
                if (errors.momName) {
                  setErrors(prev => ({ ...prev, momName: '' }));
                }
              }}
              required
              style={{ borderColor: errors.momName ? '#dc3545' : '' }}
            >
              <option value="">-- Select Man of the Match --</option>
              {players.map((player, idx) => (
                <option key={idx} value={player}>{player}</option>
              ))}
            </select>
            {errors.momName && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.momName}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>MoM Batting Score *</label>
              <input
                type="number"
                name="momScore"
                value={formData.mom.score}
                onChange={(e) => {
                  handleMomChange('score', e.target.value);
                  if (errors.momScore) {
                    setErrors(prev => ({ ...prev, momScore: '' }));
                  }
                }}
                placeholder="Batting score"
                required
                style={{ borderColor: errors.momScore ? '#dc3545' : '' }}
              />
              {errors.momScore && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.momScore}</span>}
            </div>

            <div className="form-group">
              <label>MoM Bowling Wickets *</label>
              <input
                type="number"
                name="momWickets"
                value={formData.mom.wickets}
                onChange={(e) => {
                  handleMomChange('wickets', e.target.value);
                  if (errors.momWickets) {
                    setErrors(prev => ({ ...prev, momWickets: '' }));
                  }
                }}
                placeholder="Wickets taken"
                required
                min="0"
                style={{ borderColor: errors.momWickets ? '#dc3545' : '' }}
              />
              {errors.momWickets && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.momWickets}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fairness for {formData.team1} *</label>
              <input
                type="number"
                name="team1Fairness"
                value={formData.team1Fairness}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (Number(value) >= 0 && Number(value) <= 9999 && value.length <= 4)) {
                    handleInputChange(e);
                    if (errors.team1Fairness) {
                      setErrors(prev => ({ ...prev, team1Fairness: '' }));
                    }
                  }
                }}
                placeholder="0-9999"
                min="0"
                max="9999"
                required
                style={{ borderColor: errors.team1Fairness ? '#dc3545' : '' }}
              />
              {errors.team1Fairness && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.team1Fairness}</span>}
            </div>

            <div className="form-group">
              <label>Fairness for {formData.team2} *</label>
              <input
                type="number"
                name="team2Fairness"
                value={formData.team2Fairness}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (Number(value) >= 0 && Number(value) <= 9999 && value.length <= 4)) {
                    handleInputChange(e);
                    if (errors.team2Fairness) {
                      setErrors(prev => ({ ...prev, team2Fairness: '' }));
                    }
                  }
                }}
                placeholder="0-9999"
                min="0"
                max="9999"
                required
                style={{ borderColor: errors.team2Fairness ? '#dc3545' : '' }}
              />
              {errors.team2Fairness && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.team2Fairness}</span>}
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
