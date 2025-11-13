'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { experimentsApi } from '@/lib/api';
import { Code, Eye } from 'lucide-react';

export default function NewVariantPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAdmin } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [editorType, setEditorType] = useState<'visual' | 'code'>('code');
  const [formData, setFormData] = useState({
    name: '',
    type: 'variant',
    traffic_percentage: 50,
    is_control: false,
    changes: null,
    css_code: '',
    js_code: '',
  });

  if (!user || isAdmin) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        // Only send data relevant to the selected editor type
        ...(editorType === 'visual' 
          ? { changes: formData.changes, css_code: null, js_code: null }
          : { changes: null, css_code: formData.css_code || null, js_code: formData.js_code || null }
        ),
      };
      await experimentsApi.createVariant(Number(params.id), submitData);
      router.push(`/experiments/${params.id}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create variant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Create New Variant</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variant Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                placeholder="e.g., Variant B, Red Button, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Traffic Percentage (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.traffic_percentage}
                onChange={(e) =>
                  setFormData({ ...formData, traffic_percentage: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_control"
                checked={formData.is_control}
                onChange={(e) => setFormData({ ...formData, is_control: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_control" className="ml-2 block text-sm text-gray-900">
                This is the control variant (original)
              </label>
            </div>

            {/* Editor Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Editor Type
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setEditorType('visual')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-colors ${
                    editorType === 'visual'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <Eye className="w-5 h-5" />
                  <span className="font-medium">Visual Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorType('code')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-colors ${
                    editorType === 'code'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <Code className="w-5 h-5" />
                  <span className="font-medium">Code Editor</span>
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {editorType === 'visual'
                  ? 'Use the visual editor to make changes by clicking on elements (coming soon)'
                  : 'Write JavaScript and CSS code to modify the page'}
              </p>
            </div>

            {/* Visual Editor Section */}
            {editorType === 'visual' && (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">
                  Visual Editor (Basic - To be enhanced)
                </p>
                <p className="text-xs text-gray-500">
                  The visual editor will allow you to click on elements and make changes visually.
                  For now, you can use the Code Editor to write CSS and JavaScript.
                </p>
                <Link
                  href={`/experiments/${params.id}/editor`}
                  className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700"
                >
                  Open Visual Editor →
                </Link>
              </div>
            )}

            {/* Code Editor Section */}
            {editorType === 'code' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CSS Code
                  </label>
                  <textarea
                    value={formData.css_code}
                    onChange={(e) => setFormData({ ...formData, css_code: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 font-mono text-sm"
                    placeholder="/* Add your CSS here */&#10;.button {&#10;  background-color: #3b82f6;&#10;  color: white;&#10;}"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    CSS will be applied to the page when this variant is shown
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    JavaScript Code
                  </label>
                  <textarea
                    value={formData.js_code}
                    onChange={(e) => setFormData({ ...formData, js_code: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 font-mono text-sm"
                    placeholder="// Add your JavaScript here&#10;// Example:&#10;document.querySelector('.button').textContent = 'Click Me';"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    JavaScript will be executed when this variant is shown
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Variant'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

