import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../const';
import '../css/AdminUserActivity.css';

const AdminUserActivity = ({ adminUser }) => {
  const [adminUserId, setAdminUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'activities', 'suspicious'
  const [activities, setActivities] = useState([]);
  const [suspiciousData, setSuspiciousData] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userActivities, setUserActivities] = useState([]);
  const [filter, setFilter] = useState({ action: '', isSuspicious: '' });

  useEffect(() => {
    const user = adminUser || JSON.parse(localStorage.getItem('user') || '{}');
    setAdminUserId(user?.id || user?._id || null);
  }, [adminUser]);

  useEffect(() => {
    if (adminUserId) {
      fetchSuspiciousActivity();
      fetchActivities();
    }
  }, [adminUserId, filter]);

  const fetchSuspiciousActivity = async () => {
    if (!adminUserId) return;
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/suspicious-activity?adminUserId=${adminUserId}`);
      const data = await res.json();
      if (res.ok) {
        setSuspiciousData(data);
      }
    } catch (error) {
      console.error('Error fetching suspicious activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    if (!adminUserId) return;
    try {
      const params = new URLSearchParams({
        adminUserId,
        limit: '100',
        ...(filter.action && { action: filter.action }),
        ...(filter.isSuspicious === 'true' && { isSuspicious: 'true' })
      });
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/user-activity?${params}`);
      const data = await res.json();
      if (res.ok) {
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchUserActivity = async (userId) => {
    if (!adminUserId || !userId) return;
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/user-activity/${userId}?adminUserId=${adminUserId}`);
      const data = await res.json();
      if (res.ok) {
        setUserActivities(data.activities || []);
        setSelectedUserId(userId);
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'login': return '#4CAF50';
      case 'bid': return '#2196F3';
      case 'bid_attempt': return '#FF9800';
      default: return '#757575';
    }
  };

  if (loading) {
    return <div className="admin-activity-loading">Loading activity data...</div>;
  }

  return (
    <div className="admin-activity-container">
      <h2>🔍 User Activity Monitoring</h2>
      
      <div className="activity-tabs">
        <button 
          className={activeTab === 'summary' ? 'active' : ''}
          onClick={() => setActiveTab('summary')}
        >
          Summary & Alerts
        </button>
        <button 
          className={activeTab === 'activities' ? 'active' : ''}
          onClick={() => setActiveTab('activities')}
        >
          All Activities
        </button>
        <button 
          className={activeTab === 'suspicious' ? 'active' : ''}
          onClick={() => setActiveTab('suspicious')}
        >
          Suspicious Activity
        </button>
      </div>

      {activeTab === 'summary' && suspiciousData && (
        <div className="activity-summary">
          <div className="summary-cards">
            <div className="summary-card alert">
              <h3>⚠️ Suspicious Users</h3>
              <p className="count">{suspiciousData.summary?.totalSuspiciousUsers || 0}</p>
            </div>
            <div className="summary-card warning">
              <h3>🚨 Suspicious Activities</h3>
              <p className="count">{suspiciousData.summary?.totalSuspiciousActivities || 0}</p>
            </div>
            <div className="summary-card info">
              <h3>🤝 Shared Device Alerts</h3>
              <p className="count">{suspiciousData.summary?.totalMultiAccountCases || 0}</p>
            </div>
            <div className="summary-card device">
              <h3>📱 New Device Logins</h3>
              <p className="count">{suspiciousData.summary?.totalNewDeviceAlerts || 0}</p>
            </div>
          </div>

          {suspiciousData.suspiciousUsers && suspiciousData.suspiciousUsers.length > 0 && (
            <div className="suspicious-users-list">
              <h3>Users with Suspicious Activity</h3>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Flags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspiciousData.suspiciousUsers.map((user) => (
                      <tr key={user._id}>
                        <td>{user.teamName || user.name}</td>
                        <td className="suspicious-count">
                          {user.suspiciousActivityCount || 0} alerts
                        </td>
                        <td>
                          <button 
                            className="view-details-btn"
                            onClick={() => {
                              fetchUserActivity(user._id);
                              setActiveTab('activities');
                            }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {suspiciousData.ipMismatchUsers && suspiciousData.ipMismatchUsers.length > 0 && (
            <div className="ip-mismatch-list">
              <h3>⚠️ IP Address Mismatches</h3>
              <div className="ip-card-grid">
                {suspiciousData.ipMismatchUsers.map((user) => (
                  <div key={user._id} className="ip-card">
                    <div className="ip-card-header">
                      <span className="ip-card-title">{user.teamName || user.name}</span>
                      <span className="badge warning">Mismatch</span>
                    </div>
                    <p className="ip-card-note">
                      Login and bidding locations don’t match. Please review this account.
                    </p>
                    <p className="ip-card-meta">
                      Last alert: {formatDate(user.lastBidTime || user.lastLoginTime)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suspiciousData.newDeviceLogins && suspiciousData.newDeviceLogins.length > 0 && (
            <div className="new-device-list">
              <h3>📱 Recent New Device Logins</h3>
              <div className="ip-card-grid">
                {suspiciousData.newDeviceLogins.map((entry) => (
                  <div key={entry._id} className="ip-card">
                    <div className="ip-card-header">
                      <span className="ip-card-title">{entry.user?.teamName || entry.user?.name || 'Unknown'}</span>
                      <span className="badge warning">New Device</span>
                    </div>
                    <p className="ip-card-note">
                      Account logged in from an unfamiliar device.
                    </p>
                    <p className="ip-card-meta">
                      {formatDate(entry.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="activities-section">
          <div className="activity-filters">
            <select 
              value={filter.action} 
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
            >
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="bid">Bid</option>
              <option value="bid_attempt">Bid Attempt</option>
            </select>
            <select 
              value={filter.isSuspicious} 
              onChange={(e) => setFilter({ ...filter, isSuspicious: e.target.value })}
            >
              <option value="">All Activities</option>
              <option value="true">Suspicious Only</option>
            </select>
          </div>

          {selectedUserId && (
            <div className="user-activity-details">
              <h3>Activity for Selected User</h3>
              <button onClick={() => { setSelectedUserId(null); setUserActivities([]); }}>
                Close
              </button>
            </div>
          )}

          <div className="activities-list">
            {(selectedUserId ? userActivities : activities).map((activity) => (
              <div 
                key={activity._id} 
                className={`activity-item ${activity.isSuspicious ? 'suspicious' : ''}`}
              >
                <div className="activity-header">
                  <span 
                    className="action-badge" 
                    style={{ backgroundColor: getActionColor(activity.action) }}
                  >
                    {activity.action}
                  </span>
                  <span className="activity-time">{formatDate(activity.timestamp)}</span>
                  {activity.isSuspicious && (
                    <span className="suspicious-badge">⚠️ Suspicious</span>
                  )}
                </div>
                <div className="activity-details">
                  <p><strong>User:</strong> {activity.userId?.name || activity.userId?.teamName || 'Unknown'}</p>
                  <p><strong>IP Address:</strong> {activity.ipAddress}</p>
                  {activity.suspiciousReason && (
                    <p className="suspicious-reason"><strong>Reason:</strong> {activity.suspiciousReason}</p>
                  )}
                  {activity.details && Object.keys(activity.details).length > 0 && (
                    <div className="activity-extra">
                      <strong>Details:</strong>
                      <pre>{JSON.stringify(activity.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'suspicious' && suspiciousData && (
        <div className="suspicious-section">
          <h3>Recent Suspicious Activities</h3>
          <div className="suspicious-activities-list">
            {suspiciousData.recentSuspicious && suspiciousData.recentSuspicious.length > 0 ? (
              suspiciousData.recentSuspicious.map((activity) => (
                <div key={activity._id} className="suspicious-activity-item">
                  <div className="suspicious-header">
                    <span className="suspicious-badge-large">⚠️</span>
                    <div>
                      <p><strong>{activity.userId?.name || activity.userId?.teamName || 'Unknown'}</strong></p>
                      <p className="activity-time">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                  <div className="suspicious-details">
                    <p><strong>Action:</strong> {activity.action}</p>
                    <p><strong>IP:</strong> {activity.ipAddress}</p>
                    <p className="suspicious-reason"><strong>Reason:</strong> {activity.suspiciousReason}</p>
                    {activity.details?.otherAccountsSameDevice && activity.details.otherAccountsSameDevice.length > 0 && (
                      <p><strong>Other accounts from same device:</strong> {activity.details.otherAccountsSameDevice.map(a => a.name).join(', ')}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No suspicious activities found.</p>
            )}
          </div>

          {suspiciousData.multiAccountUsage && suspiciousData.multiAccountUsage.length > 0 && (
            <div className="multi-account-section">
              <h3>🚨 Multi-Account Usage Detected</h3>
              <div className="multi-account-list">
                {suspiciousData.multiAccountUsage.map((activity, idx) => (
                  <div key={idx} className="multi-account-item">
                    <p><strong>User:</strong> {activity.user?.teamName || activity.user?.name || 'Unknown'}</p>
                    <p><strong>IP:</strong> {activity.ipAddress}</p>
                    <p><strong>Time:</strong> {formatDate(activity.timestamp)}</p>
                    <p className="suspicious-reason"><strong>Issue:</strong> {activity.suspiciousReason}</p>
                    {activity.details?.otherAccountsSameDevice && (
                      <p><strong>Other accounts from same device:</strong> {activity.details.otherAccountsSameDevice.map(a => a.name).join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {suspiciousData.newDeviceLogins && suspiciousData.newDeviceLogins.length > 0 && (
            <div className="multi-account-section">
              <h3>📱 New Device Alerts</h3>
              <div className="multi-account-list">
                {suspiciousData.newDeviceLogins.map((entry, idx) => (
                  <div key={`new-device-${idx}`} className="multi-account-item">
                    <p><strong>User:</strong> {entry.user?.teamName || entry.user?.name || 'Unknown'}</p>
                    <p><strong>Time:</strong> {formatDate(entry.timestamp)}</p>
                    <p className="suspicious-reason">
                      <strong>Reason:</strong> New device login detected
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUserActivity;

