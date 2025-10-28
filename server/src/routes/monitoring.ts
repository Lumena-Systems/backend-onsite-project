import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { PerformanceMetrics, CRMType, ResourceType } from '@mock-crm/shared';
import { clearAllData } from '../database/schema';
import { seedDatabase } from '../database/seed';

interface MonitoringRouterConfig {
  db: Database.Database;
}

export function createMonitoringRouter(config: MonitoringRouterConfig): Router {
  const router = Router();
  const { db } = config;

  // GET /metrics - Get performance metrics
  router.get('/metrics', (req: Request, res: Response) => {
    // Total requests
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM api_logs');
    const totalResult = totalStmt.get() as { count: number };

    // Requests by CRM
    const byCRMStmt = db.prepare('SELECT crm, COUNT(*) as count FROM api_logs GROUP BY crm');
    const byCRMResults = byCRMStmt.all() as { crm: string; count: number }[];
    const requestsByCRM: Record<CRMType, number> = {
      salesforce: 0,
      hubspot: 0,
      pipedrive: 0,
    };
    byCRMResults.forEach(row => {
      if (row.crm in requestsByCRM) {
        requestsByCRM[row.crm as CRMType] = row.count;
      }
    });

    // Requests by resource
    const byResourceStmt = db.prepare('SELECT resource_type, COUNT(*) as count FROM api_logs WHERE resource_type IS NOT NULL GROUP BY resource_type');
    const byResourceResults = byResourceStmt.all() as { resource_type: string; count: number }[];
    const requestsByResource: Record<ResourceType, number> = {
      contacts: 0,
      deals: 0,
      companies: 0,
    };
    byResourceResults.forEach(row => {
      if (row.resource_type in requestsByResource) {
        requestsByResource[row.resource_type as ResourceType] = row.count;
      }
    });

    // Average response time
    const avgTimeStmt = db.prepare('SELECT AVG(response_time_ms) as avg FROM api_logs');
    const avgTimeResult = avgTimeStmt.get() as { avg: number | null };

    // Error rate
    const errorStmt = db.prepare('SELECT COUNT(*) as count FROM api_logs WHERE status_code >= 400');
    const errorResult = errorStmt.get() as { count: number };
    const errorRate = totalResult.count > 0 ? (errorResult.count / totalResult.count) * 100 : 0;

    // Webhook delivery rate
    const totalWebhooksStmt = db.prepare('SELECT COUNT(*) as count FROM webhook_deliveries');
    const totalWebhooksResult = totalWebhooksStmt.get() as { count: number };
    const deliveredWebhooksStmt = db.prepare("SELECT COUNT(*) as count FROM webhook_deliveries WHERE status = 'delivered'");
    const deliveredWebhooksResult = deliveredWebhooksStmt.get() as { count: number };
    const webhookDeliveryRate = totalWebhooksResult.count > 0 
      ? (deliveredWebhooksResult.count / totalWebhooksResult.count) * 100 
      : 0;

    // Record counts
    const recordCounts: PerformanceMetrics['record_counts'] = {
      salesforce: { contacts: 0, deals: 0, companies: 0 },
      hubspot: { contacts: 0, deals: 0, companies: 0 },
      pipedrive: { contacts: 0, deals: 0, companies: 0 },
    };

    (['salesforce', 'hubspot', 'pipedrive'] as CRMType[]).forEach(crm => {
      (['contacts', 'deals', 'companies'] as ResourceType[]).forEach(resource => {
        const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${crm}_${resource}`);
        const result = stmt.get() as { count: number };
        recordCounts[crm][resource] = result.count;
      });
    });

    const metrics: PerformanceMetrics = {
      total_requests: totalResult.count,
      requests_by_crm: requestsByCRM,
      requests_by_resource: requestsByResource,
      average_response_time: avgTimeResult.avg || 0,
      error_rate: errorRate,
      webhook_delivery_rate: webhookDeliveryRate,
      record_counts: recordCounts,
    };

    res.json(metrics);
  });

  // GET /logs - Get API request logs
  router.get('/logs', (req: Request, res: Response) => {
    const { crm, resource_type, status_code, limit } = req.query;

    let query = 'SELECT * FROM api_logs WHERE 1=1';
    const params: any[] = [];

    if (crm) {
      query += ' AND crm = ?';
      params.push(crm);
    }

    if (resource_type) {
      query += ' AND resource_type = ?';
      params.push(resource_type);
    }

    if (status_code) {
      query += ' AND status_code = ?';
      params.push(parseInt(status_code as string));
    }

    query += ' ORDER BY timestamp DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit as string));
    } else {
      query += ' LIMIT 100';
    }

    const stmt = db.prepare(query);
    const logs = stmt.all(...params) as any[];

    // Parse JSON fields
    const parsedLogs = logs.map(log => ({
      ...log,
      request_headers: JSON.parse(log.request_headers),
      request_body: log.request_body ? JSON.parse(log.request_body) : null,
      request_query: log.request_query ? JSON.parse(log.request_query) : null,
      response_body: log.response_body ? JSON.parse(log.response_body) : null,
    }));

    res.json(parsedLogs);
  });

  // GET /timeline - Get unified timeline
  router.get('/timeline', (req: Request, res: Response) => {
    const { limit } = req.query;
    const maxLimit = limit ? parseInt(limit as string) : 100;

    const timeline: any[] = [];

    // Get recent API logs
    const apiStmt = db.prepare('SELECT * FROM api_logs ORDER BY timestamp DESC LIMIT ?');
    const apiLogs = apiStmt.all(maxLimit) as any[];
    apiLogs.forEach(log => {
      timeline.push({
        id: log.id,
        type: 'api_request',
        crm: log.crm,
        description: `${log.method} ${log.endpoint}`,
        details: log,
        timestamp: log.timestamp,
      });
    });

    // Get recent webhooks
    const webhookStmt = db.prepare('SELECT * FROM webhook_deliveries ORDER BY created_at DESC LIMIT ?');
    const webhooks = webhookStmt.all(maxLimit) as any[];
    webhooks.forEach(webhook => {
      timeline.push({
        id: webhook.id,
        type: 'webhook_sent',
        crm: webhook.crm,
        description: `Webhook ${webhook.event_type} to ${webhook.destination_url}`,
        details: webhook,
        timestamp: webhook.created_at,
      });
    });

    // Get recent changes
    const changeStmt = db.prepare('SELECT * FROM change_history ORDER BY timestamp DESC LIMIT ?');
    const changes = changeStmt.all(maxLimit) as any[];
    changes.forEach(change => {
      timeline.push({
        id: change.id,
        type: 'data_changed',
        crm: change.crm,
        description: `${change.operation} ${change.resource_type} ${change.resource_id}`,
        details: change,
        timestamp: change.timestamp,
      });
    });

    // Sort by timestamp
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(timeline.slice(0, maxLimit));
  });

  // GET /changes - Get change history
  router.get('/changes', (req: Request, res: Response) => {
    const { limit } = req.query;
    const maxLimit = limit ? parseInt(limit as string) : 50;

    const stmt = db.prepare('SELECT * FROM change_history ORDER BY timestamp DESC LIMIT ?');
    const changes = stmt.all(maxLimit) as any[];

    const parsedChanges = changes.map(change => ({
      ...change,
      old_data: change.old_data ? JSON.parse(change.old_data) : null,
      new_data: change.new_data ? JSON.parse(change.new_data) : null,
    }));

    res.json(parsedChanges);
  });

  // GET /data/:crm/:resource - Get CRM data for viewing
  router.get('/data/:crm/:resource', (req: Request, res: Response) => {
    const { crm, resource } = req.params;
    const { limit, offset } = req.query;

    const tableName = `${crm}_${resource}`;
    const maxLimit = limit ? parseInt(limit as string) : 50;
    const offsetNum = offset ? parseInt(offset as string) : 0;

    const stmt = db.prepare(`SELECT * FROM ${tableName} ORDER BY updated_at DESC LIMIT ? OFFSET ?`);
    const data = stmt.all(maxLimit, offsetNum);

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`);
    const countResult = countStmt.get() as { count: number };

    res.json({
      data,
      pagination: {
        total: countResult.count,
        limit: maxLimit,
        offset: offsetNum,
        has_more: offsetNum + maxLimit < countResult.count,
      },
    });
  });

  // POST /reset - Reset all data
  router.post('/reset', (req: Request, res: Response) => {
    try {
      clearAllData(db);
      seedDatabase(db);
      res.json({ success: true, message: 'All data has been reset' });
    } catch (error: any) {
      console.error('Failed to reset data:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to reset data',
        message: error.message 
      });
    }
  });

  // DELETE /logs - Clear logs
  router.delete('/logs', (req: Request, res: Response) => {
    db.exec('DELETE FROM api_logs');
    res.json({ success: true, message: 'API logs cleared' });
  });

  // DELETE /timeline - Clear timeline
  router.delete('/timeline', (req: Request, res: Response) => {
    db.exec('DELETE FROM api_logs');
    db.exec('DELETE FROM change_history');
    res.json({ success: true, message: 'Timeline cleared' });
  });

  return router;
}

