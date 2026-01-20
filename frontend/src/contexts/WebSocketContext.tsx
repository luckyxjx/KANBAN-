import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { websocketService, type CardEvent, type ListEvent, type BoardEvent } from '../services/websocketService';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';
import { useDemoData } from './DemoDataProvider';

interface WebSocketContextType {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  onCardEvent: (handler: (event: CardEvent) => void) => void;
  offCardEvent: (handler: (event: CardEvent) => void) => void;
  onListEvent: (handler: (event: ListEvent) => void) => void;
  offListEvent: (handler: (event: ListEvent) => void) => void;
  onBoardEvent: (handler: (event: BoardEvent) => void) => void;
  offBoardEvent: (handler: (event: BoardEvent) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

/**
 * WebSocket Provider for real-time collaboration
 * Requirement 5.1: Set up Socket.IO client with JWT authentication
 * Requirement 5.2: Join user to workspace rooms
 * Requirement 5.4: Create connection status indicators
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { demoMode } = useDemoData();
  
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Connect to WebSocket when user is authenticated and workspace is selected
   * Requirement 5.1: Authenticate the connection using JWT tokens
   * Requirement 5.2: Join the user to rooms for their accessible workspaces
   */
  useEffect(() => {
    // Skip WebSocket in demo mode
    if (demoMode) {
      return;
    }

    // Only connect if user is authenticated and workspace is selected
    if (!isAuthenticated || !user || !currentWorkspace) {
      // Disconnect if conditions are no longer met
      if (websocketService.isConnected()) {
        websocketService.disconnect();
        setConnected(false);
      }
      return;
    }

    const connectWebSocket = async () => {
      try {
        setConnecting(true);
        setError(null);

        // Get JWT token from cookies (it's httpOnly, so we need to get it from the server)
        // The server will send it in the response headers or we can use a dedicated endpoint
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'https://localhost:3000'}/auth/token`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to get authentication token');
        }

        const { token } = await response.json();

        // Connect to WebSocket with authentication
        await websocketService.connect({
          url: import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'https://localhost:3000',
          token,
        });

        setConnected(true);
        setConnecting(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect to WebSocket';
        setError(errorMessage);
        setConnecting(false);
        console.error('WebSocket connection error:', err);
      }
    };

    connectWebSocket();

    // Setup connection status listeners
    const handleConnected = () => {
      setConnected(true);
      setError(null);
    };

    const handleDisconnected = () => {
      setConnected(false);
    };

    const handleConnectionError = (data: any) => {
      setError(data.error || 'Connection error');
    };

    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);
    websocketService.on('connection_error', handleConnectionError);

    // Cleanup on unmount
    return () => {
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
      websocketService.off('connection_error', handleConnectionError);
    };
  }, [isAuthenticated, user, currentWorkspace, demoMode]);

  /**
   * Requirement 5.4: Create connection status indicators
   */
  const onCardEvent = (handler: (event: CardEvent) => void) => {
    websocketService.on('card:event', handler);
  };

  const offCardEvent = (handler: (event: CardEvent) => void) => {
    websocketService.off('card:event', handler);
  };

  const onListEvent = (handler: (event: ListEvent) => void) => {
    websocketService.on('list:event', handler);
  };

  const offListEvent = (handler: (event: ListEvent) => void) => {
    websocketService.off('list:event', handler);
  };

  const onBoardEvent = (handler: (event: BoardEvent) => void) => {
    websocketService.on('board:event', handler);
  };

  const offBoardEvent = (handler: (event: BoardEvent) => void) => {
    websocketService.off('board:event', handler);
  };

  const value: WebSocketContextType = {
    connected,
    connecting,
    error,
    onCardEvent,
    offCardEvent,
    onListEvent,
    offListEvent,
    onBoardEvent,
    offBoardEvent,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
