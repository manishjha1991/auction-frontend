import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import { API_ENDPOINTS } from '../const';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
  }
  70% {
    transform: scale(1.02);
    box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0);
  }
`;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem;
  }

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: float 20s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    margin-bottom: 2rem;
  }
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 0 4px 20px rgba(0,0,0,0.3);
  background: linear-gradient(45deg, #fff, #f0f8ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${fadeIn} 1s ease-out;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: rgba(255,255,255,0.9);
  margin: 0;
  font-weight: 500;
  animation: ${fadeIn} 1s ease-out 0.2s both;
`;

const SearchBar = styled.div`
  max-width: 600px;
  margin: 0 auto 2rem;
  position: relative;
  z-index: 2;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  transition: all 0.3s ease;

  @media (max-width: 480px) {
    padding: 0.8rem 1.2rem;
    font-size: 1rem;
    border-radius: 20px;
  }

  &:focus {
    outline: none;
    box-shadow: 0 15px 40px rgba(0,0,0,0.2);
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    &:focus {
      transform: translateY(-1px);
    }
  }

  &::placeholder {
    color: #999;
  }
`;

const UsersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0 0.5rem;
  }

  @media (max-width: 480px) {
    gap: 0.8rem;
    padding: 0 0.25rem;
  }
`;

const UserCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 25px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 20px;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    border-radius: 15px;
  }

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 30px 60px rgba(0,0,0,0.2);
    animation: ${pulse} 2s infinite;
  }

  @media (max-width: 768px) {
    &:hover {
      transform: translateY(-5px);
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
    background-size: 300% 100%;
    animation: gradientShift 3s ease infinite;
  }

  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    text-align: center;
    gap: 0.8rem;
    margin-bottom: 1rem;
  }
`;

const UserAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);

  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 480px) {
    font-size: 1.3rem;
    margin: 0 0 0.3rem 0;
  }
`;

const UserEmail = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin: 0;
  font-weight: 500;
`;

const UserNameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    justify-content: center;
  }
`;

const FormSection = styled.div`
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    margin-bottom: 0.8rem;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;

  @media (max-width: 480px) {
    font-size: 0.85rem;
    margin-bottom: 0.3rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  color: #333;
  transition: all 0.3s ease;

  @media (max-width: 480px) {
    padding: 0.7rem;
    font-size: 0.9rem;
    border-radius: 8px;
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  color: #333;
  transition: all 0.3s ease;

  @media (max-width: 480px) {
    padding: 0.7rem;
    font-size: 0.9rem;
    border-radius: 8px;
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.8rem;
  }
`;

const Button = styled.button`
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;

  @media (max-width: 480px) {
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
    border-radius: 8px;
    min-width: 100px;
  }

  &.save {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
    }
  }

  &.cancel {
    background: linear-gradient(135deg, #6c757d, #495057);
    color: white;
    box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const LoadingCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 25px;
  padding: 2rem;
  text-align: center;
  color: #666;
  font-size: 1.1rem;
  animation: ${pulse} 2s infinite;
`;

const SuccessMessage = styled.div`
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 1rem;
  animation: ${slideIn} 0.5s ease-out;
`;

const ErrorMessage = styled.div`
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 1rem;
  animation: ${slideIn} 0.5s ease-out;
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0,0,0,0.08);
  flex-wrap: wrap;
`;

const StatusPill = styled.span`
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ active }) => (active ? '#1c7c54' : '#b71c1c')};
  background: ${({ active }) => (active ? 'rgba(28,124,84,0.12)' : 'rgba(183,28,28,0.12)')};
  border: 1px solid ${({ active }) => (active ? 'rgba(28,124,84,0.3)' : 'rgba(183,28,28,0.3)')};
