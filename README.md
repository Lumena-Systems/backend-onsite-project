# Mock CRM Testing Interface

A production-quality web application that provides fully functional mock CRM APIs (Salesforce, HubSpot, Pipedrive) with webhook infrastructure, real-time monitoring, and comprehensive testing tools for evaluating sync engine implementations.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18, v20, or v22 recommended - **Note: v23 has compatibility issues with better-sqlite3**)
- npm (v9 or higher)

### Installation

```bash
# Install all dependencies
npm install

# This will install dependencies for all workspaces (server, client, shared)
```

### Running the Application

```bash
# Start both backend and frontend in development mode
npm run dev
```

This will start:
- **Backend Server**: http://localhost:8000
- **Frontend UI**: http://localhost:3000

**Note**: We use port 8000 for the backend because macOS Control Center uses port 5000 by default.

The application will automatically open in your default browser.

## 📁 Project Structure

```
backend-work-trial/
├── server/          # Express backend with mock CRM APIs
├── client/          # React frontend application
├── shared/          # Shared TypeScript types
├── database/        # SQLite database files (auto-created)
└── package.json     # Root workspace configuration
```

## 🎯 Features

### Mock CRM APIs

Three fully functional CRM APIs with realistic data:

- **Salesforce**: `http://localhost:5000/api/salesforce`
- **HubSpot**: `http://localhost:5000/api/hubspot`
- **Pipedrive**: `http://localhost:5000/api/pipedrive`

Each CRM provides:
- ✅ REST APIs for Contacts, Deals, and Companies
- ✅ Full CRUD operations (GET, POST, PUT, DELETE)
- ✅ Pagination with `limit` and `offset`
- ✅ Incremental sync via `updated_since` parameter
- ✅ Multi-field filtering
- ✅ Realistic mock data (100+ contacts, 50+ deals, 30+ companies per CRM)
- ✅ Different field naming conventions per CRM

### Webhook System

- Automatic webhook events on data changes
- Configurable webhook URLs per CRM
- HMAC-SHA256 signature verification
- Manual webhook triggering
- Delivery tracking with retry logic
- Complete delivery history

### Real-Time Monitoring

- Live API request logs via WebSocket
- Performance metrics dashboard
- Request/response tracking
- Error rate monitoring
- Webhook delivery success rate
- Timeline view of all events

### Testing Tools

**Pre-built Scenarios:**
- Create 5 Contacts in Salesforce
- Update 3 Deals in HubSpot
- Bulk Update: 25 Records
- Simulate Rate Limiting
- Simulate API Errors
- Rapid Changes (real-time testing)
- Delete Records

**Latency Testing:**
- Measure sync performance
- Track time from CRM change to unified API sync
- Color-coded latency indicators
- Historical latency tracking
- Average latency calculation

## 🔌 API Reference

### Base URLs

```
Salesforce:  http://localhost:8000/api/salesforce
HubSpot:     http://localhost:8000/api/hubspot
Pipedrive:   http://localhost:8000/api/pipedrive
```

### Endpoints

All three CRMs support the same endpoint structure:

```
GET    /api/{crm}/contacts        # List contacts
GET    /api/{crm}/contacts/{id}   # Get single contact
POST   /api/{crm}/contacts        # Create contact
PUT    /api/{crm}/contacts/{id}   # Update contact
DELETE /api/{crm}/contacts/{id}   # Delete contact

# Same endpoints available for 'deals' and 'companies'
```

### Query Parameters

- `limit` - Number of records (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)
- `updated_since` - ISO 8601 timestamp for incremental sync
- Any field name for filtering (e.g., `?email=john@example.com`)

### Example Requests

**List contacts with pagination:**
```bash
curl http://localhost:5000/api/salesforce/contacts?limit=10&offset=0
```

**Incremental sync (get updates since timestamp):**
```bash
curl http://localhost:5000/api/hubspot/contacts?updated_since=2024-01-20T10:00:00Z
```

**Create a contact:**
```bash
curl -X POST http://localhost:5000/api/pipedrive/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "first_name": "Jane",
    "last_name": "Doe"
  }'
```

## 🎨 Schema Differences

Each CRM uses different field naming conventions (as real CRMs do):

**Salesforce:**
```json
{
  "Email": "string",
  "FirstName": "string",
  "LastName": "string",
  "Phone": "string",
  "AccountId": "string"
}
```

**HubSpot:**
```json
{
  "email_address": "string",
  "firstname": "string",
  "lastname": "string",
  "phone_number": "string",
  "company_id": "string"
}
```

**Pipedrive:**
```json
{
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "phone": "string",
  "organization_id": "string"
}
```

## 🪝 Webhooks

### Configuration

Webhooks can be configured via the UI at http://localhost:3000/webhooks or via API:

