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
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#1a0b2e]/80 backdrop-blur-lg border-b border-purple-100 dark:border-purple-900/40">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:block">
            <p className="text-xs text-gray-500 dark:text-purple-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${apiOnline ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300'}`}>
            <Database className="h-3 w-3" />
            MySQL {apiOnline ? 'Connected' : 'Offline'}
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/40 text-xs text-purple-700 dark:text-purple-200">
            <Clock className="h-3 w-3" />
            Session: {timeLeft}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
              {session?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{session?.name}</div>
              <div className="text-xs text-gray-500 dark:text-purple-400 capitalize">{session?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
