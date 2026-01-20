import { useCallback } from 'react';
import { useOptimisticUpdates, type OptimisticAction } from './useOptimisticUpdates';
import type { BoardWithDetails, Card, List } from '../types/board';

export interface CardMoveAction extends OptimisticAction {
  type: 'MOVE_CARD';
  data: {
    cardId: string;
    sourceListId: string;
    targetListId: string;
    sourcePosition: number;
    targetPosition: number;
  };
}

export interface CardReorderAction extends OptimisticAction {
  type: 'REORDER_CARDS';
  data: {
    listId: string;
    cardIds: string[];
  };
}

export interface ListReorderAction extends OptimisticAction {
  type: 'REORDER_LISTS';
  data: {
    boardId: string;
    listIds: string[];
  };
}

export interface CardCreateAction extends OptimisticAction {
  type: 'CREATE_CARD';
  data: {
    listId: string;
    card: Card;
  };
}

export interface ListCreateAction extends OptimisticAction {
  type: 'CREATE_LIST';
  data: {
    boardId: string;
    list: List & { cards: Card[] };
  };
}

export type BoardOptimisticAction = 
  | CardMoveAction 
  | CardReorderAction 
  | ListReorderAction 
  | CardCreateAction 
  | ListCreateAction;

function applyBoardUpdate(board: BoardWithDetails, action: BoardOptimisticAction): BoardWithDetails {
  switch (action.type) {
    case 'MOVE_CARD': {
      const { cardId, sourceListId, targetListId, targetPosition } = action.data;
      
      // Find the card to move
      let cardToMove: Card | null = null;
      const newLists = board.lists.map(list => {
        if (list.id === sourceListId) {
          const cardIndex = list.cards.findIndex(card => card.id === cardId);
          if (cardIndex !== -1) {
            cardToMove = { ...list.cards[cardIndex], listId: targetListId, position: targetPosition };
            return {
              ...list,
              cards: list.cards.filter(card => card.id !== cardId)
            };
          }
        }
        return list;
      });

      if (!cardToMove) return board;

      // Add card to target list
      return {
        ...board,
        lists: newLists.map(list => {
          if (list.id === targetListId) {
            const updatedCards = [...list.cards, cardToMove!];
            return {
              ...list,
              cards: updatedCards.sort((a, b) => a.position - b.position)
            };
          }
          return list;
        })
      };
    }

    case 'REORDER_CARDS': {
      const { listId, cardIds } = action.data;
      
      return {
        ...board,
        lists: board.lists.map(list => {
          if (list.id === listId) {
            const reorderedCards = cardIds.map((cardId, index) => {
              const card = list.cards.find(c => c.id === cardId);
              return card ? { ...card, position: index } : null;
            }).filter(Boolean) as Card[];
            
            return { ...list, cards: reorderedCards };
          }
          return list;
        })
      };
    }

    case 'REORDER_LISTS': {
      const { listIds } = action.data;
      
      const reorderedLists = listIds.map((listId, index) => {
        const list = board.lists.find(l => l.id === listId);
        return list ? { ...list, position: index } : null;
      }).filter(Boolean) as (List & { cards: Card[] })[];
      
      return { ...board, lists: reorderedLists };
    }

    case 'CREATE_CARD': {
      const { listId, card } = action.data;
      
      return {
        ...board,
        lists: board.lists.map(list => {
          if (list.id === listId) {
            return {
              ...list,
              cards: [...list.cards, card].sort((a, b) => a.position - b.position)
            };
          }
          return list;
        })
      };
    }

    case 'CREATE_LIST': {
      const { list } = action.data;
      
      return {
        ...board,
        lists: [...board.lists, list].sort((a, b) => a.position - b.position)
      };
    }

    default:
      return board;
  }
}

export function useBoardOptimisticUpdates(initialBoard: BoardWithDetails | null) {
  const optimisticUpdates = useOptimisticUpdates<BoardWithDetails | null>(initialBoard);

  const applyOptimisticBoardUpdate = useCallback((action: BoardOptimisticAction) => {
    optimisticUpdates.applyOptimisticUpdate(action, (board, action) => {
      if (!board) return board;
      return applyBoardUpdate(board, action as BoardOptimisticAction);
    });
  }, [optimisticUpdates]);

  const optimisticMoveCard = useCallback((
    cardId: string,
    sourceListId: string,
    targetListId: string,
    sourcePosition: number,
    targetPosition: number
  ) => {
    const action: CardMoveAction = {
      id: `move-card-${cardId}-${Date.now()}`,
      type: 'MOVE_CARD',
      data: { cardId, sourceListId, targetListId, sourcePosition, targetPosition },
      timestamp: Date.now(),
    };
    
    applyOptimisticBoardUpdate(action);
    return action.id;
  }, [applyOptimisticBoardUpdate]);

  const optimisticReorderCards = useCallback((listId: string, cardIds: string[]) => {
    const action: CardReorderAction = {
      id: `reorder-cards-${listId}-${Date.now()}`,
      type: 'REORDER_CARDS',
      data: { listId, cardIds },
      timestamp: Date.now(),
    };
    
    applyOptimisticBoardUpdate(action);
    return action.id;
  }, [applyOptimisticBoardUpdate]);

  const optimisticReorderLists = useCallback((boardId: string, listIds: string[]) => {
    const action: ListReorderAction = {
      id: `reorder-lists-${boardId}-${Date.now()}`,
      type: 'REORDER_LISTS',
      data: { boardId, listIds },
      timestamp: Date.now(),
    };
    
    applyOptimisticBoardUpdate(action);
    return action.id;
  }, [applyOptimisticBoardUpdate]);

  const optimisticCreateCard = useCallback((listId: string, card: Card) => {
    const action: CardCreateAction = {
      id: `create-card-${card.id}-${Date.now()}`,
      type: 'CREATE_CARD',
      data: { listId, card },
      timestamp: Date.now(),
    };
    
    applyOptimisticBoardUpdate(action);
    return action.id;
  }, [applyOptimisticBoardUpdate]);

  const optimisticCreateList = useCallback((boardId: string, list: List & { cards: Card[] }) => {
    const action: ListCreateAction = {
      id: `create-list-${list.id}-${Date.now()}`,
      type: 'CREATE_LIST',
      data: { boardId, list },
      timestamp: Date.now(),
    };
    
    applyOptimisticBoardUpdate(action);
    return action.id;
  }, [applyOptimisticBoardUpdate]);

  return {
    ...optimisticUpdates,
    optimisticMoveCard,
    optimisticReorderCards,
    optimisticReorderLists,
    optimisticCreateCard,
    optimisticCreateList,
  };
}