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
];

export function AppHeader() {
  const { theme, setTheme, envFilter, setEnvFilter } = useAppStore();

  return (
    <header className="h-12 flex items-center gap-3 px-3 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <div className="flex-1 flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search pipelines, owner groups..."
            className="h-8 pl-8 text-xs bg-surface-1 border-border"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">

        <Select value={envFilter} onValueChange={(v) => setEnvFilter(v as typeof envFilter)}>
          <SelectTrigger className="h-8 w-24 text-xs bg-surface-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Envs</SelectItem>
            <SelectItem value="prod">Prod</SelectItem>
            <SelectItem value="prep">Prep</SelectItem>
            <SelectItem value="dev">Dev</SelectItem>
          </SelectContent>
        </Select>

        <Select value={theme} onValueChange={(v) => setTheme(v as ThemeMode)}>
          <SelectTrigger className="h-8 w-32 text-xs bg-surface-1">
            <Monitor className="h-3.5 w-3.5 mr-1" />
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
