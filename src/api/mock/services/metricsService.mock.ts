import type { MetricSnapshot } from '@/types';
import { db } from '../db/store';
import { delay, newId } from '../utils';

export interface MetricListFilter {
  pipelineId?: string;
  type?: string;
}

export const metricsServiceMock = {
  async list(filter?: MetricListFilter): Promise<MetricSnapshot[]> {
    await delay();
    let result = [...db.metrics];
    if (filter?.pipelineId) result = result.filter((m) => m.pipelineId === filter.pipelineId);
    if (filter?.type) result = result.filter((m) => m.type === filter.type);
    return result;
  },

  /**
   * Append a metric snapshot. The mock keeps only the latest 200 per
   * (pipelineId, serviceId, type) bucket to prevent unbounded growth.
   */
  async append(data: Omit<MetricSnapshot, 'id'>): Promise<MetricSnapshot> {
    const metric: MetricSnapshot = { ...data, id: newId('m') };
    db.metrics.push(metric);

    const key = `${metric.pipelineId}_${metric.serviceId}_${metric.type}`;
    const grouped = db.metrics.filter((m) => `${m.pipelineId}_${m.serviceId}_${m.type}` === key);
    if (grouped.length > 200) {
      const toRemove = new Set(grouped.slice(0, grouped.length - 200).map((m) => m.id));
      db.metrics = db.metrics.filter((m) => !toRemove.has(m.id));
    }
    return metric;
  },
};
