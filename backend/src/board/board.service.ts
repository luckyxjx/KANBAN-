import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { ActivityService } from '../activity/activity.service';
import { WorkspaceQueryHelper } from '../workspace/helpers/workspace-query.helper';
import {
  CreateBoardDto,
  UpdateBoardDto,
  CreateListDto,
  UpdateListDto,
  ReorderListsDto,
  CreateCardDto,
  UpdateCardDto,
  MoveCardDto,
  ReorderCardsDto,
} from './dto';
import { Board, List, Card } from '@prisma/client';

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name);

  constructor(
    private prisma: PrismaService,
    private workspaceService: WorkspaceService,
    private activityService: ActivityService,
  ) {}

  /**
   * Create a new board within a workspace
   * Requirement 3.1: WHEN a workspace member creates a board, 
   * THE System SHALL create the board within their workspace
   */
  async createBoard(
    workspaceId: string,
    userId: string,
    dto: CreateBoardDto,
  ): Promise<Board> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    const board = await this.prisma.board.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        color: dto.color,
      },
    });

    this.logger.log(
      `Board created: ${board.id} in workspace: ${workspaceId} by user: ${userId}`,
    );

    // Log activity
    await this.activityService.logBoardActivity(
      userId,
      workspaceId,
      board.id,
      'created',
      {
        name: board.name,
        description: board.description,
        color: board.color,
      },
    );

    this.logger.log(`Returning board: ${JSON.stringify(board)}`);
    return board;
  }

  /**
   * Get all boards in a workspace
   * Requirement 3.2: WHEN a board is requested, 
   * THE System SHALL verify the user has access to the board's workspace
   */
  async getWorkspaceBoards(
    workspaceId: string,
    userId: string,
  ): Promise<Board[]> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    return WorkspaceQueryHelper.getWorkspaceBoards(this.prisma, workspaceId);
  }

  /**
   * Get a single board with all lists and cards
   * Requirement 3.2: WHEN a board is requested, 
   * THE System SHALL verify the user has access to the board's workspace
   * Requirement 3.3: WHEN board data is returned, 
   * THE System SHALL include all associated lists and cards
   */
  async getBoard(
    boardId: string,
    workspaceId: string,
    userId: string,
  ): Promise<Board & { lists: (List & { cards: Card[] })[] }> {
    this.logger.log(`Getting board: ${boardId} in workspace: ${workspaceId} for user: ${userId}`);
    
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Verify board belongs to workspace
    await WorkspaceQueryHelper.verifyBoardInWorkspace(
      this.prisma,
      boardId,
      workspaceId,
    );

    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        lists: {
          include: {
            cards: {
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!board) {
      this.logger.error(`Board not found: ${boardId}`);
      throw new NotFoundException('Board not found');
    }

    this.logger.log(`Board found: ${board.id} with ${board.lists.length} lists`);
    return board;
  }

  /**
   * Update a board
   * Requirement 3.4: WHEN a board is updated, 
   * THE System SHALL validate the user has appropriate permissions
   */
  async updateBoard(
    boardId: string,
    workspaceId: string,
    userId: string,
    dto: UpdateBoardDto,
  ): Promise<Board> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Verify board belongs to workspace
    await WorkspaceQueryHelper.verifyBoardInWorkspace(
      this.prisma,
      boardId,
      workspaceId,
    );

    // Get old board data for activity log
    const oldBoard = await this.prisma.board.findUnique({
      where: { id: boardId },
    });

    const board = await this.prisma.board.update({
      where: { id: boardId },
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color,
      },
    });

    this.logger.log(`Board updated: ${boardId} by user: ${userId}`);

    // Log activity with changes
    const changes: Record<string, any> = {};
    if (dto.name !== undefined && dto.name !== oldBoard?.name) {
      changes.name = { from: oldBoard?.name, to: dto.name };
    }
    if (dto.description !== undefined && dto.description !== oldBoard?.description) {
      changes.description = { from: oldBoard?.description, to: dto.description };
    }
    if (dto.color !== undefined && dto.color !== oldBoard?.color) {
      changes.color = { from: oldBoard?.color, to: dto.color };
    }

    if (Object.keys(changes).length > 0) {
      await this.activityService.logBoardActivity(
        userId,
        workspaceId,
        boardId,
        'updated',
        { changes },
      );
    }

    return board;
  }

  /**
   * Delete a board with cascade cleanup
   * Requirement 3.5: WHEN a board is deleted, 
   * THE System SHALL remove all associated lists, cards, and activity records
   */
  async deleteBoard(
    boardId: string,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Verify board belongs to workspace
    await WorkspaceQueryHelper.verifyBoardInWorkspace(
      this.prisma,
      boardId,
      workspaceId,
    );

    // Get board data for activity log
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });

    // Log activity before deletion
    if (board) {
      await this.activityService.logBoardActivity(
        userId,
        workspaceId,
        boardId,
        'deleted',
        {
          name: board.name,
          description: board.description,
          color: board.color,
        },
      );
    }

    // Delete board (cascade will handle lists, cards, and activity records)
    await this.prisma.board.delete({
      where: { id: boardId },
    });

    this.logger.log(
      `Board deleted: ${boardId} in workspace: ${workspaceId} by user: ${userId}`,
    );
  }

  /**
   * Create a new list within a board
   * Requirement 4.1: WHEN a user creates a list, 
   * THE System SHALL add it to the specified board within their workspace
   */
  async createList(
    boardId: string,
    workspaceId: string,
    userId: string,
    dto: CreateListDto,
  ): Promise<List> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Verify board belongs to workspace
    await WorkspaceQueryHelper.verifyBoardInWorkspace(
      this.prisma,
      boardId,
      workspaceId,
    );

    // Get the current max position for lists in this board
    const maxPositionList = await this.prisma.list.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = maxPositionList ? maxPositionList.position + 1 : 0;

    const list = await this.prisma.list.create({
      data: {
        boardId,
        workspaceId,
        name: dto.name,
        position,
      },
    });

    this.logger.log(
      `List created: ${list.id} in board: ${boardId} by user: ${userId}`,
    );

    // Log activity
    await this.activityService.logListActivity(
      userId,
      workspaceId,
      list.id,
      'created',
      {
        name: list.name,
        boardId,
        position: list.position,
      },
    );

    return list;
  }

  /**
   * Get all lists for a board
   */
  async getBoardLists(
    boardId: string,
    workspaceId: string,
    userId: string,
  ): Promise<(List & { cards: Card[] })[]> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    return WorkspaceQueryHelper.getBoardLists(this.prisma, boardId, workspaceId);
  }

  /**
   * Update a list
   */
  async updateList(
    listId: string,
    workspaceId: string,
    userId: string,
    dto: UpdateListDto,
  ): Promise<List> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Verify list belongs to workspace
    await WorkspaceQueryHelper.verifyListInWorkspace(
      this.prisma,
      listId,
      workspaceId,
    );

    // Get old list data for activity log
    const oldList = await this.prisma.list.findUnique({
      where: { id: listId },
    });

    const list = await this.prisma.list.update({
      where: { id: listId },
      data: {
        name: dto.name,
      },
    });

    this.logger.log(`List updated: ${listId} by user: ${userId}`);

    // Log activity with changes
    if (dto.name !== undefined && dto.name !== oldList?.name) {
      await this.activityService.logListActivity(
        userId,
        workspaceId,
        listId,
        'updated',
        {
          changes: {
            name: { from: oldList?.name, to: dto.name },
          },
        },
      );
    }

    return list;
  }

  /**
   * Reorder lists within a board
   * Requirement 4.6: WHEN lists or cards are reordered, 
   * THE System SHALL persist positional ordering within the board
   */
  async reorderLists(
    boardId: string,
    workspaceId: string,
    userId: string,
    dto: ReorderListsDto,
  ): Promise<List[]> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Verify board belongs to workspace
    await WorkspaceQueryHelper.verifyBoardInWorkspace(
      this.prisma,
      boardId,
      workspaceId,
    );

    // Verify all lists belong to this board and workspace
    const lists = await this.prisma.list.findMany({
      where: {
        id: { in: dto.listIds },
        boardId,
        workspaceId,
      },
    });

    if (lists.length !== dto.listIds.length) {
      throw new BadRequestException('Some lists do not belong to this board');
    }

    // Update positions in a transaction
    await this.prisma.$transaction(
      dto.listIds.map((listId, index) =>
        this.prisma.list.update({
          where: { id: listId },
          data: { position: index },
        }),
      ),
    );

    this.logger.log(`Lists reordered in board: ${boardId} by user: ${userId}`);

    // Log activity
    await this.activityService.logBoardActivity(
      userId,
      workspaceId,
      boardId,
      'reordered',
      {
        entityType: 'lists',
        listIds: dto.listIds,
      },
    );

    // Return updated lists
    return this.prisma.list.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Delete a list
   */
  async deleteList(
    listId: string,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Verify list belongs to workspace
    await WorkspaceQueryHelper.verifyListInWorkspace(
      this.prisma,
      listId,
      workspaceId,
    );

    // Get list data for activity log
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
    });

    // Log activity before deletion
    if (list) {
      await this.activityService.logListActivity(
        userId,
        workspaceId,
        listId,
        'deleted',
        {
          name: list.name,
          boardId: list.boardId,
          position: list.position,
        },
      );
    }

    // Delete list (cascade will handle cards)
    await this.prisma.list.delete({
      where: { id: listId },
    });

    this.logger.log(
      `List deleted: ${listId} in workspace: ${workspaceId} by user: ${userId}`,
    );
  }

  /**
   * Create a new card within a list
   * Requirement 4.2: WHEN a user creates a card, 
   * THE System SHALL add it to the specified list with proper workspace association
   */
  async createCard(
    listId: string,
    workspaceId: string,
    userId: string,
    dto: CreateCardDto,
  ): Promise<Card> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Verify list belongs to workspace
    await WorkspaceQueryHelper.verifyListInWorkspace(
      this.prisma,
      listId,
      workspaceId,
    );

    // Get the current max position for cards in this list
    const maxPositionCard = await this.prisma.card.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = maxPositionCard ? maxPositionCard.position + 1 : 0;

    const card = await this.prisma.card.create({
      data: {
        listId,
        workspaceId,
        title: dto.title,
        description: dto.description,
        position,
      },
    });

    this.logger.log(
      `Card created: ${card.id} in list: ${listId} by user: ${userId}`,
    );

    // Log activity
    await this.activityService.logCardActivity(
      userId,
      workspaceId,
      card.id,
      'created',
      {
        title: card.title,
        description: card.description,
        listId,
        position: card.position,
      },
    );

    return card;
  }

  /**
   * Get all cards for a list
   */
  async getListCards(
    listId: string,
    workspaceId: string,
    userId: string,
  ): Promise<Card[]> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    return WorkspaceQueryHelper.getListCards(this.prisma, listId, workspaceId);
  }

  /**
   * Update a card
   * Requirement 4.4: WHEN a card is updated, 
   * THE System SHALL validate the user has access to the card's workspace
   */
  async updateCard(
    cardId: string,
    workspaceId: string,
    userId: string,
    dto: UpdateCardDto,
  ): Promise<Card> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Verify card belongs to workspace
    await WorkspaceQueryHelper.verifyCardInWorkspace(
      this.prisma,
      cardId,
      workspaceId,
    );

    // Get old card data for activity log
    const oldCard = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    const card = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        title: dto.title,
        description: dto.description,
      },
    });

    this.logger.log(`Card updated: ${cardId} by user: ${userId}`);

    // Log activity with changes
    const changes: Record<string, any> = {};
    if (dto.title !== undefined && dto.title !== oldCard?.title) {
      changes.title = { from: oldCard?.title, to: dto.title };
    }
    if (dto.description !== undefined && dto.description !== oldCard?.description) {
      changes.description = { from: oldCard?.description, to: dto.description };
    }

    if (Object.keys(changes).length > 0) {
      await this.activityService.logCardActivity(
        userId,
        workspaceId,
        cardId,
        'updated',
        { changes },
      );
    }

    return card;
  }

  /**
   * Move a card between lists
   * Requirement 4.3: WHEN a card is moved between lists, 
   * THE System SHALL update the card's list association and position
   */
  async moveCard(
    cardId: string,
    workspaceId: string,
    userId: string,
    dto: MoveCardDto,
  ): Promise<Card> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Verify card belongs to workspace
    await WorkspaceQueryHelper.verifyCardInWorkspace(
      this.prisma,
      cardId,
      workspaceId,
    );

    // Verify target list belongs to workspace
    await WorkspaceQueryHelper.verifyListInWorkspace(
      this.prisma,
      dto.targetListId,
      workspaceId,
    );

    // Get current card to check if it's moving to a different list
    const currentCard = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!currentCard) {
      throw new NotFoundException('Card not found');
    }

    const movingToNewList = currentCard.listId !== dto.targetListId;

    // Move card in a transaction
    const card = await this.prisma.$transaction(async (tx) => {
      if (movingToNewList) {
        // Moving to a different list
        // 1. Update positions of cards in the old list (shift down)
        await tx.card.updateMany({
          where: {
            listId: currentCard.listId,
            position: { gt: currentCard.position },
          },
          data: {
            position: { decrement: 1 },
          },
        });

        // 2. Update positions of cards in the new list (shift up to make room)
        await tx.card.updateMany({
          where: {
            listId: dto.targetListId,
            position: { gte: dto.position },
          },
          data: {
            position: { increment: 1 },
          },
        });

        // 3. Move the card
        return tx.card.update({
          where: { id: cardId },
          data: {
            listId: dto.targetListId,
            position: dto.position,
          },
        });
      } else {
        // Reordering within the same list
        if (dto.position < currentCard.position) {
          // Moving up: shift cards down
          await tx.card.updateMany({
            where: {
              listId: currentCard.listId,
              position: {
                gte: dto.position,
                lt: currentCard.position,
              },
            },
            data: {
              position: { increment: 1 },
            },
          });
        } else if (dto.position > currentCard.position) {
          // Moving down: shift cards up
          await tx.card.updateMany({
            where: {
              listId: currentCard.listId,
              position: {
                gt: currentCard.position,
                lte: dto.position,
              },
            },
            data: {
              position: { decrement: 1 },
            },
          });
        }

        // Update the card position
        return tx.card.update({
          where: { id: cardId },
          data: { position: dto.position },
        });
      }
    });

    this.logger.log(
      `Card moved: ${cardId} to list: ${dto.targetListId} at position: ${dto.position} by user: ${userId}`,
    );

    // Log activity
    await this.activityService.logCardActivity(
      userId,
      workspaceId,
      cardId,
      'moved',
      {
        fromListId: currentCard.listId,
        toListId: dto.targetListId,
        fromPosition: currentCard.position,
        toPosition: dto.position,
      },
    );

    return card;
  }

  /**
   * Reorder cards within a list
   * Requirement 4.6: WHEN lists or cards are reordered, 
   * THE System SHALL persist positional ordering within the board
   */
  async reorderCards(
    listId: string,
    workspaceId: string,
    userId: string,
    dto: ReorderCardsDto,
  ): Promise<Card[]> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Verify list belongs to workspace
    await WorkspaceQueryHelper.verifyListInWorkspace(
      this.prisma,
      listId,
      workspaceId,
    );

    // Verify all cards belong to this list and workspace
    const cards = await this.prisma.card.findMany({
      where: {
        id: { in: dto.cardIds },
        listId,
        workspaceId,
      },
    });

    if (cards.length !== dto.cardIds.length) {
      throw new BadRequestException('Some cards do not belong to this list');
    }

    // Update positions in a transaction
    await this.prisma.$transaction(
      dto.cardIds.map((cardId, index) =>
        this.prisma.card.update({
          where: { id: cardId },
          data: { position: index },
        }),
      ),
    );

    this.logger.log(`Cards reordered in list: ${listId} by user: ${userId}`);

    // Log activity
    await this.activityService.logListActivity(
      userId,
      workspaceId,
      listId,
      'reordered',
      {
        entityType: 'cards',
        cardIds: dto.cardIds,
      },
    );

    // Return updated cards
    return this.prisma.card.findMany({
      where: { listId },
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Delete a card
   */
  async deleteCard(
    cardId: string,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Verify card belongs to workspace
    await WorkspaceQueryHelper.verifyCardInWorkspace(
      this.prisma,
      cardId,
      workspaceId,
    );

    // Get card data for activity log
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    // Log activity before deletion
    if (card) {
      await this.activityService.logCardActivity(
        userId,
        workspaceId,
        cardId,
        'deleted',
        {
          title: card.title,
          description: card.description,
          listId: card.listId,
          position: card.position,
        },
      );
    }

    // Delete card
    await this.prisma.card.delete({
      where: { id: cardId },
    });

    this.logger.log(
      `Card deleted: ${cardId} in workspace: ${workspaceId} by user: ${userId}`,
    );
  }
}
