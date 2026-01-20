import axios from 'axios';
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

export class BoardService {
  // Board operations
  static async getBoards(workspaceId: string): Promise<Board[]> {
    const response = await axios.get(`/api/workspaces/${workspaceId}/boards`);
    return response.data;
  }

  static async getBoard(boardId: string, workspaceId: string): Promise<BoardWithDetails> {
    const response = await axios.get(`/api/workspaces/${workspaceId}/boards/${boardId}`);
    return response.data;
  }

  static async createBoard(workspaceId: string, data: CreateBoardData): Promise<Board> {
    const response = await axios.post(`/api/workspaces/${workspaceId}/boards`, data);
    return response.data;
  }

  static async updateBoard(boardId: string, workspaceId: string, data: UpdateBoardData): Promise<Board> {
    const response = await axios.put(`/api/workspaces/${workspaceId}/boards/${boardId}`, data);
    return response.data;
  }

  static async deleteBoard(boardId: string, workspaceId: string): Promise<void> {
    await axios.delete(`/api/workspaces/${workspaceId}/boards/${boardId}`);
  }

  // List operations
  static async createList(boardId: string, workspaceId: string, data: CreateListData): Promise<List> {
    const response = await axios.post(`/api/workspaces/${workspaceId}/boards/${boardId}/lists`, data);
    return response.data;
  }

  static async updateList(listId: string, workspaceId: string, data: UpdateListData): Promise<List> {
    const response = await axios.put(`/api/workspaces/${workspaceId}/lists/${listId}`, data);
    return response.data;
  }

  static async deleteList(listId: string, workspaceId: string): Promise<void> {
    await axios.delete(`/api/workspaces/${workspaceId}/lists/${listId}`);
  }

  static async reorderLists(boardId: string, workspaceId: string, listIds: string[]): Promise<void> {
    await axios.put(`/api/workspaces/${workspaceId}/boards/${boardId}/lists/reorder`, { listIds });
  }

  // Card operations
  static async createCard(listId: string, workspaceId: string, data: CreateCardData): Promise<Card> {
    const response = await axios.post(`/api/workspaces/${workspaceId}/lists/${listId}/cards`, data);
    return response.data;
  }

  static async updateCard(cardId: string, workspaceId: string, data: UpdateCardData): Promise<Card> {
    const response = await axios.put(`/api/workspaces/${workspaceId}/cards/${cardId}`, data);
    return response.data;
  }

  static async deleteCard(cardId: string, workspaceId: string): Promise<void> {
    await axios.delete(`/api/workspaces/${workspaceId}/cards/${cardId}`);
  }

  static async moveCard(cardId: string, workspaceId: string, data: MoveCardData): Promise<Card> {
    const response = await axios.put(`/api/workspaces/${workspaceId}/cards/${cardId}/move`, data);
    return response.data;
  }

  static async reorderCards(listId: string, workspaceId: string, cardIds: string[]): Promise<void> {
    await axios.put(`/api/workspaces/${workspaceId}/lists/${listId}/cards/reorder`, { cardIds });
  }
}