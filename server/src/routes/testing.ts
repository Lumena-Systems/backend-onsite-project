import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import Database from 'better-sqlite3';
import { CRMType, ResourceType, ScenarioType, LatencyTest } from '@mock-crm/shared';
import { WebhookDeliveryService } from '../services/webhook-delivery';

interface TestingRouterConfig {
  db: Database.Database;
  webhookService: WebhookDeliveryService;
  emitEvent?: (event: any) => void;
  errorSimulation: {
    rateLimitEnabled: boolean;
    errorsEnabled: boolean;
  };
}

export function createTestingRouter(config: TestingRouterConfig): Router {
  const router = Router();
  const { db, webhookService, emitEvent, errorSimulation } = config;

  // Helper to create random contact
  const createRandomContact = (crm: CRMType): any => {
    const id = uuidv4();
    const now = new Date().toISOString();

    if (crm === 'salesforce') {
      return {
        id,
        Email: faker.internet.email(),
        FirstName: faker.person.firstName(),
        LastName: faker.person.lastName(),
        Phone: faker.phone.number(),
        Title: faker.person.jobTitle(),
        Department: faker.helpers.arrayElement(['Sales', 'Marketing', 'Engineering', 'Operations']),
        created_at: now,
        updated_at: now,
      };
    } else if (crm === 'hubspot') {
      return {
        id,
        email_address: faker.internet.email(),
        firstname: faker.person.firstName(),
        lastname: faker.person.lastName(),
        phone_number: faker.phone.number(),
        job_title: faker.person.jobTitle(),
        department: faker.helpers.arrayElement(['Sales', 'Marketing', 'Engineering', 'Operations']),
        created_at: now,
        updated_at: now,
      };
    } else {
      return {
        id,
        email: faker.internet.email(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        phone: faker.phone.number(),
        job_title: faker.person.jobTitle(),
        department: faker.helpers.arrayElement(['Sales', 'Marketing', 'Engineering', 'Operations']),
        created_at: now,
        updated_at: now,
      };
    }
  };

  // POST /scenarios/create-contacts - Create 5 contacts in Salesforce
  router.post('/scenarios/create-contacts', (req: Request, res: Response) => {
    const crm: CRMType = 'salesforce';
    const count = 5;
    const created: any[] = [];

    const stmt = db.prepare(`
      INSERT INTO salesforce_contacts 
      (id, Email, FirstName, LastName, Phone, Title, Department, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < count; i++) {
      const contact = createRandomContact(crm);
      stmt.run(
        contact.id,
        contact.Email,
        contact.FirstName,
        contact.LastName,
        contact.Phone,
        contact.Title,
        contact.Department,
        contact.created_at,
        contact.updated_at
      );
      created.push(contact);

      // Trigger webhook
      webhookService.queueWebhookEvent(crm, 'contact.created', 'contacts', contact.id, contact);
    }

    res.json({
      success: true,
      scenario: 'create-contacts',
      records_affected: count,
      webhooks_triggered: count,
      details: `Created ${count} contacts in Salesforce`,
      records: created,
    });
  });

  // POST /scenarios/update-deals - Update 3 deals in HubSpot
  router.post('/scenarios/update-deals', (req: Request, res: Response) => {
    const crm: CRMType = 'hubspot';
    const count = 3;

    // Get random deals
    const getStmt = db.prepare('SELECT * FROM hubspot_deals ORDER BY RANDOM() LIMIT ?');
    const deals = getStmt.all(count) as any[];

    const updateStmt = db.prepare(`
      UPDATE hubspot_deals SET amount = ?, deal_stage = ?, updated_at = ? WHERE id = ?
    `);

    const updated: any[] = [];
    const now = new Date().toISOString();

    deals.forEach(deal => {
      const newAmount = faker.number.int({ min: 5000, max: 100000 });
      const newStage = faker.helpers.arrayElement(['Lead', 'Qualified', 'Proposal Sent', 'Won']);
      
      updateStmt.run(newAmount, newStage, now, deal.id);

      const updatedDeal = { ...deal, amount: newAmount, deal_stage: newStage, updated_at: now };
      updated.push(updatedDeal);

      // Trigger webhook
      webhookService.queueWebhookEvent(crm, 'deal.updated', 'deals', deal.id, updatedDeal);
    });

    res.json({
      success: true,
      scenario: 'update-deals',
      records_affected: count,
      webhooks_triggered: count,
      details: `Updated ${count} deals in HubSpot`,
      records: updated,
    });
  });

  // POST /scenarios/bulk-update - Bulk update 25 records
  router.post('/scenarios/bulk-update', (req: Request, res: Response) => {
    const count = 25;
    const updated: any[] = [];
    const now = new Date().toISOString();

    // Update contacts across all CRMs
    ['salesforce', 'hubspot', 'pipedrive'].forEach((crm: any) => {
      const tableName = `${crm}_contacts`;
      const getStmt = db.prepare(`SELECT * FROM ${tableName} ORDER BY RANDOM() LIMIT ?`);
      const contacts = getStmt.all(Math.floor(count / 3)) as any[];

      contacts.forEach(contact => {
        const updateStmt = db.prepare(`UPDATE ${tableName} SET updated_at = ? WHERE id = ?`);
        updateStmt.run(now, contact.id);

        const updatedContact = { ...contact, updated_at: now };
        updated.push(updatedContact);

        webhookService.queueWebhookEvent(crm, 'contact.updated', 'contacts', contact.id, updatedContact);
      });
    });

    res.json({
      success: true,
      scenario: 'bulk-update',
      records_affected: updated.length,
      webhooks_triggered: updated.length,
      details: `Bulk updated ${updated.length} records across all CRMs`,
    });
  });

  // POST /scenarios/rate-limit - Enable rate limiting simulation
  router.post('/scenarios/rate-limit', (req: Request, res: Response) => {
    errorSimulation.rateLimitEnabled = true;

    setTimeout(() => {
      errorSimulation.rateLimitEnabled = false;
    }, 30000); // 30 seconds

    res.json({
      success: true,
      scenario: 'rate-limit',
      details: 'Rate limiting enabled for next 30 seconds',
    });
  });

  // POST /scenarios/api-errors - Enable API error simulation
  router.post('/scenarios/api-errors', (req: Request, res: Response) => {
    errorSimulation.errorsEnabled = true;

    setTimeout(() => {
      errorSimulation.errorsEnabled = false;
    }, 30000); // 30 seconds

    res.json({
      success: true,
      scenario: 'api-errors',
      details: 'API errors enabled for next 30 seconds',
    });
  });

  // POST /scenarios/rapid-changes - Create rapid changes over 30 seconds
  router.post('/scenarios/rapid-changes', (req: Request, res: Response) => {
    const count = 10;
    let created = 0;

    const interval = setInterval(() => {
      if (created >= count) {
        clearInterval(interval);
        return;
      }

      const crm = faker.helpers.arrayElement(['salesforce', 'hubspot', 'pipedrive']);
      const contact = createRandomContact(crm as CRMType);

      if (crm === 'salesforce') {
        const stmt = db.prepare(`
          INSERT INTO salesforce_contacts 
          (id, Email, FirstName, LastName, Phone, Title, Department, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          contact.id,
          contact.Email,
          contact.FirstName,
          contact.LastName,
          contact.Phone,
          contact.Title,
          contact.Department,
          contact.created_at,
          contact.updated_at
        );
      } else if (crm === 'hubspot') {
        const stmt = db.prepare(`
          INSERT INTO hubspot_contacts 
          (id, email_address, firstname, lastname, phone_number, job_title, department, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          contact.id,
          contact.email_address,
          contact.firstname,
          contact.lastname,
          contact.phone_number,
          contact.job_title,
          contact.department,
          contact.created_at,
          contact.updated_at
        );
      } else {
        const stmt = db.prepare(`
          INSERT INTO pipedrive_contacts 
          (id, email, first_name, last_name, phone, job_title, department, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          contact.id,
          contact.email,
          contact.first_name,
          contact.last_name,
          contact.phone,
          contact.job_title,
          contact.department,
          contact.created_at,
          contact.updated_at
        );
      }

      webhookService.queueWebhookEvent(crm as CRMType, 'contact.created', 'contacts', contact.id, contact);
      created++;
    }, 3000); // Every 3 seconds

    res.json({
      success: true,
      scenario: 'rapid-changes',
      details: `Creating ${count} records over 30 seconds`,
    });
  });

  // POST /scenarios/delete-contacts - Delete 5 random contacts
  router.post('/scenarios/delete-contacts', (req: Request, res: Response) => {
    const count = 5;
    const crm: CRMType = 'salesforce';

    const getStmt = db.prepare('SELECT * FROM salesforce_contacts ORDER BY RANDOM() LIMIT ?');
    const contacts = getStmt.all(count) as any[];

    const deleteStmt = db.prepare('DELETE FROM salesforce_contacts WHERE id = ?');

    contacts.forEach(contact => {
      deleteStmt.run(contact.id);
      webhookService.queueWebhookEvent(crm, 'contact.deleted', 'contacts', contact.id, contact);
    });

    res.json({
      success: true,
      scenario: 'delete-contacts',
      records_affected: contacts.length,
      webhooks_triggered: contacts.length,
      details: `Deleted ${contacts.length} contacts from Salesforce`,
    });
  });

  // POST /latency-tests - Create a latency test
  router.post('/latency-tests', (req: Request, res: Response) => {
    const { crm, resource_type } = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();

    // Create a test record
    let testRecord: any;
    if (crm === 'salesforce' && resource_type === 'contacts') {
      testRecord = createRandomContact('salesforce');
      const stmt = db.prepare(`
        INSERT INTO salesforce_contacts 
        (id, Email, FirstName, LastName, Phone, Title, Department, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        testRecord.id,
        testRecord.Email,
        testRecord.FirstName,
        testRecord.LastName,
        testRecord.Phone,
        testRecord.Title,
        testRecord.Department,
        testRecord.created_at,
        testRecord.updated_at
      );
      webhookService.queueWebhookEvent(crm, 'contact.created', 'contacts', testRecord.id, testRecord);
    }

    // Record latency test
    const testId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO latency_tests (id, crm, resource_type, resource_id, operation, test_timestamp, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(testId, crm, resource_type, testRecord.id, 'CREATE', now, 'pending');

    const latencyTest: LatencyTest = {
      id: testId,
      crm,
      resource_type,
      resource_id: testRecord.id,
      operation: 'CREATE',
      test_timestamp: now,
      status: 'pending',
    };

    res.json(latencyTest);
  });

  // PUT /latency-tests/:id/verify - Verify latency test
  router.put('/latency-tests/:id/verify', (req: Request, res: Response) => {
    const { id } = req.params;
    const now = new Date().toISOString();

    const getStmt = db.prepare('SELECT * FROM latency_tests WHERE id = ?');
    const test = getStmt.get(id) as any;

    if (!test) {
      return res.status(404).json({ error: 'Latency test not found' });
    }

    const latencyMs = new Date(now).getTime() - new Date(test.test_timestamp).getTime();

    const updateStmt = db.prepare(`
      UPDATE latency_tests SET verification_timestamp = ?, latency_ms = ?, status = ? WHERE id = ?
    `);
    updateStmt.run(now, latencyMs, 'verified', id);

    const updatedTest: LatencyTest = {
      ...test,
      verification_timestamp: now,
      latency_ms: latencyMs,
      status: 'verified',
    };

    res.json(updatedTest);
  });

  // GET /latency-tests - Get all latency tests
  router.get('/latency-tests', (req: Request, res: Response) => {
    const stmt = db.prepare('SELECT * FROM latency_tests ORDER BY test_timestamp DESC LIMIT 50');
    const tests = stmt.all();
    res.json(tests);
  });

  return router;
}

