# System Integration Guide: Multi-Tenant Kanban

This document provides comprehensive integration guidance for wiring all components of the multi-tenant Kanban system together, including error handling, logging, monitoring, and production-ready configuration.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Integration](#component-integration)
3. [Error Handling Strategy](#error-handling-strategy)
4. [Logging and Monitoring](#logging-and-monitoring)
5. [Production Configuration](#production-configuration)
6. [Complete User Flow](#complete-user-flow)
7. [Troubleshooting Guide](#troubleshooting-guide)

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Auth Context → Workspace Context → Board Context    │   │
│  │ WebSocket Context → Activity Context                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Components: Login, Dashboard, Boards, Cards, etc.   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Auth Module → Workspace Module → Board Module       │   │
│  │ Activity Module → WebSocket Module                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Guards: JWT Auth, Workspace Auth                    │   │
│  │ Middleware: Rate Limiting, Validation               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL
┌─────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                       │
│  Users | Workspaces | Boards | Lists | Cards | Activities  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication Flow**
   - User clicks "Sign in with Google"
   - Frontend redirects to Google OAuth
   - Backend receives callback, creates/retrieves user
   - JWT token stored in httpOnly cookie
   - Frontend authenticated for subsequent requests

2. **Workspace Access Flow**
   - User selects workspace
   - Frontend stores workspace context
   - All subsequent requests include workspace verification
   - Backend validates workspace membership

3. **Real-Time Collaboration Flow**
   - WebSocket connection established with JWT auth
   - User joins workspace-specific rooms
   - Changes broadcast to room members
   - Activity logged simultaneously

## Component Integration

### 1. Frontend Integration

#### Authentication Context Integration

```typescript
// AuthContext provides:
// - user: Current authenticated user
// - login(): Initiates Google OAuth flow
// - logout(): Clears session and redirects
// - checkAuth(): Verifies session on app load

// Integration points:
// 1. App.tsx wraps all components with AuthProvider
// 2. ProtectedRoute checks authentication before rendering
// 3. LoginPage handles OAuth callback
// 4. Dashboard requires authenticated user
```

#### Workspace Context Integration

```typescript
// WorkspaceContext provides:
// - currentWorkspace: Selected workspace
// - workspaces: User's accessible workspaces
// - setCurrentWorkspace(): Switches workspace
// - createWorkspace(): Creates new workspace
// - inviteUser(): Invites user to workspace

// Integration points:
// 1. WorkspaceProvider wraps authenticated components
// 2. WorkspaceSwitcher allows workspace selection
// 3. WorkspaceGuard enforces workspace selection
// 4. All board operations scoped to current workspace
```

#### Board Context Integration

```typescript
// BoardContext provides:
// - boards: Boards in current workspace
// - currentBoard: Selected board
// - lists: Lists in current board
// - cards: Cards in current board
// - updateCard(): Updates card state
// - moveCard(): Moves card between lists

// Integration points:
// 1. BoardProvider wraps board components
// 2. BoardView displays current board
// 3. KanbanList displays lists with cards
// 4. KanbanCard displays individual cards
```

#### WebSocket Context Integration

```typescript
// WebSocketContext provides:
// - socket: Socket.IO client instance
// - connected: Connection status
// - connect(): Establishes WebSocket connection
// - disconnect(): Closes WebSocket connection
// - emit(): Sends events to server
// - on(): Listens for server events

// Integration points:
// 1. WebSocketProvider connects on app load
// 2. Real-time event handlers update local state
// 3. Activity feed receives live updates
// 4. Board state synchronized with server
```

#### Activity Context Integration

```typescript
// ActivityContext provides:
// - activities: Activity log for workspace
// - addActivity(): Adds activity to log
// - clearActivities(): Clears activity log

// Integration points:
// 1. ActivityProvider wraps dashboard
// 2. ActivityFeed displays activities
// 3. Real-time events trigger activity updates
// 4. Activity log scoped to current workspace
```

### 2. Backend Integration

#### Authentication Module Integration

```typescript
// AuthModule provides:
// - AuthService: Google OAuth, JWT generation/validation
// - AuthController: OAuth callback, login endpoints
// - JwtAuthGuard: Protects routes requiring authentication
// - AuthMiddleware: Extracts JWT from cookies

// Integration points:
// 1. AuthModule imported in AppModule
// 2. JwtAuthGuard applied to protected routes
// 3. AuthMiddleware extracts JWT from httpOnly cookies
// 4. User context available in all protected routes
```

#### Workspace Module Integration

```typescript
// WorkspaceModule provides:
// - WorkspaceService: CRUD operations, membership validation
// - WorkspaceController: API endpoints
// - WorkspaceAuthGuard: Validates workspace membership
// - WorkspaceQueryHelper: Scopes queries to workspace

// Integration points:
// 1. WorkspaceModule imported in AppModule
// 2. WorkspaceAuthGuard applied to workspace routes
// 3. WorkspaceQueryHelper used in all data queries
// 4. Workspace context available in all requests
```

#### Board Module Integration

```typescript
// BoardModule provides:
// - BoardService: Board/List/Card CRUD operations
// - BoardController: API endpoints
// - Board/List/CardService: Business logic

// Integration points:
// 1. BoardModule imported in AppModule
// 2. All board operations scoped to workspace
// 3. Workspace membership verified before access
// 4. Activity logged for all operations
```

#### WebSocket Module Integration

```typescript
// WebSocketModule provides:
// - WebSocketGateway: Socket.IO server
// - RealtimeService: Event broadcasting
// - WebSocket authentication guard

// Integration points:
// 1. WebSocketModule imported in AppModule
// 2. Socket.IO server runs alongside REST API
// 3. JWT authentication required for connections
// 4. Workspace-based room management
```

#### Activity Module Integration

```typescript
// ActivityModule provides:
// - ActivityService: Activity logging
// - ActivityController: Activity queries

// Integration points:
// 1. ActivityModule imported in AppModule
// 2. Activity logged for all entity changes
// 3. Real-time events trigger activity logging
// 4. Activity queries scoped to workspace
```

### 3. Database Integration

#### Schema Relationships

```
User (1) ──→ (many) AuthProvider
User (1) ──→ (many) WorkspaceMember
User (1) ──→ (many) ActivityEvent

Workspace (1) ──→ (many) WorkspaceMember
Workspace (1) ──→ (many) Board
Workspace (1) ──→ (many) List
Workspace (1) ──→ (many) Card
Workspace (1) ──→ (many) ActivityEvent

Board (1) ──→ (many) List
List (1) ──→ (many) Card
```

#### Workspace Scoping

All queries include workspace filtering:

```typescript
// Example: Get all cards in a workspace
const cards = await prisma.card.findMany({
  where: {
    workspaceId: workspaceId,
    list: {
      board: {
        workspaceId: workspaceId
      }
    }
  }
});
```

## Error Handling Strategy

### Frontend Error Handling

#### Authentication Errors

```typescript
// 401 Unauthorized
// - Clear session
// - Redirect to login
// - Show error message

// 403 Forbidden
// - Show "Access Denied" message
// - Redirect to dashboard

// OAuth Errors
// - Display user-friendly error
// - Provide retry option
```

#### Network Errors

```typescript
// Connection timeout
// - Show "Connection lost" message
// - Implement retry logic
// - Queue operations for retry

// Server errors (5xx)
// - Show "Server error" message
// - Log error for debugging
// - Provide retry option
```

#### Validation Errors

```typescript
// 400 Bad Request
// - Display field-specific errors
// - Highlight invalid fields
// - Provide correction guidance
```

### Backend Error Handling

#### Authentication Errors

```typescript
// Invalid JWT
// - Return 401 Unauthorized
// - Log security event
// - Trigger re-authentication

// Expired JWT
// - Return 401 Unauthorized
// - Trigger refresh token flow
// - Redirect to login if refresh fails

// Missing JWT
// - Return 401 Unauthorized
// - Redirect to login
```

#### Authorization Errors

```typescript
// Workspace access denied
// - Return 403 Forbidden
// - Log unauthorized access attempt
// - Include userId, workspaceId, timestamp

// Insufficient permissions
// - Return 403 Forbidden
// - Log permission denial
// - Provide clear error message
```

#### Validation Errors

```typescript
// Invalid input
// - Return 400 Bad Request
// - Include field-specific errors
// - Sanitize error messages

// Missing required fields
// - Return 400 Bad Request
// - List missing fields
// - Provide schema information
```

#### Database Errors

```typescript
// Constraint violations
// - Return 400 Bad Request
// - Provide user-friendly message
// - Log technical details

// Connection failures
// - Return 503 Service Unavailable
// - Implement retry logic
// - Alert operations team
```

### Error Logging

```typescript
// Log levels:
// ERROR: Authentication failures, authorization denials, database errors
// WARN: Rate limit exceeded, deprecated API usage
// INFO: User actions, workspace operations
// DEBUG: Detailed operation information

// Log format:
// {
//   timestamp: ISO8601,
//   level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG',
//   userId: string,
//   workspaceId: string,
//   action: string,
//   details: object,
//   error?: string
// }
```

## Logging and Monitoring

### Backend Logging

#### Request Logging

```typescript
// Log all API requests:
// - Method, path, status code
// - Response time
// - User ID, workspace ID
// - Request size, response size

// Example:
// [2024-01-20 10:30:45] POST /boards 201 45ms user:123 workspace:456
```

#### Error Logging

```typescript
// Log all errors:
// - Error type, message, stack trace
// - Request context (user, workspace, endpoint)
// - Timestamp
// - Severity level

// Example:
// [ERROR] 2024-01-20 10:30:45 Workspace access denied
// userId: 123, workspaceId: 456, action: getBoard
```

#### Security Logging

```typescript
// Log security events:
// - Authentication attempts (success/failure)
// - Authorization denials
// - Rate limit violations
// - Suspicious activity

// Example:
// [SECURITY] 2024-01-20 10:30:45 Unauthorized access attempt
// userId: 123, workspaceId: 456, endpoint: /boards
```

### Frontend Monitoring

#### Error Tracking

```typescript
// Track frontend errors:
// - JavaScript errors
// - Network errors
// - Component errors
// - User actions leading to errors

// Send to error tracking service (e.g., Sentry)
```

#### Performance Monitoring

```typescript
// Monitor performance:
// - Page load time
// - API response time
// - WebSocket latency
// - Component render time

// Send to monitoring service (e.g., Datadog)
```

#### User Analytics

```typescript
// Track user behavior:
// - Login/logout events
// - Workspace creation
// - Board operations
// - Real-time collaboration

// Send to analytics service (e.g., Mixpanel)
```

### Database Monitoring

#### Connection Monitoring

```typescript
// Monitor database connections:
// - Active connections
// - Connection pool usage
// - Connection timeouts
// - Slow queries

// Alert if:
// - Connection pool exhausted
// - Query time > 1 second
// - Connection failures
```

#### Performance Monitoring

```typescript
// Monitor database performance:
// - Query execution time
// - Index usage
// - Lock contention
// - Disk I/O

// Optimize if:
// - Query time > 500ms
// - Full table scans
// - High lock contention
```

## Production Configuration

### Environment Variables

#### Backend Production (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# JWT Configuration
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=<production-client-id>
GOOGLE_CLIENT_SECRET=<production-client-secret>
GOOGLE_CALLBACK_URL=https://api.example.com/auth/google/callback

# Application Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://app.example.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=5000
```

#### Frontend Production (.env.production)

```env
VITE_API_URL=https://api.example.com
VITE_WS_URL=https://api.example.com
```

### Security Configuration

#### HTTPS/TLS

```typescript
// Production: HTTPS required
// - Use valid SSL certificates
// - Enable HSTS headers
// - Redirect HTTP to HTTPS
// - Use TLS 1.2+
```

#### CORS Configuration

```typescript
// Production: Strict CORS
// - Only allow frontend domain
// - Disable credentials if not needed
// - Whitelist specific endpoints
// - Validate origin header
```

#### Security Headers

```typescript
// Helmet configuration:
// - Content-Security-Policy
// - X-Frame-Options: DENY
// - X-Content-Type-Options: nosniff
// - X-XSS-Protection: 1; mode=block
// - Strict-Transport-Security
```

#### Rate Limiting

```typescript
// Production rate limits:
// - 100 requests per minute per user
// - 1000 requests per minute per IP
// - 10 requests per second per endpoint
// - Burst limit: 20 requests per 10 seconds
```

### Database Configuration

#### Connection Pooling

```typescript
// Production settings:
// - Min connections: 5
// - Max connections: 20
// - Connection timeout: 30 seconds
// - Idle timeout: 5 minutes
// - Validation query: SELECT 1
```

#### Backup Strategy

```typescript
// Daily backups:
// - Full backup at 2 AM UTC
// - Incremental backups every 6 hours
// - Retention: 30 days
// - Test restore weekly
```

### Monitoring and Alerting

#### Key Metrics

```typescript
// Monitor:
// - API response time (p50, p95, p99)
// - Error rate (5xx, 4xx)
// - Database query time
// - WebSocket connection count
// - Rate limit violations
// - Authentication failures
```

#### Alert Thresholds

```typescript
// Alert if:
// - Error rate > 1%
// - API response time p95 > 1 second
// - Database query time > 500ms
// - WebSocket connections > 1000
// - Rate limit violations > 10/minute
// - Authentication failures > 5/minute
```

## Complete User Flow

### 1. Initial Login

```
User visits app.example.com
  ↓
Frontend checks authentication (AuthContext)
  ↓
No valid JWT → Redirect to /login
  ↓
User clicks "Sign in with Google"
  ↓
Frontend redirects to Google OAuth
  ↓
User authenticates with Google
  ↓
Google redirects to backend callback
  ↓
Backend creates/retrieves user
  ↓
Backend generates JWT token
  ↓
Backend stores JWT in httpOnly cookie
  ↓
Backend redirects to frontend
  ↓
Frontend detects authentication
  ↓
Frontend redirects to /dashboard
```

### 2. Workspace Selection

```
User on /dashboard
  ↓
Frontend fetches user's workspaces
  ↓
WorkspaceContext displays workspace list
  ↓
User selects workspace
  ↓
WorkspaceContext stores selected workspace
  ↓
Frontend establishes WebSocket connection
  ↓
WebSocket authenticates with JWT
  ↓
WebSocket joins workspace rooms
  ↓
Frontend displays boards in workspace
```

### 3. Board Operations

```
User views board
  ↓
Frontend fetches board with lists and cards
  ↓
Frontend displays board with drag-and-drop
  ↓
User drags card to new list
  ↓
Frontend applies optimistic update
  ↓
Frontend sends update to backend
  ↓
Backend validates workspace membership
  ↓
Backend updates card position
  ↓
Backend logs activity
  ↓
Backend broadcasts update via WebSocket
  ↓
Frontend receives update
  ↓
Frontend reconciles with optimistic state
  ↓
Other users receive real-time update
```

### 4. Real-Time Collaboration

```
User A moves card
  ↓
Backend broadcasts event to workspace
  ↓
User B receives event via WebSocket
  ↓
User B's frontend updates board state
  ↓
User B sees card move in real-time
  ↓
Activity log updated for both users
  ↓
Activity feed shows action with user info
```

### 5. Logout

```
User clicks logout
  ↓
Frontend clears authentication context
  ↓
Frontend closes WebSocket connection
  ↓
Frontend clears workspace context
  ↓
Frontend clears board context
  ↓
Frontend clears activity context
  ↓
Frontend redirects to /login
  ↓
Backend clears JWT cookie
```

## Troubleshooting Guide

### Authentication Issues

#### Problem: "Invalid OAuth credentials"

**Solution:**
1. Verify Google Client ID and Secret in backend .env
2. Check Google OAuth redirect URI matches exactly
3. Ensure Google+ API is enabled in Google Cloud Console
4. Verify OAuth credentials are for "Web application" type

#### Problem: "JWT token expired"

**Solution:**
1. Check JWT_EXPIRES_IN setting (default: 1h)
2. Verify JWT_SECRET is consistent across deployments
3. Check system clock synchronization
4. Implement token refresh flow

#### Problem: "Cannot read JWT from cookies"

**Solution:**
1. Verify cookie-parser middleware is configured
2. Check HTTPS is enabled (cookies require secure flag)
3. Verify CORS credentials: true is set
4. Check browser cookie settings

### Workspace Issues

#### Problem: "Workspace not found"

**Solution:**
1. Verify workspace exists in database
2. Check user is member of workspace
3. Verify workspace ID is correct
4. Check workspace hasn't been deleted

#### Problem: "Access denied to workspace"

**Solution:**
1. Verify user is workspace member
2. Check workspace membership role
3. Verify workspace ID in request matches user's workspace
4. Check authorization guard is applied

### Real-Time Issues

#### Problem: "WebSocket connection failed"

**Solution:**
1. Verify WebSocket server is running
2. Check WebSocket URL is correct
3. Verify JWT authentication is valid
4. Check firewall allows WebSocket connections
5. Verify CORS allows WebSocket upgrades

#### Problem: "Real-time updates not received"

**Solution:**
1. Verify WebSocket connection is established
2. Check user is in correct workspace room
3. Verify event is being broadcast
4. Check browser console for errors
5. Verify event handler is registered

#### Problem: "Duplicate events received"

**Solution:**
1. Implement event deduplication by ID
2. Check event idempotency handling
3. Verify event ID is unique
4. Check for duplicate event broadcasts

### Performance Issues

#### Problem: "Slow API responses"

**Solution:**
1. Check database query performance
2. Verify indexes are created
3. Check database connection pool
4. Monitor database CPU and memory
5. Implement query caching

#### Problem: "High memory usage"

**Solution:**
1. Check for memory leaks in WebSocket connections
2. Verify connection cleanup on disconnect
3. Monitor event listener cleanup
4. Check for circular references
5. Implement garbage collection monitoring

#### Problem: "Rate limiting too strict"

**Solution:**
1. Adjust RATE_LIMIT_MAX_REQUESTS setting
2. Increase RATE_LIMIT_WINDOW_MS if needed
3. Implement per-endpoint rate limits
4. Whitelist trusted IPs if needed

### Database Issues

#### Problem: "Database connection failed"

**Solution:**
1. Verify DATABASE_URL is correct
2. Check database server is running
3. Verify network connectivity
4. Check database credentials
5. Verify SSL mode setting

#### Problem: "Connection pool exhausted"

**Solution:**
1. Increase max connections in pool
2. Check for connection leaks
3. Verify connections are being closed
4. Monitor active connections
5. Implement connection timeout

#### Problem: "Slow database queries"

**Solution:**
1. Analyze query execution plan
2. Add missing indexes
3. Optimize query structure
4. Check for N+1 queries
5. Implement query caching

### Deployment Issues

#### Problem: "Build fails on deployment"

**Solution:**
1. Check build logs for errors
2. Verify all dependencies are installed
3. Check TypeScript compilation errors
4. Verify environment variables are set
5. Check for missing files or modules

#### Problem: "Application crashes after deployment"

**Solution:**
1. Check application logs
2. Verify environment variables are correct
3. Check database migrations ran successfully
4. Verify all services are running
5. Check for resource constraints

#### Problem: "CORS errors in production"

**Solution:**
1. Verify FRONTEND_URL matches exactly
2. Check CORS configuration
3. Verify credentials: true is set
4. Check allowed headers and methods
5. Verify origin header is correct

## Conclusion

This integration guide provides comprehensive guidance for wiring all components of the multi-tenant Kanban system together. Follow the architecture overview, component integration patterns, error handling strategy, and troubleshooting guide to ensure a robust, production-ready system.

For additional support, refer to:
- QUICK_DEPLOY.md for rapid deployment
- DEPLOYMENT.md for detailed deployment instructions
- README.md for project overview
- Individual module documentation in backend/src/*/README.md
