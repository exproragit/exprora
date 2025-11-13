'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/lib/api';
import { ArrowLeft, DollarSign, Activity, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAdmin } = useAuthStore();
  const [client, setClient] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/login');
      return;
    }
    loadClient();
  }, [params.id]);

  const loadClient = async () => {
    try {
      const response = await adminApi.getClient(Number(params.id));
      setClient(response.data.client);
      setRevenue(response.data.revenue);
      setActivity(response.data.recentActivity || []);
    } catch (error) {
      console.error('Failed to load client:', error);
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

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Client not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/clients"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.company_name}</h1>
              <p className="text-sm text-gray-600">{client.email}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Subscription Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Subscription</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-600">Plan</dt>
                <dd className="mt-1">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {client.subscription_plan}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      client.subscription_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : client.subscription_status === 'trial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {client.subscription_status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Billing Cycle</dt>
                <dd className="mt-1 text-sm text-gray-900">{client.billing_cycle || 'monthly'}</dd>
              </div>
            </dl>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Revenue</h2>
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-600">Total Revenue</dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">
                  ${revenue?.paid_revenue?.toLocaleString() || '0'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Total Invoices</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {revenue?.total_invoices || 0} invoices
                </dd>
              </div>
            </dl>
          </div>

          {/* Experiments */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Experiments</h2>
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-600">Total</dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">
                  {client.total_experiments || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Active</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {client.active_experiments || 0} running
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Account Details</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-600">Company Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.company_name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Domain</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.domain || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Joined</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(client.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Recent Activity */}
        {activity.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activity.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-3 pb-3 border-b last:border-0">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{item.action}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

