import React, { useMemo, useState } from 'react';
import { DollarSign, TrendingUp, Calendar, Home, Percent, Users as UsersIcon, BarChart3, Activity } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, LineChart,
} from 'recharts';
import { StatCard } from './StatCard';
import { DateRangeFilter, DateRange, getDefaultRange } from './DateRangeFilter';
import { useAuth } from '@/contexts/AuthContext';
import { useAllRecords } from '@/hooks/useStrData';
import { Loader2 } from 'lucide-react';
import {
  filterByRange, summarize, groupByMonth, groupBySource, groupByProperty,
  formatCurrency, formatNumber,
} from '@/lib/analytics';

const PIE_COLORS = ['#a855f7', '#8b5cf6', '#d946ef', '#c084fc', '#7c3aed', '#e879f9'];

export const DashboardPage: React.FC = () => {
  const { session, isAdmin } = useAuth();
  const [range, setRange] = useState<DateRange>(getDefaultRange());

  const { data: allRecords = [], isLoading } = useAllRecords();

  const records = useMemo(() => {
    return isAdmin() ? allRecords : allRecords.filter(r => r.userId === session?.userId);
  }, [allRecords, session, isAdmin]);

  const filtered = useMemo(() => filterByRange(records, range), [records, range]);
  const summary = useMemo(() => summarize(filtered), [filtered]);
  const monthly = useMemo(() => groupByMonth(filtered), [filtered]);
  const sources = useMemo(() => groupBySource(filtered), [filtered]);
  const properties = useMemo(() => groupByProperty(filtered).slice(0, 5), [filtered]);

  // Change vs prior period
  const priorRange = useMemo(() => {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const span = end.getTime() - start.getTime();
    const priorEnd = new Date(start.getTime() - 86400000);
    const priorStart = new Date(priorEnd.getTime() - span);
    return {
      start: priorStart.toISOString().split('T')[0],
      end: priorEnd.toISOString().split('T')[0],
    };
  }, [range]);

  const priorSummary = useMemo(() => summarize(filterByRange(records, priorRange)), [records, priorRange]);

  const pctChange = (curr: number, prev: number): number => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {session?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 dark:text-purple-300 text-sm mt-1">
            Here&apos;s your short-term rental performance overview
          </p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          change={pctChange(summary.totalRevenue, priorSummary.totalRevenue)}
          icon={DollarSign}
          accent="purple"
        />
        <StatCard
          label="Net Profit"
          value={formatCurrency(summary.netProfit)}
          change={pctChange(summary.netProfit, priorSummary.netProfit)}
          icon={TrendingUp}
          accent="emerald"
        />
        <StatCard
          label="Bookings"
          value={formatNumber(summary.totalBookings)}
          change={pctChange(summary.totalBookings, priorSummary.totalBookings)}
          icon={Calendar}
          accent="violet"
        />
        <StatCard
          label="Avg Occupancy"
          value={`${summary.avgOccupancy.toFixed(1)}%`}
          change={pctChange(summary.avgOccupancy, priorSummary.avgOccupancy)}
          icon={Percent}
          accent="fuchsia"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Expenses" value={formatCurrency(summary.totalExpenses)} icon={Activity} accent="pink" />
        <StatCard label="Profit Margin" value={`${summary.profitMargin.toFixed(1)}%`} icon={BarChart3} accent="indigo" />
        <StatCard label="Total Nights" value={formatNumber(summary.totalNights)} icon={Home} accent="violet" />
        <StatCard label="Avg / Booking" value={formatCurrency(summary.avgRevenuePerBooking)} icon={UsersIcon} accent="purple" />
      </div>

      {/* Main chart - Revenue trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e] rounded-2xl p-6 border border-purple-100 dark:border-purple-800/40 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Revenue & Profit Trend</h3>
              <p className="text-xs text-gray-500 dark:text-purple-400">Monthly performance over selected period</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
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
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#a855f7" fill="url(#revGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sources pie */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e] rounded-2xl p-6 border border-purple-100 dark:border-purple-800/40 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Booking Sources</h3>
          <p className="text-xs text-gray-500 dark:text-purple-400 mb-4">Revenue distribution</p>
          {sources.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {sources.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a0b2e', border: '1px solid #6b46c1', borderRadius: '8px', color: '#fff' }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {sources.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-700 dark:text-purple-200">{s.name}</span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(s.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data in range</div>
          )}
        </div>
      </div>

      {/* Bookings + occupancy chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e] rounded-2xl p-6 border border-purple-100 dark:border-purple-800/40 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Bookings per Month</h3>
          <p className="text-xs text-gray-500 dark:text-purple-400 mb-4">Volume trends</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#6b46c133" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a0b2e', border: '1px solid #6b46c1', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="bookings" fill="#a855f7" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e] rounded-2xl p-6 border border-purple-100 dark:border-purple-800/40 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Occupancy Rate</h3>
          <p className="text-xs text-gray-500 dark:text-purple-400 mb-4">Average % occupied</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#6b46c133" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1a0b2e', border: '1px solid #6b46c1', borderRadius: '8px', color: '#fff' }} formatter={(v: number) => `${v}%`} />
              <Line type="monotone" dataKey="occupancy" stroke="#d946ef" strokeWidth={3} dot={{ fill: '#d946ef', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top properties table */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e] rounded-2xl p-6 border border-purple-100 dark:border-purple-800/40 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Performing Properties</h3>
        {properties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500 dark:text-purple-400 border-b border-purple-100 dark:border-purple-800/40">
                <tr>
                  <th className="py-3 pr-4">Property</th>
                  <th className="py-3 pr-4 text-right">Bookings</th>
                  <th className="py-3 pr-4 text-right">Revenue</th>
                  <th className="py-3 pr-4">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-purple-800/30">
                {properties.map((p, i) => {
                  const max = properties[0]?.value || 1;
                  const pct = (p.value / max) * 100;
                  return (
                    <tr key={p.name} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/20">
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                        <span className="inline-block w-6 text-purple-500">#{i + 1}</span>
                        {p.name}
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-700 dark:text-purple-200">{p.count}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(p.value)}</td>
                      <td className="py-3 pr-4 min-w-[120px]">
                        <div className="w-full h-2 bg-purple-100 dark:bg-purple-900/40 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-gray-400 py-8 text-center">No property data in selected range</div>
        )}
      </div>
    </div>
  );
};
