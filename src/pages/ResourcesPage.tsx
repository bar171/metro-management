import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { StatusDot, PriorityBadge } from '@/components/shared/StatusIndicators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Plus, Minus, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ResourcesPage() {
  const { pipelines, services, updateService, envFilter } = useAppStore();
  const [search, setSearch] = useState('');
  const [rollingId, setRollingId] = useState<string | null>(null);
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');

  // Default to Metro-pipeline if it exists
  useEffect(() => {
    if (pipelines.length > 0 && pipelineFilter === 'all') {
      const metro = pipelines.find(p => p.name.toLowerCase() === 'metro-pipeline');
      if (metro) {
        setPipelineFilter(metro.id);
      }
    }
  }, [pipelines, pipelineFilter]);

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
        if (pipelineFilter === 'all') return true;
        return s.pipelineId === pipelineFilter;
      })
      .filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.pipelineName.toLowerCase().includes(q);
      });
  }, [services, pipelines, search, pipelineFilter, activePipelines]);

  const handleRestart = async (svcId: string) => {
    setRollingId(svcId);
    await new Promise(r => setTimeout(r, 600));
    await updateService(svcId, { status: 'healthy' });
    setRollingId(null);
    toast.success('Service restarted');
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
          <h2 className="text-lg font-semibold">Resource Management</h2>
          <p className="text-xs text-muted-foreground font-mono">{filteredServices.length} services across {pipelines.length} pipelines</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
            <SelectTrigger className="h-8 w-56 text-xs bg-surface-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-semibold text-primary">All Services</SelectItem>
              <SelectItem value="global" className="font-semibold text-secondary">Global Services Only</SelectItem>
              {activePipelines.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Filter services..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs bg-surface-1" />
          </div>
        </div>
      </div>

      {(() => {
        const globalSvcs = services.filter(s => s.pipelineId === 'global');
        if (globalSvcs.length === 0 || (pipelineFilter !== 'all' && pipelineFilter !== 'global')) return null;

        return (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-secondary rotate-45" />
              <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider">Global Support & Auxiliary Components</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {globalSvcs.map(svc => (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg border border-secondary/20 bg-secondary/5 p-4 flex flex-col gap-3 shadow-sm hover:border-secondary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusDot status={svc.status} pulse />
                      <span className="font-mono font-bold text-sm text-foreground">{svc.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-mono border-secondary/30 text-secondary bg-secondary/5">GLOBAL</Badge>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <div className="flex flex-col">
                      <span className="uppercase text-[8px] opacity-70">Replicas</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => handleScale(svc.id, -1)}>
                          <Minus className="h-2 w-2" />
                        </Button>
                        <span className="font-bold text-foreground w-4 text-center">{svc.replicas}</span>
                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => handleScale(svc.id, 1)}>
                          <Plus className="h-2 w-2" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="uppercase text-[8px] opacity-70">Resources</span>
                      <span className="mt-0.5">{svc.cpuLimit}m · {svc.memoryLimit}Mi</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })()}

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
                        <RotateCcw className="h-3 w-3" /> Restart
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restart Service</AlertDialogTitle>
                        <AlertDialogDescription>
                          Restart <span className="font-mono font-bold">{svc.name}</span> on <span className="font-mono">{svc.pipelineName}</span>? This will trigger a rolling restart.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRestart(svc.id)}>Restart</AlertDialogAction>
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
