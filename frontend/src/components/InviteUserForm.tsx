import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { CloseIcon } from './icons';
import type { InviteUserData } from '../types/workspace';
import './InviteUserForm.css';

interface InviteUserFormProps {
  workspaceId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const InviteUserForm: React.FC<InviteUserFormProps> = ({ 
  workspaceId, 
  onClose, 
  onSuccess 
}) => {
  const { inviteUser, loading } = useWorkspace();
  const [formData, setFormData] = useState<InviteUserData>({
    email: '',
    role: 'MEMBER',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await inviteUser(workspaceId, {
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
      });
      
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to invite user';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof InviteUserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="invite-user-overlay">
      <div className="invite-user-modal">
        <div className="modal-header">
          <h2>Invite User to Workspace</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="invite-user-form">
          <div className="form-group">
            <label htmlFor="user-email" className="form-label">
              Email Address *
            </label>
            <input
              id="user-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Enter user's email address"
              disabled={isSubmitting}
              autoFocus
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="user-role" className="form-label">
              Role
            </label>
            <select
              id="user-role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as 'MEMBER')}
              className="form-select"
              disabled={isSubmitting}
            >
              <option value="MEMBER">Member</option>
            </select>
            <div className="role-description">
              <small>Members can view and edit boards within this workspace.</small>
            </div>
          </div>

          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUserForm;