import React, { useState } from 'react';
import { FileBarChart, Target, Download, Loader2, TrendingUp } from 'lucide-react';
import { DateRangeFilter, DateRange, getDefaultRange } from './DateRangeFilter';
import { useReportSummary } from '@/hooks/useStrData';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatNumber } from '@/lib/analytics';

export const ReportsPage: React.FC = () => {
  const { logActivity } = useAuth();
  const [range, setRange] = useState<DateRange>(getDefaultRange());
  const { data: report, isLoading, refetch } = useReportSummary(range.start, range.end);
  const [revenueTarget, setRevenueTarget] = useState('');
  const [occupancyTarget, setOccupancyTarget] = useState('80');
  const [savingTarget, setSavingTarget] = useState(false);

  const monthYear = range.start.slice(0, 7);

  const saveTarget = async () => {
    setSavingTarget(true);
    try {
      await api.setTarget(monthYear, Number(revenueTarget) || 0, Number(occupancyTarget) || 80);
      logActivity('TARGET_SET', `Set targets for ${monthYear}`);
      refetch();
    } finally {
      setSavingTarget(false);
    }
  };

  const exportReport = () => {
    if (!report) return;
    const lines = [
      'STR-Streamline Financial Report',
      `Period: ${range.start} to ${range.end}`,
      '',
      `Total Revenue,${report.summary.totalRevenue}`,
      `Total Expenses,${report.summary.totalExpenses}`,
      `Net Profit,${report.summary.netProfit}`,
      `Bookings,${report.summary.totalBookings}`,
      `Avg Occupancy,${report.summary.avgOccupancy}%`,
      '',
      'By Source',
      'Source,Bookings,Revenue',
      ...report.bySource.map(s => `${s.source},${s.bookings},${s.revenue}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `str_report_${range.start}_${range.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    logActivity('REPORT_EXPORT', `Exported financial report`);
  };

  const revenueProgress = report?.target
    ? Math.min(100, Math.round((report.summary.totalRevenue / report.target.revenueTarget) * 100))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
          <p className="text-gray-500 dark:text-purple-300 text-sm mt-1">
            Capstone reporting module — KPIs, targets, and export
          </p>
        </div>
        <button
          onClick={exportReport}
          disabled={!report}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-700 text-sm text-purple-700 dark:text-purple-200"
        >
          <Download className="h-4 w-4" />
          Export Report CSV
        </button>
      </div>

      <DateRangeFilter range={range} onChange={setRange} />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-purple-500 animate-spin" /></div>
      ) : report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Net Profit', value: formatCurrency(report.summary.netProfit), icon: TrendingUp },
              { label: 'Revenue', value: formatCurrency(report.summary.totalRevenue), icon: FileBarChart },
              { label: 'Bookings', value: formatNumber(report.summary.totalBookings), icon: FileBarChart },
              { label: 'Avg Occupancy', value: `${report.summary.avgOccupancy}%`, icon: Target },
            ].map((card, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40">
                <card.icon className="h-5 w-5 text-purple-500 mb-2" />
                <p className="text-xs text-gray-500 dark:text-purple-300">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            ))}
          </div>

          {report.target && revenueProgress !== null && (
            <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/40">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Revenue target ({report.target.monthYear}): {formatCurrency(report.target.revenueTarget)}
              </p>
              <div className="h-3 bg-purple-200 dark:bg-purple-950 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-violet-500 rounded-full transition-all" style={{ width: `${revenueProgress}%` }} />
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">{revenueProgress}% of monthly target</p>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40">
              <h3 className="font-semibold dark:text-white mb-3">Revenue by Source</h3>
              <ul className="space-y-2">
                {report.bySource.map(s => (
                  <li key={s.source} className="flex justify-between text-sm dark:text-purple-200">
                    <span>{s.source}</span>
                    <span className="font-medium">{formatCurrency(s.revenue)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40">
              <h3 className="font-semibold dark:text-white mb-3">Top Properties</h3>
              <ul className="space-y-2">
                {report.byProperty.map(p => (
                  <li key={p.property} className="flex justify-between text-sm dark:text-purple-200">
                    <span>{p.property}</span>
                    <span className="font-medium">{formatCurrency(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40">
            <h3 className="font-semibold dark:text-white mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              Set Monthly Targets ({monthYear})
            </h3>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-gray-500 dark:text-purple-300">Revenue target (₱)</label>
                <input
                  type="number"
                  value={revenueTarget}
                  onChange={e => setRevenueTarget(e.target.value)}
                  placeholder={String(report.target?.revenueTarget || 100000)}
                  className="block mt-1 px-3 py-2 border rounded-lg dark:bg-purple-950/40 dark:text-white w-40"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-purple-300">Occupancy target (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={occupancyTarget}
                  onChange={e => setOccupancyTarget(e.target.value)}
                  className="block mt-1 px-3 py-2 border rounded-lg dark:bg-purple-950/40 dark:text-white w-28"
                />
              </div>
              <button
                onClick={saveTarget}
                disabled={savingTarget}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2"
              >
                {savingTarget && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Targets
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
