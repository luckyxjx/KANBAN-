import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import CreateWorkspaceForm from './CreateWorkspaceForm';
import { PlusIcon } from './icons';
import type { Workspace } from '../types/workspace';
import './WorkspaceSelectorModal.css';

interface WorkspaceSelectorModalProps {
  workspaces: Workspace[];
}

/**
 * WorkspaceSelectorModal displays when user needs to select a workspace
 * Implements Requirement 2.7: explicit workspace selection requirement
 */
const WorkspaceSelectorModal: React.FC<WorkspaceSelectorModalProps> = ({ workspaces }) => {
  const { setCurrentWorkspace } = useWorkspace();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleSelectWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
  };

  if (showCreateForm) {
    return (
      <CreateWorkspaceForm
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => setShowCreateForm(false)}
      />
    );
  }

  return (
    <div className="workspace-selector-overlay">
      <div className="workspace-selector-modal">
        <div className="selector-header">
          <h1>Select a Workspace</h1>
          <p>Choose a workspace to continue</p>
        </div>

        <div className="workspace-selector-content">
          {workspaces.length > 0 ? (
            <div className="workspace-grid">
              {workspaces.map(workspace => (
                <button
                  key={workspace.id}
                  className="workspace-card"
                  onClick={() => handleSelectWorkspace(workspace)}
                >
                  <div className="workspace-card-header">
                    <h3>{workspace.name}</h3>
                  </div>
                  {workspace.description && (
                    <p className="workspace-description">{workspace.description}</p>
                  )}
                  <div className="workspace-card-footer">
                    <span className="member-count">
                      {workspace.members?.length || 0} member{workspace.members?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="no-workspaces">
              <p>You don't have any workspaces yet.</p>
              <p>Create one to get started.</p>
            </div>
          )}

          <div className="selector-actions">
            <button
              className="create-workspace-button"
              onClick={() => setShowCreateForm(true)}
            >
              <PlusIcon size={16} />
              Create New Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSelectorModal;
