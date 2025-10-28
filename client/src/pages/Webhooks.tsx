import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Webhook as WebhookIcon, Send, History, Settings } from 'lucide-react';
import { api } from '../utils/api';
import { Modal } from '../components/Modal';
import { CRMType } from '@mock-crm/shared';

export function Webhooks() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [selectedCRM, setSelectedCRM] = useState<CRMType>('salesforce');
  const [loading, setLoading] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [editingCRM, setEditingCRM] = useState<CRMType | null>(null);
  const [editURL, setEditURL] = useState('');

  // Trigger form state
  const [triggerForm, setTriggerForm] = useState({
    crm: 'salesforce' as CRMType,
    event_type: 'contact.created',
    destination_url: 'http://localhost:4000/webhooks/test',
    resource_id: '',
    custom_payload: '',
  });

  useEffect(() => {
    loadConfigs();
    loadHistory();
  }, []);

  const loadConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const data = await api.getWebhookConfigs();
      console.log('Loaded configs:', data);
      setConfigs(data);
    } catch (error) {
      console.error('Failed to load configs:', error);
      toast.error('Failed to load webhook configurations');
    } finally {
      setLoadingConfigs(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.getWebhookHistory({ limit: 50 });
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const toggleWebhook = async (crm: CRMType, enabled: boolean) => {
    try {
      await api.updateWebhookConfig(crm, { enabled: !enabled });
      await loadConfigs();
      toast.success(`Webhooks ${!enabled ? 'enabled' : 'disabled'} for ${crm}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const startEditingURL = (crm: CRMType, currentURL: string) => {
    setEditingCRM(crm);
    setEditURL(currentURL);
  };

  const saveWebhookURL = async (crm: CRMType) => {
    try {
      await api.updateWebhookConfig(crm, { webhook_url: editURL });
      await loadConfigs();
      setEditingCRM(null);
      toast.success(`Webhook URL updated for ${crm}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const triggerWebhook = async () => {
    setLoading(true);
    try {
      const result = await api.triggerManualWebhook(triggerForm);
      toast.success('Webhook sent successfully!');
      setShowTriggerModal(false);
      await loadHistory();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <WebhookIcon className="text-primary-600" size={32} />
            <h1 className="text-3xl font-bold">Webhooks</h1>
          </div>
          <p className="text-gray-600">
            Configure webhook endpoints, trigger manual webhooks, and view delivery history
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuration */}
          <div>
            <div className="card mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings size={20} className="text-primary-600" />
                <h2 className="text-xl font-semibold">Webhook Configuration</h2>
              </div>

              {loadingConfigs ? (
                <div className="text-center py-8 text-gray-500">
                  Loading configurations...
                </div>
              ) : configs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No webhook configurations found</p>
                  <p className="text-sm mt-2">The backend may not be running</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {configs.map((config) => (
                    <div key={config.crm} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-smooth">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold capitalize">{config.crm}</h3>
                          <button
                            onClick={() => toggleWebhook(config.crm, config.enabled)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-smooth ${
                              config.enabled
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {config.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">Webhook URL:</span>
                            {editingCRM !== config.crm && (
                              <button
                                onClick={() => startEditingURL(config.crm, config.webhook_url)}
                                className="text-primary-600 hover:text-primary-700 text-xs"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          {editingCRM === config.crm ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editURL}
                                onChange={(e) => setEditURL(e.target.value)}
                                className="input text-xs flex-1"
                                placeholder="http://localhost:4000/webhooks"
                              />
                              <button
                                onClick={() => saveWebhookURL(config.crm)}
                                className="btn btn-primary text-xs px-3"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCRM(null)}
                                className="btn btn-secondary text-xs px-3"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                              {config.webhook_url}
                            </code>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Secret:</span>{' '}
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {config.secret.slice(0, 20)}...
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Trigger */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Send size={20} className="text-primary-600" />
                  <h2 className="text-xl font-semibold">Manual Trigger</h2>
                </div>
                <button
                  onClick={() => setShowTriggerModal(true)}
                  className="btn btn-primary"
                >
                  Trigger Webhook
                </button>
              </div>
              <p className="text-gray-600 text-sm">
                Manually send a webhook to test your endpoint integration
              </p>
            </div>
          </div>

          {/* History */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History size={20} className="text-primary-600" />
                <h2 className="text-xl font-semibold">Delivery History</h2>
              </div>
              <button
                onClick={async () => {
                  await api.clearWebhookHistory();
                  await loadHistory();
                  toast.success('History cleared');
                }}
                className="btn btn-secondary text-sm"
              >
                Clear History
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No webhook deliveries yet
                </div>
              ) : (
                history.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-smooth"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{delivery.crm}</span>
                        <span className="text-gray-400">•</span>
                        <code className="text-sm text-primary-600">
                          {delivery.event_type}
                        </code>
                      </div>
                      <span
                        className={`badge ${
                          delivery.status === 'delivered'
                            ? 'badge-success'
                            : delivery.status === 'failed'
                            ? 'badge-error'
                            : 'badge-warning'
                        }`}
                      >
                        {delivery.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <div>URL: {delivery.destination_url}</div>
                      <div>
                        Status: {delivery.response_status || 'No response'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(delivery.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Trigger Modal */}
      <Modal
        isOpen={showTriggerModal}
        onClose={() => setShowTriggerModal(false)}
        title="Trigger Manual Webhook"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">CRM</label>
            <select
              className="input"
              value={triggerForm.crm}
              onChange={(e) =>
                setTriggerForm({ ...triggerForm, crm: e.target.value as CRMType })
              }
            >
              <option value="salesforce">Salesforce</option>
              <option value="hubspot">HubSpot</option>
              <option value="pipedrive">Pipedrive</option>
            </select>
          </div>

          <div>
            <label className="label">Event Type</label>
            <select
              className="input"
              value={triggerForm.event_type}
              onChange={(e) =>
                setTriggerForm({ ...triggerForm, event_type: e.target.value })
              }
            >
              <option value="contact.created">contact.created</option>
              <option value="contact.updated">contact.updated</option>
              <option value="contact.deleted">contact.deleted</option>
              <option value="deal.created">deal.created</option>
              <option value="deal.updated">deal.updated</option>
              <option value="deal.deleted">deal.deleted</option>
            </select>
          </div>

          <div>
            <label className="label">Destination URL</label>
            <input
              type="text"
              className="input"
              value={triggerForm.destination_url}
              onChange={(e) =>
                setTriggerForm({ ...triggerForm, destination_url: e.target.value })
              }
              placeholder="http://localhost:4000/webhooks/test"
            />
          </div>

          <div>
            <label className="label">Resource ID (leave empty for test payload)</label>
            <input
              type="text"
              className="input"
              value={triggerForm.resource_id}
              onChange={(e) =>
                setTriggerForm({ ...triggerForm, resource_id: e.target.value })
              }
              placeholder="Optional: ID of existing record"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowTriggerModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={triggerWebhook}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Sending...' : 'Send Webhook'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

