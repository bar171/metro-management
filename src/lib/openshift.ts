export interface ClusterMetrics {
    cpu: {
        total: number;
        used: number;
    };
    memory: {
        total: number;
        used: number;
    };
    nodes: number;
    healthyNodes: number;
}

// Simulated OpenShift API response
export const mockOpenShiftApi = {
    getClusterMetrics: async (): Promise<ClusterMetrics> => {
        // Simulate network delay
        await new Promise(r => setTimeout(r, 600));

        // Simulate 16 core, 64GB cluster
        return {
            cpu: {
                total: 16000, // 16 cores in millicores
                used: 6400 + Math.floor(Math.random() * 2000), // fluctuate around 40-50%
            },
            memory: {
                total: 65536, // 64GB in MiB
                used: 32000 + Math.floor(Math.random() * 5000), // fluctuate around 50%
            },
            nodes: 3,
            healthyNodes: 3,
        };
    }
};
