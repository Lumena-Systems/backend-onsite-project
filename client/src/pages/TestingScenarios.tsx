import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FlaskConical, Play, Info } from 'lucide-react';
import { api } from '../utils/api';

export function TestingScenarios() {
  const [loading, setLoading] = useState<string | null>(null);

  const scenarios = [
    {
      id: 'create-contacts',
      name: 'Create 5 Contacts in Salesforce',
      description: 'Creates 5 new random contacts in Salesforce with realistic data',
      expectedBehavior: '5 new contacts will be created and 5 webhooks will be triggered',
      icon: '👥',
    },
    {
      id: 'update-deals',
      name: 'Update 3 Deals in HubSpot',
      description: 'Updates 3 existing deals with new amounts and stages',
      expectedBehavior: '3 deals will be modified and 3 update webhooks will be sent',
      icon: '💰',
    },
    {
      id: 'bulk-update',
      name: 'Bulk Update: 25 Records',
      description: 'Updates 25 records across all CRMs to test sync performance',
      expectedBehavior: 'Tests your sync engine\'s ability to handle batch updates efficiently',
      icon: '⚡',
    },
    {
      id: 'rate-limit',
      name: 'Simulate Salesforce Rate Limit',
      description: 'Enables rate limiting (429 errors) for 30 seconds',
      expectedBehavior: 'Your sync engine should handle rate limits with backoff and retry',
      icon: '🚦',
    },
    {
      id: 'api-errors',
      name: 'Simulate HubSpot API Errors',
      description: 'Returns 500 errors randomly for 30 seconds',
      expectedBehavior: 'Your sync engine should gracefully handle and retry failed requests',
      icon: '❌',
    },
    {
      id: 'rapid-changes',
      name: 'Create Rapid Changes',
      description: 'Creates 10 records over 30 seconds to test real-time sync',
      expectedBehavior: 'Your sync should pick up and sync changes within the latency target',
      icon: '🔄',
    },
    {
      id: 'delete-contacts',
      name: 'Delete 5 Random Contacts',
      description: 'Deletes 5 contacts from Salesforce',
      expectedBehavior: 'Deletion webhooks will be triggered; your API should handle deletions',
      icon: '🗑️',
    },
  ];

  const runScenario = async (scenarioId: string) => {
    setLoading(scenarioId);
    try {
      const result = await api.runScenario(scenarioId);
      toast.success(result.details || 'Scenario completed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Scenario failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="text-primary-600" size={32} />
            <h1 className="text-3xl font-bold">Testing Scenarios</h1>
          </div>
          <p className="text-gray-600">
            Pre-built test scenarios to validate your sync engine implementation
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="card hover:shadow-md transition-smooth">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{scenario.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{scenario.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{scenario.description}</p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-900">
                        <strong>Expected:</strong> {scenario.expectedBehavior}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => runScenario(scenario.id)}
                    disabled={loading === scenario.id}
                    className="btn btn-primary w-full"
                  >
                    {loading === scenario.id ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Running...
                      </>
                    ) : (
                      <>
                        <Play size={16} className="inline mr-2" />
                        Run Scenario
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="card mt-8 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-lg mb-3">💡 Testing Tips</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Start with simple scenarios (create contacts) before moving to complex ones</li>
            <li>• Monitor the webhook deliveries and API logs in real-time</li>
            <li>• Use the latency tests to measure your sync performance</li>
            <li>• Test error scenarios (rate limits, API errors) to ensure robust error handling</li>
            <li>• Run bulk update scenarios to test performance under load</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

