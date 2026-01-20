import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityService } from './activity.service';
import { ActivityEvent } from '@prisma/client';

@Controller('workspaces/:workspaceId/activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  /**
   * Get all activity for a workspace
   * GET /workspaces/:workspaceId/activity
   */
  @Get()
  async getWorkspaceActivity(
    @Param('workspaceId') workspaceId: string,
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<ActivityEvent[]> {
    return this.activityService.getWorkspaceActivity(
      workspaceId,
      req.user.userId,
      limit,
      offset,
    );
  }

  /**
   * Get activity for a specific board
   * GET /workspaces/:workspaceId/activity/boards/:boardId
   */
  @Get('boards/:boardId')
  async getBoardActivity(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<ActivityEvent[]> {
    return this.activityService.getBoardActivity(
      workspaceId,
      req.user.userId,
      boardId,
      limit,
    );
  }

  /**
   * Get activity for a specific entity
   * GET /workspaces/:workspaceId/activity/:entityType/:entityId
   */
  @Get(':entityType/:entityId')
  async getEntityActivity(
    @Param('workspaceId') workspaceId: string,
    @Param('entityType') entityType: 'card' | 'list' | 'board',
    @Param('entityId') entityId: string,
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<ActivityEvent[]> {
    return this.activityService.getEntityActivity(
      workspaceId,
      req.user.userId,
      entityType,
      entityId,
      limit,
    );
  }
}
