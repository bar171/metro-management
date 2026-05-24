import type { Service } from '@/types';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { ServiceListFilter } from '../mock/services/servicesService.mock';

export const servicesServiceReal = {
  list: (filter?: ServiceListFilter) =>
    apiClient.get<Service[]>(endpoints.services.list, { query: { pipelineId: filter?.pipelineId } }),

  getById: (id: string) => apiClient.get<Service>(endpoints.services.byId(id)),

  create: (data: Omit<Service, 'id'>) => apiClient.post<Service>(endpoints.services.list, data),

  update: (id: string, data: Partial<Service>) =>
    apiClient.patch<Service>(endpoints.services.byId(id), data),

  remove: (id: string) => apiClient.delete<void>(endpoints.services.byId(id)),
};
