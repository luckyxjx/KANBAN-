import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from './icons';
import './CreateCardForm.css';

interface CreateCardFormProps {
  listId: string;
  onSubmit: (listId: string, title: string, description?: string) => void;
  onCancel: () => void;
}

const CreateCardForm: React.FC<CreateCardFormProps> = ({ listId, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    try {
      setLoading(true);
      onSubmit(listId, title.trim(), description.trim() || undefined);
      // Reset form after successful submission
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Error creating card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content create-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Card</h2>
          <button className="modal-close" onClick={onCancel} title="Close">
            <CloseIcon size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-card-form">
          <div className="form-group">
            <label htmlFor="card-title">
              Card Title <span className="required">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="card-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter card title"
              maxLength={200}
              disabled={loading}
              required
            />
            <small className="field-hint">
              {title.length}/200 characters
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="card-description">Description</label>
            <textarea
              id="card-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add details (optional)"
              rows={2}
              maxLength={1000}
              disabled={loading}
            />
            <small className="field-hint">
              {description.length}/1000 characters
            </small>
          </div>

          <div className="form-footer">
            <button
              type="button"
              className="button-secondary button-cancel"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary"
              disabled={!title.trim() || loading}
            >
              {loading ? 'Creating...' : 'Create Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCardForm;