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

export interface Axis {
  id: string;
  name: string;
  environment: Environment;
  priority: Priority;
  kafkaCluster: string;
  databaseInstance: string;
  resourceProfileId: string;
}

export interface Customer {
  id: string;
  name: string;
  dataVolumeLevel: 'low' | 'medium' | 'high';
  streamCriticality: 'standard' | 'elevated' | 'critical';
  axisId: string;
}

export interface Service {
  id: string;
  name: string;
  axisId: string;
  replicas: number;
  cpuLimit: string;
  memoryLimit: string;
  status: ServiceStatus;
}

export interface MetricSnapshot {
  id: string;
  axisId: string;
  type: MetricType;
  value: number;
  timestamp: string;
}

export interface LogEntry {
  id: string;
  axisId: string;
  serviceId: string;
  severity: Severity;
  message: string;
  timestamp: string;
}
