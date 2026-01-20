import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService, PrismaService, WorkspaceMemberGuard],
  exports: [WorkspaceService, WorkspaceMemberGuard],
})
export class WorkspaceModule {}
