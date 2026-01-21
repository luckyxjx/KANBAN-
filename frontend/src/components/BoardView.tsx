import React, { useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useBoard } from '../contexts/BoardContext';
import { useToast } from '../components/ToastContainer';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { ArrowDownIcon, PlusIcon, SettingsIcon } from './icons';
import KanbanList from './KanbanList';
import KanbanCard from './KanbanCard';
import CreateListForm from './CreateListForm';
import CreateCardForm from './CreateCardForm';
import EditCardForm from './EditCardForm';
import OptimisticUpdateErrorBoundary from './OptimisticUpdateErrorBoundary';
import type { Board, Card, UpdateCardData, UpdateListData } from '../types/board';
import './BoardView.css';

interface BoardViewProps {
  board: Board;
  onBack: () => void;
}

const BoardView: React.FC<BoardViewProps> = ({ board, onBack }) => {
  const {
    currentBoard,
    loading,
    error,
    createList,
    createCard,
    updateCard,
    deleteCard,
    updateList,
    deleteList,
    moveCard,
    reorderLists,
    reorderCards,
  } = useBoard();

  const { showSuccess, showError, showLoading, hideToast } = useToast();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);

  // Setup real-time synchronization
  // Requirement 5.4: Implement real-time synchronization with local state
  useRealtimeSync();

  // Configure drag sensors with better sensitivity
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced distance for more responsive dragging
      },
    })
  );

  // Get sorted lists and cards
  const sortedLists = currentBoard?.lists?.sort((a, b) => a.position - b.position) || [];
  const listIds = sortedLists.map(list => list.id);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Find the dragged card for overlay
    if (active.data.current?.type === 'card') {
      const card = active.data.current.card as Card;
      setDraggedCard(card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const overId = over.id as string;

    // Only handle card drag over
    if (active.data.current?.type !== 'card') return;

    const activeCard = active.data.current.card as Card;
    const activeListId = activeCard.listId;

    // Determine the target list
    let targetListId: string;
    
    if (over.data.current?.type === 'list') {
      targetListId = overId;
    } else if (over.data.current?.type === 'card') {
      const overCard = over.data.current.card as Card;
      targetListId = overCard.listId;
    } else {
      return;
    }

    // If moving to a different list, handle the move
    if (activeListId !== targetListId) {
      // This is handled optimistically in the drag end event
      // We don't update state here to avoid flickering
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedCard(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let toastId: string | null = null;

    try {
      if (active.data.current?.type === 'card') {
        const activeCard = active.data.current.card as Card;
        const activeListId = activeCard.listId;

        // Determine target list and position
        let targetListId: string;
        let targetPosition: number;

        if (over.data.current?.type === 'list') {
          // Dropped on empty list
          targetListId = overId;
          const targetList = sortedLists.find(list => list.id === targetListId);
          targetPosition = targetList?.cards?.length || 0;
        } else if (over.data.current?.type === 'card') {
          // Dropped on another card
          const overCard = over.data.current.card as Card;
          targetListId = overCard.listId;
          targetPosition = overCard.position;
        } else {
          return;
        }

        if (activeListId === targetListId) {
          // Reordering within the same list
          const list = sortedLists.find(l => l.id === activeListId);
          if (list && list.cards) {
            const sortedCards = [...list.cards].sort((a, b) => a.position - b.position);
            const activeIndex = sortedCards.findIndex(card => card.id === activeId);
            const overIndex = sortedCards.findIndex(card => card.id === overId);

            if (activeIndex !== overIndex) {
              const reorderedCards = [...sortedCards];
              const [movedCard] = reorderedCards.splice(activeIndex, 1);
              reorderedCards.splice(overIndex, 0, movedCard);

              const cardIds = reorderedCards.map(card => card.id);
              
              toastId = showLoading('Reordering cards...', 'Your changes are being saved');
              await reorderCards(activeListId, cardIds);
              
              if (toastId) {
                hideToast(toastId);
                showSuccess('Cards reordered', 'Your changes have been saved');
              }
            }
          }
        } else {
          // Moving to a different list
          toastId = showLoading('Moving card...', 'Your changes are being saved');
          
          await moveCard(activeId, {
            targetListId,
            position: targetPosition,
          });
          
          if (toastId) {
            hideToast(toastId);
            showSuccess('Card moved', 'Your changes have been saved');
          }
        }
      } else if (active.data.current?.type === 'list' && over.data.current?.type === 'list') {
        // Reordering lists
        const activeIndex = sortedLists.findIndex(list => list.id === activeId);
        const overIndex = sortedLists.findIndex(list => list.id === overId);

        if (activeIndex !== overIndex) {
          const reorderedLists = [...sortedLists];
          const [movedList] = reorderedLists.splice(activeIndex, 1);
          reorderedLists.splice(overIndex, 0, movedList);

          const listIds = reorderedLists.map(list => list.id);
          
          toastId = showLoading('Reordering lists...', 'Your changes are being saved');
          await reorderLists(board.id, listIds);
          
          if (toastId) {
            hideToast(toastId);
            showSuccess('Lists reordered', 'Your changes have been saved');
          }
        }
      }
    } catch (error) {
      console.error('Error handling drag end:', error);
      
      if (toastId) {
        hideToast(toastId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
      showError('Update failed', errorMessage);
    }
  };

  const handleCreateList = async (name: string) => {
    let toastId: string | null = null;
    
    try {
      const position = sortedLists.length;
      toastId = showLoading('Creating list...', 'Your new list is being created');
      
      await createList(board.id, { name, position });
      
      if (toastId) {
        hideToast(toastId);
        showSuccess('List created', `"${name}" has been added to your board`);
      }
      
      setShowCreateList(false);
    } catch (error) {
      console.error('Error creating list:', error);
      
      if (toastId) {
        hideToast(toastId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create list';
      showError('Creation failed', errorMessage);
    }
  };

  const handleCreateCard = async (listId: string, title: string, description?: string) => {
    let toastId: string | null = null;
    
    try {
      const list = sortedLists.find(l => l.id === listId);
      const position = list?.cards?.length || 0;
      
      toastId = showLoading('Creating card...', 'Your new card is being created');
      
      await createCard(listId, { title, description, position });
      
      if (toastId) {
        hideToast(toastId);
        showSuccess('Card created', `"${title}" has been added to your list`);
      }
      
      setShowCreateCard(null);
    } catch (error) {
      console.error('Error creating card:', error);
      
      if (toastId) {
        hideToast(toastId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create card';
      showError('Creation failed', errorMessage);
    }
  };

  const handleEditCard = async (cardId: string, updates: UpdateCardData) => {
    let toastId: string | null = null;
    
    try {
      toastId = showLoading('Updating card...', 'Your changes are being saved');
      
      await updateCard(cardId, updates);
      
      if (toastId) {
        hideToast(toastId);
        showSuccess('Card updated', 'Your changes have been saved');
      }
      
      setEditingCard(null);
    } catch (error) {
      console.error('Error updating card:', error);
      
      if (toastId) {
        hideToast(toastId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update card';
      showError('Update failed', errorMessage);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    let toastId: string | null = null;
    
    try {
      toastId = showLoading('Deleting card...', 'Your card is being removed');
      
      await deleteCard(cardId);
      
      if (toastId) {
        hideToast(toastId);
        showSuccess('Card deleted', 'The card has been removed');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      
      if (toastId) {
        hideToast(toastId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete card';
      showError('Delete failed', errorMessage);
    }
  };

  const handleUpdateList = async (listId: string, updates: UpdateListData) => {
    let toastId: string | null = null;
    
    try {
      toastId = showLoading('Updating list...', 'Your changes are being saved');
      
      await updateList(listId, updates);
      
      if (toastId) {
        hideToast(toastId);
        showSuccess('List updated', 'Your changes have been saved');
      }
    } catch (error) {
      console.error('Error updating list:', error);
      
      if (toastId) {
        hideToast(toastId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update list';
      showError('Update failed', errorMessage);
    }
  };

  const handleDeleteList = async (listId: string) => {
    let toastId: string | null = null;
    
    try {
      toastId = showLoading('Deleting list...', 'Your list is being removed');
      
      await deleteList(listId);
      
      if (toastId) {
        hideToast(toastId);
        showSuccess('List deleted', 'The list has been removed');
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      
      if (toastId) {
        hideToast(toastId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete list';
      showError('Delete failed', errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="board-view-container">
        <div className="board-view-loading">
          <p>Loading board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="board-view-container">
        <div className="board-view-error">
          <p>Error loading board: {error}</p>
          <button onClick={onBack} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="board-view-container">
        <div className="board-view-error">
          <p>Board not found</p>
          <button onClick={onBack} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <OptimisticUpdateErrorBoundary>
      <div className="board-view-container">
        <div className="board-header">
          <div className="board-header-left">
            <button onClick={onBack} className="back-button">
              <ArrowDownIcon size={16} />
              Back to Boards
            </button>
            <div className="board-title-section">
              <h1 className="board-title" style={{ borderLeftColor: currentBoard.color }}>
                {currentBoard.name}
              </h1>
              {currentBoard.description && (
                <p className="board-description">{currentBoard.description}</p>
              )}
            </div>
          </div>
          <div className="board-header-right">
            <button className="board-settings-button">
              <SettingsIcon size={20} />
              Settings
            </button>
          </div>
        </div>

        <div className="board-content">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="lists-container">
              <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
                {sortedLists.map((list) => (
                  <KanbanList
                    key={list.id}
                    list={list}
                    onCreateCard={() => setShowCreateCard(list.id)}
                    onEditCard={setEditingCard}
                    onUpdateList={handleUpdateList}
                    onDeleteList={handleDeleteList}
                    editingCardId={editingCard?.id}
                  />
                ))}
              </SortableContext>

              <div className="create-list-container">
                {showCreateList ? (
                  <CreateListForm
                    onSubmit={handleCreateList}
                    onCancel={() => setShowCreateList(false)}
                  />
                ) : (
                  <button
                    className="create-list-button"
                    onClick={() => setShowCreateList(true)}
                  >
                    <PlusIcon size={16} />
                    Add a list
                  </button>
                )}
              </div>
            </div>

            <DragOverlay>
              {activeId && draggedCard ? (
                <KanbanCard card={draggedCard} isDragging />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {showCreateCard && (
          <CreateCardForm
            listId={showCreateCard}
            onSubmit={handleCreateCard}
            onCancel={() => setShowCreateCard(null)}
          />
        )}

        {editingCard && (
          <EditCardForm
            card={editingCard}
            onSubmit={handleEditCard}
            onCancel={() => setEditingCard(null)}
            onDelete={handleDeleteCard}
          />
        )}
      </div>
    </OptimisticUpdateErrorBoundary>
  );
};

export default BoardView;