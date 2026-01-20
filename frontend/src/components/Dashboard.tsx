import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuthErrorHandler } from '../hooks/useAuthErrorHandler';
import WorkspaceGuard from './WorkspaceGuard';
import WorkspaceNavigation from './WorkspaceNavigation';
import BoardsManager from './BoardsManager';
import ActivityFeed from './ActivityFeed';
import ConnectionStatus from './ConnectionStatus';
import { DashboardIcon, ActivityIcon, MembersIcon, SettingsIcon } from './icons';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'boards' | 'activity' | 'members' | 'settings'>('boards');
  
  // Enable authentication error handling for this component
  useAuthErrorHandler();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'boards':
        return <BoardsManager />;
      case 'activity':
        return <ActivityFeed />;
      case 'members':
        return (
          <div className="tab-content-placeholder">
            <MembersIcon size={64} />
            <h3>Members</h3>
            <p>Member management coming soon</p>
          </div>
        );
      case 'settings':
        return (
          <div className="tab-content-placeholder">
            <SettingsIcon size={64} />
            <h3>Settings</h3>
            <p>Workspace settings coming soon</p>
          </div>
        );
      default:
        return <BoardsManager />;
    }
  };

  return (
    <WorkspaceGuard requireWorkspace={true}>
      <div className="dashboard-container">
        <WorkspaceNavigation />
        
        <main className="dashboard-main">
          <div className="welcome-section">
            <div className="welcome-header">
              <div>
                <h2>Welcome back, {user?.name}!</h2>
                {currentWorkspace && (
                  <p>You're working in the <strong>{currentWorkspace.name}</strong> workspace.</p>
                )}
              </div>
              <ConnectionStatus />
            </div>
          </div>
          
          <div className="workspace-content">
            {currentWorkspace ? (
              <div className="workspace-dashboard">
                <div className="dashboard-tabs">
                  <button
                    className={`tab-button ${activeTab === 'boards' ? 'active' : ''}`}
                    onClick={() => setActiveTab('boards')}
                  >
                    <DashboardIcon size={20} />
                    Boards
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activity')}
                  >
                    <ActivityIcon size={20} />
                    Activity
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
                    onClick={() => setActiveTab('members')}
                  >
                    <MembersIcon size={20} />
                    Members
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                  >
                    <SettingsIcon size={20} />
                    Settings
                  </button>
                </div>

                <div className="tab-content">
                  {renderTabContent()}
                </div>
              </div>
            ) : (
              <div className="no-workspace-selected">
                <p>Please select a workspace to continue.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </WorkspaceGuard>
  );
};

export default Dashboard;