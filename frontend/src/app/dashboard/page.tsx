'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clientApi } from '@/lib/api';
import { Plus, Activity, TrendingUp, Users, Code, Copy, Check } from 'lucide-react';

export default function ClientDashboard() {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuthStore();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isAdmin) {
      router.push('/login');
      return;
    }

    loadDashboard();
  }, [user, isAdmin]);

  const loadDashboard = async () => {
    try {
      const response = await clientApi.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exprora</h1>
              <p className="text-sm text-gray-600">{user?.company_name}</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/experiments"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Experiment
              </a>
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Embed Code Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Connect Your Website</h2>
              <p className="text-blue-100">
                Add our smart code to your website to start tracking and running A/B tests
              </p>
            </div>
            <EmbedCodeModal apiKey={user?.api_key} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Experiments</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {dashboard?.experiments?.total || 0}
                </p>
              </div>
              <Activity className="w-12 h-12 text-blue-500" />
            </div>
            <div className="mt-4 text-sm">
              <span className="text-green-600 font-medium">
                {dashboard?.experiments?.active || 0} active
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Visitors</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {dashboard?.visitors?.total_visitors?.toLocaleString() || '0'}
                </p>
              </div>
              <Users className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversions (30d)</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {dashboard?.conversions?.unique_conversions?.toLocaleString() || '0'}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500" />
            </div>
            <div className="mt-4 text-sm text-gray-600">
              ${dashboard?.conversions?.total_revenue?.toLocaleString() || '0'} revenue
            </div>
          </div>
        </div>

        {/* Recent Experiments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Experiments</h2>
            <a
              href="/experiments"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </a>
          </div>
          <div className="p-6">
            {dashboard?.recentExperiments?.length > 0 ? (
              <div className="space-y-4">
                {dashboard.recentExperiments.map((exp: any) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{exp.name}</h3>
                      <p className="text-sm text-gray-600">
                        {exp.type} • Created {new Date(exp.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded ${
                        exp.status === 'running'
                          ? 'bg-green-100 text-green-800'
                          : exp.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {exp.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No experiments yet</p>
                <a
                  href="/experiments/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Experiment
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbedCodeModal({ apiKey }: { apiKey?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !embedCode) {
      loadEmbedCode();
    }
  }, [isOpen]);

  const loadEmbedCode = async () => {
    setLoading(true);
    try {
      const response = await clientApi.getEmbedCode();
      setEmbedCode(response.data.embed_code);
    } catch (error) {
      console.error('Failed to load embed code:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-white text-blue-600 px-4 py-2 rounded-md font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
      >
        <Code className="w-4 h-4" />
        Get Embed Code
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Website Integration</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Copy and paste this code before the closing <code className="bg-gray-100 px-1 rounded">&lt;/head&gt;</code> tag on all pages of your website.
              </p>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{embedCode}</code>
                  </pre>
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              )}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Add this code to your website's HTML</li>
                  <li>• Works with any website (WordPress, Shopify, custom HTML, etc.)</li>
                  <li>• No coding knowledge required</li>
                  <li>• Start tracking visitors immediately after installation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

