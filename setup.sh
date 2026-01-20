#!/bin/bash

echo "🚀 Setting up Multi-Tenant Kanban System..."

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Start database
echo "🐘 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd backend && npx prisma generate

# Create database migration (optional - will fail if no database connection)
echo "📊 Creating database migration (optional)..."
cd backend && npx prisma migrate dev --name init || echo "⚠️  Database migration skipped - ensure PostgreSQL is running"

echo "✅ Setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Update backend/.env with your Google OAuth credentials"
echo "2. Start the development servers: npm run dev"
echo "3. Visit https://localhost:5173 (frontend) and https://localhost:3000 (backend)"
echo ""
echo "📚 See README.md for detailed setup instructions"