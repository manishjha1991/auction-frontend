import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
`;

const Toast = styled.div`
  background: ${props => {
    if (props.type === 'success') return '#10b981';
    if (props.type === 'error') return '#ef4444';
    if (props.type === 'warning') return '#f59e0b';
    return '#3b82f6';
  }};
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 500px;
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: auto;
  animation: ${props => props.isExiting ? slideOut : slideIn} 0.3s ease-out;
  position: relative;
  overflow: hidden;
`;

const Icon = styled.div`
  font-size: 24px;
  flex-shrink: 0;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 16px;
`;

const Message = styled.div`
  font-size: 14px;
  opacity: 0.95;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;
  flex-shrink: 0;
  
  &:hover {
    opacity: 1;
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  width: ${props => props.progress}%;
  transition: width 0.1s linear;
`;

// Toast Context
const ToastContext = React.createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message: typeof message === 'string' ? message : message.message || 'Notification',
      title: typeof message === 'object' ? message.title : null,
      type,
      duration,
      progress: 100,
      isExiting: false
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove after duration
    if (duration > 0) {
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        setToasts(prev => prev.map(t => {
          if (t.id === id) {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const newProgress = (remaining / duration) * 100;
            
            if (newProgress <= 0) {
              clearInterval(progressInterval);
              return { ...t, isExiting: true };
            }
            
            return { ...t, progress: newProgress };
          }
          return t;
        }));
      }, 100);

      setTimeout(() => {
        clearInterval(progressInterval);
        setToasts(prev => prev.map(t => 
          t.id === id ? { ...t, isExiting: true } : t
        ));
        
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 300);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.map(t => 
      t.id === id ? { ...t, isExiting: true } : t
    ));
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            isExiting={toast.isExiting}
          >
            <Icon>{getIcon(toast.type)}</Icon>
            <Content>
              {toast.title && <Title>{toast.title}</Title>}
              <Message>{toast.message}</Message>
            </Content>
            <CloseButton onClick={() => removeToast(toast.id)}>×</CloseButton>
            {toast.duration > 0 && <ProgressBar progress={toast.progress} />}
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export default ToastProvider;

