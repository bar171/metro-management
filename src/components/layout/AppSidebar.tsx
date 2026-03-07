import {
  LayoutDashboard,
  GitBranch,
  Users,
  BarChart3,
  Server,
  ScrollText,
  HeartPulse,
  Wrench,
  ShieldAlert,
  Folder,
  Database,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Pipelines', url: '/pipelines', icon: GitBranch },

  { title: 'Storage & Links', url: '/storage', icon: Folder },
  { title: 'Metrics', url: '/metrics', icon: BarChart3 },
  { title: 'Services', url: '/services', icon: Server },
  { title: 'Backfill Manager', url: '/backfill', icon: Database },
  { title: 'Blacklist Admin', url: '/blacklist', icon: ShieldAlert },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { services } = useAppStore();

  const isAnyDegraded = useMemo(() =>
    services.some(s => s.status === 'degraded' || s.status === 'lagging'),
    [services]);

  const [passingTrains, setPassingTrains] = useState<number[]>([]);

  const handleLogoClick = useCallback(() => {
    const id = Date.now() + Math.random();
    setPassingTrains(prev => [...prev, id]);
    setTimeout(() => {
      setPassingTrains(prev => prev.filter(trainId => trainId !== id));
    }, 3000);
  }, []);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div
          className="logo-container group flex items-center gap-3 cursor-pointer transition-all duration-300"
          onClick={handleLogoClick}
        >
          {/* Hexagonal Logo Container with Glow */}
          <div className="relative flex-shrink-0">
            <div className="logo-glow absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 transition-opacity duration-700" />

            <div className="relative w-10 h-10 flex items-center justify-center">
              {/* Spinning tech border */}
              <div className="absolute inset-0 border border-primary/20 rounded-lg rotate-45 group-hover:rotate-90 transition-transform duration-500" />

              <div className="relative w-8 h-8 bg-sidebar-accent/50 rounded-lg flex items-center justify-center border border-primary/30 overflow-hidden shadow-2xl">
                <img src="/favicon.svg" alt="Metro Logo" className="w-5 h-5 z-10 filter drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />

                {/* Tech background pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,var(--sidebar-primary)_1px,transparent_1px)] bg-[size:4px_4px]" />
              </div>

              {/* Status Indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-sidebar-background z-30">
                <div className="absolute inset-0 bg-emerald-500 rounded-full status-pulse-dot" />
              </div>
            </div>
          </div>

          {!collapsed && (
            <div className="flex flex-col justify-center min-w-[120px]">
              <div className="flex items-center gap-1.5">
                <h1 className="text-[13px] font-extrabold text-sidebar-accent-foreground tracking-[0.05em] uppercase leading-none font-mono">
                  Metro<span className="text-primary italic">ETL</span>
                </h1>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="h-[1px] w-3 bg-primary/40" />
                <p className="text-[9px] text-sidebar-foreground/60 font-medium tracking-[0.2em] uppercase leading-none">
                  Control Plane
                </p>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <div className="relative">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.title === 'Pipelines' && isAnyDegraded && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-critical opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-critical"></span>
                          </span>
                        )}
                      </div>
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Easter Egg Trains */}
      {passingTrains.map(id => (
        <img
          key={id}
          src="/train.png"
          alt="Metro Train"
          className="fixed top-1/2 z-[600] h-[900px] w-auto pointer-events-none animate-train-ride"
        />
      ))}
    </Sidebar>
  );
}
