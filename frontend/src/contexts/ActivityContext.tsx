import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { useWebSocket } from './WebSocketContext';
import { useDemoData } from './DemoDataProvider';
import { ActivityService, type ActivityEvent } from '../services/activityService';

interface ActivityContextType {
  activities: ActivityEvent[];
  loading: boolean;
  error: string | null;
  loadActivities: (limit?: number) => Promise<void>;
  addActivity: (activity: ActivityEvent) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

interface ActivityProviderProps {
  children: ReactNode;
}

/**
 * Activity Provider for managing activity logs
 * Requirement 6.1: Record actions with user and timestamp
 * Requirement 6.3: Return only activities for workspaces the user can access
 */
export const ActivityProvider: React.FC<ActivityProviderProps> = ({ children }) => {
  const { currentWorkspace } = useWorkspace();
  const { onCardEvent, onListEvent, onBoardEvent } = useWebSocket();
  const { demoMode } = useDemoData();

  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load workspace activities
   * Requirement 6.3: Implement workspace-scoped activity filtering
   */
  const loadActivities = async (limit: number = 50): Promise<void> => {
    if (!currentWorkspace) return;

    try {
      setLoading(true);
      setError(null);

      if (demoMode) {
        // In demo mode, create sample activities
        const sampleActivities: ActivityEvent[] = [
          {
            id: 'demo-activity-1',
            userId: 'demo-user',
            workspaceId: currentWorkspace.id,
            entityType: 'card',
            entityId: 'demo-card-1',
            action: 'created',
            details: { title: 'Sample Task 1' },
            createdAt: new Date(Date.now() - 5 * 60000), // 5 minutes ago
            user: {
              id: 'demo-user',
              name: 'Demo User',
              email: 'demo@example.com',
            },
          },
          {
            id: 'demo-activity-2',
            userId: 'demo-user',
            workspaceId: currentWorkspace.id,
            entityType: 'card',
            entityId: 'demo-card-2',
            action: 'moved',
            details: { fromList: 'To Do', toList: 'In Progress' },
            createdAt: new Date(Date.now() - 10 * 60000), // 10 minutes ago
            user: {
              id: 'demo-user',
              name: 'Demo User',
              email: 'demo@example.com',
            },
          },
          {
            id: 'demo-activity-3',
            userId: 'demo-user',
            workspaceId: currentWorkspace.id,
            entityType: 'list',
            entityId: 'demo-list-1',
            action: 'created',
            details: { name: 'To Do' },
            createdAt: new Date(Date.now() - 15 * 60000), // 15 minutes ago
            user: {
              id: 'demo-user',
              name: 'Demo User',
              email: 'demo@example.com',
            },
          },
        ];
        setActivities(sampleActivities);
      } else {
        const fetchedActivities = await ActivityService.getWorkspaceActivity(
          currentWorkspace.id,
          limit
        );
        setActivities(fetchedActivities);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load activities';
      setError(errorMessage);
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add activity to the list
   */
  const addActivity = (activity: ActivityEvent) => {
    setActivities((prev) => [activity, ...prev]);
  };

  /**
   * Load activities when workspace changes
   */
  useEffect(() => {
    if (currentWorkspace) {
      loadActivities();
    } else {
      setActivities([]);
    }
  }, [currentWorkspace, demoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Listen for real-time activity updates
   * Requirement 6.5: Simultaneously update the activity log with real-time updates
   */
  useEffect(() => {
    if (demoMode) {
      return;
    }

    const handleCardEvent = (event: any) => {
      // Create activity event from card event
      const activity: ActivityEvent = {
        id: `activity-${Date.now()}`,
        userId: event.data.userId || 'unknown',
        workspaceId: currentWorkspace?.id || '',
        entityType: 'card',
        entityId: event.data.id,
        action: event.type.split('.')[1], // Extract action from 'card.created'
        details: event.data,
        createdAt: new Date(event.timestamp),
      };
      addActivity(activity);
    };

    const handleListEvent = (event: any) => {
      const activity: ActivityEvent = {
        id: `activity-${Date.now()}`,
        userId: event.data.userId || 'unknown',
        workspaceId: currentWorkspace?.id || '',
        entityType: 'list',
        entityId: event.data.id,
        action: event.type.split('.')[1],
        details: event.data,
        createdAt: new Date(event.timestamp),
      };
      addActivity(activity);
    };

    const handleBoardEvent = (event: any) => {
      const activity: ActivityEvent = {
        id: `activity-${Date.now()}`,
        userId: event.data.userId || 'unknown',
        workspaceId: currentWorkspace?.id || '',
        entityType: 'board',
        entityId: event.data.id,
        action: event.type.split('.')[1],
        details: event.data,
        createdAt: new Date(event.timestamp),
      };
      addActivity(activity);
    };

    onCardEvent(handleCardEvent);
    onListEvent(handleListEvent);
    onBoardEvent(handleBoardEvent);

    return () => {
      // Cleanup is handled by WebSocket context
    };
  }, [currentWorkspace, demoMode, onCardEvent, onListEvent, onBoardEvent]);

  const value: ActivityContextType = {
    activities,
    loading,
    error,
    loadActivities,
    addActivity,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = (): ActivityContextType => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};
