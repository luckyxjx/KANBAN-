import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { CloseIcon } from './icons';
import type { CreateWorkspaceData } from '../types/workspace';
import './CreateWorkspaceForm.css';

interface CreateWorkspaceFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateWorkspaceForm: React.FC<CreateWorkspaceFormProps> = ({ onClose, onSuccess }) => {
  const { createWorkspace, loading } = useWorkspace();
  const [formData, setFormData] = useState<CreateWorkspaceData>({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Workspace name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Workspace name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Workspace name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await createWorkspace({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
      });
      
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create workspace';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateWorkspaceData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="create-workspace-overlay">
      <div className="create-workspace-modal">
        <div className="modal-header">
          <h2>Create New Workspace</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-workspace-form">
          <div className="form-group">
            <label htmlFor="workspace-name" className="form-label">
              Workspace Name *
            </label>
            <input
              id="workspace-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Enter workspace name"
              maxLength={50}
              disabled={isSubmitting}
              autoFocus
            />
            {errors.name && (
              <span className="error-message">{errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="workspace-description" className="form-label">
              Description (Optional)
            </label>
            <textarea
              id="workspace-description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              placeholder="Describe your workspace"
              maxLength={200}
              rows={3}
              disabled={isSubmitting}
            />
            {errors.description && (
              <span className="error-message">{errors.description}</span>
            )}
            <div className="character-count">
              {(formData.description || '').length}/200
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
              {isSubmitting ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceForm;