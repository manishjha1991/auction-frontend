import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { API_ENDPOINTS } from '../const';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef(new Map()); // Track all registered listeners
  const userRef = useRef(null);

  useEffect(() => {
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    userRef.current = user;

    // Create single socket connection
    const socketInstance = io(API_ENDPOINTS, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
      
      // Identify user if available
      if (user?.id) {
        socketInstance.emit('user_identify', { userId: user.id });
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up socket connection');
      // Remove all listeners
      listenersRef.current.forEach((listener, event) => {
        socketInstance.off(event, listener);
      });
      listenersRef.current.clear();
      socketInstance.disconnect();
    };
  }, []);

  // Helper to register event listeners (with automatic cleanup tracking)
  const on = (event, callback) => {
    if (!socket) return () => {};
    
    socket.on(event, callback);
    
    // Track listener for cleanup
    const listenerId = `${event}_${Date.now()}_${Math.random()}`;
    listenersRef.current.set(listenerId, { event, callback });
    
    // Return cleanup function
    return () => {
      socket.off(event, callback);
      listenersRef.current.delete(listenerId);
    };
  };

  // Helper to emit events
  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const value = {
    socket,
    isConnected,
    on,
    emit,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};





