import { CRMType, ResourceType, OperationType, AnyRecord } from './crm';

// Webhook Event Types
export type WebhookEventType = 
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'deal.created'
  | 'deal.updated'
  | 'deal.deleted'
  | 'company.created'
  | 'company.updated'
  | 'company.deleted';

// Webhook Delivery Status
export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed';

// Webhook Event (queued in database)
export interface WebhookEvent {
  id: string;
  crm: CRMType;
  event_type: WebhookEventType;
  resource_type: ResourceType;
  resource_id: string;
  payload: AnyRecord;
  created_at: string;
}

// Webhook Delivery Attempt
export interface WebhookDelivery {
  id: string;
  event_id: string;
  crm: CRMType;
  event_type: WebhookEventType;
  destination_url: string;
  status: WebhookDeliveryStatus;
  request_headers: Record<string, string>;
  request_body: string;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  attempt_number: number;
  created_at: string;
  delivered_at?: string;
}

// Webhook Configuration
export interface WebhookConfig {
  id: string;
  crm: CRMType;
  webhook_url: string;
  secret: string;
  enabled: boolean;
  events_enabled: Record<WebhookEventType, boolean>;
  created_at: string;
  updated_at: string;
}

// Webhook Payload (what gets sent to the destination)
export interface WebhookPayload {
  event_type: WebhookEventType;
  crm: CRMType;
  timestamp: string;
  data: AnyRecord;
}

// Webhook Signature
export interface WebhookSignature {
  signature: string;
  timestamp: string;
}

// Manual Webhook Trigger Request
export interface ManualWebhookRequest {
  crm: CRMType;
  event_type: WebhookEventType;
  resource_id: string;
  destination_url: string;
  custom_payload?: any;
}

