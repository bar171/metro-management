import type { MetricType } from '@/types';

export interface MetricConfig {
  type: MetricType;
  label: string;
  color: string;
  unit: string;
}

/** The four metrics charted on the Metrics page, in render order. */
export const METRIC_CONFIGS: MetricConfig[] = [
  { type: 'kafka_lag', label: 'Kafka Consumer Lag', color: 'hsl(210, 100%, 55%)', unit: 'msgs' },
  { type: 'throughput', label: 'Throughput', color: 'hsl(172, 66%, 50%)', unit: 'msg/s' },
  { type: 'cpu_usage', label: 'CPU Usage', color: 'hsl(38, 92%, 50%)', unit: '%' },
  { type: 'memory_usage', label: 'Memory Usage', color: 'hsl(0, 72%, 51%)', unit: '%' },
];

/** Metric types whose values are summed (rather than averaged) when aggregating across services. */
export const SUM_METRIC_TYPES = new Set<MetricType>(['throughput', 'db_connections', 'kafka_lag']);
