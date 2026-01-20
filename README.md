# Multi-Tenant Real-Time Kanban System

A secure, multi-tenant Kanban board system with real-time collaboration features built with NestJS, React, and PostgreSQL.

## Features

- 🔐 **Secure Authentication**: Google OAuth with JWT tokens in httpOnly cookies
- 🏢 **Multi-Tenant Architecture**: Complete workspace isolation and data security
- ⚡ **Real-Time Collaboration**: Live updates using WebSocket connections
- 📋 **Kanban Boards**: Drag-and-drop task management with lists and cards
- 📊 **Activity Logging**: Comprehensive audit trail of all user actions
- 🛡️ **Security First**: Input validation, rate limiting, and XSS protection

## Tech Stack

### Backend
- **NestJS** - Node.js framework with TypeScript
- **PostgreSQL** - Primary database
- **Prisma** - Database ORM and migrations
- **Socket.IO** - Real-time WebSocket communication
- **Passport.js** - Authentication middleware
- **JWT** - Token-based authentication

### Frontend
- **React** - UI framework with TypeScript
- **Vite** - Build tool and development server
- **React Router** - Client-side routing
- **dnd-kit** - Drag and drop functionality
- **Socket.IO Client** - Real-time updates

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for database)
- OpenSSL (for HTTPS certificates)

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd multi-tenant-kanban
npm run install:all
```

### 2. Start Database

```bash
docker-compose up -d postgres
```

### 3. Configure Environment

Copy environment files and update with your values:

```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration  
cp frontend/.env.example frontend/.env
```

Update `backend/.env` with:
- Google OAuth credentials
- JWT secret key
- Database connection string

### 4. Database Setup

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start Development Servers

```bash
# Start both backend and frontend
npm run dev

# Or start individually
npm run dev:backend  # Backend on https://localhost:3000
npm run dev:frontend # Frontend on https://localhost:5173
```

## Environment Configuration

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/kanban_db?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="https://localhost:3000/auth/google/callback"

# Application Configuration
NODE_ENV="development"
PORT=3000
FRONTEND_URL="https://localhost:5173"
```

### Frontend (.env)

```env
VITE_API_URL=https://localhost:3000
VITE_WS_URL=https://localhost:3000
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

## HTTPS Development

The application is configured for HTTPS-only development for security. Self-signed certificates are automatically generated in `backend/certs/`.

**Note**: Your browser will show a security warning for self-signed certificates. Click "Advanced" and "Proceed to localhost" to continue.

## Database Schema

The system uses a multi-tenant architecture with workspace-scoped data:

- **Users**: Authentication and profile information
- **Workspaces**: Tenant isolation containers
- **WorkspaceMembers**: User-workspace relationships with roles
- **Boards**: Kanban boards within workspaces
- **Lists**: Columns within boards
- **Cards**: Tasks within lists
- **ActivityEvents**: Audit log of all actions

## API Documentation

Once running, the API will be available at:
- Base URL: `https://localhost:3000`
- Health Check: `GET /`

## Security Features

- JWT tokens stored in httpOnly cookies only
- Workspace-scoped data access on every query
- Input validation and sanitization
- Rate limiting per user and endpoint
- HTTPS-only communication
- Content Security Policy headers
- XSS protection

## Development Commands

```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev
npm run dev:backend
npm run dev:frontend

# Build for production
npm run build
npm run build:backend
npm run build:frontend

# Database operations
cd backend
npx prisma migrate dev
npx prisma generate
npx prisma studio

# Docker operations
docker-compose up -d        # Start services
docker-compose down         # Stop services
docker-compose logs postgres # View logs
```

## Project Structure

```
multi-tenant-kanban/
├── backend/                 # NestJS backend
│   ├── src/                # Source code
│   ├── prisma/             # Database schema and migrations
│   ├── certs/              # HTTPS certificates
│   └── .env                # Environment variables
├── frontend/               # React frontend
│   ├── src/                # Source code
│   └── .env                # Environment variables
├── docker-compose.yml      # Database services
└── package.json           # Root package configuration
```

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new functionality
3. Update documentation for API changes
4. Ensure all security requirements are met

## License

This project is licensed under the MIT License.