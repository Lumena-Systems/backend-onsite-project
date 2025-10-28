#!/bin/bash

echo "🔧 Mock CRM Testing Interface - Startup Script"
echo "=============================================="
echo ""

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node 20
echo "📦 Switching to Node 20..."
nvm use 20

# Verify Node version
echo "✓ Node version: $(node --version)"
echo "✓ NPM version: $(npm --version)"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Kill any existing processes
echo "🛑 Killing existing processes..."
pkill -f "tsx|concurrently|vite" 2>/dev/null
sleep 2

# Set environment variables
export PORT=8000
export DATABASE_PATH=./database/mock-crm.db
export CORS_ORIGIN=http://localhost:3000

echo "🚀 Starting application..."
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo ""

# Start the application
npm run dev

