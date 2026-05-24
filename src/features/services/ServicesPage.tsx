/**
 * Services page (route: /services).
 *
 * Previously lived as `pages/ResourcesPage.tsx` (file misnamed — exported `ServicesPage`).
 * Composition layout only: filter bar, bulk rollout button, table of rows.
 */

import { useCallback, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ServiceFilters, type ServiceTypeFilter } from './components/ServiceFilters';
import { ServiceRow } from './components/ServiceRow';
import { useServices } from '@/hooks/data/useServices';
import { usePipelines } from '@/hooks/data/usePipelines';
import { useServicesFilter } from './hooks/useServicesFilter';
import './services.css';

export default function ServicesPage() {
  const { pipelines } = usePipelines();
  const { services, updateService } = useServices();

  const [search, setSearch] = useState('');
  const [serviceType, setServiceType] = useState<ServiceTypeFilter>('all');
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [serviceNameFilter, setServiceNameFilter] = useState<string>('all');
  const [rollingId, setRollingId] = useState<string | null>(null);

  const { rows, activePipelines, uniqueServiceNames } = useServicesFilter({
    search,
    serviceType,
    pipelineId: pipelineFilter,
    serviceName: serviceNameFilter,
  });

  const handleRollout = useCallback(
    async (svcId: string) => {
      setRollingId(svcId);
      await new Promise((r) => setTimeout(r, 600));
      await updateService(svcId, { status: 'healthy' });
      setRollingId(null);
      toast.success('Service rollout complete');
    },
    [updateService],
  );

  const handleBulkRollout = () => {
    const allSvcs = services.filter((s) => s.pipelineId !== 'global');
    toast.info(`Rolling out ${allSvcs.length} services...`);
    allSvcs.forEach((svc, i) => {
      setTimeout(() => updateService(svc.id, { status: 'degraded' }), i * 100);
      setTimeout(() => updateService(svc.id, { status: 'healthy' }), 2000 + i * 100);
    });
  };

  return (
    <div className="services-page">
      <div className="services-page__header">
        <div>
          <h2 className="services-page__title">Services</h2>
          <p className="services-page__subtitle">
            {rows.length} services across {pipelines.length} pipelines
          </p>
        </div>

        <div className="services-page__controls">
          <div className="services-page__search-wrapper">
            <Search className="services-page__search-icon" />
            <Input
              placeholder="Filter services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="services-page__search-input"
            />
          </div>

          <ServiceFilters
            serviceType={serviceType}
            onTypeChange={(v) => {
              setServiceType(v);
              if (v === 'global') setPipelineFilter('all');
            }}
            pipelineId={pipelineFilter}
            onPipelineChange={setPipelineFilter}
            activePipelines={activePipelines}
            serviceName={serviceNameFilter}
            onNameChange={setServiceNameFilter}
            uniqueNames={uniqueServiceNames}
          />

          <Button variant="outline" size="sm" className="services-page__rollout-btn" onClick={handleBulkRollout}>
            <RotateCcw className="services-page__rollout-icon" />
            Rollout All
          </Button>
        </div>
      </div>

      <div className="services-table">
        <div className="services-table__header">
          <div className="services-table__header-cell--center">Status</div>
          <div className="services-table__header-cell">Service</div>
          <div className="services-table__header-cell">Pipeline</div>
          <div className="services-table__header-cell--center">Replicas</div>
          <div className="services-table__header-cell">Resources</div>
          <div className="services-table__header-cell--right">
            Actions
          </div>
        </div>

        <div className="services-table__body">
          {rows.length === 0 ? (
            <div className="services-table__empty">
              No services found matching filters.
            </div>
          ) : (
            rows.map((svc) => (
              <ServiceRow key={svc.id} service={svc} isRolling={rollingId === svc.id} onRollout={handleRollout} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
