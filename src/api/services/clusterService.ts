import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { ClusterMetrics } from '../mock/services/clusterService.mock';

export const clusterServiceReal = {
  getMetrics: () => apiClient.get<ClusterMetrics>(endpoints.cluster.metrics),
};
