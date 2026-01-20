import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, SettingsIcon } from './icons';
import type { List, UpdateListData } from '../types/board';
import './ListSettingsMenu.css';

interface ListSettingsMenuProps {
  list: List;
  onUpdate: (listId: string, updates: UpdateListData) => void;
  onDelete: (listId: string) => void;
  onClose: () => void;
}

const ListSettingsMenu: React.FC<ListSettingsMenuProps> = ({ 
  list, 
  onUpdate, 
  onDelete, 
  onClose 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSave = async () => {
    if (!name.trim() || name.trim() === list.name) {
      setIsEditing(false);
      setName(list.name);
      return;
    }

    try {
      setLoading(true);
      await onUpdate(list.id, { name: name.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating list:', error);
      setName(list.name);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${list.name}"? This will also delete all cards in this list.`)) {
      try {
        setLoading(true);
        await onDelete(list.id);
        onClose();
      } catch (error) {
        console.error('Error deleting list:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setName(list.name);
    }
  };

  return (
    <div className="list-settings-menu" ref={menuRef}>
      <div className="list-settings-header">
        <SettingsIcon size={16} />
        <span>List Actions</span>
        <button className="close-button" onClick={onClose}>
          <CloseIcon size={14} />
        </button>
      </div>

      <div className="list-settings-content">
        {isEditing ? (
          <div className="edit-name-section">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              disabled={loading}
              maxLength={100}
              className="name-input"
            />
          </div>
        ) : (
          <button
            className="menu-item"
            onClick={() => setIsEditing(true)}
            disabled={loading}
          >
            Rename List
          </button>
        )}

        <button
          className="menu-item menu-item-danger"
          onClick={handleDelete}
          disabled={loading}
        >
          Delete List
        </button>
      </div>
    </div>
  );
};

export default ListSettingsMenu;