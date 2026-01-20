# Board Management Module

This module implements the board, list, and card management system for the multi-tenant Kanban application.

## Features

### Board Operations
- **Create Board**: Create a new board within a workspace with workspace scoping
- **Get Boards**: Retrieve all boards for a workspace
- **Get Board**: Get a single board with all lists and cards
- **Update Board**: Update board details (name, description, color)
- **Delete Board**: Delete a board with cascade cleanup of lists and cards

### List Operations
- **Create List**: Create a new list within a board with automatic positioning
- **Get Lists**: Retrieve all lists for a board
- **Update List**: Update list details (name)
- **Reorder Lists**: Reorder lists within a board
- **Delete List**: Delete a list with cascade cleanup of cards

### Card Operations
- **Create Card**: Create a new card within a list with automatic positioning
- **Get Cards**: Retrieve all cards for a list
- **Update Card**: Update card details (title, description)
- **Move Card**: Move a card between lists or reorder within the same list
- **Reorder Cards**: Reorder cards within a list
- **Delete Card**: Delete a card

## Security

All operations enforce workspace isolation:
- Workspace membership is validated before any operation
- All entities (boards, lists, cards) are associated with a workspace
- Cross-workspace access is prevented and logged
- Unauthorized access attempts return 403 Forbidden

## API Endpoints

### Boards
- `POST /workspaces/:workspaceId/boards` - Create board
- `GET /workspaces/:workspaceId/boards` - Get all boards
- `GET /workspaces/:workspaceId/boards/:boardId` - Get board with details
- `PUT /workspaces/:workspaceId/boards/:boardId` - Update board
- `DELETE /workspaces/:workspaceId/boards/:boardId` - Delete board

### Lists
- `POST /workspaces/:workspaceId/boards/:boardId/lists` - Create list
- `GET /workspaces/:workspaceId/boards/:boardId/lists` - Get all lists
- `PUT /workspaces/:workspaceId/lists/:listId` - Update list
- `PUT /workspaces/:workspaceId/boards/:boardId/lists/reorder` - Reorder lists
- `DELETE /workspaces/:workspaceId/lists/:listId` - Delete list

### Cards
- `POST /workspaces/:workspaceId/lists/:listId/cards` - Create card
- `GET /workspaces/:workspaceId/lists/:listId/cards` - Get all cards
- `PUT /workspaces/:workspaceId/cards/:cardId` - Update card
- `PUT /workspaces/:workspaceId/cards/:cardId/move` - Move card
- `PUT /workspaces/:workspaceId/lists/:listId/cards/reorder` - Reorder cards
- `DELETE /workspaces/:workspaceId/cards/:cardId` - Delete card

## Requirements Satisfied

- **Requirement 3.1**: Board creation with workspace scoping
- **Requirement 3.2**: Board access validation
- **Requirement 3.3**: Board data retrieval with lists and cards
- **Requirement 3.5**: Board deletion with cascade cleanup
- **Requirement 4.1**: List CRUD operations within boards
- **Requirement 4.2**: Card creation with workspace association
- **Requirement 4.3**: Card movement between lists
- **Requirement 4.4**: Card update with workspace validation
- **Requirement 4.6**: Position persistence for lists and cards

## Testing

Unit tests are provided in `board.service.spec.ts` covering:
- Board creation with workspace scoping
- List creation with proper positioning
- Card creation with workspace association
- Card movement between lists
- Board deletion with cascade cleanup
- Workspace membership validation
