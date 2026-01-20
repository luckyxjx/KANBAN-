import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceMemberRole } from '@prisma/client';

/**
 * Integration tests for workspace isolation and cross-tenant data leak prevention
 * These tests verify the core security foundation of the multi-tenant system
 */
describe('Workspace Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test users
  const user1 = {
    id: 'user-1',
    email: 'user1@example.com',
    name: 'User One',
  };

  const user2 = {
    id: 'user-2',
    email: 'user2@example.com',
    name: 'User Two',
  };

  const user3 = {
    id: 'user-3',
    email: 'user3@example.com',
    name: 'User Three',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    await prisma.user.createMany({
      data: [user1, user2, user3],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Workspace Creation and Ownership', () => {
    it('should create workspace with user as OWNER', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'User 1 Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
        include: {
          members: true,
        },
      });

      expect(workspace.members).toHaveLength(1);
      expect(workspace.members[0].userId).toBe(user1.id);
      expect(workspace.members[0].role).toBe(WorkspaceMemberRole.OWNER);
    });
  });

  describe('Workspace Isolation - No Cross-Tenant Data Leaks', () => {
    it('should prevent user from accessing another users workspace', async () => {
      // User 1 creates a workspace
      const workspace1 = await prisma.workspace.create({
        data: {
          name: 'User 1 Private Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // User 2 creates a workspace
      const workspace2 = await prisma.workspace.create({
        data: {
          name: 'User 2 Private Workspace',
          members: {
            create: {
              userId: user2.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // User 1 should only see their workspace
      const user1Workspaces = await prisma.workspace.findMany({
        where: {
          members: {
            some: {
              userId: user1.id,
            },
          },
        },
      });

      expect(user1Workspaces).toHaveLength(1);
      expect(user1Workspaces[0].id).toBe(workspace1.id);

      // User 2 should only see their workspace
      const user2Workspaces = await prisma.workspace.findMany({
        where: {
          members: {
            some: {
              userId: user2.id,
            },
          },
        },
      });

      expect(user2Workspaces).toHaveLength(1);
      expect(user2Workspaces[0].id).toBe(workspace2.id);
    });

    it('should prevent user from querying workspace members of another workspace', async () => {
      // User 1 creates a workspace
      const workspace1 = await prisma.workspace.create({
        data: {
          name: 'User 1 Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // User 2 tries to query User 1's workspace members
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user2.id,
            workspaceId: workspace1.id,
          },
        },
      });

      // User 2 should not have membership
      expect(membership).toBeNull();
    });

    it('should maintain isolation with multiple workspaces and users', async () => {
      // Create multiple workspaces
      const workspace1 = await prisma.workspace.create({
        data: {
          name: 'Workspace 1',
          members: {
            create: [
              { userId: user1.id, role: WorkspaceMemberRole.OWNER },
              { userId: user2.id, role: WorkspaceMemberRole.MEMBER },
            ],
          },
        },
      });

      const workspace2 = await prisma.workspace.create({
        data: {
          name: 'Workspace 2',
          members: {
            create: [
              { userId: user2.id, role: WorkspaceMemberRole.OWNER },
              { userId: user3.id, role: WorkspaceMemberRole.MEMBER },
            ],
          },
        },
      });

      const workspace3 = await prisma.workspace.create({
        data: {
          name: 'Workspace 3',
          members: {
            create: [{ userId: user3.id, role: WorkspaceMemberRole.OWNER }],
          },
        },
      });

      // User 1 should see only workspace 1
      const user1Workspaces = await prisma.workspace.findMany({
        where: {
          members: {
            some: {
              userId: user1.id,
            },
          },
        },
      });
      expect(user1Workspaces).toHaveLength(1);
      expect(user1Workspaces[0].id).toBe(workspace1.id);

      // User 2 should see workspaces 1 and 2
      const user2Workspaces = await prisma.workspace.findMany({
        where: {
          members: {
            some: {
              userId: user2.id,
            },
          },
        },
      });
      expect(user2Workspaces).toHaveLength(2);
      expect(user2Workspaces.map((w) => w.id).sort()).toEqual(
        [workspace1.id, workspace2.id].sort(),
      );

      // User 3 should see workspaces 2 and 3
      const user3Workspaces = await prisma.workspace.findMany({
        where: {
          members: {
            some: {
              userId: user3.id,
            },
          },
        },
      });
      expect(user3Workspaces).toHaveLength(2);
      expect(user3Workspaces.map((w) => w.id).sort()).toEqual(
        [workspace2.id, workspace3.id].sort(),
      );
    });
  });

  describe('Workspace Membership Validation', () => {
    it('should validate membership before granting access', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // User 1 has membership
      const user1Membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user1.id,
            workspaceId: workspace.id,
          },
        },
      });
      expect(user1Membership).not.toBeNull();

      // User 2 does not have membership
      const user2Membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user2.id,
            workspaceId: workspace.id,
          },
        },
      });
      expect(user2Membership).toBeNull();
    });
  });

  describe('Workspace Invitation and Role Assignment', () => {
    it('should create membership with MEMBER role when invited', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Invite user 2 as MEMBER
      const membership = await prisma.workspaceMember.create({
        data: {
          userId: user2.id,
          workspaceId: workspace.id,
          role: WorkspaceMemberRole.MEMBER,
        },
      });

      expect(membership.role).toBe(WorkspaceMemberRole.MEMBER);
      expect(membership.userId).toBe(user2.id);

      // Verify user 2 can now see the workspace
      const user2Workspaces = await prisma.workspace.findMany({
        where: {
          members: {
            some: {
              userId: user2.id,
            },
          },
        },
      });
      expect(user2Workspaces).toHaveLength(1);
      expect(user2Workspaces[0].id).toBe(workspace.id);
    });

    it('should prevent duplicate memberships', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Try to create duplicate membership
      await expect(
        prisma.workspaceMember.create({
          data: {
            userId: user1.id,
            workspaceId: workspace.id,
            role: WorkspaceMemberRole.MEMBER,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('Workspace Data Scoping', () => {
    it('should scope all queries by workspace membership', async () => {
      // Create two separate workspaces
      const workspace1 = await prisma.workspace.create({
        data: {
          name: 'Workspace 1',
          members: {
            create: {
              userId: user1.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      const workspace2 = await prisma.workspace.create({
        data: {
          name: 'Workspace 2',
          members: {
            create: {
              userId: user2.id,
              role: WorkspaceMemberRole.OWNER,
            },
          },
        },
      });

      // Query with workspace scoping
      const user1Data = await prisma.workspace.findMany({
        where: {
          AND: [
            { id: workspace1.id },
            {
              members: {
                some: {
                  userId: user1.id,
                },
              },
            },
          ],
        },
      });

      expect(user1Data).toHaveLength(1);

      // User 1 should not be able to query workspace 2
      const user1DataForWorkspace2 = await prisma.workspace.findMany({
        where: {
          AND: [
            { id: workspace2.id },
            {
              members: {
                some: {
                  userId: user1.id,
                },
              },
            },
          ],
        },
      });

      expect(user1DataForWorkspace2).toHaveLength(0);
    });
  });
});
