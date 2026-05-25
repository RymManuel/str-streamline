import React, { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts';
import { DateRangeFilter, DateRange, getDefaultRange } from './DateRangeFilter';
import { useAuth } from '@/contexts/AuthContext';
import { useAllRecords } from '@/hooks/useStrData';
import { Loader2 } from 'lucide-react';
import { filterByRange, groupByMonth, formatCurrency, formatNumber } from '@/lib/analytics';
import { sanitizeInput } from '@/lib/secureHash';

export const AnalyticsPage: React.FC = () => {
  const { session, isAdmin, logActivity } = useAuth();
  const [range, setRange] = useState<DateRange>(getDefaultRange());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data: allRecords = [], isLoading } = useAllRecords();

  const records = useMemo(() => {
    return isAdmin() ? allRecords : allRecords.filter(r => r.userId === session?.userId);
  }, [allRecords, session, isAdmin]);

  const filtered = useMemo(() => {
    const ranged = filterByRange(records, range);
    const q = sanitizeInput(search).toLowerCase();
    if (!q) return ranged;
    return ranged.filter(r =>
      r.property.toLowerCase().includes(q) ||
      r.source.toLowerCase().includes(q) ||
      (r.guest || '').toLowerCase().includes(q)
    );
  }, [records, range, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.date.localeCompare(a.date)), [filtered]);
  const monthly = useMemo(() => groupByMonth(filtered), [filtered]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize);

  const exportCSV = () => {
    const headers = ['Date', 'Property', 'Guest', 'Source', 'Nights', 'Revenue', 'Expenses', 'Profit', 'Occupancy %', 'Status'];
    const rows = sorted.map(r => [
      r.date, r.property, r.guest || '', r.source, r.nights, r.revenue, r.expenses,
      r.revenue - r.expenses, r.occupancy, r.status,
    ]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `str_analytics_${range.start}_${range.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    logActivity('DATA_EXPORT', `Exported ${sorted.length} records to CSV`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Analytics &amp; Reports</h1>
          <p className="text-gray-500 dark:text-purple-300 text-sm mt-1">
            Drill into your financial data with custom filters
          </p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e] rounded-2xl p-6 border border-purple-100 dark:border-purple-800/40 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Revenue vs Expenses</h3>
          <p className="text-xs text-gray-500 dark:text-purple-400 mb-4">Monthly comparison</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#6b46c133" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a0b2e', border: '1px solid #6b46c1', borderRadius: '8px', color: '#fff' }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="revenue" fill="#a855f7" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e] rounded-2xl p-6 border border-purple-100 dark:border-purple-800/40 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Profit Trend</h3>
          <p className="text-xs text-gray-500 dark:text-purple-400 mb-4">Net profit over time</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="profitGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#6b46c133" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a0b2e', border: '1px solid #6b46c1', borderRadius: '8px', color: '#fff' }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profitGrad2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e] rounded-2xl border border-purple-100 dark:border-purple-800/40 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-purple-100 dark:border-purple-800/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Detailed Records</h3>
            <p className="text-xs text-gray-500 dark:text-purple-400">{formatNumber(sorted.length)} records in selected range</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
              <input
                type="text"
                placeholder="Search property, guest..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                maxLength={100}
                className="pl-10 pr-3 py-2 text-sm border border-purple-200 dark:border-purple-700 bg-white dark:bg-purple-950/40 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-56"
              />
            </div>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-3 py-2 text-sm border border-purple-200 dark:border-purple-700 bg-white dark:bg-purple-950/40 text-gray-900 dark:text-white rounded-lg focus:outline-none"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-medium hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-500/20"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right">Nights</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-right">Expenses</th>
                <th className="py-3 px-4 text-right">Profit</th>
                <th className="py-3 px-4 text-right">Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-purple-800/30">
              {pageData.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-gray-400">No records found</td></tr>
              ) : pageData.map(r => (
                <tr key={r.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/20">
                  <td className="py-3 px-4 text-gray-700 dark:text-purple-200">{r.date}</td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{r.property}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200">{r.source}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-purple-200">{r.nights}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(r.revenue)}</td>
                  <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">{formatCurrency(r.expenses)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(r.revenue - r.expenses)}</td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-purple-200">{r.occupancy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-purple-100 dark:border-purple-800/40 flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-purple-300">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-200 disabled:opacity-50 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >Previous</button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-200 disabled:opacity-50 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
