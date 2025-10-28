import { CRMType, ResourceType, PaginatedResponse, QueryParams } from '@mock-crm/shared';

// Use empty string to use the same origin (Vite will proxy to backend)
const API_BASE = '';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // CRM API methods
  async getCRMResources<T>(
    crm: CRMType,
    resource: ResourceType,
    params?: QueryParams
  ): Promise<PaginatedResponse<T>> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request(`/api/${crm}/${resource}${queryString}`);
  }

  async getCRMResource<T>(
    crm: CRMType,
    resource: ResourceType,
    id: string
  ): Promise<T> {
    return this.request(`/api/${crm}/${resource}/${id}`);
  }

  async createCRMResource<T>(
    crm: CRMType,
    resource: ResourceType,
    data: Partial<T>
  ): Promise<T> {
    return this.request(`/api/${crm}/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCRMResource<T>(
    crm: CRMType,
    resource: ResourceType,
    id: string,
    data: Partial<T>
  ): Promise<T> {
    return this.request(`/api/${crm}/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCRMResource(
    crm: CRMType,
    resource: ResourceType,
    id: string
  ): Promise<void> {
    await fetch(`${this.baseURL}/api/${crm}/${resource}/${id}`, {
      method: 'DELETE',
    });
  }

  // Webhook methods
  async getWebhookConfigs() {
    return this.request('/webhooks/config');
  }

  async getWebhookConfig(crm: CRMType) {
    return this.request(`/webhooks/config/${crm}`);
  }

  async updateWebhookConfig(crm: CRMType, updates: any) {
    return this.request(`/webhooks/config/${crm}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async triggerManualWebhook(data: any) {
    return this.request('/webhooks/trigger', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWebhookHistory(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/webhooks/history${queryString}`);
  }

  async resendWebhook(deliveryId: string) {
    return this.request(`/webhooks/resend/${deliveryId}`, {
      method: 'POST',
    });
  }

  async clearWebhookHistory() {
    return this.request('/webhooks/history', {
      method: 'DELETE',
    });
  }

  // Testing methods
  async runScenario(scenarioId: string) {
    return this.request(`/testing/scenarios/${scenarioId}`, {
      method: 'POST',
    });
  }

  async createLatencyTest(data: any) {
    return this.request('/testing/latency-tests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyLatencyTest(testId: string) {
    return this.request(`/testing/latency-tests/${testId}/verify`, {
      method: 'PUT',
    });
  }

  async getLatencyTests() {
    return this.request('/testing/latency-tests');
  }

  // Monitoring methods
  async getMetrics() {
    return this.request('/monitoring/metrics');
  }

  async getLogs(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/monitoring/logs${queryString}`);
  }

  async getTimeline(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/monitoring/timeline${queryString}`);
  }

  async getChanges(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/monitoring/changes${queryString}`);
  }

  async getData(crm: CRMType, resource: ResourceType, params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/monitoring/data/${crm}/${resource}${queryString}`);
  }

  async resetData() {
    return this.request('/monitoring/reset', {
      method: 'POST',
    });
  }

  async clearLogs() {
    return this.request('/monitoring/logs', {
      method: 'DELETE',
    });
  }

  async clearTimeline() {
    return this.request('/monitoring/timeline', {
      method: 'DELETE',
    });
  }
}

export const api = new APIClient();

