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
    <div className="str-app-canvas flex">
      <Sidebar
        current={page}
        onNavigate={setPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="relative z-[1] flex-1 min-w-0 flex flex-col">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto str-page-enter">
          {renderPage()}
        </main>
        <footer className="str-footer">
          STR-Streamline © 2026 · Capstone Project · Secure Financial Analytics for Short-Term Rentals
        </footer>
      </div>
    </div>
  );
};
