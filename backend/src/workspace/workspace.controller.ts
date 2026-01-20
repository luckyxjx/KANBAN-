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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto, InviteUserDto } from './dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  /**
   * Create a new workspace
   * POST /workspaces
   */
  @Post()
  async create(@Request() req, @Body() dto: CreateWorkspaceDto) {
    return this.workspaceService.createWorkspace(req.user.id, dto);
  }

  /**
   * Get all workspaces for the current user
   * GET /workspaces
   */
  @Get()
  async findUserWorkspaces(@Request() req) {
    return this.workspaceService.getUserWorkspaces(req.user.id);
  }

  /**
   * Get a specific workspace
   * GET /workspaces/:id
   */
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.workspaceService.getWorkspace(id, req.user.id);
  }

  /**
   * Update a workspace
   * PUT /workspaces/:id
   */
  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspaceService.updateWorkspace(id, req.user.id, dto);
  }

  /**
   * Delete a workspace
   * DELETE /workspaces/:id
   */
  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    await this.workspaceService.deleteWorkspace(id, req.user.id);
    return { message: 'Workspace deleted successfully' };
  }

  /**
   * Invite a user to a workspace
   * POST /workspaces/:id/invite
   */
  @Post(':id/invite')
  async invite(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.workspaceService.inviteUser(id, req.user.id, dto);
  }

  /**
   * Get workspace members
   * GET /workspaces/:id/members
   */
  @Get(':id/members')
  async getMembers(@Request() req, @Param('id') id: string) {
    return this.workspaceService.getWorkspaceMembers(id, req.user.id);
  }

  /**
   * Remove a member from a workspace
   * DELETE /workspaces/:id/members/:memberId
   */
  @Delete(':id/members/:memberId')
  async removeMember(
    @Request() req,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    await this.workspaceService.removeMember(id, req.user.id, memberId);
    return { message: 'Member removed successfully' };
  }
}
