# Deployment Architecture

Visual overview of your production deployment.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   Vercel     │ │   Render     │ │    Neon      │
        │  (Frontend)  │ │  (Backend)   │ │  (Database)  │
        └──────────────┘ └──────────────┘ └──────────────┘
                │             │             │
                │             │             │
        ┌───────▼─────────────▼─────────────▼────────┐
        │                                             │
        │         Your Application                   │
        │                                             │
        │  ┌─────────────────────────────────────┐  │
        │  │  React Frontend (Vercel)            │  │
        │  │  - Vite build                       │  │
        │  │  - Real-time WebSocket client       │  │
        │  │  - Google OAuth integration         │  │
        │  └─────────────────────────────────────┘  │
        │                  │                         │
        │                  │ HTTPS                   │
        │                  │                         │
        │  ┌───────────────▼──────────────────────┐ │
        │  │  NestJS Backend (Render)             │ │
        │  │  - REST API                          │ │
        │  │  - WebSocket Gateway                 │ │
        │  │  - JWT Authentication                │ │
        │  │  - Workspace Isolation               │ │
        │  │  - Activity Logging                  │ │
        │  └───────────────┬──────────────────────┘ │
        │                  │                         │
        │                  │ SSL/TLS                 │
        │                  │                         │
        │  ┌───────────────▼──────────────────────┐ │
        │  │  PostgreSQL Database (Neon)          │ │
        │  │  - Workspaces                        │ │
        │  │  - Users                             │ │
        │  │  - Boards                            │ │
        │  │  - Lists                             │ │
        │  │  - Cards                             │ │
        │  │  - Activity Logs                     │ │
        │  └──────────────────────────────────────┘ │
        │                                             │
        └─────────────────────────────────────────────┘
```

---

## Data Flow

### Authentication Flow

```
User Browser
    │
    ├─ Click "Sign in with Google"
    │
    ▼
Frontend (Vercel)
    │
    ├─ Redirect to Google OAuth
    │
    ▼
Google OAuth
    │
    ├─ User authenticates
    │
    ▼
Backend (Render)
    │
    ├─ Receive OAuth code
    ├─ Exchange for access token
    ├─ Get user info from Google
    ├─ Create/retrieve user in database
    ├─ Generate JWT token
    ├─ Set httpOnly cookie
    │
    ▼
Frontend (Vercel)
    │
    ├─ Receive JWT in cookie
    ├─ Store in memory
    ├─ Redirect to dashboard
    │
    ▼
User Dashboard
```

### Real-Time Update Flow

```
User A (Browser Tab 1)
    │
    ├─ Create card
    │
    ▼
Frontend (Vercel)
    │
    ├─ Send POST /boards/:id/cards
    │
    ▼
Backend (Render)
    │
    ├─ Validate request
    ├─ Create card in database
    ├─ Broadcast WebSocket event to room
    │
    ▼
WebSocket Gateway
    │
    ├─ Send update to all connected clients in workspace
    │
    ▼
User A (Browser Tab 1)          User B (Browser Tab 2)
    │                                   │
    ├─ Receive WebSocket update        ├─ Receive WebSocket update
    ├─ Update local state              ├─ Update local state
    ├─ Re-render UI                    ├─ Re-render UI
    │                                   │
    ▼                                   ▼
Card appears in Tab 1           Card appears in Tab 2
```

---

## Deployment Topology

### Free Tier (Development/MVP)

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Free)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Frontend                                        │  │
│  │  - Deployed on every push to main               │  │
│  │  - Global CDN                                   │  │
│  │  - Automatic HTTPS                             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
                        │ HTTPS
                        │
┌─────────────────────────────────────────────────────────┐
│                    RENDER (Free)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Backend                                         │  │
│  │  - Sleeps after 15 min inactivity               │  │
│  │  - First request takes ~30 seconds              │  │
│  │  - 750 hours/month                              │  │
│  │  - Automatic HTTPS                             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
                        │ SSL/TLS
                        │
┌─────────────────────────────────────────────────────────┐
│                    NEON (Free)                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                            │  │
│  │  - 512 MB storage                               │  │
│  │  - 1 GB data transfer                           │  │
│  │  - Automatic backups (paid plans)               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Paid Tier (Production)

```
┌─────────────────────────────────────────────────────────┐
│                  VERCEL PRO ($20/mo)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Frontend                                        │  │
│  │  - Deployed on every push to main               │  │
│  │  - Global CDN                                   │  │
│  │  - Automatic HTTPS                             │  │
│  │  - 1 TB bandwidth                               │  │
│  │  - Advanced analytics                           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
                        │ HTTPS
                        │
