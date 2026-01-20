import React, { useState, useRef, useEffect } from 'react';
import { CheckIcon, CloseIcon } from './icons';
import './CreateListForm.css';

interface CreateListFormProps {
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

const CreateListForm: React.FC<CreateListFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    try {
      setLoading(true);
      await onSubmit(name.trim());
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="create-list-form">
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter list title..."
          maxLength={100}
          disabled={loading}
          className="list-name-input"
        />
        
        <div className="form-actions">
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="submit-button"
          >
            <CheckIcon size={16} />
            {loading ? 'Adding...' : 'Add List'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="cancel-button"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateListForm;