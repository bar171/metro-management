/**
 * Read-and-derive helpers for services. Mirrors `usePipelines` in shape.
 */

import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import type { Service } from '@/types';

export function useServices() {
  const services = useAppStore((s) => s.services);
  const updateService = useAppStore((s) => s.updateService);

  const getServiceById = useCallback(
    (id: string): Service | undefined => services.find((s) => s.id === id),
    [services],
  );

  const getServicesForPipeline = useCallback(
    (pipelineId: string): Service[] => services.filter((s) => s.pipelineId === pipelineId),
    [services],
  );

  const uniqueServiceNames = useMemo(
    () => Array.from(new Set(services.map((s) => s.name))).sort(),
    [services],
  );

  return {
    services,
    updateService,
    getServiceById,
    getServicesForPipeline,
    uniqueServiceNames,
  };
}
