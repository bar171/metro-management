import { useMemo, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    <div className="p-6 space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
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
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-1">
              <TableHead className="text-[10px] font-mono uppercase w-8">Status</TableHead>
              <TableHead className="text-[10px] font-mono uppercase">Service</TableHead>
              <TableHead className="text-[10px] font-mono uppercase">Pipeline</TableHead>
              <TableHead className="text-[10px] font-mono uppercase text-center">Replicas</TableHead>
              <TableHead className="text-[10px] font-mono uppercase">Resources</TableHead>
              <TableHead className="text-[10px] font-mono uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map(svc => (
              <ServiceRow
                key={svc.id}
                service={svc}
                isRolling={rollingId === svc.id}
                onRollout={handleRollout}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}