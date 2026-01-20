import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceMemberRole } from '@prisma/client';

describe('WorkspaceService - Core Security Foundation', () => {
  let service: WorkspaceService;
  let prisma: PrismaService;

  const mockPrismaService = {
    workspace: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Workspace Creation and Ownership (Req 2.1)', () => {
    it('should create workspace with user as OWNER', async () => {
      const userId = 'user-123';
      const dto = { name: 'Test Workspace', description: 'Test Description' };
      const expectedWorkspace = {
        id: 'workspace-123',
        name: dto.name,
        description: dto.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            id: 'member-123',
            userId,
            workspaceId: 'workspace-123',
            role: WorkspaceMemberRole.OWNER,
            user: { id: userId, email: 'test@example.com', name: 'Test User' },
          },
        ],
      };

      mockPrismaService.workspace.create.mockResolvedValue(expectedWorkspace);

      const result = await service.createWorkspace(userId, dto);

      expect(result).toEqual(expectedWorkspace);
      expect(mockPrismaService.workspace.create).toHaveBeenCalledWith({
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
    });
  });

  describe('Workspace Isolation (Req 2.2, 2.3)', () => {
    it('should only return workspaces where user is a member', async () => {
      const userId = 'user-123';
      const userWorkspaces = [
        {
          id: 'workspace-1',
          name: 'Workspace 1',
          members: [{ userId, role: WorkspaceMemberRole.OWNER }],
        },
        {
          id: 'workspace-2',
          name: 'Workspace 2',
          members: [{ userId, role: WorkspaceMemberRole.MEMBER }],
        },
      ];

      mockPrismaService.workspace.findMany.mockResolvedValue(userWorkspaces);

      const result = await service.getUserWorkspaces(userId);

      expect(result).toEqual(userWorkspaces);
      expect(mockPrismaService.workspace.findMany).toHaveBeenCalledWith({
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
    });

    it('should return empty array when user has no workspace memberships', async () => {
      const userId = 'user-no-workspaces';

      mockPrismaService.workspace.findMany.mockResolvedValue([]);

      const result = await service.getUserWorkspaces(userId);

      expect(result).toEqual([]);
    });
  });

  describe('Workspace Access Validation (Req 2.5, 2.6, 7.5)', () => {
    it('should allow access when user is a workspace member', async () => {
      const userId = 'user-123';
      const workspaceId = 'workspace-123';
      const membership = {
        id: 'member-123',
        userId,
        workspaceId,
        role: WorkspaceMemberRole.MEMBER,
        workspace: { id: workspaceId, name: 'Test Workspace' },
      };

      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      const result = await service.validateMembership(userId, workspaceId);

      expect(result).toEqual(membership);
    });

    it('should throw ForbiddenException when user is not a workspace member', async () => {
      const userId = 'user-123';
      const workspaceId = 'workspace-456';

      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        service.validateMembership(userId, workspaceId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.validateMembership(userId, workspaceId),
      ).rejects.toThrow('You do not have access to this workspace');
    });

    it('should deny access to workspace data when user is not a member', async () => {
      const userId = 'user-123';
      const workspaceId = 'workspace-456';

      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        service.getWorkspace(workspaceId, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Cross-Tenant Data Leak Prevention', () => {
    it('should prevent user from accessing another workspace data', async () => {
      const user1Id = 'user-1';
      const user2Id = 'user-2';
      const workspace1Id = 'workspace-1';
      const workspace2Id = 'workspace-2';

      // User 1 tries to access User 2's workspace
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        service.getWorkspace(workspace2Id, user1Id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent unauthorized workspace member listing', async () => {
      const userId = 'user-123';
      const workspaceId = 'workspace-456';

      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        service.getWorkspaceMembers(workspaceId, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Workspace Invitation (Req 2.4)', () => {
    it('should create workspace membership with MEMBER role when invited', async () => {
      const inviterId = 'owner-123';
      const workspaceId = 'workspace-123';
      const inviteeEmail = 'invitee@example.com';
      const inviteeId = 'user-456';

      const inviterMembership = {
        id: 'member-1',
        userId: inviterId,
        workspaceId,
        role: WorkspaceMemberRole.OWNER,
        workspace: { id: workspaceId, name: 'Test Workspace' },
      };

      const invitee = {
        id: inviteeId,
        email: inviteeEmail,
        name: 'Invitee User',
      };

      const newMembership = {
        id: 'member-2',
        userId: inviteeId,
        workspaceId,
        role: WorkspaceMemberRole.MEMBER,
        user: invitee,
        workspace: { id: workspaceId, name: 'Test Workspace' },
      };

      mockPrismaService.workspaceMember.findUnique
        .mockResolvedValueOnce(inviterMembership) // For inviter validation
        .mockResolvedValueOnce(null); // For checking existing membership

      mockPrismaService.user.findUnique.mockResolvedValue(invitee);
      mockPrismaService.workspaceMember.create.mockResolvedValue(newMembership);

      const result = await service.inviteUser(workspaceId, inviterId, {
        email: inviteeEmail,
        role: WorkspaceMemberRole.MEMBER,
      });

      expect(result).toEqual(newMembership);
      expect(result.role).toBe(WorkspaceMemberRole.MEMBER);
    });

    it('should only allow OWNER to invite users', async () => {
      const memberId = 'member-123';
      const workspaceId = 'workspace-123';

      const memberMembership = {
        id: 'member-1',
        userId: memberId,
        workspaceId,
        role: WorkspaceMemberRole.MEMBER,
        workspace: { id: workspaceId, name: 'Test Workspace' },
      };

      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(
        memberMembership,
      );

      await expect(
        service.inviteUser(workspaceId, memberId, {
          email: 'test@example.com',
          role: WorkspaceMemberRole.MEMBER,
        }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.inviteUser(workspaceId, memberId, {
          email: 'test@example.com',
          role: WorkspaceMemberRole.MEMBER,
        }),
      ).rejects.toThrow('Only workspace owners can invite new members');
    });

    it('should prevent duplicate workspace memberships', async () => {
      const inviterId = 'owner-123';
      const workspaceId = 'workspace-123';
      const inviteeEmail = 'existing@example.com';
      const inviteeId = 'user-456';

      const inviterMembership = {
        id: 'member-1',
        userId: inviterId,
        workspaceId,
        role: WorkspaceMemberRole.OWNER,
        workspace: { id: workspaceId, name: 'Test Workspace' },
      };

      const existingMembership = {
        id: 'member-2',
        userId: inviteeId,
        workspaceId,
        role: WorkspaceMemberRole.MEMBER,
      };

      // First call validates inviter, second call checks for existing membership
      mockPrismaService.workspaceMember.findUnique
        .mockResolvedValueOnce(inviterMembership)
        .mockResolvedValueOnce(existingMembership);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: inviteeId,
        email: inviteeEmail,
        name: 'Existing User',
      });

      await expect(
        service.inviteUser(workspaceId, inviterId, {
          email: inviteeEmail,
          role: WorkspaceMemberRole.MEMBER,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Workspace Update and Delete Authorization', () => {
    it('should only allow OWNER to update workspace', async () => {
      const memberId = 'member-123';
      const workspaceId = 'workspace-123';

      const memberMembership = {
        id: 'member-1',
        userId: memberId,
        workspaceId,
        role: WorkspaceMemberRole.MEMBER,
        workspace: { id: workspaceId, name: 'Test Workspace' },
      };

      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(
        memberMembership,
      );

      await expect(
        service.updateWorkspace(workspaceId, memberId, {
          name: 'Updated Name',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should only allow OWNER to delete workspace', async () => {
      const memberId = 'member-123';
      const workspaceId = 'workspace-123';

      const memberMembership = {
        id: 'member-1',
        userId: memberId,
        workspaceId,
        role: WorkspaceMemberRole.MEMBER,
        workspace: { id: workspaceId, name: 'Test Workspace' },
      };

      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(
        memberMembership,
      );

      await expect(
        service.deleteWorkspace(workspaceId, memberId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
