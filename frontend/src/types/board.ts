export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  lists?: List[];
}

export interface List {
  id: string;
  boardId: string;
  workspaceId: string;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  cards?: Card[];
}

export interface Card {
  id: string;
  listId: string;
  workspaceId: string;
  title: string;
  description?: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBoardData {
  name: string;
  description?: string;
  color?: string;
}

export interface CreateListData {
  name: string;
  position: number;
}

export interface CreateCardData {
  title: string;
  description?: string;
  position: number;
}

export interface UpdateBoardData {
  name?: string;
  description?: string;
  color?: string;
}

export interface UpdateListData {
  name?: string;
  position?: number;
}

export interface UpdateCardData {
  title?: string;
  description?: string;
  position?: number;
  listId?: string;
}

export interface MoveCardData {
  targetListId: string;
  position: number;
}

export interface BoardWithDetails extends Board {
  lists: (List & { cards: Card[] })[];
}