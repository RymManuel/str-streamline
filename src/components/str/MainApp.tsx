import React, { useState } from 'react';
import { Sidebar, PageKey } from './Sidebar';
import { TopBar } from './TopBar';
import { DashboardPage } from './DashboardPage';
import { UploadPage } from './UploadPage';
import { AnalyticsPage } from './AnalyticsPage';
import { UsersPage } from './UsersPage';
import { LogsPage } from './LogsPage';
import { ReportsPage } from './ReportsPage';
import { PropertiesPage } from './PropertiesPage';
import { ProfilePage } from './ProfilePage';
import { useAuth } from '@/contexts/AuthContext';

export const MainApp: React.FC = () => {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Role guard: redirect non-admins from admin pages
  React.useEffect(() => {
    if ((page === 'users' || page === 'logs') && !isAdmin()) {
      setPage('dashboard');
    }
  }, [page, isAdmin]);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'upload': return <UploadPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'reports': return <ReportsPage />;
      case 'properties': return <PropertiesPage />;
      case 'profile': return <ProfilePage />;
      case 'users': return isAdmin() ? <UsersPage /> : <DashboardPage />;
      case 'logs': return isAdmin() ? <LogsPage /> : <DashboardPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/40 via-white to-violet-50/40 dark:from-[#0f0620] dark:via-[#1a0b2e] dark:to-[#0f0620] flex">
      <Sidebar
        current={page}
        onNavigate={setPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {renderPage()}
        </main>
        <footer className="px-6 py-4 border-t border-purple-100 dark:border-purple-900/40 text-center text-xs text-gray-500 dark:text-purple-400">
          STR-Streamline © 2026 · Capstone Project · Secure Financial Analytics for Short-Term Rentals
        </footer>
      </div>
    </div>
  );
};
