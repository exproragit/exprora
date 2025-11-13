'use client';

import { Code, Key, Book } from 'lucide-react';

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Book className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Documentation</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Authentication */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Authentication
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              All API requests require authentication using your API key. Include it in the header:
            </p>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
              <code>{`X-API-Key: your_api_key_here`}</code>
            </pre>
          </section>

          {/* SDK Integration */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Code className="w-5 h-5" />
              SDK Integration
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Add the SDK to your website:
            </p>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
              <code>{`<script src="https://cdn.exprora.com/sdk.js"></script>
<script>
  Exprora.init('YOUR_API_KEY');
</script>`}</code>
            </pre>
          </section>

          {/* Endpoints */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Get Active Experiments</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm">
                  <code>{`GET /api/v1/experiments/active?visitor_id={visitor_id}&url={url}`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Track Event</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm">
                  <code>{`POST /api/v1/events
{
  "visitor_id": "string",
  "experiment_id": number,
  "variant_id": number,
  "event_type": "pageview|click|conversion",
  "event_name": "string",
  "event_value": number
}`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Track Conversion</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm">
                  <code>{`Exprora.conversion('goal_name', value, metadata);`}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* JavaScript SDK Methods */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">SDK Methods</h2>
            <div className="space-y-3">
              <div>
                <code className="text-blue-600 dark:text-blue-400">Exprora.init(apiKey, config)</code>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Initialize the SDK with your API key
                </p>
              </div>
              <div>
                <code className="text-blue-600 dark:text-blue-400">Exprora.track(eventType, data)</code>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Track a custom event
                </p>
              </div>
              <div>
                <code className="text-blue-600 dark:text-blue-400">Exprora.conversion(goalName, value, metadata)</code>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Track a conversion goal
                </p>
              </div>
              <div>
                <code className="text-blue-600 dark:text-blue-400">Exprora.getVisitorId()</code>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Get the current visitor ID
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

