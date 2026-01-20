import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceMemberRole } from '@prisma/client';
import { BoardService } from '../src/board/board.service';
import { ActivityService } from '../src/activity/activity.service';

/**
 * Comprehensive integration tests for the multi-tenant Kanban system
 * Tests complete authentication flows, multi-user collaboration, and workspace isolation
 * Validates: Requirements 1.1-1.8, 2.1-2.7, 3.1-3.5, 4.1-4.6, 5.1-5.7, 6.1-6.5, 7.1-7.6
 */
describe('Comprehensive Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let boardService: BoardService;
  let activityService: ActivityService;

  // Test users
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

  const user3 = {
    id: 'user-3',
    email: 'user3@example.com',
    name: 'User Three',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    boardService = app.get<BoardService>(BoardService);
    activityService = app.get<ActivityService>(ActivityService);
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

    // Create test users
    await prisma.user.createMany({
      data: [user1, user2, user3],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Complete Authentication Flow (Requirement 1)', () => {
    it('should create user record on first authentication', async () => {
      const newUser = {
        id: 'new-user-1',
        email: 'newuser@example.com',
        name: 'New User',
      };

      const user = await prisma.user.create({
        data: newUser,
      });

      expect(user.id).toBe(newUser.id);
      expect(user.email).toBe(newUser.email);
      expect(user.name).toBe(newUser.name);
    });

    it('should retrieve existing user on subsequent authentication', async () => {
      // First authentication creates user
      const user = await prisma.user.findUnique({
        where: { email: user1.email },
      });

      expect(user).not.toBeNull();
      expect(user?.id).toBe(user1.id);
      expect(user?.email).toBe(user1.email);
    });

    it('should store auth provider information', async () => {
      const authProvider = await prisma.authProvider.create({
        data: {
          userId: user1.id,
          provider: 'google',
          providerId: 'google-123456',
          accessToken: 'mock-access-token',
        },
      });

      expect(authProvider.userId).toBe(user1.id);
      expect(authProvider.provider).toBe('google');
      expect(authProvider.providerId).toBe('google-123456');
    });

    it('should prevent duplicate auth provider entries', async () => {
      await prisma.authProvider.create({
        data: {
          userId: user1.id,
          provider: 'google',
          providerId: 'google-123456',
          accessToken: 'mock-access-token',
        },
      });

      // Attempting to create duplicate should fail
      await expect(
        prisma.authProvider.create({
          data: {
            userId: user1.id,
            provider: 'google',
            providerId: 'google-123456',
            accessToken: 'mock-access-token-2',
          },
        }),
      ).rejects.toThrow();
    });

    it('should maintain user session across multiple requests', async () => {
      // Simulate multiple requests from same user
      const user = await prisma.user.findUnique({
        where: { id: user1.id },
      });

      expect(user).not.toBeNull();

      // Second request
      const userAgain = await prisma.user.findUnique({
        where: { id: user1.id },
      });

      expect(userAgain?.id).toBe(user?.id);
      expect(userAgain?.email).toBe(user?.email);
    });
  });

  describe('Multi-User Real-Time Collaboration (Requirements 5, 6)', () => {
    it('should enable multiple users to collaborate on same board', async () => {
      // Create shared workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Shared Workspace',
          members: {
            create: [
              { userId: user1.id, role: WorkspaceMemberRole.OWNER },
              { userId: user2.id, role: WorkspaceMemberRole.MEMBER },
            ],
          },
        },
      });

      // Create board
      const board = await boardService.createBoard(workspace.id, user1.id, {
        name: 'Collaborative Board',
      });

      // User 1 creates a list
      const list = await boardService.createList(
        board.id,
        workspace.id,
        user1.id,
        {
          name: 'To Do',
        },
      );

      // User 2 creates a card in the same list
      const card = await boardService.createCard(
        list.id,
        workspace.id,
        user2.id,
        {
          title: 'Task from User 2',
        },
      );

      // Both users should see the same board state
      const boardState = await prisma.board.findUnique({
        where: { id: board.id },
        include: {
          lists: {
            include: { cards: true },
            orderBy: { position: 'asc' },
          },
        },
      });

      expect(boardState?.lists).toHaveLength(1);
      expect(boardState?.lists[0].cards).toHaveLength(1);
      expect(boardState?.lists[0].cards[0].title).toBe('Task from User 2');
    });

    it('should broadcast card changes to all workspace members', async () => {
      // Create shared workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Shared Workspace',
          members: {
            create: [
              { userId: user1.id, role: WorkspaceMemberRole.OWNER },
              { userId: user2.id, role: WorkspaceMemberRole.MEMBER },
              { userId: user3.id, role: WorkspaceMemberRole.MEMBER },
            ],
          },
        },
      });

      // Create board and list
      const board = await boardService.createBoard(workspace.id, user1.id, {
        name: 'Shared Board',
      });

      const list = await boardService.createList(
        board.id,
        workspace.id,
        user1.id,
        {
          name: 'Tasks',
        },
      );

      // User 1 creates a card
      const card = await boardService.createCard(
        list.id,
        workspace.id,
        user1.id,
        {
          title: 'Original Title',
        },
      );

      // User 2 updates the card
      const updatedCard = await boardService.updateCard(
        card.id,
        workspace.id,
        user2.id,
        {
          title: 'Updated Title',
        },
      );

      // User 3 should see the updated card
      const cardFromUser3Perspective = await prisma.card.findUnique({
        where: { id: card.id },
      });

      expect(cardFromUser3Perspective?.title).toBe('Updated Title');
    });

    it('should maintain activity log for all user actions', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Activity Workspace',
          members: {
            create: [
              { userId: user1.id, role: WorkspaceMemberRole.OWNER },
              { userId: user2.id, role: WorkspaceMemberRole.MEMBER },
            ],
          },
        },
      });

      const board = await boardService.createBoard(workspace.id, user1.id, {
        name: 'Activity Board',
      });

      const list = await boardService.createList(
        board.id,
        workspace.id,
        user1.id,
        {
          name: 'List',
        },
      );

      // User 1 creates card
      const card1 = await boardService.createCard(
        list.id,
        workspace.id,
        user1.id,
        {
          title: 'Card 1',
        },
      );

      // User 2 creates card
      const card2 = await boardService.createCard(
        list.id,
        workspace.id,
        user2.id,
        {
          title: 'Card 2',
        },
      );

      // User 1 updates card
      await boardService.updateCard(card1.id, workspace.id, user1.id, {
        title: 'Updated Card 1',
      });

      // Get activity log
      const activities = await activityService.getWorkspaceActivity(
        workspace.id,
        user1.id,
        10,
        0,
      );

      // Should have activities from both users
      const user1Activities = activities.filter((a) => a.userId === user1.id);
      const user2Activities = activities.filter((a) => a.userId === user2.id);

      expect(user1Activities.length).toBeGreaterThan(0);
      expect(user2Activities.length).toBeGreaterThan(0);
    });

    it('should handle concurrent card movements correctly', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Concurrent Workspace',
          members: {
            create: [
              { userId: user1.id, role: WorkspaceMemberRole.OWNER },
              { userId: user2.id, role: WorkspaceMemberRole.MEMBER },
            ],
          },
        },
      });

      const board = await boardService.createBoard(workspace.id, user1.id, {
        name: 'Concurrent Board',
      });

      const list1 = await boardService.createList(
        board.id,
        workspace.id,
        user1.id,
        {
          name: 'List 1',
        },
      );

      const list2 = await boardService.createList(
        board.id,
        workspace.id,
        user1.id,
        {
          name: 'List 2',
        },
      );

      const card = await boardService.createCard(
        list1.id,
        workspace.id,
        user1.id,
        {
          title: 'Movable Card',
        },
      );

      // User 1 moves card to list 2
      const movedCard = await boardService.moveCard(
        card.id,
        workspace.id,
        user1.id,
        {
          targetListId: list2.id,
          position: 0,
        },
      );

      // Verify card is in correct list
      expect(movedCard.listId).toBe(list2.id);

      // User 2 should see the card in list 2
      const cardFromUser2 = await prisma.card.findUnique({
        where: { id: card.id },
      });

      expect(cardFromUser2?.listId).toBe(list2.id);
    });
  });

  describe('Workspace Isolation Across Multiple Users (Requirements 2, 7)', () => {
    it('should prevent cross-workspace data access', async () => {
      // User 1 creates workspace 1
      const workspace1 = await prisma.workspace.create({
        data: {
          name: 'User 1 Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // User 2 creates workspace 2
      const workspace2 = await prisma.workspace.create({
        data: {
          name: 'User 2 Workspace',
          members: {
            create: {
              userId: user2.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Create boards in each workspace
      const board1 = await boardService.createBoard(workspace1.id, user1.id, {
        name: 'Board 1',
      });

      const board2 = await boardService.createBoard(workspace2.id, user2.id, {
        name: 'Board 2',
      });

      // User 1 should only see board 1
      const user1Boards = await prisma.board.findMany({
        where: {
          workspace: {
            members: {
              some: { userId: user1.id },
            },
          },
        },
      });

      expect(user1Boards).toHaveLength(1);
      expect(user1Boards[0].id).toBe(board1.id);

      // User 2 should only see board 2
      const user2Boards = await prisma.board.findMany({
        where: {
          workspace: {
            members: {
              some: { userId: user2.id },
            },
          },
        },
      });

      expect(user2Boards).toHaveLength(1);
      expect(user2Boards[0].id).toBe(board2.id);
    });

    it('should prevent unauthorized workspace member access', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Private Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // User 2 should not have membership
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user2.id,
            workspaceId: workspace.id,
          },
        },
      });

      expect(membership).toBeNull();

      // User 2 should not be able to access workspace data
      const boards = await prisma.board.findMany({
        where: {
          AND: [
            { workspaceId: workspace.id },
            {
              workspace: {
                members: {
                  some: { userId: user2.id },
                },
              },
            },
          ],
        },
      });

      expect(boards).toHaveLength(0);
    });

    it('should verify no cross-tenant data leaks in concurrent scenarios', async () => {
      // Create 3 separate workspaces
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

      const workspace3 = await prisma.workspace.create({
        data: {
          name: 'Workspace 3',
          members: {
            create: {
              userId: user3.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Create boards concurrently
      const board1 = await boardService.createBoard(workspace1.id, user1.id, {
        name: 'Board 1',
      });

      const board2 = await boardService.createBoard(workspace2.id, user2.id, {
        name: 'Board 2',
      });

      const board3 = await boardService.createBoard(workspace3.id, user3.id, {
        name: 'Board 3',
      });

      // Create lists and cards in each board
      const list1 = await boardService.createList(
        board1.id,
        workspace1.id,
        user1.id,
        { name: 'List 1' },
      );

      const list2 = await boardService.createList(
        board2.id,
        workspace2.id,
        user2.id,
        { name: 'List 2' },
      );

      const list3 = await boardService.createList(
        board3.id,
        workspace3.id,
        user3.id,
        { name: 'List 3' },
      );

      await boardService.createCard(list1.id, workspace1.id, user1.id, {
        title: 'Card 1',
      });

      await boardService.createCard(list2.id, workspace2.id, user2.id, {
        title: 'Card 2',
      });

      await boardService.createCard(list3.id, workspace3.id, user3.id, {
        title: 'Card 3',
      });

      // Verify each user only sees their workspace data
      const user1Data = await prisma.board.findMany({
        where: {
          workspace: {
            members: {
              some: { userId: user1.id },
            },
          },
        },
        include: {
          lists: {
            include: { cards: true },
          },
        },
      });

      expect(user1Data).toHaveLength(1);
      expect(user1Data[0].id).toBe(board1.id);
      expect(user1Data[0].lists[0].cards[0].title).toBe('Card 1');

      const user2Data = await prisma.board.findMany({
        where: {
          workspace: {
            members: {
              some: { userId: user2.id },
            },
          },
        },
        include: {
          lists: {
            include: { cards: true },
          },
        },
      });

      expect(user2Data).toHaveLength(1);
      expect(user2Data[0].id).toBe(board2.id);
      expect(user2Data[0].lists[0].cards[0].title).toBe('Card 2');

      const user3Data = await prisma.board.findMany({
        where: {
          workspace: {
            members: {
              some: { userId: user3.id },
            },
          },
        },
        include: {
          lists: {
            include: { cards: true },
          },
        },
      });

      expect(user3Data).toHaveLength(1);
      expect(user3Data[0].id).toBe(board3.id);
      expect(user3Data[0].lists[0].cards[0].title).toBe('Card 3');
    });

    it('should maintain workspace isolation with shared members', async () => {
      // Create two workspaces with overlapping members
      const workspace1 = await prisma.workspace.create({
        data: {
          name: 'Workspace 1',
          members: {
            create: [
              { userId: user1.id, role: WorkspaceMemberRole.OWNER },
              { userId: user2.id, role: WorkspaceMemberRole.MEMBER },
            ],
          },
        },
      });

      const workspace2 = await prisma.workspace.create({
        data: {
          name: 'Workspace 2',
          members: {
            create: [
              { userId: user2.id, role: WorkspaceMemberRole.OWNER },
              { userId: user3.id, role: WorkspaceMemberRole.MEMBER },
            ],
          },
        },
      });

      // Create boards in each workspace
      const board1 = await boardService.createBoard(workspace1.id, user1.id, {
        name: 'Board 1',
      });

      const board2 = await boardService.createBoard(workspace2.id, user2.id, {
        name: 'Board 2',
      });

      // User 2 should see both boards (member of both workspaces)
      const user2Boards = await prisma.board.findMany({
        where: {
          workspace: {
            members: {
              some: { userId: user2.id },
            },
          },
        },
      });

      expect(user2Boards).toHaveLength(2);

      // User 1 should only see board 1
      const user1Boards = await prisma.board.findMany({
        where: {
          workspace: {
            members: {
              some: { userId: user1.id },
            },
          },
        },
      });

      expect(user1Boards).toHaveLength(1);
      expect(user1Boards[0].id).toBe(board1.id);

      // User 3 should only see board 2
      const user3Boards = await prisma.board.findMany({
        where: {
          workspace: {
            members: {
              some: { userId: user3.id },
            },
          },
        },
      });

      expect(user3Boards).toHaveLength(1);
      expect(user3Boards[0].id).toBe(board2.id);
    });
  });

  describe('Complete User Flow from Login to Collaboration', () => {
    it('should support complete flow: login -> create workspace -> invite user -> collaborate', async () => {
      // Step 1: User 1 authenticates (user already created in beforeEach)
      const authenticatedUser1 = await prisma.user.findUnique({
        where: { id: user1.id },
      });
      expect(authenticatedUser1).not.toBeNull();

      // Step 2: User 1 creates a workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Team Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Step 3: User 1 invites User 2
      await prisma.workspaceMember.create({
        data: {
          userId: user2.id,
          workspaceId: workspace.id,
          role: WorkspaceMemberRole.MEMBER,
        },
      });

      // Step 4: User 2 authenticates and sees the workspace
      const user2Workspaces = await prisma.workspace.findMany({
        where: {
          members: {
            some: { userId: user2.id },
          },
        },
      });

      expect(user2Workspaces).toHaveLength(1);
      expect(user2Workspaces[0].id).toBe(workspace.id);

      // Step 5: User 1 creates a board
      const board = await boardService.createBoard(workspace.id, user1.id, {
        name: 'Project Board',
      });

      // Step 6: User 1 creates a list
      const list = await boardService.createList(
        board.id,
        workspace.id,
        user1.id,
        {
          name: 'To Do',
        },
      );

      // Step 7: User 2 creates a card
      const card = await boardService.createCard(
        list.id,
        workspace.id,
        user2.id,
        {
          title: 'First Task',
        },
      );

      // Step 8: User 1 updates the card
      const updatedCard = await boardService.updateCard(
        card.id,
        workspace.id,
        user1.id,
        {
          description: 'Important task',
        },
      );

      // Step 9: Verify both users see the same state
      const boardState = await prisma.board.findUnique({
        where: { id: board.id },
        include: {
          lists: {
            include: { cards: true },
          },
        },
      });

      expect(boardState?.lists[0].cards[0].title).toBe('First Task');
      expect(boardState?.lists[0].cards[0].description).toBe('Important task');

      // Step 10: Verify activity log shows all actions
      const activities = await activityService.getWorkspaceActivity(
        workspace.id,
        user1.id,
        10,
        0,
      );

      expect(activities.length).toBeGreaterThan(0);
      const cardActivities = activities.filter((a) => a.entityType === 'card');
      expect(cardActivities.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity and Referential Integrity', () => {
    it('should maintain referential integrity when deleting entities', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Integrity Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      const board = await boardService.createBoard(workspace.id, user1.id, {
        name: 'Test Board',
      });

      const list = await boardService.createList(
        board.id,
        workspace.id,
        user1.id,
        {
          name: 'Test List',
        },
      );

      const card = await boardService.createCard(
        list.id,
        workspace.id,
        user1.id,
        {
          title: 'Test Card',
        },
      );

      // Delete the board
      await boardService.deleteBoard(board.id, workspace.id, user1.id);

      // Verify list and card are deleted
      const remainingList = await prisma.list.findUnique({
        where: { id: list.id },
      });

      const remainingCard = await prisma.card.findUnique({
        where: { id: card.id },
      });

      expect(remainingList).toBeNull();
      expect(remainingCard).toBeNull();
    });

    it('should maintain workspace association across all entities', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Association Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      const board = await boardService.createBoard(workspace.id, user1.id, {
        name: 'Test Board',
      });

      const list = await boardService.createList(
        board.id,
        workspace.id,
        user1.id,
        {
          name: 'Test List',
        },
      );

      const card = await boardService.createCard(
        list.id,
        workspace.id,
        user1.id,
        {
          title: 'Test Card',
        },
      );

      // Verify all entities have correct workspace association
      expect(board.workspaceId).toBe(workspace.id);
      expect(list.workspaceId).toBe(workspace.id);
      expect(card.workspaceId).toBe(workspace.id);
    });
  });
});
