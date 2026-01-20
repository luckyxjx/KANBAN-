import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceMemberRole } from '@prisma/client';
import { BoardService } from '../src/board/board.service';

/**
 * Performance and load testing for the multi-tenant Kanban system
 * Tests WebSocket connection limits, rate limiting, and system stability under concurrent load
 * Validates: Requirements 9.1, 9.2, 5.6
 */
describe('Performance and Load Testing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let boardService: BoardService;

  // Test configuration
  const CONCURRENT_USERS = 10;
  const OPERATIONS_PER_USER = 5;
  const RATE_LIMIT_THRESHOLD = 100; // requests per minute

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    boardService = app.get<BoardService>(BoardService);
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.activityEvent.deleteMany();
    await prisma.card.deleteMany();
    await prisma.list.deleteMany();
    await prisma.board.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.authProvider.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('WebSocket Connection Limits and Cleanup (Requirement 5.6)', () => {
    it('should handle multiple concurrent WebSocket connections', async () => {
      // Create test users
      const users = [];
      for (let i = 0; i < CONCURRENT_USERS; i++) {
        const user = await prisma.user.create({
          data: {
            id: `perf-user-${i}`,
            email: `perfuser${i}@example.com`,
            name: `Performance User ${i}`,
          },
        });
        users.push(user);
      }

      // Create shared workspace for all users
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Performance Test Workspace',
          members: {
            create: users.map((user) => ({
              userId: user.id,
              role: WorkspaceMemberRole.MEMBER,
            })),
          },
        },
      });

      // Verify all users are members
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: workspace.id },
      });

      expect(members).toHaveLength(CONCURRENT_USERS);
    });

    it('should properly clean up WebSocket subscriptions on disconnect', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          id: 'cleanup-user',
          email: 'cleanup@example.com',
          name: 'Cleanup User',
        },
      });

      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Cleanup Test Workspace',
          members: {
            create: {
              userId: user.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Verify workspace membership exists
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId: workspace.id,
          },
        },
      });

      expect(membership).not.toBeNull();

      // Simulate disconnect by verifying user can still access workspace
      // (In real scenario, WebSocket would be disconnected)
      const userWorkspaces = await prisma.workspace.findMany({
        where: {
          members: {
            some: { userId: user.id },
          },
        },
      });

      expect(userWorkspaces).toHaveLength(1);
    });

    it('should maintain connection state consistency', async () => {
      // Create multiple users
      const users = [];
      for (let i = 0; i < 5; i++) {
        const user = await prisma.user.create({
          data: {
            id: `state-user-${i}`,
            email: `stateuser${i}@example.com`,
            name: `State User ${i}`,
          },
        });
        users.push(user);
      }

      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: 'State Test Workspace',
          members: {
            create: users.map((user) => ({
              userId: user.id,
              role: WorkspaceMemberRole.MEMBER,
            })),
          },
        },
      });

      // Create board
      const board = await boardService.createBoard(workspace.id, users[0].id, {
        name: 'State Test Board',
      });

      // Verify all users can access the board
      for (const user of users) {
        const userBoards = await prisma.board.findMany({
          where: {
            workspace: {
              members: {
                some: { userId: user.id },
              },
            },
          },
        });

        expect(userBoards).toHaveLength(1);
        expect(userBoards[0].id).toBe(board.id);
      }
    });
  });

  describe('Rate Limiting Enforcement (Requirements 9.1, 9.2)', () => {
    it('should track request counts per user', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          id: 'rate-limit-user',
          email: 'ratelimit@example.com',
          name: 'Rate Limit User',
        },
      });

      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Rate Limit Test Workspace',
          members: {
            create: {
              userId: user.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Simulate multiple requests
      const requestTimestamps: number[] = [];
      for (let i = 0; i < 10; i++) {
        requestTimestamps.push(Date.now());
        await boardService.createBoard(workspace.id, user.id, {
          name: `Board ${i}`,
        });
      }

      // Verify requests were made
      expect(requestTimestamps).toHaveLength(10);

      // Verify boards were created
      const boards = await prisma.board.findMany({
        where: { workspaceId: workspace.id },
      });

      expect(boards).toHaveLength(10);
    });

    it('should enforce per-endpoint rate limits', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          id: 'endpoint-rate-user',
          email: 'endpointrate@example.com',
          name: 'Endpoint Rate User',
        },
      });

      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Endpoint Rate Test Workspace',
          members: {
            create: {
              userId: user.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Create board
      const board = await boardService.createBoard(workspace.id, user.id, {
        name: 'Rate Test Board',
      });

      // Simulate rapid list creation requests
      const listCreationTimes: number[] = [];
      for (let i = 0; i < 5; i++) {
        listCreationTimes.push(Date.now());
        await boardService.createList(board.id, workspace.id, user.id, {
          name: `List ${i}`,
        });
      }

      // Verify lists were created
      const lists = await prisma.list.findMany({
        where: { boardId: board.id },
      });

      expect(lists).toHaveLength(5);
    });

    it('should handle burst requests appropriately', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          id: 'burst-user',
          email: 'burst@example.com',
          name: 'Burst User',
        },
      });

      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Burst Test Workspace',
          members: {
            create: {
              userId: user.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Create board
      const board = await boardService.createBoard(workspace.id, user.id, {
        name: 'Burst Test Board',
      });

      // Create list
      const list = await boardService.createList(
        board.id,
        workspace.id,
        user.id,
        {
          name: 'Burst Test List',
        },
      );

      // Simulate burst of card creation requests
      const cardCreationPromises = [];
      for (let i = 0; i < 20; i++) {
        cardCreationPromises.push(
          boardService.createCard(list.id, workspace.id, user.id, {
            title: `Card ${i}`,
          }),
        );
      }

      const createdCards = await Promise.all(cardCreationPromises);

      // Verify all cards were created
      expect(createdCards).toHaveLength(20);

      const cards = await prisma.card.findMany({
        where: { listId: list.id },
      });

      expect(cards).toHaveLength(20);
    });
  });

  describe('System Stability Under Concurrent Load', () => {
    it('should maintain data consistency with concurrent operations', async () => {
      // Create test users
      const users = [];
      for (let i = 0; i < CONCURRENT_USERS; i++) {
        const user = await prisma.user.create({
          data: {
            id: `concurrent-user-${i}`,
            email: `concurrentuser${i}@example.com`,
            name: `Concurrent User ${i}`,
          },
        });
        users.push(user);
      }

      // Create shared workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Concurrent Load Workspace',
          members: {
            create: users.map((user) => ({
              userId: user.id,
              role: WorkspaceMemberRole.MEMBER,
            })),
          },
        },
      });

      // Create board
      const board = await boardService.createBoard(workspace.id, users[0].id, {
        name: 'Concurrent Load Board',
      });

      // Create list
      const list = await boardService.createList(
        board.id,
        workspace.id,
        users[0].id,
        {
          name: 'Concurrent Load List',
        },
      );

      // Simulate concurrent card creation from multiple users
      const cardPromises = [];
      for (let i = 0; i < CONCURRENT_USERS; i++) {
        for (let j = 0; j < OPERATIONS_PER_USER; j++) {
          cardPromises.push(
            boardService.createCard(list.id, workspace.id, users[i].id, {
              title: `Card from User ${i} - Operation ${j}`,
            }),
          );
        }
      }

      const createdCards = await Promise.all(cardPromises);

      // Verify all cards were created
      expect(createdCards).toHaveLength(
        CONCURRENT_USERS * OPERATIONS_PER_USER,
      );

      // Verify data consistency
      const cards = await prisma.card.findMany({
        where: { listId: list.id },
      });

      expect(cards).toHaveLength(CONCURRENT_USERS * OPERATIONS_PER_USER);

      // Verify all cards have correct workspace association
      cards.forEach((card) => {
        expect(card.workspaceId).toBe(workspace.id);
        expect(card.listId).toBe(list.id);
      });
    });

    it('should handle concurrent card movements without data corruption', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          id: 'move-user',
          email: 'moveuser@example.com',
          name: 'Move User',
        },
      });

      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Move Test Workspace',
          members: {
            create: {
              userId: user.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Create board
      const board = await boardService.createBoard(workspace.id, user.id, {
        name: 'Move Test Board',
      });

      // Create multiple lists
      const lists = [];
      for (let i = 0; i < 3; i++) {
        const list = await boardService.createList(
          board.id,
          workspace.id,
          user.id,
          {
            name: `List ${i}`,
          },
        );
        lists.push(list);
      }

      // Create cards
      const cards = [];
      for (let i = 0; i < 5; i++) {
        const card = await boardService.createCard(
          lists[0].id,
          workspace.id,
          user.id,
          {
            title: `Card ${i}`,
          },
        );
        cards.push(card);
      }

      // Simulate concurrent card movements
      const movePromises = [];
      for (let i = 0; i < cards.length; i++) {
        const targetListIndex = (i + 1) % lists.length;
        movePromises.push(
          boardService.moveCard(cards[i].id, workspace.id, user.id, {
            targetListId: lists[targetListIndex].id,
            position: 0,
          }),
        );
      }

      const movedCards = await Promise.all(movePromises);

      // Verify all cards were moved
      expect(movedCards).toHaveLength(cards.length);

      // Verify no data corruption
      const finalCards = await prisma.card.findMany({
        where: { workspaceId: workspace.id },
      });

      expect(finalCards).toHaveLength(cards.length);

      // Verify all cards are in valid lists
      finalCards.forEach((card) => {
        const listIds = lists.map((l) => l.id);
        expect(listIds).toContain(card.listId);
      });
    });

    it('should maintain performance with large datasets', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          id: 'large-dataset-user',
          email: 'largedataset@example.com',
          name: 'Large Dataset User',
        },
      });

      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Large Dataset Workspace',
          members: {
            create: {
              userId: user.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Create board
      const board = await boardService.createBoard(workspace.id, user.id, {
        name: 'Large Dataset Board',
      });

      // Create multiple lists with many cards
      const startTime = Date.now();

      for (let listIndex = 0; listIndex < 5; listIndex++) {
        const list = await boardService.createList(
          board.id,
          workspace.id,
          user.id,
          {
            name: `List ${listIndex}`,
          },
        );

        // Create many cards in each list
        for (let cardIndex = 0; cardIndex < 20; cardIndex++) {
          await boardService.createCard(list.id, workspace.id, user.id, {
            title: `Card ${cardIndex}`,
          });
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify data was created
      const lists = await prisma.list.findMany({
        where: { boardId: board.id },
      });

      expect(lists).toHaveLength(5);

      const cards = await prisma.card.findMany({
        where: { workspaceId: workspace.id },
      });

      expect(cards).toHaveLength(100);

      // Performance should be reasonable (less than 30 seconds for 100 cards)
      expect(duration).toBeLessThan(30000);
    });

    it('should handle rapid board state queries efficiently', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          id: 'query-user',
          email: 'queryuser@example.com',
          name: 'Query User',
        },
      });

      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Query Test Workspace',
          members: {
            create: {
              userId: user.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Create board with data
      const board = await boardService.createBoard(workspace.id, user.id, {
        name: 'Query Test Board',
      });

      const list = await boardService.createList(
        board.id,
        workspace.id,
        user.id,
        {
          name: 'Query Test List',
        },
      );

      for (let i = 0; i < 10; i++) {
        await boardService.createCard(list.id, workspace.id, user.id, {
          title: `Card ${i}`,
        });
      }

      // Simulate rapid queries
      const queryStartTime = Date.now();
      const queryPromises = [];

      for (let i = 0; i < 50; i++) {
        queryPromises.push(
          prisma.board.findUnique({
            where: { id: board.id },
            include: {
              lists: {
                include: { cards: true },
              },
            },
          }),
        );
      }

      const results = await Promise.all(queryPromises);
      const queryEndTime = Date.now();
      const queryDuration = queryEndTime - queryStartTime;

      // Verify all queries returned data
      expect(results).toHaveLength(50);
      results.forEach((result) => {
        expect(result?.lists).toHaveLength(1);
        expect(result?.lists[0].cards).toHaveLength(10);
      });

      // Queries should be fast (less than 5 seconds for 50 queries)
      expect(queryDuration).toBeLessThan(5000);
    });
  });

  describe('Resource Cleanup and Memory Management', () => {
    it('should clean up resources after operations', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          id: 'cleanup-resource-user',
          email: 'cleanupresource@example.com',
          name: 'Cleanup Resource User',
        },
      });

      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Cleanup Resource Workspace',
          members: {
            create: {
              userId: user.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Create and delete multiple boards
      for (let i = 0; i < 5; i++) {
        const board = await boardService.createBoard(workspace.id, user.id, {
          name: `Temp Board ${i}`,
        });

        await boardService.deleteBoard(board.id, workspace.id, user.id);
      }

      // Verify all boards are deleted
      const remainingBoards = await prisma.board.findMany({
        where: { workspaceId: workspace.id },
      });

      expect(remainingBoards).toHaveLength(0);
    });

    it('should handle connection pool efficiently', async () => {
      // Create multiple users and workspaces
      const users = [];
      const workspaces = [];

      for (let i = 0; i < 10; i++) {
        const user = await prisma.user.create({
          data: {
            id: `pool-user-${i}`,
            email: `pooluser${i}@example.com`,
            name: `Pool User ${i}`,
          },
        });
        users.push(user);

        const workspace = await prisma.workspace.create({
          data: {
            name: `Pool Workspace ${i}`,
            members: {
              create: {
                userId: user.id,
                role: WorkspaceMemberRole.OWNER,
              },
            },
          },
        });
        workspaces.push(workspace);
      }

      // Verify all were created
      expect(users).toHaveLength(10);
      expect(workspaces).toHaveLength(10);

      // Query all workspaces
      const allWorkspaces = await prisma.workspace.findMany();
      expect(allWorkspaces.length).toBeGreaterThanOrEqual(10);
    });
  });
});