`;

const ToggleButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  color: white;
  background: ${({ danger }) =>
    danger ? 'linear-gradient(135deg, #ff3d71, #ff8f70)' : 'linear-gradient(135deg, #22c1c3, #3a7bd5)'};
  box-shadow: 0 8px 18px rgba(0,0,0,0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [adminUserId, setAdminUserId] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setAdminUserId(storedUser?.id || storedUser?._id || null);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS}/api/users/all?includeInactive=true`);
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user._id);
    setEditData({
      timezone: user.timezone || 'Asia/Kolkata',
      streamLink: user.streamLink || '',
      abbreviation: user.abbreviation || ''
    });
    setMessage({ type: '', text: '' });
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditData({});
    setMessage({ type: '', text: '' });
  };

  const handleSave = async (userId) => {
    try {
      setSaving(true);
      await axios.put(`${API_ENDPOINTS}/api/users/${userId}/admin-update`, {
        timezone: editData.timezone,
        streamLink: editData.streamLink,
        abbreviation: editData.abbreviation
      });
      
      setMessage({ type: 'success', text: 'User updated successfully!' });
      setEditingUser(null);
      setEditData({});
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage({ type: 'error', text: 'Failed to update user' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggleActive = async (user) => {
    if (!adminUserId) {
      setMessage({ type: 'error', text: 'Missing admin credentials' });
      return;
    }
    try {
      await axios.post(`${API_ENDPOINTS}/api/admin-tools/users/${user._id}/active`, {
        adminUserId,
        isActive: !(user.isActive === false),
      });
      setMessage({
        type: 'success',
        text: `${user.teamName || user.name} is now ${user.isActive === false ? 'active' : 'inactive'}.`,
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user active state:', error);
      setMessage({ type: 'error', text: 'Failed to update user status' });
    }
  };

  const filteredUsers = users.filter(user =>
    user.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>👑 Admin User Management</Title>
          <Subtitle>Manage user timezones and stream links</Subtitle>
        </Header>
        <UsersGrid>
          {[1, 2, 3, 4].map(i => (
            <LoadingCard key={i}>
              <div>Loading users...</div>
            </LoadingCard>
          ))}
        </UsersGrid>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>👑 Admin User Management</Title>
        <Subtitle>Manage user timezones and stream links</Subtitle>
      </Header>

      <SearchBar>
        <SearchInput
          type="text"
          placeholder="Search users by name, team, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchBar>

      <UsersGrid>
        {filteredUsers.map((user, index) => (
          <UserCard key={user._id} style={{ animationDelay: `${index * 0.1}s` }}>
            <UserHeader>
              <UserAvatar>
                {getInitials(user.name)}
              </UserAvatar>
              <UserInfo>
                <UserNameContainer>
                  <UserName>{user.teamName || user.name}</UserName>
                  {user.abbreviation && (
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '15px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                      whiteSpace: 'nowrap'
                    }}>
                      {user.abbreviation}
                    </div>
                  )}
                </UserNameContainer>
                <UserEmail>{user.email}</UserEmail>
              </UserInfo>
            </UserHeader>

            {editingUser === user._id ? (
              <FormSection>
                {message.text && (
                  message.type === 'success' ? (
                    <SuccessMessage>{message.text}</SuccessMessage>
                  ) : (
                    <ErrorMessage>{message.text}</ErrorMessage>
                  )
                )}

                <FormGroup>
                  <Label>Timezone</Label>
                  <Select
                    value={editData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (India)</option>
                    <option value="America/New_York">America/New_York (Eastern Time)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (Pacific Time)</option>
                    <option value="America/Chicago">America/Chicago (Central Time)</option>
                    <option value="America/Denver">America/Denver (Mountain Time)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                    <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                    <option value="Australia/Melbourne">Australia/Melbourne (AEST)</option>
                    <option value="Pacific/Auckland">Pacific/Auckland (NZST)</option>
                    <option value="America/Toronto">America/Toronto (Eastern Time)</option>
                    <option value="America/Vancouver">America/Vancouver (Pacific Time)</option>
                    <option value="Europe/Moscow">Europe/Moscow (MSK)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                    <option value="Asia/Bangkok">Asia/Bangkok (ICT)</option>
                    <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                    <option value="Asia/Manila">Asia/Manila (PST)</option>
                    <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                    <option value="Asia/Hong_Kong">Asia/Hong_Kong (HKT)</option>
                    <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                    <option value="Asia/Dhaka">Asia/Dhaka (BST)</option>
                    <option value="Asia/Colombo">Asia/Colombo (SLST)</option>
                    <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                    <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                    <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
                    <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires (ART)</option>
                    <option value="America/Mexico_City">America/Mexico_City (CST)</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>Stream Link</Label>
                  <Input
                    type="url"
                    value={editData.streamLink}
                    onChange={(e) => handleInputChange('streamLink', e.target.value)}
                    placeholder="https://twitch.tv/yourchannel or https://youtube.com/yourchannel"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Team Abbreviation</Label>
                  <Input
                    type="text"
                    value={editData.abbreviation || ''}
                    onChange={(e) => handleInputChange('abbreviation', e.target.value)}
                    placeholder="e.g., CSK, MI, RCB (max 4 characters)"
                    maxLength="4"
                    style={{ textTransform: 'uppercase' }}
                  />
                </FormGroup>

                <ButtonGroup>
                  <Button
                    className="save"
                    onClick={() => handleSave(user._id)}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    className="cancel"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </ButtonGroup>
              </FormSection>
            ) : (
              <FormSection>
                <FormGroup>
                  <Label>Current Timezone</Label>
                  <Input
                    value={user.timezone || 'Asia/Kolkata'}
                    readOnly
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Current Stream Link</Label>
                  <Input
                    value={user.streamLink ? user.streamLink : 'Not set'}
                    readOnly
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Team Abbreviation</Label>
                  <Input
                    value={user.abbreviation ? user.abbreviation : 'Not set'}
                    readOnly
                    style={{ textTransform: 'uppercase' }}
                  />
                </FormGroup>

                <ButtonGroup>
                  <Button
                    className="save"
                    onClick={() => handleEdit(user)}
                  >
                    Edit
                  </Button>
                </ButtonGroup>
              </FormSection>
            )}

            {!user.isAdmin && (
              <StatusBar>
                <StatusPill active={user.isActive !== false}>
                  {user.isActive === false ? 'Inactive' : 'Active'}
                </StatusPill>
                <ToggleButton
                  danger={user.isActive !== false}
                  onClick={() => handleToggleActive(user)}
                  disabled={saving}
                >
                  {user.isActive !== false ? 'Deactivate' : 'Activate'}
                </ToggleButton>
              </StatusBar>
            )}
          </UserCard>
        ))}
      </UsersGrid>
    </Container>
  );
};

export default AdminUserManagement;
