import React from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import WorkspaceSelectorModal from './WorkspaceSelectorModal';

interface WorkspaceGuardProps {
  children: React.ReactNode;
  requireWorkspace?: boolean;
}

/**
 * WorkspaceGuard enforces workspace context requirement (Requirement 2.7)
 * 
 * When a user has access to multiple workspaces, this component requires
 * explicit workspace selection before allowing access to workspace-specific resources.
 */
const WorkspaceGuard: React.FC<WorkspaceGuardProps> = ({ 
  children, 
  requireWorkspace = false 
}) => {
  const { currentWorkspace, requireWorkspaceSelection, workspaces, loading } = useWorkspace();

  // If workspace selection is required, show the selector modal
  if (requireWorkspaceSelection && workspaces.length > 1) {
    return <WorkspaceSelectorModal workspaces={workspaces} />;
  }

  // If workspace is required but none is selected and we're not loading
  if (requireWorkspace && !currentWorkspace && !loading) {
    return <WorkspaceSelectorModal workspaces={workspaces} />;
  }

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="workspace-guard-loading">
        <div className="loading-spinner"></div>
        <p>Loading workspace...</p>
      </div>
    );
  }

  // Render children if workspace context is satisfied
  return <>{children}</>;
};

export default WorkspaceGuard;
