import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import {
  CRMType,
  WebhookEventType,
  WebhookEvent,
  WebhookDelivery,
  WebhookPayload,
  AnyRecord,
} from '@mock-crm/shared';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

export class WebhookDeliveryService {
  constructor(private db: Database.Database) {}

  // Create webhook signature
  private createSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  // Get webhook configuration for a CRM
  private getWebhookConfig(crm: CRMType): any {
    const stmt = this.db.prepare('SELECT * FROM webhook_configs WHERE crm = ?');
    return stmt.get(crm);
  }

  // Check if webhooks are enabled for a specific event
  isEventEnabled(crm: CRMType, eventType: WebhookEventType): boolean {
    const config = this.getWebhookConfig(crm);
    if (!config || !config.enabled) return false;

    const eventsEnabled = JSON.parse(config.events_enabled);
    return eventsEnabled[eventType] === true;
  }

  // Queue a webhook event
  queueWebhookEvent(
    crm: CRMType,
    eventType: WebhookEventType,
    resourceType: string,
    resourceId: string,
    payload: AnyRecord
  ): string | null {
    if (!this.isEventEnabled(crm, eventType)) {
      return null;
    }

    const eventId = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO webhook_events (id, crm, event_type, resource_type, resource_id, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      eventId,
      crm,
      eventType,
      resourceType,
      resourceId,
      JSON.stringify(payload),
      new Date().toISOString()
    );

    // Trigger delivery asynchronously
    setTimeout(() => {
      this.deliverWebhook(eventId).catch(console.error);
    }, 0);

    return eventId;
  }

  // Deliver a webhook
  async deliverWebhook(eventId: string, attemptNumber: number = 1): Promise<void> {
    const eventStmt = this.db.prepare('SELECT * FROM webhook_events WHERE id = ?');
    const event = eventStmt.get(eventId) as any;

    if (!event) {
      console.error(`Webhook event ${eventId} not found`);
      return;
    }

    const config = this.getWebhookConfig(event.crm);
    if (!config) {
      console.error(`Webhook config for ${event.crm} not found`);
      return;
    }

    const payload: WebhookPayload = {
      event_type: event.event_type,
      crm: event.crm,
      timestamp: new Date().toISOString(),
      data: JSON.parse(event.payload),
    };

    const payloadString = JSON.stringify(payload);
    const signature = this.createSignature(payloadString, config.secret);
    const timestamp = Date.now().toString();

    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp,
      'X-Webhook-Event': event.event_type,
      'X-Webhook-CRM': event.crm,
    };

    const deliveryId = uuidv4();
    let status: 'pending' | 'delivered' | 'failed' = 'pending';
    let responseStatus: number | undefined;
    let responseBody: string | undefined;
    let errorMessage: string | undefined;
    let deliveredAt: string | undefined;

