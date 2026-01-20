import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from './icons';
import type { Card, UpdateCardData } from '../types/board';
import './EditCardForm.css';

interface EditCardFormProps {
  card: Card;
  onSubmit: (cardId: string, updates: UpdateCardData) => void;
  onCancel: () => void;
  onDelete?: (cardId: string) => void;
}

const EditCardForm: React.FC<EditCardFormProps> = ({ card, onSubmit, onCancel, onDelete }) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [loading, setLoading] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    setLoading(true);
    onSubmit(card.id, {
      title: title.trim(),
      description: description.trim() || undefined,
    });
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this card?')) {
      setLoading(true);
      onDelete(card.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      // Ctrl+Enter or Cmd+Enter to save
      handleSubmit(e as any);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content edit-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Card</h2>
          <button className="modal-close" onClick={onCancel} title="Close">
            <CloseIcon size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-card-form">
          <div className="form-group">
            <label htmlFor="card-title">Title *</label>
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="card-description">Description</label>
            <textarea
              id="card-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter card description (optional)"
              rows={4}
              maxLength={1000}
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            {onDelete && (
              <button
                type="button"
                className="button-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete Card
              </button>
            )}
            <div className="form-actions-right">
              <button
                type="button"
                className="button-secondary"
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
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCardForm;