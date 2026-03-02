import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { StatusDot, PriorityBadge } from '@/components/shared/StatusIndicators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Plus, Minus, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ServicesPage() {
  const { pipelines, services, updateService, envFilter } = useAppStore();
  const [search, setSearch] = useState('');
  const [rollingId, setRollingId] = useState<string | null>(null);

  // Filter Services
  const activePipelines = useMemo(() => {
    return envFilter === 'all' ? pipelines : pipelines.filter(p => p.environment === envFilter);
  }, [pipelines, envFilter]);

  const filteredServices = useMemo(() => {
    return services
      .filter(s => s.pipelineId === 'global' || activePipelines.some(p => p.id === s.pipelineId))
      .map(s => ({
        ...s,
        pipelineName: s.pipelineId === 'global' ? 'Global Services' : (pipelines.find(a => a.id === s.pipelineId)?.name ?? 'Unknown'),
        pipelinePriority: s.pipelineId === 'global' ? 'high' : (pipelines.find(a => a.id === s.pipelineId)?.priority ?? 'normal'),
      }))
      .filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.pipelineName.toLowerCase().includes(q);
      });
  }, [services, pipelines, search, activePipelines]);

  const handleRollout = async (svcId: string) => {
    setRollingId(svcId);
    await new Promise(r => setTimeout(r, 600));
    await updateService(svcId, { status: 'healthy' });
    setRollingId(null);
    toast.success('Service rollout complete');
  };

  const handleScale = async (svcId: string, replicaDelta: number = 0, newCpu?: number, newMem?: number) => {
    const svc = services.find(s => s.id === svcId);
    if (!svc) return;
    const pipeline = pipelines.find(a => a.id === svc.pipelineId);
    const newReplicas = Math.max(0, Math.min(16, svc.replicas + replicaDelta));
    if (pipeline?.priority === 'critical' && newReplicas === 0) {
      toast.error('Cannot scale to 0 replicas on critical pipeline');
      return;
    }

    const updates: Partial<typeof svc> = {};
    if (replicaDelta !== 0) updates.replicas = newReplicas;
    if (newCpu !== undefined) updates.cpuLimit = Math.max(10, newCpu);
    if (newMem !== undefined) updates.memoryLimit = Math.max(16, newMem);

    if (Object.keys(updates).length > 0) {
      await updateService(svcId, updates);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Services</h2>
          <p className="text-xs text-muted-foreground font-mono">{filteredServices.length} services across {pipelines.length} pipelines</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Filter services..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs bg-surface-1" />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs h-8"
            onClick={() => {
              const allSvcs = services.filter(s => s.pipelineId !== 'global');
              toast.info(`Rolling out all services...`, { description: `Rollout of ${allSvcs.length} services across all pipelines.` });
              allSvcs.forEach((svc, i) => {
                setTimeout(() => updateService(svc.id, { status: 'degraded' }), i * 100);
                setTimeout(() => updateService(svc.id, { status: 'healthy' }), 2000 + i * 100);
              });
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Rollout All Services
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-1">
              <TableHead className="text-[10px] font-mono uppercase w-8">Status</TableHead>
              <TableHead className="text-[10px] font-mono uppercase">Service</TableHead>
              <TableHead className="text-[10px] font-mono uppercase">Pipeline</TableHead>
              <TableHead className="text-[10px] font-mono uppercase text-center">Replicas</TableHead>
              <TableHead className="text-[10px] font-mono uppercase">CPU</TableHead>
              <TableHead className="text-[10px] font-mono uppercase">Memory</TableHead>
              <TableHead className="text-[10px] font-mono uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map(svc => (
              <motion.tr
                key={svc.id}
                className={`border-b border-border hover:bg-surface-1 transition-colors text-xs ${rollingId === svc.id ? 'animate-pod-roll' : ''}`}
                layout
              >
                <TableCell><StatusDot status={svc.status} pulse /></TableCell>
                <TableCell className="font-mono font-medium">{svc.name}</TableCell>
                <TableCell className="text-muted-foreground">{svc.pipelineName}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleScale(svc.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-mono font-bold w-6 text-center tabular-nums">{svc.replicas}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleScale(svc.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 w-20">
                    <Input
                      type="number"
                      defaultValue={svc.cpuLimit}
                      onBlur={(e) => handleScale(svc.id, 0, Number(e.target.value), undefined)}
                      className="h-7 w-16 text-xs font-mono px-1.5"
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">m</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 w-20">
                    <Input
                      type="number"
                      defaultValue={svc.memoryLimit}
                      onBlur={(e) => handleScale(svc.id, 0, undefined, Number(e.target.value))}
                      className="h-7 w-16 text-xs font-mono px-1.5"
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">Mi</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1">
                        <RotateCcw className="h-3 w-3" /> Rollout
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Rollout Service</AlertDialogTitle>
                        <AlertDialogDescription>
                          Rollout <span className="font-mono font-bold">{svc.name}</span> on <span className="font-mono">{svc.pipelineName}</span>? This will trigger a rolling deployment.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRollout(svc.id)}>Rollout</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
