import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, Shield, X, Search, Mail, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useUsers, useInvalidateStr } from '@/hooks/useStrData';
import { UserPublic, UserRole } from '@/types';
import { sanitizeInput, isValidEmail } from '@/lib/secureHash';
import { cn } from '@/lib/utils';

function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
}

export const UsersPage: React.FC = () => {
  const { session, logActivity } = useAuth();
  const { data: users = [], isLoading, refetch } = useUsers();
  const invalidate = useInvalidateStr();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; user?: UserPublic } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserPublic | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredUsers = users.filter(u => {
    const q = sanitizeInput(search).toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const handleDelete = async (user: UserPublic) => {
    if (user.id === session?.userId) {
      setFormError('You cannot delete your own account.');
      return;
    }
    try {
      await api.deleteUser(user.id);
      logActivity('USER_DELETE', `Deleted user: ${user.email}`);
      setConfirmDelete(null);
      invalidate.users();
      refetch();
    } catch (e) {
      setFormError((e as Error).message);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const name = sanitizeInput(String(form.get('name') || ''));
    const email = sanitizeInput(String(form.get('email') || ''));
    const password = String(form.get('password') || '');
    const role = String(form.get('role') || 'user') as UserRole;
    const status = String(form.get('status') || 'active') as 'active' | 'inactive';

    if (!name || name.length < 2) { setFormError('Name must be at least 2 characters.'); setSaving(false); return; }
    if (!isValidEmail(email)) { setFormError('Invalid email address.'); setSaving(false); return; }

    try {
      if (modal?.mode === 'create') {
        if (!isStrongPassword(password)) {
          setFormError('Password must be 8+ chars with upper, lower, and number.');
          setSaving(false);
          return;
        }
        await api.createUser({ name, email, password, role, status });
        logActivity('USER_CREATE', `Created user: ${email} (${role})`);
      } else if (modal?.user) {
        const patch: Record<string, unknown> = { name, email, role, status };
        if (password) {
          if (!isStrongPassword(password)) {
            setFormError('Password must be 8+ chars with upper, lower, and number.');
            setSaving(false);
            return;
          }
          patch.password = password;
        }
        await api.updateUser(modal.user.id, patch);
        logActivity('USER_UPDATE', `Updated user: ${email}`);
      }
      setModal(null);
      invalidate.users();
      refetch();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-purple-300 text-sm mt-1">Manage accounts stored in MySQL</p>
        </div>
        <button
          onClick={() => { setModal({ mode: 'create' }); setFormError(''); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-medium"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {formError && !modal && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 text-sm text-red-700 dark:text-red-300">
          {formError}
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 text-sm border border-purple-200 dark:border-purple-700 bg-white dark:bg-purple-950/40 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e] rounded-2xl border border-purple-100 dark:border-purple-800/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-purple-800/30">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/20">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{u.name}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-purple-200">{u.email}</td>
                  <td className="py-3 px-4 capitalize">{u.role}</td>
                  <td className="py-3 px-4">{u.status}</td>
                  <td className="py-3 px-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => setModal({ mode: 'edit', user: u })} className="p-2 text-purple-600"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => setConfirmDelete(u)} disabled={u.id === session?.userId} className="p-2 text-red-500 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-[#231340] rounded-2xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{modal.mode === 'create' ? 'Create User' : 'Edit User'}</h3>
              <button onClick={() => setModal(null)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="name" required defaultValue={modal.user?.name} placeholder="Name" className="w-full px-3 py-2 border rounded-lg dark:bg-purple-950/40 dark:text-white" />
              <input name="email" type="email" required defaultValue={modal.user?.email} placeholder="Email" className="w-full px-3 py-2 border rounded-lg dark:bg-purple-950/40 dark:text-white" />
              <input name="password" type="password" required={modal.mode === 'create'} placeholder="Password (8+ chars)" className="w-full px-3 py-2 border rounded-lg dark:bg-purple-950/40 dark:text-white" />
              <select name="role" defaultValue={modal.user?.role || 'user'} className="w-full px-3 py-2 border rounded-lg dark:bg-purple-950/40 dark:text-white">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <select name="status" defaultValue={modal.user?.status || 'active'} className="w-full px-3 py-2 border rounded-lg dark:bg-purple-950/40 dark:text-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <button type="submit" disabled={saving} className="w-full py-2 bg-purple-600 text-white rounded-lg flex justify-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white dark:bg-[#231340] rounded-2xl p-6 max-w-sm" onClick={e => e.stopPropagation()}>
            <p className="mb-4 dark:text-white">Delete <strong>{confirmDelete.name}</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2 bg-red-600 text-white rounded-lg">Delete</button>
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border rounded-lg dark:text-white">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
