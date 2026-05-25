import React from 'react';
import { LayoutDashboard, Upload, BarChart3, Users, ClipboardList, LogOut, Zap, X, Home, FileBarChart, UserCircle } from 'lucide-react';
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
      {open && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'str-sidebar transform transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 str-brand-icon str-sidebar-brand-glow">
                <Zap className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-semibold text-sm tracking-tight">STR-Streamline</div>
                <div className="text-[10px] text-muted-foreground">Analytics</div>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border border-border">
              <div className="w-10 h-10 str-avatar">
                {session?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{session?.name}</div>
                <div className="text-xs text-muted-foreground capitalize flex items-center gap-1.5">
                  <span className={cn(
                    'inline-block w-1.5 h-1.5 rounded-full ring-2 ring-offset-1 ring-offset-transparent',
                    isAdmin() ? 'bg-amber-400 ring-amber-400/40' : 'bg-emerald-400 ring-emerald-400/40'
                  )} />
                  {session?.role}
                </div>
              </div>
            </div>
          </div>

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
                    'str-nav-item',
                    current === item.key && 'str-nav-item--active'
                  )}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
          </nav>

          <div className="p-3 border-t border-border">
            <button
              onClick={logout}
              className="str-nav-item hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-950/30 dark:hover:!text-red-300"
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