```bash
# Update webhook configuration
curl -X PUT http://localhost:5000/webhooks/config/salesforce \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "http://your-server.com/webhooks",
    "enabled": true
  }'
```

### Webhook Payload

```json
{
  "event_type": "contact.created",
  "crm": "salesforce",
  "timestamp": "2024-01-20T15:30:00Z",
  "data": {
    "id": "uuid",
    "Email": "new@example.com",
    ...
  }
}
```

### Webhook Headers

```
Content-Type: application/json
X-Webhook-Signature: <HMAC-SHA256 signature>
X-Webhook-Timestamp: <Unix timestamp>
X-Webhook-Event: contact.created
X-Webhook-CRM: salesforce
```

## 🧪 Testing Your Sync Engine

### Step 1: Configure Webhooks

1. Navigate to http://localhost:3000/webhooks
2. Set your webhook URL (where your sync engine will receive events)
3. Enable webhooks for the CRMs you want to test

### Step 2: Run Test Scenarios

1. Go to http://localhost:3000/scenarios
2. Run "Create 5 Contacts in Salesforce"
3. Verify your sync engine receives the webhooks and syncs the data

### Step 3: Measure Latency

1. Go to http://localhost:3000/latency
2. Click "Start Latency Test"
3. Watch your unified API for the test record
4. Click "Verify Sync Complete" when you see it
5. Aim for <60 seconds (target: <30 seconds)

### Step 4: Test Edge Cases

- Run "Simulate Rate Limiting" to test retry logic
- Run "Simulate API Errors" to test error handling
- Run "Bulk Update" to test performance under load

## 📊 Monitoring

The monitoring dashboard (http://localhost:3000/monitoring) shows:

- **Total API Requests**: All requests to mock CRMs
- **Average Response Time**: Performance metrics
- **Error Rate**: Percentage of failed requests
- **Webhook Success Rate**: Delivery success percentage
- **Live Request Logs**: Real-time feed of all API calls
- **Request Distribution**: Breakdown by CRM and resource type

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_PATH=./database/mock-crm.db

# Data Generation
SEED_CONTACTS_PER_CRM=100
SEED_DEALS_PER_CRM=50
SEED_COMPANIES_PER_CRM=30

# Webhooks
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=1000

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🐛 Troubleshooting

### Database Issues

If you encounter database errors, delete the database file and restart:

```bash
rm -rf database/
npm run dev
```

The database will be recreated with fresh seed data.

### Port Already in Use

If port 5000 or 3000 is in use, update the ports:

1. Change `PORT` in `.env` for the backend
2. Update `server.port` in `client/vite.config.ts` for the frontend
3. Update `API_BASE` in `client/src/utils/api.ts`

### WebSocket Connection Issues

Ensure both the frontend and backend are running. The WebSocket connection is established automatically when the frontend loads.

## 🏗️ Architecture

### Backend (Express + TypeScript + SQLite)

- **Express Server**: RESTful API endpoints
- **SQLite Database**: Persistent storage with better-sqlite3
- **WebSocket**: Real-time updates via socket.io
- **Faker.js**: Realistic mock data generation
- **Webhook Delivery**: Async webhook sending with retry logic

### Frontend (React + TypeScript + Tailwind)

- **React 18**: Modern UI with hooks
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling
- **Headless UI**: Accessible components
- **Socket.io Client**: Real-time updates
- **Prism.js**: Syntax highlighting for code examples

### Shared Types

TypeScript types shared between frontend and backend for type safety.

## 📝 API Health Check

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T15:30:00Z",
  "database": "connected"
}
```

## 🎓 Challenge Requirements

Your sync engine should:

1. ✅ Fetch data from all three mock CRM APIs
2. ✅ Transform data into a unified schema
3. ✅ Handle different field naming conventions
4. ✅ Support incremental sync using `updated_since`
5. ✅ Listen to webhook events for real-time updates
6. ✅ Sync changes within <1 minute (target: <30 seconds)
7. ✅ Handle pagination for large datasets
8. ✅ Gracefully handle rate limits (429) and errors (500)
9. ✅ Support filtering and querying
10. ✅ Provide a consistent API regardless of source CRM

## 📞 Support

For questions or issues with the mock CRM interface, please check:

- This README for configuration and usage
- The API Documentation page in the UI
- The browser console for client-side errors
- The server logs for backend errors

## 🎉 Success Criteria

Your implementation is successful when:

- ✅ You can fetch data from all three mock CRMs
- ✅ Your unified API provides a consistent schema
- ✅ Latency tests show <60 second sync times
- ✅ Your system handles bulk updates efficiently
- ✅ Error scenarios (rate limits, API failures) are handled gracefully
- ✅ Webhook events trigger immediate syncs

Good luck with your implementation! 🚀

