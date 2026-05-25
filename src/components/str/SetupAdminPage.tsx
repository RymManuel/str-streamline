import React, { useState } from 'react';
import { Zap, Shield, Mail, Lock, User, AlertCircle, Loader2, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isValidEmail } from '@/lib/secureHash';
import { AuroraShell, AuroraAuthCard } from '@/components/str/AuroraShell';

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

  const inputClass = 'str-input-dark';

  return (
    <AuroraShell className="flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg str-page-enter">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 str-brand-icon str-sidebar-brand-glow mb-4">
            <Zap className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight str-accent-title mb-1">STR-Streamline Setup</h1>
          <p className="text-muted-foreground text-sm">Create the first administrator account (MySQL)</p>
        </div>

        {!apiOnline && (
          <div className="mb-4 flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
            <Database className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">API or MySQL not connected</p>
              <p className="text-amber-700/80 dark:text-amber-300/80 mt-1">
                Start the backend: <code className="text-xs bg-black/30 px-1 rounded">npm run dev:all</code>
                {' '}and run <code className="text-xs bg-black/30 px-1 rounded">npm run db:init</code> first.
              </p>
            </div>
          </div>
        )}

        <AuroraAuthCard>
          <h2 className="text-xl font-display font-semibold text-foreground mb-1">Administrator Registration</h2>
          <p className="text-muted-foreground text-sm mb-6">
            No demo accounts. This one-time setup creates your capstone admin login.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className={inputClass} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">8+ chars, uppercase, lowercase, number</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className={inputClass} />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading || !apiOnline} className="str-btn-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Create Administrator &amp; Continue
            </button>
          </form>
        </AuroraAuthCard>
      </div>
    </AuroraShell>
  );
};
