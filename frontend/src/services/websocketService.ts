import { io, Socket } from 'socket.io-client';

/**
 * WebSocket Service for real-time collaboration
 * Requirement 5.1: Set up Socket.IO client with JWT authentication
 * Requirement 5.3: Create real-time event handlers for board updates
 */

export interface CardEvent {
  type: 'card.created' | 'card.updated' | 'card.moved' | 'card.deleted';
  data: any;
  timestamp: Date;
}

export interface ListEvent {
  type: 'list.created' | 'list.updated' | 'list.reordered' | 'list.deleted';
  data: any;
  timestamp: Date;
}

export interface BoardEvent {
  type: 'board.created' | 'board.updated' | 'board.deleted';
  data: any;
  timestamp: Date;
}

export type RealtimeEvent = CardEvent | ListEvent | BoardEvent;

export interface WebSocketServiceConfig {
  url: string;
  token: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Connect to WebSocket server with JWT authentication
   * Requirement 5.1: Authenticate the connection using JWT tokens
   */
  connect(config: WebSocketServiceConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(config.url, {
          auth: {
            token: config.token,
          },
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
        });

        // Handle connection success
        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.emit('connected', { timestamp: new Date() });
          resolve();
        });

        // Handle connection errors
        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.emit('connection_error', { error: error.message });
          reject(error);
        });

        // Handle disconnection
        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.emit('disconnected', { reason });
        });

        // Handle reconnection attempts
        this.socket.on('reconnect_attempt', () => {
          this.reconnectAttempts++;
          console.log(`Reconnection attempt ${this.reconnectAttempts}`);
          this.emit('reconnecting', { attempt: this.reconnectAttempts });
        });

        // Setup event listeners for real-time updates
        this.setupEventListeners();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Setup event listeners for real-time updates
   * Requirement 5.3: Create real-time event handlers for board updates
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Card events
    this.socket.on('card:event', (event: CardEvent) => {
      console.log('Card event received:', event);
      this.emit('card:event', event);
    });

    // List events
    this.socket.on('list:event', (event: ListEvent) => {
      console.log('List event received:', event);
      this.emit('list:event', event);
    });

    // Board events
    this.socket.on('board:event', (event: BoardEvent) => {
      console.log('Board event received:', event);
      this.emit('board:event', event);
    });
  }

  /**
   * Disconnect from WebSocket server
   * Requirement 5.6: Clean up subscriptions on disconnect
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.eventHandlers.clear();
    }
  }

  /**
   * Check if connected to WebSocket
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Register event handler
   * Requirement 5.4: Implement real-time synchronization with local state
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler);
  }

  /**
   * Unregister event handler
   */
  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit event to all registered handlers
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get socket instance for advanced usage
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
