import React, { useEffect, useState } from 'react';
import { RestockRecommendation } from '../types';
import { api } from '../api';

export const RestockView: React.FC = () => {
  const [data, setData] = useState<RestockRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const recs = await api.getRestockRecommendations();
        if (!cancelled) setData(recs);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? 'Failed to load restock recommendations');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-gray-500">
        <span className="material-symbols-outlined text-emerald-600 text-[24px]">hourglass_empty</span>
        <p className="mt-2 text-sm">Loading restock recommendations…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <span className="material-symbols-outlined">check_circle</span>
        <p className="mt-1 text-sm">No restock recommendations at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-900">Restock Recommendations</h3>
        <button className="text-xs text-gray-500 hover:text-gray-700" onClick={() => window.location.reload()}>Refresh</button>
      </div>
      <div className="divide-y divide-gray-100">
        {data.map(rec => (
          <div key={rec.itemId} className="py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-emerald-700 text-[20px]">inventory</span>
                <h4 className="font-medium">{rec.itemName}</h4>
              </div>
              <p className="text-[11px] text-gray-500">{rec.subtitle}</p>
              <p className="text-[10px] text-gray-500">Current Stock: {rec.currentStock}</p>
            </div>
            <div className="text-xs flex flex-col gap-1">
              <p>Order Qty: <b>{rec.recommendedOrder}</b></p>
              <p>Confidence: <b>{rec.confidence}</b></p>
              <p className="text-[10px] text-gray-500">{rec.confidenceNote}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
