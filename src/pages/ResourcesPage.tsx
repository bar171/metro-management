import { useMemo, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ServiceFilters } from '@/components/ServiceFilters';
import { ServiceRow } from '@/components/ServiceRow';

export default function ServicesPage() {
  const { pipelines, services, updateService, envFilter } = useAppStore();

  // UI State
  const [serviceTypeFilter, setServiceTypeFilter] = useState<'all' | 'pipeline' | 'global'>('all');
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [serviceNameFilter, setServiceNameFilter] = useState<string>('all');
  const [rollingId, setRollingId] = useState<string | null>(null);

  // 1. Data Processing Logic
  const activePipelines = useMemo(() =>
    envFilter === 'all' ? pipelines : pipelines.filter(p => p.environment === envFilter),
    [pipelines, envFilter]);

  const uniqueServiceNames = useMemo(() => {
    const list = pipelineFilter === 'all'
      ? services
      : services.filter(s => s.pipelineId === pipelineFilter);
    return Array.from(new Set(list.map(s => s.name))).sort();
  }, [services, pipelineFilter]);

  const filteredServices = useMemo(() => {
    return services
      .map(s => {
        const pipeline = pipelines.find(p => p.id === s.pipelineId);
        return {
          ...s,
          pipelineName: s.pipelineId === 'global' ? 'Global Services' : (pipeline?.name ?? 'Unknown'),
          pipelinePriority: s.pipelineId === 'global' ? 'high' : (pipeline?.priority ?? 'normal'),
        };
      })
      .filter(s => {
        // Type & Pipeline Filters
        if (serviceTypeFilter === 'pipeline' && (s.pipelineId === 'global' || s.name === 'scheduler')) return false;
        if (serviceTypeFilter === 'global' && s.pipelineId !== 'global') return false;

        if (pipelineFilter !== 'all') {
          if (s.pipelineId !== pipelineFilter || s.name === 'scheduler') return false;
        }

        // Name & Search Filters
        if (serviceNameFilter !== 'all' && s.name !== serviceNameFilter) return false;

        return true;
      });
  }, [services, pipelines, serviceTypeFilter, pipelineFilter, serviceNameFilter]);

  // 2. Action Handlers
  const handleRollout = useCallback(async (svcId: string) => {
    setRollingId(svcId);
    await new Promise(r => setTimeout(r, 600));
    await updateService(svcId, { status: 'healthy' });
    setRollingId(null);
    toast.success('Service rollout complete');
  }, [updateService]);

  const handleBulkRollout = () => {
    const allSvcs = services.filter(s => s.pipelineId !== 'global');
    toast.info(`Rolling out ${allSvcs.length} services...`);
    allSvcs.forEach((svc, i) => {
      setTimeout(() => updateService(svc.id, { status: 'degraded' }), i * 100);
      setTimeout(() => updateService(svc.id, { status: 'healthy' }), 2000 + i * 100);
    });
  };

  return (
    <div className="p-6 gap-4 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Header Section */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-semibold">Services</h2>
          <p className="text-xs text-muted-foreground font-mono">
            {filteredServices.length} services across {pipelines.length} pipelines
          </p>
        </div>

        <div className="flex items-center gap-3">

          <ServiceFilters
            serviceType={serviceTypeFilter}
            onTypeChange={(v) => {
              setServiceTypeFilter(v);
              if (v === 'global') setPipelineFilter('all');
            }}
            pipelineId={pipelineFilter}
            onPipelineChange={setPipelineFilter}
            activePipelines={activePipelines}
            serviceName={serviceNameFilter}
            onNameChange={setServiceNameFilter}
            uniqueNames={uniqueServiceNames}
          />

          <Button variant="outline" size="sm" className="gap-2 text-xs h-8" onClick={handleBulkRollout}>
            <RotateCcw className="w-3.5 h-3.5" />
            Rollout All
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-lg border border-border bg-card flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Independent Header */}
        <div className="grid grid-cols-[60px_1fr_1fr_140px_240px_120px] items-center px-4 py-3 bg-surface-1 border-b border-border shrink-0 z-10 pr-[20px]">
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-medium text-center">Status</div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-medium">Service</div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-medium">Pipeline</div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-medium text-center">Replicas</div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-medium">Resources</div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-medium text-right pr-2">Actions</div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col">
          {filteredServices.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-xs text-muted-foreground font-mono">No services found matching filters.</div>
          ) : (
            filteredServices.map(svc => (
              <ServiceRow
                key={svc.id}
                service={svc}
                isRolling={rollingId === svc.id}
                onRollout={handleRollout}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}