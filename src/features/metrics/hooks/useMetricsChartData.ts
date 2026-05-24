/**
 * Turns raw metric points into chart-ready aggregated buckets.
 *
 * - Buckets timestamps to nearest 5 seconds (`HH:MM:ss` rounded down to /5).
 * - Sum-types are summed; everything else is averaged.
 * - Caps at the latest 20 buckets so the chart stays readable.
 */

import { useCallback } from 'react';
import { useMetrics } from '@/hooks/data/useMetrics';
import type { MetricType } from '@/types';
import { SUM_METRIC_TYPES } from '../config';

export interface ChartPoint {
  time: string;
  value: number;
}

export function useMetricsChartData(pipelineFilter: string, serviceFilter: string) {
  const { metrics } = useMetrics();

  return useCallback(
    (type: MetricType): ChartPoint[] => {
      let filtered = metrics.filter((m) => m.type === type);
      if (pipelineFilter !== 'all') {
        filtered = filtered.filter((m) => m.pipelineId === pipelineFilter);
        if (serviceFilter !== 'all') {
          filtered = filtered.filter((m) => m.serviceId === serviceFilter);
        }
      }

      const grouped = new Map<string, number[]>();
      filtered.forEach((m) => {
        const d = new Date(m.timestamp);
        d.setSeconds(Math.floor(d.getSeconds() / 5) * 5);
        const key = d.toLocaleTimeString();
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(m.value);
      });

      const isSumType = SUM_METRIC_TYPES.has(type);
      return Array.from(grouped.entries())
        .map(([time, values]) => {
          const agg = isSumType
            ? values.reduce((sum, v) => sum + v, 0)
            : values.reduce((sum, v) => sum + v, 0) / values.length;
          return { time, value: Math.round(agg * 100) / 100 };
        })
        .slice(-20);
    },
    [metrics, pipelineFilter, serviceFilter],
  );
}
