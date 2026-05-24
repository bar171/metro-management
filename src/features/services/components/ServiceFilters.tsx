import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type ServiceTypeFilter = 'all' | 'pipeline' | 'global';

interface ServiceFiltersProps {
  serviceType: ServiceTypeFilter;
  onTypeChange: (v: ServiceTypeFilter) => void;
  pipelineId: string;
  onPipelineChange: (v: string) => void;
  activePipelines: { id: string; name: string }[];
  serviceName: string;
  onNameChange: (v: string) => void;
  uniqueNames: string[];
}

/**
 * 3-piece filter bar for the Services table.
 * Each select hides/shows based on the others, matching original behavior.
 */
export function ServiceFilters({
  serviceType,
  onTypeChange,
  pipelineId,
  onPipelineChange,
  activePipelines,
  serviceName,
  onNameChange,
  uniqueNames,
}: ServiceFiltersProps) {
  return (
    <>
      {serviceName === 'all' && (
        <Select value={serviceType} onValueChange={onTypeChange}>
          <SelectTrigger className="service-filter__trigger">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="pipeline">Pipeline Services</SelectItem>
            <SelectItem value="global">Global Services</SelectItem>
          </SelectContent>
        </Select>
      )}

      {serviceType !== 'global' && (
        <Select value={pipelineId} onValueChange={onPipelineChange}>
          <SelectTrigger className="service-filter__trigger--pipeline">
            <SelectValue placeholder="All Pipelines" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Pipelines</SelectItem>
            {activePipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {serviceType !== 'global' && (
        <Select value={serviceName} onValueChange={onNameChange}>
          <SelectTrigger className="service-filter__trigger--name">
            <SelectValue placeholder="All Service Names" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Service Names</SelectItem>
            {uniqueNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </>
  );
}
