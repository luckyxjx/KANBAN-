import React, { useState } from 'react';
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SettingsIcon } from './icons';
import KanbanCard from './KanbanCard';
import ListSettingsMenu from './ListSettingsMenu';
import type { List, Card, UpdateListData } from '../types/board';
import './KanbanList.css';

interface KanbanListProps {
  list: List & { cards?: Card[] };
  onCreateCard: () => void;
  onEditCard: (card: Card) => void;
  onUpdateList: (listId: string, updates: UpdateListData) => void;
  onDeleteList: (listId: string) => void;
  editingCardId?: string;
}

const KanbanList: React.FC<KanbanListProps> = ({ 
  list, 
  onCreateCard, 
  onEditCard,
  onUpdateList,
  onDeleteList,
  editingCardId
}) => {
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sortedCards = list.cards?.sort((a, b) => a.position - b.position) || [];
  const cardIds = sortedCards.map(card => card.id);

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSettings(!showSettings);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Only trigger if double-clicking on the cards container or empty space
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('cards-container')) {
      e.preventDefault();
      e.stopPropagation();
      onCreateCard();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-list ${isDragging ? 'dragging' : ''}`}
    >
      <div className="list-header" {...attributes} {...listeners}>
        <div className="list-title-section">
          <h3 className="list-title">{list.name}</h3>
          <span className="list-count">{sortedCards.length}</span>
        </div>
        <div className="list-header-actions">
          <button 
            className="list-menu-button"
            onClick={handleSettingsClick}
          >
            <SettingsIcon size={16} />
          </button>
          
          {showSettings && (
            <ListSettingsMenu
              list={list}
              onUpdate={onUpdateList}
              onDelete={onDeleteList}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>
      </div>

      <div className="list-content" onDoubleClick={handleDoubleClick}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="cards-container" onDoubleClick={handleDoubleClick}>
            {sortedCards.map((card) => (
              <KanbanCard 
                key={card.id} 
                card={card} 
                onEdit={() => onEditCard(card)}
                isEditing={editingCardId === card.id}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanList;