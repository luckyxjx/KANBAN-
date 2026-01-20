import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Workspace } from '../types/workspace';
import type { Board } from '../types/board';

interface DemoUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface DemoDataContextType {
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  demoUser: DemoUser;
  demoWorkspaces: Workspace[];
  addDemoWorkspace: (workspace: Workspace) => void;
  updateDemoWorkspace: (workspaceId: string, updates: Partial<Workspace>) => void;
  demoBoards: Board[];
  addDemoBoard: (board: Board) => void;
  updateDemoBoard: (boardId: string, updates: Partial<Board>) => void;
  deleteDemoBoard: (boardId: string) => void;
}

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

interface DemoDataProviderProps {
  children: ReactNode;
}

// Demo user data
const DEMO_USER: DemoUser = {
  id: 'demo-user-1',
  email: 'demo@example.com',
  name: 'Demo User',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&auto=format',
};

// Demo workspace data
const INITIAL_DEMO_WORKSPACES: Workspace[] = [
  {
    id: 'demo-workspace-1',
    name: 'Personal Projects',
    description: 'My personal development projects and ideas',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    members: [
      {
        id: 'demo-member-1',
        userId: 'demo-user-1',
        workspaceId: 'demo-workspace-1',
        role: 'OWNER',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        user: DEMO_USER,
      },
    ],
  },
  {
    id: 'demo-workspace-2',
    name: 'Team Alpha',
    description: 'Collaborative workspace for Team Alpha projects',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    members: [
      {
        id: 'demo-member-2',
        userId: 'demo-user-1',
        workspaceId: 'demo-workspace-2',
        role: 'MEMBER',
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12'),
        user: DEMO_USER,
      },
      {
        id: 'demo-member-3',
        userId: 'demo-user-2',
        workspaceId: 'demo-workspace-2',
        role: 'OWNER',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        user: {
          id: 'demo-user-2',
          email: 'alice@example.com',
          name: 'Alice Johnson',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face&auto=format',
        },
      },
      {
        id: 'demo-member-4',
        userId: 'demo-user-3',
        workspaceId: 'demo-workspace-2',
        role: 'MEMBER',
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-14'),
        user: {
          id: 'demo-user-3',
          email: 'bob@example.com',
          name: 'Bob Smith',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face&auto=format',
        },
      },
    ],
  },
  {
    id: 'demo-workspace-3',
    name: 'Startup Venture',
    description: 'Workspace for our exciting new startup project',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-22'),
    members: [
      {
        id: 'demo-member-5',
        userId: 'demo-user-1',
        workspaceId: 'demo-workspace-3',
        role: 'OWNER',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
        user: DEMO_USER,
      },
      {
        id: 'demo-member-6',
        userId: 'demo-user-4',
        workspaceId: 'demo-workspace-3',
        role: 'MEMBER',
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-08'),
        user: {
          id: 'demo-user-4',
          email: 'sarah@example.com',
          name: 'Sarah Wilson',
          avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face&auto=format',
        },
      },
    ],
  },
];

// Demo board data
const INITIAL_DEMO_BOARDS: Board[] = [
  {
    id: 'demo-board-1',
    workspaceId: 'demo-workspace-1',
    name: 'Website Redesign',
    description: 'Complete redesign of the company website',
    color: '#3b82f6',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'demo-board-2',
    workspaceId: 'demo-workspace-1',
    name: 'Mobile App Development',
    description: 'Development of the new mobile application',
    color: '#10b981',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-21'),
  },
  {
    id: 'demo-board-3',
    workspaceId: 'demo-workspace-2',
    name: 'Product Launch',
    description: 'Planning and execution of the product launch',
    color: '#f59e0b',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: 'demo-board-4',
    workspaceId: 'demo-workspace-3',
    name: 'MVP Development',
    description: 'Building the minimum viable product',
    color: '#ef4444',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-22'),
  },
];

export const DemoDataProvider: React.FC<DemoDataProviderProps> = ({ children }) => {
  const [demoMode, setDemoMode] = useState(() => {
    return localStorage.getItem('demoMode') === 'true';
  });
  
  const [demoWorkspaces, setDemoWorkspaces] = useState<Workspace[]>(INITIAL_DEMO_WORKSPACES);
  const [demoBoards, setDemoBoards] = useState<Board[]>(INITIAL_DEMO_BOARDS);

  const handleSetDemoMode = (enabled: boolean) => {
    setDemoMode(enabled);
    localStorage.setItem('demoMode', enabled.toString());
  };

  const addDemoWorkspace = (workspace: Workspace) => {
    setDemoWorkspaces(prev => [...prev, workspace]);
  };

  const updateDemoWorkspace = (workspaceId: string, updates: Partial<Workspace>) => {
    setDemoWorkspaces(prev => 
      prev.map(workspace => 
        workspace.id === workspaceId 
          ? { ...workspace, ...updates, updatedAt: new Date() }
          : workspace
      )
    );
  };

  const addDemoBoard = (board: Board) => {
    setDemoBoards(prev => [...prev, board]);
  };

  const updateDemoBoard = (boardId: string, updates: Partial<Board>) => {
    setDemoBoards(prev => 
      prev.map(board => 
        board.id === boardId 
          ? { ...board, ...updates, updatedAt: new Date() }
          : board
      )
    );
  };

  const deleteDemoBoard = (boardId: string) => {
    setDemoBoards(prev => prev.filter(board => board.id !== boardId));
  };

  const value: DemoDataContextType = {
    demoMode,
    setDemoMode: handleSetDemoMode,
    demoUser: DEMO_USER,
    demoWorkspaces,
    addDemoWorkspace,
    updateDemoWorkspace,
    demoBoards,
    addDemoBoard,
    updateDemoBoard,
    deleteDemoBoard,
  };

  return (
    <DemoDataContext.Provider value={value}>
      {children}
    </DemoDataContext.Provider>
  );
};

export const useDemoData = (): DemoDataContextType => {
  const context = useContext(DemoDataContext);
  if (context === undefined) {
    throw new Error('useDemoData must be used within a DemoDataProvider');
  }
  return context;
};