┌─────────────────────────────────────────────────────────┐
│              RENDER STARTER ($7/mo)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Backend                                         │  │
│  │  - Always-on (no sleeping)                      │  │
│  │  - 0.5 CPU                                      │  │
│  │  - 512 MB RAM                                   │  │
│  │  - Automatic HTTPS                             │  │
│  │  - Better performance                           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
                        │ SSL/TLS
                        │
┌─────────────────────────────────────────────────────────┐
│               NEON PRO ($19/mo)                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                            │  │
│  │  - 10 GB storage                                │  │
│  │  - Automatic backups                            │  │
│  │  - Better performance                           │  │
│  │  - Point-in-time recovery                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Network Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      INTERNET                                │
└──────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   Vercel     │ │   Render     │ │    Neon      │
        │   Frontend   │ │   Backend    │ │   Database   │
        │              │ │              │ │              │
        │ HTTPS        │ │ HTTPS        │ │ SSL/TLS      │
        │ Port 443     │ │ Port 443     │ │ Port 5432    │
        └──────────────┘ └──────────────┘ └──────────────┘
                │             │             │
                │             │             │
                └─────────────┼─────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Your Application │
                    │                   │
                    │  - REST API       │
                    │  - WebSocket      │
                    │  - Database       │
                    │                   │
                    └───────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                       │
└─────────────────────────────────────────────────────────┘

Layer 1: HTTPS/TLS
├─ All traffic encrypted in transit
├─ Automatic certificates (Vercel/Render)
└─ SSL/TLS 1.2+

Layer 2: Authentication
├─ Google OAuth 2.0
├─ JWT tokens (httpOnly cookies)
├─ Token expiration (1 hour)
└─ Token refresh (7 days)

Layer 3: Authorization
├─ Workspace membership verification
├─ Role-based access control
├─ Cross-workspace isolation
└─ 403 Forbidden for unauthorized access

Layer 4: Input Validation
├─ DTO validation (class-validator)
├─ Input sanitization
├─ XSS prevention
└─ SQL injection prevention (Prisma ORM)

Layer 5: Rate Limiting
├─ Request rate limiting
├─ Connection limits
├─ Burst protection
└─ DDoS mitigation

Layer 6: Database Security
├─ SSL/TLS connection
├─ Connection pooling
├─ Parameterized queries
└─ Encrypted at rest (Neon)
```

---

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────┐
│              MONITORING ARCHITECTURE                    │
└─────────────────────────────────────────────────────────┘

Frontend (Vercel)
├─ Vercel Analytics
│  ├─ Page views
│  ├─ Response times
│  ├─ Error rate
│  └─ User sessions
└─ Browser Console
   ├─ JavaScript errors
   ├─ Network errors
   └─ WebSocket errors

Backend (Render)
├─ Render Logs
│  ├─ Application logs
│  ├─ Error logs
│  ├─ Request logs
│  └─ WebSocket logs
└─ Metrics
   ├─ CPU usage
   ├─ Memory usage
   ├─ Request rate
   └─ Error rate

Database (Neon)
├─ Neon Dashboard
│  ├─ Connection count
│  ├─ Query performance
│  ├─ Storage usage
│  └─ Data transfer
└─ Logs
   ├─ Slow queries
   ├─ Connection errors
   └─ Lock contention
```

---

## Scaling Strategy

