import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../utils/api';
import { useWebSocket } from '../hooks/useWebSocket';

export function Monitoring() {
  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    loadMetrics();
    loadLogs();

    const interval = setInterval(() => {
      loadMetrics();
      loadLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (event.type === 'api_request') {
        setLogs((prev) => [event.data, ...prev].slice(0, 100));
      }
      if (event.type === 'metrics_update') {
        setMetrics(event.data);
      }
    });

    return unsubscribe;
  }, [subscribe]);

  const loadMetrics = async () => {
    try {
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await api.getLogs({ limit: 100 });
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600 bg-green-100';
    if (statusCode >= 400 && statusCode < 500) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-primary-600" size={32} />
            <h1 className="text-3xl font-bold">Real-Time Monitoring</h1>
          </div>
          <p className="text-gray-600">
            Live API request logs, performance metrics, and system health
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="text-primary-600" size={20} />
                <h3 className="text-sm font-medium text-gray-600">Total Requests</h3>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {metrics.total_requests}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-blue-600" size={20} />
                <h3 className="text-sm font-medium text-gray-600">Avg Response Time</h3>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {metrics.average_response_time.toFixed(0)}
                <span className="text-lg text-gray-600 ml-1">ms</span>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="text-red-600" size={20} />
                <h3 className="text-sm font-medium text-gray-600">Error Rate</h3>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {metrics.error_rate.toFixed(1)}
                <span className="text-lg text-gray-600 ml-1">%</span>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="text-green-600" size={20} />
                <h3 className="text-sm font-medium text-gray-600">Webhook Success</h3>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {metrics.webhook_delivery_rate.toFixed(0)}
                <span className="text-lg text-gray-600 ml-1">%</span>
              </div>
            </div>
          </div>
        )}

        {/* Request Counts by CRM */}
        {metrics && (
          <div className="card mb-8">
            <h2 className="text-lg font-semibold mb-4">Requests by CRM</h2>
            <div className="grid grid-cols-3 gap-6">
              {Object.entries(metrics.requests_by_crm).map(([crm, count]) => (
                <div key={crm} className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{count as number}</div>
                  <div className="text-sm text-gray-600 capitalize">{crm}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Request Logs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">API Request Log</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded"
                />
                Auto-scroll
              </label>
              <button
                onClick={async () => {
                  await api.clearLogs();
                  setLogs([]);
                }}
                className="btn btn-secondary text-sm"
              >
                Clear Logs
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No requests yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Time</th>
                    <th className="text-left py-3 px-4">CRM</th>
                    <th className="text-left py-3 px-4">Method</th>
                    <th className="text-left py-3 px-4">Endpoint</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr key={log.id || idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-xs text-gray-600">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="badge badge-info capitalize">{log.crm}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold">
                          {log.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{log.endpoint}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            log.status_code
                          )}`}
                        >
                          {log.status_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {log.response_time_ms.toFixed(0)}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

