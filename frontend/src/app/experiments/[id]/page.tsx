'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { experimentsApi } from '@/lib/api';
import { Plus, BarChart3, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ExperimentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAdmin } = useAuthStore();
  const [experiment, setExperiment] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isAdmin) {
      router.push('/login');
      return;
    }
    loadExperiment();
  }, [params.id]);

  const loadExperiment = async () => {
    try {
      const [expResponse, resultsResponse] = await Promise.all([
        experimentsApi.getOne(Number(params.id)),
        experimentsApi.getResults(Number(params.id)),
      ]);
      setExperiment(expResponse.data.experiment);
      setVariants(expResponse.data.variants || []);
      setResults(resultsResponse.data);
    } catch (error) {
      console.error('Failed to load experiment:', error);
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

  if (!experiment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Experiment not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{experiment.name}</h1>
              <p className="text-sm text-gray-600">{experiment.description || 'No description'}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/experiments/${params.id}/variants/new`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Variant
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b">
          <nav className="flex gap-4">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'variants', label: 'Variants', icon: Settings },
              { id: 'results', label: 'Results', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Experiment Details</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-600">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        experiment.status === 'running'
                          ? 'bg-green-100 text-green-800'
                          : experiment.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {experiment.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{experiment.type}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Traffic Allocation</dt>
                  <dd className="mt-1 text-sm text-gray-900">{experiment.traffic_allocation}%</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Primary Goal</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {experiment.primary_goal || 'Not set'}
                  </dd>
                </div>
              </dl>
            </div>

            {results && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
                <div className="grid grid-cols-3 gap-4">
                  {results.variants?.map((variant: any) => (
                    <div key={variant.variant_id} className="border rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {variant.variant_name} {variant.is_control && '(Control)'}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Visitors:</span>
                          <span className="font-medium">{variant.visitors || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Conversions:</span>
                          <span className="font-medium">{variant.conversions || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Conversion Rate:</span>
                          <span className="font-medium">{variant.conversion_rate || 0}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'variants' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Variants</h2>
            </div>
            <div className="p-6">
              {variants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No variants yet</p>
                  <Link
                    href={`/experiments/${params.id}/variants/new`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Variant
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {variants.map((variant) => (
                    <div key={variant.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {variant.name} {variant.is_control && '(Control)'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Traffic: {variant.traffic_percentage}%
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          {variant.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'results' && results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Detailed Results</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Variant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Visitors
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Conversions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Conversion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.variants?.map((variant: any) => (
                    <tr key={variant.variant_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium">
                          {variant.variant_name} {variant.is_control && '(Control)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{variant.visitors || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{variant.conversions || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {variant.conversion_rate || 0}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${variant.revenue?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

