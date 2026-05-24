import { useEffect, type ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAppStore } from '@/stores/useAppStore';
import './layout.css';

export function AppLayout({ children }: { children: ReactNode }) {
  const loadAll = useAppStore(s => s.loadAll);
  const theme = useAppStore(s => s.theme);

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? '' : theme;
    loadAll();
  }, [loadAll, theme]);

  return (
    <SidebarProvider>
      <div className="app-layout">
        <AppSidebar />
        <div className="app-layout__main-column">
          <AppHeader />
          <main className="app-layout__content custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
