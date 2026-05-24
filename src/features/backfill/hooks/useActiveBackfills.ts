/**
 * Local "active jobs" + "recent jobs" state.
 *
 * Today this is purely a UI-side simulation (the real backend would push
 * status updates). Extracted to its own hook so the page becomes layout-only.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import type { ActiveBackfill } from '../types';

const STARTING_JOB: ActiveBackfill = {
  id: 'bf-mock-1',
  pipelineId: 'pipeline-1',
  fromTime: '2024-01-01T00:00',
  toTime: '2024-01-31T23:59',
  status: 'running',
  startedAt: new Date().toISOString(),
};

export function useActiveBackfills() {
  const [active, setActive] = useState<ActiveBackfill[]>([STARTING_JOB]);
  const [recent, setRecent] = useState<ActiveBackfill[]>([]);

  const add = (job: Omit<ActiveBackfill, 'id' | 'startedAt' | 'status'>) => {
    setActive((prev) => [
      ...prev,
      { ...job, id: `bf-${Date.now()}`, status: 'running', startedAt: new Date().toISOString() },
    ]);
  };

  const stop = (id: string) => {
    setActive((prev) => prev.map((bf) => (bf.id === id ? { ...bf, status: 'stopping' } : bf)));
    toast.info('Initiated stop for backfill job');
    setTimeout(() => {
      setActive((prev) => {
        const stoppedJob = prev.find((bf) => bf.id === id);
        if (stoppedJob) {
          setRecent((rec) => [{ ...stoppedJob, status: 'stopping' as const }, ...rec].slice(0, 10));
        }
        return prev.filter((bf) => bf.id !== id);
      });
      toast.success('Backfill job stopped successfully');
    }, 2000);
  };

  return { active, recent, add, stop };
}
