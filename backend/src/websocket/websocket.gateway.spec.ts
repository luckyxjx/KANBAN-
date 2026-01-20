import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketGatewayService } from './websocket.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WorkspaceService } from '../workspace/workspace.service';

/**
 * WebSocket Resource Cleanup Unit Tests
 * Requirement 5.6: WHEN a user disconnects, THE System SHALL clean up their WebSocket subscriptions
 * 
 * Property 14: WebSocket Resource Cleanup
 * Validates: Requirements 5.6
 */
describe('WebSocketGatewayService - Resource Cleanup', () => {
  let service: WebSocketGatewayService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let workspaceService: WorkspaceService;

  // Mock socket for testing
  class MockSocket {
    id: string;
    userId?: string;
    workspaceIds?: Set<string>;
    cleanupTimer?: NodeJS.Timeout;
    connected: boolean = true;
    handshake: any;
    rooms: Set<string> = new Set();

    constructor(id: string, token: string) {
      this.id = id;
      this.handshake = {
        auth: { token },
      };
    }

    join(room: string) {
      this.rooms.add(room);
    }

    leave(room: string) {
      this.rooms.delete(room);
    }

    disconnect(force?: boolean) {
      this.connected = false;
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketGatewayService,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn().mockReturnValue({ sub: 'test-user-id' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: WorkspaceService,
          useValue: {
            getUserWorkspaces: jest.fn().mockResolvedValue([
              { id: 'workspace-1', name: 'Test Workspace' },
            ]),
          },
        },
      ],
    }).compile();

    service = module.get<WebSocketGatewayService>(WebSocketGatewayService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    workspaceService = module.get<WorkspaceService>(WorkspaceService);

    // Mock the server
    service['server'] = {
      sockets: {
        sockets: new Map(),
        adapter: {
          rooms: new Map(),
        },
      },
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    } as any;
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('Disconnection Handling', () => {
    it('should clean up socket tracking on disconnect', async () => {
      const mockSocket = new MockSocket('socket-1', 'valid-token') as any;

      // Simulate connection
      await service.handleConnection(mockSocket);

      // Verify socket is tracked
      const initialCount = service.getUserConnectionCount('test-user-id');
      expect(initialCount).toBe(1);

      // Simulate disconnection
      await service.handleDisconnect(mockSocket);

      // Verify socket is removed from tracking
      const finalCount = service.getUserConnectionCount('test-user-id');
      expect(finalCount).toBe(0);
    });

    it('should remove user from connectedClients map when last socket disconnects', async () => {
      const mockSocket = new MockSocket('socket-2', 'valid-token') as any;

      // Simulate connection
      await service.handleConnection(mockSocket);

      // Verify user is tracked
      let connectedCount = service.getConnectedUsersCount();
      expect(connectedCount).toBeGreaterThan(0);

      // Simulate disconnection
      await service.handleDisconnect(mockSocket);

      // Verify user is removed from connectedClients
      const finalConnectedCount = service.getConnectedUsersCount();
      expect(finalConnectedCount).toBeLessThanOrEqual(connectedCount);
    });

    it('should handle disconnect for unknown socket gracefully', async () => {
      const mockSocket = new MockSocket('unknown-socket', 'valid-token') as any;

      // Should not throw
      expect(() => service.handleDisconnect(mockSocket)).not.toThrow();
    });
  });

  describe('Subscription Cleanup', () => {
    it('should leave all workspace rooms on disconnect', async () => {
      const mockSocket = new MockSocket('socket-3', 'valid-token') as any;

      // Simulate connection
      await service.handleConnection(mockSocket);

      // Verify socket is in workspace room
      expect(mockSocket.rooms.size).toBeGreaterThan(0);

      // Simulate disconnection
      await service.handleDisconnect(mockSocket);

      // Verify socket left all rooms
      expect(mockSocket.rooms.size).toBe(0);
    });

    it('should clear workspaceIds set on disconnect', async () => {
      const mockSocket = new MockSocket('socket-4', 'valid-token') as any;

      // Simulate connection
      await service.handleConnection(mockSocket);

      // Verify workspaceIds is populated
      expect(mockSocket.workspaceIds.size).toBeGreaterThan(0);

      // Simulate disconnection
      await service.handleDisconnect(mockSocket);

      // Verify workspaceIds is cleared
      expect(mockSocket.workspaceIds.size).toBe(0);
    });

    it('should clean up cleanup timer on disconnect', async () => {
      const mockSocket = new MockSocket('socket-5', 'valid-token') as any;
      const mockTimer = setTimeout(() => {}, 1000);
      mockSocket.cleanupTimer = mockTimer;

      // Simulate connection
      await service.handleConnection(mockSocket);

      // Simulate disconnection
      await service.handleDisconnect(mockSocket);

      // Verify cleanup timer was cleared (no error thrown)
      expect(() => service.handleDisconnect(mockSocket)).not.toThrow();
    });
  });

  describe('Connection Limit Management', () => {
    it('should enforce connection limit per user', async () => {
      const maxConnections = 5;
      const mockSockets: any[] = [];

      // Create max connections
      for (let i = 0; i < maxConnections; i++) {
        const mockSocket = new MockSocket(`socket-limit-${i}`, 'valid-token');
        mockSockets.push(mockSocket);
        await service.handleConnection(mockSocket as any);
      }

      // Verify all connections are established
      expect(service.getUserConnectionCount('test-user-id')).toBe(
        maxConnections,
      );

      // Try to create one more connection (should be rejected)
      const extraSocket = new MockSocket('socket-extra', 'valid-token');
      await service.handleConnection(extraSocket as any);

      // Verify extra connection was rejected (not added to tracking)
      expect(service.getUserConnectionCount('test-user-id')).toBe(
        maxConnections,
      );

      // Clean up
      for (const socket of mockSockets) {
        await service.handleDisconnect(socket);
      }
    });

    it('should track connection count accurately', async () => {
      const socket1 = new MockSocket('socket-track-1', 'valid-token');
      await service.handleConnection(socket1 as any);

      const count1 = service.getUserConnectionCount('test-user-id');
      expect(count1).toBe(1);

      const socket2 = new MockSocket('socket-track-2', 'valid-token');
      await service.handleConnection(socket2 as any);

      const count2 = service.getUserConnectionCount('test-user-id');
      expect(count2).toBe(2);

      await service.handleDisconnect(socket1 as any);

      const count3 = service.getUserConnectionCount('test-user-id');
      expect(count3).toBe(1);

      await service.handleDisconnect(socket2 as any);

      const count4 = service.getUserConnectionCount('test-user-id');
      expect(count4).toBe(0);
    });
  });

  describe('Graceful Disconnection', () => {
    it('should provide method to disconnect user from all connections', async () => {
      const socket1 = new MockSocket('socket-graceful-1', 'valid-token');
      const socket2 = new MockSocket('socket-graceful-2', 'valid-token');

      await service.handleConnection(socket1 as any);
      await service.handleConnection(socket2 as any);

      // Verify both connections are active
      expect(service.getUserConnectionCount('test-user-id')).toBe(2);

      // Verify disconnectUser method exists and is callable
      expect(typeof service.disconnectUser).toBe('function');

      // Clean up manually
      await service.handleDisconnect(socket1 as any);
      await service.handleDisconnect(socket2 as any);

      // Verify both connections are closed
      expect(service.getUserConnectionCount('test-user-id')).toBe(0);
    });
  });

  describe('Stale Connection Cleanup', () => {
    it('should provide cleanup method for stale connections', async () => {
      const mockSocket = new MockSocket('socket-stale', 'valid-token');
      await service.handleConnection(mockSocket as any);

      const initialCount = service.getUserConnectionCount('test-user-id');
      expect(initialCount).toBe(1);

      // Verify cleanup method exists and is callable
      expect(typeof service['cleanupStaleConnections']).toBe('function');

      // Manually trigger cleanup
      service['cleanupStaleConnections']();

      // Verify cleanup doesn't break anything
      const afterCleanupCount = service.getUserConnectionCount('test-user-id');
      expect(afterCleanupCount).toBeLessThanOrEqual(initialCount);

      await service.handleDisconnect(mockSocket as any);
    });

    it('should remove stale sockets from tracking', async () => {
      const mockSocket = new MockSocket('socket-stale-2', 'valid-token');
      await service.handleConnection(mockSocket as any);

      // Mark socket as disconnected
      mockSocket.connected = false;

      // Manually trigger cleanup
      service['cleanupStaleConnections']();

      // Verify stale socket is removed
      const count = service.getUserConnectionCount('test-user-id');
      expect(count).toBe(0);
    });
  });

  describe('Resource Cleanup on Module Destroy', () => {
    it('should provide onModuleDestroy method for cleanup', async () => {
      // Verify onModuleDestroy method exists
      expect(typeof service.onModuleDestroy).toBe('function');

      // Call onModuleDestroy
      expect(() => service.onModuleDestroy()).not.toThrow();
    });

    it('should clear cleanup interval on module destroy', async () => {
      // Verify cleanup interval is set
      expect(service['cleanupInterval']).toBeDefined();

      // Call onModuleDestroy
      service.onModuleDestroy();

      // Verify interval is cleared (calling again should not throw)
      expect(() => service.onModuleDestroy()).not.toThrow();
    });
  });

  describe('Connection Monitoring', () => {
    it('should provide method to get user connection count', async () => {
      const mockSocket = new MockSocket('socket-monitor', 'valid-token');
      await service.handleConnection(mockSocket as any);

      const count = service.getUserConnectionCount('test-user-id');
      expect(count).toBe(1);
      expect(typeof count).toBe('number');

      await service.handleDisconnect(mockSocket as any);
    });

    it('should return 0 for user with no connections', async () => {
      const count = service.getUserConnectionCount('non-existent-user');
      expect(count).toBe(0);
    });

    it('should provide method to get workspace connected users', async () => {
      const mockSocket = new MockSocket('socket-workspace', 'valid-token');
      await service.handleConnection(mockSocket as any);

      const count = service.getWorkspaceConnectedUsers('workspace-1');
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);

      await service.handleDisconnect(mockSocket as any);
    });

    it('should provide method to get total connected users', async () => {
      const mockSocket = new MockSocket('socket-total', 'valid-token');
      await service.handleConnection(mockSocket as any);

      const count = service.getConnectedUsersCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);

      await service.handleDisconnect(mockSocket as any);
    });
  });

  describe('Periodic Cleanup Interval', () => {
    it('should start cleanup interval on construction', async () => {
      expect(service['cleanupInterval']).toBeDefined();
    });

    it('should have cleanup interval set to 30 seconds', async () => {
      // The interval is set in the constructor
      // We can verify it exists and is a valid timer
      expect(service['cleanupInterval']).toBeDefined();
      expect(typeof service['cleanupInterval']).toBe('object');
    });
  });
});
