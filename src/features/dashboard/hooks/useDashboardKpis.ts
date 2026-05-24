/**
 * Derives the 4 KPI numbers shown at the top of the dashboard:
 *   - total pods (sum of replicas across services in env-filtered pipelines)
 *   - avg kafka lag (per-pipeline latest, averaged)
 *   - total db connections (per-pipeline latest, summed)
 *
 * Lives here (not inline in the page) so the page becomes purely
 * compositional and the math is testable in isolation.
 */

import { useMemo } from 'react';
import { useMetrics } from '@/hooks/data/useMetrics';
import { useServices } from '@/hooks/data/useServices';
import { usePipelines } from '@/hooks/data/usePipelines';

export function useDashboardKpis() {
  const { pipelines, filteredByEnv } = usePipelines();
  const { services } = useServices();
  const { metrics } = useMetrics();

  const totalPods = useMemo(
    () =>
      services
        .filter((s) => filteredByEnv.some((p) => p.id === s.pipelineId))
        .reduce((sum, s) => sum + s.replicas, 0),
    [services, filteredByEnv],
  );

  const avgKafkaLag = useMemo(() => {
    const lagMetrics = metrics.filter(
      (m) => m.type === 'kafka_lag' && filteredByEnv.some((p) => p.id === m.pipelineId),
    );
    if (!lagMetrics.length) return 0;
    const latest = new Map<string, number>();
    lagMetrics.forEach((m) => latest.set(m.pipelineId, m.value));
    const values = Array.from(latest.values());
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [metrics, filteredByEnv]);

  const dbConnections = useMemo(() => {
    const dbMetrics = metrics.filter((m) => m.type === 'db_connections');
    if (!dbMetrics.length) return 0;
    const latest = new Map<string, number>();
    dbMetrics.forEach((m) => latest.set(m.pipelineId, m.value));
    return Array.from(latest.values()).reduce((a, b) => a + b, 0);
  }, [metrics]);

  return { pipelines, filteredByEnv, totalPods, avgKafkaLag, dbConnections };
}
