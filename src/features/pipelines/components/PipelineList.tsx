import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusDot, PriorityBadge, TypeBadge } from '@/components/shared/StatusIndicators';
import type { Pipeline, Group, ServiceStatus } from '@/types';
import { CreatePipelineDialog } from './CreatePipelineDialog';

interface PipelineListProps {
  pipelines: Pipeline[];
  groups: Group[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getHealth: (id: string) => ServiceStatus;
  onCreate: (data: { name: string; type: Pipeline['type'] }) => Promise<void>;
  defaultEnvironment: Pipeline['environment'];
}

type StatusFilter = 'all' | 'healthy' | 'degraded';

export function PipelineList({
  pipelines,
  groups,
  selectedId,
  onSelect,
  getHealth,
  onCreate,
  defaultEnvironment,
}: PipelineListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = pipelines
    .filter((p) => (search ? p.name.toLowerCase().includes(search.toLowerCase()) : true))
    .filter((p) => {
      if (statusFilter === 'all') return true;
      const h = getHealth(p.id);
      if (statusFilter === 'degraded') return h === 'degraded' || h === 'lagging';
      return h === 'healthy';
    })
    .sort((a, b) => {
      const ha = getHealth(a.id);
      const hb = getHealth(b.id);
      const da = ha === 'degraded' || ha === 'lagging';
      const db = hb === 'degraded' || hb === 'lagging';
      if (da && !db) return -1;
      if (!da && db) return 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="pipeline-list">
      <div className="pipeline-list__header">
        <div className="pipeline-list__title-row">
          <h3 className="pipeline-list__title">Pipelines</h3>
          <CreatePipelineDialog onCreate={onCreate} defaultEnvironment={defaultEnvironment}>
            <Button
              variant="default"
              size="sm"
              className="pipeline-list__create-btn"
            >
              <Plus className="pipeline-list__create-icon" />
              Create
            </Button>
          </CreatePipelineDialog>
        </div>

        <div className="pipeline-list__filters">
          <div className="pipeline-list__search-wrapper">
            <Search className="pipeline-list__search-icon" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pipeline-list__search-input"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
            <SelectTrigger className="pipeline-list__status-trigger">
              <div className="pipeline-list__status-label">
                <span className="pipeline-list__status-prefix">Status:</span>
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="degraded">Degraded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pipeline-list__items custom-scrollbar">
        {filtered.map((pipeline) => {
          const groupsForPipe = groups.filter(
            (g) => g.primaryPipelineId === pipeline.id || g.secondaryPipelineIds.includes(pipeline.id),
          );
          const isSelected = selectedId === pipeline.id;
          return (
            <button
              key={pipeline.id}
              onClick={() => onSelect(pipeline.id)}
              className={`pipeline-list__item ${
                isSelected ? 'pipeline-list__item--selected' : ''
              }`}
            >
              <div className="pipeline-list__item-dot">
                <StatusDot status={getHealth(pipeline.id)} pulse size="sm" />
              </div>
              <div className="pipeline-list__item-content">
                <div
                  className={`pipeline-list__item-name ${
                    isSelected ? 'pipeline-list__item-name--selected' : 'pipeline-list__item-name--default'
                  }`}
                >
                  {pipeline.name}
                  {groupsForPipe.length > 0 && (
                    <span className="pipeline-list__item-group-count">({groupsForPipe.length})</span>
                  )}
                </div>
                <div className="pipeline-list__item-badges">
                  <TypeBadge type={pipeline.type} />
                  <PriorityBadge priority={pipeline.priority} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
