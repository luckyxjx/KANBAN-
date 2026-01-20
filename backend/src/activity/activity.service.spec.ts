import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from './activity.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceService } from '../workspace/workspace.service';

describe('ActivityService', () => {
  let service: ActivityService;
  let prismaService: PrismaService;
  let workspaceService: WorkspaceService;

  const mockPrismaService = {
    activityEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    list: {
      findMany: jest.fn(),
    },
    card: {
      findMany: jest.fn(),
    },
  };

  const mockWorkspaceService = {
    validateMembership: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WorkspaceService,
          useValue: mockWorkspaceService,
        },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
    prismaService = module.get<PrismaService>(PrismaService);
    workspaceService = module.get<WorkspaceService>(WorkspaceService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logCardActivity', () => {
    it('should log a card activity event', async () => {
      const userId = 'user-1';
      const workspaceId = 'workspace-1';
      const cardId = 'card-1';
      const action = 'created';
      const details = { title: 'Test Card', listId: 'list-1' };

      const mockActivity = {
        id: 'activity-1',
        userId,
        workspaceId,
        entityType: 'card',
        entityId: cardId,
        action,
        details,
        createdAt: new Date(),
      };

      mockPrismaService.activityEvent.create.mockResolvedValue(mockActivity);

      const result = await service.logCardActivity(
        userId,
        workspaceId,
        cardId,
        action,
        details,
      );

      expect(result).toEqual(mockActivity);
      expect(mockPrismaService.activityEvent.create).toHaveBeenCalledWith({
        data: {
          userId,
          workspaceId,
          entityType: 'card',
          entityId: cardId,
          action,
          details,
        },
      });
    });
  });

  describe('logListActivity', () => {
    it('should log a list activity event', async () => {
      const userId = 'user-1';
      const workspaceId = 'workspace-1';
      const listId = 'list-1';
      const action = 'updated';
      const details = { name: 'Updated List' };

      const mockActivity = {
        id: 'activity-1',
        userId,
        workspaceId,
        entityType: 'list',
        entityId: listId,
        action,
        details,
        createdAt: new Date(),
      };

      mockPrismaService.activityEvent.create.mockResolvedValue(mockActivity);

      const result = await service.logListActivity(
        userId,
        workspaceId,
        listId,
        action,
        details,
      );

      expect(result).toEqual(mockActivity);
      expect(mockPrismaService.activityEvent.create).toHaveBeenCalledWith({
        data: {
          userId,
          workspaceId,
          entityType: 'list',
          entityId: listId,
          action,
          details,
        },
      });
    });
  });

  describe('logBoardActivity', () => {
    it('should log a board activity event', async () => {
      const userId = 'user-1';
      const workspaceId = 'workspace-1';
      const boardId = 'board-1';
      const action = 'deleted';
      const details = { name: 'Deleted Board' };

      const mockActivity = {
        id: 'activity-1',
        userId,
        workspaceId,
        entityType: 'board',
        entityId: boardId,
        action,
        details,
        createdAt: new Date(),
      };

      mockPrismaService.activityEvent.create.mockResolvedValue(mockActivity);

      const result = await service.logBoardActivity(
        userId,
        workspaceId,
        boardId,
        action,
        details,
      );

      expect(result).toEqual(mockActivity);
      expect(mockPrismaService.activityEvent.create).toHaveBeenCalledWith({
        data: {
          userId,
          workspaceId,
          entityType: 'board',
          entityId: boardId,
          action,
          details,
        },
      });
    });
  });

  describe('getWorkspaceActivity', () => {
    it('should return workspace activities after validating membership', async () => {
      const userId = 'user-1';
      const workspaceId = 'workspace-1';
      const limit = 50;
      const offset = 0;

      const mockActivities = [
        {
          id: 'activity-1',
          userId,
          workspaceId,
          entityType: 'card',
          entityId: 'card-1',
          action: 'created',
          details: {},
          createdAt: new Date(),
          user: {
            id: userId,
            name: 'Test User',
            email: 'test@example.com',
            avatarUrl: null,
          },
        },
      ];

      mockWorkspaceService.validateMembership.mockResolvedValue(true);
      mockPrismaService.activityEvent.findMany.mockResolvedValue(
        mockActivities,
      );

      const result = await service.getWorkspaceActivity(
        workspaceId,
        userId,
        limit,
        offset,
      );

      expect(result).toEqual(mockActivities);
      expect(mockWorkspaceService.validateMembership).toHaveBeenCalledWith(
        userId,
        workspaceId,
      );
      expect(mockPrismaService.activityEvent.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    });
  });

  describe('getEntityActivity', () => {
    it('should return entity activities after validating membership', async () => {
      const userId = 'user-1';
      const workspaceId = 'workspace-1';
      const entityType = 'card';
      const entityId = 'card-1';
      const limit = 50;

      const mockActivities = [
        {
          id: 'activity-1',
          userId,
          workspaceId,
          entityType,
          entityId,
          action: 'updated',
          details: {},
          createdAt: new Date(),
          user: {
            id: userId,
            name: 'Test User',
            email: 'test@example.com',
            avatarUrl: null,
          },
        },
      ];

      mockWorkspaceService.validateMembership.mockResolvedValue(true);
      mockPrismaService.activityEvent.findMany.mockResolvedValue(
        mockActivities,
      );

      const result = await service.getEntityActivity(
        workspaceId,
        userId,
        entityType,
        entityId,
        limit,
      );

      expect(result).toEqual(mockActivities);
      expect(mockWorkspaceService.validateMembership).toHaveBeenCalledWith(
        userId,
        workspaceId,
      );
      expect(mockPrismaService.activityEvent.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId,
          entityType,
          entityId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    });
  });

  describe('getBoardActivity', () => {
    it('should return board activities including lists and cards', async () => {
      const userId = 'user-1';
      const workspaceId = 'workspace-1';
      const boardId = 'board-1';
      const limit = 50;

      const mockLists = [{ id: 'list-1' }, { id: 'list-2' }];
      const mockCards = [{ id: 'card-1' }, { id: 'card-2' }];
      const mockActivities = [
        {
          id: 'activity-1',
          userId,
          workspaceId,
          entityType: 'board',
          entityId: boardId,
          action: 'created',
          details: {},
          createdAt: new Date(),
          user: {
            id: userId,
            name: 'Test User',
            email: 'test@example.com',
            avatarUrl: null,
          },
        },
      ];

      mockWorkspaceService.validateMembership.mockResolvedValue(true);
      mockPrismaService.list.findMany.mockResolvedValue(mockLists);
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);
      mockPrismaService.activityEvent.findMany.mockResolvedValue(
        mockActivities,
      );

      const result = await service.getBoardActivity(
        workspaceId,
        userId,
        boardId,
        limit,
      );

      expect(result).toEqual(mockActivities);
      expect(mockWorkspaceService.validateMembership).toHaveBeenCalledWith(
        userId,
        workspaceId,
      );
      expect(mockPrismaService.list.findMany).toHaveBeenCalledWith({
        where: { boardId, workspaceId },
        select: { id: true },
      });
      expect(mockPrismaService.card.findMany).toHaveBeenCalledWith({
        where: { listId: { in: ['list-1', 'list-2'] }, workspaceId },
        select: { id: true },
      });
    });
  });
});
