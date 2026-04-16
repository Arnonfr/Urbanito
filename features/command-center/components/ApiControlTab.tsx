import React, { useState, useEffect, useCallback } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Activity,
  MapPin,
} from 'lucide-react';
import { supabase } from '../../../services/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CostLogRow {
  id: string | number;
  created_at: string;
  api_type: string;
  estimated_cost_usd: number;
}

interface ApiBreakdown {
  api_type: string;
  count: number;
  total_cost: number;
  avg_cost: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_TYPE_LABELS: Record<string, string> = {
  geocoding: 'גיאוקודינג',
  directions: 'מסלולים',
  places: 'מקומות',
  distance_matrix: 'מטריצת מרחקים',
  maps_js: 'טעינת מפה',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUsd(value: number): string {
  return `$${value.toFixed(4)}`;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function calcBreakdown(rows: CostLogRow[]): ApiBreakdown[] {
  const map: Record<string, { count: number; total: number }> = {};
  for (const row of rows) {
    const key = row.api_type;
    if (!map[key]) map[key] = { count: 0, total: 0 };
    map[key].count += 1;
    map[key].total += row.estimated_cost_usd ?? 0;
  }
  return Object.entries(map).map(([api_type, { count, total }]) => ({
    api_type,
    count,
    total_cost: total,
    avg_cost: count > 0 ? total / count : 0,
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ApiControlTab: React.FC = () => {
  // Toggle state
  const [mapsEnabled, setMapsEnabled] = useState<boolean>(false);
  const [toggleLoading, setToggleLoading] = useState<boolean>(true);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Cost state
  const [costRows, setCostRows] = useState<CostLogRow[]>([]);
  const [costLoading, setCostLoading] = useState<boolean>(true);
  const [costError, setCostError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch toggle setting ────────────────────────────────────────────────────
  const fetchToggle = useCallback(async () => {
    setToggleLoading(true);
    setToggleError(null);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'maps_enabled')
        .single();
      if (error) throw error;
      setMapsEnabled(data?.value === true || data?.value === 'true');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה בטעינת ההגדרה';
      setToggleError(msg);
    } finally {
      setToggleLoading(false);
    }
  }, []);

  // ── Update toggle setting ───────────────────────────────────────────────────
  const handleToggle = async () => {
    const newValue = !mapsEnabled;
    setMapsEnabled(newValue);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: newValue })
        .eq('key', 'maps_enabled');
      if (error) throw error;
      showToast(
        newValue ? 'Google Maps API הופעל בהצלחה' : 'Google Maps API כובה בהצלחה',
        'success'
      );
    } catch (err: unknown) {
      // Revert optimistic update
      setMapsEnabled(!newValue);
      const msg = err instanceof Error ? err.message : 'שגיאה בעדכון ההגדרה';
      showToast(msg, 'error');
    }
  };

  // ── Fetch cost log ──────────────────────────────────────────────────────────
  const fetchCosts = useCallback(async () => {
    setCostLoading(true);
    setCostError(null);
    try {
      const { data, error } = await supabase
        .from('api_cost_log')
        .select('id, created_at, api_type, estimated_cost_usd')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCostRows(data ?? []);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה בטעינת נתוני עלויות';
      setCostError(msg);
    } finally {
      setCostLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToggle();
    fetchCosts();
  }, [fetchToggle, fetchCosts]);

  // ── Derived cost stats ──────────────────────────────────────────────────────
  const todayCost = costRows
    .filter((r) => isToday(r.created_at))
    .reduce((sum, r) => sum + (r.estimated_cost_usd ?? 0), 0);

  const monthCost = costRows
    .filter((r) => isThisMonth(r.created_at))
    .reduce((sum, r) => sum + (r.estimated_cost_usd ?? 0), 0);

  const allTimeCost = costRows.reduce((sum, r) => sum + (r.estimated_cost_usd ?? 0), 0);

  const breakdown = calcBreakdown(costRows);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto p-6 md:p-8 bg-gray-50/50" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Toast ─────────────────────────────────────────────────────────── */}
        {toast && (
          <div
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all
              ${toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
              }`}
          >
            {toast.message}
          </div>
        )}

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">שליטה ב-APIs</h2>
          <p className="text-sm text-gray-500 mt-1">ניהול מפתחות API ומעקב עלויות</p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            TOGGLE SECTION
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={18} className="text-indigo-500" />
            <h3 className="text-lg font-bold text-gray-900">Google Maps API</h3>
          </div>

          {toggleLoading ? (
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <RefreshCw size={16} className="animate-spin" />
              טוען הגדרות...
            </div>
          ) : toggleError ? (
            <div className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {toggleError}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      mapsEnabled ? 'bg-green-500' : 'bg-red-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      mapsEnabled ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {mapsEnabled ? 'פעיל' : 'כבוי'}
                  </span>
                </div>

                {/* Toggle button */}
                <button
                  onClick={handleToggle}
                  aria-label={mapsEnabled ? 'כבה Google Maps API' : 'הפעל Google Maps API'}
                  className="flex items-center gap-2 focus:outline-none group"
                >
                  {mapsEnabled ? (
                    <ToggleRight
                      size={52}
                      className="text-indigo-500 group-hover:text-indigo-600 transition-colors"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <ToggleLeft
                      size={52}
                      className="text-gray-300 group-hover:text-gray-400 transition-colors"
                      strokeWidth={1.5}
                    />
                  )}
                </button>
              </div>

              <p className="mt-4 text-xs text-gray-400 border-t border-gray-100 pt-4">
                שינוי יכנס לתוקף בטעינה הבאה של המשתמש
              </p>
            </>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            COST DASHBOARD SECTION
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {/* Section header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-indigo-500" />
              <h3 className="text-lg font-bold text-gray-900">דשבורד עלויות</h3>
            </div>

            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-gray-400 hidden sm:block">
                  עודכן: {lastUpdated.toLocaleTimeString('he-IL')}
                </span>
              )}
              <button
                onClick={fetchCosts}
                disabled={costLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={costLoading ? 'animate-spin' : ''} />
                רענן
              </button>
            </div>
          </div>

          {costError ? (
            <div className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {costError}
            </div>
          ) : (
            <>
              {/* ── Stats grid ─────────────────────────────────────────────── */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* Today */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Activity size={14} className="text-indigo-400" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      היום
                    </span>
                  </div>
                  {costLoading ? (
                    <div className="h-7 w-16 mx-auto bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{formatUsd(todayCost)}</p>
                  )}
                </div>

                {/* This month */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <TrendingUp size={14} className="text-indigo-500" />
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      החודש
                    </span>
                  </div>
                  {costLoading ? (
                    <div className="h-7 w-16 mx-auto bg-indigo-200 rounded animate-pulse" />
                  ) : (
                    <p className="text-2xl font-bold text-indigo-700">{formatUsd(monthCost)}</p>
                  )}
                </div>

                {/* All time */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <DollarSign size={14} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      סה״כ
                    </span>
                  </div>
                  {costLoading ? (
                    <div className="h-7 w-16 mx-auto bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{formatUsd(allTimeCost)}</p>
                  )}
                </div>
              </div>

              {/* ── Breakdown table ────────────────────────────────────────── */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  פירוט לפי סוג API
                </h4>

                {costLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : breakdown.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    אין נתוני עלויות עדיין
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                            סוג API
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                            בקשות
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                            עלות כוללת
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                            ממוצע לבקשה
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {breakdown.map((row) => (
                          <tr
                            key={row.api_type}
                            className="hover:bg-indigo-50/40 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-gray-800">
                              {API_TYPE_LABELS[row.api_type] ?? row.api_type}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">
                              {row.count.toLocaleString('he-IL')}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-gray-800">
                              {formatUsd(row.total_cost)}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-500">
                              {formatUsd(row.avg_cost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiControlTab;
