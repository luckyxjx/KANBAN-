import axios from 'axios';

export interface ActivityEvent {
  id: string;
  userId: string;
  workspaceId: string;
  entityType: 'card' | 'list' | 'board';
  entityId: string;
  action: string;
  details: Record<string, any>;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

/**
 * Activity Service for fetching activity logs
 * Requirement 6.3: Implement workspace-scoped activity filtering
 */
export class ActivityService {
  /**
   * Get workspace activity
   * Requirement 6.3: Return only activities for workspaces the user can access
   */
  static async getWorkspaceActivity(
    workspaceId: string,
    limit: number = 50
  ): Promise<ActivityEvent[]> {
    try {
      const response = await axios.get(
        `/workspaces/${workspaceId}/activity`,
        {
          params: { limit },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch activity:', error);
      throw error;
    }
  }

  /**
   * Get board activity
   */
  static async getBoardActivity(
    boardId: string,
    workspaceId: string,
    limit: number = 50
  ): Promise<ActivityEvent[]> {
    try {
      const response = await axios.get(
        `/workspaces/${workspaceId}/boards/${boardId}/activity`,
        {
          params: { limit },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch board activity:', error);
      throw error;
    }
  }

  /**
   * Format activity event for display
   */
  static formatActivityMessage(activity: ActivityEvent): string {
    const userName = activity.user?.name || 'Unknown user';
    const entityType = activity.entityType;
    const action = activity.action;

    switch (action) {
      case 'created':
        return `${userName} created a ${entityType}`;
      case 'updated':
        return `${userName} updated a ${entityType}`;
      case 'moved':
        return `${userName} moved a ${entityType}`;
      case 'deleted':
        return `${userName} deleted a ${entityType}`;
      default:
        return `${userName} performed an action on a ${entityType}`;
    }
  }

  /**
   * Get activity icon based on entity type and action
   */
  static getActivityIcon(activity: ActivityEvent): string {
    const { entityType, action } = activity;

    if (entityType === 'card') {
      if (action === 'created') return '✨';
      if (action === 'moved') return '↔️';
      if (action === 'deleted') return '🗑️';
      return '📝';
    }

    if (entityType === 'list') {
      if (action === 'created') return '📋';
      if (action === 'deleted') return '🗑️';
      return '📋';
    }

    if (entityType === 'board') {
      if (action === 'created') return '🎯';
      if (action === 'deleted') return '🗑️';
      return '🎯';
    }

    return '📌';
  }
}
