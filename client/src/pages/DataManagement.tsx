import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Database, Plus, Trash2, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';
import { CRMType, ResourceType } from '@mock-crm/shared';

export function DataManagement() {
  const [selectedCRM, setSelectedCRM] = useState<CRMType>('salesforce');
  const [selectedResource, setSelectedResource] = useState<ResourceType>('contacts');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentlyModified, setRecentlyModified] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [selectedCRM, selectedResource]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.getData(selectedCRM, selectedResource, { limit: 50 });
      setData(result.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all data? This will restore the default seed data.')) {
      return;
    }
    try {
      await api.resetData();
      await loadData();
      toast.success('Data has been reset');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }
    try {
      await api.deleteCRMResource(selectedCRM, selectedResource, id);
      await loadData();
      toast.success('Record deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getFieldsForDisplay = (record: any) => {
    const { id, created_at, updated_at, ...fields } = record;
    return Object.entries(fields).slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Database className="text-primary-600" size={32} />
                <h1 className="text-3xl font-bold">Data Management</h1>
              </div>
              <p className="text-gray-600">
                View and manage mock CRM data across all systems
              </p>
            </div>
            <button onClick={handleReset} className="btn btn-danger">
              <RefreshCw size={16} className="inline mr-2" />
              Reset All Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* CRM Selector */}
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            {(['salesforce', 'hubspot', 'pipedrive'] as CRMType[]).map((crm) => (
              <button
                key={crm}
                onClick={() => setSelectedCRM(crm)}
                className={`px-6 py-3 rounded-lg font-medium transition-smooth ${
                  selectedCRM === crm
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {crm.charAt(0).toUpperCase() + crm.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            {(['contacts', 'deals', 'companies'] as ResourceType[]).map((resource) => (
              <button
                key={resource}
                onClick={() => setSelectedResource(resource)}
                className={`px-4 py-2 rounded-md font-medium transition-smooth ${
                  selectedResource === resource
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {resource.charAt(0).toUpperCase() + resource.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {selectedCRM.charAt(0).toUpperCase() + selectedCRM.slice(1)} -{' '}
              {selectedResource.charAt(0).toUpperCase() + selectedResource.slice(1)}
            </h2>
            <button onClick={loadData} className="btn btn-secondary text-sm">
              <RefreshCw size={14} className="inline mr-1" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4">ID</th>
                    {getFieldsForDisplay(data[0]).map(([key]) => (
                      <th key={key} className="text-left py-3 px-4">
                        {key}
                      </th>
                    ))}
                    <th className="text-left py-3 px-4">Updated</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((record) => {
                    const isRecent =
                      new Date().getTime() - new Date(record.updated_at).getTime() <
                      30000;
                    return (
                      <tr
                        key={record.id}
                        className={`border-b hover:bg-gray-50 transition-smooth ${
                          isRecent ? 'recently-modified' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-xs text-gray-600">
                          {record.id.slice(0, 8)}...
                        </td>
                        {getFieldsForDisplay(record).map(([key, value]) => (
                          <td key={key} className="py-3 px-4">
                            {String(value).slice(0, 30)}
                            {String(value).length > 30 ? '...' : ''}
                          </td>
                        ))}
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {new Date(record.updated_at).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

