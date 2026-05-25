import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useAllRecords() {
  return useQuery({
    queryKey: ['records', 'all'],
    queryFn: async () => (await api.allRecords()).records,
  });
}

export function useAnalyticsRecords(start: string, end: string) {
  return useQuery({
    queryKey: ['records', start, end],
    queryFn: async () => (await api.analytics(start, end)).records,
    enabled: !!start && !!end,
  });
}

export function useFiles() {
  return useQuery({
    queryKey: ['files'],
    queryFn: async () => (await api.listFiles()).files,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.listUsers()).users,
  });
}

export function useLogs() {
  return useQuery({
    queryKey: ['logs'],
    queryFn: async () => (await api.listLogs()).logs,
  });
}

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: async () => (await api.listProperties()).properties,
  });
}

export function useReportSummary(start: string, end: string) {
  return useQuery({
    queryKey: ['report', start, end],
    queryFn: () => api.reportSummary(start, end),
    enabled: !!start && !!end,
  });
}

export function useInvalidateStr() {
  const qc = useQueryClient();
  return {
    records: () => {
      qc.invalidateQueries({ queryKey: ['records'] });
      qc.invalidateQueries({ queryKey: ['report'] });
    },
    files: () => qc.invalidateQueries({ queryKey: ['files'] }),
    users: () => qc.invalidateQueries({ queryKey: ['users'] }),
    logs: () => qc.invalidateQueries({ queryKey: ['logs'] }),
    properties: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  };
}
