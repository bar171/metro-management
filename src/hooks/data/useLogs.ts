import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import type { LogEntry } from '@/types';

export function useLogs() {
  const logs = useAppStore((s) => s.logs);
  const appendLog = useAppStore((s) => s.appendLog);
  const refreshLogs = useAppStore((s) => s.refreshLogs);

  /** Non-info logs, newest first, capped at 15 — same shape Dashboard's live feed needs. */
  const criticalLogs = useMemo<LogEntry[]>(
    () => logs.filter((l) => l.severity !== 'info').slice(0, 15),
    [logs],
  );

  return { logs, criticalLogs, appendLog, refreshLogs };
}
