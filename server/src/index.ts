import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/schema';
import { seedDatabase } from './database/seed';
import { WebhookDeliveryService } from './services/webhook-delivery';
import { createRequestLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { createCRMRouter } from './routes/crm';
import { createWebhookRouter } from './routes/webhooks';
import { createTestingRouter } from './routes/testing';
import { createMonitoringRouter } from './routes/monitoring';
import { setupWebSocket } from './websocket';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8000;
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../database/mock-crm.db');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize WebSocket
const { emitEvent } = setupWebSocket(server);

// Initialize database
console.log('🔧 Initializing database...');
const db = initializeDatabase(DATABASE_PATH);

// Check if database is empty, seed if needed
const countStmt = db.prepare('SELECT COUNT(*) as count FROM salesforce_contacts');
const result = countStmt.get() as { count: number };

if (result.count === 0) {
  seedDatabase(db, {
    contactsPerCRM: parseInt(process.env.SEED_CONTACTS_PER_CRM || '100'),
    dealsPerCRM: parseInt(process.env.SEED_DEALS_PER_CRM || '50'),
    companiesPerCRM: parseInt(process.env.SEED_COMPANIES_PER_CRM || '30'),
  });
}

// Initialize services
const webhookService = new WebhookDeliveryService(db);

// Error simulation state
const errorSimulation = {
  rateLimitEnabled: false,
  errorsEnabled: false,
};

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(helmet({
  contentSecurityPolicy: false, // Allow for development
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(createRequestLogger({
  db,
  emitLog: (log) => {
    emitEvent({
      type: 'api_request',
      data: log,
      timestamp: new Date().toISOString(),
    });
  },
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected',
  });
});

// API Routes
app.use('/api/:crm/:resource', createCRMRouter({
  db,
  webhookService,
  emitEvent: (event) => {
    emitEvent({
      type: event.type,
      data: event.data,
      timestamp: new Date().toISOString(),
    });
  },
  errorSimulation,
}));

// Webhook routes
app.use('/webhooks', createWebhookRouter({ db, webhookService }));

// Testing routes
app.use('/testing', createTestingRouter({ db, webhookService, emitEvent: (event) => {
  emitEvent({
    type: event.type,
    data: event.data,
    timestamp: new Date().toISOString(),
  });
}, errorSimulation }));

// Monitoring routes
app.use('/monitoring', createMonitoringRouter({ db }));

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.close();
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log('');
  console.log('🚀 Mock CRM Testing Interface Server');
  console.log('=====================================');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`💾 Database: ${DATABASE_PATH}`);
  console.log(`🌐 WebSocket: enabled`);
  console.log('');
  console.log('Available CRM APIs:');
  console.log(`  - Salesforce: http://localhost:${PORT}/api/salesforce`);
  console.log(`  - HubSpot:    http://localhost:${PORT}/api/hubspot`);
  console.log(`  - Pipedrive:  http://localhost:${PORT}/api/pipedrive`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

export { app, server, db };

