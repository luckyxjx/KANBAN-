import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto, InviteUserDto } from './dto';
import { Workspace, WorkspaceMember, WorkspaceMemberRole } from '@prisma/client';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new workspace with the user as OWNER
   * Requirement 2.1: WHEN an authenticated user creates a workspace, 
   * THE System SHALL create a new workspace with the user as OWNER
   */
  async createWorkspace(
    userId: string,
    dto: CreateWorkspaceDto,
  ): Promise<Workspace> {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        description: dto.description,
        members: {
          create: {
            userId,
            role: WorkspaceMemberRole.OWNER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    this.logger.log(
      `Workspace created: ${workspace.id} by user: ${userId} with OWNER role`,
    );

    return workspace;
  }

  /**
   * Get all workspaces where the user is a member
   * Requirement 2.3: WHEN a user requests workspace data, 
   * THE System SHALL only return workspaces where the user is a member
   */
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return workspaces;
  }

  /**
   * Get a specific workspace by ID with membership validation
   * Requirement 2.5: WHEN any data is accessed, THE System SHALL verify 
   * the requesting user has membership in the associated workspace
   */
  async getWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<Workspace> {
    // Verify membership
    await this.validateMembership(userId, workspaceId);

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  /**
   * Invite a user to a workspace with role assignment
   * Requirement 2.4: WHEN a workspace owner invites a user, 
   * THE System SHALL create a workspace membership with MEMBER role
   */
  async inviteUser(
    workspaceId: string,
    inviterId: string,
    dto: InviteUserDto,
  ): Promise<WorkspaceMember> {
    // Verify the inviter has access to the workspace
    const inviterMembership = await this.validateMembership(
      inviterId,
      workspaceId,
    );

    // Only OWNER can invite users
    if (inviterMembership.role !== WorkspaceMemberRole.OWNER) {
      throw new ForbiddenException(
        'Only workspace owners can invite new members',
      );
    }

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${dto.email} not found`);
    }

    // Check if user is already a member
    const existingMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('User is already a member of this workspace');
    }

    // Create workspace membership
    const membership = await this.prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role: dto.role,
      },
      include: {
        user: true,
        workspace: true,
      },
    });

    this.logger.log(
      `User ${user.id} invited to workspace ${workspaceId} with role ${dto.role} by ${inviterId}`,
    );

    return membership;
  }

  /**
   * Validate workspace membership
   * Requirement 2.5: WHEN any data is accessed, THE System SHALL verify 
   * the requesting user has membership in the associated workspace
   * 
   * Requirement 2.6: IF a user is not a workspace member, 
   * THEN THE System SHALL return a 403 Forbidden error
   */
  async validateMembership(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMember> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      include: {
        workspace: true,
      },
    });

    if (!membership) {
      // Requirement 7.5: Log unauthorized access attempts
      this.logger.warn(
        `Unauthorized access attempt - userId: ${userId}, workspaceId: ${workspaceId}, timestamp: ${new Date().toISOString()}`,
      );

      throw new ForbiddenException(
        'You do not have access to this workspace',
      );
    }

    return membership;
  }

  /**
   * Get workspace members
   */
  async getWorkspaceMembers(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember[]> {
    // Verify membership
    await this.validateMembership(userId, workspaceId);

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return members;
  }

  /**
   * Remove a member from a workspace
   */
  async removeMember(
    workspaceId: string,
    requesterId: string,
    memberIdToRemove: string,
  ): Promise<void> {
    // Verify the requester has access to the workspace
    const requesterMembership = await this.validateMembership(
      requesterId,
      workspaceId,
    );

    // Only OWNER can remove members
    if (requesterMembership.role !== WorkspaceMemberRole.OWNER) {
      throw new ForbiddenException(
        'Only workspace owners can remove members',
      );
    }

    // Cannot remove yourself if you're the only owner
    if (requesterId === memberIdToRemove) {
      const ownerCount = await this.prisma.workspaceMember.count({
        where: {
          workspaceId,
          role: WorkspaceMemberRole.OWNER,
        },
      });

      if (ownerCount === 1) {
        throw new BadRequestException(
          'Cannot remove the last owner from the workspace',
        );
      }
    }

    // Remove the member
    await this.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: memberIdToRemove,
          workspaceId,
        },
      },
    });

    this.logger.log(
      `User ${memberIdToRemove} removed from workspace ${workspaceId} by ${requesterId}`,
    );
  }

  /**
   * Update workspace details
   */
  async updateWorkspace(
    workspaceId: string,
    userId: string,
    dto: CreateWorkspaceDto,
  ): Promise<Workspace> {
    // Verify membership and get role
    const membership = await this.validateMembership(userId, workspaceId);

    // Only OWNER can update workspace
    if (membership.role !== WorkspaceMemberRole.OWNER) {
      throw new ForbiddenException(
        'Only workspace owners can update workspace details',
      );
    }

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    this.logger.log(`Workspace ${workspaceId} updated by user ${userId}`);

    return workspace;
  }

  /**
   * Delete a workspace
   */
  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    // Verify membership and get role
    const membership = await this.validateMembership(userId, workspaceId);

    // Only OWNER can delete workspace
    if (membership.role !== WorkspaceMemberRole.OWNER) {
      throw new ForbiddenException(
        'Only workspace owners can delete the workspace',
      );
    }

    await this.prisma.workspace.delete({
      where: { id: workspaceId },
    });

    this.logger.log(`Workspace ${workspaceId} deleted by user ${userId}`);
  }
}
