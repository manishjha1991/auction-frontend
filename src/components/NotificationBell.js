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

  // Helper function to format bid amounts in Thousand, Lakh, or Crore
  const formatBidAmount = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Crore`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} Lakh`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)} Thousand`;
    return `₹${amount}`;
  };

  useEffect(() => {
    const socket = io(API_ENDPOINTS);
    socket.on('bid_notification', (data) => {
      console.log("Received bid notification:", data);
      // Only add notification if secondBidder exists and matches the logged-in user id.
      if (data.secondBidder && data.secondBidder === loggedUserId) {
        setNotifications(prev => [...prev, data]);
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
        setNotifications([]);
        setDropdownVisible(false);
      }, 10000);
    }
    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, [dropdownVisible]);

  const handleBellClick = () => {
    // If closing manually, clear notifications immediately
    if (dropdownVisible) {
      setNotifications([]);
    }
    setDropdownVisible(!dropdownVisible);
  };

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
          <div className="notification-count">{notificationCount}</div>
        )}
      </div>
      {dropdownVisible && (
        <div className="notification-dropdown">
          <button className="dropdown-close-btn" onClick={handleBellClick}>✖</button>
          {notifications.length > 0 ? (
            notifications.map((notif, index) => (
              <div key={index} className="notification-item">
                <p className="notif-message">{notif.message}</p>
                <div className="notif-details">
                  <span className="notif-label">Player:</span>
                  <span className="notif-value">{notif.playername}</span>
                </div>
                <div className="notif-details">
                  <span className="notif-label">Bid:</span>
                  <span className="notif-value">{formatBidAmount(notif.currentBid)}</span>
                </div>
                <div className="notif-details">
                  <span className="notif-label">Bidder:</span>
                  <span className="notif-value">{notif.currentBidder}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="no-notifications">No new notifications</p>
          )}
          <div className="dropdown-loader">
            <div className="spinner"></div>
            <span>Closing in {countdown} sec</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
