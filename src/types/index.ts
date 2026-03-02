export type Environment = 'prod' | 'prep' | 'dev';
export type Priority = 'normal' | 'high' | 'critical';
export type ServiceStatus = 'healthy' | 'degraded' | 'lagging';
export type Severity = 'critical' | 'warning' | 'info';
export type MetricType = 'kafka_lag' | 'throughput' | 'cpu_usage' | 'memory_usage' | 'db_connections' | 'error_rate' | 'pending_tasks';
export type ThemeMode = 'light' | 'dark' | 'midnight' | 'cyberpunk' | 'rose' | 'forest';

export interface ResourceProfile {
  id: string;
  cpuPerPod: string;
  memoryPerPod: string;
  maxReplicas: number;
  autoscalingEnabled: boolean;
}

export interface Group {
  id: string;
  name: string;
  pipelineId: string;
  lastActive: string;
}

export type PipelineType = 'BASIC' | 'STREAM' | 'BACKFILL';

export interface Pipeline {
  id: string;
  name: string;
  type: PipelineType;
  environment: Environment;
  priority: Priority;
  kafkaCluster: string;
  databaseInstance: string;
  resourceProfileId: string;
  lastMessageAt?: string;
  totalCpuLimit: number;
  totalMemoryLimit: number;
  activeIngress?: 'push-data' | 'kafka' | 'scheduler';
  dlqCount?: number;
}



export interface Service {
  id: string;
  name: string;
  pipelineId: string;
  replicas: number;
  cpuLimit: number; // storing millicores natively (e.g. 500)
  memoryLimit: number; // storing MiB natively (e.g. 1024)
  status: ServiceStatus;
  stage?: 'source' | 'get-data' | 'python-validate' | 'transform' | 'sink' | 'support';
}

export interface MetricSnapshot {
  id: string;
  pipelineId: string;
  serviceId: string;
  type: MetricType;
  value: number;
  timestamp: string;
}

export interface LogEntry {
  id: string;
  pipelineId: string;
  serviceId: string;
  severity: Severity;
  message: string;
  timestamp: string;
}

export interface BackfillRequest {
  fromTime: string;
  toTime: string;
  deltaMs: number;
  queryIntervalMs: number;
}

export interface BlacklistEntry {
  id: string;
  pipelineId: string;
  targetType: 'source' | 'destination' | 'broker' | 'pipeline';
  targetValue: string; // sourceId, destinationId (with type prefix), or broker address
  reason: string;
  createdAt: string;
  active: boolean;
}
