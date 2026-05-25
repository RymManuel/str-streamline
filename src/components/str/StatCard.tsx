import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Accent = 'sky' | 'indigo' | 'mint' | 'lilac' | 'peach' | 'rose' | 'purple' | 'violet' | 'fuchsia' | 'emerald' | 'cyan' | 'teal' | 'coral' | 'amber' | 'pink';

const ACCENT_MAP: Record<string, Accent> = {
  purple: 'indigo',
  violet: 'lilac',
  fuchsia: 'rose',
  indigo: 'indigo',
  pink: 'rose',
  emerald: 'mint',
  cyan: 'sky',
  teal: 'mint',
  coral: 'peach',
  amber: 'peach',
};

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  accent?: Accent | string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  icon: Icon,
  accent = 'indigo',
}) => {
  const resolved = ACCENT_MAP[accent] ?? (['sky', 'indigo', 'mint', 'lilac', 'peach', 'rose'].includes(accent) ? accent : 'indigo');
  const positive = (change ?? 0) >= 0;

  return (
    <div className="str-glass-card str-glass-card--stat">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('str-stat-icon', `str-stat-icon--${resolved}`)}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        {typeof change === 'number' && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md',
              positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            )}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
    </div>
  );
};