    try {
      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      responseStatus = response.status;
      responseBody = await response.text();

      if (response.ok) {
        status = 'delivered';
        deliveredAt = new Date().toISOString();
      } else {
        status = 'failed';
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error: any) {
      status = 'failed';
      errorMessage = error.message;
      responseStatus = 0;
    }

    // Store delivery attempt
    const insertDelivery = this.db.prepare(`
      INSERT INTO webhook_deliveries 
      (id, event_id, crm, event_type, destination_url, status, request_headers, request_body,
       response_status, response_body, error_message, attempt_number, created_at, delivered_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDelivery.run(
      deliveryId,
      eventId,
      event.crm,
      event.event_type,
      config.webhook_url,
      status,
      JSON.stringify(headers),
      payloadString,
      responseStatus,
      responseBody,
      errorMessage,
      attemptNumber,
      new Date().toISOString(),
      deliveredAt
    );

    // Retry if failed and under max attempts
    if (status === 'failed' && attemptNumber < MAX_RETRY_ATTEMPTS) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attemptNumber - 1);
      setTimeout(() => {
        this.deliverWebhook(eventId, attemptNumber + 1).catch(console.error);
      }, delay);
    }

    return;
  }

  // Manual webhook trigger
  async triggerManualWebhook(
    crm: CRMType,
    eventType: WebhookEventType,
    destinationUrl: string,
    payload: any,
    secret?: string
  ): Promise<WebhookDelivery> {
    const webhookPayload: WebhookPayload = {
      event_type: eventType,
      crm,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    const payloadString = JSON.stringify(webhookPayload);
    const actualSecret = secret || this.getWebhookConfig(crm)?.secret || 'default-secret';
    const signature = this.createSignature(payloadString, actualSecret);
    const timestamp = Date.now().toString();

    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp,
      'X-Webhook-Event': eventType,
      'X-Webhook-CRM': crm,
    };

    const deliveryId = uuidv4();
    let status: 'pending' | 'delivered' | 'failed' = 'pending';
    let responseStatus: number | undefined;
    let responseBody: string | undefined;
    let errorMessage: string | undefined;
    let deliveredAt: string | undefined;

    try {
      const response = await fetch(destinationUrl, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(5000),
      });

      responseStatus = response.status;
      responseBody = await response.text();

      if (response.ok) {
        status = 'delivered';
        deliveredAt = new Date().toISOString();
      } else {
        status = 'failed';
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error: any) {
      status = 'failed';
      errorMessage = error.message;
      responseStatus = 0;
    }

    const delivery: WebhookDelivery = {
      id: deliveryId,
      event_id: 'manual-trigger',
      crm,
      event_type: eventType,
      destination_url: destinationUrl,
      status,
      request_headers: headers,
      request_body: payloadString,
      response_status: responseStatus,
      response_body: responseBody,
      error_message: errorMessage,
      attempt_number: 1,
      created_at: new Date().toISOString(),
      delivered_at: deliveredAt,
    };

    // Store manual delivery
    const insertDelivery = this.db.prepare(`
      INSERT INTO webhook_deliveries 
      (id, event_id, crm, event_type, destination_url, status, request_headers, request_body,
       response_status, response_body, error_message, attempt_number, created_at, delivered_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDelivery.run(
      deliveryId,
      'manual-trigger',
      crm,
      eventType,
      destinationUrl,
      status,
      JSON.stringify(headers),
      payloadString,
      responseStatus,
      responseBody,
      errorMessage,
      1,
      new Date().toISOString(),
      deliveredAt
    );

    return delivery;
  }

  // Get webhook delivery history
  getDeliveryHistory(filters?: {
    crm?: CRMType;
    event_type?: WebhookEventType;
    status?: string;
    limit?: number;
  }): WebhookDelivery[] {
    let query = 'SELECT * FROM webhook_deliveries WHERE 1=1';
    const params: any[] = [];

    if (filters?.crm) {
      query += ' AND crm = ?';
      params.push(filters.crm);
    }

    if (filters?.event_type) {
      query += ' AND event_type = ?';
      params.push(filters.event_type);
    }

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      ...row,
      request_headers: JSON.parse(row.request_headers),
    }));
  }

  // Update webhook configuration
  updateWebhookConfig(
    crm: CRMType,
    updates: {
      webhook_url?: string;
      secret?: string;
      enabled?: boolean;
      events_enabled?: Record<WebhookEventType, boolean>;
    }
  ): void {
    const config = this.getWebhookConfig(crm);
    if (!config) {
      throw new Error(`Webhook config for ${crm} not found`);
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.webhook_url !== undefined) {
      fields.push('webhook_url = ?');
      values.push(updates.webhook_url);
    }

    if (updates.secret !== undefined) {
      fields.push('secret = ?');
      values.push(updates.secret);
    }

    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }

    if (updates.events_enabled !== undefined) {
      fields.push('events_enabled = ?');
      values.push(JSON.stringify(updates.events_enabled));
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(crm);

    const stmt = this.db.prepare(`
      UPDATE webhook_configs SET ${fields.join(', ')} WHERE crm = ?
    `);

    stmt.run(...values);
  }

  // Get all webhook configurations
  getAllConfigs(): any[] {
    const stmt = this.db.prepare('SELECT * FROM webhook_configs');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      ...row,
      enabled: Boolean(row.enabled),
      events_enabled: JSON.parse(row.events_enabled),
    }));
  }
}

