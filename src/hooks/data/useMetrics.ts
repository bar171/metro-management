import { useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import type { MetricSnapshot, MetricType } from '@/types';

export function useMetrics() {
  const metrics = useAppStore((s) => s.metrics);
  const appendMetric = useAppStore((s) => s.appendMetric);
  const refreshMetrics = useAppStore((s) => s.refreshMetrics);

  /**
   * Latest metric of `type` for a (pipelineId, serviceId) pair.
   * Returns 0 when no point has been recorded yet — callers chart a flat line.
   */
  const getLatestForService = useCallback(
    (pipelineId: string, serviceId: string, type: MetricType): number => {
      const points = metrics.filter(
        (m) => m.pipelineId === pipelineId && m.serviceId === serviceId && m.type === type,
      );
      return points.length > 0 ? points[points.length - 1].value : 0;
    },
    [metrics],
  );

  /** Latest metric of `type` for a pipeline (across all its services), averaged. */
  const getLatestAvgForPipeline = useCallback(
    (pipelineId: string, type: MetricType): number => {
      const points = metrics.filter((m) => m.pipelineId === pipelineId && m.type === type);
      if (!points.length) return 0;
      // pick the most recent point per service, then average
      const latestPerService = new Map<string, number>();
      points.forEach((p) => latestPerService.set(p.serviceId, p.value));
      const values = Array.from(latestPerService.values());
      return values.reduce((a, b) => a + b, 0) / values.length;
    },
    [metrics],
  );

  return {
    metrics: metrics as MetricSnapshot[],
    appendMetric,
    refreshMetrics,
    getLatestForService,
    getLatestAvgForPipeline,
  };
}
