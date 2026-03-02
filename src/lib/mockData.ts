import type { Pipeline, Service, ResourceProfile, MetricSnapshot, LogEntry, Group } from '@/types';

const pipelineNames = ['Metro-pipeline', 'Rokak', 'Agamim', 'Logmar', 'Navy', 'Horizon', 'Backfill', 'Excel'];

const serviceNames = [
  'push-data', 'kafka-consumer', 'scheduler',
  'get-data', 'python-validate', 'informative-validation', 'external-transform', 'transform-data',
  'publish', 'sink-data',
  'metronitor', 'pipeline-creator', 'metro-metrics'
];
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
  const secondaryNames = ['Backfill', 'Excel'];
  return pipelineNames.map((name, i) => {
    const isSecondary = secondaryNames.includes(name);
    let type: Pipeline['type'] = 'BASIC';
    if (name === 'Rokak') type = 'STREAM';
    if (name === 'Backfill') type = 'BACKFILL';

    return {
      id: `pipeline-${i + 1}`,
      name: name,
      type,
      role: isSecondary ? 'secondary' as const : 'primary' as const,
      environment: name === 'Backfill' ? 'dev' as const : name === 'Rokak' ? 'prep' as const : 'prod' as const,
      priority: i === 0 ? 'critical' as const : i < 3 ? 'high' as const : 'normal' as const,
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
  const primaryPipelines = pipelines.filter(p => p.role === 'primary');
  const secondaryPipelines = pipelines.filter(p => p.role === 'secondary');
  return groupNames.map((name, i) => ({
    id: `group-${i + 1}`,
    name,
    primaryPipelineId: primaryPipelines[i % primaryPipelines.length].id,
    secondaryPipelineIds: i % 3 === 0 && secondaryPipelines.length > 0
      ? [secondaryPipelines[i % secondaryPipelines.length].id]
      : [],
    lastActive: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString()
  }));
}

export function generateServices(pipelines: Pipeline[]): Service[] {
  const services: Service[] = [];

  const globalNames = ['scheduler', 'metronitor', 'pipeline-creator', 'metro-metrics'];
  globalNames.forEach(svcName => {
    let stage: Service['stage'] = 'support';
    if (['push-data', 'kafka-consumer', 'scheduler'].includes(svcName)) stage = 'source';
    else if (['get-data'].includes(svcName)) stage = 'get-data';
    else if (['python-validate', 'informative-validation'].includes(svcName)) stage = 'python-validate';
    else if (['transform-data', 'external-transform'].includes(svcName)) stage = 'transform';
    else if (['publish', 'publish-storages', 'sink-data'].includes(svcName)) stage = 'sink';

    const statuses: Service['status'][] = ['healthy', 'healthy', 'healthy', 'healthy', 'healthy', 'degraded', 'lagging'];
    services.push({
      id: uid(),
      name: svcName,
      pipelineId: 'global',
      replicas: svcName === 'scheduler' ? 1 : 1 + Math.floor(Math.random() * 3),
      cpuLimit: 250 + Math.floor(Math.random() * 2) * 250,
      memoryLimit: 256 + Math.floor(Math.random() * 2) * 256,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      stage
    });
  });

  pipelines.forEach((pipeline, idx) => {
    const hasTransform = idx % 2 === 0;
    const assignedServices = [
      'push-data', 'kafka-consumer', 'scheduler',
      'get-data', 'python-validate', 'informative-validation',
      'external-transform', 'transform-data',
      'publish', 'sink-data'
    ];

    assignedServices.forEach(svcName => {
      let stage: Service['stage'] = 'support';
      if (['push-data', 'kafka-consumer', 'scheduler'].includes(svcName)) stage = 'source';
      else if (['get-data'].includes(svcName)) stage = 'get-data';
      else if (['python-validate', 'informative-validation'].includes(svcName)) stage = 'python-validate';
      else if (['transform-data', 'external-transform'].includes(svcName)) stage = 'transform';
      else if (['publish', 'publish-storages', 'sink-data'].includes(svcName)) stage = 'sink';

      const statuses: Service['status'][] = idx === 0
        ? ['healthy', 'healthy', 'healthy', 'degraded', 'lagging']
        : ['healthy'];

      services.push({
        id: uid(),
        name: svcName,
        pipelineId: pipeline.id,
        replicas: svcName === 'scheduler' ? 1 : 2 + Math.floor(Math.random() * 4),
        cpuLimit: 250 + Math.floor(Math.random() * 4) * 250,
        memoryLimit: 256 + Math.floor(Math.random() * 4) * 256,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        stage
      });
    });
  });
  return services;
}

export function generateMetrics(pipelines: Pipeline[], services: Service[]): MetricSnapshot[] {
  const metrics: MetricSnapshot[] = [];
  const types: MetricSnapshot['type'][] = ['kafka_lag', 'throughput', 'cpu_usage', 'memory_usage', 'db_connections', 'error_rate'];
  const now = Date.now();
  services.forEach(svc => {
    types.forEach(type => {
      for (let i = 0; i < 20; i++) {
        let value: number;
        switch (type) {
          case 'kafka_lag': value = svc.status === 'lagging' ? 300 + Math.floor(Math.random() * 700) : Math.floor(Math.random() * 50); break;
          case 'throughput': value = 500 + Math.floor(Math.random() * 4500); break;
          case 'cpu_usage': value = 20 + Math.floor(Math.random() * 70); break;
          case 'memory_usage': value = 30 + Math.floor(Math.random() * 60); break;
          case 'db_connections': value = 10 + Math.floor(Math.random() * 90); break;
          case 'error_rate': value = Math.random() * 5; break;
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

export function generateLogs(pipelines: Pipeline[], services: Service[]): LogEntry[] {
  const logs: LogEntry[] = [];
  const now = Date.now();
  for (let i = 0; i < 80; i++) {
    const severity = (['info', 'info', 'info', 'warning', 'warning', 'critical'] as const)[Math.floor(Math.random() * 6)];
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
