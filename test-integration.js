#!/usr/bin/env node

/**
 * Integration Tests for Mock CRM Testing Interface
 * 
 * Tests all major functionality:
 * - All CRM endpoints
 * - Webhook triggers
 * - Data seeding
 * - Database operations
 * - Logging
 * - Test scenarios
 */

const API_BASE = 'http://localhost:8000';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Test runner
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  log('\n🧪 Running Integration Tests\n', 'blue');
  log('═'.repeat(60) + '\n', 'blue');

  for (const { name, fn } of tests) {
    try {
      logInfo(`Testing: ${name}`);
      await fn();
      logSuccess(`PASS: ${name}\n`);
      passed++;
    } catch (error) {
      logError(`FAIL: ${name}`);
      logError(`  Error: ${error.message}\n`);
      failed++;
    }
  }

  log('\n' + '═'.repeat(60), 'blue');
  log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`, passed === tests.length ? 'green' : 'red');

  if (failed > 0) {
    process.exit(1);
  }
}

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => null);
  
  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

// ============================================================================
// TEST SUITE: Health Check
// ============================================================================

test('Health check endpoint responds', async () => {
  const { status, ok, data } = await apiRequest('/health');
  
  if (!ok) throw new Error(`Health check failed with status ${status}`);
  if (data.status !== 'healthy') throw new Error('Server is not healthy');
  if (!data.database) throw new Error('Database status missing');
});

// ============================================================================
// TEST SUITE: Database & Data Seeding
// ============================================================================

test('Database is seeded with Salesforce contacts', async () => {
  const { ok, data } = await apiRequest('/api/salesforce/contacts?limit=10');
  
  if (!ok) throw new Error('Failed to fetch contacts');
  if (!data.data || data.data.length === 0) throw new Error('No contacts found');
  if (data.pagination.total < 50) throw new Error(`Expected at least 50 contacts, got ${data.pagination.total}`);
  
  // Verify Salesforce schema
  const contact = data.data[0];
  if (!contact.Email) throw new Error('Missing Email field');
  if (!contact.FirstName) throw new Error('Missing FirstName field');
  if (!contact.LastName) throw new Error('Missing LastName field');
});

test('Database is seeded with HubSpot contacts', async () => {
  const { ok, data } = await apiRequest('/api/hubspot/contacts?limit=10');
  
  if (!ok) throw new Error('Failed to fetch contacts');
  if (!data.data || data.data.length === 0) throw new Error('No contacts found');
  
  // Verify HubSpot schema
  const contact = data.data[0];
  if (!contact.email_address) throw new Error('Missing email_address field');
  if (!contact.firstname) throw new Error('Missing firstname field');
  if (!contact.lastname) throw new Error('Missing lastname field');
});

test('Database is seeded with Pipedrive contacts', async () => {
  const { ok, data } = await apiRequest('/api/pipedrive/contacts?limit=10');
  
  if (!ok) throw new Error('Failed to fetch contacts');
  if (!data.data || data.data.length === 0) throw new Error('No contacts found');
  
  // Verify Pipedrive schema
  const contact = data.data[0];
  if (!contact.email) throw new Error('Missing email field');
  if (!contact.first_name) throw new Error('Missing first_name field');
  if (!contact.last_name) throw new Error('Missing last_name field');
});

test('Database is seeded with deals and companies', async () => {
  const { ok: dealsOk, data: dealsData } = await apiRequest('/api/salesforce/deals?limit=10');
  const { ok: companiesOk, data: companiesData } = await apiRequest('/api/salesforce/companies?limit=10');
  
  if (!dealsOk) throw new Error('Failed to fetch deals');
  if (!companiesOk) throw new Error('Failed to fetch companies');
  if (dealsData.pagination.total < 20) throw new Error(`Expected at least 20 deals, got ${dealsData.pagination.total}`);
  if (companiesData.pagination.total < 10) throw new Error(`Expected at least 10 companies, got ${companiesData.pagination.total}`);
});

// ============================================================================
// TEST SUITE: CRM API Endpoints
// ============================================================================

test('GET /api/{crm}/contacts supports pagination', async () => {
  const { ok, data } = await apiRequest('/api/salesforce/contacts?limit=5&offset=0');
  
  if (!ok) throw new Error('Pagination request failed');
  if (data.data.length !== 5) throw new Error(`Expected 5 contacts, got ${data.data.length}`);
  if (!data.pagination) throw new Error('Missing pagination object');
  if (data.pagination.limit !== 5) throw new Error('Pagination limit incorrect');
  if (data.pagination.offset !== 0) throw new Error('Pagination offset incorrect');
});

test('GET /api/{crm}/contacts/{id} returns single contact', async () => {
  // First, get a list of contacts
  const { data: listData } = await apiRequest('/api/salesforce/contacts?limit=1');
  const contactId = listData.data[0].id;
  
  // Then fetch that specific contact
  const { ok, data } = await apiRequest(`/api/salesforce/contacts/${contactId}`);
  
  if (!ok) throw new Error('Failed to fetch single contact');
  if (data.id !== contactId) throw new Error('Returned contact has wrong ID');
});

test('POST /api/{crm}/contacts creates new contact', async () => {
  const newContact = {
    Email: 'test@example.com',
    FirstName: 'Test',
    LastName: 'User',
    Phone: '+1-555-TEST',
  };
  
  const { ok, data, status } = await apiRequest('/api/salesforce/contacts', {
    method: 'POST',
    body: JSON.stringify(newContact),
  });
  
  if (!ok) throw new Error(`Failed to create contact, status: ${status}`);
  if (status !== 201) throw new Error(`Expected status 201, got ${status}`);
  if (!data.id) throw new Error('Created contact missing ID');
  if (data.Email !== newContact.Email) throw new Error('Created contact has wrong email');
});

test('PUT /api/{crm}/contacts/{id} updates contact', async () => {
  // Create a contact first
  const newContact = {
    Email: 'update-test@example.com',
    FirstName: 'UpdateTest',
    LastName: 'User',
  };
  
  const createRes = await apiRequest('/api/salesforce/contacts', {
    method: 'POST',
    body: JSON.stringify(newContact),
  });
  
  const contactId = createRes.data.id;
  
  // Update it
  const updates = {
    FirstName: 'Updated',
    Phone: '+1-555-UPDATED',
  };
  
  const { ok, data } = await apiRequest(`/api/salesforce/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  
  if (!ok) throw new Error('Failed to update contact');
  if (data.FirstName !== 'Updated') throw new Error('Contact not updated');
  if (data.Phone !== '+1-555-UPDATED') throw new Error('Phone not updated');
});

