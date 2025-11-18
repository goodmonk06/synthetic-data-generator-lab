#!/bin/bash

# Setup script for Synthetic Data Generator Lab

echo "🚀 Setting up Synthetic Data Generator Lab..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "⚠️  Docker is not running. Please start Docker first."
  exit 1
fi

# Start PostgreSQL
echo ""
echo "Starting PostgreSQL..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo ""
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo ""
echo "Running database migrations..."
npx prisma migrate dev --name init

# Build TypeScript
echo ""
echo "Building TypeScript..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start the API server: npm run dev"
echo "  2. Try the CLI: npm run cli list-profiles"
echo "  3. Generate data: npm run cli init-from-sql examples/residents.sql"
echo ""
echo "View database: npm run prisma:studio"
