import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../const';
import { FaCalendarAlt, FaUsers, FaTrophy, FaEdit, FaTrash, FaPlus, FaImage, FaTimes, FaTable, FaList, FaSearch, FaMapMarkerAlt, FaChevronLeft } from 'react-icons/fa';
import PlayerAvatar from './PlayerAvatar';
import './TournamentList.css';
import { useToast } from './ToastNotification';

/** Knockout slots not yet decided — show this instead of "Winner of Semi-Final N" or legacy "Top n" seeds. */
const KNOCKOUT_TBA = 'TBA';
const knockoutTeamDisplayName = (name) => {
  if (name == null || String(name).trim() === '') return KNOCKOUT_TBA;
  const s = String(name).trim();
  if (s.includes('Winner of Semi-Final')) return KNOCKOUT_TBA;
  // Legacy seeded knockout placeholders only (e.g. "Top 1"), not real team names like "Top Order"
  if (/^Top \d+$/i.test(s)) return KNOCKOUT_TBA;
  return s;
};

const TournamentList = () => {
  const { showToast } = useToast();
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
      
      const response = await fetch(`${API_ENDPOINTS}/api/tournaments?limit=100&includeInactive=true`, {
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
      console.log('Tournaments API Response:', data); // Debug log

      // Backend can return either:
      // - an array of tournaments (default for limit >= 100 or no limit)
      // - an object { tournaments: [...], totalPages, currentPage, total } when limit < 100
      if (Array.isArray(data)) {
        setTournaments(data);
      } else if (data && Array.isArray(data.tournaments)) {
        setTournaments(data.tournaments);
      } else {
        console.warn('Unexpected data format:', data);
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

  const tournamentStatusOrder = { running: 0, upcoming: 1, completed: 2 };
  const orderedTournaments = [...filteredTournaments].sort((a, b) => {
    const sa = getTournamentStatus(a);
    const sb = getTournamentStatus(b);
    const rankDiff = (tournamentStatusOrder[sa] ?? 9) - (tournamentStatusOrder[sb] ?? 9);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.startDate || 0) - new Date(a.startDate || 0);
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
      showToast(error.message, 'error');
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
      showToast(error.message, 'error');
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
      showToast(error.message, 'error');
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
      showToast(error.message, 'error');
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
        <div className="error-message" style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          color: '#dc3545',
          background: '#f8d7da',
          borderRadius: '8px',
          margin: '2rem'
        }}>
          <h3>Error Loading Tournaments</h3>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchTournaments();
            }}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
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
        {orderedTournaments.map((tournament) => {
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

      {orderedTournaments.length === 0 && (
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
  const { showToast } = useToast();
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
      showToast(error.message, 'error');
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
  const { showToast } = useToast();
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
      showToast(error.message, 'error');
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
      showToast(error.message, 'error');
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
      showToast(error.message, 'error');
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
  const { showToast } = useToast();
  const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const isAdmin = currentUser?.isAdmin;
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'points');
  const [fixtures, setFixtures] = useState([]);
  const [pointTable, setPointTable] = useState([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [loadingPointTable, setLoadingPointTable] = useState(false);
  const [wcStats, setWcStats] = useState([]);
  const [wcTeams, setWcTeams] = useState([]);
  const [wcOverallSpotlights, setWcOverallSpotlights] = useState(null);
  const [loadingWcStats, setLoadingWcStats] = useState(false);
  const [wcStatsError, setWcStatsError] = useState('');
  const [wcSearchQuery, setWcSearchQuery] = useState('');
  const [wcSelectedTeam, setWcSelectedTeam] = useState(null);
  const [venueStats, setVenueStats] = useState([]);
  const [loadingVenueStats, setLoadingVenueStats] = useState(false);
  const [venueStatsError, setVenueStatsError] = useState('');
  const [venueSearchQuery, setVenueSearchQuery] = useState('');
  const [venueDetailVenue, setVenueDetailVenue] = useState(null);
  const [venueDetailPlayers, setVenueDetailPlayers] = useState([]);
  const [venueDetailSpotlights, setVenueDetailSpotlights] = useState(null);
  const [loadingVenueDetail, setLoadingVenueDetail] = useState(false);
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
    const teamPoints = Number(team.points) || 0;
    const teamMatches = Number(team.matches) || 0;
    const teamNrr = Number(team.nrr) || 0;
    const teamWon = Number(team.won) || 0;
    const totalTeams = allTeams.length;
    const qualifiersCount = 4; // Current CPL table card is top-4 qualification
    const maxMatches = totalTeams - 1; // Round-robin: each team plays (n-1) matches
    const remainingMatches = maxMatches - teamMatches;
    
    // If no matches played yet, return 50% (neutral)
    if (teamMatches === 0) {
      return 50;
    }

    const sortedAllTeams = [...allTeams].sort((a, b) => {
      const pointsDiff = (Number(b.points) || 0) - (Number(a.points) || 0);
      if (pointsDiff !== 0) return pointsDiff;
      return (Number(b.nrr) || 0) - (Number(a.nrr) || 0);
    });

    const currentTeamIndex = sortedAllTeams.findIndex(
      (t) => t.teamName === team.teamName || t._id === team._id
    );
    const teamRank = currentTeamIndex >= 0 ? currentTeamIndex + 1 : index + 1;

    // If all round-robin matches are complete, standings are final.
    if (roundRobinStatus?.allComplete) {
      return currentTeamIndex >= 0 && currentTeamIndex < qualifiersCount ? 100 : 0;
    }

    const teamMaxPoints = teamPoints + (remainingMatches * 2);
    const cutoffTeam = sortedAllTeams[Math.min(qualifiersCount - 1, sortedAllTeams.length - 1)];
    const cutoffPoints = Number(cutoffTeam?.points) || 0;
    const cutoffNrr = Number(cutoffTeam?.nrr) || 0;
    const cutoffWon = Number(cutoffTeam?.won) || 0;

    // Hard elimination check
    if (teamMaxPoints < cutoffPoints) {
      return 0;
    }

    // Hard guarantee check: if fewer than `qualifiersCount` teams can still reach this team
    const teamsThatCanReachCurrent = sortedAllTeams.filter((t) => {
      const p = Number(t.points) || 0;
      const m = Number(t.matches) || 0;
      const rem = Math.max(0, maxMatches - m);
      const maxP = p + rem * 2;
      return maxP >= teamPoints;
    }).length;
    if (teamsThatCanReachCurrent <= qualifiersCount && teamRank <= qualifiersCount) {
      return 100;
    }

    // Score-based estimate (non-flat and stable):
    const pointsGapToCutoff = teamPoints - cutoffPoints;
    const nrrGapToCutoff = teamNrr - cutoffNrr;
    const winsGapToCutoff = teamWon - cutoffWon;

    let estimate = 50;
    estimate += pointsGapToCutoff * 14;                // points are primary driver
    estimate += nrrGapToCutoff * 10;                   // NRR tie-breaker driver
    estimate += winsGapToCutoff * 6;                   // wins as explicit qualification factor
    estimate += Math.max(0, qualifiersCount - teamRank) * 8; // rank advantage
    estimate -= Math.max(0, teamRank - qualifiersCount) * 10; // rank penalty below cutoff

    // Keep non-final states inside (1..99) so UI doesn't show fake certainty too early.
    if (estimate >= 100) return 99;
    if (estimate <= 0) return 1;
    return Math.round(estimate);
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
        showToast(`Knockout fixtures generated! Semi-finals: ${data.top4[0].teamName} vs ${data.top4[3].teamName}, ${data.top4[1].teamName} vs ${data.top4[2].teamName}`, 'success');
        fetchFixtures();
        fetchRoundRobinStatus();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to generate knockout fixtures', 'error');
      }
    } catch (error) {
      console.error('Error generating knockout:', error);
      showToast('Failed to generate knockout fixtures', 'error');
    } finally {
      setGeneratingKnockout(false);
    }
  };

  const fetchWcStats = async () => {
    setLoadingWcStats(true);
    setWcStatsError('');
    try {
      const response = await fetch(
        `${API_ENDPOINTS}/api/player-stats/wc-stats?tournamentId=${tournament._id}`
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to load WC stats');
      }
      const data = await response.json();
      setWcTeams(Array.isArray(data.teams) ? data.teams : []);
      setWcOverallSpotlights(data.overallSpotlights && typeof data.overallSpotlights === 'object' ? data.overallSpotlights : null);
      setWcStats(Array.isArray(data.players) ? data.players : []);
    } catch (error) {
      console.error('Error fetching WC stats:', error);
      setWcStatsError(error.message || 'Failed to load WC stats');
      setWcStats([]);
      setWcTeams([]);
      setWcOverallSpotlights(null);
    } finally {
      setLoadingWcStats(false);
    }
  };

  const fetchVenueDetail = async (venueName) => {
    if (!venueName) return;
    setLoadingVenueDetail(true);
    setVenueDetailPlayers([]);
    setVenueDetailSpotlights(null);
    try {
      const q = encodeURIComponent(venueName);
      const response = await fetch(
        `${API_ENDPOINTS}/api/player-stats/venue-aggregate?tournamentId=${tournament._id}&venue=${q}&includeVenuePlayers=1`
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to load venue detail');
      }
      const data = await response.json();
      const v0 = Array.isArray(data.venues) && data.venues.length ? data.venues[0] : null;
      setVenueDetailPlayers(Array.isArray(v0?.players) ? v0.players : []);
      setVenueDetailSpotlights(v0?.spotlights && typeof v0.spotlights === 'object' ? v0.spotlights : null);
    } catch (error) {
      console.error('Error fetching venue detail:', error);
      setVenueDetailPlayers([]);
      setVenueDetailSpotlights(null);
    } finally {
      setLoadingVenueDetail(false);
    }
  };

  const fetchVenueStats = async () => {
    setLoadingVenueStats(true);
    setVenueStatsError('');
    try {
      const response = await fetch(
        `${API_ENDPOINTS}/api/player-stats/venue-aggregate?tournamentId=${tournament._id}`
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to load venue stats');
      }
      const data = await response.json();
      setVenueStats(Array.isArray(data.venues) ? data.venues : []);
    } catch (error) {
      console.error('Error fetching venue stats:', error);
      setVenueStatsError(error.message || 'Failed to load venue stats');
      setVenueStats([]);
    } finally {
      setLoadingVenueStats(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'fixtures') {
      fetchFixtures();
      fetchRoundRobinStatus(); // Check for all tournaments, not just World Cup
    } else if (activeTab === 'points') {
      fetchPointTable();
      fetchRoundRobinStatus(); // Also check status for point table to show Q/E icons
    } else if (activeTab === 'wc-stats') {
      setWcSelectedTeam(null);
      fetchWcStats();
    } else if (activeTab === 'venue-stats') {
      setVenueDetailVenue(null);
      setVenueDetailPlayers([]);
      setVenueDetailSpotlights(null);
      fetchVenueStats();
    } else if (activeTab === 'manage') {
      fetchRoundRobinStatus();
    }
  }, [activeTab, tournament._id]);

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
            <button
              className={activeTab === 'wc-stats' ? 'active' : ''}
              onClick={() => setActiveTab('wc-stats')}
            >
              <FaTrophy /> WC Stats
            </button>
            <button
              className={activeTab === 'venue-stats' ? 'active' : ''}
              onClick={() => setActiveTab('venue-stats')}
            >
              <FaMapMarkerAlt /> Venues
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
                </div>
                {roundRobinStatus && (
                  <div style={{ 
                    padding: '0.75rem', 
                    marginBottom: '1rem', 
                    background: roundRobinStatus.allComplete ? '#d4edda' : '#fff3cd',
                    borderRadius: '8px',
                    color: roundRobinStatus.allComplete ? '#155724' : '#856404'
                  }}>
                    <strong>Round-Robin Progress:</strong>{' '}
                    {roundRobinStatus.completedRoundRobin}/
                    {roundRobinStatus.totalRoundRobinExpected ?? roundRobinStatus.totalRoundRobin} matches done
                    {typeof roundRobinStatus.gamesPerTeamRequired === 'number' &&
                      roundRobinStatus.gamesPerTeamRequired > 0 && (
                        <span style={{ display: 'block', marginTop: '4px', fontSize: '0.88rem' }}>
                          Full table = each team plays every other team once (
                          {roundRobinStatus.totalRoundRobinExpected ?? roundRobinStatus.totalRoundRobin} fixtures). Until you
                          initialize knockouts, the knockout block shows <strong>TBA</strong>. Then use{' '}
                          <strong>Manage → Initialize knockout</strong> to lock in semis (1 vs 4, 2 vs 3) and a final that
                          fills from semi winners.
                        </span>
                      )}
                          {roundRobinStatus.allComplete && !roundRobinStatus.hasKnockout && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        ✅ Round-robin complete. On the <strong>Manage</strong> tab, when the button is enabled, run{' '}
                        <strong>Initialize knockout</strong>: semis become <strong>1st vs 4th</strong> and{' '}
                        <strong>2nd vs 3rd</strong> from the points table; the <strong>final</strong> stays{' '}
                        <strong>TBA</strong> until each semi winner is saved (first semi fills one side, then the other).
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
                    {fixtures.length > 0 && (
                      <div style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, color: '#374151' }}>
                        {(() => {
                          const completed = fixtures.filter(f => f.winner || (f.team1Score && f.team2Score)).length;
                          const remaining = fixtures.length - completed;
                          return <>{remaining} matches remaining out of {fixtures.length} matches</>;
                        })()}
                      </div>
                    )}

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
                        // For 8 teams: 28 round-robin, then optionally 3 knockout in DB order

                        // Expected RR = n*(n-1)/2 (same as backend); fallback 28 when team list missing
                        const teamCount = tournament?.subscribedTeams?.length || 0;
                        const expectedRoundRobinCount =
                          teamCount >= 2
                            ? (teamCount * (teamCount - 1)) / 2
                            : 28;

                        const nFx = fixtures.length;
                        // Knockout rows exist ONLY after a full RR block: length > expected RR (normally +3).
                        // Never use "all but last 3" when length < expected — that mis-labels real RR as semis/final
                        // when subscribedTeams count is inflated vs fixtures actually generated (e.g. 28 games, n=9).
                        let roundRobinCount;
                        if (nFx > expectedRoundRobinCount) {
                          roundRobinCount = expectedRoundRobinCount;
                        } else {
                          roundRobinCount = nFx;
                        }

                        let lastRoundRobinIndex = -1;
                        for (let i = fixtures.length - 1; i >= 0; i--) {
                          const hasPlaceholder = fixtures[i].team1?.includes('Winner of') ||
                                                fixtures[i].team1?.includes('Top ') ||
                                                fixtures[i].team2?.includes('Winner of') ||
                                                fixtures[i].team2?.includes('Top ');
                          if (!hasPlaceholder) {
                            lastRoundRobinIndex = i;
                            break;
                          }
                        }

                        let roundRobinFixtures = fixtures.slice(0, roundRobinCount);

                        let knockoutFixtures = fixtures.slice(roundRobinCount);
                        
                        console.log('🔧 FIXED Fixture Separation:', {
                          totalFixtures: fixtures.length,
                          expectedRoundRobinCount,
                          lastRoundRobinIndex,
                          calculatedRoundRobinCount: roundRobinCount,
                          expectedKnockoutCount: fixtures.length - roundRobinCount,
                          actualRoundRobinCount: roundRobinFixtures.length,
                          actualKnockoutCount: knockoutFixtures.length
                        });
                        
                        console.log('🔍 Fixture Separation:', {
                          totalFixtures: fixtures.length,
                          roundRobinCount,
                          roundRobinFixtures: roundRobinFixtures.length,
                          knockoutFixtures: knockoutFixtures.length,
                          lastRoundRobinIndex,
                          expectedRoundRobinCount
                        });

                        // Sort round-robin only. Knockout must stay in DB order: semi 1, semi 2, final —
                        // sorting by completion breaks labels (SF1/SF2), edit indices, and confuses the bracket.
                        roundRobinFixtures = sortFixtures(roundRobinFixtures);

                        // Filter based on search
                        roundRobinFixtures = filterFixtures(roundRobinFixtures);
                        knockoutFixtures = filterFixtures(knockoutFixtures);

                        const showKnockoutPlaceholders =
                          knockoutFixtures.length === 0 &&
                          roundRobinStatus &&
                          !roundRobinStatus.hasKnockout &&
                          (roundRobinStatus.totalRoundRobinExpected || 0) > 0;
                      
                        const hasNoResults = fixtureSearchQuery && roundRobinFixtures.length === 0 && knockoutFixtures.length === 0 && !showKnockoutPlaceholders;
                      
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
                          {showKnockoutPlaceholders && !fixtureSearchQuery.trim() && (
                            <div style={{ marginTop: '2rem' }}>
                              <h4 style={{
                                color: '#FF8C00',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                marginBottom: '0.5rem',
                                paddingBottom: '0.5rem',
                                borderBottom: '3px solid #FFD700',
                                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%)',
                                padding: '0.75rem',
                                borderRadius: '8px',
                              }}>
                                🏆 Knockout Stage (3 matches — not initialized)
                              </h4>
                              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
                                Match-ups stay <strong>TBA</strong> until you use <strong>Manage → Initialize knockout</strong>.
                              </p>
                              {[
                                { label: '⚡ SEMI-FINAL 1' },
                                { label: '⚡ SEMI-FINAL 2' },
                                { label: 'FINAL' },
                              ].map((row, idx) => (
                                <div
                                  key={idx}
                                  className="fixture-card pending"
                                  style={{
                                    marginBottom: '1rem',
                                    border: row.label.includes('FINAL') ? '4px solid #FFD700' : '3px solid #FFD700',
                                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 140, 0, 0.08) 100%)',
                                  }}
                                >
                                  <div className="fixture-header">
                                    <span className="match-number" style={{ color: '#FF8C00', fontWeight: '700' }}>
                                      {row.label}
                                    </span>
                                  </div>
                                  <div className="fixture-body">
                                    <div className="team-section">
                                      <span className="team-name">{KNOCKOUT_TBA}</span>
                                    </div>
                                    <div className="vs-section">VS</div>
                                    <div className="team-section">
                                      <span className="team-name">{KNOCKOUT_TBA}</span>
                                    </div>
                                  </div>
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
                                // CRITICAL: The last fixture in knockoutFixtures is ALWAYS the final
                                // For 31 fixtures: indices 28, 29, 30 are knockout (2 semis + 1 final)
                                // Index 30 (match 31) is the FINAL
                                const isLastKnockoutFixture = knockoutFixtures.length > 0 && index === knockoutFixtures.length - 1;
                                
                                // Find the actual index in the original fixtures array
                                // Since knockoutFixtures is a slice of fixtures starting at roundRobinCount,
                                // the actual index is roundRobinCount + index
                                const actualIndex = roundRobinCount + index;
                                
                                // Also try to find by matching team names (fallback)
                                const foundIndex = fixtures.findIndex(f => {
                                  const teamsMatch = f.team1 === fixture.team1 && f.team2 === fixture.team2;
                                  if (!teamsMatch) return false;
                                  
                                  // If scores exist, they should match
                                  if (fixture.team1Score !== undefined && f.team1Score !== fixture.team1Score) return false;
                                  if (fixture.team2Score !== undefined && f.team2Score !== fixture.team2Score) return false;
                                  
                                  return true;
                                });
                                
                                // Use found index if it's valid, otherwise use calculated index
                                const finalActualIndex = foundIndex !== -1 ? foundIndex : actualIndex;
                                
                                // DETECT FINAL: Multiple reliable checks
                                // For 8 teams tournament structure:
                                // - Round-robin: indices 0-27 (28 matches)
                                // - Semi-finals: indices 28-29 (2 matches)
                                // - Final: index 30 (1 match) - THIS IS ALWAYS THE LAST FIXTURE
                                
                                // Check 1: Is it the last fixture in knockoutFixtures array?
                                // (knockoutFixtures contains indices 28, 29, 30, so index 2 = final)
                                const isLastKnockout = knockoutFixtures.length > 0 && index === knockoutFixtures.length - 1;
                                
                                // Check 2: Is it the last fixture in the entire fixtures array?
                                // (For 31 fixtures, index 30 is the last = FINAL)
                                const isLastOverall = finalActualIndex === fixtures.length - 1;
                                
                                // Check 3: Is it at the expected final position?
                                // (After 28 round-robin + 2 semi-finals = index 30)
                                const isAtFinalPosition = finalActualIndex === 30;
                                
                                // Check 4: Does it have no winner/stats and is the last knockout?
                                // (Pending final match - no stats yet)
                                const hasNoStats = !fixture.winner && !fixture.team1Score && !fixture.team2Score;
                                const isPendingFinal = isLastKnockout && hasNoStats;
                                
                                // Final is detected if ANY of these checks pass
                                // Primary check: isLastKnockout (most reliable)
                                let isFinal = isLastKnockout || isLastOverall || isAtFinalPosition || isPendingFinal;
                                
                                // FORCE FINAL: If it's the last fixture in knockoutFixtures, it's ALWAYS the final
                                // This ensures match 30 (index 30) is always identified as the final
                                // This is the most reliable check - the last knockout fixture is always the final
                                if (knockoutFixtures.length > 0 && index === knockoutFixtures.length - 1) {
                                  isFinal = true;
                                }
                                
                                if (isFinal) {
                                  console.log('🏆 FINAL DETECTED:', {
                                    index,
                                    actualIndex: finalActualIndex,
                                    calculatedIndex: actualIndex,
                                    foundIndex,
                                    knockoutLength: knockoutFixtures.length,
                                    totalFixtures: fixtures.length,
                                    roundRobinCount,
                                    team1: fixture.team1,
                                    team2: fixture.team2,
                                    isLastKnockout,
                                    isLastOverall,
                                    isAtFinalPosition,
                                    isPendingFinal,
                                    hasWinner: !!fixture.winner,
                                    isFinal: isFinal
                                  });
                                }
                                
                                // Match label - ALWAYS show FINAL for the last knockout fixture
                                // For 31 fixtures: index 30 = match 31 = FINAL
                                const matchLabel = isFinal
                                  ? 'FINAL' 
                                  : (index === 0 ? '⚡ SEMI-FINAL 1' : '⚡ SEMI-FINAL 2');
                                
                                // Get team data for final fixture - check both tournament.subscribedTeams and also try to fetch from userId
                                const getTeamData = (teamName) => {
                                  if (!teamName) {
                                    console.log('No team name provided');
                                    return null;
                                  }
                                  
                                  // First try tournament.subscribedTeams
                                  if (tournament.subscribedTeams && tournament.subscribedTeams.length > 0) {
                                    // Try multiple matching strategies
                                    const team = tournament.subscribedTeams.find(t => {
                                      const exactMatch = t.teamName === teamName;
                                      const caseMatch = t.teamName?.toLowerCase().trim() === teamName?.toLowerCase().trim();
                                      const includesMatch = t.teamName?.toLowerCase().includes(teamName?.toLowerCase()) || 
                                                           teamName?.toLowerCase().includes(t.teamName?.toLowerCase());
                                      return exactMatch || caseMatch || includesMatch;
                                    });
                                    
                                    if (team) {
                                      console.log('✅ Team data found:', { teamName, foundTeam: team.teamName, hasImage: !!team.teamImage, abbreviation: team.abbreviation });
                                      return team;
                                    }
                                  }
                                  
                                  // If not found, try to get from fixture's userId if available
                                  // For team1, check fixture.team1UserId
                                  // For team2, check fixture.team2UserId
                                  // But we need to match the team name, so this might not work directly
                                  
                                  console.log('Team not found in subscribedTeams:', { 
                                    teamName,
                                    hasSubscribedTeams: !!tournament.subscribedTeams,
                                    subscribedTeamsCount: tournament.subscribedTeams?.length || 0,
                                    availableTeams: tournament.subscribedTeams?.map(t => ({
                                      name: t.teamName,
                                      abbreviation: t.abbreviation,
                                      hasImage: !!t.teamImage
                                    })) || []
                                  });
                                  
                                  return null;
                                };
                                
                                const finalTeam1Disp = isFinal ? knockoutTeamDisplayName(fixture.team1) : '';
                                const finalTeam2Disp = isFinal ? knockoutTeamDisplayName(fixture.team2) : '';
                                const team1Data =
                                  isFinal && finalTeam1Disp !== KNOCKOUT_TBA ? getTeamData(fixture.team1) : null;
                                const team2Data =
                                  isFinal && finalTeam2Disp !== KNOCKOUT_TBA ? getTeamData(fixture.team2) : null;
                                
                                // Debug logging for final
                                if (isFinal) {
                                  console.log('🏆 FINAL FIXTURE DETECTED:', {
                                    fixtureIndex: index,
                                    knockoutFixturesLength: knockoutFixtures.length,
                                    team1: fixture.team1,
                                    team2: fixture.team2,
                                    team1UserId: fixture.team1UserId,
                                    team2UserId: fixture.team2UserId,
                                    team1Data: team1Data ? { 
                                      name: team1Data.teamName, 
                                      abbreviation: team1Data.abbreviation, 
                                      hasImage: !!team1Data.teamImage,
                                      imagePath: team1Data.teamImage
                                    } : null,
                                    team2Data: team2Data ? { 
                                      name: team2Data.teamName, 
                                      abbreviation: team2Data.abbreviation, 
                                      hasImage: !!team2Data.teamImage,
                                      imagePath: team2Data.teamImage
                                    } : null,
                                    tournamentId: tournament._id,
                                    subscribedTeams: tournament.subscribedTeams?.map(t => ({
                                      name: t.teamName,
                                      abbreviation: t.abbreviation,
                                      hasImage: !!t.teamImage
                                    })) || []
                                  });
                                }
                                
                                return (
                                  <div key={finalActualIndex !== -1 ? finalActualIndex : index} className={`fixture-card ${fixture.winner ? 'completed' : 'pending'}`} style={{ 
                                    border: isFinal ? '4px solid #FFD700' : '3px solid #FFD700', 
                                    background: isFinal 
                                      ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 140, 0, 0.15) 100%)'
                                      : 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%)',
                                    marginBottom: '1rem',
                                    boxShadow: isFinal ? '0 8px 24px rgba(255, 215, 0, 0.3)' : 'none',
                                    position: 'relative'
                                  }}>
                                    <div className="fixture-header" style={isFinal ? { 
                                      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 140, 0, 0.25) 100%)',
                                      padding: '1.5rem',
                                      borderRadius: '8px 8px 0 0',
                                      borderBottom: '3px solid #FFD700',
                                      textAlign: 'center'
                                    } : {}}>
                                      <span className="match-number" style={{ 
                                        color: isFinal ? '#8B0000' : '#FF8C00', 
                                        fontWeight: '900', 
                                        fontSize: isFinal ? '2.5rem' : '1.1rem',
                                        textShadow: isFinal ? '0 2px 8px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.5), 2px 2px 4px rgba(0, 0, 0, 0.8)' : 'none',
                                        letterSpacing: isFinal ? '5px' : 'normal',
                                        display: 'block',
                                        width: '100%',
                                        textAlign: 'center',
                                        marginBottom: isFinal ? '0.5rem' : '0'
                                      }}>
                                        {/* FORCE FINAL DISPLAY: Always show FINAL for last knockout fixture */}
                                        {(() => {
                                          // Triple-check: is it the last knockout fixture?
                                          const isLastKnockout = knockoutFixtures.length > 0 && index === knockoutFixtures.length - 1;
                                          // Is it at position 30 (match 31)?
                                          const isPosition30 = finalActualIndex === 30;
                                          // Is it the last fixture overall?
                                          const isLastOverall = finalActualIndex === fixtures.length - 1;
                                          
                                          // If ANY of these are true, it's the final
                                          const displayFinal = isFinal || isLastKnockout || isPosition30 || isLastOverall;
                                          
                                          if (displayFinal) {
                                            console.log('🎯 FORCING FINAL DISPLAY:', { 
                                              isFinal, 
                                              isLastKnockout, 
                                              isPosition30,
                                              isLastOverall,
                                              index, 
                                              finalActualIndex,
                                              knockoutLength: knockoutFixtures.length,
                                              totalFixtures: fixtures.length,
                                              team1: fixture.team1,
                                              team2: fixture.team2
                                            });
                                            return 'FINAL';
                                          }
                                          
                                          return matchLabel;
                                        })()}
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
                                    <div className={`fixture-body ${isFinal ? 'final-fixture-body' : ''}`} style={isFinal ? { 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'space-around',
                                      padding: '1.5rem',
                                      gap: '2rem',
                                      width: '100%'
                                    } : {}}>
                                      {isFinal ? (
                                        // FINAL - Special display with logos and abbreviations
                                        <>
                                          {/* Final - Special display with logos and abbreviations */}
                                          <div className={`team-section ${fixture.winner === fixture.team1 ? 'winner' : fixture.winner ? 'loser' : ''}`} style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            flex: 1,
                                            minWidth: '150px'
                                          }}>
                                            {/* Team 1 Logo/Badge - Always show something */}
                                            {team1Data?.teamImage ? (
                                              <img 
                                                src={`${API_ENDPOINTS}${team1Data.teamImage}`}
                                                alt={finalTeam1Disp}
                                                style={{
                                                  width: '80px',
                                                  height: '80px',
                                                  borderRadius: '50%',
                                                  objectFit: 'cover',
                                                  border: fixture.winner === fixture.team1 ? '4px solid #28a745' : fixture.winner ? '4px solid #dc3545' : '4px solid #FFD700',
                                                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                                }}
                                                onError={(e) => {
                                                  console.error('Failed to load team1 image:', team1Data.teamImage);
                                                  // Hide image and show fallback badge
                                                  e.target.style.display = 'none';
                                                  const parent = e.target.parentElement;
                                                  if (parent && !parent.querySelector('.fallback-badge')) {
                                                    const fallback = document.createElement('div');
                                                    fallback.className = 'fallback-badge';
                                                    fallback.style.cssText = 'width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold; border: 4px solid #FFD700; box-shadow: 0 4px 12px rgba(0,0,0,0.2);';
                                                    fallback.textContent = (team1Data?.abbreviation || finalTeam1Disp || '?').substring(0, 2).toUpperCase();
                                                    parent.insertBefore(fallback, e.target);
                                                  }
                                                }}
                                              />
                                            ) : (
                                              <div style={{
                                                width: '80px',
                                                height: '80px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '1.5rem',
                                                fontWeight: 'bold',
                                                border: '4px solid #FFD700',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                              }}>
                                                {(finalTeam1Disp === KNOCKOUT_TBA ? '—' : (team1Data?.abbreviation || finalTeam1Disp || '?').substring(0, 2).toUpperCase())}
                                              </div>
                                            )}
                                            <div style={{ textAlign: 'center' }}>
                                              {/* Show only abbreviation in final */}
                                              <div style={{ 
                                                fontSize: '1.2rem', 
                                                fontWeight: 'bold', 
                                                color: '#1f2937',
                                                marginBottom: '0.5rem'
                                              }}>
                                                {team1Data?.abbreviation || (finalTeam1Disp === KNOCKOUT_TBA ? KNOCKOUT_TBA : (fixture.team1 ? fixture.team1.substring(0, 3).toUpperCase() : 'N/A'))}
                                              </div>
                                            </div>
                                            {fixture.team1Score !== undefined && (
                                              <span className="team-score" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{fixture.team1Score}</span>
                                            )}
                                            {fixture.team1Fairness !== undefined && fixture.team1Fairness !== null && (
                                              <span className="team-fairness" style={{
                                                fontSize: '0.8rem',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                background: fixture.winner === fixture.team1 ? '#d4edda' : fixture.winner ? '#f8d7da' : '#e9ecef',
                                                color: fixture.winner === fixture.team1 ? '#155724' : fixture.winner ? '#721c24' : '#495057',
                                                fontWeight: '600'
                                              }}>
                                                Fairness: {fixture.team1Fairness}
                                              </span>
                                            )}
                                          </div>
                                          <div className="vs-section" style={{ 
                                            fontSize: '1.5rem', 
                                            fontWeight: 'bold', 
                                            color: '#FF8C00',
                                            padding: '0 1rem'
                                          }}>
                                            VS
                                          </div>
                                          <div className={`team-section final-team-section ${fixture.winner === fixture.team2 ? 'winner' : fixture.winner ? 'loser' : ''}`} style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            flex: 1
                                          }}>
                                            {/* Always show logo/badge for team2 */}
                                            {team2Data?.teamImage ? (
                                              <img 
                                                src={`${API_ENDPOINTS}${team2Data.teamImage}`}
                                                alt={finalTeam2Disp}
                                                style={{
                                                  width: '80px',
                                                  height: '80px',
                                                  borderRadius: '50%',
                                                  objectFit: 'cover',
                                                  border: fixture.winner === fixture.team2 ? '4px solid #28a745' : fixture.winner ? '4px solid #dc3545' : '4px solid #FFD700',
                                                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                                }}
                                                onError={(e) => {
                                                  console.error('Failed to load team2 image:', team2Data.teamImage);
                                                  // Show fallback on error
                                                  e.target.style.display = 'none';
                                                  const parent = e.target.parentElement;
                                                  if (parent && !parent.querySelector('.fallback-badge')) {
                                                    const fallback = document.createElement('div');
                                                    fallback.className = 'fallback-badge';
                                                    fallback.style.cssText = 'width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold; border: 4px solid #FFD700; box-shadow: 0 4px 12px rgba(0,0,0,0.2);';
                                                    fallback.textContent = (team2Data?.abbreviation || finalTeam2Disp || '?').substring(0, 2).toUpperCase();
                                                    parent.insertBefore(fallback, e.target);
                                                  }
                                                }}
                                              />
                                            ) : (
                                              <div style={{
                                                width: '80px',
                                                height: '80px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '1.5rem',
                                                fontWeight: 'bold',
                                                border: '4px solid #FFD700',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                              }}>
                                                {(finalTeam2Disp === KNOCKOUT_TBA ? '—' : (team2Data?.abbreviation || finalTeam2Disp || '?').substring(0, 2).toUpperCase())}
                                              </div>
                                            )}
                                            <div style={{ textAlign: 'center' }}>
                                              {/* Show only abbreviation in final */}
                                              <div style={{ 
                                                fontSize: '1.2rem', 
                                                fontWeight: 'bold', 
                                                color: '#1f2937',
                                                marginBottom: '0.5rem'
                                              }}>
                                                {team2Data?.abbreviation || (finalTeam2Disp === KNOCKOUT_TBA ? KNOCKOUT_TBA : (fixture.team2 ? fixture.team2.substring(0, 3).toUpperCase() : 'N/A'))}
                                              </div>
                                            </div>
                                            {fixture.team2Score !== undefined && (
                                              <span className="team-score" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{fixture.team2Score}</span>
                                            )}
                                            {fixture.team2Fairness !== undefined && fixture.team2Fairness !== null && (
                                              <span className="team-fairness" style={{
                                                fontSize: '0.8rem',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                background: fixture.winner === fixture.team2 ? '#d4edda' : fixture.winner ? '#f8d7da' : '#e9ecef',
                                                color: fixture.winner === fixture.team2 ? '#155724' : fixture.winner ? '#721c24' : '#495057',
                                                fontWeight: '600'
                                              }}>
                                                Fairness: {fixture.team2Fairness}
                                              </span>
                                            )}
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          {/* Semi-finals - Regular display */}
                                      <div className={`team-section ${fixture.winner === fixture.team1 ? 'winner' : fixture.winner ? 'loser' : ''}`}>
                                        <span className="team-name">{knockoutTeamDisplayName(fixture.team1)}</span>
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
                                        <span className="team-name">{knockoutTeamDisplayName(fixture.team2)}</span>
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
                                        </>
                                      )}
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
                                      <div className={isFinal ? "fixture-champion-badge" : "fixture-winner-badge"}>
                                        {isFinal ? (
                                          <>
                                            <div className="champion-trophy">🏆</div>
                                            <div className="champion-title">CHAMPION</div>
                                            <div className="champion-name">{fixture.winner}</div>
                                          </>
                                        ) : (
                                          <>🏆 Winner: {fixture.winner}</>
                                        )}
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
                          <th>W</th>
                          <th>L</th>
                          <th>Pts</th>
                          <th>Fair</th>
                          <th>NRR</th>
                          <th className="qualification-col">Qual%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pointTable.map((team, index) => {
                          // Check if all round-robin matches are complete to show Q/E icons
                          const allRoundRobinComplete = roundRobinStatus?.allComplete || false;
                          const showQ = allRoundRobinComplete && index < 4; // Top 4 get Q icon
                          const showE = allRoundRobinComplete && index >= 4; // Last 4 get E icon
                          
                          // Calculate qualification percentage
                          const qualificationPercentage = calculateQualificationPercentage(team, index, pointTable);
                          
                          // Determine NRR color
                          const nrrValue = team.nrr !== undefined && team.nrr !== null ? parseFloat(team.nrr) : 0;
                          let nrrColor = '#374151'; // Default gray
                          if (nrrValue < 0) {
                            nrrColor = '#dc3545'; // Red for negative
                          } else if (nrrValue > 0.5) {
                            nrrColor = '#28a745'; // Green for high positive
                          } else if (nrrValue > 0) {
                            nrrColor = '#f59e0b'; // Yellow/amber for okay/neutral positive
                          }
                          
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
                                    marginLeft: '4px',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: '#28a745',
                                    color: '#ffffff',
                                    fontSize: '10px',
                                    lineHeight: '1',
                                    fontWeight: '800'
                                  }} title="Qualified (Top 4)">Q</span>
                                )}
                                {showE && (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: '4px',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: '#dc3545',
                                    color: '#ffffff',
                                    fontSize: '10px',
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
                              <td style={{ fontWeight: '600', color: nrrColor }}>
                                {team.nrr !== undefined && team.nrr !== null 
                                  ? (team.nrr >= 0 ? '+' : '') + parseFloat(team.nrr).toFixed(3)
                                  : '0.000'}
                              </td>
                              <td className="qualification-col">
                                <span 
                                  className="qualification-percentage"
                                  style={{
                                    fontWeight: '600',
                                    color: qualificationPercentage >= 70 ? '#28a745' : 
                                           qualificationPercentage >= 40 ? '#f59e0b' : 
                                           qualificationPercentage >= 20 ? '#f97316' : '#dc3545'
                                  }}
                                >
                                  {qualificationPercentage}%
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

            {activeTab === 'wc-stats' && (
              <div className="wc-stats-content" style={{ padding: '0.5rem 0' }}>
                <div className="wc-stats-toolbar">
                  <h3 className="wc-stats-toolbar__title">
                    {wcSelectedTeam ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setWcSelectedTeam(null)}
                          className="wc-team-back-btn"
                        >
                          <FaChevronLeft aria-hidden />
                          Teams
                        </button>
                        <span>{wcSelectedTeam}</span>
                      </span>
                    ) : (
                      'World Cup — Teams & players'
                    )}
                  </h3>
                  <div className="wc-stats-toolbar__search">
                    <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '0.95rem' }} />
                    <input
                      type="text"
                      className="wc-stats-search-input"
                      placeholder={wcSelectedTeam ? 'Search players on this team…' : 'Search team name…'}
                      value={wcSearchQuery}
                      onChange={(e) => setWcSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {loadingWcStats ? (
                  <div className="loading">Loading WC stats...</div>
                ) : wcStatsError ? (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: '#fee2e2', color: '#991b1b' }}>
                    {wcStatsError}
                  </div>
                ) : wcStats.length === 0 ? (
                  <div style={{ padding: '1.25rem', borderRadius: '10px', background: '#f9fafb', color: '#4b5563' }}>
                    No World Cup scorecards uploaded yet. Open OCR Extractor, choose a <strong>World Cup stage</strong>{' '}
                    (Super 8, Semi, or Final), set the winner if prompted, and submit a scorecard to populate this view.
                  </div>
                ) : (
                  (() => {
                    const query = wcSearchQuery.trim().toLowerCase();
                    const stageNameMap = { super8: 'super 8 super8', semi: 'semi semi-final', final: 'final' };

                    const renderWcPlayerCard = (player) => (
                          <div
                            key={player.playerId}
                            style={{
                              border: '2px solid #e5e7eb',
                              borderRadius: '14px',
                              padding: '1rem',
                              background: 'linear-gradient(135deg, rgba(82,178,255,0.06), rgba(56,132,255,0.04))'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1f2937' }}>{player.name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                  {player.team || 'Unknown team'}{player.role ? ` · ${player.role}` : ''}
                                </div>
                              </div>
                              {player.totals.mom > 0 && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '999px',
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}>
                                  <FaTrophy /> {player.totals.mom} MoM
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                              <span style={{ padding: '4px 10px', borderRadius: '8px', background: '#dbeafe', color: '#1e40af', fontSize: '0.8rem', fontWeight: 600 }}>
                                {player.totals.runs} runs
                              </span>
                              <span style={{ padding: '4px 10px', borderRadius: '8px', background: '#dcfce7', color: '#166534', fontSize: '0.8rem', fontWeight: 600 }}>
                                {player.totals.wickets} wkts
                              </span>
                              <span style={{ padding: '4px 10px', borderRadius: '8px', background: '#f3f4f6', color: '#374151', fontSize: '0.8rem', fontWeight: 600 }}>
                                {player.totals.matches} {player.totals.matches === 1 ? 'match' : 'matches'}
                              </span>
                            </div>

                            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem' }}>
                              {(player.matches || []).map((match, idx) => {
                                const battedSomething = match.runs > 0 || match.balls > 0;
                                const bowledSomething = match.wickets > 0 || match.ballsBowled > 0 || match.runsGiven > 0;
                                const stageMeta = {
                                  super8: { label: 'Super 8', bg: '#e0e7ff', fg: '#3730a3' },
                                  semi: { label: 'Semi', bg: '#fce7f3', fg: '#9d174d' },
                                  final: { label: 'Final', bg: '#fef3c7', fg: '#92400e' },
                                }[match.wcStage] || null;
                                return (
                                  <div
                                    key={match.statId || idx}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      padding: '0.4rem 0',
                                      borderBottom: idx === player.matches.length - 1 ? 'none' : '1px dashed #e5e7eb',
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    <div style={{ color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      {stageMeta && (
                                        <span
                                          style={{
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            background: stageMeta.bg,
                                            color: stageMeta.fg,
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            letterSpacing: '0.02em',
                                            textTransform: 'uppercase'
                                          }}
                                        >
                                          {stageMeta.label}
                                        </span>
                                      )}
                                      <span>vs <strong>{match.opponent}</strong></span>
                                      {match.isMom && <span style={{ color: '#92400e' }}>★</span>}
                                      {match.venue && (
                                        <span
                                          title={match.venue}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            background: '#f3f4f6',
                                            color: '#4b5563',
                                            fontSize: '0.7rem',
                                            fontWeight: 500,
                                            maxWidth: '140px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                          }}
                                        >
                                          <FaMapMarkerAlt style={{ fontSize: '0.65rem' }} />
                                          {match.venue}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ color: '#4b5563', display: 'flex', gap: '8px' }}>
                                      {battedSomething && (
                                        <span>{match.runs}({match.balls})</span>
                                      )}
                                      {bowledSomething && (
                                        <span>{match.wickets}/{match.runsGiven}</span>
                                      )}
                                      {!battedSomething && !bowledSomething && (
                                        <span style={{ color: '#9ca3af' }}>—</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                    );

                    if (wcSelectedTeam) {
                      const teamRow = wcTeams.find((t) => t.teamName === wcSelectedTeam);
                      const spotlights = teamRow?.spotlights || {};
                      const roster = wcStats.filter((p) => (p.team || 'Unknown team') === wcSelectedTeam);
                      const filteredRoster = !query
                        ? roster
                        : roster.filter(
                            (p) =>
                              p.name?.toLowerCase().includes(query) ||
                              (p.matches || []).some((m) =>
                                m.opponent?.toLowerCase().includes(query) ||
                                (m.wcStage && stageNameMap[m.wcStage]?.includes(query))
                              )
                          );

                      if (!filteredRoster.length) {
                        return (
                          <div style={{ padding: '1rem', borderRadius: '10px', background: '#f9fafb', color: '#4b5563' }}>
                            No players match &quot;{wcSearchQuery}&quot;.
                          </div>
                        );
                      }

                      const spotlightDefs = [
                        { k: 'runs', title: 'Highest run getter', hint: 'Tournament WC totals', p: spotlights.topRuns, line: (x) => `${x.runs} runs · ${x.matches} ${x.matches === 1 ? 'match' : 'matches'}` },
                        { k: 'wk', title: 'Highest wicket taker', hint: 'Wickets', p: spotlights.topWickets, line: (x) => `${x.wickets} wickets` },
                        { k: 'mom', title: 'Top MoM', hint: 'Man of the match', p: spotlights.topMom, line: (x) => `${x.mom}× award${x.mom === 1 ? '' : 's'}` },
                        { k: 'ar', title: 'Main all-rounder', hint: '10+ runs & 1+ wicket', p: spotlights.topAllRounder, line: (x) => `${x.runs} runs · ${x.wickets} wkts` },
                      ];

                      return (
                        <>
                          <div className="wc-spotlight-grid">
                            {spotlightDefs.map((def) => (
                              <div key={def.k} className="wc-spotlight-card">
                                <div className="wc-spotlight-card__meta">
                                  <span className="wc-spotlight-card__title">{def.title}</span>
                                  <span className="wc-spotlight-card__hint">{def.hint}</span>
                                </div>
                                {def.p ? (
                                  <>
                                    <PlayerAvatar profilePicture={def.p.profilePicture} name={def.p.name} size={56} className="wc-spotlight-card__avatar" />
                                    <div className="wc-spotlight-card__name">{def.p.name}</div>
                                    <div className="wc-spotlight-card__stat">{def.line(def.p)}</div>
                                  </>
                                ) : (
                                  <div className="wc-spotlight-card__empty">No qualifier yet</div>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="wc-wl-hint">
                            Wins and losses use the <strong>match winner</strong> saved from OCR. If they show 0, set winner on the scorecard save.
                          </p>
                          <h4 className="wc-roster-title">All players ({filteredRoster.length})</h4>
                          <div className="wc-player-grid">
                            {filteredRoster.map((player) => renderWcPlayerCard(player))}
                          </div>
                        </>
                      );
                    }

                    const teamsFiltered = !query
                      ? wcTeams
                      : wcTeams.filter((t) => String(t.teamName || '').toLowerCase().includes(query));

                    if (!teamsFiltered.length) {
                      return (
                        <div style={{ padding: '1rem', borderRadius: '10px', background: '#f9fafb', color: '#4b5563' }}>
                          No teams match &quot;{wcSearchQuery}&quot;.
                        </div>
                      );
                    }

                    return (
                      <>
                        <section className="wc-overall-section" aria-label="Tournament overall leaders">
                          <h4 className="wc-overall-title">Tournament leaders · all teams</h4>
                          <div className="wc-spotlight-grid wc-spotlight-grid--overall">
                            {[
                              {
                                k: 'ov-runs',
                                title: 'Highest run getter',
                                hint: 'Across every team',
                                p: (wcOverallSpotlights || {}).topRuns,
                                line: (x) => `${x.runs} runs · ${x.matches} ${x.matches === 1 ? 'game' : 'games'}`,
                              },
                              {
                                k: 'ov-wk',
                                title: 'Highest wicket taker',
                                hint: 'Across every team',
                                p: (wcOverallSpotlights || {}).topWickets,
                                line: (x) => `${x.wickets} wickets`,
                              },
                              {
                                k: 'ov-mom',
                                title: 'Most MoM awards',
                                hint: 'Across every team',
                                p: (wcOverallSpotlights || {}).topMom,
                                line: (x) => `${x.mom}× MoM`,
                              },
                              {
                                k: 'ov-ar',
                                title: 'Best all-rounder',
                                hint: '10+ runs & 1+ wkt',
                                p: (wcOverallSpotlights || {}).topAllRounder,
                                line: (x) => `${x.runs} runs · ${x.wickets} wkts`,
                              },
                            ].map((def) => (
                              <div key={def.k} className="wc-spotlight-card wc-spotlight-card--compact">
                                <div className="wc-spotlight-card__meta">
                                  <span className="wc-spotlight-card__title">{def.title}</span>
                                  <span className="wc-spotlight-card__hint">{def.hint}</span>
                                </div>
                                {def.p ? (
                                  <>
                                    <PlayerAvatar profilePicture={def.p.profilePicture} name={def.p.name} size={48} className="wc-spotlight-card__avatar" />
                                    <div className="wc-spotlight-card__name">{def.p.name}</div>
                                    <div className="wc-spotlight-card__stat">{def.line(def.p)}</div>
                                  </>
                                ) : (
                                  <div className="wc-spotlight-card__empty">No data yet</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                        <p className="wc-wl-hint wc-wl-hint--grid">
                          Tap a team for full roster and leaders. Wins / losses need match winner on OCR save.
                        </p>
                        <div className="wc-team-grid">
                          {teamsFiltered.map((team) => (
                            <button
                              key={team.teamName}
                              type="button"
                              className="wc-team-card"
                              onClick={() => setWcSelectedTeam(team.teamName)}
                            >
                              <div className="wc-team-card__name">{team.teamName}</div>
                              <div className="wc-team-card__stats">
                                <span><strong>{team.totalRuns ?? 0}</strong> runs</span>
                                <span><strong>{team.totalWickets ?? 0}</strong> wkts</span>
                                <span className="wc-team-card__wl">
                                  <span className="wc-team-card__w">{team.wins ?? 0}W</span>
                                  <span className="wc-team-card__l">{team.losses ?? 0}L</span>
                                </span>
                              </div>
                              <div className="wc-team-card__foot">{team.playerCount ?? 0} players · tap for details</div>
                            </button>
                          ))}
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            )}

            {activeTab === 'venue-stats' && (
              <div className="venue-stats-content vstat-wrap" style={{ padding: '0.5rem 0' }}>
                <div className="vstat-toolbar wc-stats-toolbar">
                  <h3 className="vstat-toolbar__title wc-stats-toolbar__title">
                    {venueDetailVenue ? (
                      <span className="vstat-title-with-back">
                        <button
                          type="button"
                          className="wc-team-back-btn"
                          onClick={() => {
                            setVenueDetailVenue(null);
                            setVenueDetailPlayers([]);
                            setVenueDetailSpotlights(null);
                          }}
                        >
                          <FaChevronLeft aria-hidden />
                          Venues
                        </button>
                        <span className="vstat-title-venue">
                          <FaMapMarkerAlt style={{ color: '#ef4444' }} aria-hidden />
                          {venueDetailVenue}
                        </span>
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <FaMapMarkerAlt style={{ color: '#ef4444' }} aria-hidden />
                        Venue stats
                      </span>
                    )}
                  </h3>
                  <div className="wc-stats-toolbar__search">
                    <FaSearch
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7280',
                        fontSize: '0.95rem',
                      }}
                    />
                    <input
                      type="text"
                      className="wc-stats-search-input"
                      placeholder={venueDetailVenue ? 'Filter players…' : 'Search venue…'}
                      value={venueSearchQuery}
                      onChange={(e) => setVenueSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {loadingVenueStats && !venueDetailVenue ? (
                  <div className="loading">Loading venue stats...</div>
                ) : venueStatsError ? (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: '#fee2e2', color: '#991b1b' }}>
                    {venueStatsError}
                  </div>
                ) : venueDetailVenue ? (
                  loadingVenueDetail ? (
                    <div className="loading">Loading venue roster…</div>
                  ) : (
                    (() => {
                      const sp = venueDetailSpotlights || {};
                      const spotlightDefs = [
                        { k: 'vr', title: 'Highest runs', hint: 'At this ground', p: sp.topRuns, line: (x) => `${x.runs} runs · ${x.matches} app.` },
                        { k: 'vw', title: 'Highest wickets', hint: 'At this ground', p: sp.topWickets, line: (x) => `${x.wickets} wickets` },
                        { k: 'vm', title: 'Most MoM', hint: 'At this ground', p: sp.topMom, line: (x) => `${x.mom}× MoM` },
                        { k: 'va', title: 'Best all-rounder', hint: '10+ runs & 1+ wkt', p: sp.topAllRounder, line: (x) => `${x.runs} runs · ${x.wickets} wkts` },
                      ];
                      const pq = venueSearchQuery.trim().toLowerCase();
                      const rosterFiltered = !pq
                        ? venueDetailPlayers
                        : venueDetailPlayers.filter((p) => (p.name || '').toLowerCase().includes(pq));
                      return (
                        <>
                          <p className="vstat-mom-hint">MoM counts new ledger rows after deploy; re-save a scorecard or run the next match to refresh.</p>
                          <div className="wc-spotlight-grid wc-spotlight-grid--overall">
                            {spotlightDefs.map((def) => (
                              <div key={def.k} className="wc-spotlight-card wc-spotlight-card--compact">
                                <div className="wc-spotlight-card__meta">
                                  <span className="wc-spotlight-card__title">{def.title}</span>
                                  <span className="wc-spotlight-card__hint">{def.hint}</span>
                                </div>
                                {def.p ? (
                                  <>
                                    <PlayerAvatar profilePicture={def.p.profilePicture} name={def.p.name} size={48} className="wc-spotlight-card__avatar" />
                                    <div className="wc-spotlight-card__name">{def.p.name}</div>
                                    <div className="wc-spotlight-card__stat">{def.line(def.p)}</div>
                                  </>
                                ) : (
                                  <div className="wc-spotlight-card__empty">No data yet</div>
                                )}
                              </div>
                            ))}
                          </div>
                          <h4 className="wc-roster-title">Players at this venue ({rosterFiltered.length})</h4>
                          <div className="vstat-player-list">
                            {rosterFiltered.length === 0 ? (
                              <div className="vstat-empty-roster">No players match your filter.</div>
                            ) : (
                              rosterFiltered.map((p) => (
                                <div key={p.playerId} className="vstat-player-row">
                                  <PlayerAvatar profilePicture={p.profilePicture} name={p.name} size={40} />
                                  <div className="vstat-player-row__main">
                                    <div className="vstat-player-row__name">{p.name}</div>
                                    <div className="vstat-player-row__meta">
                                      {p.runs ?? 0} runs · {p.wickets ?? 0} wkts
                                      {(p.mom ?? 0) > 0 ? ` · ${p.mom}× MoM` : ''}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      );
                    })()
                  )
                ) : venueStats.length === 0 ? (
                  <div style={{ padding: '1.25rem', borderRadius: '10px', background: '#f9fafb', color: '#4b5563' }}>
                    No venue data yet. Upload a scorecard with the venue field filled in via the
                    {' '}<strong>OCR Extractor</strong>{' '}
                    to start tracking per-ground performance for this tournament.
                  </div>
                ) : (
                  (() => {
                    const query = venueSearchQuery.trim().toLowerCase();
                    const filtered = !query
                      ? venueStats
                      : venueStats.filter((v) => (v.venue || '').toLowerCase().includes(query));

                    if (!filtered.length) {
                      return (
                        <div style={{ padding: '1rem', borderRadius: '10px', background: '#f9fafb', color: '#4b5563' }}>
                          No venues match &quot;{venueSearchQuery}&quot;.
                        </div>
                      );
                    }

                    const miniSpot = (label, person, valLine) => (
                      <div className="venue-card-mini-spot" title={person?.name || ''}>
                        <span className="venue-card-mini-spot__label">{label}</span>
                        {person ? (
                          <>
                            <PlayerAvatar profilePicture={person.profilePicture} name={person.name} size={32} />
                            <span className="venue-card-mini-spot__name">{person.name}</span>
                            <span className="venue-card-mini-spot__val">{valLine}</span>
                          </>
                        ) : (
                          <span className="venue-card-mini-spot__empty">—</span>
                        )}
                      </div>
                    );

                    return (
                      <div className="venue-stats-grid vstat-venue-grid">
                        {filtered.map((v) => {
                          const ballsToOvers = (balls) => {
                            if (!balls) return '0';
                            const overs = Math.floor(balls / 6);
                            const rem = balls % 6;
                            return rem ? `${overs}.${rem}` : `${overs}`;
                          };
                          const sp = v.spotlights || {};
                          return (
                            <button
                              key={v.venue}
                              type="button"
                              className="venue-stat-card"
                              onClick={() => {
                                setVenueDetailVenue(v.venue);
                                fetchVenueDetail(v.venue);
                              }}
                            >
                              <div className="venue-stat-card__head">
                                <FaMapMarkerAlt style={{ color: '#ef4444', flexShrink: 0 }} aria-hidden />
                                <div className="venue-stat-card__name" title={v.venue}>
                                  {v.venue}
                                </div>
                                <span className="venue-stat-card__badge">
                                  {v.matches} {v.matches === 1 ? 'match' : 'matches'}
                                </span>
                              </div>

                              <div className="venue-stat-card__leaders">
                                {miniSpot('Runs', sp.topRuns, sp.topRuns ? `${sp.topRuns.runs}` : '')}
                                {miniSpot('Wkts', sp.topWickets, sp.topWickets ? `${sp.topWickets.wickets}` : '')}
                                {miniSpot('MoM', sp.topMom, sp.topMom ? `${sp.topMom.mom}×` : '')}
                                {miniSpot('AR', sp.topAllRounder, sp.topAllRounder ? `${sp.topAllRounder.runs}/${sp.topAllRounder.wickets}` : '')}
                              </div>

                              <div className="venue-stat-card__totals">
                                <div className="venue-stat-card__tot venue-stat-card__tot--bat">
                                  <div className="venue-stat-card__tot-label">Runs</div>
                                  <div className="venue-stat-card__tot-num">{v.batting?.runs ?? 0}</div>
                                  <div className="venue-stat-card__tot-sub">
                                    {v.batting?.balls ?? 0} balls · SR {v.batting?.strikeRate ?? 0}
                                  </div>
                                </div>
                                <div className="venue-stat-card__tot venue-stat-card__tot--bowl">
                                  <div className="venue-stat-card__tot-label">Wkts</div>
                                  <div className="venue-stat-card__tot-num">{v.bowling?.wickets ?? 0}</div>
                                  <div className="venue-stat-card__tot-sub">
                                    {ballsToOvers(v.bowling?.ballsBowled || 0)} ov · Eco {v.bowling?.economy ?? 0}
                                  </div>
                                </div>
                              </div>

                              <div className="venue-stat-card__tap">Tap for full roster · leaders</div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()
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
                                showToast(`Success! Generated ${data.fixtures.length} fixtures for ${data.teamsCount} teams.`, 'success');
                                // Refresh to show fixtures
                                window.location.reload();
                              } else {
                                const errorData = await response.json();
                                showToast(errorData.error || 'Failed to generate fixtures', 'error');
                              }
                            } catch (error) {
                              showToast('Error generating fixtures', 'error');
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
                      <h4>Knockout stage</h4>
                      <p style={{ marginBottom: '0.75rem' }}>
                        <strong>How it works</strong>
                      </p>
                      <ol style={{ paddingLeft: '1.25rem', margin: '0 0 0.75rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        <li>
                          Every team plays every other team once (
                          {roundRobinStatus?.totalRoundRobinExpected ?? '—'} fixtures,{' '}
                          {roundRobinStatus?.gamesPerTeamRequired ?? 'N − 1'} games per team).
                        </li>
                        <li>
                          The <strong>Initialize knockout</strong> button only enables after <strong>every</strong> round-robin
                          match has a winner and there are at least <strong>{roundRobinStatus?.minTeamsForKnockoutBracket ?? 4}</strong>{' '}
                          teams.
                        </li>
                        <li>
                          One click takes the <strong>top four</strong> on the points table and creates{' '}
                          <strong>Semi 1: 1st vs 4th</strong>, <strong>Semi 2: 2nd vs 3rd</strong>, and a{' '}
                          <strong>final</strong> that shows <strong>TBA</strong> until semis are decided.
                        </li>
                        <li>
                          When you save a <strong>semi winner</strong>, that name replaces the matching <strong>TBA</strong> in
                          the final; the other side updates when the second semi winner is saved.
                        </li>
                      </ol>
                      {roundRobinStatus && (
                        <div
                          style={{
                            padding: '0.75rem',
                            marginBottom: '0.75rem',
                            background: roundRobinStatus.allComplete ? '#d4edda' : '#fff3cd',
                            borderRadius: '8px',
                            color: roundRobinStatus.allComplete ? '#155724' : '#856404',
                            fontSize: '0.9rem',
                          }}
                        >
                          <strong>Progress:</strong> {roundRobinStatus.completedRoundRobin}/
                          {roundRobinStatus.totalRoundRobinExpected ?? roundRobinStatus.totalRoundRobin} round-robin matches
                          with results
                          {roundRobinStatus.hasKnockout && (
                            <div style={{ marginTop: '0.45rem' }}>Knockout stage is already created.</div>
                          )}
                        </div>
                      )}
                      {roundRobinStatus?.canGenerateKnockout && (
                        <button
                          type="button"
                          className="manage-btn generate-fixtures-btn"
                          onClick={generateKnockout}
                          disabled={generatingKnockout}
                          style={{ opacity: generatingKnockout ? 0.75 : 1 }}
                        >
                          {generatingKnockout ? 'Creating…' : 'Initialize knockout (top 4 → 2 semis + final)'}
                        </button>
                      )}
                      {roundRobinStatus &&
                        !roundRobinStatus.canGenerateKnockout &&
                        !roundRobinStatus.hasKnockout &&
                        (roundRobinStatus.totalRoundRobinExpected || 0) > 0 && (
                          <p style={{ fontSize: '0.88rem', color: '#6b7280', marginTop: '0.5rem' }}>
                            {roundRobinStatus.enoughTeamsForKnockout === false ? (
                              <>
                                Knockout needs at least <strong>{roundRobinStatus.minTeamsForKnockoutBracket ?? 4}</strong>{' '}
                                subscribed teams (bracket is 1st vs 4th and 2nd vs 3rd).
                              </>
                            ) : (
                              <>Button enables when every round-robin match has a winner (and at least four teams).</>
                            )}
                          </p>
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
                            showToast('Tournament winner reset successfully!', 'success');
                            onClose();
                            window.location.reload(); // Reload to refresh tournament list
                          } else {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to reset winner');
                          }
                        } catch (error) {
                          showToast(error.message, 'error');
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
                            showToast(data.message, 'success');
                            // Refresh tournament data
                            window.location.reload();
                          } else {
                            const errorData = await response.json();
                            showToast(errorData.error || 'Failed to toggle tournament lock', 'error');
                          }
                        } catch (error) {
                          showToast('Error toggling tournament lock', 'error');
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
                {selectedTeam.nrr !== undefined && selectedTeam.nrr !== null && (
                  <div style={{ 
                    background: '#e8f5e9', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    textAlign: 'center',
                    border: '2px solid #4caf50'
                  }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2e7d32' }}>
                      {selectedTeam.nrr >= 0 ? '+' : ''}{parseFloat(selectedTeam.nrr || 0).toFixed(3)}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>NRR</div>
                  </div>
                )}
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
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    team1: fixture.team1,
    team2: fixture.team2,
    winner: fixture.winner || '',
    margin: fixture.margin || '',
    team1Score: fixture.team1Score || '',
    team2Score: fixture.team2Score || '',
    team1Overs: fixture.team1Overs || '',
    team2Overs: fixture.team2Overs || '',
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
    const scoreFormatRegex = /^\d+\/\d+$/; // Matches "runs/wickets" format (e.g., "107/10", "150/5")

    // Validate Winner
    if (!formData.winner || formData.winner.trim() === '') {
      newErrors.winner = 'Winner is required';
    }

    // Validate Margin
    if (!formData.margin || formData.margin.trim() === '') {
      newErrors.margin = 'Margin is required';
    }

    // Validate Team1 Score - must be in "runs/wickets" format
    if (!formData.team1Score || formData.team1Score.toString().trim() === '') {
      newErrors.team1Score = `${formData.team1} score is required`;
    } else if (!scoreFormatRegex.test(formData.team1Score.toString().trim())) {
      newErrors.team1Score = `${formData.team1} score format is invalid. Expected format: runs/wickets (e.g., "107/10", "150/5"). Received: "${formData.team1Score}"`;
    }

    // Validate Team2 Score - must be in "runs/wickets" format
    if (!formData.team2Score || formData.team2Score.toString().trim() === '') {
      newErrors.team2Score = `${formData.team2} score is required`;
    } else if (!scoreFormatRegex.test(formData.team2Score.toString().trim())) {
      newErrors.team2Score = `${formData.team2} score format is invalid. Expected format: runs/wickets (e.g., "107/10", "150/5"). Received: "${formData.team2Score}"`;
    }

    // Validate Team1 Overs
    if (!formData.team1Overs || formData.team1Overs.toString().trim() === '') {
      newErrors.team1Overs = `${formData.team1} overs is required`;
    }

    // Validate Team2 Overs
    if (!formData.team2Overs || formData.team2Overs.toString().trim() === '') {
      newErrors.team2Overs = `${formData.team2} overs is required`;
    }

    // Validate Man of the Match - only name is required, score and wickets are optional
    if (!formData.mom.name || formData.mom.name.trim() === '') {
      newErrors.momName = 'Man of the Match name is required';
    }

    // MoM Batting Score is optional - only validate if provided
    if (formData.mom.score && formData.mom.score.toString().trim() !== '' && Number(formData.mom.score) < 0) {
      newErrors.momScore = 'MoM Batting Score cannot be negative';
    }

    // MoM Bowling Wickets is optional - only validate if provided
    if (formData.mom.wickets && formData.mom.wickets.toString().trim() !== '' && Number(formData.mom.wickets) < 0) {
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
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);

    try {
      const cachedUser = localStorage.getItem('user');
      const userId = cachedUser ? JSON.parse(cachedUser).id : null;
      
      // Prepare data with proper type conversion (matching main fixture format)
      // Overs are mandatory - already validated in validateForm()
      const updateData = {
        winner: formData.winner,
        margin: formData.margin,
        team1Score: formData.team1Score,
        team2Score: formData.team2Score,
        team1Overs: formData.team1Overs.trim(),
        team2Overs: formData.team2Overs.trim(),
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
      showToast(error.message, 'error');
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
              <label>{formData.team1} Score * (Format: runs/wickets)</label>
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
                placeholder="e.g., 107/10, 150/5"
                required
                style={{ borderColor: errors.team1Score ? '#dc3545' : '' }}
              />
              {errors.team1Score && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.team1Score}</span>}
            </div>

            <div className="form-group">
              <label>{formData.team2} Score * (Format: runs/wickets)</label>
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
                placeholder="e.g., 107/10, 150/5"
                required
                style={{ borderColor: errors.team2Score ? '#dc3545' : '' }}
              />
              {errors.team2Score && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.team2Score}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{formData.team1} Overs (e.g., 20.0, 19.3) *</label>
              <input
                type="text"
                name="team1Overs"
                value={formData.team1Overs}
                onChange={(e) => {
                  handleInputChange(e);
                  if (errors.team1Overs) {
                    setErrors(prev => ({ ...prev, team1Overs: '' }));
                  }
                }}
                placeholder="e.g., 20.0, 19.3"
                required
                style={{ borderColor: errors.team1Overs ? '#dc3545' : '' }}
              />
              {errors.team1Overs && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.team1Overs}</span>}
            </div>

            <div className="form-group">
              <label>{formData.team2} Overs (e.g., 20.0, 19.3) *</label>
              <input
                type="text"
                name="team2Overs"
                value={formData.team2Overs}
                onChange={(e) => {
                  handleInputChange(e);
                  if (errors.team2Overs) {
                    setErrors(prev => ({ ...prev, team2Overs: '' }));
                  }
                }}
                placeholder="e.g., 20.0, 19.3"
                required
                style={{ borderColor: errors.team2Overs ? '#dc3545' : '' }}
              />
              {errors.team2Overs && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.team2Overs}</span>}
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
              <label>MoM Batting Score (Optional)</label>
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
                placeholder="Batting score (optional)"
                min="0"
                style={{ borderColor: errors.momScore ? '#dc3545' : '' }}
              />
              {errors.momScore && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>{errors.momScore}</span>}
            </div>

            <div className="form-group">
              <label>MoM Bowling Wickets (Optional)</label>
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
                placeholder="Wickets taken (optional)"
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
