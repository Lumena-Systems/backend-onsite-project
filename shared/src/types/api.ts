import { CRMType, ResourceType, OperationType } from './crm';

// API Request Log
export interface APIRequestLog {
  id: string;
  crm: CRMType;
  method: string;
  endpoint: string;
  resource_type?: ResourceType;
  status_code: number;
  response_time_ms: number;
  request_headers: Record<string, string>;
  request_body?: string;
  request_query?: string;
  response_body?: string;
  error_message?: string;
  timestamp: string;
}

// Change History
export interface ChangeHistory {
  id: string;
  crm: CRMType;
  resource_type: ResourceType;
  resource_id: string;
  operation: OperationType;
  old_data?: string;
  new_data?: string;
  timestamp: string;
}

// Performance Metrics
export interface PerformanceMetrics {
  total_requests: number;
  requests_by_crm: Record<CRMType, number>;
  requests_by_resource: Record<ResourceType, number>;
  average_response_time: number;
  error_rate: number;
  webhook_delivery_rate: number;
  record_counts: {
    [key in CRMType]: {
      [key in ResourceType]: number;
    };
  };
}

// Event Timeline Entry
export type TimelineEventType = 'api_request' | 'webhook_sent' | 'data_changed';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  crm: CRMType;
  description: string;
  details: any;
  timestamp: string;
}

// WebSocket Events
export type SocketEventType = 
  | 'api_request'
  | 'webhook_sent'
  | 'data_changed'
  | 'metrics_update'
  | 'connection_status';

export interface SocketEvent<T = any> {
  type: SocketEventType;
  data: T;
  timestamp: string;
}

// Testing Scenarios
export type ScenarioType = 
  | 'create_contacts'
  | 'update_deals'
  | 'bulk_update'
  | 'rate_limit'
  | 'api_errors'
  | 'rapid_changes'
  | 'delete_contacts';

export interface TestScenario {
  id: ScenarioType;
  name: string;
  description: string;
  expected_behavior: string;
}

export interface ScenarioResult {
  scenario_id: ScenarioType;
  success: boolean;
  details: string;
  records_affected: number;
  webhooks_triggered: number;
  timestamp: string;
}

// Latency Test
export interface LatencyTest {
  id: string;
  crm: CRMType;
  resource_type: ResourceType;
  resource_id: string;
  operation: OperationType;
  test_timestamp: string;
  verification_timestamp?: string;
  latency_ms?: number;
  status: 'pending' | 'verified' | 'timeout';
}

// Error Response
export interface APIError {
  error: string;
  message: string;
  status_code: number;
  timestamp: string;
}

