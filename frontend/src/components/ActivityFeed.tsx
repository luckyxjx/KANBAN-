import React, { useEffect } from 'react';
import { useActivity } from '../contexts/ActivityContext';
import { ActivityService, type ActivityEvent } from '../services/activityService';
import './ActivityFeed.css';

/**
 * Activity Feed Component
 * Requirement 6.1: Record actions with user and timestamp
 * Requirement 6.3: Return only activities for workspaces the user can access
 * Requirement 6.5: Simultaneously update the activity log with real-time updates
 */
const ActivityFeed: React.FC = () => {
  const { activities, loading, error, loadActivities } = useActivity();

  useEffect(() => {
    loadActivities();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="activity-feed">
        <div className="activity-loading">
          <div className="spinner"></div>
          <p>Loading activity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activity-feed">
        <div className="activity-error">
          <p>Failed to load activity: {error}</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="activity-feed">
        <div className="activity-empty">
          <p>No activity yet</p>
          <p className="activity-empty-hint">Activities will appear here as team members make changes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      <div className="activity-list">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} formatTime={formatTime} />
        ))}
      </div>
    </div>
  );
};

interface ActivityItemProps {
  activity: ActivityEvent;
  formatTime: (date: Date) => string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, formatTime }) => {
  const icon = ActivityService.getActivityIcon(activity);
  const timeAgo = formatTime(activity.createdAt);

  return (
    <div className="activity-item">
      <div className="activity-icon">{icon}</div>
      <div className="activity-content">
        <div className="activity-message">
          <span className="activity-user">{activity.user?.name || 'Unknown'}</span>
          <span className="activity-action">
            {activity.action === 'created' && 'created'}
            {activity.action === 'updated' && 'updated'}
            {activity.action === 'moved' && 'moved'}
            {activity.action === 'deleted' && 'deleted'}
          </span>
          <span className="activity-entity">
            {activity.entityType === 'card' && 'a card'}
            {activity.entityType === 'list' && 'a list'}
            {activity.entityType === 'board' && 'a board'}
          </span>
        </div>
        {activity.details && activity.details.title && (
          <div className="activity-details">
            <span className="activity-title">{activity.details.title}</span>
          </div>
        )}
        <div className="activity-time">{timeAgo}</div>
      </div>
    </div>
  );
};

export default ActivityFeed;