test('DELETE /api/{crm}/contacts/{id} deletes contact', async () => {
  // Create a contact first
  const newContact = {
    Email: 'delete-test@example.com',
    FirstName: 'DeleteTest',
    LastName: 'User',
  };
  
  const createRes = await apiRequest('/api/salesforce/contacts', {
    method: 'POST',
    body: JSON.stringify(newContact),
  });
  
  const contactId = createRes.data.id;
  
  // Delete it
  const { status } = await apiRequest(`/api/salesforce/contacts/${contactId}`, {
    method: 'DELETE',
  });
  
  if (status !== 204) throw new Error(`Expected status 204, got ${status}`);
  
  // Verify it's gone
  const { status: getStatus } = await apiRequest(`/api/salesforce/contacts/${contactId}`);
  if (getStatus !== 404) throw new Error('Contact was not deleted');
});

test('Incremental sync with updated_since works', async () => {
  const now = new Date().toISOString();
  
  // Create a new contact
  await apiRequest('/api/salesforce/contacts', {
    method: 'POST',
    body: JSON.stringify({
      Email: 'incremental-test@example.com',
      FirstName: 'Incremental',
      LastName: 'Test',
    }),
  });
  
  // Wait a tiny bit
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Fetch with updated_since
  const { ok, data } = await apiRequest(`/api/salesforce/contacts?updated_since=${now}`);
  
  if (!ok) throw new Error('Incremental sync request failed');
  if (data.data.length === 0) throw new Error('No updated contacts found');
  
  const found = data.data.some(c => c.Email === 'incremental-test@example.com');
  if (!found) throw new Error('Newly created contact not in incremental sync');
});

