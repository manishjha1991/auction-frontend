import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { API_ENDPOINTS } from "../const";
import '../css/NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Get the logged-in user ID from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const loggedUserId = user?.id;

  // Function to fetch notifications from the API
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      } else {
        console.error("Error fetching notifications:", res.status);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch notifications on component mount (page refresh)
  useEffect(() => {
    fetchNotifications();
  }, []);

  // 🚀 NOTIFICATION: Identify user to server and handle exit notifications
  useEffect(() => {
    if (!loggedUserId) return;
    
    const socket = io(API_ENDPOINTS);
    
    // Identify this user to the server for targeted notifications
    socket.emit('user_identify', { userId: loggedUserId });
    
    // Play notification sound
    const playNotificationSound = () => {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5; // 50% volume
        audio.play().catch(err => {
          console.log('Could not play notification sound:', err);
          // Fallback: Use Web Audio API beep if file not found
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        });
      } catch (err) {
        console.log('Sound notification not available:', err);
      }
    };
    
    socket.on('bid_exit_notification', (data) => {
      console.log("Received bid exit notification:", data);
      // Backend now only sends to relevant users, but keep as safety check
      if (data.currentBidder && data.currentBidder === loggedUserId) {
        setNotifications(prev => [...prev, data]);
        playNotificationSound();
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [loggedUserId]);

  // 🚀 NOTIFICATION: Identify user to server and handle bid notifications
  useEffect(() => {
    if (!loggedUserId) return;
    
    const socket = io(API_ENDPOINTS);
    
    // Identify this user to the server for targeted notifications
    socket.emit('user_identify', { userId: loggedUserId });
    
    // Play notification sound
    const playNotificationSound = () => {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5; // 50% volume
        audio.play().catch(err => {
          console.log('Could not play notification sound:', err);
          // Fallback: Use Web Audio API beep if file not found
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        });
      } catch (err) {
        console.log('Sound notification not available:', err);
      }
    };
    
    socket.on('bid_notification', (data) => {
      console.log("Received bid notification:", data);
      // Backend now only sends to active bidders, but keep as safety check
      if (data.secondBidder && data.secondBidder === loggedUserId) {
        setNotifications(prev => [...prev, data]);
        playNotificationSound();
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [loggedUserId]);

  // Auto-close dropdown and clear notifications after 10 sec when dropdown is open
  useEffect(() => {
    let timer, countdownTimer;
    if (dropdownVisible) {
      setCountdown(10);
      countdownTimer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      timer = setTimeout(() => {
        handleClearNotifications();
        setDropdownVisible(false);
      }, 10000);
    }
    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, [dropdownVisible]);

  const handleBellClick = () => {
    setDropdownVisible(!dropdownVisible);
  };

  // Handler for manually clearing notifications via API
  const handleClearNotifications = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/notifications/clear`, {
        method: 'POST'
      });
      if (res.ok) {
        setNotifications([]);
      } else {
        console.error("Error clearing notifications:", res.status);
      }
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // Helper function to format bid amounts in Thousand, Lakh, or Crore
  const formatBidAmount = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Crore`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} Lakh`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)} Thousand`;
    return `₹${amount}`;
  };

  // Determine notification type based on its message content
  const getNotificationType = (notif) => {
    const msg = notif.message.toLowerCase();
    if (msg.includes("exit")) return "exit";
    if (msg.includes("new bid")) return "new";
    return "normal";
  };

  // Compute count badge color based on majority type
  const newBidCount = notifications.filter(n => n.message.toLowerCase().includes("new bid")).length;
  const exitCount = notifications.filter(n => n.message.toLowerCase().includes("exit")).length;
  let badgeColor = "#ffc107"; // yellow (default)
  if (newBidCount > exitCount && newBidCount > 0) {
    badgeColor = "#00ff00"; // green for new bids
  } else if (exitCount > newBidCount && exitCount > 0) {
    badgeColor = "#ff4444"; // red for exit notifications
  }

  const notificationCount = notifications.length;

  return (
    <div className="notification-bell-container">
      <div className={`bell-icon ${notificationCount > 0 ? 'active' : ''}`} onClick={handleBellClick}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
          <path
            fill={notificationCount > 0 ? "#00ff00" : "#ff4444"}
            d="M12 2C10.346 2 9 3.346 9 5v1.093C5.168 7.26 3 10.012 3 13v5l-1 1v1h20v-1l-1-1v-5c0-2.988-2.168-5.74-6-5.907V5c0-1.654-1.346-3-3-3zm1 18h-2v-1h2v1zm6-4H5v-4c0-2.757 2.243-5 5-5h4c2.757 0 5 2.243 5 5v4z"
          />
        </svg>
        {notificationCount > 0 && (
          <div 
            className="notification-count" 
            style={{ backgroundColor: badgeColor }}
          >
            {notificationCount}
          </div>
        )}
      </div>
      {dropdownVisible && (
        <div className="notification-dropdown">
          <button className="dropdown-close-btn" onClick={handleBellClick}>✖</button>
          {notifications.length > 0 ? (
            [...notifications].reverse().map((notif, index) => (
              <div key={index} className={`notification-item ${getNotificationType(notif)}`}>
                <p className="notif-message">{notif.message}</p>
                <div className="notif-details">
                  <span className="notif-label">Player:</span>
                  <span className="notif-value">{notif.playername}</span>
                </div>
                <div className="notif-details">
                  <span className="notif-label">Bid:</span>
                  <span className="notif-value">{formatBidAmount(notif.currentBid)}</span>
                </div>
                {getNotificationType(notif) !== 'exit' && (
                  <div className="notif-details">
                    <span className="notif-label">Bidder:</span>
                    <span className="notif-value">{notif.currentBidder}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="no-notifications">No new notifications</p>
          )}
          <div className="dropdown-loader">
            <div className="spinner"></div>
            <span>Closing in {countdown} sec</span>
          </div>
          <button className="clear-notifications-btn" onClick={handleClearNotifications}>
            Clear Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
