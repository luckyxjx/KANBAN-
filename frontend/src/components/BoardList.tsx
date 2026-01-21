import React, { useState } from 'react';
import { useBoard } from '../contexts/BoardContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { DashboardIcon, PlusIcon } from './icons';
import CreateBoardForm from './CreateBoardForm';
import type { Board } from '../types/board';
import './BoardList.css';

interface BoardListProps {
  onBoardSelect: (board: Board) => void;
}

const BoardList: React.FC<BoardListProps> = ({ onBoardSelect }) => {
  const { boards, loading, error } = useBoard();
  const { currentWorkspace } = useWorkspace();
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (loading) {
    return (
      <div className="board-list-container">
        <div className="board-list-header">
          <h2>Boards</h2>
        </div>
        <div className="board-list-loading">
          <p>Loading boards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="board-list-container">
        <div className="board-list-header">
          <h2>Boards</h2>
        </div>
        <div className="board-list-error">
          <p>Error loading boards: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="board-list-container">
      <div className="board-list-header">
        <h2>Boards</h2>
        {currentWorkspace && (
          <p className="workspace-name">in {currentWorkspace.name}</p>
        )}
      </div>

      <div className="board-grid">
        {boards.map((board) => (
          <div
            key={board.id}
            className="board-card"
            onClick={() => onBoardSelect(board)}
            style={{ borderLeftColor: board.color || '#6b7280' }}
          >
            <div className="board-card-icon">
              <DashboardIcon size={24} />
            </div>
            <div className="board-card-content">
              <h3 className="board-card-title">{board.name}</h3>
              {board.description && (
                <p className="board-card-description">{board.description}</p>
              )}
              <div className="board-card-meta">
                <span className="board-card-date">
                  Updated {new Date(board.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div
          className="board-card board-card-create"
          onClick={() => setShowCreateForm(true)}
        >
          <div className="board-card-icon">
            <PlusIcon size={24} />
          </div>
          <div className="board-card-content">
            <h3 className="board-card-title">Create new board</h3>
            <p className="board-card-description">
              Start organizing your tasks with a new Kanban board
            </p>
          </div>
        </div>
      </div>

      {boards.length === 0 && (
        <div className="board-list-empty">
          <div className="empty-state">
            <DashboardIcon size={64} />
            <h3>No boards yet</h3>
            <p>Create your first board to start organizing your tasks</p>
            <button
              className="create-board-button"
              onClick={() => setShowCreateForm(true)}
            >
              <PlusIcon size={16} />
              Create Board
            </button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <CreateBoardForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={async (board) => {
            setShowCreateForm(false);
            // Wait a bit for the board to be fully created
            await new Promise(resolve => setTimeout(resolve, 100));
            onBoardSelect(board);
          }}
        />
      )}
    </div>
  );
};

export default BoardList;