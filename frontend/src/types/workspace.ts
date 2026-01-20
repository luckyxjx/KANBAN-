export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  members?: WorkspaceMember[];
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'OWNER' | 'MEMBER';
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
}

export interface InviteUserData {
  email: string;
  role: 'MEMBER';
}