import type { BackfillRequest } from '@/types';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { BackfillSubmitResponse } from '../mock/services/backfillService.mock';

export const backfillServiceReal = {
  submit: (request: BackfillRequest) =>
    apiClient.post<BackfillSubmitResponse>(endpoints.backfill.submit, request),
};
