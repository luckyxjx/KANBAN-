import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException, Logger } from '@nestjs/common';

/**
 * Helper functions for workspace-scoped data access
 * Requirement 7.1: WHEN any database query is executed, 
 * THE System SHALL include workspace-scoped filtering
 * 
 * Requirement 7.2: WHEN user data is requested, 
 * THE System SHALL verify workspace membership before returning results
 */
export class WorkspaceQueryHelper {
  private static readonly logger = new Logger(WorkspaceQueryHelper.name);

  /**
   * Verify that a board belongs to the specified workspace
   */
  static async verifyBoardInWorkspace(
    prisma: PrismaService,
    boardId: string,
    workspaceId: string,
  ): Promise<void> {
    this.logger.log(`Verifying board ${boardId} in workspace ${workspaceId}`);
    
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { workspaceId: true, id: true },
    });

    if (!board) {
      this.logger.error(`Board not found in database: ${boardId}`);
      throw new ForbiddenException('Board not found');
    }

    this.logger.log(`Board found: ${board.id}, workspaceId: ${board.workspaceId}`);

    if (board.workspaceId !== workspaceId) {
      this.logger.warn(
        `Cross-workspace access attempt - boardId: ${boardId}, expectedWorkspace: ${workspaceId}, actualWorkspace: ${board.workspaceId}`,
      );
      throw new ForbiddenException('Board does not belong to this workspace');
    }
    
    this.logger.log(`Board verification successful`);
  }

  /**
   * Verify that a list belongs to the specified workspace
   */
  static async verifyListInWorkspace(
    prisma: PrismaService,
    listId: string,
    workspaceId: string,
  ): Promise<void> {
    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { workspaceId: true },
    });

    if (!list) {
      throw new ForbiddenException('List not found');
    }

    if (list.workspaceId !== workspaceId) {
      this.logger.warn(
        `Cross-workspace access attempt - listId: ${listId}, expectedWorkspace: ${workspaceId}, actualWorkspace: ${list.workspaceId}`,
      );
      throw new ForbiddenException('List does not belong to this workspace');
    }
  }

  /**
   * Verify that a card belongs to the specified workspace
   */
  static async verifyCardInWorkspace(
    prisma: PrismaService,
    cardId: string,
    workspaceId: string,
  ): Promise<void> {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { workspaceId: true },
    });

    if (!card) {
      throw new ForbiddenException('Card not found');
    }

    if (card.workspaceId !== workspaceId) {
      this.logger.warn(
        `Cross-workspace access attempt - cardId: ${cardId}, expectedWorkspace: ${workspaceId}, actualWorkspace: ${card.workspaceId}`,
      );
      throw new ForbiddenException('Card does not belong to this workspace');
    }
  }

  /**
   * Get workspace-scoped boards
   */
  static async getWorkspaceBoards(
    prisma: PrismaService,
    workspaceId: string,
  ) {
    return prisma.board.findMany({
      where: { workspaceId },
      include: {
        lists: {
          include: {
            cards: true,
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get workspace-scoped lists for a board
   */
  static async getBoardLists(
    prisma: PrismaService,
    boardId: string,
    workspaceId: string,
  ) {
    // First verify the board belongs to the workspace
    await this.verifyBoardInWorkspace(prisma, boardId, workspaceId);

    return prisma.list.findMany({
      where: {
        boardId,
        workspaceId,
      },
      include: {
        cards: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Get workspace-scoped cards for a list
   */
  static async getListCards(
    prisma: PrismaService,
    listId: string,
    workspaceId: string,
  ) {
    // First verify the list belongs to the workspace
    await this.verifyListInWorkspace(prisma, listId, workspaceId);

    return prisma.card.findMany({
      where: {
        listId,
        workspaceId,
      },
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Get workspace-scoped activity events
   */
  static async getWorkspaceActivity(
    prisma: PrismaService,
    workspaceId: string,
    limit: number = 50,
  ) {
    return prisma.activityEvent.findMany({
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
    });
  }

  /**
   * Log unauthorized access attempt
   * Requirement 7.6: WHEN unauthorized access is attempted, 
   * THE System SHALL log the attempt with userId, workspaceId and timestamp
   */
  static logUnauthorizedAccess(
    userId: string,
    workspaceId: string,
    resource: string,
    resourceId: string,
  ): void {
    this.logger.warn(
      JSON.stringify({
        event: 'unauthorized_access_attempt',
        userId,
        workspaceId,
        resource,
        resourceId,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
