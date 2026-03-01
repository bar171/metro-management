export type Environment = 'prod' | 'dev';
export type Priority = 'normal' | 'high' | 'critical';
export type ServiceStatus = 'healthy' | 'degraded' | 'lagging';
export type Severity = 'critical' | 'warning' | 'info';
export type MetricType = 'kafka_lag' | 'throughput' | 'cpu_usage' | 'memory_usage' | 'db_connections' | 'error_rate';
export type ThemeMode = 'light' | 'dark' | 'midnight' | 'cyberpunk';

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
}



export interface Service {
  id: string;
  name: string;
  pipelineId: string;
  replicas: number;
  cpuLimit: number; // storing millicores natively (e.g. 500)
  memoryLimit: number; // storing MiB natively (e.g. 1024)
  status: ServiceStatus;
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
