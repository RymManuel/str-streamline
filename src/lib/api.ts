// REST API client — MySQL backend (Express)

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'str_api_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  health: () => request<{ status: string; database: string }>('/health'),

  setupStatus: () => request<{ needsSetup: boolean }>('/auth/setup-status'),

  setupAdmin: (body: { name: string; email: string; password: string }) =>
    request<{
      token: string;
      expiresAt: string;
      user: { id: string; name: string; email: string; role: 'admin' | 'user' };
    }>('/auth/setup-admin', { method: 'POST', body: JSON.stringify(body) }),

  login: (email: string, password: string) =>
    request<{
      token: string;
      expiresAt: string;
      user: { id: string; name: string; email: string; role: 'admin' | 'user' };
    }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  me: () =>
    request<{
      user: {
        id: string;
        name: string;
        email: string;
        role: 'admin' | 'user';
        status: string;
        createdAt: string;
        lastLogin?: string;
      };
    }>('/auth/me'),

  updateProfile: (name: string) =>
    request<{ user: { id: string; name: string; email: string; role: 'admin' | 'user' } }>(
      '/auth/profile',
      { method: 'PUT', body: JSON.stringify({ name }) }
    ),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  listUsers: () => request<{ users: import('@/types').UserPublic[] }>('/users'),

  createUser: (u: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    status: 'active' | 'inactive';
  }) => request<{ user: import('@/types').UserPublic }>('/users', { method: 'POST', body: JSON.stringify(u) }),

  updateUser: (id: string, patch: Record<string, unknown>) =>
    request<{ user: import('@/types').UserPublic }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  deleteUser: (id: string) => request<{ ok: boolean }>(`/users/${id}`, { method: 'DELETE' }),

  uploadCsv: (fileName: string, source: string, records: unknown[]) =>
    request<{ fileId: string; rowCount: number }>('/files/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName, source, records }),
    }),

  listFiles: () => request<{ files: import('@/types').UploadedFile[] }>('/files'),

  deleteFile: (id: string) => request<{ ok: boolean }>(`/files/${id}`, { method: 'DELETE' }),

  analytics: (start: string, end: string) =>
    request<{ records: import('@/types').RentalRecord[] }>(
      `/analytics?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    ),

  allRecords: () => request<{ records: import('@/types').RentalRecord[] }>('/analytics/all-records'),

  listLogs: () => request<{ logs: import('@/types').ActivityLog[] }>('/logs'),

  recordLog: (action: string, details?: string) =>
    request<{ ok: boolean }>('/logs', {
      method: 'POST',
      body: JSON.stringify({ action, details: details || '' }),
    }),

  listProperties: () => request<{ properties: import('@/types').Property[] }>('/properties'),

  createProperty: (body: { name: string; location?: string; defaultSource?: string; userId?: string }) =>
    request<{ property: import('@/types').Property }>('/properties', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateProperty: (id: string, patch: Record<string, unknown>) =>
    request<{ property: import('@/types').Property }>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  deleteProperty: (id: string) => request<{ ok: boolean }>(`/properties/${id}`, { method: 'DELETE' }),

  reportSummary: (start: string, end: string) =>
    request<import('@/types').ReportSummary>(
      `/reports/summary?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    ),

  setTarget: (monthYear: string, revenueTarget: number, occupancyTarget: number) =>
    request<{ ok: boolean }>('/reports/targets', {
      method: 'POST',
      body: JSON.stringify({ monthYear, revenueTarget, occupancyTarget }),
    }),
};
