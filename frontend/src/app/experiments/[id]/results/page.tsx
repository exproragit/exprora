'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { experimentsApi } from '@/lib/api';
import { Download, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ExperimentResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAdmin } = useAuthStore();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isAdmin) {
      router.push('/login');
      return;
    }
    loadResults();
  }, [params.id]);

  const loadResults = async () => {
    try {
      const response = await experimentsApi.getResults(Number(params.id));
      setResults(response.data);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      if (format === 'csv') {
        const response = await fetch(`/api/client/exports/experiments/${params.id}/csv`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `experiment-${params.id}-results.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const chartData = results?.variants?.map((v: any) => ({
    name: v.variant_name,
    visitors: v.visitors,
    conversions: v.conversions,
    conversionRate: v.conversion_rate,
    revenue: v.revenue || 0,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Experiment Results</h1>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Conversion Rates</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="conversionRate" fill="#3b82f6" name="Conversion Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Visitors vs Conversions</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visitors" stroke="#3b82f6" name="Visitors" />
                <Line type="monotone" dataKey="conversions" stroke="#10b981" name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statistics Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Detailed Statistics</h2>
          </div>
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
                  {results?.variants?.[0]?.statistics && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Significance
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results?.variants?.map((variant: any) => (
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
                    {variant.statistics && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            variant.statistics.isSignificant
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {variant.statistics.isSignificant ? 'Significant' : 'Not Significant'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {variant.statistics.confidenceLevel.toFixed(1)}% confidence
                        </p>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

