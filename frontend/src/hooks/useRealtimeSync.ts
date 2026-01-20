import { useEffect } from 'react';
import { useWebSocket, type CardEvent, type ListEvent, type BoardEvent } from '../contexts/WebSocketContext';
import { useBoard } from '../contexts/BoardContext';
import { useDemoData } from '../contexts/DemoDataProvider';

/**
 * Hook for real-time synchronization with server updates
 * Requirement 5.3: Broadcast changes to all workspace members
 * Requirement 5.4: Implement real-time synchronization with local state
 */
export const useRealtimeSync = () => {
  const { onCardEvent, offCardEvent, onListEvent, offListEvent, onBoardEvent, offBoardEvent } = useWebSocket();
  const { currentBoard, setCurrentBoard } = useBoard();
  const { demoMode } = useDemoData();

  useEffect(() => {
    // Skip in demo mode
    if (demoMode || !currentBoard) {
      return;
    }

    /**
     * Handle card events from server
     * Requirement 5.3: Broadcast changes to all workspace members
     */
    const handleCardEvent = (event: CardEvent) => {
      console.log('Handling card event:', event);

      if (!currentBoard) return;

      // Update the board state based on the event type
      switch (event.type) {
        case 'card.created':
        case 'card.updated':
        case 'card.moved': {
          // Find the list and update the card
          const updatedLists = currentBoard.lists.map((list) => {
            // If this is the target list, add/update the card
            if (list.id === event.data.listId) {
              const cardExists = list.cards.some((c) => c.id === event.data.id);
              if (cardExists) {
                // Update existing card
                return {
                  ...list,
                  cards: list.cards.map((c) =>
                    c.id === event.data.id ? { ...c, ...event.data } : c
                  ),
                };
              } else {
                // Add new card
                return {
                  ...list,
                  cards: [...list.cards, event.data],
                };
              }
            }

            // If this is the source list and card was moved, remove it
            if (event.type === 'card.moved' && list.cards.some((c) => c.id === event.data.id)) {
              return {
                ...list,
                cards: list.cards.filter((c) => c.id !== event.data.id),
              };
            }

            return list;
          });

          setCurrentBoard({
            ...currentBoard,
            lists: updatedLists,
          });
          break;
        }

        case 'card.deleted': {
          // Remove the card from all lists
          const updatedLists = currentBoard.lists.map((list) => ({
            ...list,
            cards: list.cards.filter((c) => c.id !== event.data.id),
          }));

          setCurrentBoard({
            ...currentBoard,
            lists: updatedLists,
          });
          break;
        }
      }
    };

    /**
     * Handle list events from server
     */
    const handleListEvent = (event: ListEvent) => {
      console.log('Handling list event:', event);

      if (!currentBoard) return;

      switch (event.type) {
        case 'list.created': {
          // Add new list
          setCurrentBoard({
            ...currentBoard,
            lists: [...currentBoard.lists, { ...event.data, cards: [] }],
          });
          break;
        }

        case 'list.updated': {
          // Update existing list
          const updatedLists = currentBoard.lists.map((list) =>
            list.id === event.data.id ? { ...list, ...event.data } : list
          );

          setCurrentBoard({
            ...currentBoard,
            lists: updatedLists,
          });
          break;
        }

        case 'list.reordered': {
          // Reorder lists based on the provided order
          if (event.data.listIds && Array.isArray(event.data.listIds)) {
            const listMap = new Map(currentBoard.lists.map((l) => [l.id, l]));
            const reorderedLists = event.data.listIds
              .map((id: string) => listMap.get(id))
              .filter((list: any) => list !== undefined);

            setCurrentBoard({
              ...currentBoard,
              lists: reorderedLists,
            });
          }
          break;
        }

        case 'list.deleted': {
          // Remove the list
          const updatedLists = currentBoard.lists.filter((list) => list.id !== event.data.id);

          setCurrentBoard({
            ...currentBoard,
            lists: updatedLists,
          });
          break;
        }
      }
    };

    /**
     * Handle board events from server
     */
    const handleBoardEvent = (event: BoardEvent) => {
      console.log('Handling board event:', event);

      if (!currentBoard) return;

      switch (event.type) {
        case 'board.updated': {
          // Update board metadata
          setCurrentBoard({
            ...currentBoard,
            ...event.data,
          });
          break;
        }

        case 'board.deleted': {
          // Board was deleted, clear current board
          setCurrentBoard(null);
          break;
        }
      }
    };

    // Register event handlers
    onCardEvent(handleCardEvent);
    onListEvent(handleListEvent);
    onBoardEvent(handleBoardEvent);

    // Cleanup handlers on unmount
    return () => {
      offCardEvent(handleCardEvent);
      offListEvent(handleListEvent);
      offBoardEvent(handleBoardEvent);
    };
  }, [currentBoard, demoMode, onCardEvent, offCardEvent, onListEvent, offListEvent, onBoardEvent, offBoardEvent, setCurrentBoard]);
};
