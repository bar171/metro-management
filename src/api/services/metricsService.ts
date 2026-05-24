import type { MetricSnapshot } from '@/types';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { MetricListFilter } from '../mock/services/metricsService.mock';

export const metricsServiceReal = {
  list: (filter?: MetricListFilter) =>
    apiClient.get<MetricSnapshot[]>(endpoints.metrics.list, {
      query: { pipelineId: filter?.pipelineId, type: filter?.type },
    }),

  append: (data: Omit<MetricSnapshot, 'id'>) =>
    apiClient.post<MetricSnapshot>(endpoints.metrics.list, data),
};
