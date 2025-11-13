'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { MapPin } from 'lucide-react';

export default function HeatmapsPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuthStore();
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState('');

  useEffect(() => {
    if (!user || isAdmin) {
      router.push('/login');
      return;
    }
    loadHeatmaps();
  }, [user, isAdmin, selectedUrl]);

  const loadHeatmaps = async () => {
    try {
      const params: any = {};
      if (selectedUrl) params.page_url = selectedUrl;
      
      const response = await api.get('/api/client/heatmaps', { params });
      setHeatmapData(response.data.heatmap_data || []);
    } catch (error) {
      console.error('Failed to load heatmaps:', error);
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Heatmaps</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by URL
          </label>
          <input
            type="text"
            value={selectedUrl}
            onChange={(e) => setSelectedUrl(e.target.value)}
            placeholder="Enter page URL..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {heatmapData.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No heatmap data yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Heatmap data will appear here once visitors interact with your website
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Click Heatmap</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {heatmapData.slice(0, 100).map((point: any, index: number) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      Position ({point.x_coordinate}, {point.y_coordinate})
                    </span>
                    <span className="text-sm text-blue-600 font-medium">
                      {point.total_clicks} clicks
                    </span>
                  </div>
                  {point.avg_scroll_depth && (
                    <p className="text-xs text-gray-500">
                      Avg scroll: {Math.round(point.avg_scroll_depth)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

