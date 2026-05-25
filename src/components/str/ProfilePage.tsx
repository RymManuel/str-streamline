import React, { useState } from 'react';
import { User, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export const ProfilePage: React.FC = () => {
  const { session, refreshSession, logActivity } = useAuth();
  const [name, setName] = useState(session?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    setMsg('');
    try {
      await api.updateProfile(name.trim());
      await refreshSession();
      logActivity('PROFILE_UPDATE', 'Updated display name');
      setMsg('Profile updated successfully.');
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    setMsg('');
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setMsg('Password changed successfully.');
      logActivity('PASSWORD_CHANGE', 'Password updated');
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-500 dark:text-purple-300 text-sm mt-1">{session?.email}</p>
      </div>

      {msg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm">
          <CheckCircle2 className="h-4 w-4" /> {msg}
        </div>
      )}
      {err && <p className="text-sm text-red-600 dark:text-red-300">{err}</p>}

      <form onSubmit={saveProfile} className="p-6 rounded-2xl bg-white dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 space-y-4">
        <h2 className="font-semibold dark:text-white flex items-center gap-2"><User className="h-5 w-5 text-purple-500" /> Display Name</h2>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          required
          minLength={2}
          className="w-full px-3 py-2 border rounded-lg dark:bg-purple-950/40 dark:text-white"
        />
        <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Profile
        </button>
      </form>

      <form onSubmit={savePassword} className="p-6 rounded-2xl bg-white dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 space-y-4">
        <h2 className="font-semibold dark:text-white flex items-center gap-2"><Lock className="h-5 w-5 text-purple-500" /> Change Password</h2>
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg dark:bg-purple-950/40 dark:text-white"
        />
        <input
          type="password"
          placeholder="New password (8+ chars, mixed case, number)"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-3 py-2 border rounded-lg dark:bg-purple-950/40 dark:text-white"
        />
        <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Update Password
        </button>
      </form>

      <div className="text-xs text-gray-500 dark:text-purple-400 p-4 rounded-lg bg-purple-50/50 dark:bg-purple-900/20">
        <p><strong>Role:</strong> {session?.role}</p>
        <p className="mt-1">Sessions expire after 2 hours. Credentials are stored with bcrypt in MySQL.</p>
      </div>
    </div>
  );
};
