import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/components/str/LoginPage';
import { SetupAdminPage } from '@/components/str/SetupAdminPage';
import { MainApp } from '@/components/str/MainApp';
import { Loader2 } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { session, loading, needsSetup } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0620]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-purple-200 text-sm">Loading STR-Streamline...</p>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <SetupAdminPage />;
  }

  if (!session) {
    return <LoginPage />;
  }

  return <MainApp />;
};

export default AppLayout;
