/**
 * Backfill Manager — 773-line monolith → ~80-line composition.
 *
 * Composed of:
 *   - TriggerBackfillDialog       (the "Trigger Broad Backfill" button + form)
 *   - ActiveBackfillsTable        (running jobs + recently stopped jobs)
 *   - GroupLimitsPanel            (per-pipeline accordion of group ETL limits)
 *   - RegisteredSourcesPanel      (sources opted in to broad backfills + register dialog)
 */

import { Database } from 'lucide-react';
import { useBackfill } from '@/hooks/data/useBackfill';
import { useGroups } from '@/hooks/data/useGroups';
import { usePipelines } from '@/hooks/data/usePipelines';
import { useServices } from '@/hooks/data/useServices';
import { TriggerBackfillDialog } from './components/TriggerBackfillDialog';
import { ActiveBackfillsTable } from './components/ActiveBackfillsTable';
import { GroupLimitsPanel } from './components/GroupLimitsPanel';
import { RegisteredSourcesPanel } from './components/RegisteredSourcesPanel';
import { useActiveBackfills } from './hooks/useActiveBackfills';
import './backfill.css';

export default function BackfillPage() {
  const { pipelines } = usePipelines();
  const { services, updateService } = useServices();
  const { groups, updateGroup } = useGroups();
  const { submit } = useBackfill();
  const { active, recent, add, stop } = useActiveBackfills();

  const handleTrigger = async (data: { pipelineId: string; fromTime: string; toTime: string; deltaMs: number; queryIntervalMs: number }) => {
    await submit({
      fromTime: data.fromTime,
      toTime: data.toTime,
      deltaMs: data.deltaMs,
      queryIntervalMs: data.queryIntervalMs,
    });
    add({
      pipelineId: data.pipelineId,
      fromTime: data.fromTime,
      toTime: data.toTime,
    });
  };

  return (
    <div className="backfill-page">
      <div className="backfill-page__header">
        <div>
          <h1 className="backfill-page__title">
            <Database className="backfill-page__title-icon" />
            Backfill Manager
          </h1>
          <p className="backfill-page__description">
            Trigger broad backfills, manage running jobs, and adjust ETL limits across groups.
          </p>
        </div>
        <TriggerBackfillDialog pipelines={pipelines} onSubmit={handleTrigger} />
      </div>

      <div className="backfill-page__grid">
        <ActiveBackfillsTable active={active} recent={recent} pipelines={pipelines} onStop={stop} />
        <GroupLimitsPanel pipelines={pipelines} groups={groups} onUpdateGroup={updateGroup} />
      </div>

      <RegisteredSourcesPanel
        pipelines={pipelines}
        services={services}
        groups={groups}
        onUpdateService={updateService}
      />
    </div>
  );
}
