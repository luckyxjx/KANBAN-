import React, { useState } from 'react';
import { useBoard } from '../contexts/BoardContext';
import { CloseIcon } from './icons';
import type { Board, CreateBoardData } from '../types/board';
import './CreateBoardForm.css';

interface CreateBoardFormProps {
  onClose: () => void;
  onSuccess: (board: Board) => void;
}

const BOARD_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Gray', value: '#6b7280' },
];

const CreateBoardForm: React.FC<CreateBoardFormProps> = ({ onClose, onSuccess }) => {
  const { createBoard } = useBoard();
  const [formData, setFormData] = useState<CreateBoardData>({
    name: '',
    description: '',
    color: BOARD_COLORS[0].value,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Board name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const board = await createBoard({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        color: formData.color,
      });
      
      console.log('Board created:', board);
      onSuccess(board);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create board';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateBoardData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Board</h2>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-board-form">
          <div className="form-group">
            <label htmlFor="board-name">Board Name *</label>
            <input
              id="board-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter board name"
              maxLength={100}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="board-description">Description</label>
            <textarea
              id="board-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter board description (optional)"
              rows={3}
              maxLength={500}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Board Color</label>
            <div className="color-picker">
              {BOARD_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`color-option ${formData.color === color.value ? 'selected' : ''}`}
                  onClick={() => handleInputChange('color', color.value)}
                  disabled={loading}
                  title={color.name}
                >
                  <span className="color-swatch" style={{ backgroundColor: color.value }}></span>
                  <span className="color-name">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardForm;