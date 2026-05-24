import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppStore } from '@/stores/useAppStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Monitor, Database } from 'lucide-react';
import { useMemo } from 'react';
import type { ThemeMode } from '@/types';

const themes: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'midnight', label: 'Midnight Blue' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'rose', label: 'Rose Gold' },
  { value: 'forest', label: 'Forest Green' },
];

const envColorClass: Record<string, string> = {
  dev: 'app-header--dev',
  prep: 'app-header--prep',
  prod: 'app-header--prod',
};

export function AppHeader() {
  const { theme, setTheme, envFilter, setEnvFilter } = useAppStore();

  return (
    <header className={`app-header ${envColorClass[envFilter] || ''}`}>
      <SidebarTrigger className="app-header__sidebar-trigger" />

      <div className="app-header__spacer" />

      <div className="app-header__controls">

        <Select value={envFilter} onValueChange={(v) => setEnvFilter(v as typeof envFilter)}>
          <SelectTrigger className="app-header__env-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dev">Dev</SelectItem>
            <SelectItem value="prep">Prep</SelectItem>
            <SelectItem value="prod">Prod</SelectItem>
          </SelectContent>
        </Select>

        <Select value={theme} onValueChange={(v) => setTheme(v as ThemeMode)}>
          <SelectTrigger className="app-header__theme-trigger">
            <Monitor className="app-header__theme-icon" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {themes.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
