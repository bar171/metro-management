import { useEffect, type ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAppStore } from '@/stores/useAppStore';

export function AppLayout({ children }: { children: ReactNode }) {
  const loadAll = useAppStore(s => s.loadAll);
  const theme = useAppStore(s => s.theme);

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? '' : theme;
    loadAll();
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 overflow-auto custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
