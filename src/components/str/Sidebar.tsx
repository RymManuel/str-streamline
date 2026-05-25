import React from 'react';
import { LayoutDashboard, Upload, BarChart3, Users, ClipboardList, LogOut, Sparkles, X, Home, FileBarChart, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export type PageKey = 'dashboard' | 'upload' | 'analytics' | 'reports' | 'properties' | 'profile' | 'users' | 'logs';

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ current, onNavigate, open, onClose }) => {
  const { session, logout, isAdmin } = useAuth();

  const items: { key: PageKey; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { key: 'upload', label: 'CSV Upload', icon: <Upload className="h-5 w-5" /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> },
    { key: 'reports', label: 'Reports', icon: <FileBarChart className="h-5 w-5" /> },
    { key: 'properties', label: 'Properties', icon: <Home className="h-5 w-5" /> },
    { key: 'profile', label: 'My Profile', icon: <UserCircle className="h-5 w-5" /> },
    { key: 'users', label: 'User Management', icon: <Users className="h-5 w-5" />, adminOnly: true },
    { key: 'logs', label: 'Activity Logs', icon: <ClipboardList className="h-5 w-5" />, adminOnly: true },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 flex-shrink-0',
          'bg-gradient-to-b from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e]',
          'border-r border-purple-900/40 text-white',
          'transform transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-purple-900/40">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm">STR-Streamline</div>
                <div className="text-[10px] text-purple-300">Analytics Platform</div>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden text-purple-300 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User card */}
          <div className="px-4 py-4 border-b border-purple-900/40">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-900/30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-sm font-bold">
                {session?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{session?.name}</div>
                <div className="text-xs text-purple-300 capitalize flex items-center gap-1">
                  <span className={cn(
                    'inline-block w-1.5 h-1.5 rounded-full',
                    isAdmin() ? 'bg-amber-400' : 'bg-green-400'
                  )} />
                  {session?.role}
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {items
              .filter(i => !i.adminOnly || isAdmin())
              .map(item => (
                <button
                  key={item.key}
                  onClick={() => {
                    onNavigate(item.key);
                    onClose();
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all',
                    current === item.key
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                      : 'text-purple-200 hover:bg-purple-900/40 hover:text-white'
                  )}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-purple-900/40">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-purple-200 hover:bg-red-900/30 hover:text-red-300 transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
