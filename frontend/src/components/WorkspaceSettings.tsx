import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import WorkspaceMembers from './WorkspaceMembers';
import InviteUserForm from './InviteUserForm';
import { SettingsIcon, MembersIcon, CloseIcon } from './icons';
import './WorkspaceSettings.css';

interface WorkspaceSettingsProps {
  onClose: () => void;
}

const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
  const [showInviteForm, setShowInviteForm] = useState(false);

  if (!currentWorkspace) {
    return (
      <div className="workspace-settings-overlay">
        <div className="workspace-settings-modal">
          <div className="modal-header">
            <h2>Workspace Settings</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="error-state">
            <p>No workspace selected</p>
          </div>
        </div>
      </div>
    );
  }

  const currentUserMember = currentWorkspace.members?.find(
    member => member.userId === user?.id
  );
  const isOwner = currentUserMember?.role === 'OWNER';

  return (
    <div className="workspace-settings-overlay">
      <div className="workspace-settings-modal">
        <div className="modal-header">
          <h2>Workspace Settings</h2>
          <button className="close-button" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <SettingsIcon size={16} />
            General
          </button>
          <button
            className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <MembersIcon size={16} />
            Members
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="general-settings">
              <div className="setting-section">
                <h3>Workspace Information</h3>
                <div className="workspace-info">
                  <div className="info-item">
                    <label>Name</label>
                    <div className="info-value">{currentWorkspace.name}</div>
                  </div>
                  {currentWorkspace.description && (
                    <div className="info-item">
                      <label>Description</label>
                      <div className="info-value">{currentWorkspace.description}</div>
                    </div>
                  )}
                  <div className="info-item">
                    <label>Created</label>
                    <div className="info-value">
                      {new Date(currentWorkspace.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="setting-section">
                <h3>Your Role</h3>
                <div className="role-info">
                  <span className={`role-badge ${isOwner ? 'owner' : 'member'}`}>
                    {isOwner ? 'Owner' : 'Member'}
                  </span>
                  <p className="role-description">
                    {isOwner 
                      ? 'You have full access to manage this workspace, including inviting members and managing settings.'
                      : 'You can view and edit boards within this workspace.'
                    }
                  </p>
                </div>
              </div>

              {isOwner && (
                <div className="setting-section">
                  <h3>Workspace Actions</h3>
                  <div className="action-buttons">
                    <button 
                      className="action-button secondary"
                      onClick={() => {
                        setActiveTab('members');
                        setShowInviteForm(true);
                      }}
                    >
                      <MembersIcon size={16} />
                      Invite Members
                    </button>
                    <button className="action-button secondary" disabled>
                      ✏️ Edit Workspace (Coming Soon)
                    </button>
                    <button className="action-button danger" disabled>
                      🗑️ Delete Workspace (Coming Soon)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="members-settings">
              <WorkspaceMembers 
                workspaceId={currentWorkspace.id}
              />
            </div>
          )}
        </div>

        {showInviteForm && (
          <InviteUserForm
            workspaceId={currentWorkspace.id}
            onClose={() => setShowInviteForm(false)}
            onSuccess={() => setShowInviteForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default WorkspaceSettings;