import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import { CRMType, ResourceType, PaginatedResponse, QueryParams } from '@mock-crm/shared';
import { AppError } from '../middleware/error-handler';
import { WebhookDeliveryService } from '../services/webhook-delivery';

interface CRMRouterConfig {
  db: Database.Database;
  webhookService: WebhookDeliveryService;
  emitEvent?: (event: any) => void;
  errorSimulation?: {
    rateLimitEnabled: boolean;
    errorsEnabled: boolean;
  };
}

export function createCRMRouter(config: CRMRouterConfig): Router {
  const router = Router({ mergeParams: true });
  const { db, webhookService, emitEvent } = config;

  // Middleware to simulate rate limiting
  router.use((req, res, next) => {
    if (config.errorSimulation?.rateLimitEnabled) {
      return res.status(429).json({
        error: 'RateLimitExceeded',
        message: 'Too many requests. Please try again later.',
        status_code: 429,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  });

  // Middleware to simulate API errors
  router.use((req, res, next) => {
    if (config.errorSimulation?.errorsEnabled && Math.random() < 0.3) {
      return res.status(500).json({
        error: 'InternalServerError',
        message: 'Simulated API error',
        status_code: 500,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  });

  // Helper to get table name
  const getTableName = (crm: CRMType, resource: ResourceType): string => {
    return `${crm}_${resource}`;
  };

  // Helper to record change history
  const recordChange = (
    crm: CRMType,
    resourceType: ResourceType,
    resourceId: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    oldData?: any,
    newData?: any
  ) => {
    const stmt = db.prepare(`
      INSERT INTO change_history (id, crm, resource_type, resource_id, operation, old_data, new_data, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      uuidv4(),
      crm,
      resourceType,
      resourceId,
      operation,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      new Date().toISOString()
    );

    // Emit data change event
    if (emitEvent) {
      emitEvent({
        type: 'data_changed',
        data: {
          crm,
          resource_type: resourceType,
          resource_id: resourceId,
          operation,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  // Helper to trigger webhook
  const triggerWebhook = (
    crm: CRMType,
    resourceType: ResourceType,
    resourceId: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any
  ) => {
    const eventTypeMap: Record<string, string> = {
      'contacts-CREATE': 'contact.created',
      'contacts-UPDATE': 'contact.updated',
      'contacts-DELETE': 'contact.deleted',
      'deals-CREATE': 'deal.created',
      'deals-UPDATE': 'deal.updated',
      'deals-DELETE': 'deal.deleted',
      'companies-CREATE': 'company.created',
      'companies-UPDATE': 'company.updated',
      'companies-DELETE': 'company.deleted',
    };

    const eventType = eventTypeMap[`${resourceType}-${operation}`];
    if (eventType) {
      webhookService.queueWebhookEvent(crm, eventType as any, resourceType, resourceId, data);
    }
  };

  // GET / - List resources with pagination and filtering
  router.get('/', (req: Request, res: Response, next) => {
    try {
      const { crm, resource } = req.params;
      
      console.log('CRM API Request:', { crm, resource, params: req.params });
      
      if (!crm || !resource) {
        throw new AppError(400, 'CRM and resource parameters are required');
      }
      
      const queryParams = req.query as QueryParams;

      const tableName = getTableName(crm as CRMType, resource as ResourceType);
      
      console.log('Table name:', tableName);
      
      // Parse pagination
      const limit = Math.min(
        typeof queryParams.limit === 'string' ? parseInt(queryParams.limit) : (queryParams.limit || 50),
        100
      );
      const offset = typeof queryParams.offset === 'string' ? parseInt(queryParams.offset) : (queryParams.offset || 0);

      // Build query
      let query = `SELECT * FROM ${tableName} WHERE 1=1`;
      const params: any[] = [];

    // Handle updated_since filter
    if (queryParams.updated_since) {
      query += ' AND updated_at > ?';
      params.push(queryParams.updated_since);
    }

    // Handle other filters
    Object.keys(queryParams).forEach(key => {
      if (!['limit', 'offset', 'updated_since'].includes(key)) {
        query += ` AND ${key} = ?`;
        params.push(queryParams[key]);
      }
    });

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...params) as { count: number };
    const total = countResult.count;

    // Add ordering and pagination
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const data = stmt.all(...params);

      const response: PaginatedResponse<any> = {
        data,
        pagination: {
          total,
          limit,
          offset,
          has_more: offset + limit < total,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in GET / route:', error);
      next(error);
    }
  });

  // GET /:id - Get single resource
  router.get('/:id', (req: Request, res: Response) => {
    const { crm, resource, id } = req.params;
    const tableName = getTableName(crm as CRMType, resource as ResourceType);

    const stmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
    const record = stmt.get(id);

    if (!record) {
      throw new AppError(404, `${resource} with id ${id} not found`);
    }

    res.json(record);
  });

  // POST / - Create new resource
  router.post('/', (req: Request, res: Response) => {
    const { crm, resource } = req.params;
    const tableName = getTableName(crm as CRMType, resource as ResourceType);
    const data = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();

    const record = {
      id,
      ...data,
      created_at: now,
      updated_at: now,
    };

    // Build insert query dynamically
    const columns = Object.keys(record);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => record[col]);

    const stmt = db.prepare(
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
    );

    stmt.run(...values);

    // Record change
    recordChange(crm as CRMType, resource as ResourceType, id, 'CREATE', undefined, record);

    // Trigger webhook
    triggerWebhook(crm as CRMType, resource as ResourceType, id, 'CREATE', record);

    res.status(201).json(record);
  });

  // PUT /:id - Update resource
  router.put('/:id', (req: Request, res: Response) => {
    const { crm, resource, id } = req.params;
    const tableName = getTableName(crm as CRMType, resource as ResourceType);
    const updates = req.body;

    // Get existing record
    const getStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
    const existingRecord = getStmt.get(id);

    if (!existingRecord) {
      throw new AppError(404, `${resource} with id ${id} not found`);
    }

    // Update record
    const now = new Date().toISOString();
    const updatedRecord = {
      ...existingRecord,
      ...updates,
      id, // Ensure ID doesn't change
      updated_at: now,
    };

    // Build update query
    const columns = Object.keys(updatedRecord).filter(col => col !== 'id' && col !== 'created_at');
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = [...columns.map(col => updatedRecord[col]), id];

    const updateStmt = db.prepare(
      `UPDATE ${tableName} SET ${setClause} WHERE id = ?`
    );

    updateStmt.run(...values);

    // Record change
    recordChange(crm as CRMType, resource as ResourceType, id, 'UPDATE', existingRecord, updatedRecord);

    // Trigger webhook
    triggerWebhook(crm as CRMType, resource as ResourceType, id, 'UPDATE', updatedRecord);

    res.json(updatedRecord);
  });

  // DELETE /:id - Delete resource
  router.delete('/:id', (req: Request, res: Response) => {
    const { crm, resource, id } = req.params;
    const tableName = getTableName(crm as CRMType, resource as ResourceType);

    // Get existing record
    const getStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
    const existingRecord = getStmt.get(id);

    if (!existingRecord) {
      throw new AppError(404, `${resource} with id ${id} not found`);
    }

    // Delete record
    const deleteStmt = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
    deleteStmt.run(id);

    // Record change
    recordChange(crm as CRMType, resource as ResourceType, id, 'DELETE', existingRecord, undefined);

    // Trigger webhook
    triggerWebhook(crm as CRMType, resource as ResourceType, id, 'DELETE', existingRecord);

    res.status(204).send();
  });

  return router;
}

