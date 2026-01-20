import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { useDemoData } from './DemoDataProvider';
import { BoardService } from '../services/boardService';
import { useBoardOptimisticUpdates } from '../hooks/useBoardOptimisticUpdates';
import type { 
  Board, 
  List, 
  Card, 
  CreateBoardData, 
  CreateListData, 
  CreateCardData,
  UpdateBoardData,
  UpdateListData,
  UpdateCardData,
  MoveCardData,
  BoardWithDetails
} from '../types/board';

interface BoardContextType {
  // State
  boards: Board[];
  currentBoard: BoardWithDetails | null;
  loading: boolean;
  error: string | null;

  // Board operations
  loadBoards: () => Promise<void>;
  loadBoard: (boardId: string) => Promise<void>;
  createBoard: (data: CreateBoardData) => Promise<Board>;
  updateBoard: (boardId: string, data: UpdateBoardData) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  setCurrentBoard: (board: BoardWithDetails | null) => void;

  // List operations
  createList: (boardId: string, data: CreateListData) => Promise<void>;
  updateList: (listId: string, data: UpdateListData) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  reorderLists: (boardId: string, listIds: string[]) => Promise<void>;

  // Card operations
  createCard: (listId: string, data: CreateCardData) => Promise<void>;
  updateCard: (cardId: string, data: UpdateCardData) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  moveCard: (cardId: string, data: MoveCardData) => Promise<void>;
  reorderCards: (listId: string, cardIds: string[]) => Promise<void>;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

interface BoardProviderProps {
  children: ReactNode;
}

export const BoardProvider: React.FC<BoardProviderProps> = ({ children }) => {
  const { currentWorkspace } = useWorkspace();
  const { demoMode, demoBoards, addDemoBoard, updateDemoBoard, deleteDemoBoard } = useDemoData();
  
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoardState, setCurrentBoardState] = useState<BoardWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use optimistic updates for the current board
  const optimisticBoard = useBoardOptimisticUpdates(currentBoardState);

  const setCurrentBoard = (board: BoardWithDetails | null) => {
    setCurrentBoardState(board);
    optimisticBoard.updateOriginalState(board);
  };

