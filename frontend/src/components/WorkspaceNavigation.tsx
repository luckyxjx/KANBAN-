import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import CreateWorkspaceForm from './CreateWorkspaceForm';
import WorkspaceSettings from './WorkspaceSettings';
import ThemeToggle from './ThemeToggle';
import { DashboardIcon, ActivityIcon, MembersIcon, SettingsIcon, PlusIcon, ArrowDownIcon } from './icons';
import './WorkspaceNavigation.css';

const WorkspaceNavigation: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="workspace-navigation">
      <div className="nav-content">
        {/* Left section - App title and workspace */}
        <div className="nav-left">
          <div className="app-title">
            <h1>Multi-Tenant Kanban</h1>
          </div>
          
          {currentWorkspace && (
            <div className="workspace-section">
              <span className="workspace-label">Workspace:</span>
              <WorkspaceSwitcher />
            </div>
          )}
        </div>

        {/* Center section - Navigation items (for future use) */}
        <div className="nav-center">
          {currentWorkspace && (
            <div className="nav-items">
              <button className="nav-item active">
                <DashboardIcon size={16} />
                Boards
              </button>
              <button className="nav-item">
                <ActivityIcon size={16} />
                Activity
              </button>
              <button className="nav-item">
                <MembersIcon size={16} />
                Members
              </button>
              <button 
                className="nav-item"
                onClick={() => setShowSettings(true)}
              >
                <SettingsIcon size={16} />
                Settings
              </button>
            </div>
          )}
        </div>

        {/* Right section - Actions and user menu */}
        <div className="nav-right">
          <button 
            onClick={() => setShowCreateForm(true)}
            className="create-workspace-nav-button"
            title="Create new workspace"
          >
            <PlusIcon size={14} />
            Workspace
          </button>

          <ThemeToggle />

          <div className="user-menu-container">
            <button 
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-expanded={showUserMenu}
            >
              {user?.avatarUrl && (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name}
                  className="user-avatar"
                />
              )}
              <span className="user-name">{user?.name}</span>
              <ArrowDownIcon size={12} className={`dropdown-arrow ${showUserMenu ? 'open' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="user-menu-dropdown">
                <div className="user-info">
                  <div className="user-details">
                    <span className="user-name-full">{user?.name}</span>
                    <span className="user-email">{user?.email}</span>
                  </div>
                </div>
                <div className="menu-divider"></div>
                <button 
                  className="menu-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowSettings(true);
                  }}
                >
                  <SettingsIcon size={14} />
                  Settings
                </button>
                <button 
                  className="menu-item logout"
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}

            {/* Overlay to close user menu when clicking outside */}
            {showUserMenu && (
              <div 
                className="user-menu-overlay"
                onClick={() => setShowUserMenu(false)}
              />
            )}
          </div>
        </div>
      </div>

      {showCreateForm && (
        <CreateWorkspaceForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => setShowCreateForm(false)}
        />
      )}

      {showSettings && (
        <WorkspaceSettings
          onClose={() => setShowSettings(false)}
        />
      )}
    </nav>
  );
};

export default WorkspaceNavigation;