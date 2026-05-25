import React, { useState } from 'react';
import { Zap, Lock, Mail, AlertCircle, Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuroraShell, AuroraAuthCard } from '@/components/str/AuroraShell';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraShell className="flex items-center justify-center p-4">
      <div className="relative w-full max-w-md str-page-enter">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 str-brand-icon str-sidebar-brand-glow mb-4">
            <Zap className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight str-accent-title mb-1">STR-Streamline</h1>
          <p className="text-muted-foreground text-sm">Automated Financial Analytics Platform</p>
        </div>

        <AuroraAuthCard>
          <h2 className="text-xl font-display font-semibold text-foreground mb-1">Welcome Back</h2>
          <p className="text-muted-foreground text-sm mb-6">Sign in to access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@school.edu"
                  autoComplete="email"
                  required
                  maxLength={254}
                  className="str-input-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  maxLength={200}
                  className="str-input-dark pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="str-btn-primary">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Sign In Securely
                </>
              )}
            </button>
          </form>
        </AuroraAuthCard>

        <p className="text-center text-muted-foreground text-xs mt-6">
          Authenticated via MySQL-backed API · bcrypt passwords · JWT sessions
        </p>
      </div>
    </AuroraShell>
  );
};
