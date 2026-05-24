/**
 * Read-and-derive helpers for pipelines.
 *
 * Components should reach for THIS hook instead of using `useAppStore` directly
 * for pipeline-related concerns — gives us:
 *   - one place to compute `pipelineHealth(pipelineId)`
 *   - one place to filter by `envFilter`
 *   - primary / secondary split
 *
 * Mutations live in the store actions (`useAppStore`) and are re-exposed here
 * so a page only depends on this hook.
 */

import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import type { Pipeline, ServiceStatus } from '@/types';

export function usePipelines() {
  const pipelines = useAppStore((s) => s.pipelines);
  const services = useAppStore((s) => s.services);
  const envFilter = useAppStore((s) => s.envFilter);
  const loading = useAppStore((s) => s.loading);

  const createPipeline = useAppStore((s) => s.createPipeline);
  const updatePipeline = useAppStore((s) => s.updatePipeline);
  const updatePipelineResources = useAppStore((s) => s.updatePipelineResources);
  const deletePipeline = useAppStore((s) => s.deletePipeline);

  const getPipelineHealth = useCallback(
    (pipelineId: string): ServiceStatus => {
      const svcs = services.filter((s) => s.pipelineId === pipelineId);
      if (svcs.some((s) => s.status === 'lagging')) return 'lagging';
      if (svcs.some((s) => s.status === 'degraded')) return 'degraded';
      return 'healthy';
    },
    [services],
  );

  const filteredByEnv = useMemo<Pipeline[]>(() => {
    if (envFilter === 'all') return pipelines;
    return pipelines.filter((p) => p.environment === envFilter);
  }, [pipelines, envFilter]);

  const primaryPipelines = useMemo(() => pipelines.filter((p) => p.role === 'primary'), [pipelines]);
  const secondaryPipelines = useMemo(() => pipelines.filter((p) => p.role === 'secondary'), [pipelines]);

  return {
    pipelines,
    loading,
    filteredByEnv,
    primaryPipelines,
    secondaryPipelines,
    getPipelineHealth,
    createPipeline,
    updatePipeline,
    updatePipelineResources,
    deletePipeline,
  };
}
