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
      <div className="str-date-shell">
        <Calendar className="h-4 w-4 text-primary" />
        <input
          type="date"
          value={value.start}
          max={value.end}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          className="bg-transparent text-sm focus:outline-none"
        />
        <span className="text-muted-foreground text-sm">→</span>
        <input
          type="date"
          value={value.end}
          min={value.start}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          className="bg-transparent text-sm focus:outline-none"
        />
      </div>
      <div className="flex gap-1">
        {PRESETS.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.days)}
            className="str-filter-chip"
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
