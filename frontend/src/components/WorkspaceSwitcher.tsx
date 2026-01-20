import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { ChevronDownIcon } from './icons';
import './WorkspaceSwitcher.css';

const WorkspaceSwitcher: React.FC = () => {
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      setIsOpen(false);
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="workspace-switcher">
        <button className="switcher-button" disabled>
          No workspace selected
        </button>
      </div>
    );
  }

  return (
    <div className="workspace-switcher">
      <button
        className="switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="workspace-name">{currentWorkspace.name}</span>
        <ChevronDownIcon size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="switcher-dropdown">
            <div className="dropdown-header">
              <span className="dropdown-title">Switch Workspace</span>
            </div>
            <div className="workspace-list">
              {workspaces.map(workspace => (
                <button
                  key={workspace.id}
                  className={`workspace-option ${
                    workspace.id === currentWorkspace.id ? 'active' : ''
                  }`}
                  onClick={() => handleWorkspaceChange(workspace.id)}
                >
                  <span className="workspace-option-name">{workspace.name}</span>
                  {workspace.id === currentWorkspace.id && (
                    <span className="checkmark">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div
            className="switcher-overlay"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
