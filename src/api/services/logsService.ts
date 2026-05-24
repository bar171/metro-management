import type { LogEntry } from '@/types';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { LogListFilter } from '../mock/services/logsService.mock';

export const logsServiceReal = {
  list: (filter?: LogListFilter) =>
    apiClient.get<LogEntry[]>(endpoints.logs.list, {
      query: {
        pipelineId: filter?.pipelineId,
        serviceId: filter?.serviceId,
        severity: filter?.severity,
        limit: filter?.limit,
      },
    }),

  append: (data: Omit<LogEntry, 'id'>) => apiClient.post<LogEntry>(endpoints.logs.list, data),
};
