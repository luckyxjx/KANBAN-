import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateBoardDto,
  UpdateBoardDto,
  CreateListDto,
  UpdateListDto,
  ReorderListsDto,
  CreateCardDto,
  UpdateCardDto,
  MoveCardDto,
  ReorderCardsDto,
} from './dto';

@Controller('workspaces/:workspaceId')
@UseGuards(JwtAuthGuard)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  // ==================== Board Endpoints ====================

  /**
   * Create a new board
   * POST /workspaces/:workspaceId/boards
   */
  @Post('boards')
  async createBoard(
    @Param('workspaceId') workspaceId: string,
    @Request() req,
    @Body() dto: CreateBoardDto,
  ) {
    return this.boardService.createBoard(workspaceId, req.user.userId, dto);
  }

  /**
   * Get all boards in a workspace
   * GET /workspaces/:workspaceId/boards
   */
  @Get('boards')
  async getWorkspaceBoards(
    @Param('workspaceId') workspaceId: string,
    @Request() req,
  ) {
    return this.boardService.getWorkspaceBoards(workspaceId, req.user.userId);
  }

  /**
   * Get a single board with lists and cards
   * GET /workspaces/:workspaceId/boards/:boardId
   */
  @Get('boards/:boardId')
  async getBoard(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
    @Request() req,
  ) {
    return this.boardService.getBoard(boardId, workspaceId, req.user.userId);
  }

  /**
   * Update a board
   * PUT /workspaces/:workspaceId/boards/:boardId
   */
  @Put('boards/:boardId')
  async updateBoard(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
    @Request() req,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardService.updateBoard(
      boardId,
      workspaceId,
      req.user.userId,
      dto,
    );
  }

  /**
   * Delete a board
   * DELETE /workspaces/:workspaceId/boards/:boardId
   */
  @Delete('boards/:boardId')
  async deleteBoard(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
    @Request() req,
  ) {
    await this.boardService.deleteBoard(boardId, workspaceId, req.user.userId);
    return { message: 'Board deleted successfully' };
  }

  // ==================== List Endpoints ====================

  /**
   * Create a new list in a board
   * POST /workspaces/:workspaceId/boards/:boardId/lists
   */
  @Post('boards/:boardId/lists')
  async createList(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
    @Request() req,
    @Body() dto: CreateListDto,
  ) {
    return this.boardService.createList(
      boardId,
      workspaceId,
      req.user.userId,
      dto,
    );
  }

  /**
   * Get all lists for a board
   * GET /workspaces/:workspaceId/boards/:boardId/lists
   */
  @Get('boards/:boardId/lists')
  async getBoardLists(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
    @Request() req,
  ) {
    return this.boardService.getBoardLists(
      boardId,
      workspaceId,
      req.user.userId,
    );
  }

  /**
   * Update a list
   * PUT /workspaces/:workspaceId/lists/:listId
   */
  @Put('lists/:listId')
  async updateList(
    @Param('workspaceId') workspaceId: string,
    @Param('listId') listId: string,
    @Request() req,
    @Body() dto: UpdateListDto,
  ) {
    return this.boardService.updateList(
      listId,
      workspaceId,
      req.user.userId,
      dto,
    );
  }

  /**
   * Reorder lists in a board
   * PUT /workspaces/:workspaceId/boards/:boardId/lists/reorder
   */
  @Put('boards/:boardId/lists/reorder')
  async reorderLists(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
    @Request() req,
    @Body() dto: ReorderListsDto,
  ) {
    return this.boardService.reorderLists(
      boardId,
      workspaceId,
      req.user.userId,
      dto,
    );
  }

  /**
   * Delete a list
   * DELETE /workspaces/:workspaceId/lists/:listId
   */
  @Delete('lists/:listId')
  async deleteList(
    @Param('workspaceId') workspaceId: string,
    @Param('listId') listId: string,
    @Request() req,
  ) {
    await this.boardService.deleteList(listId, workspaceId, req.user.userId);
    return { message: 'List deleted successfully' };
  }

  // ==================== Card Endpoints ====================

  /**
   * Create a new card in a list
   * POST /workspaces/:workspaceId/lists/:listId/cards
   */
  @Post('lists/:listId/cards')
  async createCard(
    @Param('workspaceId') workspaceId: string,
    @Param('listId') listId: string,
    @Request() req,
    @Body() dto: CreateCardDto,
  ) {
    return this.boardService.createCard(
      listId,
      workspaceId,
      req.user.userId,
      dto,
    );
  }

  /**
   * Get all cards for a list
   * GET /workspaces/:workspaceId/lists/:listId/cards
   */
  @Get('lists/:listId/cards')
  async getListCards(
    @Param('workspaceId') workspaceId: string,
    @Param('listId') listId: string,
    @Request() req,
  ) {
    return this.boardService.getListCards(listId, workspaceId, req.user.userId);
  }

  /**
   * Update a card
   * PUT /workspaces/:workspaceId/cards/:cardId
   */
  @Put('cards/:cardId')
  async updateCard(
    @Param('workspaceId') workspaceId: string,
    @Param('cardId') cardId: string,
    @Request() req,
    @Body() dto: UpdateCardDto,
  ) {
    return this.boardService.updateCard(
      cardId,
      workspaceId,
      req.user.userId,
      dto,
    );
  }

  /**
   * Move a card to a different list or position
   * PUT /workspaces/:workspaceId/cards/:cardId/move
   */
  @Put('cards/:cardId/move')
  async moveCard(
    @Param('workspaceId') workspaceId: string,
    @Param('cardId') cardId: string,
    @Request() req,
    @Body() dto: MoveCardDto,
  ) {
    return this.boardService.moveCard(
      cardId,
      workspaceId,
      req.user.userId,
      dto,
    );
  }

  /**
   * Reorder cards in a list
   * PUT /workspaces/:workspaceId/lists/:listId/cards/reorder
   */
  @Put('lists/:listId/cards/reorder')
  async reorderCards(
    @Param('workspaceId') workspaceId: string,
    @Param('listId') listId: string,
    @Request() req,
    @Body() dto: ReorderCardsDto,
  ) {
    return this.boardService.reorderCards(
      listId,
      workspaceId,
      req.user.userId,
      dto,
    );
  }

  /**
   * Delete a card
   * DELETE /workspaces/:workspaceId/cards/:cardId
   */
  @Delete('cards/:cardId')
  async deleteCard(
    @Param('workspaceId') workspaceId: string,
    @Param('cardId') cardId: string,
    @Request() req,
  ) {
    await this.boardService.deleteCard(cardId, workspaceId, req.user.userId);
    return { message: 'Card deleted successfully' };
  }
}
