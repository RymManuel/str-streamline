import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  accent?: 'purple' | 'violet' | 'fuchsia' | 'indigo' | 'pink' | 'emerald';
}

const ACCENTS: Record<string, string> = {
  purple: 'from-purple-500 to-purple-700 shadow-purple-500/30',
  violet: 'from-violet-500 to-violet-700 shadow-violet-500/30',
  fuchsia: 'from-fuchsia-500 to-fuchsia-700 shadow-fuchsia-500/30',
  indigo: 'from-indigo-500 to-indigo-700 shadow-indigo-500/30',
  pink: 'from-pink-500 to-pink-700 shadow-pink-500/30',
  emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-500/30',
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, change, icon: Icon, accent = 'purple' }) => {
  const positive = (change ?? 0) >= 0;

  return (
    <div className="relative bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e] rounded-2xl p-5 border border-purple-100 dark:border-purple-800/40 shadow-sm hover:shadow-lg hover:shadow-purple-500/10 transition-all group overflow-hidden">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity rounded-full from-purple-500 to-violet-700" />

      <div className="flex items-start justify-between mb-3 relative">
        <div className={cn(
          'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
          ACCENTS[accent]
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {typeof change === 'number' && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            positive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
          )}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500 dark:text-purple-300 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</div>
    </div>
  );
};
