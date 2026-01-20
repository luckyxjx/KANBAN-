import React, { useState } from 'react';
import { useBoard } from '../contexts/BoardContext';
import BoardList from './BoardList';
import BoardView from './BoardView';
import type { Board } from '../types/board';
import './BoardsManager.css';

const BoardsManager: React.FC = () => {
  const { loadBoard, currentBoard } = useBoard();
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [view, setView] = useState<'list' | 'board'>('list');

  const handleBoardSelect = async (board: Board) => {
    try {
      setSelectedBoard(board);
      setView('board');
      await loadBoard(board.id);
    } catch (error) {
      console.error('Error loading board:', error);
      // TODO: Show error message to user
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedBoard(null);
  };

  if (view === 'board' && selectedBoard && currentBoard) {
    return (
      <BoardView
        board={selectedBoard}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="boards-manager">
      <BoardList onBoardSelect={handleBoardSelect} />
    </div>
  );
};

export default BoardsManager;