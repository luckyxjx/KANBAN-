import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import CreateWorkspaceForm from './CreateWorkspaceForm';
import { WorkspaceIcon, LoadingIcon, PlusIcon } from './icons';
import './WorkspaceGuard.css';

interface WorkspaceGuardProps {
  children: React.ReactNode;
  requireWorkspace?: boolean;
}

const WorkspaceGuard: React.FC<WorkspaceGuardProps> = ({ 
  children, 
  requireWorkspace = true 
}) => {
  const { isAuthenticated } = useAuth();
  const { 
    currentWorkspace, 
    workspaces, 
    loading, 
    error,
    requireWorkspaceSelection 
  } = useWorkspace();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Don't render anything if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="workspace-guard loading">
        <LoadingIcon size={40} />
        <p>Loading workspaces...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="workspace-guard error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Workspaces</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show workspace creation prompt if no workspaces exist
  if (workspaces.length === 0) {
    return (
      <div className="workspace-guard no-workspaces">
        <div className="no-workspaces-content">
          <div className="workspace-icon-large">
            <WorkspaceIcon size={64} />
          </div>
          <h2>Welcome to Multi-Tenant Kanban!</h2>
          <p>
            To get started, you'll need to create your first workspace. 
            Workspaces help you organize your projects and collaborate with your team.
          </p>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="create-workspace-button primary"
          >
            <PlusIcon size={16} />
            Create Your First Workspace
          </button>
        </div>

        {showCreateForm && (
          <CreateWorkspaceForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => setShowCreateForm(false)}
          />
        )}
      </div>
    );
  }

  // Show workspace selection prompt if multiple workspaces and none selected
  if (requireWorkspace && requireWorkspaceSelection) {
    return (
      <div className="workspace-guard workspace-selection">
        <div className="workspace-selection-content">
          <div className="workspace-icon-large">
            <WorkspaceIcon size={64} />
          </div>
          <h2>Select a Workspace</h2>
          <p>
            You have access to multiple workspaces. Please select one to continue.
          </p>
          
          <div className="workspace-selection-controls">
            <WorkspaceSwitcher />
            <button 
              onClick={() => setShowCreateForm(true)}
              className="create-workspace-button secondary"
            >
              <PlusIcon size={14} />
              Create New Workspace
            </button>
          </div>
        </div>

        {showCreateForm && (
          <CreateWorkspaceForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => setShowCreateForm(false)}
          />
        )}
      </div>
    );
  }

  // Show workspace selection warning if workspace is required but not selected
  if (requireWorkspace && !currentWorkspace) {
    return (
      <div className="workspace-guard workspace-required">
        <div className="workspace-required-content">
          <div className="warning-icon">⚠️</div>
          <h3>Workspace Required</h3>
          <p>Please select a workspace to access this feature.</p>
          <WorkspaceSwitcher />
        </div>
      </div>
    );
  }

  // Render children if all workspace requirements are met
  return <>{children}</>;
};

export default WorkspaceGuard;