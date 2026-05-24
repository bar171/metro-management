/**
 * Live-data emitter for the Metrics page.
 *
 * Was the giant `useEffect` block at the top of MetricsPage. Extracted so:
 *   - the page is presentational again
 *   - the simulation lives next to the chart logic it feeds
 *   - we can swap it for a real WebSocket / polling source later without touching the page
 *
 * Triggers every `METRICS_POLL_INTERVAL_MS` ms and pushes a random snapshot
 * per (pipeline × service × metric) into the service layer, then refreshes the
 * page's view of metrics from the store.
 *
 * NOTE: when the app is wired against a real backend that emits its own metrics,
 * this loop should be disabled — but for parity with current behavior, today
 * it runs unconditionally (mock-only build). When `USE_MOCK=false` is wired
 * end-to-end we will guard with `apiConfig.useMock`.
 */

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useMetrics } from '@/hooks/data/useMetrics';
import { usePipelines } from '@/hooks/data/usePipelines';
import { useServices } from '@/hooks/data/useServices';
import { METRICS_POLL_INTERVAL_MS } from '@/config/constants';
import { METRIC_CONFIGS } from '../config';

export function useLiveMetricsSimulator(pipelineFilter: string, serviceFilter: string) {
  const { pipelines } = usePipelines();
  const { services } = useServices();
  const { appendMetric, refreshMetrics } = useMetrics();

  useEffect(() => {
    const interval = setInterval(async () => {
      const targetPipelines = pipelineFilter === 'all' ? pipelines : pipelines.filter((p) => p.id === pipelineFilter);
      for (const pipeline of targetPipelines) {
        const pipeServices = services.filter((s) => s.pipelineId === pipeline.id);
        const targetServices = serviceFilter === 'all' ? pipeServices : pipeServices.filter((s) => s.id === serviceFilter);

        for (const svc of targetServices) {
          for (const mc of METRIC_CONFIGS) {
            let value: number;
            switch (mc.type) {
              case 'kafka_lag':
                value = Math.floor(Math.random() * 15000);
                break;
              case 'throughput':
                value = 500 + Math.floor(Math.random() * 4500);
                break;
              case 'cpu_usage':
                value = 20 + Math.floor(Math.random() * 70);
                break;
              case 'memory_usage':
                value = 30 + Math.floor(Math.random() * 60);
                break;
              default:
                value = 0;
            }
            await appendMetric({
              pipelineId: pipeline.id,
              serviceId: svc.id,
              type: mc.type,
              value: Math.round(value * 100) / 100,
              timestamp: new Date().toISOString(),
            });

            if (mc.type === 'memory_usage' && value > 85) {
              toast.warning(`Memory Pressure on ${svc.name}`, {
                description: `Memory at ${Math.round(value)}% in Pipeline ${pipeline.name}`,
              });
            }
          }
        }
      }
      await refreshMetrics();
    }, METRICS_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pipelines, services, pipelineFilter, serviceFilter, appendMetric, refreshMetrics]);
}
