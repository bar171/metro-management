/**
 * Filtering pipeline for the Services table.
 *
 * Was inlined in ResourcesPage. Extracted because the same combination
 * (search ∧ type ∧ pipeline ∧ name) is non-trivial and we want to
 * unit-test it without the page.
 */

import { useMemo } from 'react';
import { usePipelines } from '@/hooks/data/usePipelines';
import { useServices } from '@/hooks/data/useServices';
import type { Pipeline } from '@/types';
import type { ServiceTypeFilter } from '../components/ServiceFilters';
import type { ServiceRowItem } from '../components/ServiceRow';

export interface ServicesFilterState {
  search: string;
  serviceType: ServiceTypeFilter;
  pipelineId: string;
  serviceName: string;
}

export function useServicesFilter(state: ServicesFilterState): {
  rows: ServiceRowItem[];
  activePipelines: Pipeline[];
  uniqueServiceNames: string[];
} {
  const { pipelines, filteredByEnv } = usePipelines();
  const { services, uniqueServiceNames } = useServices();

  const rows = useMemo<ServiceRowItem[]>(() => {
    return services
      .map((s) => {
        const pipeline = pipelines.find((p) => p.id === s.pipelineId);
        return {
          id: s.id,
          name: s.name,
          pipelineId: s.pipelineId,
          pipelineName: s.pipelineId === 'global' ? 'Global Services' : (pipeline?.name ?? 'Unknown'),
          status: s.status,
          replicas: s.replicas,
          cpuLimit: s.cpuLimit,
          memoryLimit: s.memoryLimit,
        };
      })
      .filter((s) => {
        if (state.serviceType === 'pipeline' && (s.pipelineId === 'global' || s.name === 'scheduler')) return false;
        if (state.serviceType === 'global' && s.pipelineId !== 'global') return false;

        if (state.pipelineId !== 'all') {
          if (s.pipelineId !== state.pipelineId || s.name === 'scheduler') return false;
        }

        if (state.serviceName !== 'all' && s.name !== state.serviceName) return false;

        if (state.search) {
          const q = state.search.toLowerCase();
          return s.name.toLowerCase().includes(q) || s.pipelineName.toLowerCase().includes(q);
        }

        return true;
      });
  }, [services, pipelines, state.search, state.serviceType, state.pipelineId, state.serviceName]);

  return { rows, activePipelines: filteredByEnv, uniqueServiceNames };
}
