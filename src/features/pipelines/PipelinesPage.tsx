/**
 * Pipelines page (route: /pipelines).
 *
 * Was a 617-line monolith; now a thin layout that composes:
 *   - PipelineList         (left pane: search + status filter + pipeline rows)
 *   - PipelineDetail       (right pane: header + tabs)
 *     ├─ PipelineFlowDiagram   (the SVG of 9 service nodes + arrows)
 *     └─ GroupsTab             (associated owner groups)
 *
 * All shared computations route through `usePipelines` / `useGroups` /
 * `useServices` so this file owns no business logic anymore.
 */

import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Server } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { usePipelines } from '@/hooks/data/usePipelines';
import { useGroups } from '@/hooks/data/useGroups';
import { PipelineList } from './components/PipelineList';
import { PipelineDetail } from './components/PipelineDetail';
import type { Pipeline } from '@/types';
import './pipelines.css';

export default function PipelinesPage() {
  const { filteredByEnv, getPipelineHealth, createPipeline } = usePipelines();
  const { groups } = useGroups();
  const envFilter = useAppStore((s) => s.envFilter);
  const selectedPipelineId = useAppStore((s) => s.selectedPipelineId);
  const setSelectedPipelineId = useAppStore((s) => s.setSelectedPipelineId);

  // On first render, default-select "Metro-pipeline" (or the first pipeline).
  useEffect(() => {
    if (filteredByEnv.length === 0) return;
    if (selectedPipelineId && filteredByEnv.some((p) => p.id === selectedPipelineId)) return;
    const metro = filteredByEnv.find((p) => p.name.toLowerCase() === 'metro-pipeline');
    setSelectedPipelineId((metro ?? filteredByEnv[0]).id);
  }, [filteredByEnv, selectedPipelineId, setSelectedPipelineId]);

  const selected = filteredByEnv.find((p) => p.id === selectedPipelineId);
  const defaultEnvironment: Pipeline['environment'] = envFilter === 'all' ? 'dev' : envFilter;

  const handleCreate = async (data: { name: string; type: Pipeline['type'] }) => {
    await createPipeline({
      name: data.name,
      type: data.type,
      role: 'primary',
      environment: defaultEnvironment,
      priority: 'normal',
      kafkaCluster: 'new-cluster',
      databaseInstance: 'new-db',
      resourceProfileId: 'rp-1',
      totalCpuLimit: 4000,
      totalMemoryLimit: 8192,
    });
  };

  return (
    <div className="pipelines-page">
      <PipelineList
        pipelines={filteredByEnv}
        groups={groups}
        selectedId={selectedPipelineId}
        onSelect={setSelectedPipelineId}
        getHealth={getPipelineHealth}
        onCreate={handleCreate}
        defaultEnvironment={defaultEnvironment}
      />

      <div className="pipelines-page__detail">
        <div className="absolute inset-0 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {selected ? (
              <PipelineDetail key={selected.id} pipeline={selected} />
            ) : (
              <div className="pipelines-page__empty">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 border border-border/40 flex items-center justify-center mb-6 shadow-sm">
                  <Server className="pipelines-page__empty-icon" />
                </div>
                <h3 className="text-base font-bold text-foreground/80 tracking-tight">No Pipeline Selected</h3>
                <p className="text-xs text-muted-foreground max-w-[200px] mt-2 leading-relaxed">
                  Select an active pipeline from the registry to monitor its health and flow.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
