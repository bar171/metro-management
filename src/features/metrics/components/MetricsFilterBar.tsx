import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Pipeline, Service } from '@/types';

interface MetricsFilterBarProps {
  pipelines: Pipeline[];
  activeServices: Service[];
  pipelineFilter: string;
  onPipelineChange: (v: string) => void;
  serviceFilter: string;
  onServiceChange: (v: string) => void;
}

export function MetricsFilterBar({
  pipelines,
  activeServices,
  pipelineFilter,
  onPipelineChange,
  serviceFilter,
  onServiceChange,
}: MetricsFilterBarProps) {
  return (
    <div className="metrics-filter">
      <span className="metrics-filter__pulse" />
      <span className="metrics-filter__live-label">LIVE</span>
      <Select value={pipelineFilter} onValueChange={onPipelineChange}>
        <SelectTrigger className="metrics-filter__pipeline-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="metrics-filter__global-item">
            Global (All Pipelines)
          </SelectItem>
          {pipelines.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {pipelineFilter !== 'all' && (
        <Select value={serviceFilter} onValueChange={onServiceChange}>
          <SelectTrigger className="metrics-filter__service-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="metrics-filter__global-item">
              All Services
            </SelectItem>
            {activeServices.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
