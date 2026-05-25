import React, { useMemo, useState } from 'react';
import { ClipboardList, Search, LogIn, LogOut, Upload, Trash2, Edit2, UserPlus, Download, Activity } from 'lucide-react';
import { useLogs } from '@/hooks/useStrData';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { sanitizeInput } from '@/lib/secureHash';
import { cn } from '@/lib/utils';

const ACTION_META: Record<string, { color: string; icon: React.ReactNode }> = {
  LOGIN: { color: 'emerald', icon: <LogIn className="h-4 w-4" /> },
  LOGOUT: { color: 'gray', icon: <LogOut className="h-4 w-4" /> },
  CSV_UPLOAD: { color: 'purple', icon: <Upload className="h-4 w-4" /> },
  FILE_DELETE: { color: 'red', icon: <Trash2 className="h-4 w-4" /> },
  USER_CREATE: { color: 'violet', icon: <UserPlus className="h-4 w-4" /> },
  USER_UPDATE: { color: 'amber', icon: <Edit2 className="h-4 w-4" /> },
  USER_DELETE: { color: 'red', icon: <Trash2 className="h-4 w-4" /> },
  DATA_EXPORT: { color: 'fuchsia', icon: <Download className="h-4 w-4" /> },
};

const COLOR_CLASS: Record<string, string> = {
  emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  gray: 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300',
  purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
  red: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',
  violet: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',
  amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
  fuchsia: 'bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300',
};

export const LogsPage: React.FC = () => {
  const qc = useQueryClient();
  const { data: logs = [], isLoading } = useLogs();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const filtered = useMemo(() => {
    const q = sanitizeInput(search).toLowerCase();
    return logs.filter(l => {
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (!q) return true;
      return l.userName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q);
    });
  }, [logs, search, actionFilter]);

  const actionTypes = Array.from(new Set(logs.map(l => l.action)));

  const exportLogs = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Details', 'IP Address'];
    const rows = filtered.map(l => [l.timestamp, l.userName, l.action, l.details || '', l.ipAddress]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
          <p className="text-gray-500 dark:text-purple-300 text-sm mt-1">
            Audit trail persisted in MySQL
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['logs'] })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-700 text-sm text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40"
          >
            <Activity className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-medium hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-500/20"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: logs.length, color: 'purple' },
          { label: 'Logins Today', value: logs.filter(l => l.action === 'LOGIN' && new Date(l.timestamp).toDateString() === new Date().toDateString()).length, color: 'emerald' },
          { label: 'CSV Uploads', value: logs.filter(l => l.action === 'CSV_UPLOAD').length, color: 'violet' },
          { label: 'User Changes', value: logs.filter(l => ['USER_CREATE', 'USER_UPDATE', 'USER_DELETE'].includes(l.action)).length, color: 'fuchsia' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e] rounded-xl p-4 border border-purple-100 dark:border-purple-800/40">
            <div className="text-xs text-gray-500 dark:text-purple-300 mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
          <input
            type="text"
            placeholder="Search logs by user, action, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-purple-200 dark:border-purple-700 bg-white dark:bg-purple-950/40 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2.5 text-sm border border-purple-200 dark:border-purple-700 bg-white dark:bg-purple-950/40 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Actions</option>
          {actionTypes.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Logs list */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e] rounded-2xl border border-purple-100 dark:border-purple-800/40 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList className="h-10 w-10 text-purple-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No activity logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-purple-100 dark:divide-purple-800/30">
            {filtered.slice(0, 200).map(log => {
              const meta = ACTION_META[log.action] || { color: 'gray', icon: <Activity className="h-4 w-4" /> };
              return (
                <div key={log.id} className="p-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 flex items-start gap-4">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', COLOR_CLASS[meta.color])}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{log.userName}</span>
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', COLOR_CLASS[meta.color])}>
                        {log.action}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-sm text-gray-600 dark:text-purple-200">{log.details}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400 dark:text-purple-400">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length > 200 && (
              <div className="p-4 text-center text-xs text-gray-400">
                Showing 200 most recent of {filtered.length} logs. Export to view all.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
