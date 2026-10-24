import React, { useState, useEffect } from 'react';
import { SystemStatusData } from '../types';
import { api } from '../api';

export const SystemStatusView: React.FC = () => {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  const fetchStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getSystemStatus();
      setStatus(data);
      setLastCheckTime(new Date().toLocaleTimeString('en-IN'));
    } catch (err: any) {
      setError(err.message || 'Failed to ping backend system status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">System Status & Store Connection</h2>
          <p className="text-xs text-gray-500">
            Live connection and record counts from your Supabase store.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStatus}
          disabled={isLoading}
          className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 self-start sm:self-auto"
        >
          <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          <span>{isLoading ? 'Checking...' : 'Check Status Now'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-800 flex items-center justify-between">
          <span>Store connection check failed: {error}</span>
          <button type="button" onClick={fetchStatus} className="underline font-bold text-red-900 cursor-pointer">
            Retry check
          </button>
        </div>
      )}

      {status && (
        <div className="space-y-4 text-xs">
          {/* Main Status Banner */}
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">{status.service}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {status.status}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">Uptime: {status.uptimeHuman} • Checked at {lastCheckTime}</p>
              </div>
            </div>
            <span className="text-emerald-700 font-bold hidden sm:inline">Supabase session and store tables responding</span>
          </div>

          {/* Counts Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-lg border border-gray-200">
              <span className="text-gray-500 font-medium">Inventory Records</span>
              <div className="text-xl font-bold text-gray-900 mt-1 tabular-nums">{status.itemsCount} products</div>
              <span className="text-[11px] text-gray-400">Supabase · products</span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-gray-200">
              <span className="text-gray-500 font-medium">Order Records</span>
              <div className="text-xl font-bold text-gray-900 mt-1 tabular-nums">{status.ordersCount} orders</div>
              <span className="text-[11px] text-gray-400">Supabase · sales</span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-gray-200">
              <span className="text-gray-500 font-medium">Khata Ledger Patrons</span>
              <div className="text-xl font-bold text-gray-900 mt-1 tabular-nums">{status.customersCount} accounts</div>
              <span className="text-[11px] text-gray-400">Supabase · customers</span>
            </div>
          </div>

          {/* Connected Supabase tables and operations List */}
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Connected Supabase tables and operations ({status.activeEndpoints.length})
              </h4>
              <span className="text-gray-400 font-mono text-[11px]">Supabase client + store-scoped RLS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
              {status.activeEndpoints.map((operation) => <div key={operation} className="p-2 rounded bg-gray-50 border border-gray-200 flex items-center gap-2"><span className="material-symbols-outlined text-emerald-700 text-base">verified</span><span className="text-gray-800 font-semibold">{operation.replaceAll('_',' ')}</span></div>)}
            </div>
          </div>

          {/* Backend Limitations & Scope Transparency */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-2">
            <h4 className="font-bold text-gray-900 text-xs">Shopkeeper System Notes & Architecture</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600 text-xs">
              <li>
                <strong>Store-scoped data:</strong> Supabase authentication and row-level security restrict product, sales, and Khata records to your assigned store.
              </li>
              <li>
                <strong>Sale and stock:</strong> Completing a sale checks available inventory and records sale items and stock adjustments in one database transaction.
              </li>
              <li>
                <strong>Order assistant:</strong> Typed requests are matched against current product names. Review the draft before explicitly confirming a sale.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
