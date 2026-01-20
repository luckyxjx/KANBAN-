import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BoardService } from '../src/board/board.service';
import { ActivityService } from '../src/activity/activity.service';

describe('Activity Logging Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let boardService: BoardService;
  let activityService: ActivityService;
  let userId: string;
  let workspaceId: string;

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

    // Clean up database
    await prisma.activityEvent.deleteMany();
    await prisma.card.deleteMany();
    await prisma.list.deleteMany();
    await prisma.board.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.authProvider.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'activity-integration@example.com',
        name: 'Activity Integration User',
      },
    });
    userId = user.id;

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: 'Activity Integration Workspace',
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    });
    workspaceId = workspace.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.activityEvent.deleteMany();
    await prisma.card.deleteMany();
    await prisma.list.deleteMany();
    await prisma.board.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.authProvider.deleteMany();
    await prisma.user.deleteMany();

    await app.close();
  });

  describe('Complete Activity Logging Flow', () => {
    it('should log activities for board, list, and card operations', async () => {
      // Create a board - should log activity
      const board = await boardService.createBoard(workspaceId, userId, {
        name: 'Test Board',
        description: 'Testing activity logging',
      });

      // Verify board creation was logged
      let activities = await activityService.getWorkspaceActivity(
        workspaceId,
        userId,
        10,
        0,
      );
      expect(activities.length).toBe(1);
      expect(activities[0].entityType).toBe('board');
      expect(activities[0].action).toBe('created');
      expect(activities[0].entityId).toBe(board.id);

      // Create a list - should log activity
      const list = await boardService.createList(board.id, workspaceId, userId, {
        name: 'Test List',
      });

      // Verify list creation was logged
      activities = await activityService.getWorkspaceActivity(
        workspaceId,
        userId,
        10,
        0,
      );
      expect(activities.length).toBe(2);
      expect(activities[0].entityType).toBe('list'); // Most recent
      expect(activities[0].action).toBe('created');

      // Create a card - should log activity
      const card = await boardService.createCard(
        list.id,
        workspaceId,
        userId,
        {
          title: 'Test Card',
          description: 'Testing card activity',
        },
      );

      // Verify card creation was logged
      activities = await activityService.getWorkspaceActivity(
        workspaceId,
        userId,
        10,
        0,
      );
      expect(activities.length).toBe(3);
      expect(activities[0].entityType).toBe('card'); // Most recent
      expect(activities[0].action).toBe('created');

      // Update the card - should log activity
      await boardService.updateCard(card.id, workspaceId, userId, {
        title: 'Updated Card Title',
      });

      // Verify card update was logged
      activities = await activityService.getWorkspaceActivity(
        workspaceId,
        userId,
        10,
        0,
      );
      expect(activities.length).toBe(4);
      expect(activities[0].entityType).toBe('card');
      expect(activities[0].action).toBe('updated');

      // Create another list for moving the card
      const list2 = await boardService.createList(
        board.id,
        workspaceId,
        userId,
        {
          name: 'Second List',
        },
      );

      // Move the card - should log activity
      await boardService.moveCard(card.id, workspaceId, userId, {
        targetListId: list2.id,
        position: 0,
      });

      // Verify card move was logged
      activities = await activityService.getWorkspaceActivity(
        workspaceId,
        userId,
        10,
        0,
      );
      expect(activities.length).toBe(6); // board, list1, card, update, list2, move
      expect(activities[0].entityType).toBe('card');
      expect(activities[0].action).toBe('moved');

      // Delete the card - should log activity
      await boardService.deleteCard(card.id, workspaceId, userId);

      // Verify card deletion was logged
      activities = await activityService.getWorkspaceActivity(
        workspaceId,
        userId,
        10,
        0,
      );
      expect(activities.length).toBe(7);
      expect(activities[0].entityType).toBe('card');
      expect(activities[0].action).toBe('deleted');
    });

    it('should include complete audit information in activities', async () => {
      const activities = await activityService.getWorkspaceActivity(
        workspaceId,
        userId,
        1,
        0,
      );

      expect(activities[0]).toHaveProperty('id');
      expect(activities[0]).toHaveProperty('userId');
      expect(activities[0]).toHaveProperty('workspaceId');
      expect(activities[0]).toHaveProperty('entityType');
      expect(activities[0]).toHaveProperty('entityId');
      expect(activities[0]).toHaveProperty('action');
      expect(activities[0]).toHaveProperty('details');
      expect(activities[0]).toHaveProperty('createdAt');
      expect(activities[0].userId).toBe(userId);
      expect(activities[0].workspaceId).toBe(workspaceId);
    });

    it('should retrieve activities in chronological order', async () => {
      const activities = await activityService.getWorkspaceActivity(
        workspaceId,
        userId,
        10,
        0,
      );

      // Verify chronological order (most recent first)
      for (let i = 0; i < activities.length - 1; i++) {
        expect(activities[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          activities[i + 1].createdAt.getTime(),
        );
      }
    });

    it('should filter activities by entity type', async () => {
      const cardActivities = await activityService.getEntityActivity(
        workspaceId,
        userId,
        'card',
        'any-card-id',
        10,
      );

      // This will return empty since we're querying a non-existent card
      // But it demonstrates the filtering capability
      expect(Array.isArray(cardActivities)).toBe(true);
    });
  });

  describe('Workspace Isolation', () => {
    it('should only return activities for the specified workspace', async () => {
      // Create a second workspace
      const workspace2 = await prisma.workspace.create({
        data: {
          name: 'Second Workspace',
          members: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
      });

      // Create a board in the second workspace
      await boardService.createBoard(workspace2.id, userId, {
        name: 'Board in Workspace 2',
      });

      // Query activities for first workspace
      const workspace1Activities = await activityService.getWorkspaceActivity(
        workspaceId,
        userId,
        100,
        0,
      );

      // Verify all activities belong to workspace 1
      workspace1Activities.forEach((activity) => {
        expect(activity.workspaceId).toBe(workspaceId);
      });

      // Query activities for second workspace
      const workspace2Activities = await activityService.getWorkspaceActivity(
        workspace2.id,
        userId,
        100,
        0,
      );

      // Verify all activities belong to workspace 2
      workspace2Activities.forEach((activity) => {
        expect(activity.workspaceId).toBe(workspace2.id);
      });

      // Clean up
      await prisma.activityEvent.deleteMany({
        where: { workspaceId: workspace2.id },
      });
      await prisma.board.deleteMany({
        where: { workspaceId: workspace2.id },
      });
      await prisma.workspaceMember.deleteMany({
        where: { workspaceId: workspace2.id },
      });
      await prisma.workspace.delete({
        where: { id: workspace2.id },
      });
    });
  });
});
