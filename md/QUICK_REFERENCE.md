# Quick Reference Guide

Fast lookup for common tasks and procedures.

## Table of Contents

1. [Deployment](#deployment)
2. [Configuration](#configuration)
3. [Common Commands](#common-commands)
4. [Troubleshooting](#troubleshooting)
5. [Security Checklist](#security-checklist)
6. [Performance Tuning](#performance-tuning)

## Deployment

### 30-Minute Deployment

```bash
# 1. Database (Neon)
# - Go to neon.tech
# - Create project
# - Copy connection string

# 2. Google OAuth
# - Go to console.cloud.google.com
# - Create OAuth credentials
# - Copy Client ID and Secret

# 3. Backend (Render)
# - Deploy backend folder
# - Set environment variables
# - Run migrations

# 4. Frontend (Vercel)
# - Deploy frontend folder
# - Set environment variables

# 5. Final Configuration
# - Update OAuth redirect URI
# - Update CORS configuration
# - Test application
```

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=1h
GOOGLE_CLIENT_ID=<from-google>
GOOGLE_CLIENT_SECRET=<from-google>
GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/auth/google/callback
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend.vercel.app
```

**Frontend (.env.production)**
```env
VITE_API_URL=https://your-backend.onrender.com
VITE_WS_URL=https://your-backend.onrender.com
```

## Configuration

### JWT Configuration

```typescript
// Token expiration
JWT_EXPIRES_IN=1h          // Access token
JWT_REFRESH_EXPIRES_IN=7d  // Refresh token

// Generate strong secret
openssl rand -base64 32
```

### Rate Limiting

```typescript
// Per user, per minute
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

// Per endpoint
GET /boards: 100 requests/minute
POST /boards: 50 requests/minute
PUT /boards/:id: 50 requests/minute
DELETE /boards/:id: 20 requests/minute
```

### Database Connection Pool

```typescript
// Prisma connection pool
min: 5
max: 20
timeout: 30s
idle_timeout: 5m
```

### WebSocket Configuration

```typescript
// Socket.IO settings
ping_interval: 30s
ping_timeout: 5s
max_connections: 1000
```

## Common Commands

### Development

```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Start database
npm run db:start

# Stop database
npm run db:stop
```

### Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Reset database
cd backend && npx prisma migrate reset
```

### Testing

```bash
# Run unit tests
cd backend && npm test

# Run integration tests
cd backend && npm run test:e2e

# Run with coverage
cd backend && npm run test:cov

# Watch mode
cd backend && npm run test:watch
```

### Build and Deploy

```bash
# Build all
npm run build

# Build backend
npm run build:backend

# Build frontend
npm run build:frontend

# Start production backend
cd backend && npm run start:prod
```

### Linting and Formatting

```bash
# Lint backend
cd backend && npm run lint

# Format backend
cd backend && npm run format

# Lint frontend
cd frontend && npm run lint
```

## Troubleshooting

### Authentication Issues

| Problem | Solution |
|---------|----------|
| "Invalid OAuth credentials" | Verify Google Client ID/Secret in .env |
| "JWT token expired" | Check JWT_EXPIRES_IN setting |
| "Cannot read JWT from cookies" | Verify HTTPS is enabled |
| "OAuth redirect URI mismatch" | Update Google OAuth redirect URI |

### Workspace Issues

| Problem | Solution |
|---------|----------|
| "Workspace not found" | Verify workspace exists and user is member |
| "Access denied to workspace" | Check workspace membership |
| "Cross-workspace data leak" | Verify workspace filtering in queries |

### Real-Time Issues

| Problem | Solution |
|---------|----------|
| "WebSocket connection failed" | Verify WebSocket server is running |
| "Real-time updates not received" | Check WebSocket connection status |
| "Duplicate events received" | Implement event deduplication |

### Database Issues

| Problem | Solution |
|---------|----------|
| "Database connection failed" | Verify DATABASE_URL and network connectivity |
| "Connection pool exhausted" | Increase max connections or check for leaks |
| "Slow queries" | Add indexes or optimize query |

### Performance Issues

| Problem | Solution |
|---------|----------|
| "High memory usage" | Check for memory leaks or connection leaks |
| "Slow API responses" | Optimize database queries or add caching |
| "Rate limiting too strict" | Increase RATE_LIMIT_MAX_REQUESTS |

## Security Checklist

### Pre-Deployment

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] Google OAuth credentials are correct
- [ ] HTTPS is enabled
- [ ] CORS is configured correctly
- [ ] Security headers are set
- [ ] Input validation is enabled
- [ ] Rate limiting is enabled
- [ ] Workspace isolation is verified
- [ ] All tests pass
- [ ] Security review is approved

### Post-Deployment

- [ ] Application is accessible
- [ ] Authentication works
- [ ] Workspace isolation works
- [ ] Real-time updates work
- [ ] No errors in logs
- [ ] Monitoring is enabled
- [ ] Alerts are configured
- [ ] Backups are running

## Performance Tuning

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_workspace_member_user ON workspace_member(user_id);
CREATE INDEX idx_board_workspace ON board(workspace_id);
CREATE INDEX idx_list_board ON list(board_id);
CREATE INDEX idx_card_list ON card(list_id);
CREATE INDEX idx_activity_workspace ON activity_event(workspace_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM card WHERE list_id = '...';

-- Check index usage
SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan DESC;
```

### Connection Pool Tuning

```typescript
// Increase pool size for high concurrency
max_connections: 30  // Default: 20

// Adjust timeouts
connection_timeout: 60s  // Default: 30s
idle_timeout: 10m        // Default: 5m
```

### WebSocket Optimization

```typescript
// Reduce ping interval for faster detection
ping_interval: 15s  // Default: 30s

// Increase connection limit
max_connections: 2000  // Default: 1000
```

### Frontend Optimization

```typescript
// Enable code splitting
// Enable lazy loading
// Optimize bundle size
// Enable compression
// Enable caching
```

## Monitoring

### Key Metrics to Monitor

```
API Response Time (p50, p95, p99)
Error Rate (by status code)
Database Query Time
WebSocket Connections
Rate Limit Violations
Authentication Failures
Memory Usage
CPU Usage
Disk Usage
```

### Alert Thresholds

```
Error Rate > 1%
API Response Time p95 > 1s
Database Query Time > 500ms
WebSocket Connections > 1000
Rate Limit Violations > 10/min
Authentication Failures > 5/min
Memory Usage > 80%
CPU Usage > 80%
Disk Usage > 80%
```

## Useful Links

- **Neon**: https://neon.tech
- **Google Cloud Console**: https://console.cloud.google.com
- **Render**: https://render.com
- **Vercel**: https://vercel.com
- **NestJS Docs**: https://docs.nestjs.com
- **React Docs**: https://react.dev
- **Prisma Docs**: https://www.prisma.io/docs
- **Socket.IO Docs**: https://socket.io/docs

## Support

For detailed information, refer to:
- QUICK_DEPLOY.md - Rapid deployment
- DEPLOYMENT.md - Detailed deployment
- SYSTEM_INTEGRATION.md - Component integration
- PRODUCTION_CHECKLIST.md - Pre-deployment verification
- SECURITY_VERIFICATION.md - Security testing
- LOGGING_MONITORING.md - Logging and monitoring

---

**Last Updated**: 2024-01-20
**Version**: 1.0
