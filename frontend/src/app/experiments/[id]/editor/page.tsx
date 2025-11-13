'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { experimentsApi } from '@/lib/api';
import { Save, Eye, Code } from 'lucide-react';

export default function VisualEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAdmin } = useAuthStore();
  const [variantId, setVariantId] = useState<number | null>(null);
  const [mode, setMode] = useState<'visual' | 'code'>('visual');
  const [changes, setChanges] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!user || isAdmin) {
      router.push('/login');
      return;
    }
  }, [user, isAdmin]);

  const handleSave = async () => {
    if (!variantId) return;

    setSaving(true);
    try {
      await experimentsApi.updateVariant(Number(params.id), variantId, { changes });
      alert('Changes saved successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleElementClick = (element: HTMLElement) => {
    const selector = getElementSelector(element);
    const currentText = element.textContent || '';
    
    setChanges({
      ...changes,
      [selector]: {
        action: 'replace',
        content: currentText,
        selector,
      },
    });
  };

  const getElementSelector = (element: HTMLElement): string => {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).join('.');
      if (classes) return `.${classes}`;
    }
    return element.tagName.toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Visual Editor</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setMode(mode === 'visual' ? 'code' : 'visual')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2"
              >
                {mode === 'visual' ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {mode === 'visual' ? 'Code Mode' : 'Visual Mode'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {mode === 'visual' ? (
          <>
            <div className="flex-1 relative">
              <iframe
                ref={iframeRef}
                src="/preview"
                className="w-full h-full border-0"
                title="Preview"
              />
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Visual Editor</p>
                <p className="text-xs text-gray-500">
                  Click on elements to edit them. Changes will be saved to your variant.
                </p>
              </div>
            </div>
            <div className="w-80 bg-white border-l shadow-lg p-4 overflow-y-auto">
              <h2 className="font-semibold mb-4">Changes</h2>
              {Object.keys(changes).length === 0 ? (
                <p className="text-sm text-gray-500">No changes yet</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(changes).map(([selector, change]: [string, any]) => (
                    <div key={selector} className="border rounded p-2">
                      <p className="text-xs font-mono text-gray-600">{selector}</p>
                      <p className="text-sm text-gray-900 mt-1">{change.action}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 p-6">
            <h2 className="font-semibold mb-4">Custom Code Editor</h2>
            <textarea
              value={changes.custom_code || ''}
              onChange={(e) => setChanges({ ...changes, custom_code: e.target.value })}
              className="w-full h-full font-mono text-sm border rounded-md p-4"
              placeholder="// Add your custom CSS or JavaScript here..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

