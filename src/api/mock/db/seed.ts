/**
 * Pure seed-data generators for the in-memory mock DB.
 *
 * No mutation, no IO, no side effects — these functions just *produce* arrays.
 * The store (`./store.ts`) owns the mutable arrays.
 *
 * (Moved from `src/lib/mockData.ts` with no behavior change.)
 */

import type { Pipeline, Service, ResourceProfile, MetricSnapshot, LogEntry, Group } from '@/types';
import { uid } from '../utils';

const pipelineNames = ['Metro-pipeline', 'Rokak', 'Agamim', 'Logmar', 'Navy', 'Horizon', 'Backfill', 'Excel'];

const groupNames = ['Jellyfish', 'Cargo', 'apps-of-the-lake', 'rokak', 'control', 'dot', 'fire-team', 'forceverse'];

const logMessages: Record<string, string[]> = {
  critical: [
    'OOMKilled: Container exceeded memory limit',
    'Kafka consumer group rebalance timeout',
    'Database connection pool exhausted',
    'Pod CrashLoopBackOff detected',
    'SSL certificate expiration imminent',
  ],
  warning: [
    'Consumer lag exceeding threshold (>10k)',
    'CPU throttling detected on pod',
    'Disk usage approaching 80% capacity',
    'Slow query detected (>5s execution time)',
    'Retry count exceeded for batch processing',
    'Memory usage at 87% - pressure warning',
  ],
  info: [
    'Deployment rollout completed successfully',
    'Auto-scaling triggered: 2 → 4 replicas',
    'Kafka topic partition rebalance complete',
    'Health check passed for all services',
    'Configuration reload triggered',
    'Batch processing completed: 45k records',
  ],
};

export function generateResourceProfiles(): ResourceProfile[] {
  return [
    { id: 'rp-1', cpuPerPod: '500m', memoryPerPod: '512Mi', maxReplicas: 6, autoscalingEnabled: true },
    { id: 'rp-2', cpuPerPod: '1000m', memoryPerPod: '1Gi', maxReplicas: 10, autoscalingEnabled: true },
    { id: 'rp-3', cpuPerPod: '2000m', memoryPerPod: '2Gi', maxReplicas: 16, autoscalingEnabled: true },
    { id: 'rp-4', cpuPerPod: '250m', memoryPerPod: '256Mi', maxReplicas: 4, autoscalingEnabled: false },
  ];
}

export function generatePipelines(): Pipeline[] {
  const secondaryNames = ['Backfill', 'Excel'];
  return pipelineNames.map((name, i) => {
    const isSecondary = secondaryNames.includes(name);
    let type: Pipeline['type'] = 'BASIC';
    if (name === 'Rokak') type = 'STREAM';
    if (name === 'Backfill') type = 'BACKFILL';

    return {
      id: `pipeline-${i + 1}`,
      name,
      type,
      role: isSecondary ? ('secondary' as const) : ('primary' as const),
      environment: name === 'Backfill' ? ('dev' as const) : name === 'Rokak' ? ('prep' as const) : ('prod' as const),
      priority: i === 0 ? ('critical' as const) : i < 3 ? ('high' as const) : ('normal' as const),
      kafkaCluster: `kafka-cluster-${(i % 3) + 1}`,
      databaseInstance: `pg-instance-${(i % 2) + 1}`,
      resourceProfileId: `rp-${(i % 4) + 1}`,
      lastMessageAt: new Date(Date.now() - Math.floor(Math.random() * 600000)).toISOString(),
      totalCpuLimit: 2000 + Math.floor(Math.random() * 4) * 1000,
      totalMemoryLimit: 4096 + Math.floor(Math.random() * 4) * 1024,
      activeIngress: (['push-data', 'kafka', 'scheduler'] as const)[Math.floor(Math.random() * 3)],
      dlqCount: Math.floor(Math.random() * 10) === 0 ? Math.floor(Math.random() * 500) : 0,
    };
  });
}

export function generateGroups(pipelines: Pipeline[]): Group[] {
  const primaryPipelines = pipelines.filter((p) => p.role === 'primary');
  const secondaryPipelines = pipelines.filter((p) => p.role === 'secondary');
  return groupNames.map((name, i) => ({
    id: `group-${i + 1}`,
    name,
    primaryPipelineId: primaryPipelines[i % primaryPipelines.length].id,
    secondaryPipelineIds:
      i % 3 === 0 && secondaryPipelines.length > 0
        ? [secondaryPipelines[i % secondaryPipelines.length].id]
        : [],
    etlDailyTransportMaxSizeGb: 15,
    etlBackfillLimitDays: null,
  }));
}

function stageOf(svcName: string): Service['stage'] {
  if (['push-data', 'kafka-consumer', 'scheduler'].includes(svcName)) return 'source';
  if (['get-data'].includes(svcName)) return 'get-data';
  if (['python-validate', 'informative-validation'].includes(svcName)) return 'python-validate';
  if (['transform-data', 'external-transform'].includes(svcName)) return 'transform';
  if (['publish', 'publish-storages', 'sink-data'].includes(svcName)) return 'sink';
  return 'support';
}

