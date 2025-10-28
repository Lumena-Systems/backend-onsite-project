import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { CRMType, ResourceType } from '@mock-crm/shared';
import { WebhookDeliveryService } from '../services/webhook-delivery';
import { AppError } from '../middleware/error-handler';

interface WebhookRouterConfig {
  db: Database.Database;
  webhookService: WebhookDeliveryService;
}

export function createWebhookRouter(config: WebhookRouterConfig): Router {
  const router = Router();
  const { db, webhookService } = config;

  // GET /webhooks/config - Get all webhook configurations
  router.get('/config', (req: Request, res: Response) => {
    const configs = webhookService.getAllConfigs();
    res.json(configs);
  });

  // GET /webhooks/config/:crm - Get webhook config for specific CRM
  router.get('/config/:crm', (req: Request, res: Response) => {
    const { crm } = req.params;
    const stmt = db.prepare('SELECT * FROM webhook_configs WHERE crm = ?');
    const config = stmt.get(crm) as any;

    if (!config) {
      throw new AppError(404, `Webhook config for ${crm} not found`);
    }

    res.json({
      ...config,
      enabled: Boolean(config.enabled),
      events_enabled: JSON.parse(config.events_enabled),
    });
  });

  // PUT /webhooks/config/:crm - Update webhook configuration
  router.put('/config/:crm', (req: Request, res: Response) => {
    const { crm } = req.params;
    const updates = req.body;

    webhookService.updateWebhookConfig(crm as CRMType, updates);

    res.json({ success: true, message: `Webhook config for ${crm} updated` });
  });

  // POST /webhooks/trigger - Manually trigger a webhook
  router.post('/trigger', async (req: Request, res: Response) => {
    const { crm, event_type, resource_id, destination_url, custom_payload } = req.body;

    if (!crm || !event_type || !destination_url) {
      throw new AppError(400, 'Missing required fields: crm, event_type, destination_url');
    }

    let payload = custom_payload;

    // If no custom payload, fetch the actual record
    if (!payload && resource_id) {
      const resource = event_type.split('.')[0] + 's'; // e.g., 'contact' -> 'contacts'
      const tableName = `${crm}_${resource}`;
      const stmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
      payload = stmt.get(resource_id);

      if (!payload) {
        throw new AppError(404, `Resource ${resource_id} not found in ${crm}`);
      }
    }

    // If still no payload, create a default test payload
    if (!payload) {
      payload = {
        id: 'test-payload-id',
        test: true,
        message: 'This is a test webhook payload',
        timestamp: new Date().toISOString(),
      };
    }

    const delivery = await webhookService.triggerManualWebhook(
      crm,
      event_type,
      destination_url,
      payload
    );

    res.json(delivery);
  });

  // GET /webhooks/history - Get webhook delivery history
  router.get('/history', (req: Request, res: Response) => {
    const { crm, event_type, status, limit } = req.query;

    const history = webhookService.getDeliveryHistory({
      crm: crm as CRMType,
      event_type: event_type as any,
      status: status as string,
      limit: limit ? parseInt(limit as string) : 100,
    });

    res.json(history);
  });

  // POST /webhooks/resend/:delivery_id - Resend a webhook
  router.post('/resend/:delivery_id', async (req: Request, res: Response) => {
    const { delivery_id } = req.params;

    const stmt = db.prepare('SELECT * FROM webhook_deliveries WHERE id = ?');
    const delivery = stmt.get(delivery_id) as any;

    if (!delivery) {
      throw new AppError(404, `Webhook delivery ${delivery_id} not found`);
    }

    const payload = JSON.parse(delivery.request_body);
    const newDelivery = await webhookService.triggerManualWebhook(
      delivery.crm,
      delivery.event_type,
      delivery.destination_url,
      payload.data
    );

    res.json(newDelivery);
  });

  // DELETE /webhooks/history - Clear webhook history
  router.delete('/history', (req: Request, res: Response) => {
    db.exec('DELETE FROM webhook_deliveries');
    db.exec('DELETE FROM webhook_events');
    res.json({ success: true, message: 'Webhook history cleared' });
  });

  return router;
}

