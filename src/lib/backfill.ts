import type { BackfillRequest } from '@/types';

// Simulated latency
const delay = (ms = 800) => new Promise(r => setTimeout(r, ms + Math.random() * 400));

export const mockBackfillApi = {
    submit: async (request: BackfillRequest): Promise<{ success: boolean; requestId: string }> => {
        console.log('Submitting Broad Backfill Request:', request);

        // Simulate network delay according to project protocol
        await delay();

        // Logic: In a real app, this would trigger a background job
        return {
            success: true,
            requestId: `bf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        };
    }
};
