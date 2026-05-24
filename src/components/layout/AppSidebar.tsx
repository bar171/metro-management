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
      <SidebarHeader className="sidebar-header">
        <div
          className="logo-container group sidebar-logo"
          onClick={handleLogoClick}
        >
          {/* Hexagonal Logo Container with Glow */}
          <div className="sidebar-logo__outer">
            <div className="logo-glow sidebar-logo__glow" />

            <div className="sidebar-logo__icon-wrapper">
              {/* Spinning tech border */}
              <div className="sidebar-logo__spin-border" />

              <div className="sidebar-logo__icon-box">
                <img src="/favicon.svg" alt="Metro Logo" className="sidebar-logo__img" />

                {/* Tech background pattern */}
                <div className="sidebar-logo__pattern" />
              </div>

              {/* Status Indicator */}
              <div className="sidebar-logo__status">
                <div className="sidebar-logo__status-pulse status-pulse-dot" />
              </div>
            </div>
          </div>

          {!collapsed && (
            <div className="sidebar-logo__text-wrapper">
              <div className="sidebar-logo__title-row">
                <h1 className="sidebar-logo__title">
                  Metro<span className="sidebar-logo__title-accent">ETL</span>
                </h1>
              </div>
              <div className="sidebar-logo__subtitle-row">
                <div className="sidebar-logo__subtitle-line" />
                <p className="sidebar-logo__subtitle">
                  Control Plane
                </p>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="sidebar-nav-label">
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
                      className="sidebar-nav-link"
                      activeClassName="sidebar-nav-link--active"
                    >
                      <div className="sidebar-nav-icon-wrapper">
                        <item.icon className="sidebar-nav-icon" />
                        {item.title === 'Pipelines' && isAnyDegraded && (
                          <span className="sidebar-degraded-dot">
                            <span className="sidebar-degraded-dot__ping"></span>
                            <span className="sidebar-degraded-dot__dot"></span>
                          </span>
                        )}
                      </div>
                      {!collapsed && <span className="sidebar-nav-label-text">{item.title}</span>}
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
          className="sidebar-train"
        />
      ))}
    </Sidebar>
  );
}