### Current (Free Tier)

```
Users: 1-10
├─ Vercel: Free tier sufficient
├─ Render: Free tier (with sleep)
└─ Neon: Free tier (512 MB)

Bottleneck: Backend sleeping after 15 min
Solution: Upgrade Render to Starter ($7/mo)
```

### Growth Phase (Paid Tier)

```
Users: 10-100
├─ Vercel Pro: $20/mo
├─ Render Starter: $7/mo (always-on)
└─ Neon Pro: $19/mo (10 GB storage)

Bottleneck: Database performance
Solution: Upgrade Neon to higher tier
```

### Scale Phase (Enterprise)

```
Users: 100+
├─ Vercel Pro: $20/mo
├─ Render Standard: $12/mo (1 CPU)
├─ Neon Business: $99/mo (100 GB storage)
└─ Add: Redis cache, CDN, monitoring

Bottleneck: Multiple services
Solution: Implement caching, optimize queries
```

---

## Disaster Recovery

### Backup Strategy

```
Database Backups
├─ Neon (Free): Manual export
│  └─ pg_dump $DATABASE_URL > backup.sql
├─ Neon (Pro): Automatic daily backups
│  └─ 7-day retention
└─ Neon (Business): Automatic hourly backups
   └─ 30-day retention

Code Backups
├─ GitHub repository
├─ Tag releases: git tag -a v1.0.0
└─ Push tags: git push origin v1.0.0
```

### Recovery Procedures

```
Frontend Down
├─ Check Vercel dashboard
├─ Check build logs
├─ Rollback to previous deployment
└─ Redeploy

Backend Down
├─ Check Render logs
├─ Check database connection
├─ Restart service
└─ Redeploy if needed

Database Down
├─ Check Neon dashboard
├─ Verify connection string
├─ Restore from backup
└─ Verify data integrity
```

---

## Performance Optimization

```
Frontend Optimization
├─ Code splitting (Vite)
├─ Lazy loading (React Router)
├─ Image optimization
├─ CSS minification
├─ JavaScript minification
└─ Caching (Vercel CDN)

Backend Optimization
├─ Database query optimization
├─ Connection pooling
├─ Caching (Redis - optional)
├─ Compression (gzip)
├─ Rate limiting
└─ WebSocket optimization

Database Optimization
├─ Indexes on frequently queried columns
├─ Query optimization
├─ Connection pooling
├─ Slow query monitoring
└─ Vacuum and analyze
```

---

## Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] Database deployed to Neon
- [ ] HTTPS enabled on all services
- [ ] SSL/TLS certificates valid
- [ ] Environment variables configured
- [ ] OAuth redirect URIs updated
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Disaster recovery plan ready
- [ ] Team trained on deployment
- [ ] Documentation complete

---

## URLs & Endpoints

### Production URLs

```
Frontend: https://kanban-app-xxx.vercel.app
Backend: https://kanban-backend-xxx.onrender.com
Database: postgresql://...@neon.tech/...
```

### API Endpoints

```
GET    /health                    - Health check
POST   /auth/google/callback      - OAuth callback
GET    /workspaces               - List workspaces
POST   /workspaces               - Create workspace
GET    /workspaces/:id/boards    - List boards
POST   /workspaces/:id/boards    - Create board
WS     /                         - WebSocket connection
```

---

## Support & Escalation

```
Issue Level 1: Frontend
├─ Check browser console
├─ Check network tab
├─ Check Vercel logs
└─ Redeploy if needed

Issue Level 2: Backend
├─ Check Render logs
├─ Check database connection
├─ Check environment variables
└─ Restart service

Issue Level 3: Database
├─ Check Neon dashboard
├─ Check connection pool
├─ Check storage usage
└─ Restore from backup

Issue Level 4: Infrastructure
├─ Contact Vercel support
├─ Contact Render support
├─ Contact Neon support
└─ Escalate to DevOps team
```

---

**Last Updated**: January 21, 2026

**Version**: 1.0

**Status**: ✅ Production Ready

