import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { WorkspaceIcon, ArrowDownIcon, CheckIcon } from './icons';
import type { Workspace } from '../types/workspace';
import './WorkspaceSwitcher.css';

const WorkspaceSwitcher: React.FC = () => {
  const { currentWorkspace, workspaces, setCurrentWorkspace, loading } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="workspace-switcher loading">
        <span>Loading workspaces...</span>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="workspace-switcher empty">
        <span>No workspaces available</span>
      </div>
    );
  }

  if (workspaces.length === 1) {
    return (
      <div className="workspace-switcher single">
        <div className="workspace-display">
          <WorkspaceIcon size={16} />
          <span className="workspace-name">{workspaces[0].name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-switcher">
      <button 
        className="workspace-selector"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="workspace-display">
          <WorkspaceIcon size={16} />
          <span className="workspace-name">
            {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
          </span>
          <ArrowDownIcon size={12} className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="workspace-dropdown" role="listbox">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              className={`workspace-option ${
                currentWorkspace?.id === workspace.id ? 'selected' : ''
              }`}
              onClick={() => handleWorkspaceSelect(workspace)}
              role="option"
              aria-selected={currentWorkspace?.id === workspace.id}
            >
              <WorkspaceIcon size={16} />
              <div className="workspace-info">
                <span className="workspace-name">{workspace.name}</span>
                {workspace.description && (
                  <span className="workspace-description">{workspace.description}</span>
                )}
              </div>
              {currentWorkspace?.id === workspace.id && (
                <CheckIcon size={16} className="selected-indicator" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="workspace-dropdown-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default WorkspaceSwitcher;