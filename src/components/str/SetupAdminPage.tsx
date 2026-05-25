import React, { useState } from 'react';
import { Sparkles, Shield, Mail, Lock, User, AlertCircle, Loader2, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isValidEmail } from '@/lib/secureHash';

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export const SetupAdminPage: React.FC = () => {
  const { setupAdmin, apiOnline } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.length < 2) {
      setError('Enter your full name (at least 2 characters).');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!isStrongPassword(password)) {
      setError('Password needs 8+ characters with uppercase, lowercase, and a number.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await setupAdmin(name.trim(), email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.success) setError(result.error || 'Setup failed.');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0620]">
      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-2xl shadow-purple-500/40 mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">STR-Streamline Setup</h1>
          <p className="text-purple-300 text-sm">Create the first administrator account (MySQL)</p>
        </div>

        {!apiOnline && (
          <div className="mb-4 flex items-start gap-2 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Database className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200">
              <p className="font-medium">API or MySQL not connected</p>
              <p className="text-amber-300/80 mt-1">
                Start the backend: <code className="text-xs bg-black/30 px-1 rounded">npm run dev:all</code>
                and run <code className="text-xs bg-black/30 px-1 rounded">npm run db:init</code> first.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-1">Administrator Registration</h2>
          <p className="text-purple-300 text-sm mb-6">
            No demo accounts. This one-time setup creates your capstone admin login.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full bg-purple-950/40 border border-purple-700/40 text-white pl-10 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={254}
                  className="w-full bg-purple-950/40 border border-purple-700/40 text-white pl-10 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-purple-950/40 border border-purple-700/40 text-white pl-10 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <p className="text-xs text-purple-400 mt-1">8+ chars, uppercase, lowercase, number</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full bg-purple-950/40 border border-purple-700/40 text-white pl-10 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !apiOnline}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-purple-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Create Administrator &amp; Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