  const loadBoards = async (): Promise<void> => {
    if (!currentWorkspace) return;

    try {
      setLoading(true);
      setError(null);

      let fetchedBoards: Board[];
      
      if (demoMode) {
        fetchedBoards = demoBoards.filter(board => board.workspaceId === currentWorkspace.id);
      } else {
        fetchedBoards = await BoardService.getBoards(currentWorkspace.id);
      }

      setBoards(fetchedBoards);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load boards';
      setError(errorMessage);
      console.error('Error loading boards:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBoard = async (boardId: string): Promise<void> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    console.log('Loading board:', boardId, 'in workspace:', currentWorkspace.id);

    try {
      setLoading(true);
      setError(null);

      let boardWithDetails: BoardWithDetails;
      
      if (demoMode) {
        // In demo mode, find the board and simulate full data
        // First check if the board is in the local boards state (just created)
        let board = demoBoards.find(b => b.id === boardId);
        
        // If not found in demoBoards, check the local boards state
        if (!board) {
          board = boards.find(b => b.id === boardId);
        }
        
        if (!board) {
          throw new Error('Board not found');
        }
        
        // Create demo lists and cards
        boardWithDetails = {
          ...board,
          lists: [
            {
              id: `demo-list-1-${boardId}`,
              boardId: boardId,
              workspaceId: board.workspaceId,
              name: 'To Do',
              position: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              cards: [
                {
                  id: `demo-card-1-${boardId}`,
                  listId: `demo-list-1-${boardId}`,
                  workspaceId: board.workspaceId,
                  title: 'Sample Task 1',
                  description: 'This is a sample task',
                  position: 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
                {
                  id: `demo-card-2-${boardId}`,
                  listId: `demo-list-1-${boardId}`,
                  workspaceId: board.workspaceId,
                  title: 'Sample Task 2',
                  description: 'Another sample task',
                  position: 1,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }
              ]
            },
            {
              id: `demo-list-2-${boardId}`,
              boardId: boardId,
              workspaceId: board.workspaceId,
              name: 'In Progress',
              position: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              cards: [
                {
                  id: `demo-card-3-${boardId}`,
                  listId: `demo-list-2-${boardId}`,
                  workspaceId: board.workspaceId,
                  title: 'Sample Task 3',
                  description: 'Task in progress',
                  position: 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }
              ]
            },
            {
              id: `demo-list-3-${boardId}`,
              boardId: boardId,
              workspaceId: board.workspaceId,
              name: 'Done',
              position: 2,
              createdAt: new Date(),
              updatedAt: new Date(),
              cards: []
            }
          ]
        };
      } else {
        boardWithDetails = await BoardService.getBoard(boardId, currentWorkspace.id);
      }

      setCurrentBoard(boardWithDetails);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load board';
      setError(errorMessage);
      console.error('Error loading board:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (data: CreateBoardData): Promise<Board> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    try {
      setError(null);

      let newBoard: Board;
      
      if (demoMode) {
        newBoard = {
          id: `demo-board-${Date.now()}`,
          workspaceId: currentWorkspace.id,
          name: data.name,
          description: data.description,
          color: data.color,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addDemoBoard(newBoard);
      } else {
        newBoard = await BoardService.createBoard(currentWorkspace.id, data);
      }

      setBoards(prev => [...prev, newBoard]);
      return newBoard;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create board';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateBoard = async (boardId: string, data: UpdateBoardData): Promise<void> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    try {
      setError(null);

      if (demoMode) {
        const updatedBoard = { ...data, updatedAt: new Date() };
        updateDemoBoard(boardId, updatedBoard);
      } else {
        await BoardService.updateBoard(boardId, currentWorkspace.id, data);
      }

      // Update local state
      setBoards(prev => prev.map(board => 
        board.id === boardId ? { ...board, ...data, updatedAt: new Date() } : board
      ));

      if (currentBoardState && currentBoardState.id === boardId) {
        setCurrentBoard({ ...currentBoardState, ...data, updatedAt: new Date() });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update board';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteBoard = async (boardId: string): Promise<void> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    try {
      setError(null);

      if (demoMode) {
        deleteDemoBoard(boardId);
      } else {
        await BoardService.deleteBoard(boardId, currentWorkspace.id);
      }

      setBoards(prev => prev.filter(board => board.id !== boardId));
      
      if (currentBoardState && currentBoardState.id === boardId) {
        setCurrentBoard(null);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete board';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // List operations (simplified for demo mode)
  const createList = async (boardId: string, data: CreateListData): Promise<void> => {
    const currentBoard = optimisticBoard.currentState;
    if (!currentBoard) return;

    // Create a temporary list for optimistic update
    const tempList: List & { cards: Card[] } = {
      id: `temp-list-${Date.now()}`,
      boardId: boardId,
      workspaceId: currentBoard.workspaceId,
      name: data.name,
      position: data.position,
      createdAt: new Date(),
      updatedAt: new Date(),
      cards: []
    };

    // Apply optimistic update
    const optimisticActionId = optimisticBoard.optimisticCreateList(boardId, tempList);

    try {
      setError(null);

      if (demoMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // In demo mode, create a proper list with a better ID
        // Confirm the optimistic update
        optimisticBoard.confirmOptimisticUpdate(optimisticActionId);
      } else {
        // Make API call
        await BoardService.createList(boardId, currentBoard.workspaceId, data);
        
        // Confirm the optimistic update
        optimisticBoard.confirmOptimisticUpdate(optimisticActionId);
        
        // Reload the board to get the updated state
        await loadBoard(boardId);
      }
    } catch (err: unknown) {
      // Rollback the optimistic update on error
      optimisticBoard.rollbackOptimisticUpdate(optimisticActionId);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to create list';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateList = async (listId: string, data: UpdateListData): Promise<void> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    try {
      setError(null);

      if (demoMode) {
        const currentBoard = optimisticBoard.currentState;
        if (currentBoard) {
          setCurrentBoard({
            ...currentBoard,
            lists: currentBoard.lists.map(list =>
              list.id === listId ? { ...list, ...data, updatedAt: new Date() } : list
            )
          });
        }
      } else {
        await BoardService.updateList(listId, currentWorkspace.id, data);
        const currentBoard = optimisticBoard.currentState;
        if (currentBoard) {
          await loadBoard(currentBoard.id);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update list';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteList = async (listId: string): Promise<void> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    try {
      setError(null);

      if (demoMode) {
        const currentBoard = optimisticBoard.currentState;
        if (currentBoard) {
          setCurrentBoard({
            ...currentBoard,
            lists: currentBoard.lists.filter(list => list.id !== listId)
          });
        }
      } else {
        await BoardService.deleteList(listId, currentWorkspace.id);
        const currentBoard = optimisticBoard.currentState;
        if (currentBoard) {
          await loadBoard(currentBoard.id);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete list';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const reorderLists = async (boardId: string, listIds: string[]): Promise<void> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    // Apply optimistic update
    const optimisticActionId = optimisticBoard.optimisticReorderLists(boardId, listIds);

    try {
      setError(null);

      if (demoMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Confirm the optimistic update
        optimisticBoard.confirmOptimisticUpdate(optimisticActionId);
      } else {
        // Make API call
        await BoardService.reorderLists(boardId, currentWorkspace.id, listIds);
        
        // Confirm the optimistic update
        optimisticBoard.confirmOptimisticUpdate(optimisticActionId);
        
        // Optionally reload the board to get the server state
        await loadBoard(boardId);
      }
    } catch (err: unknown) {
      // Rollback the optimistic update on error
      optimisticBoard.rollbackOptimisticUpdate(optimisticActionId);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder lists';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Card operations (simplified for demo mode)
  const createCard = async (listId: string, data: CreateCardData): Promise<void> => {
    const currentBoard = optimisticBoard.currentState;
    if (!currentBoard) return;

    // Create a temporary card for optimistic update
    const tempCard: Card = {
      id: `temp-card-${Date.now()}`,
      listId: listId,
      workspaceId: currentBoard.workspaceId,
      title: data.title,
      description: data.description,
      position: data.position,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Apply optimistic update
    const optimisticActionId = optimisticBoard.optimisticCreateCard(listId, tempCard);

    try {
      setError(null);

      if (demoMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // In demo mode, create a proper card with a better ID
        // Update the optimistic state with the final card
        optimisticBoard.confirmOptimisticUpdate(optimisticActionId);
      } else {
        // Make API call
        await BoardService.createCard(listId, currentBoard.workspaceId, data);
        
        // Confirm the optimistic update with server data
        optimisticBoard.confirmOptimisticUpdate(optimisticActionId);
        
        // Reload the board to get the updated state
        await loadBoard(currentBoard.id);
      }
    } catch (err: unknown) {
      // Rollback the optimistic update on error
      optimisticBoard.rollbackOptimisticUpdate(optimisticActionId);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to create card';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateCard = async (cardId: string, data: UpdateCardData): Promise<void> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    try {
      setError(null);

      if (demoMode) {
        const currentBoard = optimisticBoard.currentState;
        if (currentBoard) {
          setCurrentBoard({
            ...currentBoard,
            lists: currentBoard.lists.map(list => ({
              ...list,
              cards: list.cards.map(card =>
                card.id === cardId ? { ...card, ...data, updatedAt: new Date() } : card
              )
            }))
          });
        }
      } else {
        await BoardService.updateCard(cardId, currentWorkspace.id, data);
        const currentBoard = optimisticBoard.currentState;
        if (currentBoard) {
          await loadBoard(currentBoard.id);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update card';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteCard = async (cardId: string): Promise<void> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    try {
      setError(null);

      if (demoMode) {
        const currentBoard = optimisticBoard.currentState;
        if (currentBoard) {
          setCurrentBoard({
            ...currentBoard,
            lists: currentBoard.lists.map(list => ({
              ...list,
              cards: list.cards.filter(card => card.id !== cardId)
            }))
          });
        }
      } else {
        await BoardService.deleteCard(cardId, currentWorkspace.id);
        const currentBoard = optimisticBoard.currentState;
        if (currentBoard) {
          await loadBoard(currentBoard.id);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete card';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const moveCard = async (cardId: string, data: MoveCardData): Promise<void> => {
    const currentBoard = optimisticBoard.currentState;
    if (!currentBoard) return;

    // Find the card and its current position
    let sourceCard: Card | null = null;
    let sourceListId: string | null = null;
    let sourcePosition: number = 0;

    for (const list of currentBoard.lists) {
      const cardIndex = list.cards.findIndex(c => c.id === cardId);
      if (cardIndex !== -1) {
        sourceCard = list.cards[cardIndex];
        sourceListId = list.id;
        sourcePosition = sourceCard.position;
        break;
      }
    }

    if (!sourceCard || !sourceListId) return;

    // Apply optimistic update
    const optimisticActionId = optimisticBoard.optimisticMoveCard(
      cardId,
      sourceListId,
      data.targetListId,
      sourcePosition,
      data.position
    );

    try {
      setError(null);

      if (demoMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // In demo mode, the optimistic update is the final state
        optimisticBoard.confirmOptimisticUpdate(optimisticActionId);
      } else {
        // Make API call
        await BoardService.moveCard(cardId, currentBoard.workspaceId, data);
        
        // Confirm the optimistic update
        optimisticBoard.confirmOptimisticUpdate(optimisticActionId);
        
        // Optionally reload the board to get the server state
        if (currentBoard) {
          await loadBoard(currentBoard.id);
        }
      }
    } catch (err: unknown) {
      // Rollback the optimistic update on error
      optimisticBoard.rollbackOptimisticUpdate(optimisticActionId);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to move card';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const reorderCards = async (listId: string, cardIds: string[]): Promise<void> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    // Apply optimistic update
    const optimisticActionId = optimisticBoard.optimisticReorderCards(listId, cardIds);

    try {
      setError(null);

      if (demoMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Confirm the optimistic update
        optimisticBoard.confirmOptimisticUpdate(optimisticActionId);
      } else {
        // Make API call
        await BoardService.reorderCards(listId, currentWorkspace.id, cardIds);
        
        // Confirm the optimistic update
        optimisticBoard.confirmOptimisticUpdate(optimisticActionId);
        
        // Optionally reload the board to get the server state
        const currentBoard = optimisticBoard.currentState;
        if (currentBoard) {
          await loadBoard(currentBoard.id);
        }
      }
    } catch (err: unknown) {
      // Rollback the optimistic update on error
      optimisticBoard.rollbackOptimisticUpdate(optimisticActionId);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder cards';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Load boards when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      loadBoards();
    } else {
      setBoards([]);
      setCurrentBoard(null);
    }
  }, [currentWorkspace, demoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const value: BoardContextType = {
    boards,
    currentBoard: optimisticBoard.currentState,
    loading,
    error,
    loadBoards,
    loadBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    setCurrentBoard,
    createList,
    updateList,
    deleteList,
    reorderLists,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCards,
  };

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = (): BoardContextType => {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
};