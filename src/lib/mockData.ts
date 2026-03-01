import type { Axis, Customer, Service, ResourceProfile, MetricSnapshot, LogEntry } from '@/types';

const axisNames = ['Metro-pipeline', 'Rokak', 'Agamim', 'Logamrar', 'Navy'];
const customerNames = ['Acme Corp', 'Globex Industries', 'Initech', 'Umbrella Inc', 'Cyberdyne Systems', 'Stark Industries', 'Wayne Enterprises', 'Oscorp', 'LexCorp', 'Aperture Science', 'Massive Dynamic', 'Soylent Corp'];
const serviceNames = ['ingestor', 'transformer', 'enricher', 'validator', 'router', 'aggregator', 'publisher', 'archiver'];
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

export function generateAxes(): Axis[] {
  return axisNames.map((name, i) => ({
    id: `axis-${i + 1}`,
    name: name,
    environment: i < 3 ? 'prod' as const : 'dev' as const,
    priority: i === 0 ? 'critical' as const : i < 3 ? 'high' as const : 'normal' as const,
    kafkaCluster: `kafka-cluster-${(i % 3) + 1}`,
    databaseInstance: `pg-instance-${(i % 2) + 1}`,
    resourceProfileId: `rp-${(i % 4) + 1}`,
  }));
}

export function generateCustomers(axes: Axis[]): Customer[] {
  return customerNames.map((name, i) => ({
    id: `cust-${i + 1}`,
    name,
    dataVolumeLevel: (['low', 'medium', 'high'] as const)[i % 3],
    streamCriticality: (['standard', 'elevated', 'critical'] as const)[i % 3],
    axisId: axes[i % axes.length].id,
  }));
}

export function generateServices(axes: Axis[]): Service[] {
  const services: Service[] = [];
  axes.forEach(axis => {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const statuses: Service['status'][] = ['healthy', 'healthy', 'healthy', 'degraded', 'lagging'];
      services.push({
        id: uid(),
        name: serviceNames[i % serviceNames.length],
        axisId: axis.id,
        replicas: 2 + Math.floor(Math.random() * 4),
        cpuLimit: `${250 + Math.floor(Math.random() * 4) * 250}m`,
        memoryLimit: `${256 + Math.floor(Math.random() * 4) * 256}Mi`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      });
    }
  });
  return services;
}

export function generateMetrics(axes: Axis[]): MetricSnapshot[] {
  const metrics: MetricSnapshot[] = [];
  const types: MetricSnapshot['type'][] = ['kafka_lag', 'throughput', 'cpu_usage', 'memory_usage', 'db_connections', 'error_rate'];
  const now = Date.now();
  axes.forEach(axis => {
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
          axisId: axis.id,
          type,
          value: Math.round(value * 100) / 100,
          timestamp: new Date(now - (19 - i) * 15000).toISOString(),
        });
      }
    });
  });
  return metrics;
}

export function generateLogs(axes: Axis[], services: Service[]): LogEntry[] {
  const logs: LogEntry[] = [];
  const now = Date.now();
  for (let i = 0; i < 80; i++) {
    const severity = (['info', 'info', 'info', 'warning', 'warning', 'critical'] as const)[Math.floor(Math.random() * 6)];
    const axis = axes[Math.floor(Math.random() * axes.length)];
    const axisServices = services.filter(s => s.axisId === axis.id);
    const service = axisServices[Math.floor(Math.random() * axisServices.length)];
    const msgs = logMessages[severity];
    logs.push({
      id: uid(),
      axisId: axis.id,
      serviceId: service?.id ?? '',
      severity,
      message: msgs[Math.floor(Math.random() * msgs.length)],
      timestamp: new Date(now - i * 30000 - Math.floor(Math.random() * 10000)).toISOString(),
    });
  }
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
