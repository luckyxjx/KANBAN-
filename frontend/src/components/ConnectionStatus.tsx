import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useDemoData } from '../contexts/DemoDataProvider';
import './ConnectionStatus.css';

/**
 * Connection Status Indicator Component
 * Requirement 5.4: Create connection status indicators
 */
const ConnectionStatus: React.FC = () => {
  const { connected, connecting, error } = useWebSocket();
  const { demoMode } = useDemoData();

  // Don't show status in demo mode
  if (demoMode) {
    return null;
  }

  if (connecting) {
    return (
      <div className="connection-status connecting" title="Connecting to real-time updates...">
        <div className="status-dot"></div>
        <span className="status-text">Connecting...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="connection-status error" title={`Connection error: ${error}`}>
        <div className="status-dot"></div>
        <span className="status-text">Connection Error</span>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="connection-status connected" title="Connected to real-time updates">
        <div className="status-dot"></div>
        <span className="status-text">Connected</span>
      </div>
    );
  }

  return (
    <div className="connection-status disconnected" title="Disconnected from real-time updates">
      <div className="status-dot"></div>
      <span className="status-text">Disconnected</span>
    </div>
  );
};

export default ConnectionStatus;
