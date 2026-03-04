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
import { useState, useCallback } from 'react';
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
  { title: 'Liveness (Live)', url: '/liveness', icon: HeartPulse },
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
      <SidebarHeader className="p-4">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleLogoClick}
        >
          <img src="/favicon.svg" alt="Metro Logo" className="w-8 h-8" />
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">Metro ETL</h1>
              <p className="text-[10px] text-sidebar-foreground font-mono">CONTROL PLANE</p>
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
                      <item.icon className="h-4 w-4 shrink-0" />
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
