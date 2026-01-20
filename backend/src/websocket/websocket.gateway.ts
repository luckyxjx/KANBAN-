import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WorkspaceService } from '../workspace/workspace.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  workspaceIds?: Set<string>;
  cleanupTimer?: NodeJS.Timeout;
}

/**
 * WebSocket Gateway for real-time collaboration
 * Requirement 5.1: WHEN a user connects via WebSocket, 
 * THE System SHALL authenticate the connection using JWT tokens
 * 
 * Requirement 5.2: WHEN a WebSocket connection is established,
 * THE System SHALL join the user to rooms for their accessible workspaces
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  transports: ['websocket'],
})
@Injectable()
export class WebSocketGatewayService
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGatewayService.name);
  private connectedClients = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private socketToUser = new Map<string, string>(); // socketId -> userId
  private readonly MAX_CONNECTIONS_PER_USER = 5;
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private workspaceService: WorkspaceService,
  ) {
    // Start periodic cleanup of stale connections
    this.startCleanupInterval();
  }

  /**
   * Start periodic cleanup of stale connections
   * Requirement 5.6: Manage connection limits and cleanup
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, 30000); // Run every 30 seconds
  }

  /**
   * Clean up stale connections
   * Requirement 5.6: Ensure proper resource cleanup
   */
  private cleanupStaleConnections(): void {
    for (const [userId, socketIds] of this.connectedClients.entries()) {
      const validSockets = new Set<string>();

      for (const socketId of socketIds) {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket && socket.connected) {
          validSockets.add(socketId);
        } else {
          // Socket is stale, clean it up
          this.socketToUser.delete(socketId);
          this.logger.debug(
            `Cleaned up stale socket ${socketId} for user ${userId}`,
          );
        }
      }

      if (validSockets.size === 0) {
        this.connectedClients.delete(userId);
      } else {
        this.connectedClients.set(userId, validSockets);
      }
    }
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Handle WebSocket connection
   * Requirement 5.1: Authenticate the connection using JWT tokens
   * Requirement 5.2: Join user to workspace rooms
   * Requirement 5.6: Manage connection limits
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract JWT token from handshake auth
      const token = client.handshake.auth.token;

      if (!token) {
        this.logger.warn('Connection attempt without token');
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const userId = payload.sub;

      // Check connection limits
      // Requirement 5.6: Create connection limit management
      const currentConnections = this.connectedClients.get(userId)?.size || 0;
      if (currentConnections >= this.MAX_CONNECTIONS_PER_USER) {
        this.logger.warn(
          `Connection limit exceeded for user ${userId}. Current: ${currentConnections}`,
        );
        client.disconnect();
        return;
      }

      // Attach user info to socket
      client.userId = userId;
      client.workspaceIds = new Set();

      // Track connection
      if (!this.connectedClients.has(userId)) {
        this.connectedClients.set(userId, new Set());
      }
      const userSockets = this.connectedClients.get(userId);
      if (userSockets) {
        userSockets.add(client.id);
      }
      this.socketToUser.set(client.id, userId);

      // Get user's workspaces
      const userWorkspaces = await this.workspaceService.getUserWorkspaces(
        userId,
      );

      // Join workspace rooms
      for (const workspace of userWorkspaces) {
        const roomName = `workspace:${workspace.id}`;
        client.join(roomName);
        client.workspaceIds.add(workspace.id);
      }

      this.logger.log(
        `User ${userId} connected with socket ${client.id}. Joined ${userWorkspaces.length} workspace rooms.`,
      );
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnection
   * Requirement 5.6: Clean up subscriptions and room memberships on disconnect
   */
  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = this.socketToUser.get(client.id);

    if (userId) {
      // Clean up timer if exists
      if (client.cleanupTimer) {
        clearTimeout(client.cleanupTimer);
      }

      // Leave all workspace rooms
      if (client.workspaceIds) {
        for (const workspaceId of client.workspaceIds) {
          const roomName = `workspace:${workspaceId}`;
          client.leave(roomName);
        }
        client.workspaceIds.clear();
      }

      // Remove from tracking
      const userSockets = this.connectedClients.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedClients.delete(userId);
        }
      }
      this.socketToUser.delete(client.id);

      this.logger.log(
        `User ${userId} disconnected. Socket ${client.id} removed. Subscriptions cleaned up.`,
      );
    }
  }

  /**
   * Broadcast event to workspace members
   * Requirement 5.3: Broadcast changes to all workspace members
   * Requirement 5.5: Ensure only workspace members receive updates
   */
  broadcastToWorkspace(
    workspaceId: string,
    eventName: string,
    data: any,
  ): void {
    const roomName = `workspace:${workspaceId}`;
    this.server.to(roomName).emit(eventName, data);
    this.logger.debug(
      `Broadcast to workspace ${workspaceId}: ${eventName}`,
    );
  }

  /**
   * Broadcast card event
   */
  broadcastCardEvent(
    workspaceId: string,
    eventType: string,
    cardData: any,
  ): void {
    this.broadcastToWorkspace(workspaceId, 'card:event', {
      type: eventType,
      data: cardData,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast list event
   */
  broadcastListEvent(
    workspaceId: string,
    eventType: string,
    listData: any,
  ): void {
    this.broadcastToWorkspace(workspaceId, 'list:event', {
      type: eventType,
      data: listData,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast board event
   */
  broadcastBoardEvent(
    workspaceId: string,
    eventType: string,
    boardData: any,
  ): void {
    this.broadcastToWorkspace(workspaceId, 'board:event', {
      type: eventType,
      data: boardData,
      timestamp: new Date(),
    });
  }

  /**
   * Get connected users count for a workspace
   */
  getWorkspaceConnectedUsers(workspaceId: string): number {
    const roomName = `workspace:${workspaceId}`;
    const room = this.server.sockets.adapter.rooms.get(roomName);
    return room ? room.size : 0;
  }

  /**
   * Get all connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Gracefully disconnect a user from all connections
   * Requirement 5.6: Provide mechanism to disconnect users
   */
  disconnectUser(userId: string): void {
    const userSockets = this.connectedClients.get(userId);
    if (userSockets) {
      for (const socketId of userSockets) {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }
    }
  }

  /**
   * Get connection count for a specific user
   * Requirement 5.6: Monitor connection limits
   */
  getUserConnectionCount(userId: string): number {
    return this.connectedClients.get(userId)?.size || 0;
  }
}
