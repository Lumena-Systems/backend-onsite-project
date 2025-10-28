import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Zap, Database, Webhook as WebhookIcon, Activity } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();

  const requirements = [
    'Build a unified API that aggregates data from multiple CRM systems',
    'Implement real-time sync with <1 minute latency',
    'Handle incremental updates and webhook events',
    'Support pagination, filtering, and error handling',
    'Provide consistent API schema across different CRM formats',
  ];

  const features = [
    {
      icon: Database,
      title: 'Mock CRM APIs',
      description: 'Fully functional Salesforce, HubSpot, and Pipedrive APIs with realistic data',
    },
    {
      icon: WebhookIcon,
      title: 'Webhook System',
      description: 'Automatic webhook triggers for data changes with configurable delivery',
    },
    {
      icon: Activity,
      title: 'Real-Time Monitoring',
      description: 'Live request logs, metrics, and performance tracking',
    },
    {
      icon: Zap,
      title: 'Testing Tools',
      description: 'Pre-built scenarios and latency tests to validate your implementation',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-6xl mx-auto px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6">
              <Zap size={16} />
              Work Trial Challenge
            </div>
            <h1 className="text-5xl font-bold mb-6">
              CRM Sync Engine Challenge
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Build a production-ready sync engine that unifies data from multiple CRM systems
              into a single, consistent API. Test your implementation with our comprehensive
              mock CRM environment.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/docs')}
                className="btn btn-primary bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 text-lg"
              >
                View API Docs
                <ArrowRight className="inline ml-2" size={20} />
              </button>
              <button
                onClick={() => navigate('/scenarios')}
                className="btn px-8 py-3 text-lg bg-primary-700 hover:bg-primary-600 text-white"
              >
                Start Testing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">System Architecture</h2>
        
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Mock CRMs */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-center mb-6 text-primary-600">
                Mock CRM Systems
              </h3>
              {['Salesforce', 'HubSpot', 'Pipedrive'].map((crm) => (
                <div key={crm} className="card border-2 border-primary-200">
                  <div className="font-medium">{crm}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    GET /api/{crm.toLowerCase()}/contacts
                  </div>
                  <div className="text-sm text-gray-600">
                    + Webhooks
                  </div>
                </div>
              ))}
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <div className="space-y-6 text-center">
                <ArrowRight size={48} className="text-primary-600 mx-auto" />
                <div className="text-sm text-gray-600">
                  <div className="font-medium">Your Sync Engine</div>
                  <div className="mt-2 space-y-1">
                    <div>• Fetch & Transform</div>
                    <div>• Listen to Webhooks</div>
                    <div>• Store & Normalize</div>
                  </div>
                </div>
                <ArrowRight size={48} className="text-primary-600 mx-auto" />
              </div>
            </div>

            {/* Unified API */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-center mb-6 text-green-600">
                Unified API
              </h3>
              <div className="card border-2 border-green-200 bg-green-50">
                <div className="font-medium">Consistent Schema</div>
                <div className="text-sm text-gray-600 mt-1">
                  GET /contacts
                </div>
                <div className="text-sm text-gray-600">
                  GET /deals
                </div>
                <div className="text-sm text-gray-600">
                  GET /companies
                </div>
                <div className="mt-4 text-sm">
                  <div className="font-medium text-green-700">✓ Normalized fields</div>
                  <div className="font-medium text-green-700">✓ Real-time updates</div>
                  <div className="font-medium text-green-700">✓ &lt;1 min latency</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Challenge Requirements</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                Core Objectives
              </h3>
              <ul className="space-y-3">
                {requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-primary-600 font-bold mt-1">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card bg-yellow-50 border-yellow-200">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Zap className="text-yellow-600" size={20} />
                Performance Target
              </h3>
              <div className="text-center py-8">
                <div className="text-6xl font-bold text-yellow-600 mb-2">
                  &lt;1
                </div>
                <div className="text-2xl font-semibold text-gray-700">
                  minute sync latency
                </div>
                <p className="text-gray-600 mt-4">
                  Changes in mock CRMs should appear in your unified API
                  within 60 seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Testing Environment Features</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="card hover:shadow-md transition-smooth">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <feature.icon size={24} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Explore the API documentation and start building your sync engine
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/docs')}
              className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 text-lg"
            >
              Read the Docs
            </button>
            <button
              onClick={() => navigate('/monitoring')}
              className="btn bg-primary-700 hover:bg-primary-500 text-white px-8 py-3 text-lg"
            >
              View Monitoring Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

