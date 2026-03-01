import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { StatusDot, PriorityBadge } from '@/components/shared/StatusIndicators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Plus, Minus, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ResourcesPage() {
  const { pipelines, services, updateService } = useAppStore();
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
  }, [pipelines]);

  const filteredServices = useMemo(() => {
    let result = services.map(s => ({
      ...s,
      pipelineName: pipelines.find(a => a.id === s.pipelineId)?.name ?? 'Unknown',
      pipelinePriority: pipelines.find(a => a.id === s.pipelineId)?.priority ?? 'normal',
    }));

    if (pipelineFilter !== 'all') {
      result = result.filter(s => s.pipelineId === pipelineFilter);
    }

    if (search) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.pipelineName.toLowerCase().includes(search.toLowerCase())
      );
    }
    return result;
  }, [services, pipelines, search, pipelineFilter]);

  const handleRestart = async (svcId: string) => {
    setRollingId(svcId);
    await new Promise(r => setTimeout(r, 600));
    await updateService(svcId, { status: 'healthy' });
    setRollingId(null);
    toast.success('Service restarted');
  };

  const handleScale = async (svcId: string, delta: number) => {
    const svc = services.find(s => s.id === svcId);
    if (!svc) return;
    const pipeline = pipelines.find(a => a.id === svc.pipelineId);
    const newReplicas = Math.max(0, Math.min(16, svc.replicas + delta));
    if (pipeline?.priority === 'critical' && newReplicas === 0) {
      toast.error('Cannot scale to 0 replicas on critical pipeline');
      return;
    }
    await updateService(svcId, { replicas: newReplicas });
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
              <SelectItem value="all" className="font-semibold text-primary">Global (All Pipelines)</SelectItem>
              {pipelines.map(a => (
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

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-1">
              <TableHead className="text-[10px] font-mono uppercase w-8">Status</TableHead>
              <TableHead className="text-[10px] font-mono uppercase">Service</TableHead>
              <TableHead className="text-[10px] font-mono uppercase">Pipeline</TableHead>
              <TableHead className="text-[10px] font-mono uppercase">Priority</TableHead>
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
                <TableCell><PriorityBadge priority={svc.pipelinePriority as any} /></TableCell>
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
                <TableCell className="font-mono text-muted-foreground">{svc.cpuLimit}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{svc.memoryLimit}</TableCell>
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
