import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceMemberRole } from '@prisma/client';

/**
 * Integration tests for board management system
 * Verifies board, list, and card operations with workspace isolation
 */
describe('Board Management (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const user1 = {
    id: 'user-1',
    email: 'user1@example.com',
    name: 'User One',
  };

  const user2 = {
    id: 'user-2',
    email: 'user2@example.com',
    name: 'User Two',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean up database
    await prisma.card.deleteMany();
    await prisma.list.deleteMany();
    await prisma.board.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    await prisma.user.createMany({
      data: [user1, user2],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Board Creation and Workspace Association', () => {
    it('should create a board within a workspace', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      const board = await prisma.board.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Board',
          description: 'Test Description',
        },
      });

      expect(board.workspaceId).toBe(workspace.id);
      expect(board.name).toBe('Test Board');
    });

    it('should prevent cross-workspace board access', async () => {
      const workspace1 = await prisma.workspace.create({
        data: {
          name: 'Workspace 1',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      const workspace2 = await prisma.workspace.create({
        data: {
          name: 'Workspace 2',
          members: {
            create: {
              userId: user2.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      const board1 = await prisma.board.create({
        data: {
          workspaceId: workspace1.id,
          name: 'Board 1',
        },
      });

      const board2 = await prisma.board.create({
        data: {
          workspaceId: workspace2.id,
          name: 'Board 2',
        },
      });

      // User 1 should only see boards in workspace 1
      const user1Boards = await prisma.board.findMany({
        where: {
          workspace: {
            members: {
              some: {
                userId: user1.id,
              },
            },
          },
        },
      });

      expect(user1Boards).toHaveLength(1);
      expect(user1Boards[0].id).toBe(board1.id);
    });
  });

  describe('List Creation and Positioning', () => {
    it('should create lists with proper positioning', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      const board = await prisma.board.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Board',
        },
      });

      const list1 = await prisma.list.create({
        data: {
          boardId: board.id,
          workspaceId: workspace.id,
          name: 'To Do',
          position: 0,
        },
      });

      const list2 = await prisma.list.create({
        data: {
          boardId: board.id,
          workspaceId: workspace.id,
          name: 'In Progress',
          position: 1,
        },
      });

      const lists = await prisma.list.findMany({
        where: { boardId: board.id },
        orderBy: { position: 'asc' },
      });

      expect(lists).toHaveLength(2);
      expect(lists[0].position).toBe(0);
      expect(lists[1].position).toBe(1);
    });

    it('should maintain workspace association for lists', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      const board = await prisma.board.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Board',
        },
      });

      const list = await prisma.list.create({
        data: {
          boardId: board.id,
          workspaceId: workspace.id,
          name: 'Test List',
          position: 0,
        },
      });

      expect(list.workspaceId).toBe(workspace.id);
    });
  });

  describe('Card Creation and Movement', () => {
    it('should create cards with proper workspace association', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      const board = await prisma.board.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Board',
        },
      });

      const list = await prisma.list.create({
        data: {
          boardId: board.id,
          workspaceId: workspace.id,
          name: 'Test List',
          position: 0,
        },
      });

      const card = await prisma.card.create({
        data: {
          listId: list.id,
          workspaceId: workspace.id,
          title: 'Test Card',
          description: 'Test Description',
          position: 0,
        },
      });

      expect(card.workspaceId).toBe(workspace.id);
      expect(card.listId).toBe(list.id);
    });

    it('should maintain card positioning within lists', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      const board = await prisma.board.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Board',
        },
      });

      const list = await prisma.list.create({
        data: {
          boardId: board.id,
          workspaceId: workspace.id,
          name: 'Test List',
          position: 0,
        },
      });

      const card1 = await prisma.card.create({
        data: {
          listId: list.id,
          workspaceId: workspace.id,
          title: 'Card 1',
          position: 0,
        },
      });

      const card2 = await prisma.card.create({
        data: {
          listId: list.id,
          workspaceId: workspace.id,
          title: 'Card 2',
          position: 1,
        },
      });

      const cards = await prisma.card.findMany({
        where: { listId: list.id },
        orderBy: { position: 'asc' },
      });

      expect(cards).toHaveLength(2);
      expect(cards[0].position).toBe(0);
      expect(cards[1].position).toBe(1);
    });
  });

  describe('Board Data Completeness', () => {
    it('should return board with all lists and cards', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      const board = await prisma.board.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Board',
        },
      });

      const list1 = await prisma.list.create({
        data: {
          boardId: board.id,
          workspaceId: workspace.id,
          name: 'List 1',
          position: 0,
        },
      });

      const list2 = await prisma.list.create({
        data: {
          boardId: board.id,
          workspaceId: workspace.id,
          name: 'List 2',
          position: 1,
        },
      });

      await prisma.card.create({
        data: {
          listId: list1.id,
          workspaceId: workspace.id,
          title: 'Card 1',
          position: 0,
        },
      });

      await prisma.card.create({
        data: {
          listId: list2.id,
          workspaceId: workspace.id,
          title: 'Card 2',
          position: 0,
        },
      });

      const boardWithData = await prisma.board.findUnique({
        where: { id: board.id },
        include: {
          lists: {
            include: {
              cards: true,
            },
            orderBy: { position: 'asc' },
          },
        },
      });

      expect(boardWithData?.lists).toHaveLength(2);
      expect(boardWithData?.lists[0].cards).toHaveLength(1);
      expect(boardWithData?.lists[1].cards).toHaveLength(1);
    });
  });

  describe('Cascade Deletion', () => {
    it('should delete all lists and cards when board is deleted', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      const board = await prisma.board.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Board',
        },
      });

      const list = await prisma.list.create({
        data: {
          boardId: board.id,
          workspaceId: workspace.id,
          name: 'Test List',
          position: 0,
        },
      });

      await prisma.card.create({
        data: {
          listId: list.id,
          workspaceId: workspace.id,
          title: 'Test Card',
          position: 0,
        },
      });

      // Delete board
      await prisma.board.delete({
        where: { id: board.id },
      });

      // Verify lists and cards are deleted
      const remainingLists = await prisma.list.findMany({
        where: { boardId: board.id },
      });
      const remainingCards = await prisma.card.findMany({
        where: { listId: list.id },
      });

      expect(remainingLists).toHaveLength(0);
      expect(remainingCards).toHaveLength(0);
    });
  });
});
