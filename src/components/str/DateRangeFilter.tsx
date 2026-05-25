import React from 'react';
import { Calendar } from 'lucide-react';

export interface DateRange {
  start: string;
  end: string;
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESETS: { label: string; days: number }[] = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

export const DateRangeFilter: React.FC<Props> = ({ value, onChange, className }) => {
  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onChange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
      <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 rounded-lg px-3 py-2">
        <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <input
          type="date"
          value={value.start}
          max={value.end}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          className="bg-transparent text-sm text-gray-800 dark:text-purple-100 focus:outline-none"
        />
        <span className="text-purple-400 text-sm">→</span>
        <input
          type="date"
          value={value.end}
          min={value.start}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          className="bg-transparent text-sm text-gray-800 dark:text-purple-100 focus:outline-none"
        />
      </div>
      <div className="flex gap-1">
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.days)}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export function getDefaultRange(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}
