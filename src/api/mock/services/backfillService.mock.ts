import type { BackfillRequest } from '@/types';
import { delay, newId } from '../utils';

export interface BackfillSubmitResponse {
  success: boolean;
  requestId: string;
}

export const backfillServiceMock = {
  async submit(request: BackfillRequest): Promise<BackfillSubmitResponse> {
    // Simulate network delay according to project protocol
    await delay(800);
    // In a real app this would enqueue a background job.
    void request;
    return { success: true, requestId: newId('bf') };
  },
};
