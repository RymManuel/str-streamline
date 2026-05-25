import type { ReportSummary } from '@/types';
import { formatCurrency } from '@/lib/analytics';

export interface ReportInsight {
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  body: string;
}

export function buildReportInsights(report: ReportSummary): ReportInsight[] {
  const insights: ReportInsight[] = [];
  const { summary, comparison, target, bySource, byProperty } = report;

  if (summary.totalBookings === 0) {
    insights.push({
      type: 'tip',
      title: 'No data in this period',
      body: 'Upload CSV rental data or widen the date range to generate a full financial report.',
    });
    return insights;
  }

  if (comparison.revenueChange > 5) {
    insights.push({
      type: 'success',
      title: 'Revenue is trending up',
      body: `Revenue grew ${comparison.revenueChange}% versus the previous period (${formatCurrency(comparison.priorSummary.totalRevenue)} → ${formatCurrency(summary.totalRevenue)}).`,
    });
  } else if (comparison.revenueChange < -5) {
    insights.push({
      type: 'warning',
      title: 'Revenue declined',
      body: `Revenue fell ${Math.abs(comparison.revenueChange)}% vs the prior period. Review pricing, occupancy, and top-performing listings.`,
    });
  }

  if (summary.profitMargin >= 25) {
    insights.push({
      type: 'success',
      title: 'Healthy profit margin',
      body: `Net margin is ${summary.profitMargin}% — expenses are well controlled relative to revenue.`,
    });
  } else if (summary.profitMargin < 10 && summary.totalRevenue > 0) {
    insights.push({
      type: 'warning',
      title: 'Thin profit margin',
      body: `Margin is only ${summary.profitMargin}%. Audit cleaning, maintenance, and platform fees in your expense column.`,
    });
  }

  if (target) {
    const revPct = target.revenueTarget > 0
      ? Math.round((summary.totalRevenue / target.revenueTarget) * 100)
      : 0;
    const occGap = summary.avgOccupancy - target.occupancyTarget;
    if (revPct >= 100) {
      insights.push({
        type: 'success',
        title: 'Revenue target achieved',
        body: `You reached ${revPct}% of the ${target.monthYear} revenue goal (${formatCurrency(target.revenueTarget)}).`,
      });
    } else if (revPct < 80) {
      insights.push({
        type: 'warning',
        title: 'Below revenue target',
        body: `At ${revPct}% of target, you need roughly ${formatCurrency(target.revenueTarget - summary.totalRevenue)} more revenue this month.`,
      });
    }
    if (occGap < -10) {
      insights.push({
        type: 'info',
        title: 'Occupancy below target',
        body: `Average occupancy (${summary.avgOccupancy}%) trails your ${target.occupancyTarget}% goal by ${Math.abs(Math.round(occGap))} points.`,
      });
    }
  }

  if (bySource.length > 0) {
    const top = bySource[0];
    insights.push({
      type: 'info',
      title: 'Leading booking channel',
      body: `${top.source} drives ${top.share}% of revenue (${formatCurrency(top.revenue)} across ${top.bookings} bookings).`,
    });
  }

  if (byProperty.length >= 2) {
    const top = byProperty[0];
    const second = byProperty[1];
    if (top.revenue > second.revenue * 1.5) {
      insights.push({
        type: 'tip',
        title: 'Portfolio concentration',
        body: `"${top.property}" significantly outperforms other listings — consider replicating its pricing and amenities strategy.`,
      });
    }
  }

  if (summary.avgRevenuePerNight > 0) {
    insights.push({
      type: 'tip',
      title: 'ADR benchmark',
      body: `Average daily revenue (ADR) is ${formatCurrency(summary.avgRevenuePerNight)} per night — use this when setting seasonal rates.`,
    });
  }

  return insights.slice(0, 6);
}
