import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PenIcon } from './icons';
import type { Card } from '../types/board';
import './KanbanCard.css';

interface KanbanCardProps {
  card: Card;
  isDragging?: boolean;
  isEditing?: boolean;
  onEdit?: () => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ card, isDragging = false, isEditing = false, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBeingDragged = isDragging || isSortableDragging;

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger edit if not dragging and onEdit is provided
    if (!isBeingDragged && onEdit && e.detail === 2) { // Double click
      e.stopPropagation();
      onEdit();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isBeingDragged ? 'dragging' : ''} ${onEdit ? 'editable' : ''} ${isEditing ? 'editing' : ''}`}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <div className="card-content">
        <h4 className="card-title">{card.title}</h4>
        {card.description && (
          <p className="card-description">{card.description}</p>
        )}
      </div>
      
      <div className="card-footer">
        <div className="card-meta">
          <span className="card-date">
            {new Date(card.updatedAt).toLocaleDateString()}
          </span>
        </div>
        {onEdit && (
          <div className="card-actions">
            <button 
              className="card-action-button edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit card"
            >
              <PenIcon size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;