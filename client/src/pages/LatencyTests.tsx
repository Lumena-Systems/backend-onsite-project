import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Timer, Play, CheckCircle, Clock } from 'lucide-react';
import { api } from '../utils/api';
import { CRMType } from '@mock-crm/shared';

export function LatencyTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTest, setActiveTest] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    if (!activeTest) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(activeTest.test_timestamp).getTime();
      setElapsedTime(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [activeTest]);

  const loadTests = async () => {
    try {
      const data = await api.getLatencyTests();
      setTests(data);
    } catch (error) {
      console.error('Failed to load tests:', error);
    }
  };

  const startLatencyTest = async () => {
    setLoading(true);
    try {
      const test = await api.createLatencyTest({
        crm: 'salesforce',
        resource_type: 'contacts',
      });
      setActiveTest(test);
      await loadTests();
      toast.success('Latency test started!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyTest = async (testId: string) => {
    try {
      const result = await api.verifyLatencyTest(testId);
      toast.success(`Latency: ${(result.latency_ms / 1000).toFixed(2)}s`);
      setActiveTest(null);
      await loadTests();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getLatencyColor = (latencyMs: number) => {
    if (latencyMs < 30000) return 'text-green-600';
    if (latencyMs < 60000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLatencyLabel = (latencyMs: number) => {
    if (latencyMs < 30000) return 'Excellent';
    if (latencyMs < 60000) return 'Acceptable';
    return 'Needs Improvement';
  };

  const averageLatency = tests
    .filter((t) => t.latency_ms)
    .reduce((sum, t) => sum + t.latency_ms, 0) / 
    (tests.filter((t) => t.latency_ms).length || 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Timer className="text-primary-600" size={32} />
            <h1 className="text-3xl font-bold">Sync Latency Tests</h1>
          </div>
          <p className="text-gray-600">
            Measure how quickly your sync engine picks up changes from the mock CRMs
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Start New Test */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Start Latency Test</h2>
            
            {!activeTest ? (
              <div>
                <p className="text-gray-600 mb-6">
                  This will create a new contact in Salesforce and start timing.
                  Once you see the contact in your unified API, click "Verify Sync"
                  to record the latency.
                </p>
                <button
                  onClick={startLatencyTest}
                  disabled={loading}
                  className="btn btn-primary w-full"
                >
                  {loading ? (
                    'Starting...'
                  ) : (
                    <>
                      <Play size={16} className="inline mr-2" />
                      Start Latency Test
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-blue-900 mb-2">
                    <strong>Test Record Created:</strong>
                  </div>
                  <div className="font-mono text-xs bg-white p-2 rounded mb-2">
                    CRM: {activeTest.crm}<br />
                    Resource: {activeTest.resource_type}<br />
                    ID: {activeTest.resource_id}
                  </div>
                  <div className="text-xs text-blue-700">
                    Created at: {new Date(activeTest.test_timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <div className="bg-white border-2 border-primary-600 rounded-lg p-6 mb-4 text-center">
                  <div className="text-6xl font-bold mb-2">
                    <span className={getLatencyColor(elapsedTime)}>
                      {(elapsedTime / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <div className="text-lg text-gray-600 mb-2">
                    {getLatencyLabel(elapsedTime)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Target: &lt;60 seconds
                  </div>
                </div>

                <button
                  onClick={() => verifyTest(activeTest.id)}
                  className="btn btn-success w-full"
                >
                  <CheckCircle size={16} className="inline mr-2" />
                  Verify Sync Complete
                </button>
              </div>
            )}
          </div>

          {/* Test History */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Test History</h2>
            
            {tests.filter(t => t.status === 'verified').length > 0 && (
              <div className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600 mb-1">Average Latency</div>
                <div className="text-3xl font-bold text-primary-600">
                  {(averageLatency / 1000).toFixed(2)}s
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {tests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No latency tests yet
                </div>
              ) : (
                tests.map((test) => (
                  <div
                    key={test.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">
                        {test.crm} - {test.resource_type}
                      </span>
                      {test.status === 'verified' && test.latency_ms && (
                        <span
                          className={`font-bold ${getLatencyColor(test.latency_ms)}`}
                        >
                          {(test.latency_ms / 1000).toFixed(2)}s
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Operation: {test.operation}</div>
                      <div>
                        Started: {new Date(test.test_timestamp).toLocaleString()}
                      </div>
                      {test.status === 'verified' && (
                        <div className="mt-2">
                          <span
                            className={`badge ${
                              test.latency_ms < 30000
                                ? 'badge-success'
                                : test.latency_ms < 60000
                                ? 'badge-warning'
                                : 'badge-error'
                            }`}
                          >
                            {getLatencyLabel(test.latency_ms)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Performance Target */}
        <div className="card mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <div className="flex items-start gap-4">
            <Clock size={32} className="text-yellow-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Performance Target</h3>
              <p className="text-gray-700 mb-3">
                Your sync engine should detect and sync changes within <strong>60 seconds</strong> of
                when they occur in the mock CRM systems. Aim for consistently low latency across
                multiple tests.
              </p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded p-3 border border-green-200">
                  <div className="text-green-600 font-semibold mb-1">&lt;30 seconds</div>
                  <div className="text-gray-600">Excellent</div>
                </div>
                <div className="bg-white rounded p-3 border border-yellow-200">
                  <div className="text-yellow-600 font-semibold mb-1">30-60 seconds</div>
                  <div className="text-gray-600">Acceptable</div>
                </div>
                <div className="bg-white rounded p-3 border border-red-200">
                  <div className="text-red-600 font-semibold mb-1">&gt;60 seconds</div>
                  <div className="text-gray-600">Needs Improvement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

