import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { ActivityEvent } from '@prisma/client';

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'moved'
  | 'deleted'
  | 'reordered';

export type EntityType = 'card' | 'list' | 'board';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    private prisma: PrismaService,
    private workspaceService: WorkspaceService,
  ) {}

  /**
   * Log a card activity event
   * Requirement 6.1: WHEN a card is created, updated, or moved,
   * THE Activity_Logger SHALL record the action with user and timestamp
   */
  async logCardActivity(
    userId: string,
    workspaceId: string,
    cardId: string,
    action: ActivityAction,
    details: Record<string, any>,
  ): Promise<ActivityEvent> {
    return this.logActivity(
      userId,
      workspaceId,
      'card',
      cardId,
      action,
      details,
    );
  }

  /**
   * Log a list activity event
   * Requirement 6.2: WHEN a list is created or updated,
   * THE Activity_Logger SHALL record the action with user and timestamp
   */
  async logListActivity(
    userId: string,
    workspaceId: string,
    listId: string,
    action: ActivityAction,
    details: Record<string, any>,
  ): Promise<ActivityEvent> {
    return this.logActivity(
      userId,
      workspaceId,
      'list',
      listId,
      action,
      details,
    );
  }

  /**
   * Log a board activity event
   */
  async logBoardActivity(
    userId: string,
    workspaceId: string,
    boardId: string,
    action: ActivityAction,
    details: Record<string, any>,
  ): Promise<ActivityEvent> {
    return this.logActivity(
      userId,
      workspaceId,
      'board',
      boardId,
      action,
      details,
    );
  }

  /**
   * Core activity logging method
   * Requirement 6.4: WHEN activity events are created,
   * THE System SHALL include sufficient detail to reconstruct the action
   */
  private async logActivity(
    userId: string,
    workspaceId: string,
    entityType: EntityType,
    entityId: string,
    action: ActivityAction,
    details: Record<string, any>,
  ): Promise<ActivityEvent> {
    const activityEvent = await this.prisma.activityEvent.create({
      data: {
        userId,
        workspaceId,
        entityType,
        entityId,
        action,
        details,
      },
    });

    this.logger.log(
      `Activity logged: ${entityType}.${action} - Entity: ${entityId} by User: ${userId} in Workspace: ${workspaceId}`,
    );

    return activityEvent;
  }

  /**
   * Get workspace activity with pagination
   * Requirement 6.3: WHEN activity is requested,
   * THE System SHALL return only activities for workspaces the user can access
   */
  async getWorkspaceActivity(
    workspaceId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ActivityEvent[]> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Get activities for the workspace
    const activities = await this.prisma.activityEvent.findMany({
      where: {
        workspaceId,
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
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return activities;
  }

  /**
   * Get activity for a specific entity
   */
  async getEntityActivity(
    workspaceId: string,
    userId: string,
    entityType: EntityType,
    entityId: string,
    limit: number = 50,
  ): Promise<ActivityEvent[]> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    const activities = await this.prisma.activityEvent.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return activities;
  }

  /**
   * Get activity for a specific board (includes board, lists, and cards)
   */
  async getBoardActivity(
    workspaceId: string,
    userId: string,
    boardId: string,
    limit: number = 50,
  ): Promise<ActivityEvent[]> {
    // Verify workspace membership
    await this.workspaceService.validateMembership(userId, workspaceId);

    // Get all list IDs for this board
    const lists = await this.prisma.list.findMany({
      where: { boardId, workspaceId },
      select: { id: true },
    });

    const listIds = lists.map((list) => list.id);

    // Get all card IDs for these lists
    const cards = await this.prisma.card.findMany({
      where: { listId: { in: listIds }, workspaceId },
      select: { id: true },
    });

    const cardIds = cards.map((card) => card.id);

    // Get activities for board, lists, and cards
    const activities = await this.prisma.activityEvent.findMany({
      where: {
        workspaceId,
        OR: [
          { entityType: 'board', entityId: boardId },
          { entityType: 'list', entityId: { in: listIds } },
          { entityType: 'card', entityId: { in: cardIds } },
        ],
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
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return activities;
  }
}
