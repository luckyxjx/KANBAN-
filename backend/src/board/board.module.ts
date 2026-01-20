import { Module } from '@nestjs/common';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ActivityModule } from '../activity/activity.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WorkspaceModule, ActivityModule, WebSocketModule],
  controllers: [BoardController],
  providers: [BoardService, PrismaService],
  exports: [BoardService],
})
export class BoardModule {}
