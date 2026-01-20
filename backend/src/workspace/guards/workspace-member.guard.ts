import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceService } from '../workspace.service';

/**
 * Guard to verify workspace membership
 * Requirement 2.6: IF a user is not a workspace member, 
 * THEN THE System SHALL return a 403 Forbidden error
 * 
 * Requirement 7.5: IF a user attempts to access data outside their workspaces, 
 * THEN THE System SHALL deny access and log the attempt
 */
@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  private readonly logger = new Logger(WorkspaceMemberGuard.name);

  constructor(
    private workspaceService: WorkspaceService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract workspaceId from params, query, or body
    const workspaceId =
      request.params.workspaceId ||
      request.params.id ||
      request.query.workspaceId ||
      request.body?.workspaceId;

    if (!workspaceId) {
      throw new BadRequestException('Workspace ID is required');
    }

    try {
      // Validate membership - this will throw ForbiddenException if not a member
      await this.workspaceService.validateMembership(user.id, workspaceId);
      
      // Store workspace ID in request for later use
      request.workspaceId = workspaceId;
      
      return true;
    } catch (error) {
      // Requirement 7.6: Log unauthorized access attempts
      this.logger.warn(
        `Unauthorized access attempt - userId: ${user.id}, workspaceId: ${workspaceId}, timestamp: ${new Date().toISOString()}`,
      );
      throw error;
    }
  }
}
