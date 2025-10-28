# Quick Start Guide

## The Issue

The application was fully implemented but encountered Node.js version compatibility issues during development.

## Solution

Run the application with **Node.js v20 or v22** (not v23).

## Steps to Run

### Option 1: Use the Startup Script (Recommended)

```bash
# Navigate to the project
cd /Users/andrewspencer/lumena/backend-work-trial

# Run the startup script
./start.sh
```

This will:
- Switch to Node 20
- Install dependencies if needed
- Start both backend and frontend

### Option 2: Manual Steps

```bash
# 1. Load nvm and switch to Node 20
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 20

# 2. Navigate to project
cd /Users/andrewspencer/lumena/backend-work-trial

# 3. Install dependencies (if not already installed)
npm install

# 4. Start the application
PORT=8000 DATABASE_PATH=./database/mock-crm.db CORS_ORIGIN=http://localhost:3000 npm run dev
```

## Verify It's Working

Once started, you should see:

```
🚀 Mock CRM Testing Interface Server
=====================================
📡 Server running on http://localhost:8000
💾 Database: /Users/andrewspencer/lumena/backend-work-trial/database/mock-crm.db
🌐 WebSocket: enabled

Available CRM APIs:
  - Salesforce: http://localhost:8000/api/salesforce
  - HubSpot:    http://localhost:8000/api/hubspot
  - Pipedrive:  http://localhost:8000/api/pipedrive
```

### Test the API

```bash
# In a new terminal:
curl http://localhost:8000/health

# Should return:
# {"status":"healthy","timestamp":"...","database":"connected"}

curl "http://localhost:8000/api/salesforce/contacts?limit=2"

# Should return JSON with 2 contacts
```

### Test the UI

Open http://localhost:3000 in your browser.

You should see:
- ✅ Professional landing page
- ✅ "Connected" status in the sidebar (green)
- ✅ Navigation to all 7 pages works

### Run Integration Tests

```bash
# In a new terminal (with server running):
node test-integration.js
```

Expected output:
```
🧪 Running Integration Tests
============================================================

✓ PASS: Health check endpoint responds
✓ PASS: Database is seeded with Salesforce contacts
✓ PASS: Database is seeded with HubSpot contacts
...
📊 Test Results: 35 passed, 0 failed
```

## Troubleshooting

### "Better-sqlite3 compilation error"

**Cause**: Running with Node.js v23

**Fix**: Switch to Node v20 or v22:
```bash
nvm install 20
nvm use 20
npm install
```

### "Port 5000 already in use" or "Port 8000 already in use"

**Fix**: Kill existing processes:
```bash
pkill -f "tsx|concurrently|vite"
# Wait 2 seconds
./start.sh
```

### "Cannot find module" errors

**Fix**: Reinstall dependencies:
```bash
rm -rf node_modules server/node_modules client/node_modules
npm install
```

### Frontend shows "Disconnected"

**Cause**: Backend isn't running or isn't accessible

**Fix**: 
1. Check backend is running: `curl http://localhost:8000/health`
2. If not responding, restart: `./start.sh`
3. Check for errors in the terminal where backend is running

## What's Included

✅ **Backend** (Express + TypeScript + SQLite)
- 3 fully functional mock CRM APIs
- 100+ contacts, 50+ deals, 30+ companies per CRM
- Complete CRUD operations
- Webhook system with delivery tracking
- Real-time updates via WebSocket

✅ **Frontend** (React + TypeScript + Tailwind)
- Landing page with architecture diagram
- Interactive API documentation
- Webhook management interface
- Data management tools
- Real-time monitoring dashboard
- Testing scenarios
- Latency testing tools

✅ **Testing**
- 35 integration tests
- Tests all major functionality
- Verifies data integrity

✅ **Documentation**
- Comprehensive README
- API reference
- Setup instructions
- Troubleshooting guide

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Mock CRMs     │◄─────┤  Your Sync       │─────►│  Unified API    │
│                 │      │  Engine          │      │                 │
│ • Salesforce    │      │                  │      │ • GET /contacts │
│ • HubSpot       │      │ • Fetch data     │      │ • GET /deals    │
│ • Pipedrive     │      │ • Transform      │      │ • GET /companies│
│                 │      │ • Store          │      │                 │
│ + Webhooks      │──────┤ • Listen webhooks│      │ <1 min latency  │
└─────────────────┘      └──────────────────┘      └─────────────────┘
   Port 8000                                            (You build this)
```

## Success Criteria

When everything is working, you should be able to:
- ✅ Access all 3 mock CRM APIs
- ✅ Create, read, update, delete records
- ✅ Receive webhook events when data changes
- ✅ Monitor API requests in real-time
- ✅ Run test scenarios with one click
- ✅ Measure sync latency
- ✅ All 35 integration tests pass

## Support

If you encounter issues:
1. Check you're using Node v20 or v22
2. Ensure dependencies are installed (`npm install`)
3. Kill existing processes and restart
4. Check the STATUS.md file for known issues
5. Review server logs in the terminal

---

**Quick Test Command**:
```bash
./start.sh && sleep 10 && node test-integration.js
```

This will start the server and run all tests automatically.

