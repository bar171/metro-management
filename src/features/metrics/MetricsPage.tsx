/**
 * Metrics — 4 area-chart cards over a (pipeline × service) selection.
 * All derivations and the live simulator live in hooks; this file is layout-only.
 */

import { useEffect, useMemo, useState } from 'react';
import { usePipelines } from '@/hooks/data/usePipelines';
import { useServices } from '@/hooks/data/useServices';
import { useLiveMetricsSimulator } from './hooks/useLiveMetricsSimulator';
import { useMetricsChartData } from './hooks/useMetricsChartData';
import { MetricChart } from './components/MetricChart';
import { MetricsFilterBar } from './components/MetricsFilterBar';
import { METRIC_CONFIGS } from './config';
import './metrics.css';

export default function MetricsPage() {
  const { pipelines } = usePipelines();
  const { services } = useServices();

  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  // Reset service filter when pipeline changes.
  useEffect(() => {
    setServiceFilter('all');
  }, [pipelineFilter]);

  const activeServices = useMemo(() => {
    if (pipelineFilter === 'all') return [];
    return services.filter((s) => s.pipelineId === pipelineFilter);
  }, [services, pipelineFilter]);

  useLiveMetricsSimulator(pipelineFilter, serviceFilter);

  const getChartData = useMetricsChartData(pipelineFilter, serviceFilter);

  return (
    <div className="metrics-page">
      <div className="metrics-page__header">
        <div>
          <h2 className="metrics-page__title">Metrics</h2>
          <p className="metrics-page__subtitle">Live system telemetry · Refreshing every 3s</p>
        </div>
        <MetricsFilterBar
          pipelines={pipelines}
          activeServices={activeServices}
          pipelineFilter={pipelineFilter}
          onPipelineChange={setPipelineFilter}
          serviceFilter={serviceFilter}
          onServiceChange={setServiceFilter}
        />
      </div>

      <div className="metrics-page__grid">
        {METRIC_CONFIGS.map((mc, i) => (
          <MetricChart key={mc.type} config={mc} data={getChartData(mc.type)} index={i} />
        ))}
      </div>
    </div>
  );
}