// ============================================================================
// TEST SUITE: Webhooks
// ============================================================================

test('Webhook configuration can be retrieved', async () => {
  const { ok, data } = await apiRequest('/webhooks/config');
  
  if (!ok) throw new Error('Failed to get webhook configs');
  if (!Array.isArray(data)) throw new Error('Webhook configs is not an array');
  if (data.length !== 3) throw new Error(`Expected 3 configs, got ${data.length}`);
  
  const salesforceConfig = data.find(c => c.crm === 'salesforce');
  if (!salesforceConfig) throw new Error('Salesforce config not found');
  if (typeof salesforceConfig.enabled !== 'boolean') throw new Error('Enabled field is not boolean');
  if (!salesforceConfig.webhook_url) throw new Error('Missing webhook_url');
  if (!salesforceConfig.secret) throw new Error('Missing secret');
});

test('Webhook configuration can be updated', async () => {
  const updates = {
    webhook_url: 'http://localhost:4000/test-webhooks',
    enabled: true,
  };
  
  const { ok } = await apiRequest('/webhooks/config/salesforce', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  
  if (!ok) throw new Error('Failed to update webhook config');
  
  // Verify the update
  const { data } = await apiRequest('/webhooks/config/salesforce');
  if (data.webhook_url !== updates.webhook_url) throw new Error('Webhook URL not updated');
  if (data.enabled !== updates.enabled) throw new Error('Enabled not updated');
});

test('Webhook history can be retrieved', async () => {
  const { ok, data } = await apiRequest('/webhooks/history?limit=10');
  
  if (!ok) throw new Error('Failed to get webhook history');
  if (!Array.isArray(data)) throw new Error('Webhook history is not an array');
});

// ============================================================================
// TEST SUITE: Monitoring & Logging
// ============================================================================

test('Performance metrics are calculated', async () => {
  const { ok, data } = await apiRequest('/monitoring/metrics');
  
  if (!ok) throw new Error('Failed to get metrics');
  if (typeof data.total_requests !== 'number') throw new Error('Missing total_requests');
  if (typeof data.average_response_time !== 'number') throw new Error('Missing average_response_time');
  if (typeof data.error_rate !== 'number') throw new Error('Missing error_rate');
  if (!data.requests_by_crm) throw new Error('Missing requests_by_crm');
  if (!data.record_counts) throw new Error('Missing record_counts');
});

test('API request logs are stored', async () => {
  const { ok, data } = await apiRequest('/monitoring/logs?limit=10');
  
  if (!ok) throw new Error('Failed to get logs');
  if (!Array.isArray(data)) throw new Error('Logs is not an array');
  
  if (data.length > 0) {
    const log = data[0];
    if (!log.crm) throw new Error('Log missing crm field');
    if (!log.method) throw new Error('Log missing method field');
    if (!log.endpoint) throw new Error('Log missing endpoint field');
    if (typeof log.status_code !== 'number') throw new Error('Log missing status_code');
    if (typeof log.response_time_ms !== 'number') throw new Error('Log missing response_time_ms');
  }
});

test('Change history is tracked', async () => {
  // Create a contact to generate change history
  await apiRequest('/api/salesforce/contacts', {
    method: 'POST',
    body: JSON.stringify({
      Email: 'change-test@example.com',
      FirstName: 'Change',
      LastName: 'Test',
    }),
  });
  
  const { ok, data } = await apiRequest('/monitoring/changes?limit=10');
  
  if (!ok) throw new Error('Failed to get change history');
  if (!Array.isArray(data)) throw new Error('Change history is not an array');
  if (data.length === 0) throw new Error('No change history found');
  
  const recentChange = data[0];
  if (!recentChange.operation) throw new Error('Change missing operation');
  if (!recentChange.resource_type) throw new Error('Change missing resource_type');
});

// ============================================================================
// TEST SUITE: Test Scenarios
// ============================================================================

test('Test scenario: create-contacts', async () => {
  const { ok, data } = await apiRequest('/testing/scenarios/create-contacts', {
    method: 'POST',
  });
  
  if (!ok) throw new Error('Scenario execution failed');
  if (!data.success) throw new Error('Scenario did not succeed');
  if (data.records_affected !== 5) throw new Error(`Expected 5 records affected, got ${data.records_affected}`);
});

test('Test scenario: update-deals', async () => {
  const { ok, data } = await apiRequest('/testing/scenarios/update-deals', {
    method: 'POST',
  });
  
  if (!ok) throw new Error('Scenario execution failed');
  if (!data.success) throw new Error('Scenario did not succeed');
  if (data.records_affected !== 3) throw new Error(`Expected 3 records affected, got ${data.records_affected}`);
});

test('Test scenario: bulk-update', async () => {
  const { ok, data } = await apiRequest('/testing/scenarios/bulk-update', {
    method: 'POST',
  });
  
  if (!ok) throw new Error('Scenario execution failed');
  if (!data.success) throw new Error('Scenario did not succeed');
  if (data.records_affected < 20) throw new Error(`Expected at least 20 records affected, got ${data.records_affected}`);
});

// ============================================================================
// TEST SUITE: Latency Tests
// ============================================================================

test('Latency test can be created', async () => {
  const { ok, data, status } = await apiRequest('/testing/latency-tests', {
    method: 'POST',
    body: JSON.stringify({
      crm: 'salesforce',
      resource_type: 'contacts',
    }),
  });
  
  if (!ok) throw new Error(`Failed to create latency test, status: ${status}`);
  if (!data.id) throw new Error('Latency test missing ID');
  if (data.crm !== 'salesforce') throw new Error('Wrong CRM');
  if (data.resource_type !== 'contacts') throw new Error('Wrong resource type');
  if (data.status !== 'pending') throw new Error('Wrong status');
});

test('Latency tests can be retrieved', async () => {
  const { ok, data } = await apiRequest('/testing/latency-tests');
  
  if (!ok) throw new Error('Failed to get latency tests');
  if (!Array.isArray(data)) throw new Error('Latency tests is not an array');
});

// ============================================================================
// TEST SUITE: Data Management
// ============================================================================

test('Data can be retrieved for management', async () => {
  const { ok, data } = await apiRequest('/monitoring/data/salesforce/contacts?limit=20');
  
  if (!ok) throw new Error('Failed to get data for management');
  if (!data.data) throw new Error('Missing data array');
  if (!data.pagination) throw new Error('Missing pagination');
});

test('Data reset works', async () => {
  const { ok, data, status } = await apiRequest('/monitoring/reset', {
    method: 'POST',
  });
  
  if (!ok) {
    // Log the error details for debugging
    console.log('Reset response:', { status, data });
    throw new Error(`Failed to reset data: ${data?.message || 'Unknown error'}`);
  }
  if (!data.success) throw new Error('Reset did not succeed');
  
  // Wait a moment for the seeding to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Verify data was recreated
  const { ok: contactsOk, data: contactsData } = await apiRequest('/api/salesforce/contacts?limit=1');
  if (!contactsOk) throw new Error('Contacts not available after reset');
  if (contactsData.pagination.total < 50) throw new Error(`Data not reseeded after reset. Got ${contactsData.pagination.total} contacts`);
});

// Run all tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});

