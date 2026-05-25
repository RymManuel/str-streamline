import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionStore } from '@/lib/session';
import { Menu, Clock, Database } from 'lucide-react';

interface Props {
  onMenuClick: () => void;
}

export const TopBar: React.FC<Props> = ({ onMenuClick }) => {
  const { session, apiOnline } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const s = sessionStore.get();
      if (!s) return;
      const ms = s.expiresAt - Date.now();
      if (ms <= 0) { setTimeLeft('Expired'); return; }
      const mins = Math.floor(ms / 60000);
      const hrs = Math.floor(mins / 60);
      setTimeLeft(hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`);
    };
    update();
    const i = setInterval(update, 30000);
    return () => clearInterval(i);
  }, [session]);

  return (
    <header className="str-topbar">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-foreground/80 hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:block">
            <p className="text-xs text-muted-foreground font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
            apiOnline
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-300'
          }`}>
            <Database className="h-3 w-3" />
            MySQL {apiOnline ? 'Connected' : 'Offline'}
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 border border-primary/15 text-primary">
            <Clock className="h-3 w-3" />
            Session: {timeLeft}
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-border/60">
            <div className="w-9 h-9 str-avatar shadow-sm">
              {session?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold leading-tight">{session?.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{session?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
