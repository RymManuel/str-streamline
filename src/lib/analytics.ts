import { RentalRecord } from '@/types';
import { DateRange } from '@/components/str/DateRangeFilter';

export function filterByRange(records: RentalRecord[], range: DateRange): RentalRecord[] {
  return records.filter(r => r.date >= range.start && r.date <= range.end);
}

export interface Summary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  avgOccupancy: number;
  totalBookings: number;
  totalNights: number;
  avgRevenuePerBooking: number;
  profitMargin: number;
}

export function summarize(records: RentalRecord[]): Summary {
  if (records.length === 0) {
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      avgOccupancy: 0,
      totalBookings: 0,
      totalNights: 0,
      avgRevenuePerBooking: 0,
      profitMargin: 0,
    };
  }
  const totalRevenue = records.reduce((s, r) => s + r.revenue, 0);
  const totalExpenses = records.reduce((s, r) => s + r.expenses, 0);
  const totalOccupancy = records.reduce((s, r) => s + r.occupancy, 0);
  const totalNights = records.reduce((s, r) => s + r.nights, 0);
  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    avgOccupancy: totalOccupancy / records.length,
    totalBookings: records.length,
    totalNights,
    avgRevenuePerBooking: totalRevenue / records.length,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
  };
}

export interface TimeSeriesPoint {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
  occupancy: number;
  bookings: number;
}

// Group by month
export function groupByMonth(records: RentalRecord[]): TimeSeriesPoint[] {
  const groups: Record<string, { revenue: number; expenses: number; occupancy: number; bookings: number }> = {};
  records.forEach(r => {
    const month = r.date.slice(0, 7); // YYYY-MM
    if (!groups[month]) groups[month] = { revenue: 0, expenses: 0, occupancy: 0, bookings: 0 };
    groups[month].revenue += r.revenue;
    groups[month].expenses += r.expenses;
    groups[month].occupancy += r.occupancy;
    groups[month].bookings += 1;
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, g]) => ({
      date,
      revenue: Math.round(g.revenue),
      expenses: Math.round(g.expenses),
      profit: Math.round(g.revenue - g.expenses),
      occupancy: g.bookings > 0 ? Math.round(g.occupancy / g.bookings) : 0,
      bookings: g.bookings,
    }));
}

export interface BreakdownItem {
  name: string;
  value: number;
  count: number;
}

export function groupBySource(records: RentalRecord[]): BreakdownItem[] {
  const groups: Record<string, { value: number; count: number }> = {};
  records.forEach(r => {
    if (!groups[r.source]) groups[r.source] = { value: 0, count: 0 };
    groups[r.source].value += r.revenue;
    groups[r.source].count += 1;
  });
  return Object.entries(groups).map(([name, g]) => ({
    name,
    value: Math.round(g.value),
    count: g.count,
  }));
}

export function groupByProperty(records: RentalRecord[]): BreakdownItem[] {
  const groups: Record<string, { value: number; count: number }> = {};
  records.forEach(r => {
    if (!groups[r.property]) groups[r.property] = { value: 0, count: 0 };
    groups[r.property].value += r.revenue;
    groups[r.property].count += 1;
  });
  return Object.entries(groups)
    .map(([name, g]) => ({ name, value: Math.round(g.value), count: g.count }))
    .sort((a, b) => b.value - a.value);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}
