import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { ActivityService } from '../activity/activity.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('BoardService', () => {
  let service: BoardService;
  let prismaService: PrismaService;
  let workspaceService: WorkspaceService;
  let activityService: ActivityService;

  const mockPrismaService = {
    board: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    list: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    card: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockWorkspaceService = {
    validateMembership: jest.fn(),
  };

  const mockActivityService = {
    logBoardActivity: jest.fn(),
    logListActivity: jest.fn(),
    logCardActivity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WorkspaceService,
          useValue: mockWorkspaceService,
        },
        {
          provide: ActivityService,
          useValue: mockActivityService,
        },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
    prismaService = module.get<PrismaService>(PrismaService);
    workspaceService = module.get<WorkspaceService>(WorkspaceService);
    activityService = module.get<ActivityService>(ActivityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBoard', () => {
    it('should create a board with workspace scoping', async () => {
      const userId = 'user-1';
      const workspaceId = 'workspace-1';
      const dto = { name: 'Test Board', description: 'Test Description' };
      const expectedBoard = {
        id: 'board-1',
        workspaceId,
        name: dto.name,
        description: dto.description,
        color: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWorkspaceService.validateMembership.mockResolvedValue({
        id: 'member-1',
        userId,
        workspaceId,
        role: 'MEMBER',
      });
      mockPrismaService.board.create.mockResolvedValue(expectedBoard);

      const result = await service.createBoard(workspaceId, userId, dto);

      expect(workspaceService.validateMembership).toHaveBeenCalledWith(
        userId,
        workspaceId,
      );
      expect(prismaService.board.create).toHaveBeenCalledWith({
        data: {
          workspaceId,
          name: dto.name,
          description: dto.description,
          color: undefined,
        },
      });
      expect(result).toEqual(expectedBoard);
    });

    it('should throw ForbiddenException if user is not a workspace member', async () => {
      const userId = 'user-1';
      const workspaceId = 'workspace-1';
      const dto = { name: 'Test Board' };

      mockWorkspaceService.validateMembership.mockRejectedValue(
        new ForbiddenException('You do not have access to this workspace'),
      );

      await expect(
        service.createBoard(workspaceId, userId, dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createList', () => {
    it('should create a list with proper position', async () => {
      const userId = 'user-1';
      const workspaceId = 'workspace-1';
      const boardId = 'board-1';
      const dto = { name: 'Test List' };
      const expectedList = {
        id: 'list-1',
        boardId,
        workspaceId,
        name: dto.name,
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWorkspaceService.validateMembership.mockResolvedValue({
        id: 'member-1',
        userId,
        workspaceId,
        role: 'MEMBER',
      });
      mockPrismaService.board.findUnique.mockResolvedValue({
        id: boardId,
        workspaceId,
      });
      mockPrismaService.list.findFirst.mockResolvedValue(null);
      mockPrismaService.list.create.mockResolvedValue(expectedList);

      const result = await service.createList(boardId, workspaceId, userId, dto);

      expect(result).toEqual(expectedList);
      expect(result.position).toBe(0);
    });
  });

  describe('createCard', () => {
    it('should create a card with proper workspace association', async () => {
      const userId = 'user-1';
      const workspaceId = 'workspace-1';
      const listId = 'list-1';
      const dto = { title: 'Test Card', description: 'Test Description' };
      const expectedCard = {
        id: 'card-1',
        listId,
        workspaceId,
        title: dto.title,
        description: dto.description,
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWorkspaceService.validateMembership.mockResolvedValue({
        id: 'member-1',
        userId,
        workspaceId,
        role: 'MEMBER',
      });
      mockPrismaService.list.findUnique.mockResolvedValue({
        id: listId,
        workspaceId,
      });
      mockPrismaService.card.findFirst.mockResolvedValue(null);
      mockPrismaService.card.create.mockResolvedValue(expectedCard);

      const result = await service.createCard(listId, workspaceId, userId, dto);

      expect(result).toEqual(expectedCard);
      expect(result.workspaceId).toBe(workspaceId);
    });
  });

  describe('moveCard', () => {
    it('should move a card between lists', async () => {
      const userId = 'user-1';
      const workspaceId = 'workspace-1';
      const cardId = 'card-1';
      const dto = { targetListId: 'list-2', position: 1 };
      const currentCard = {
        id: cardId,
        listId: 'list-1',
        workspaceId,
        title: 'Test Card',
        position: 0,
      };
      const movedCard = { ...currentCard, listId: dto.targetListId, position: dto.position };

      mockWorkspaceService.validateMembership.mockResolvedValue({
        id: 'member-1',
        userId,
        workspaceId,
        role: 'MEMBER',
      });
      mockPrismaService.card.findUnique.mockResolvedValue(currentCard);
      mockPrismaService.list.findUnique.mockResolvedValue({
        id: dto.targetListId,
        workspaceId,
      });
      mockPrismaService.card.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.card.update.mockResolvedValue(movedCard);

      const result = await service.moveCard(cardId, workspaceId, userId, dto);

      expect(result.listId).toBe(dto.targetListId);
      expect(result.position).toBe(dto.position);
    });
  });

  describe('deleteBoard', () => {
    it('should delete a board with cascade cleanup', async () => {
      const userId = 'user-1';
      const workspaceId = 'workspace-1';
      const boardId = 'board-1';

      mockWorkspaceService.validateMembership.mockResolvedValue({
        id: 'member-1',
        userId,
        workspaceId,
        role: 'MEMBER',
      });
      mockPrismaService.board.findUnique.mockResolvedValue({
        id: boardId,
        workspaceId,
      });
      mockPrismaService.board.delete.mockResolvedValue({
        id: boardId,
        workspaceId,
      });

      await service.deleteBoard(boardId, workspaceId, userId);

      expect(prismaService.board.delete).toHaveBeenCalledWith({
        where: { id: boardId },
      });
    });
  });
});
