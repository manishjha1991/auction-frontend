import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { API_ENDPOINTS } from "../const";

const SchedulerContainer = styled.div`
  margin: 2rem auto;
  width: 95%;
  max-width: 1000px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
    pointer-events: none;
  }

  @media (max-width: 768px) {
    width: 98%;
    margin: 1rem auto;
    border-radius: 15px;
  }
`;

const Header = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 2rem;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  h1 {
    color: white;
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }

  p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.1rem;
    margin: 0.5rem 0 0 0;
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    
    h1 {
      font-size: 2rem;
    }
    
    p {
      font-size: 1rem;
    }
  }
`;

const Content = styled.div`
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 1.5rem;
    gap: 1.5rem;
  }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);

  h2 {
    color: #333;
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    text-align: center;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    
    h2 {
      font-size: 1.3rem;
    }
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    color: #555;
    font-weight: 600;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  select, input {
    width: 100%;
    padding: 0.8rem;
    border: 2px solid #e1e5e9;
    border-radius: 10px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: white;

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
`;

const TimezoneDisplay = styled.div`
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid #667eea;

  .timezone-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;

    .label {
      font-weight: 600;
      color: #555;
    }

    .time {
      font-weight: 700;
      color: #333;
      font-size: 1.1rem;
    }
  }

  .conversion {
    font-size: 0.9rem;
    color: #666;
    text-align: center;
    font-style: italic;
  }
`;

const ScheduleItem = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 20px;
  border: 3px solid transparent;
  background-clip: padding-box;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    border-radius: 20px 20px 0 0;
  }

  &:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border-color: rgba(102, 126, 234, 0.3);
  }

  .match-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid rgba(102, 126, 234, 0.1);

    .teams {
      font-weight: 700;
      color: #2c3e50;
      font-size: 18px;
      font-family: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif';
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
    }

    .status {
      padding: 8px 16px;
      border-radius: 25px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &.pending {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        color: #856404;
        border: 2px solid #ffc107;
      }

      &.accepted {
        background: linear-gradient(135deg, #d4edda 0%, #a8e6cf 100%);
        color: #155724;
        border: 2px solid #28a745;
      }

      &.rejected {
        background: linear-gradient(135deg, #f8d7da 0%, #ffb3ba 100%);
        color: #721c24;
        border: 2px solid #dc3545;
      }

      &.new-time {
        background: linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%);
        color: #0277bd;
        border: 2px solid #03a9f4;
      }
    }
  }

  .time-info {
    font-size: 14px;
    color: #495057;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    font-weight: 600;
    font-family: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif';

    .timezone {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 12px 15px;
      border-radius: 12px;
      border: 2px solid rgba(102, 126, 234, 0.1);
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
        border-color: rgba(102, 126, 234, 0.3);
        transform: translateY(-2px);
      }

      strong {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #6c757d;
        margin-bottom: 5px;
        font-weight: 700;
        display: block;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    justify-content: flex-end;

    button {
      padding: 10px 20px;
      border: none;
      border-radius: 15px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

      &.accept {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
        }
      }

      &.reject {
        background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
        color: white;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
        }
      }
    }
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ScheduleList = styled.div`
  .schedule-item {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
    border-left: 4px solid #28a745;
    transition: all 0.3s ease;

    &:hover {
      transform: translateX(5px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .match-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;

      .teams {
        font-weight: 600;
        color: #333;
      }

      .status {
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;

        &.pending {
          background: #fff3cd;
          color: #856404;
        }

        &.accepted {
          background: #d4edda;
          color: #155724;
        }

        &.rejected {
          background: #f8d7da;
          color: #721c24;
        }
      }
    }

    .time-info {
      font-size: 0.9rem;
      color: #666;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;

      .timezone {
        text-align: center;
        padding: 0.3rem;
        background: white;
        border-radius: 5px;
        border: 1px solid #e1e5e9;
      }
    }
  }
`;

const MatchScheduler = () => {
  const [teams, setTeams] = useState([]);
  const [selectedOpponent, setSelectedOpponent] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [userTimezone, setUserTimezone] = useState("Asia/Kolkata");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // Modal states for new time proposal
  const [showNewTimeModal, setShowNewTimeModal] = useState(false);
  const [selectedScheduleForReject, setSelectedScheduleForReject] = useState(null);
  const [newProposedDate, setNewProposedDate] = useState("");
  const [newProposedTime, setNewProposedTime] = useState("");
  
  // Countdown timer state
  const [, setCurrentTime] = useState(new Date());
  
  // Custom popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({
    type: 'success', // success, error, warning, info
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    showCancel: false
  });

  useEffect(() => {
    fetchUserData();
    fetchTeams();
    fetchSchedules();
  }, []);

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        setUser(userData);
        setUserData(userData);
        // Fetch user details to get timezone
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
      console.error("Error fetching user data:", error);
      // Fallback to detected timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(timezone);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/schedules/teams`);
      setTeams(response.data?.teams || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const teamName = userData?.teamName;
      
      console.log('Fetching schedules for user:', userData);
      console.log('Team name:', teamName);
      
      if (teamName) {
        const response = await axios.get(`${API_ENDPOINTS}/api/schedules?teamName=${encodeURIComponent(teamName)}`);
        console.log('Schedules response:', response.data);
        setSchedules(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
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

  const handleScheduleMatch = async () => {
    if (!selectedOpponent || !selectedDate || !selectedTime) {
      showCustomPopup(
        'warning',
        '⚠️ Missing Information',
        'Please select an opponent, date, and time to schedule your match.',
        () => hideCustomPopup()
      );
      return;
    }

    setLoading(true);
    try {
      // Get user's team name from localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      const requesterTeamName = userData?.teamName || 'Unknown Team';

      const scheduleData = {
        opponent: selectedOpponent,
        date: selectedDate,
        time: selectedTime,
        timezone: userTimezone,
        requester: requesterTeamName,
        status: "pending"
      };

      await axios.post(`${API_ENDPOINTS}/api/schedules`, scheduleData);
      showCustomPopup(
        'success',
        '🎉 Match Scheduled!',
        `Your match invitation has been sent to ${selectedOpponent}. They will receive a notification and can accept or suggest a different time.`,
        () => {
          hideCustomPopup();
          fetchSchedules();
          // Reset form
          setSelectedOpponent("");
          setSelectedDate("");
          setSelectedTime("");
        }
      );
    } catch (error) {
      console.error("Error scheduling match:", error);
      showCustomPopup(
        'error',
        '❌ Failed to Schedule',
        'There was an error scheduling your match. Please check your connection and try again.',
        () => hideCustomPopup()
      );
    } finally {
      setLoading(false);
    }
  };

  const getOpponentTimezone = (opponent) => {
    // Find the opponent team in the teams array and get their timezone
    const opponentTeam = teams.find(team => team.teamName === opponent);
    return opponentTeam?.timezone || userTimezone; // Use user's timezone as fallback
  };

  const getCurrentTimeInTimezone = (timezone) => {
    try {
      const now = new Date();
      return now.toLocaleString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'N/A';
    }
  };



  const getTimezoneDisplay = (opponent) => {
    const opponentTimezone = getOpponentTimezone(opponent);
    const currentTime = getCurrentTimeInTimezone(opponentTimezone);
    
    return currentTime;
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

  // Calculate time remaining until match
  const getTimeRemaining = (schedule) => {
    const matchTime = schedule.newTimeSlot ? 
      new Date(`${new Date(schedule.date).toISOString().split('T')[0]}T${schedule.newTimeSlot}`) :
      new Date(`${new Date(schedule.date).toISOString().split('T')[0]}T${schedule.time}`);
    
    const now = new Date();
    const timeDiff = matchTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return { isOverdue: true, text: "Match time has passed" };
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    let timeText = "";
    if (days > 0) timeText += `${days}d `;
    if (hours > 0) timeText += `${hours}h `;
    if (minutes > 0) timeText += `${minutes}m `;
    timeText += `${seconds}s`;
    
    return { 
      isOverdue: false, 
      text: timeText,
      isUrgent: days === 0 && hours < 2,
      isVeryUrgent: days === 0 && hours === 0 && minutes < 30
    };
  };

  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const selectedDateObj = new Date(selectedDate);
    
    // Check if selected date is today
    const isToday = selectedDate && 
      selectedDateObj.toDateString() === now.toDateString();
    
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // If it's today, filter out past times
        if (isToday) {
          const timeSlot = new Date();
          timeSlot.setHours(hour, minute, 0, 0);
          
          // Only add time slots that are at least 30 minutes in the future
          const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
          if (timeSlot >= thirtyMinutesFromNow) {
            slots.push(timeString);
          }
        } else {
          // For future dates, add all time slots
          slots.push(timeString);
        }
      }
    }
    return slots;
  };

  const handleAcceptSchedule = async (scheduleId) => {
    try {
      await axios.post(`${API_ENDPOINTS}/api/schedules/${scheduleId}/accept`);
      showCustomPopup(
        'success',
        '🎉 Schedule Accepted!',
        'Your match has been successfully scheduled. Both teams will be notified.',
        () => {
          hideCustomPopup();
          fetchSchedules();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      );
    } catch (error) {
      console.error("Error accepting schedule:", error);
      showCustomPopup(
        'error',
        '❌ Failed to Accept',
        'There was an error accepting the schedule. Please check your connection and try again.',
        () => hideCustomPopup()
      );
    }
  };

  const handleRejectSchedule = (scheduleId) => {
    setSelectedScheduleForReject(scheduleId);
    setNewProposedDate("");
    setNewProposedTime("");
    setShowNewTimeModal(true);
  };

  const handleSubmitNewTimeProposal = async () => {
    if (!newProposedDate || !newProposedTime) {
      showCustomPopup(
        'warning',
        '⚠️ Missing Information',
        'Please select both date and time for your proposal to proceed.',
        () => hideCustomPopup()
      );
      return;
    }

    try {
      await axios.post(`${API_ENDPOINTS}/api/schedules/${selectedScheduleForReject}/reject`, {
        newTimeSlot: newProposedTime,
        newDate: newProposedDate,
        newTimezone: userTimezone
      });
      showCustomPopup(
        'success',
        '✅ New Time Proposed!',
        'Your new time proposal has been sent to the opponent. They will be notified and can accept or suggest another time.',
        () => {
          hideCustomPopup();
          setShowNewTimeModal(false);
          fetchSchedules();
        }
      );
    } catch (error) {
      console.error("Error rejecting schedule:", error);
      showCustomPopup(
        'error',
        '❌ Failed to Propose Time',
        'There was an error sending your time proposal. Please check your connection and try again.',
        () => hideCustomPopup()
      );
    }
  };

  const handleAcceptNewTime = async (scheduleId, newTime) => {
    try {
      await axios.put(`${API_ENDPOINTS}/api/schedules/${scheduleId}/update-time`, {
        newTime,
        newDate: selectedDate // You might want to make this dynamic
      });
      showCustomPopup(
        'success',
        '🎉 New Time Accepted!',
        'The new match time has been confirmed. Both teams will be notified of the updated schedule.',
        () => {
          hideCustomPopup();
          fetchSchedules();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      );
    } catch (error) {
      console.error("Error accepting new time:", error);
      showCustomPopup(
        'error',
        '❌ Failed to Accept Time',
        'There was an error accepting the new time. Please check your connection and try again.',
        () => hideCustomPopup()
      );
    }
  };

  const handleRejectNewTime = async (scheduleId) => {
    showCustomPopup(
      'warning',
      '⚠️ Reject New Time?',
      'Are you sure you want to reject this new time proposal? You can suggest an alternative time instead.',
      () => {
        hideCustomPopup();
        setSelectedScheduleForReject(scheduleId);
        setNewProposedDate("");
        setNewProposedTime("");
        setShowNewTimeModal(true);
      },
      () => hideCustomPopup(),
      true
    );
  };

  return (
    <SchedulerContainer>
      <Header>
        <h1>🏏 Match Scheduler</h1>
        <p>Schedule your matches with opponents across different timezones</p>
      </Header>

      <Content>
        <Card>
          <h2>📅 Schedule New Match</h2>
          
          <FormGroup>
            <label style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: '#2c3e50', 
              marginBottom: '15px',
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🏏 Select Opponent
            </label>
            <select 
              value={selectedOpponent} 
              onChange={(e) => setSelectedOpponent(e.target.value)}
              style={{
                width: '100%',
                padding: '18px 25px',
                border: '3px solid transparent',
                borderRadius: '20px',
                fontSize: '18px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                cursor: 'pointer',
                appearance: 'none',
                fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 20px center',
                backgroundSize: '24px',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ffffff';
                e.target.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.5), 0 0 0 4px rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(-3px) scale(1.02)';
                e.target.style.background = 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'transparent';
                e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              }}
            >
              <option value="" style={{ 
                padding: '20px', 
                fontSize: '18px', 
                fontWeight: '600',
                fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                color: '#6c757d',
                border: 'none',
                borderRadius: '10px',
                margin: '5px 0'
              }}>
                🏏 Choose an opponent...
              </option>
              {teams.filter(team => team.teamName !== "NA" && team.teamName !== userData?.teamName).map(team => (
                <option key={team._id} value={team.teamName} style={{ 
                  padding: '20px', 
                  fontSize: '18px', 
                  fontWeight: '600',
                  fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  color: '#2c3e50',
                  border: 'none',
                  borderRadius: '10px',
                  margin: '5px 0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  ⚔️ {team.teamName} - {getTimezoneDisplay(team.teamName)}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
                        {/* Sexy Calendar Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '15px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '15px',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                fontSize: '24px',
                marginRight: '12px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}>
                📅
              </div>
              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#ffffff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  letterSpacing: '0.5px'
                }}>
                  Select Match Date
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Choose your preferred date
                </div>
              </div>
              
              {/* Animated Background Elements */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                animation: 'float 3s ease-in-out infinite'
              }} />
            </div>

            {/* Ultra Sexy Calendar Input */}
            <div style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '25px',
              padding: '6px',
              boxShadow: '0 15px 35px rgba(240, 147, 251, 0.4)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 20px 45px rgba(240, 147, 251, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(240, 147, 251, 0.4)';
            }}>
              <div style={{
                background: 'white',
                borderRadius: '19px',
                padding: '4px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    padding: '20px 25px',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '18px',
                    fontWeight: '600',
                    background: 'transparent',
                    color: '#333',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                    position: 'relative',
                    zIndex: 2
                  }}
                />
                
                {/* Calendar Icon Overlay */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  right: '20px',
                  transform: 'translateY(-50%)',
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: 'white',
                  fontWeight: 'bold',
                  zIndex: 1,
                  pointerEvents: 'none',
                  boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)'
                }}>
                  📅
                </div>
                
                {/* Subtle Background Pattern */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(240, 147, 251, 0.03) 0%, rgba(245, 87, 108, 0.03) 100%)',
                  borderRadius: '15px',
                  zIndex: 0
                }} />
              </div>
            </div>

            {/* Date Preview Card */}
            {selectedDate && (
              <div style={{
                marginTop: '20px',
                padding: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'slideInUp 0.5s ease-out'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '80px',
                  height: '80px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%'
                }} />
                
                <div style={{
                  position: 'relative',
                  zIndex: 2,
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '8px'
                  }}>
                    Selected Date
                  </div>
                  <div style={{
                    fontSize: '20px',
                    color: '#ffffff',
                    fontWeight: '700',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    marginBottom: '4px'
                  }}>
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: '500'
                  }}>
                    {new Date(selectedDate).getFullYear()}
                  </div>
                </div>
              </div>
            )}

            {/* Add CSS Animation */}
            <style jsx>{`
              @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(180deg); }
              }
              
              @keyframes slideInUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </FormGroup>

          <FormGroup>
            <label style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: '#2c3e50', 
              marginBottom: '15px',
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              ⏰ Select Time
            </label>
            <select 
              value={selectedTime} 
              onChange={(e) => setSelectedTime(e.target.value)}
              style={{
                width: '100%',
                padding: '18px 25px',
                border: '3px solid transparent',
                borderRadius: '20px',
                fontSize: '18px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: '#ffffff',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 8px 25px rgba(79, 172, 254, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                cursor: 'pointer',
                appearance: 'none',
                fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 20px center',
                backgroundSize: '24px',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ffffff';
                e.target.style.boxShadow = '0 12px 35px rgba(79, 172, 254, 0.6), 0 0 0 4px rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(-3px) scale(1.02)';
                e.target.style.background = 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'transparent';
                e.target.style.boxShadow = '0 8px 25px rgba(79, 172, 254, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
              }}
            >
              <option value="" style={{ 
                padding: '20px', 
                fontSize: '18px', 
                fontWeight: '600',
                fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                color: '#6c757d',
                border: 'none',
                borderRadius: '10px',
                margin: '5px 0'
              }}>
                {(() => {
                  const timeSlots = generateTimeSlots();
                  const now = new Date();
                  const selectedDateObj = new Date(selectedDate);
                  const isToday = selectedDate && 
                    selectedDateObj.toDateString() === now.toDateString();
                  
                  if (isToday && timeSlots.length === 0) {
                    return "⏰ No available times for today";
                  }
                  return "⏰ Choose time...";
                })()}
              </option>
              {generateTimeSlots().map(time => (
                <option key={time} value={time} style={{ 
                  padding: '20px', 
                  fontSize: '18px', 
                  fontWeight: '600',
                  fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  color: '#2c3e50',
                  border: 'none',
                  borderRadius: '10px',
                  margin: '5px 0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  🕐 {time}
                </option>
              ))}
            </select>
          </FormGroup>

          {selectedDate && selectedTime && (
            <TimezoneDisplay>
              <div className="timezone-info">
                <span className="label">Your Time ({userTimezone}):</span>
                <span className="time">
                  {getTimezoneTime(`${selectedDate}T${selectedTime}`, userTimezone)}
                </span>
              </div>
              {selectedOpponent && (
                <div className="timezone-info">
                  <span className="label">Opponent Time:</span>
                  <span className="time">
                    {getTimezoneTime(`${selectedDate}T${selectedTime}`, getOpponentTimezone(selectedOpponent))}
                  </span>
                </div>
              )}
              <div className="conversion">
                {selectedOpponent && `Opponent timezone: ${getOpponentTimezone(selectedOpponent)}`}
              </div>
            </TimezoneDisplay>
          )}

          <Button 
            onClick={handleScheduleMatch} 
            disabled={loading || !selectedOpponent || !selectedDate || !selectedTime}
          >
            {loading ? "Scheduling..." : "🚀 Schedule Match"}
          </Button>
        </Card>

        <Card>
          <h2>📋 My Schedules</h2>
          <ScheduleList>
            {schedules.length === 0 ? (
              <p style={{ textAlign: "center", color: "#666", fontStyle: "italic" }}>
                No matches scheduled yet
              </p>
            ) : (
              schedules.map((schedule, index) => (
                <ScheduleItem key={index}>
                  <div className="match-info">
                    <span className="teams">
                      {(() => {
                        const currentUser = userData?.teamName;
                        const isRequester = schedule.requester === currentUser;
                        const opponent = isRequester ? schedule.opponent : schedule.requester;
                        
                        // Debug log
                        console.log('Schedule display:', {
                          currentUser,
                          requester: schedule.requester,
                          opponent: schedule.opponent,
                          isRequester,
                          displayOpponent: opponent
                        });
                        
                        return `⚔️ vs ${opponent}`;
                      })()}
                    </span>
                    <span className={`status ${schedule.status === 'rejected' && schedule.newTimeSlot ? 'new-time' : schedule.status}`}>
                      {schedule.status === 'rejected' && schedule.newTimeSlot ? 'New Time Proposed' : 
                       schedule.status === 'pending' ? 'Pending Response' :
                       schedule.status === 'accepted' ? 'Accepted' :
                       schedule.status === 'rejected' ? 'Rejected' : schedule.status}
                    </span>
                  </div>
                  <div className="time-info">
                    {/* Original Time Display */}
                    <div className="timezone" style={{
                      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                      border: '2px solid #2196f3',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '8px'
                    }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '700', 
                        color: '#1976d2',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        🕐 Original Match Time
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '13px', color: '#333' }}>
                          <strong>Your Time ({userTimezone}):</strong> {getTimezoneTime(`${new Date(schedule.date).toISOString().split('T')[0]}T${schedule.time}`, userTimezone)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#333' }}>
                          <strong>Opponent Time ({getOpponentTimezone(schedule.opponent)}):</strong> {getTimezoneTime(`${new Date(schedule.date).toISOString().split('T')[0]}T${schedule.time}`, getOpponentTimezone(schedule.opponent))}
                        </div>
                      </div>
                    </div>

                    {/* New Proposed Time Display */}
                    {schedule.newTimeSlot && (
                      <div className="timezone" style={{ 
                        background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)', 
                        border: '2px solid #ffc107',
                        borderRadius: '12px',
                        padding: '12px',
                        marginBottom: '8px'
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '700', 
                          color: '#f57c00',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          🕐 New Proposed Time
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontSize: '13px', color: '#333' }}>
                            <strong>Your Time ({userTimezone}):</strong> {getTimezoneTime(`${new Date(schedule.date).toISOString().split('T')[0]}T${schedule.newTimeSlot}`, userTimezone)}
                          </div>
                          <div style={{ fontSize: '13px', color: '#333' }}>
                            <strong>Opponent Time ({getOpponentTimezone(schedule.opponent)}):</strong> {getTimezoneTime(`${new Date(schedule.date).toISOString().split('T')[0]}T${schedule.newTimeSlot}`, getOpponentTimezone(schedule.opponent))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Current Time Display */}
                    <div className="timezone" style={{
                      background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                      border: '2px solid #9c27b0',
                      borderRadius: '12px',
                      padding: '12px'
                    }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '700', 
                        color: '#7b1fa2',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        🌍 Current Time
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '13px', color: '#333' }}>
                          <strong>Your Current Time ({userTimezone}):</strong> {new Date().toLocaleString('en-US', { 
                            timeZone: userTimezone,
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                        <div style={{ fontSize: '13px', color: '#333' }}>
                          <strong>Opponent Current Time ({getOpponentTimezone(schedule.opponent)}):</strong> {new Date().toLocaleString('en-US', { 
                            timeZone: getOpponentTimezone(schedule.opponent),
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Countdown Timer */}
                  <div className="countdown-timer" style={{
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                    border: '2px solid #e74c3c',
                    borderRadius: '12px',
                    padding: '12px',
                    marginTop: '8px',
                    textAlign: 'center',
                    animation: 'pulse 2s infinite'
                  }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '700', 
                      color: '#ffffff',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      ⏰ Match Countdown
                    </div>
                    {(() => {
                      const timeRemaining = getTimeRemaining(schedule);
                      return (
                        <div style={{
                          fontSize: timeRemaining.isVeryUrgent ? '20px' : timeRemaining.isUrgent ? '18px' : '16px',
                          fontWeight: '800',
                          color: timeRemaining.isOverdue ? '#ff4757' : timeRemaining.isVeryUrgent ? '#ff3838' : timeRemaining.isUrgent ? '#ff6b35' : '#ffffff',
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          fontFamily: '"Courier New", monospace',
                          letterSpacing: '1px'
                        }}>
                          {timeRemaining.isOverdue ? (
                            <span style={{ color: '#ff4757' }}>⏰ {timeRemaining.text}</span>
                          ) : timeRemaining.isVeryUrgent ? (
                            <span style={{ color: '#ff3838', animation: 'blink 1s infinite' }}>🚨 {timeRemaining.text}</span>
                          ) : timeRemaining.isUrgent ? (
                            <span style={{ color: '#ff6b35' }}>⚠️ {timeRemaining.text}</span>
                          ) : (
                            <span>⏱️ {timeRemaining.text}</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Show accept/reject buttons for opponent when status is pending */}
                  {(() => {
                    const shouldShowPendingButtons = schedule.status === 'pending' && 
                                                   schedule.opponent === userData?.teamName;
                    
                    console.log('Pending buttons check:', {
                      scheduleStatus: schedule.status,
                      isOpponent: schedule.opponent === userData?.teamName,
                      currentUser: userData?.teamName,
                      opponent: schedule.opponent,
                      shouldShow: shouldShowPendingButtons
                    });
                    
                    return shouldShowPendingButtons ? (
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleAcceptSchedule(schedule._id)}
                          className="accept"
                        >
                          ✅ Accept
                        </button>
                        <button 
                          onClick={() => handleRejectSchedule(schedule._id)}
                          className="reject"
                        >
                          ❌ Reject & Propose New Time
                        </button>
                      </div>
                    ) : null;
                  })()}
                  
                  {/* Show accept new time button for requester when new time is proposed */}
                  {(() => {
                    const shouldShowNewTimeButtons = schedule.status === 'rejected' && 
                                                   schedule.newTimeSlot && 
                                                   schedule.requester === userData?.teamName;
                    
                    console.log('New time buttons check:', {
                      scheduleStatus: schedule.status,
                      hasNewTimeSlot: !!schedule.newTimeSlot,
                      isRequester: schedule.requester === userData?.teamName,
                      currentUser: userData?.teamName,
                      requester: schedule.requester,
                      shouldShow: shouldShowNewTimeButtons
                    });
                    
                    return shouldShowNewTimeButtons ? (
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleAcceptNewTime(schedule._id, schedule.newTimeSlot)}
                          className="accept"
                        >
                          ✅ Accept New Time
                        </button>
                        <button 
                          onClick={() => handleRejectNewTime(schedule._id)}
                          className="reject"
                        >
                          ❌ Reject New Time
                        </button>
                      </div>
                    ) : null;
                  })()}
                  
                  {/* Show waiting message for requester when status is pending */}
                  {schedule.status === 'pending' && schedule.requester === userData?.teamName && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#d1ecf1', borderRadius: '5px', border: '1px solid #bee5eb' }}>
                      <strong>⏳ Waiting for {schedule.opponent}'s response...</strong>
                    </div>
                  )}
                </ScheduleItem>
              ))
            )}
          </ScheduleList>
        </Card>
      </Content>

      {/* Beautiful New Time Proposal Modal */}
      {showNewTimeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '25px',
            padding: '6px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '19px',
              padding: '30px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Modal Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '30px',
                position: 'relative'
              }}>
                <div style={{
                  fontSize: '24px',
                  marginBottom: '10px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}>
                  🕐
                </div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#333',
                  margin: '0 0 8px 0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  Propose New Time
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: '#666',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  Select a new date and time that works better for you
                </p>
              </div>

              {/* Date Selection */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  📅 New Date
                </label>
                <div style={{
                  position: 'relative',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  borderRadius: '15px',
                  padding: '4px',
                  boxShadow: '0 8px 20px rgba(240, 147, 251, 0.3)'
                }}>
                  <input
                    type="date"
                    value={newProposedDate}
                    onChange={(e) => setNewProposedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '15px 20px',
                      border: 'none',
                      borderRadius: '11px',
                      fontSize: '16px',
                      fontWeight: '600',
                      background: 'white',
                      color: '#333',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

              {/* Time Selection */}
              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  ⏰ New Time
                </label>
                <div style={{
                  position: 'relative',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '15px',
                  padding: '4px',
                  boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
                }}>
                  <select
                    value={newProposedTime}
                    onChange={(e) => setNewProposedTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '15px 20px',
                      border: 'none',
                      borderRadius: '11px',
                      fontSize: '16px',
                      fontWeight: '600',
                      background: 'white',
                      color: '#333',
                      outline: 'none',
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23667eea\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 15px center',
                      backgroundSize: '20px',
                      paddingRight: '50px'
                    }}
                  >
                    <option value="">
                      {(() => {
                        const now = new Date();
                        const selectedDateObj = new Date(newProposedDate);
                        const isToday = newProposedDate && 
                          selectedDateObj.toDateString() === now.toDateString();
                        
                        if (isToday) {
                          const availableTimes = Array.from({ length: 24 }, (_, i) => {
                            const timeSlot = new Date();
                            timeSlot.setHours(i, 0, 0, 0);
                            const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
                            return timeSlot >= thirtyMinutesFromNow;
                          }).filter(Boolean);
                          
                          if (availableTimes.length === 0) {
                            return "No available times for today";
                          }
                        }
                        return "Select time...";
                      })()}
                    </option>
                    {(() => {
                      const now = new Date();
                      const selectedDateObj = new Date(newProposedDate);
                      const isToday = newProposedDate && 
                        selectedDateObj.toDateString() === now.toDateString();
                      
                      return Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        const timeString = `${hour}:00`;
                        
                        // If it's today, filter out past times
                        if (isToday) {
                          const timeSlot = new Date();
                          timeSlot.setHours(i, 0, 0, 0);
                          
                          // Only show time slots that are at least 30 minutes in the future
                          const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
                          if (timeSlot < thirtyMinutesFromNow) {
                            return null; // Don't render past times
                          }
                        }
                        
                        return (
                          <option key={hour} value={timeString}>
                            {timeString}
                          </option>
                        );
                      }).filter(Boolean); // Remove null values
                    })()}
                  </select>
                </div>
              </div>

              {/* Timezone Info */}
              <div style={{
                background: 'linear-gradient(135deg, #e8f0ff 0%, #f0f8ff 100%)',
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '25px',
                border: '2px solid rgba(102, 126, 234, 0.2)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#667eea',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '5px'
                }}>
                  Your Timezone
                </div>
                <div style={{
                  fontSize: '16px',
                  color: '#333',
                  fontWeight: '700'
                }}>
                  {userTimezone} - {new Date().toLocaleString('en-US', { 
                    timeZone: userTimezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setShowNewTimeModal(false)}
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
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f5f5f5';
                    e.target.style.borderColor = '#ccc';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#e0e0e0';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitNewTimeProposal}
                  style={{
                    padding: '12px 25px',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: '120px',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
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
          zIndex: 2000,
          padding: '20px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '25px',
            padding: '6px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            animation: 'popupSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '19px',
              padding: '30px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Popup Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '20px',
                position: 'relative'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '15px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
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
                  margin: '0 0 8px 0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {popupData.title}
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: '#666',
                  margin: 0,
                  fontWeight: '500',
                  lineHeight: '1.5'
                }}>
                  {popupData.message}
                </p>
              </div>

              {/* Action Buttons */}
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
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f5f5f5';
                      e.target.style.borderColor = '#ccc';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.borderColor = '#e0e0e0';
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
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
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

      {/* Modal Animation Styles */}
      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(-50px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes popupSlideIn {
          from {
            opacity: 0;
            transform: scale(0.7) translateY(-100px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7);
          }
          70% {
            transform: scale(1.02);
            box-shadow: 0 0 0 10px rgba(255, 107, 107, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 107, 107, 0);
          }
        }
        
        @keyframes blink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0.3;
          }
        }
        
        @keyframes urgentPulse {
          0% {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          }
          50% {
            background: linear-gradient(135deg, #ff3838 0%, #ff6b35 100%);
          }
          100% {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          }
        }
      `}</style>
    </SchedulerContainer>
  );
};

export default MatchScheduler;
