import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useDemoData } from './DemoDataProvider';
import type { Workspace, WorkspaceMember, CreateWorkspaceData, InviteUserData } from '../types/workspace';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  createWorkspace: (data: CreateWorkspaceData) => Promise<Workspace>;
  inviteUser: (workspaceId: string, data: InviteUserData) => Promise<void>;
  loadWorkspaces: () => Promise<void>;
  getWorkspaceMembers: (workspaceId: string) => Promise<WorkspaceMember[]>;
  requireWorkspaceSelection: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { demoMode, demoWorkspaces, addDemoWorkspace, demoUser } = useDemoData();
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if workspace selection is required
  const requireWorkspaceSelection = isAuthenticated && workspaces.length > 1 && !currentWorkspace;

  const setCurrentWorkspace = (workspace: Workspace | null) => {
    setCurrentWorkspaceState(workspace);
    // Store workspace selection in localStorage for persistence
    if (workspace) {
      localStorage.setItem('selectedWorkspaceId', workspace.id);
    } else {
      localStorage.removeItem('selectedWorkspaceId');
    }
  };

  const loadWorkspaces = async (): Promise<void> => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      
      let fetchedWorkspaces: Workspace[];
      
      // In demo mode, use demo data
      if (demoMode) {
        fetchedWorkspaces = demoWorkspaces;
      } else {
        const response = await axios.get('/api/workspaces');
        fetchedWorkspaces = response.data;
      }
      
      setWorkspaces(fetchedWorkspaces);

      // Auto-select workspace if only one exists
      if (fetchedWorkspaces.length === 1) {
        setCurrentWorkspace(fetchedWorkspaces[0]);
      } else if (fetchedWorkspaces.length > 1) {
        // Try to restore previously selected workspace
        const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
        if (savedWorkspaceId) {
          const savedWorkspace = fetchedWorkspaces.find((w: Workspace) => w.id === savedWorkspaceId);
          if (savedWorkspace) {
            setCurrentWorkspace(savedWorkspace);
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workspaces';
      setError(errorMessage);
      console.error('Error loading workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (data: CreateWorkspaceData): Promise<Workspace> => {
    try {
      setError(null);
      
      let newWorkspace: Workspace;
      
      // In demo mode, create demo workspace
      if (demoMode) {
        newWorkspace = {
          id: `demo-workspace-${Date.now()}`,
          name: data.name,
          description: data.description,
          createdAt: new Date(),
          updatedAt: new Date(),
          members: [
            {
              id: `demo-member-${Date.now()}`,
              userId: demoUser.id,
              workspaceId: `demo-workspace-${Date.now()}`,
              role: 'OWNER',
              createdAt: new Date(),
              updatedAt: new Date(),
              user: demoUser,
            },
          ],
        };
        addDemoWorkspace(newWorkspace);
      } else {
        const response = await axios.post('/api/workspaces', data);
        newWorkspace = response.data;
      }
      
      // Add to workspaces list
      setWorkspaces(prev => [...prev, newWorkspace]);
      
      // Auto-select the new workspace
      setCurrentWorkspace(newWorkspace);
      
      return newWorkspace;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workspace';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const inviteUser = async (workspaceId: string, data: InviteUserData): Promise<void> => {
    try {
      setError(null);
      
      // In demo mode, simulate invitation
      if (demoMode) {
        // Just show success - in real app this would send an email
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      } else {
        await axios.post(`/api/workspaces/${workspaceId}/invite`, data);
      }
      
      // Reload workspaces to get updated member information
      await loadWorkspaces();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getWorkspaceMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
    try {
      setError(null);
      
      // In demo mode, return demo members
      if (demoMode) {
        const workspace = demoWorkspaces.find(w => w.id === workspaceId);
        return workspace?.members || [];
      }
      
      const response = await axios.get(`/api/workspaces/${workspaceId}/members`);
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workspace members';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Load workspaces when user authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadWorkspaces();
    } else {
      // Clear workspace data when user logs out
      setWorkspaces([]);
      setCurrentWorkspace(null);
    }
  }, [isAuthenticated, user, demoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    loading,
    error,
    setCurrentWorkspace,
    createWorkspace,
    inviteUser,
    loadWorkspaces,
    getWorkspaceMembers,
    requireWorkspaceSelection,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};