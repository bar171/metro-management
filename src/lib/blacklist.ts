import type { BlacklistEntry } from '@/types';

// Simulated latency
const delay = (ms = 100) => new Promise(r => setTimeout(r, ms + Math.random() * 50));

let mockEntries: BlacklistEntry[] = [
    {
        id: 'bl-1',
        pipelineId: 'pipeline-1',
        targetType: 'source',
        targetValue: 'metro-pipeline:kafka-consumer:source:550e8400-e29b-41d4-a716-446655440000',
        reason: 'Upstream data corruption detected',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        active: true
    },
    {
        id: 'bl-2',
        pipelineId: 'pipeline-2',
        targetType: 'destination',
        targetValue: 'rokak:publish:kafka:123e4567-e89b-12d3-a456-426614174000',
        reason: 'Database maintenance window',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        active: false
    },
    {
        id: 'bl-3',
        pipelineId: 'all',
        targetType: 'broker',
        targetValue: 'kafka-broker-01.metro.svc:9092',
        reason: 'Broker hardware failure isolation',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        active: true
    }
];

export const mockBlacklistApi = {
    fetchEntries: async (): Promise<BlacklistEntry[]> => {
        await delay();
        return [...mockEntries];
    },

    addEntry: async (data: Omit<BlacklistEntry, 'id' | 'createdAt' | 'active'>): Promise<BlacklistEntry> => {
        await delay(200);
        const newEntry: BlacklistEntry = {
            ...data,
            id: `bl-${Date.now()}`,
            createdAt: new Date().toISOString(),
            active: true
        };
        mockEntries.unshift(newEntry);
        return newEntry;
    },

    toggleEntry: async (id: string): Promise<BlacklistEntry> => {
        await delay(150);
        const entry = mockEntries.find(e => e.id === id);
        if (!entry) throw new Error('Entry not found');
        entry.active = !entry.active;
        return { ...entry };
    },

    deleteEntry: async (id: string): Promise<void> => {
        await delay(100);
        mockEntries = mockEntries.filter(e => e.id !== id);
    }
};
