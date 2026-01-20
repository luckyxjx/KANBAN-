import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import InviteUserForm from './InviteUserForm';
import { MembersIcon, PlusIcon, LoadingIcon, CloseIcon } from './icons';
import type { WorkspaceMember } from '../types/workspace';
import './WorkspaceMembers.css';

interface WorkspaceMembersProps {
  workspaceId: string;
  onClose?: () => void;
}

const WorkspaceMembers: React.FC<WorkspaceMembersProps> = ({ 
  workspaceId, 
  onClose 
}) => {
  const { user } = useAuth();
  const { getWorkspaceMembers, currentWorkspace } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedMembers = await getWorkspaceMembers(workspaceId);
      setMembers(fetchedMembers);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workspace members';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInviteSuccess = () => {
    setShowInviteForm(false);
    loadMembers(); // Reload members after successful invitation
  };

  const currentUserMember = members.find(member => member.userId === user?.id);
  const isOwner = currentUserMember?.role === 'OWNER';

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'Owner';
      case 'MEMBER':
        return 'Member';
      default:
        return role;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'role-badge owner';
      case 'MEMBER':
        return 'role-badge member';
      default:
        return 'role-badge';
    }
  };

  if (loading) {
    return (
      <div className="workspace-members-container">
        <div className="members-header">
          <h2>Workspace Members</h2>
          {onClose && (
            <button className="close-button" onClick={onClose}>
              <CloseIcon size={20} />
            </button>
          )}
        </div>
        <div className="loading-state">
          <LoadingIcon size={32} />
          <p>Loading members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace-members-container">
        <div className="members-header">
          <h2>Workspace Members</h2>
          {onClose && (
            <button className="close-button" onClick={onClose}>
              <CloseIcon size={20} />
            </button>
          )}
        </div>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={loadMembers} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-members-container">
      <div className="members-header">
        <div className="header-info">
          <h2>Workspace Members</h2>
          {currentWorkspace && (
            <p className="workspace-name">{currentWorkspace.name}</p>
          )}
        </div>
        <div className="header-actions">
          {isOwner && (
            <button 
              onClick={() => setShowInviteForm(true)}
              className="invite-button"
            >
              <PlusIcon size={14} />
              Invite Member
            </button>
          )}
          {onClose && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      <div className="members-content">
        <div className="members-count">
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </div>

        <div className="members-list">
          {members.map((member) => (
            <div key={member.id} className="member-item">
              <div className="member-info">
                <div className="member-avatar">
                  {member.user?.avatarUrl ? (
                    <img 
                      src={member.user.avatarUrl} 
                      alt={member.user.name}
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {member.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="member-details">
                  <div className="member-name">
                    {member.user?.name || 'Unknown User'}
                    {member.userId === user?.id && (
                      <span className="you-indicator">(You)</span>
                    )}
                  </div>
                  <div className="member-email">
                    {member.user?.email || 'No email'}
                  </div>
                </div>
              </div>
              <div className="member-role">
                <span className={getRoleBadgeClass(member.role)}>
                  {getRoleDisplayName(member.role)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <MembersIcon size={48} />
            </div>
            <p>No members found in this workspace.</p>
          </div>
        )}
      </div>

      {showInviteForm && (
        <InviteUserForm
          workspaceId={workspaceId}
          onClose={() => setShowInviteForm(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
    </div>
  );
};

export default WorkspaceMembers;