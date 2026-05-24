import { delay } from '../utils';

export interface ClusterMetrics {
  cpu: { total: number; used: number };
  memory: { total: number; used: number };
  nodes: number;
  healthyNodes: number;
}

/**
 * Simulated OpenShift cluster snapshot.
 * (Moved from `src/lib/openshift.ts`. Numbers + jitter preserved.)
 */
export const clusterServiceMock = {
  async getMetrics(): Promise<ClusterMetrics> {
    await delay(600);
    return {
      cpu: {
        total: 16000, // 16 cores in millicores
        used: 6400 + Math.floor(Math.random() * 2000),
      },
      memory: {
        total: 65536, // 64GB in MiB
        used: 32000 + Math.floor(Math.random() * 5000),
      },
      nodes: 3,
      healthyNodes: 3,
    };
  },
};
