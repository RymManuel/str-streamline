import React, { useEffect, useMemo, useState } from 'react';
import {
  FileBarChart,
  Target,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  Printer,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  Percent,
  Moon,
  Wallet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DateRangeFilter, DateRange, getDefaultRange } from './DateRangeFilter';
import { useReportSummary } from '@/hooks/useStrData';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatNumber } from '@/lib/analytics';
import { buildReportInsights } from '@/lib/reportInsights';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CHART_TOOLTIP = {
  backgroundColor: '#fff',
  border: '1px solid #e0e7ff',
  borderRadius: '10px',
  color: '#1e293b',
  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.1)',
};
const CHART_COLORS = { revenue: '#6366f1', expenses: '#fb923c', profit: '#34d399' };

function ChangeBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
        up
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'bg-red-500/15 text-red-600 dark:text-red-400'
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? '+' : ''}
      {value}
      {suffix}
    </span>
  );
}

export const ReportsPage: React.FC = () => {
  const { logActivity } = useAuth();
  const [range, setRange] = useState<DateRange>(getDefaultRange());
  const { data: report, isLoading, isError, error, refetch, isFetching } = useReportSummary(
    range.start,
    range.end
  );
  const [revenueTarget, setRevenueTarget] = useState('');
  const [occupancyTarget, setOccupancyTarget] = useState('80');
  const [savingTarget, setSavingTarget] = useState(false);

  const monthYear = range.start.slice(0, 7);

  useEffect(() => {
    if (report?.target) {
      setRevenueTarget(String(report.target.revenueTarget));
      setOccupancyTarget(String(report.target.occupancyTarget));
    }
  }, [report?.target?.monthYear, report?.target?.revenueTarget, report?.target?.occupancyTarget]);

  const insights = useMemo(() => (report ? buildReportInsights(report) : []), [report]);

  const revenueProgress = report?.target
    ? Math.min(100, Math.round((report.summary.totalRevenue / report.target.revenueTarget) * 100))
    : null;

  const occupancyProgress = report?.target
    ? Math.min(100, Math.round((report.summary.avgOccupancy / report.target.occupancyTarget) * 100))
    : null;

  const saveTarget = async () => {
    setSavingTarget(true);
    try {
      await api.setTarget(monthYear, Number(revenueTarget) || 0, Number(occupancyTarget) || 80);
      logActivity('TARGET_SET', `Set targets for ${monthYear}`);
      toast.success('Monthly targets saved');
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save targets');
    } finally {
      setSavingTarget(false);
    }
  };

  const exportReport = () => {
    if (!report) return;
    const lines = [
      'STR-Streamline Financial Report',
      `Period: ${report.period.start} to ${report.period.end}`,
      `Prior period: ${report.priorPeriod.start} to ${report.priorPeriod.end}`,
      '',
      '--- Summary ---',
      `Total Revenue,${report.summary.totalRevenue}`,
      `Total Expenses,${report.summary.totalExpenses}`,
      `Net Profit,${report.summary.netProfit}`,
      `Profit Margin %,${report.summary.profitMargin}`,
      `Bookings,${report.summary.totalBookings}`,
      `Total Nights,${report.summary.totalNights}`,
      `Avg Occupancy %,${report.summary.avgOccupancy}`,
      `Avg Revenue per Booking,${report.summary.avgRevenuePerBooking}`,
      `Avg Revenue per Night (ADR),${report.summary.avgRevenuePerNight}`,
      '',
      '--- Period Comparison ---',
      `Revenue Change %,${report.comparison.revenueChange}`,
      `Profit Change %,${report.comparison.profitChange}`,
      `Bookings Change %,${report.comparison.bookingsChange}`,
      '',
      '--- By Source ---',
      'Source,Bookings,Revenue,Expenses,Share %',
      ...report.bySource.map(
        (s) => `${s.source},${s.bookings},${s.revenue},${s.expenses},${s.share}`
      ),
      '',
      '--- By Property ---',
      'Property,Bookings,Revenue,Expenses,Avg Occupancy %',
      ...report.byProperty.map(
        (p) => `${p.property},${p.bookings},${p.revenue},${p.expenses},${p.avgOccupancy}`
      ),
      '',
      '--- Monthly ---',
      'Month,Bookings,Revenue,Expenses,Profit,Avg Occupancy %',
      ...report.monthly.map(
        (m) => `${m.month},${m.bookings},${m.revenue},${m.expenses},${m.profit},${m.avgOccupancy}`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `str_report_${range.start}_${range.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    logActivity('DATA_EXPORT', `Exported financial report ${range.start}–${range.end}`);
    toast.success('Report downloaded');
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 str-report-page">
      <div className="flex flex-wrap justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Executive KPIs, period comparison, targets, and exportable audit trail
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </button>
          <button
            type="button"
            onClick={printReport}
            disabled={!report}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            type="button"
            onClick={exportReport}
            disabled={!report}
            className="str-btn-primary !w-auto px-4 py-2 text-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="print:hidden">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="str-glass-card p-8 flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold">Could not load report</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Check that the API is running and you have rental data.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      ) : report ? (
        <>
          {/* Executive summary */}
          <div className="str-glass-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="font-semibold text-lg">Executive Summary</h2>
              <span className="text-xs text-muted-foreground">
                {report.period.start} → {report.period.end}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-semibold">{formatCurrency(report.summary.netProfit)}</p>
                <ChangeBadge value={report.comparison.profitChange} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-semibold">{formatCurrency(report.summary.totalRevenue)}</p>
                <ChangeBadge value={report.comparison.revenueChange} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bookings</p>
                <p className="text-2xl font-semibold">{formatNumber(report.summary.totalBookings)}</p>
                <ChangeBadge value={report.comparison.bookingsChange} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Occupancy</p>
                <p className="text-2xl font-semibold">{report.summary.avgOccupancy}%</p>
                <ChangeBadge value={report.comparison.occupancyChange} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Compared to prior period: {report.priorPeriod.start} → {report.priorPeriod.end}
            </p>
          </div>

          {/* KPI grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Expenses', value: formatCurrency(report.summary.totalExpenses), icon: Wallet },
              { label: 'Profit Margin', value: `${report.summary.profitMargin}%`, icon: Percent },
              { label: 'Avg / Booking', value: formatCurrency(report.summary.avgRevenuePerBooking), icon: FileBarChart },
              { label: 'ADR (per night)', value: formatCurrency(report.summary.avgRevenuePerNight), icon: Moon },
            ].map((card, i) => (
              <div key={i} className="str-glass-card p-5">
                <card.icon className="h-5 w-5 text-primary/70 mb-2" />
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-semibold">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Targets */}
          {(report.target || revenueProgress !== null) && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="str-glass-card p-5">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Revenue target ({monthYear})
                </p>
                {report.target ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      Goal: {formatCurrency(report.target.revenueTarget)}
                    </p>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full str-progress-bar rounded-full transition-all"
                        style={{ width: `${revenueProgress ?? 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{revenueProgress}% achieved</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Set targets below to track monthly goals.</p>
                )}
              </div>
              <div className="str-glass-card p-5">
                <p className="text-sm font-medium mb-2">Occupancy target</p>
                {report.target ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      Goal: {report.target.occupancyTarget}% · Actual: {report.summary.avgOccupancy}%
                    </p>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full str-progress-bar rounded-full transition-all opacity-80"
                        style={{ width: `${occupancyProgress ?? 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{occupancyProgress}% of target</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
              </div>
            </div>
          )}

          {/* Monthly chart */}
          {report.monthly.length > 0 && (
            <div className="str-glass-card p-6">
              <h3 className="font-semibold mb-1">Monthly Performance</h3>
              <p className="text-xs text-muted-foreground mb-4">Revenue, expenses, and profit by month</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={report.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.revenue} radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill={CHART_COLORS.expenses} radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill={CHART_COLORS.profit} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="str-glass-card p-5">
              <h3 className="font-semibold mb-3">Revenue by Source</h3>
              {report.bySource.length === 0 ? (
                <p className="text-sm text-muted-foreground">No source data in range.</p>
              ) : (
                <ul className="space-y-3">
                  {report.bySource.map((s) => (
                    <li key={s.source}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{s.source}</span>
                        <span className="font-medium">{formatCurrency(s.revenue)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full str-progress-bar opacity-70"
                          style={{ width: `${s.share}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {s.share}% · {s.bookings} bookings
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="str-glass-card p-5">
              <h3 className="font-semibold mb-3">Top Properties</h3>
              {report.byProperty.length === 0 ? (
                <p className="text-sm text-muted-foreground">No property data in range.</p>
              ) : (
                <ul className="space-y-2">
                  {report.byProperty.map((p, i) => (
                    <li key={p.property} className="flex justify-between text-sm gap-2">
                      <span>
                        <span className="text-primary/80 font-medium">#{i + 1}</span> {p.property}
                      </span>
                      <span className="font-medium text-right">
                        {formatCurrency(p.revenue)}
                        <span className="block text-[10px] text-muted-foreground font-normal">
                          {p.avgOccupancy}% occ.
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="str-glass-card p-6 print:break-inside-avoid">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-400" />
                Insights &amp; Recommendations
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {insights.map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-4 rounded-xl border text-sm',
                      item.type === 'success' && 'str-insight--success',
                      item.type === 'warning' && 'str-insight--warning',
                      item.type === 'info' && 'str-insight--info',
                      item.type === 'tip' && 'str-insight--tip'
                    )}
                  >
                    <p className="font-semibold mb-1">{item.title}</p>
                    <p className="text-muted-foreground">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Set targets */}
          <div className="str-glass-card p-5 print:hidden">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Set Monthly Targets ({monthYear})
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Targets apply to the month of your range start date. Used for progress bars and insights.
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-muted-foreground">Revenue target (₱)</label>
                <input
                  type="number"
                  min={0}
                  value={revenueTarget}
                  onChange={(e) => setRevenueTarget(e.target.value)}
                  placeholder="100000"
                  className="block mt-1 px-3 py-2 border border-border rounded-xl bg-background w-44"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Occupancy target (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={occupancyTarget}
                  onChange={(e) => setOccupancyTarget(e.target.value)}
                  className="block mt-1 px-3 py-2 border border-border rounded-xl bg-background w-28"
                />
              </div>
              <button
                type="button"
                onClick={saveTarget}
                disabled={savingTarget}
                className="str-btn-primary !w-auto px-5 py-2.5 text-sm"
              >
                {savingTarget && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Targets
              </button>
            </div>
          </div>

          {report.summary.totalBookings === 0 && (
            <div className="str-glass-card p-6 text-center text-muted-foreground text-sm">
              No rental records in this date range. Upload CSV data from the Upload page to populate reports.
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
