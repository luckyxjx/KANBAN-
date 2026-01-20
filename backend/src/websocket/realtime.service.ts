import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGatewayService } from './websocket.gateway';
import { ActivityService } from '../activity/activity.service';

export interface CardEvent {
  type: 'card.created' | 'card.updated' | 'card.moved' | 'card.deleted';
  cardId: string;
  workspaceId: string;
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface ListEvent {
  type:
    | 'list.created'
    | 'list.updated'
    | 'list.reordered'
    | 'list.deleted';
  listId: string;
  workspaceId: string;
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface BoardEvent {
  type: 'board.created' | 'board.updated' | 'board.deleted';
  boardId: string;
  workspaceId: string;
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
}

/**
 * Real-time event broadcasting service
 * Requirement 5.3: WHEN a card is created, updated, or moved,
 * THE Real_Time_Engine SHALL broadcast the change to all workspace members
 * 
 * Requirement 5.4: WHEN a list is created or updated,
 * THE Real_Time_Engine SHALL broadcast the change to all workspace members
 * 
 * Requirement 5.5: WHEN real-time events are broadcast,
 * THE System SHALL ensure only workspace members receive the updates
 * 
 * Requirement 5.7: WHEN duplicate real-time events are received,
 * THE System SHALL handle them idempotently without corrupting state
 * 
 * Requirement 6.5: WHEN real-time updates occur,
 * THE System SHALL simultaneously update the activity log
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private eventIdempotencyMap = new Map<string, number>(); // eventId -> timestamp
  private readonly IDEMPOTENCY_WINDOW_MS = 5000; // 5 second window for duplicate detection

  constructor(
    private wsGateway: WebSocketGatewayService,
    private activityService: ActivityService,
  ) {}

  /**
   * Broadcast card event and log activity
   * Requirement 5.3: Broadcast to workspace members
   * Requirement 6.5: Simultaneously update activity log
   */
  async broadcastCardEvent(event: CardEvent): Promise<void> {
    // Check for duplicate events (idempotency)
    if (this.isDuplicateEvent(event.cardId, event.type)) {
      this.logger.debug(
        `Duplicate card event detected: ${event.type} for card ${event.cardId}. Ignoring.`,
      );
      return;
    }

    try {
      // Broadcast to workspace members
      this.wsGateway.broadcastCardEvent(
        event.workspaceId,
        event.type,
        event.data,
      );

      // Log activity
      const actionMap: Record<string, any> = {
        'card.created': 'created',
        'card.updated': 'updated',
        'card.moved': 'moved',
        'card.deleted': 'deleted',
      };

      await this.activityService.logCardActivity(
        event.userId,
        event.workspaceId,
        event.cardId,
        actionMap[event.type] as any,
        event.data,
      );

      this.logger.log(
        `Card event broadcasted and logged: ${event.type} - Card: ${event.cardId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error broadcasting card event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Broadcast list event and log activity
   * Requirement 5.4: Broadcast to workspace members
   * Requirement 6.5: Simultaneously update activity log
   */
  async broadcastListEvent(event: ListEvent): Promise<void> {
    // Check for duplicate events (idempotency)
    if (this.isDuplicateEvent(event.listId, event.type)) {
      this.logger.debug(
        `Duplicate list event detected: ${event.type} for list ${event.listId}. Ignoring.`,
      );
      return;
    }

    try {
      // Broadcast to workspace members
      this.wsGateway.broadcastListEvent(
        event.workspaceId,
        event.type,
        event.data,
      );

      // Log activity
      const actionMap: Record<string, any> = {
        'list.created': 'created',
        'list.updated': 'updated',
        'list.reordered': 'reordered',
        'list.deleted': 'deleted',
      };

      await this.activityService.logListActivity(
        event.userId,
        event.workspaceId,
        event.listId,
        actionMap[event.type] as any,
        event.data,
      );

      this.logger.log(
        `List event broadcasted and logged: ${event.type} - List: ${event.listId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error broadcasting list event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Broadcast board event and log activity
   */
  async broadcastBoardEvent(event: BoardEvent): Promise<void> {
    // Check for duplicate events (idempotency)
    if (this.isDuplicateEvent(event.boardId, event.type)) {
      this.logger.debug(
        `Duplicate board event detected: ${event.type} for board ${event.boardId}. Ignoring.`,
      );
      return;
    }

    try {
      // Broadcast to workspace members
      this.wsGateway.broadcastBoardEvent(
        event.workspaceId,
        event.type,
        event.data,
      );

      // Log activity
      const actionMap: Record<string, any> = {
        'board.created': 'created',
        'board.updated': 'updated',
        'board.deleted': 'deleted',
      };

      await this.activityService.logBoardActivity(
        event.userId,
        event.workspaceId,
        event.boardId,
        actionMap[event.type] as any,
        event.data,
      );

      this.logger.log(
        `Board event broadcasted and logged: ${event.type} - Board: ${event.boardId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error broadcasting board event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Check if event is a duplicate (idempotency handling)
   * Requirement 5.7: Handle duplicate events idempotently
   */
  private isDuplicateEvent(entityId: string, eventType: string): boolean {
    const eventKey = `${entityId}:${eventType}`;
    const now = Date.now();
    const lastEventTime = this.eventIdempotencyMap.get(eventKey);

    if (lastEventTime && now - lastEventTime < this.IDEMPOTENCY_WINDOW_MS) {
      return true;
    }

    // Update the timestamp for this event
    this.eventIdempotencyMap.set(eventKey, now);

    // Clean up old entries periodically
    if (this.eventIdempotencyMap.size > 10000) {
      this.cleanupOldEntries(now);
    }

    return false;
  }

  /**
   * Clean up old idempotency entries
   */
  private cleanupOldEntries(now: number): void {
    for (const [key, timestamp] of this.eventIdempotencyMap.entries()) {
      if (now - timestamp > this.IDEMPOTENCY_WINDOW_MS * 2) {
        this.eventIdempotencyMap.delete(key);
      }
    }
  }

  /**
   * Get workspace connected users count
   */
  getWorkspaceConnectedUsers(workspaceId: string): number {
    return this.wsGateway.getWorkspaceConnectedUsers(workspaceId);
  }

  /**
   * Get total connected users
   */
  getConnectedUsersCount(): number {
    return this.wsGateway.getConnectedUsersCount();
  }
}
