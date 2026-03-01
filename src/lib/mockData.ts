import type { Pipeline, Service, ResourceProfile, MetricSnapshot, LogEntry, Group } from '@/types';

const pipelineNames = ['Metro-pipeline', 'Rokak', 'Agamim', 'Logamrar', 'Navy', 'Horizon', 'Backfill'];

const serviceNames = ['push-data', 'kafka-consumer', 'scheduler', 'get-data', 'validation', 'python-validate', 'transform-data', 'external-transform', 'publish'];
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

let _id = 0;
const uid = () => `id_${++_id}`;

export function generateResourceProfiles(): ResourceProfile[] {
  return [
    { id: 'rp-1', cpuPerPod: '500m', memoryPerPod: '512Mi', maxReplicas: 6, autoscalingEnabled: true },
    { id: 'rp-2', cpuPerPod: '1000m', memoryPerPod: '1Gi', maxReplicas: 10, autoscalingEnabled: true },
    { id: 'rp-3', cpuPerPod: '2000m', memoryPerPod: '2Gi', maxReplicas: 16, autoscalingEnabled: true },
    { id: 'rp-4', cpuPerPod: '250m', memoryPerPod: '256Mi', maxReplicas: 4, autoscalingEnabled: false },
  ];
}

export function generatePipelines(): Pipeline[] {
  return pipelineNames.map((name, i) => {
    let type: Pipeline['type'] = 'BASIC';
    if (i === 1) type = 'STREAM';
    if (i === 6) type = 'BACKFILL';

    return {
      id: `pipeline-${i + 1}`,
      name: name,
      type,
      environment: i < 3 ? 'prod' as const : 'dev' as const,
      priority: i === 0 ? 'critical' as const : i < 3 ? 'high' as const : 'normal' as const,
      kafkaCluster: `kafka-cluster-${(i % 3) + 1}`,
      databaseInstance: `pg-instance-${(i % 2) + 1}`,
      resourceProfileId: `rp-${(i % 4) + 1}`,
      lastMessageAt: new Date(Date.now() - Math.floor(Math.random() * 600000)).toISOString(),
      totalCpuLimit: 2000 + Math.floor(Math.random() * 4) * 1000,
      totalMemoryLimit: 4096 + Math.floor(Math.random() * 4) * 1024
    };
  });
}



export function generateGroups(pipelines: Pipeline[]): Group[] {
  return groupNames.map((name, i) => ({
    id: `group-${i + 1}`,
    name,
    pipelineId: pipelines[i % pipelines.length].id,
    lastActive: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString()
  }));
}

export function generateServices(pipelines: Pipeline[]): Service[] {
  const services: Service[] = [];
  pipelines.forEach(pipeline => {
    const assignedServices = [...serviceNames];

    assignedServices.forEach(svcName => {
      const statuses: Service['status'][] = ['healthy', 'healthy', 'healthy', 'degraded', 'lagging'];
      services.push({
        id: uid(),
        name: svcName,
        pipelineId: pipeline.id,
        replicas: 2 + Math.floor(Math.random() * 4),
        cpuLimit: 250 + Math.floor(Math.random() * 4) * 250,
        memoryLimit: 256 + Math.floor(Math.random() * 4) * 256,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      });
    });
  });
  return services;
}

export function generateMetrics(pipelines: Pipeline[], services: Service[]): MetricSnapshot[] {
  const metrics: MetricSnapshot[] = [];
  const types: MetricSnapshot['type'][] = ['kafka_lag', 'throughput', 'cpu_usage', 'memory_usage', 'db_connections', 'error_rate'];
  const now = Date.now();
  pipelines.forEach(pipeline => {
    const pipeServices = services.filter(s => s.pipelineId === pipeline.id);
    pipeServices.forEach(svc => {
      types.forEach(type => {
        for (let i = 0; i < 20; i++) {
          let value: number;
          switch (type) {
            case 'kafka_lag': value = Math.floor(Math.random() * 15000); break;
            case 'throughput': value = 500 + Math.floor(Math.random() * 4500); break;
            case 'cpu_usage': value = 20 + Math.floor(Math.random() * 70); break;
            case 'memory_usage': value = 30 + Math.floor(Math.random() * 60); break;
            case 'db_connections': value = 10 + Math.floor(Math.random() * 90); break;
            case 'error_rate': value = Math.random() * 5; break;
          }
          metrics.push({
            id: uid(),
            pipelineId: pipeline.id,
            serviceId: svc.id,
            type,
            value: Math.round(value * 100) / 100,
            timestamp: new Date(now - (19 - i) * 15000).toISOString(),
          });
        }
      });
    });
  });
  return metrics;
}

export function generateLogs(pipelines: Pipeline[], services: Service[]): LogEntry[] {
  const logs: LogEntry[] = [];
  const now = Date.now();
  for (let i = 0; i < 80; i++) {
    const severity = (['info', 'info', 'info', 'warning', 'warning', 'critical'] as const)[Math.floor(Math.random() * 6)];
    const pipeline = pipelines[Math.floor(Math.random() * pipelines.length)];
    const pipelineServices = services.filter(s => s.pipelineId === pipeline.id);
    const service = pipelineServices[Math.floor(Math.random() * pipelineServices.length)];
    const msgs = logMessages[severity];
    logs.push({
      id: uid(),
      pipelineId: pipeline.id,
      serviceId: service?.id ?? '',
      severity,
      message: msgs[Math.floor(Math.random() * msgs.length)],
      timestamp: new Date(now - i * 30000 - Math.floor(Math.random() * 10000)).toISOString(),
    });
  }
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
