import React, { useEffect, useState } from 'react';
import { CheckIcon, CloseIcon, LoadingIcon } from './icons';
import './Toast.css';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'loading' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  title, 
  message, 
  duration = 4000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [type, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 200);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckIcon size={20} />;
      case 'error':
        return <CloseIcon size={20} />;
      case 'loading':
        return <LoadingIcon size={20} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`toast toast-${type} ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}
    >
      <div className="toast-icon">
        {getIcon()}
      </div>
      
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        {message && <div className="toast-message">{message}</div>}
      </div>
      
      {type !== 'loading' && (
        <button className="toast-close" onClick={handleClose}>
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;