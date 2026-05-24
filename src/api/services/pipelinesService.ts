import type { Pipeline } from '@/types';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { PipelineListFilter } from '../mock/services/pipelinesService.mock';

/**
 * Real backend implementation. Same signatures as the mock — consumers
 * are oblivious to which one they import (see `./index.ts`).
 *
 * Wire-format expectations live in `src/api/contracts.md`.
 */
export const pipelinesServiceReal = {
  list: (filter?: PipelineListFilter) =>
    apiClient.get<Pipeline[]>(endpoints.pipelines.list, { query: { environment: filter?.environment } }),

  getById: (id: string) => apiClient.get<Pipeline>(endpoints.pipelines.byId(id)),

  create: (data: Omit<Pipeline, 'id'>) => apiClient.post<Pipeline>(endpoints.pipelines.list, data),

  update: (id: string, data: Partial<Pipeline>) =>
    apiClient.patch<Pipeline>(endpoints.pipelines.byId(id), data),

  remove: (id: string) => apiClient.delete<void>(endpoints.pipelines.byId(id)),
};
