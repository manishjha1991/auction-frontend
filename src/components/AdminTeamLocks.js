import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../const';
import '../css/AdminSettings.css';

function AdminTeamLocks() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [teams, setTeams] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const cached = localStorage.getItem('user');
    if (cached) setUser(JSON.parse(cached));
  }, []);

  async function loadTeams() {
    try {
      setLoading(true);
      const res = await fetch(`${API_ENDPOINTS}/api/users/all`);
      const j = await res.json();
      if (Array.isArray(j)) {
        // Filter out admin users and ensure isRetentionLocked field exists
        const nonAdminTeams = j.filter(team => !team.isAdmin).map(team => ({
          ...team,
          isRetentionLocked: team.isRetentionLocked || false // Fallback to false if not present
        }));
        console.log('Loaded teams with retention lock status:', nonAdminTeams);
        setTeams(nonAdminTeams);
      }
    } catch (e) {
      setToast('Failed to load teams');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    loadTeams(); 
    
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  async function toggleTeamLock(teamId, currentLockStatus) {
    try {
      setSaving(true);
      const res = await fetch(`${API_ENDPOINTS}/api/retained-players/lock-retention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminUserId: user?.id, 
          userId: teamId, 
          isRetentionLocked: !currentLockStatus 
        })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || 'Failed');
      
      // Update local state
      setTeams(prev => prev.map(team => 
        team._id === teamId ? { ...team, isRetentionLocked: !currentLockStatus } : team
      ));
      
      // Trigger lock status change event for all users
      try {
        window.dispatchEvent(new CustomEvent('lock-status-changed'));
      } catch (e) {
        console.log('Could not dispatch lock status change event');
      }
      
      setToast(j.message);
    } catch (e) {
      setToast(String(e.message || 'Failed to update team lock'));
    } finally {
      setSaving(false);
    }
  }

  // Filter teams based on search term
  const filteredTeams = teams.filter(team => 
    (team.teamName || team.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user?.isAdmin) {
    return <div className="admin-settings-page"><div className="warn">Admin only</div></div>;
  }

  return (
    <div className="admin-settings-page" style={{
      padding: isMobile ? '10px' : '20px',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      {toast && <div className="toast">{toast}</div>}
      <h1 className="gradient-title" style={{
        fontSize: isMobile ? '1.5rem' : '2rem',
        marginBottom: isMobile ? '15px' : '20px',
        textAlign: 'center'
      }}>Team Lock Management</h1>
      
      {/* Search Input */}
      {!loading && teams.length > 0 && (
        <div style={{
          marginBottom: isMobile ? '15px' : '20px',
          padding: isMobile ? '0 5px' : '0'
        }}>
          <input
            type="text"
            placeholder="Search teams by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '12px 16px' : '14px 20px',
              fontSize: isMobile ? '14px' : '16px',
              border: '2px solid #e0e0e0',
              borderRadius: isMobile ? '8px' : '10px',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e0e0e0';
            }}
          />
        </div>
      )}
      
      {loading ? (
        <div className="loading" style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
          padding: isMobile ? '30px 20px' : '40px'
        }}>Loading teams...</div>
      ) : (
        <div className="panel">
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: isMobile ? '12px' : '15px',
            padding: isMobile ? '15px' : '20px',
            marginBottom: isMobile ? '15px' : '20px',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              margin: '0 0 10px 0',
              fontSize: isMobile ? '1.1rem' : '1.3rem'
            }}>🔒 Retention Lock Control</h3>
            <p style={{ 
              margin: '0', 
              opacity: 0.9,
              fontSize: isMobile ? '0.9rem' : '1rem',
              lineHeight: '1.4'
            }}>
              Lock teams to completely disable their profile and retention functionality
            </p>
            {!loading && teams.length > 0 && (
              <p style={{ 
                margin: '10px 0 0 0', 
                opacity: 0.8,
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                lineHeight: '1.3'
              }}>
                Showing {filteredTeams.length} of {teams.length} teams
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            )}
          </div>

          <div style={{ 
            display: 'grid', 
            gap: isMobile ? '12px' : '15px',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))'
          }}>
            {filteredTeams.map((team) => (
              <div key={team._id} style={{
                background: team.isRetentionLocked 
                  ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                  : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                borderRadius: isMobile ? '10px' : '12px',
                padding: isMobile ? '15px' : '20px',
                color: 'white',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: isMobile ? 'flex-start' : 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                gap: isMobile ? '15px' : '0'
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    margin: '0 0 5px 0', 
                    fontSize: isMobile ? '1.1rem' : '1.2rem',
                    wordBreak: 'break-word'
                  }}>
                    {team.teamName || team.name}
                  </h4>
                  <p style={{ 
                    margin: '0', 
                    opacity: 0.9, 
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    lineHeight: '1.3',
                    wordBreak: 'break-word'
                  }}>
                    {team.email} • {team.isRetentionLocked ? '🔒 Retention Locked' : '🔓 Retention Unlocked'}
                  </p>
                </div>
                
                <button
                  onClick={() => toggleTeamLock(team._id, team.isRetentionLocked)}
                  disabled={saving}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: isMobile ? '6px' : '8px',
                    padding: isMobile ? '12px 16px' : '10px 20px',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: saving ? 0.6 : 1,
                    width: isMobile ? '100%' : 'auto',
                    minHeight: isMobile ? '44px' : 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    }
                  }}
                >
                  {team.isRetentionLocked ? '🔓 Unlock Retention' : '🔒 Lock Retention'}
                </button>
              </div>
            ))}
          </div>

          {teams.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: isMobile ? '30px 20px' : '40px',
              color: '#6c757d'
            }}>
              <h3 style={{ 
                fontSize: isMobile ? '1.2rem' : '1.5rem',
                marginBottom: isMobile ? '10px' : '15px'
              }}>No teams found</h3>
              <p style={{ 
                fontSize: isMobile ? '0.9rem' : '1rem',
                lineHeight: '1.4'
              }}>All users might be admins or no users exist yet.</p>
            </div>
          )}
          
          {teams.length > 0 && filteredTeams.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: isMobile ? '30px 20px' : '40px',
              color: '#6c757d'
            }}>
              <h3 style={{ 
                fontSize: isMobile ? '1.2rem' : '1.5rem',
                marginBottom: isMobile ? '10px' : '15px'
              }}>No teams match your search</h3>
              <p style={{ 
                fontSize: isMobile ? '0.9rem' : '1rem',
                lineHeight: '1.4'
              }}>Try adjusting your search terms.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminTeamLocks;