export function generateServices(pipelines: Pipeline[]): Service[] {
  const services: Service[] = [];

  const globalNames = ['scheduler', 'metronitor', 'pipeline-creator', 'metro-metrics'];
  globalNames.forEach((svcName) => {
    const statuses: Service['status'][] = [
      'healthy',
      'healthy',
      'healthy',
      'healthy',
      'healthy',
      'degraded',
      'lagging',
    ];
    services.push({
      id: uid(),
      name: svcName,
      pipelineId: 'global',
      replicas: svcName === 'scheduler' ? 1 : 1 + Math.floor(Math.random() * 3),
      cpuLimit: 250 + Math.floor(Math.random() * 2) * 250,
      memoryLimit: 256 + Math.floor(Math.random() * 2) * 256,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      stage: stageOf(svcName),
    });
  });

  const assignedServices = [
    'push-data',
    'kafka-consumer',
    'scheduler',
    'get-data',
    'python-validate',
    'informative-validation',
    'external-transform',
    'transform-data',
    'publish',
    'sink-data',
  ];

  pipelines.forEach((pipeline, idx) => {
    assignedServices.forEach((svcName) => {
      const statuses: Service['status'][] =
        idx === 0 ? ['healthy', 'healthy', 'healthy', 'degraded', 'lagging'] : ['healthy'];

      services.push({
        id: uid(),
        name: svcName,
        pipelineId: pipeline.id,
        replicas: svcName === 'scheduler' ? 1 : 2 + Math.floor(Math.random() * 4),
        cpuLimit: 250 + Math.floor(Math.random() * 4) * 250,
        memoryLimit: 256 + Math.floor(Math.random() * 4) * 256,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        stage: stageOf(svcName),
      });
    });
  });
  return services;
}

export function generateMetrics(pipelines: Pipeline[], services: Service[]): MetricSnapshot[] {
  const metrics: MetricSnapshot[] = [];
  const types: MetricSnapshot['type'][] = [
    'kafka_lag',
    'throughput',
    'cpu_usage',
    'memory_usage',
    'db_connections',
    'error_rate',
  ];
  const now = Date.now();
  services.forEach((svc) => {
    types.forEach((type) => {
      for (let i = 0; i < 20; i++) {
        let value: number;
        switch (type) {
          case 'kafka_lag':
            value = svc.status === 'lagging' ? 1500 + Math.floor(Math.random() * 500) : Math.floor(Math.random() * 300);
            break;
          case 'throughput':
            value = 500 + Math.floor(Math.random() * 4500);
            break;
          case 'cpu_usage':
            value = 20 + Math.floor(Math.random() * 70);
            break;
          case 'memory_usage':
            value = 30 + Math.floor(Math.random() * 60);
            break;
          case 'db_connections':
            value = 10 + Math.floor(Math.random() * 90);
            break;
          case 'error_rate':
            value = Math.random() * 5;
            break;
        }
        metrics.push({
          id: uid(),
          pipelineId: svc.pipelineId,
          serviceId: svc.id,
          type,
          value: Math.round(value * 100) / 100,
          timestamp: new Date(now - (19 - i) * 15000).toISOString(),
        });
      }
    });
  });
  return metrics;
}

export function generateLogs(_pipelines: Pipeline[], services: Service[]): LogEntry[] {
  const logs: LogEntry[] = [];
  const now = Date.now();
  for (let i = 0; i < 80; i++) {
    const severity = (['info', 'info', 'info', 'warning', 'warning', 'critical'] as const)[
      Math.floor(Math.random() * 6)
    ];
    const service = services[Math.floor(Math.random() * services.length)];
    const msgs = logMessages[severity];
    logs.push({
      id: uid(),
      pipelineId: service.pipelineId,
      serviceId: service.id,
      severity,
      message: msgs[Math.floor(Math.random() * msgs.length)],
      timestamp: new Date(now - i * 30000 - Math.floor(Math.random() * 10000)).toISOString(),
    });
  }
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateBlacklist() {
  return [
    {
      id: 'bl-1',
      pipelineId: 'pipeline-1',
      targetType: 'source' as const,
      targetValue: 'metro-pipeline:kafka-consumer:source:550e8400-e29b-41d4-a716-446655440000',
      reason: 'Upstream data corruption detected',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      active: true,
    },
    {
      id: 'bl-2',
      pipelineId: 'pipeline-2',
      targetType: 'destination' as const,
      targetValue: 'rokak:publish:kafka:123e4567-e89b-12d3-a456-426614174000',
      reason: 'Database maintenance window',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      active: false,
    },
    {
      id: 'bl-3',
      pipelineId: 'all',
      targetType: 'broker' as const,
      targetValue: 'kafka-broker-01.metro.svc:9092',
      reason: 'Broker hardware failure isolation',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      active: true,
    },
  ];
}
