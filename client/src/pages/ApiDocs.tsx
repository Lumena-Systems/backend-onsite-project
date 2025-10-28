import React, { useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import { CopyButton } from '../components/CopyButton';
import { FileText, Server, Key } from 'lucide-react';

export function ApiDocs() {
  const [selectedCRM, setSelectedCRM] = useState<'salesforce' | 'hubspot' | 'pipedrive'>('salesforce');

  const crmSchemas = {
    salesforce: {
      contact: {
        Email: 'string',
        FirstName: 'string',
        LastName: 'string',
        Phone: 'string',
        AccountId: 'string',
        OwnerId: 'string',
        Title: 'string',
        Department: 'string',
      },
      deal: {
        Name: 'string',
        Amount: 'number',
        Stage: 'string',
        CloseDate: 'string (ISO 8601)',
        ContactId: 'string',
        AccountId: 'string',
        Probability: 'number',
        Description: 'string',
      },
      company: {
        Name: 'string',
        Industry: 'string',
        Phone: 'string',
        Website: 'string',
        NumberOfEmployees: 'number',
        AnnualRevenue: 'number',
        BillingStreet: 'string',
        BillingCity: 'string',
        BillingState: 'string',
        BillingCountry: 'string',
      },
    },
    hubspot: {
      contact: {
        email_address: 'string',
        firstname: 'string',
        lastname: 'string',
        phone_number: 'string',
        company_id: 'string',
        owner_id: 'string',
        job_title: 'string',
        department: 'string',
      },
      deal: {
        deal_name: 'string',
        amount: 'number',
        deal_stage: 'string',
        close_date: 'string (ISO 8601)',
        contact_id: 'string',
        company_id: 'string',
        probability: 'number',
        description: 'string',
      },
      company: {
        company_name: 'string',
        industry: 'string',
        phone: 'string',
        website: 'string',
        number_of_employees: 'number',
        annual_revenue: 'number',
        street_address: 'string',
        city: 'string',
        state: 'string',
        country: 'string',
      },
    },
    pipedrive: {
      contact: {
        email: 'string',
        first_name: 'string',
        last_name: 'string',
        phone: 'string',
        organization_id: 'string',
        owner_id: 'string',
        job_title: 'string',
        department: 'string',
      },
      deal: {
        title: 'string',
        value: 'number',
        status: 'string',
        expected_close_date: 'string (ISO 8601)',
        person_id: 'string',
        organization_id: 'string',
        probability: 'number',
        description: 'string',
      },
      company: {
        name: 'string',
        industry: 'string',
        phone: 'string',
        website: 'string',
        people_count: 'number',
        annual_revenue: 'number',
        address_street: 'string',
        address_city: 'string',
        address_state: 'string',
        address_country: 'string',
      },
    },
  };

  const CodeBlock = ({ code, language = 'json' }: { code: string; language?: string }) => {
    const highlighted = Prism.highlight(code, Prism.languages[language], language);
    
    return (
      <div className="relative">
        <div className="absolute top-2 right-2">
          <CopyButton text={code} />
        </div>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="text-primary-600" size={32} />
            <h1 className="text-3xl font-bold">API Documentation</h1>
          </div>
          <p className="text-gray-600">
            Complete reference for the Mock CRM APIs including endpoints, schemas, and examples
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* CRM Selector */}
        <div className="mb-8">
          <div className="flex gap-4 border-b border-gray-200">
            {(['salesforce', 'hubspot', 'pipedrive'] as const).map((crm) => (
              <button
                key={crm}
                onClick={() => setSelectedCRM(crm)}
                className={`px-6 py-3 font-medium transition-smooth border-b-2 ${
                  selectedCRM === crm
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {crm.charAt(0).toUpperCase() + crm.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Authentication */}
        <div className="card mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Key className="text-primary-600" size={20} />
            <h2 className="text-xl font-semibold">Authentication</h2>
          </div>
          <p className="text-gray-700 mb-4">
            All API requests require an API key in the request headers. For testing purposes,
            you can use any value or omit the header entirely.
          </p>
          <CodeBlock
            code={`X-API-Key: your-api-key-here`}
            language="bash"
          />
        </div>

        {/* Base URL */}
        <div className="card mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Server className="text-primary-600" size={20} />
            <h2 className="text-xl font-semibold">Base URL</h2>
          </div>
          <CodeBlock
            code={`http://localhost:5000/api/${selectedCRM}`}
            language="bash"
          />
        </div>

        {/* Endpoints */}
        <div className="space-y-8">
          {/* List Contacts */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded font-mono text-sm font-semibold">
                GET
              </span>
              <h3 className="text-lg font-semibold">List Contacts</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">Retrieve a paginated list of contacts.</p>
              <CodeBlock
                code={`GET /api/${selectedCRM}/contacts?limit=50&offset=0`}
                language="bash"
              />
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Query Parameters</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Parameter</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b">
                    <td className="py-2 font-mono">limit</td>
                    <td className="py-2">number</td>
                    <td className="py-2">Number of records to return (max: 100, default: 50)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">offset</td>
                    <td className="py-2">number</td>
                    <td className="py-2">Number of records to skip (default: 0)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">updated_since</td>
                    <td className="py-2">string</td>
                    <td className="py-2">ISO 8601 timestamp - only return records updated after this time</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Example Response</h4>
              <CodeBlock
                code={JSON.stringify({
                  data: [
                    {
                      id: "550e8400-e29b-41d4-a716-446655440000",
                      ...Object.fromEntries(
                        Object.entries(crmSchemas[selectedCRM].contact).map(([key]) => [
                          key,
                          key.toLowerCase().includes('email') ? 'john.doe@example.com' :
                          key.toLowerCase().includes('name') ? 'John Doe' :
                          key.toLowerCase().includes('phone') ? '+1-555-0123' :
                          'Sample value'
                        ])
                      ),
                      created_at: "2024-01-15T10:30:00Z",
                      updated_at: "2024-01-20T15:45:00Z"
                    }
                  ],
                  pagination: {
                    total: 150,
                    limit: 50,
                    offset: 0,
                    has_more: true
                  }
                }, null, 2)}
              />
            </div>
          </div>

          {/* Get Single Contact */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded font-mono text-sm font-semibold">
                GET
              </span>
              <h3 className="text-lg font-semibold">Get Contact by ID</h3>
            </div>
            
            <CodeBlock
              code={`GET /api/${selectedCRM}/contacts/{id}`}
              language="bash"
            />
          </div>

          {/* Create Contact */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded font-mono text-sm font-semibold">
                POST
              </span>
              <h3 className="text-lg font-semibold">Create Contact</h3>
            </div>
            
            <div className="mb-4">
              <CodeBlock
                code={`POST /api/${selectedCRM}/contacts`}
                language="bash"
              />
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Request Body</h4>
              <CodeBlock
                code={JSON.stringify(
                  Object.fromEntries(
                    Object.entries(crmSchemas[selectedCRM].contact).slice(0, 4).map(([key]) => [
                      key,
                      key.toLowerCase().includes('email') ? 'jane.smith@example.com' :
                      key.toLowerCase().includes('name') ? 'Jane Smith' :
                      'value'
                    ])
                  ),
                  null,
                  2
                )}
              />
            </div>
          </div>

          {/* Update Contact */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded font-mono text-sm font-semibold">
                PUT
              </span>
              <h3 className="text-lg font-semibold">Update Contact</h3>
            </div>
            
            <CodeBlock
              code={`PUT /api/${selectedCRM}/contacts/{id}`}
              language="bash"
            />
          </div>

          {/* Delete Contact */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded font-mono text-sm font-semibold">
                DELETE
              </span>
              <h3 className="text-lg font-semibold">Delete Contact</h3>
            </div>
            
            <CodeBlock
              code={`DELETE /api/${selectedCRM}/contacts/{id}`}
              language="bash"
            />
          </div>

          {/* Schema Reference */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Schema Reference</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Contact Schema</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-3">Field</th>
                      <th className="text-left py-2 px-3">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(crmSchemas[selectedCRM].contact).map(([field, type]) => (
                      <tr key={field} className="border-b">
                        <td className="py-2 px-3 font-mono text-primary-600">{field}</td>
                        <td className="py-2 px-3 text-gray-700">{type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <p className="text-sm text-gray-600">
                  Note: The same endpoints are available for <code className="px-2 py-1 bg-gray-100 rounded">deals</code> and{' '}
                  <code className="px-2 py-1 bg-gray-100 rounded">companies</code> resources.
                  Replace <code className="px-2 py-1 bg-gray-100 rounded">contacts</code> with the desired resource type.
                </p>
              </div>
            </div>
          </div>

          {/* Webhook Documentation */}
          <div className="card bg-purple-50 border-purple-200">
            <h3 className="text-xl font-semibold mb-4">Webhooks</h3>
            <p className="text-gray-700 mb-4">
              When data changes occur (create, update, delete), webhooks are automatically triggered
              if enabled. See the Webhooks page to configure webhook URLs and manage deliveries.
            </p>
            <div className="bg-white p-4 rounded border border-purple-200">
              <h4 className="font-semibold mb-2">Event Types</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <code className="px-2 py-1 bg-gray-100 rounded">contact.created</code></li>
                <li>• <code className="px-2 py-1 bg-gray-100 rounded">contact.updated</code></li>
                <li>• <code className="px-2 py-1 bg-gray-100 rounded">contact.deleted</code></li>
                <li>• <code className="px-2 py-1 bg-gray-100 rounded">deal.created</code></li>
                <li>• <code className="px-2 py-1 bg-gray-100 rounded">deal.updated</code></li>
                <li>• ... and more</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

