/**
 * Background simulation: status flips, lastMessageAt ticks, kafka_lag spikes.
 *
 * Was a side-effect `setInterval` at the top of `src/lib/mockOrm.ts` — which:
 *   (a) ran on every module import (including tests)
 *   (b) could fire before `metricOrm` was defined (latent TDZ bug)
 *
 * It's now an explicit `start()` / `stop()` pair. The app bootstrap calls
 * `start()` exactly once when `apiConfig.useMock` is true, and never when
 * pointed at a real backend.
 */

import { metricsServiceMock } from '../services/metricsService.mock';
import { db } from './store';

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startMockSimulation(intervalMs = 3000): void {
  if (intervalId !== null) return;
  intervalId = setInterval(() => {
    // 1. Randomly flip a service status to "down" (degraded/lagging)
    if (Math.random() < 0.1 && db.services.length > 0) {
      const svc = db.services[Math.floor(Math.random() * db.services.length)];
      svc.status = Math.random() < 0.5 ? 'degraded' : 'lagging';
      // self-heal after some time
      setTimeout(
        () => {
          svc.status = 'healthy';
        },
        15000 + Math.random() * 30000,
      );
    }

    // 2. Update lastMessageAt for active pipelines
    db.pipelines.forEach((p) => {
      if (Math.random() < 0.3) {
        p.lastMessageAt = new Date().toISOString();
      }
    });

    // 3. Simulate Kafka lag spikes
    if (Math.random() < 0.5) {
      const p = db.pipelines[Math.floor(Math.random() * db.pipelines.length)];
      if (!p) return;
      const pServices = db.services.filter((s) => s.pipelineId === p.id);
      const svc = pServices[Math.floor(Math.random() * pServices.length)];
      if (svc) {
        const value = Math.random() > 0.5 ? 1000 : 1200 + Math.random() * 5000;
        // fire-and-forget — appendMetric is async only because of the simulated latency
        void metricsServiceMock.append({
          pipelineId: p.id,
          serviceId: svc.id,
          type: 'kafka_lag',
          value,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }, intervalMs);
}

export function stopMockSimulation(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
