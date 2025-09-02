import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import axios from "axios";
import { API_ENDPOINTS } from "../const";

const flash = keyframes`
  0%, 100% { 
    opacity: 1; 
    transform: scale(1);
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.02);
  }
`;

const pulse = keyframes`
  0% { 
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7);
  }
  70% { 
    box-shadow: 0 0 0 20px rgba(255, 0, 0, 0);
  }
  100% { 
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
  }
`;

const NotificationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${flash} 2s infinite;
`;

const NotificationCard = styled.div`
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  border-radius: 20px;
  padding: 3rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  color: white;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: ${pulse} 2s infinite;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
    animation: shimmer 3s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }

  @media (max-width: 768px) {
    padding: 2rem;
    margin: 1rem;
  }
`;

const NotificationIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 1s infinite alternate;
  
  @keyframes bounce {
    0% { transform: translateY(0); }
    100% { transform: translateY(-10px); }
  }
`;

const NotificationTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const NotificationMessage = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  line-height: 1.5;
  opacity: 0.9;
`;

const MatchDetails = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);

  .detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.8rem;
    font-size: 1.1rem;

    .label {
      font-weight: 600;
      opacity: 0.9;
    }

    .value {
      font-weight: 700;
    }
  }

  @media (max-width: 768px) {
    padding: 1rem;
    
    .detail-row {
      flex-direction: column;
      text-align: left;
      margin-bottom: 1rem;
      
      .value {
        margin-top: 0.3rem;
      }
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ActionButton = styled.button`
  padding: 1rem 2rem;
  border: none;
  border-radius: 15px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  text-transform: uppercase;
  letter-spacing: 1px;

  &.accept {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
    }
  }

  &.reject {
    background: linear-gradient(135deg, #dc3545, #c82333);
    color: white;
    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

const TimeSlotInput = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  select {
    width: 100%;
    padding: 0.8rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    background: white;
    color: #333;
  }
`;

const GlobalNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [newDate, setNewDate] = useState("");
  const [userTimezone, setUserTimezone] = useState("Asia/Kolkata");
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Custom popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({
    type: 'success',
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    showCancel: false
  });

  useEffect(() => {
    fetchUserTimezone();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUserTimezone = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        const response = await axios.get(`${API_ENDPOINTS}/api/users/${userData.id}/details`);
        if (response.data?.user?.timezone) {
          setUserTimezone(response.data.user.timezone);
        } else {
          // Fallback to detected timezone
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setUserTimezone(timezone);
        }
      }
    } catch (error) {
      console.error("Error fetching user timezone:", error);
      // Fallback to detected timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(timezone);
    }
  };

  const fetchNotifications = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const teamName = userData?.teamName;
      
      console.log('Fetching notifications for team:', teamName);
      
      if (teamName) {
        const response = await axios.get(`${API_ENDPOINTS}/api/notifications/pending?teamName=${encodeURIComponent(teamName)}`);
        const pendingNotifications = response.data || [];
        
        console.log('Notifications received:', pendingNotifications);
        
        if (pendingNotifications.length > 0) {
          console.log('Setting current notification:', pendingNotifications[0]);
          setNotifications(pendingNotifications);
          setCurrentNotification(pendingNotifications[0]);
          setShowNotification(true);
        } else {
          setShowNotification(false);
          setNotifications([]);
          setCurrentNotification(null);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Show custom popup
  const showCustomPopup = (type, title, message, onConfirm = null, onCancel = null, showCancel = false) => {
    setPopupData({
      type,
      title,
      message,
      onConfirm,
      onCancel,
      showCancel
    });
    setShowPopup(true);
  };

  // Hide custom popup
  const hideCustomPopup = () => {
    setShowPopup(false);
    setPopupData({
      type: 'success',
      title: '',
      message: '',
      onConfirm: null,
      onCancel: null,
      showCancel: false
    });
  };

  const handleAccept = async () => {
    try {
      console.log('Accepting notification:', currentNotification);
      await axios.post(`${API_ENDPOINTS}/api/notifications/${currentNotification._id}/accept`);
      showCustomPopup(
        'success',
        '🎉 Notification Accepted!',
        'Your response has been recorded successfully.',
        () => {
          hideCustomPopup();
          setShowNotification(false);
          fetchNotifications();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      );
    } catch (error) {
      console.error("Error accepting notification:", error);
      showCustomPopup(
        'error',
        '❌ Failed to Accept',
        'There was an error accepting the notification. Please try again.',
        () => hideCustomPopup()
      );
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
    setNewTimeSlot("");
    setNewDate("");
  };

  const handleSubmitReject = async () => {
    if (!newTimeSlot || !newDate) {
      showCustomPopup(
        'warning',
        '⚠️ Missing Information',
        'Please select both date and time for your proposal.',
        () => hideCustomPopup()
      );
      return;
    }

    try {
      console.log('Rejecting notification with new time:', currentNotification, newTimeSlot, newDate);
      await axios.post(`${API_ENDPOINTS}/api/notifications/${currentNotification._id}/reject`, {
        newTimeSlot,
        newDate,
        newTimezone: userTimezone
      });
      showCustomPopup(
        'success',
        '✅ New Time Proposed!',
        'Your new time proposal has been sent to the opponent. They will be notified and can accept or suggest another time.',
        () => {
          hideCustomPopup();
          setShowNotification(false);
          setShowRejectModal(false);
          setNewTimeSlot("");
          setNewDate("");
          fetchNotifications();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      );
    } catch (error) {
      console.error("Error rejecting notification:", error);
      showCustomPopup(
        'error',
        '❌ Failed to Propose Time',
        'There was an error sending your time proposal. Please try again.',
        () => hideCustomPopup()
      );
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const selectedDateObj = new Date(newDate);
    const isToday = newDate && selectedDateObj.toDateString() === now.toDateString();

    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        if (isToday) {
          const timeSlot = new Date();
          timeSlot.setHours(hour, minute, 0, 0);
          const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
          if (timeSlot >= thirtyMinutesFromNow) {
            slots.push(timeString);
          }
        } else {
          slots.push(timeString);
        }
      }
    }
    return slots;
  };

  // Check if current user should see accept/reject buttons
  const shouldShowActionButtons = () => {
    if (!currentNotification) return false;
    
    const userData = JSON.parse(localStorage.getItem('user'));
    const currentUserTeam = userData?.teamName;
    
    // Only show buttons if the current user is the recipient (not the sender)
    return currentNotification.recipient === currentUserTeam;
  };

  const getTimezoneTime = (dateTime, timezone) => {
    const date = new Date(dateTime);
    return date.toLocaleString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  };

  if (!showNotification || !currentNotification || !currentNotification.scheduleId) {
    return null;
  }

  return (
    <>
      <NotificationOverlay>
        <NotificationCard>
          <NotificationIcon>🔔</NotificationIcon>
          <NotificationTitle>
            {currentNotification.type === 'new_time_slot' ? '🕐 New Time Proposal!' : 
             currentNotification.type === 'new_time_slot_rejected' ? '❌ Time Proposal Rejected!' :
             currentNotification.type === 'match_accepted' ? '✅ Match Accepted!' :
             '🔔 Match Invitation!'}
          </NotificationTitle>
          <NotificationMessage>
            {currentNotification.type === 'new_time_slot' 
              ? `${currentNotification.sender} has proposed a new time for your match. Please review and respond.`
              : currentNotification.type === 'new_time_slot_rejected'
              ? `${currentNotification.sender} has rejected your proposed time slot.`
              : currentNotification.type === 'match_accepted'
              ? `${currentNotification.sender} has accepted your match invitation.`
              : `You have received a match invitation that requires your response.`
            }
          </NotificationMessage>

        <MatchDetails>
          <div className="detail-row">
            <span className="label">Opponent:</span>
            <span className="value">{currentNotification.sender || 'Unknown'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Date:</span>
            <span className="value">
              {currentNotification.scheduleId?.date ? 
                new Date(currentNotification.scheduleId.date).toLocaleDateString() : 
                'Date not available'
              }
            </span>
          </div>
          
          {/* Always show the current/new time */}
          {(() => {
            const currentTime = currentNotification.scheduleId?.newTimeSlot || currentNotification.metadata?.newTimeSlot || currentNotification.scheduleId?.time;
            const isNewTime = currentNotification.scheduleId?.newTimeSlot || currentNotification.metadata?.newTimeSlot;
            const originalTime = currentNotification.scheduleId?.time;
            const isRejected = currentNotification.type === 'new_time_slot_rejected';
            
            // Get new date and timezone if available
            const newDate = currentNotification.scheduleId?.newDate || currentNotification.metadata?.newDate;
            const newTimezone = currentNotification.scheduleId?.newTimezone || currentNotification.metadata?.newTimezone || userTimezone;
            
            // Format the time display
            const formatTimeDisplay = (time, date, timezone) => {
              if (!time) return 'Time not available';
              
              if (date && timezone) {
                // If we have a new date, show the full date and time
                const dateTime = new Date(`${date}T${time}`);
                return dateTime.toLocaleString('en-US', {
                  timeZone: timezone,
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                });
              } else {
                // Just show the time
                return time;
              }
            };
            
            return (
              <>
                {!isRejected && (
                  <div className="detail-row" style={{ 
                    background: isNewTime ? '#fff3cd' : '#e8f5e8', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    border: `3px solid ${isNewTime ? '#ffc107' : '#28a745'}`, 
                    marginBottom: '10px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="label" style={{ 
                        fontWeight: 'bold', 
                        fontSize: '16px', 
                        color: isNewTime ? '#856404' : '#155724' 
                      }}>
                        {isNewTime ? '🕐 NEW PROPOSED TIME:' : '⏰ MATCH TIME:'}
                      </span>
                      <span className="value" style={{ 
                        fontWeight: 'bold', 
                        fontSize: '18px', 
                        color: isNewTime ? '#856404' : '#155724', 
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)' 
                      }}>
                        {formatTimeDisplay(currentTime, newDate, newTimezone)}
                      </span>
                    </div>
                  </div>
                )}
                
                {isRejected && (
                  <div className="detail-row" style={{ 
                    background: '#f8d7da', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    border: '3px solid #dc3545', 
                    marginBottom: '10px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="label" style={{ 
                        fontWeight: 'bold', 
                        fontSize: '16px', 
                        color: '#721c24' 
                      }}>
                        ❌ REJECTED TIME:
                      </span>
                      <span className="value" style={{ 
                        textDecoration: 'line-through',
                        fontWeight: 'bold', 
                        fontSize: '18px', 
                        color: '#721c24', 
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)' 
                      }}>
                        {currentNotification.metadata?.rejectedTime || 'Time not available'}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="detail-row" style={{ 
                  background: '#e8f5e8', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  border: '2px solid #28a745', 
                  marginBottom: '10px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="label" style={{ fontWeight: 'bold', fontSize: '14px', color: '#155724' }}>Your Time:</span>
                    <span className="value" style={{ fontWeight: 'bold', fontSize: '16px', color: '#155724' }}>
                      {currentNotification.scheduleId?.date && (isRejected ? originalTime : currentTime) ? 
                        getTimezoneTime(`${new Date(currentNotification.scheduleId.date).toISOString().split('T')[0]}T${isRejected ? originalTime : currentTime}`, userTimezone) :
                        'Time not available'
                      }
                    </span>
                  </div>
                </div>
                
                {isNewTime && originalTime && !isRejected && (
                  <div className="detail-row" style={{ 
                    background: '#f8d7da', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    border: '2px solid #dc3545' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="label" style={{ fontWeight: 'bold', fontSize: '14px', color: '#721c24' }}>⚠️ Original Time (Rejected):</span>
                      <span className="value" style={{ 
                        textDecoration: 'line-through', 
                        fontWeight: 'bold', 
                        fontSize: '16px', 
                        color: '#721c24' 
                      }}>
                        {originalTime}
                      </span>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </MatchDetails>

        <ButtonGroup>
          {(() => {
            console.log('Notification type for buttons:', currentNotification.type);
            console.log('Should show action buttons:', shouldShowActionButtons());
            
            // Only show action buttons if current user is the recipient
            if (!shouldShowActionButtons()) {
              return (
                <ActionButton className="accept" onClick={handleAccept}>
                  ✅ Acknowledged
                </ActionButton>
              );
            }
            
            return currentNotification.type === 'new_time_slot' ? (
              <>
                <ActionButton className="accept" onClick={handleAccept}>
                  ✅ Accept New Time
                </ActionButton>
                <ActionButton className="reject" onClick={handleReject}>
                  ❌ Reject New Time
                </ActionButton>
              </>
            ) : currentNotification.type === 'new_time_slot_rejected' || currentNotification.type === 'match_accepted' ? (
              <ActionButton className="accept" onClick={handleAccept}>
                ✅ Acknowledged
              </ActionButton>
            ) : (
              <>
                <ActionButton className="accept" onClick={handleAccept}>
                  ✅ Accept
                </ActionButton>
                <ActionButton className="reject" onClick={handleReject}>
                  ❌ Reject
                </ActionButton>
              </>
            );
          })()}
        </ButtonGroup>

        </NotificationCard>
      </NotificationOverlay>

      {/* New Time Proposal Modal */}
    {showRejectModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '25px',
          padding: '6px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '19px',
            padding: '30px',
            position: 'relative'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#333',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              🕐 Propose New Time
            </h2>
            
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333',
                fontSize: '16px'
              }}>
                📅 New Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: 'white',
                  color: '#333'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333',
                fontSize: '16px'
              }}>
                ⏰ New Time
              </label>
              <select
                value={newTimeSlot}
                onChange={(e) => setNewTimeSlot(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: 'white',
                  color: '#333'
                }}
              >
                <option value="">
                  {(() => {
                    const timeSlots = generateTimeSlots();
                    const now = new Date();
                    const selectedDateObj = new Date(newDate);
                    const isToday = newDate && selectedDateObj.toDateString() === now.toDateString();
                    if (isToday && timeSlots.length === 0) {
                      return "⏰ No available times for today";
                    }
                    return "⏰ Choose time...";
                  })()}
                </option>
                {generateTimeSlots().map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{
                  padding: '12px 25px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  background: 'white',
                  color: '#666',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '120px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReject}
                style={{
                  padding: '12px 25px',
                  border: 'none',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '120px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                Propose Time
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Beautiful Custom Popup */}
    {showPopup && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        padding: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '25px',
          padding: '6px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '19px',
            padding: '30px',
            position: 'relative'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '15px'
              }}>
                {popupData.type === 'success' && '🎉'}
                {popupData.type === 'error' && '❌'}
                {popupData.type === 'warning' && '⚠️'}
                {popupData.type === 'info' && 'ℹ️'}
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#333',
                margin: '0 0 8px 0'
              }}>
                {popupData.title}
              </h2>
              <p style={{
                fontSize: '16px',
                color: '#666',
                margin: 0,
                lineHeight: '1.5'
              }}>
                {popupData.message}
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center'
            }}>
              {popupData.showCancel && (
                <button
                  onClick={() => {
                    if (popupData.onCancel) popupData.onCancel();
                    hideCustomPopup();
                  }}
                  style={{
                    padding: '12px 25px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    background: 'white',
                    color: '#666',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: '120px'
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  if (popupData.onConfirm) popupData.onConfirm();
                  else hideCustomPopup();
                }}
                style={{
                  padding: '12px 25px',
                  border: 'none',
                  borderRadius: '12px',
                  background: popupData.type === 'success' ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' :
                             popupData.type === 'error' ? 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)' :
                             popupData.type === 'warning' ? 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)' :
                             'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '120px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                {popupData.type === 'success' ? 'Great!' :
                 popupData.type === 'error' ? 'Try Again' :
                 popupData.type === 'warning' ? 'Continue' :
                 'OK'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default GlobalNotification;
