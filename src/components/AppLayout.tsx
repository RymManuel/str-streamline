import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/components/str/LoginPage';
import { SetupAdminPage } from '@/components/str/SetupAdminPage';
import { MainApp } from '@/components/str/MainApp';
import { AuroraShell } from '@/components/str/AuroraShell';
import { Loader2 } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { session, loading, needsSetup } = useAuth();

  if (loading) {
    return (
      <AuroraShell className="flex items-center justify-center">
        <div className="text-center str-page-enter">
          <div className="inline-flex items-center justify-center w-14 h-14 str-brand-icon str-sidebar-brand-glow mb-4">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
          <p className="text-lg font-semibold tracking-tight">STR-Streamline</p>
          <p className="text-muted-foreground text-sm mt-2">Initializing analytics engine…</p>
        </div>
      </AuroraShell>
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
