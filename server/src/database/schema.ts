import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export function initializeDatabase(dbPath: string): Database.Database {
  // Ensure database directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  createTables(db);
  
  return db;
}

function createTables(db: Database.Database) {
  // Salesforce Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS salesforce_contacts (
      id TEXT PRIMARY KEY,
      Email TEXT NOT NULL,
      FirstName TEXT NOT NULL,
      LastName TEXT NOT NULL,
      Phone TEXT,
      AccountId TEXT,
      OwnerId TEXT,
      Title TEXT,
      Department TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS salesforce_deals (
      id TEXT PRIMARY KEY,
      Name TEXT NOT NULL,
      Amount REAL NOT NULL,
      Stage TEXT NOT NULL,
      CloseDate TEXT NOT NULL,
      ContactId TEXT,
      AccountId TEXT,
      Probability INTEGER,
      Description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS salesforce_companies (
      id TEXT PRIMARY KEY,
      Name TEXT NOT NULL,
      Industry TEXT,
      Phone TEXT,
      Website TEXT,
      NumberOfEmployees INTEGER,
      AnnualRevenue REAL,
      BillingStreet TEXT,
      BillingCity TEXT,
      BillingState TEXT,
      BillingCountry TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // HubSpot Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS hubspot_contacts (
      id TEXT PRIMARY KEY,
      email_address TEXT NOT NULL,
      firstname TEXT NOT NULL,
      lastname TEXT NOT NULL,
      phone_number TEXT,
      company_id TEXT,
      owner_id TEXT,
      job_title TEXT,
      department TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS hubspot_deals (
      id TEXT PRIMARY KEY,
      deal_name TEXT NOT NULL,
      amount REAL NOT NULL,
      deal_stage TEXT NOT NULL,
      close_date TEXT NOT NULL,
      contact_id TEXT,
      company_id TEXT,
      probability INTEGER,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS hubspot_companies (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      industry TEXT,
      phone TEXT,
      website TEXT,
      number_of_employees INTEGER,
      annual_revenue REAL,
      street_address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Pipedrive Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS pipedrive_contacts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      organization_id TEXT,
      owner_id TEXT,
      job_title TEXT,
      department TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pipedrive_deals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      value REAL NOT NULL,
      status TEXT NOT NULL,
      expected_close_date TEXT NOT NULL,
      person_id TEXT,
      organization_id TEXT,
      probability INTEGER,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pipedrive_companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT,
      phone TEXT,
      website TEXT,
      people_count INTEGER,
      annual_revenue REAL,
      address_street TEXT,
      address_city TEXT,
      address_state TEXT,
      address_country TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Webhook Events
  db.exec(`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY,
      crm TEXT NOT NULL,
      event_type TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Webhook Deliveries
  db.exec(`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      crm TEXT NOT NULL,
      event_type TEXT NOT NULL,
      destination_url TEXT NOT NULL,
      status TEXT NOT NULL,
      request_headers TEXT NOT NULL,
      request_body TEXT NOT NULL,
      response_status INTEGER,
      response_body TEXT,
      error_message TEXT,
      attempt_number INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      delivered_at TEXT,
      FOREIGN KEY (event_id) REFERENCES webhook_events(id)
    );
  `);

  // Webhook Configurations
  db.exec(`
    CREATE TABLE IF NOT EXISTS webhook_configs (
      id TEXT PRIMARY KEY,
      crm TEXT NOT NULL UNIQUE,
      webhook_url TEXT NOT NULL,
      secret TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      events_enabled TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // API Request Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_logs (
      id TEXT PRIMARY KEY,
      crm TEXT NOT NULL,
      method TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      resource_type TEXT,
      status_code INTEGER NOT NULL,
      response_time_ms REAL NOT NULL,
      request_headers TEXT NOT NULL,
      request_body TEXT,
      request_query TEXT,
      response_body TEXT,
      error_message TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  // Change History
  db.exec(`
    CREATE TABLE IF NOT EXISTS change_history (
      id TEXT PRIMARY KEY,
      crm TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      old_data TEXT,
      new_data TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  // Latency Tests
  db.exec(`
    CREATE TABLE IF NOT EXISTS latency_tests (
      id TEXT PRIMARY KEY,
      crm TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      test_timestamp TEXT NOT NULL,
      verification_timestamp TEXT,
      latency_ms INTEGER,
      status TEXT NOT NULL
    );
  `);

  // Create indices for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_id ON webhook_deliveries(event_id);
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_crm ON webhook_deliveries(crm);
    CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_api_logs_crm ON api_logs(crm);
    CREATE INDEX IF NOT EXISTS idx_change_history_timestamp ON change_history(timestamp);
  `);

  // Initialize default webhook configs for each CRM
  const defaultConfigs = db.prepare(`
    INSERT OR IGNORE INTO webhook_configs (id, crm, webhook_url, secret, enabled, events_enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const defaultEventsEnabled = JSON.stringify({
    'contact.created': true,
    'contact.updated': true,
    'contact.deleted': true,
    'deal.created': true,
    'deal.updated': true,
    'deal.deleted': true,
    'company.created': true,
    'company.updated': true,
    'company.deleted': true,
  });

  ['salesforce', 'hubspot', 'pipedrive'].forEach((crm) => {
    defaultConfigs.run(
      `config-${crm}`,
      crm,
      `http://localhost:4000/webhooks/${crm}`,
      `secret-${crm}-${Date.now()}`,
      0, // disabled by default
      defaultEventsEnabled,
      now,
      now
    );
  });
}

export function clearAllData(db: Database.Database) {
  // Temporarily disable foreign key constraints for cleanup
  db.exec('PRAGMA foreign_keys = OFF');
  
  const tables = [
    'webhook_deliveries', // Delete this first (has FK to webhook_events)
    'webhook_events',
    'api_logs',
    'change_history',
    'latency_tests',
    'salesforce_contacts', 'salesforce_deals', 'salesforce_companies',
    'hubspot_contacts', 'hubspot_deals', 'hubspot_companies',
    'pipedrive_contacts', 'pipedrive_deals', 'pipedrive_companies',
  ];

  try {
    tables.forEach(table => {
      db.exec(`DELETE FROM ${table}`);
    });
  } finally {
    // Re-enable foreign key constraints
    db.exec('PRAGMA foreign_keys = ON');
  }
}

