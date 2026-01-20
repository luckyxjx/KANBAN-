# Workspace Module

This module implements the multi-tenant workspace management system with complete isolation and security features.

## Features Implemented

### Task 4.1: Workspace Service and Controller

#### WorkspaceService
- **createWorkspace**: Creates a new workspace with the user as OWNER (Requirement 2.1)
- **getUserWorkspaces**: Returns only workspaces where the user is a member (Requirement 2.3)
- **getWorkspace**: Gets workspace details with membership validation (Requirement 2.5)
- **inviteUser**: Invites users with role assignment (Requirement 2.4)
- **validateMembership**: Validates workspace membership and logs unauthorized attempts (Requirements 2.5, 2.6, 7.5)
- **getWorkspaceMembers**: Gets all members of a workspace
- **removeMember**: Removes a member from a workspace (OWNER only)
- **updateWorkspace**: Updates workspace details (OWNER only)
- **deleteWorkspace**: Deletes a workspace (OWNER only)

#### WorkspaceController
REST API endpoints:
- `POST /workspaces` - Create workspace
- `GET /workspaces` - Get user's workspaces
- `GET /workspaces/:id` - Get specific workspace
- `PUT /workspaces/:id` - Update workspace
- `DELETE /workspaces/:id` - Delete workspace
- `POST /workspaces/:id/invite` - Invite user to workspace
- `GET /workspaces/:id/members` - Get workspace members
- `DELETE /workspaces/:id/members/:memberId` - Remove member

### Task 4.4: Authorization Guards and Helpers

#### WorkspaceMemberGuard
- Verifies workspace membership before allowing access
- Extracts workspaceId from params, query, or body
- Logs unauthorized access attempts (Requirements 2.6, 7.5, 7.6)
- Returns 403 Forbidden for non-members

#### WorkspaceQueryHelper
Workspace-scoped query helpers (Requirement 7.1, 7.2):
- **verifyBoardInWorkspace**: Ensures board belongs to workspace
- **verifyListInWorkspace**: Ensures list belongs to workspace
- **verifyCardInWorkspace**: Ensures card belongs to workspace
- **getWorkspaceBoards**: Gets all boards in a workspace
- **getBoardLists**: Gets lists for a board with workspace validation
- **getListCards**: Gets cards for a list with workspace validation
- **getWorkspaceActivity**: Gets activity events for a workspace
- **logUnauthorizedAccess**: Logs unauthorized access attempts with full audit info

## Security Features

1. **Workspace Isolation**: All queries are workspace-scoped
2. **Membership Validation**: Every operation validates user membership
3. **Audit Logging**: Unauthorized access attempts are logged with userId, workspaceId, and timestamp
4. **Role-Based Access**: OWNER role required for sensitive operations
5. **Cross-Tenant Protection**: Prevents access to data from other workspaces

## Usage Example

```typescript
// In a controller
@Controller('boards')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class BoardController {
  @Get(':id')
  async getBoard(@Request() req, @Param('id') id: string) {
    // req.workspaceId is set by WorkspaceMemberGuard
    // User membership is already validated
    return this.boardService.getBoard(id, req.user.id, req.workspaceId);
  }
}

// In a service
async getBoard(boardId: string, userId: string, workspaceId: string) {
  // Verify board belongs to workspace
  await WorkspaceQueryHelper.verifyBoardInWorkspace(
    this.prisma,
    boardId,
    workspaceId,
  );
  
  // Get board data
  return this.prisma.board.findUnique({
    where: { id: boardId },
    include: { lists: true },
  });
}
```

## Requirements Satisfied

- ✅ 2.1: Workspace creation with OWNER assignment
- ✅ 2.2: Complete workspace isolation
- ✅ 2.3: Return only user's workspaces
- ✅ 2.4: User invitation with role assignment
- ✅ 2.5: Membership validation on all data access
- ✅ 2.6: 403 Forbidden for non-members
- ✅ 7.1: Workspace-scoped database queries
- ✅ 7.2: Membership verification before returning data
- ✅ 7.5: Deny access to data outside user's workspaces
- ✅ 7.6: Log unauthorized access attempts with full audit info
