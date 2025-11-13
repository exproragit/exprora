'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clientApi } from '@/lib/api';
import { Copy, Check } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAdmin } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || isAdmin) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [user, isAdmin]);

  const loadProfile = async () => {
    try {
      const response = await clientApi.getProfile();
      setProfile(response.data.account);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    if (profile?.api_key) {
      navigator.clipboard.writeText(profile.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-600">Company Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile?.company_name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile?.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Domain</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile?.domain || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Subscription Plan</dt>
                <dd className="mt-1">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {profile?.subscription_plan || 'starter'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Subscription Status</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      profile?.subscription_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : profile?.subscription_status === 'trial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {profile?.subscription_status || 'trial'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* API Key */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">API Key</h2>
            <p className="text-sm text-gray-600 mb-4">
              Use this API key to integrate Exprora SDK on your website
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-100 rounded-md text-sm font-mono">
                {profile?.api_key || 'Loading...'}
              </code>
              <button
                onClick={copyApiKey}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
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
            <p className="mt-4 text-sm text-gray-600">
              Add this script to your website:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                &lt;script src="https://cdn.exprora.com/sdk.js"&gt;&lt;/script&gt;
              </code>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Then initialize:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                Exprora.init('{profile?.api_key}')
              </code>
            </p>
          </div>

          {/* SDK Integration Guide */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">SDK Integration</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Step 1: Add SDK Script</h3>
                <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto">
                  {`<script src="https://cdn.exprora.com/sdk.js"></script>`}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Step 2: Initialize</h3>
                <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto">
                  {`<script>
  Exprora.init('${profile?.api_key || 'YOUR_API_KEY'}');
</script>`}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Step 3: Track Conversions</h3>
                <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto">
                  {`Exprora.conversion('purchase', 99.99);`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

