import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { StatusDot, PriorityBadge, EnvBadge, TypeBadge } from '@/components/shared/StatusIndicators';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Server, Plus, Trash2, ArrowRightLeft, RotateCcw, ArrowRight, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Pipeline, ServiceStatus, PipelineType, Environment, Priority } from '@/types';

export default function PipelinesPage() {
  const {
    pipelines, groups, services, metrics,
    selectedPipelineId, setSelectedPipelineId, envFilter,
    updateService,
    createPipeline, deletePipeline,
    createGroup, updateGroup, deleteGroup
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'degraded'>('all');
  // Default to metro-pipeline if it exists and nothing is selected
  React.useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      const metro = pipelines.find(p => p.name.toLowerCase() === 'metro-pipeline');
      if (metro) {
        setSelectedPipelineId(metro.id);
      } else {
        setSelectedPipelineId(pipelines[0].id);
      }
    }
  }, [pipelines, selectedPipelineId, setSelectedPipelineId]);

  // Pipeline Creation State
  const [isCreatePipelineOpen, setIsCreatePipelineOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineType, setNewPipelineType] = useState<PipelineType>('BASIC');

  // Group Creation State
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Delete Pipeline State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Delete Group State
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; name: string } | null>(null);

  // Group Search State
  const [groupSearch, setGroupSearch] = useState('');

  const getPipelineHealth = React.useCallback((pipelineId: string): ServiceStatus => {
    const svcs = services.filter(s => s.pipelineId === pipelineId);
    if (svcs.some(s => s.status === 'lagging')) return 'lagging';
    if (svcs.some(s => s.status === 'degraded')) return 'degraded';
    return 'healthy';
  }, [services]);

  const filteredPipelines = useMemo(() => {
    let result = pipelines;
    if (envFilter !== 'all') result = result.filter(a => a.environment === envFilter);
    if (search) result = result.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

    if (statusFilter !== 'all') {
      result = result.filter(a => {
        const health = getPipelineHealth(a.id);
        if (statusFilter === 'degraded') return health === 'degraded' || health === 'lagging';
        return health === 'healthy';
      });
    }

    result.sort((a, b) => {
      const healthA = getPipelineHealth(a.id);
      const healthB = getPipelineHealth(b.id);
      const isDegradedA = healthA === 'degraded' || healthA === 'lagging';
      const isDegradedB = healthB === 'degraded' || healthB === 'lagging';

      if (isDegradedA && !isDegradedB) return -1;
      if (!isDegradedA && isDegradedB) return 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [pipelines, envFilter, search, statusFilter, getPipelineHealth]);

  const selected = useMemo(() => pipelines.find(a => a.id === selectedPipelineId), [pipelines, selectedPipelineId]);
  const pipelineServices = useMemo(() => services.filter(s => s.pipelineId === selectedPipelineId), [services, selectedPipelineId]);
  const pipelineGroups = useMemo(() => {
    let result = groups.filter(g => g.primaryPipelineId === selectedPipelineId || g.secondaryPipelineIds.includes(selectedPipelineId || ''));
    if (groupSearch) {
      result = result.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()));
    }
    return result;
  }, [groups, selectedPipelineId, groupSearch]);



  const handleCreatePipeline = async () => {
    if (!newPipelineName) return;
    await createPipeline({
      name: newPipelineName,
      type: newPipelineType,
      role: 'primary',
      environment: envFilter === 'all' ? 'dev' : envFilter,
      priority: 'normal',
      kafkaCluster: 'new-cluster',
      databaseInstance: 'new-db',
      resourceProfileId: 'rp-1',
      totalCpuLimit: 4000,
      totalMemoryLimit: 8192
    });
    setNewPipelineName('');
    setIsCreatePipelineOpen(false);
    toast.success('Pipeline created successfully');
  };

  const handleDeletePipeline = async () => {
    if (!selected) return;
    if (pipelineGroups.length > 0) {
      toast.error(`Cannot delete! Pipeline has ${pipelineGroups.length} associated groups. Please reassign them first.`);
      return;
    }
    await deletePipeline(selected.id);
    setIsDeleteDialogOpen(false);
    toast.success('Pipeline deleted');
  };

  const handleCreateGroup = async () => {
    if (!newGroupName || !selected) return;
    await createGroup({
      name: newGroupName,
      primaryPipelineId: selected.id,
      secondaryPipelineIds: [],
      etlDailyTransportMaxSizeGb: 15,
      etlBackfillLimitDays: null
    });
    setNewGroupName('');
    setIsCreateGroupOpen(false);
    toast.success('Owner Group created');
  };

  const handleMoveGroup = async (groupId: string, newPipelineId: string) => {
    await updateGroup(groupId, { primaryPipelineId: newPipelineId });
    toast.success('Group moved to another pipeline');
  };

  const handleToggleSecondary = async (groupId: string, secondaryPipelineId: string, currentSecondaries: string[]) => {
    const newSecondaries = currentSecondaries.includes(secondaryPipelineId)
      ? currentSecondaries.filter(id => id !== secondaryPipelineId)
      : [...currentSecondaries, secondaryPipelineId];
    await updateGroup(groupId, { secondaryPipelineIds: newSecondaries });
    toast.success('Secondary pipelines updated');
  };

  const primaryPipelines = useMemo(() => pipelines.filter(p => p.role === 'primary'), [pipelines]);
  const secondaryPipelines = useMemo(() => pipelines.filter(p => p.role === 'secondary'), [pipelines]);

  return (
    <div className="flex h-[calc(100vh-3rem)] p-4 gap-4 bg-muted/30 overflow-hidden">
      {/* Left Pane: Pipeline List */}
      <div className="w-72 border border-border bg-card rounded-xl flex flex-col shrink-0 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border bg-muted/10 shrink-0 h-[120px] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm tracking-tight text-foreground/70 uppercase tracking-widest">Pipelines</h3>
            <Dialog open={isCreatePipelineOpen} onOpenChange={setIsCreatePipelineOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="h-8 px-4 text-xs font-bold shadow-sm rounded-lg uppercase tracking-tight">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Pipeline</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Name</label>
                    <Input value={newPipelineName} onChange={e => setNewPipelineName(e.target.value)} placeholder="e.g. Fraud-Detection" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Type</label>
                      <Select value={newPipelineType} onValueChange={(v) => setNewPipelineType(v as PipelineType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BASIC">BASIC</SelectItem>
                          <SelectItem value="STREAM">STREAM</SelectItem>
                          <SelectItem value="BACKFILL">BACKFILL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreatePipelineOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreatePipeline}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 pl-10 text-xs bg-background/50 border-border/50 focus-visible:ring-1 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: 'all' | 'healthy' | 'degraded') => setStatusFilter(v)}>
              <SelectTrigger className="h-8 w-[125px] text-xs bg-background/50 border-border/50 focus-visible:ring-1 rounded-lg px-2.5">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-muted-foreground/60 font-bold">Status:</span>
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
        <div className="flex-1 overflow-auto custom-scrollbar">
          {filteredPipelines.map(pipeline => {
            const groupsForPipe = groups.filter(g =>
              g.primaryPipelineId === pipeline.id ||
              g.secondaryPipelineIds.includes(pipeline.id)
            );
            const isSelected = selectedPipelineId === pipeline.id;
            return (
              <button
                key={pipeline.id}
                onClick={() => setSelectedPipelineId(pipeline.id)}
                className={`w-full text-left px-3 py-3 border-b border-border hover:bg-surface-1/50 transition-all flex items-start gap-2.5 ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
              >
                <div className="mt-1"><StatusDot status={getPipelineHealth(pipeline.id)} pulse size="sm" /></div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className={`text-xs font-semibold truncate flex justify-between items-center gap-2 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {pipeline.name}
                    {groupsForPipe.length > 0 && (
                      <span className="text-[10px] opacity-60 font-mono">
                        ({groupsForPipe.length})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <TypeBadge type={pipeline.type} />
                    <PriorityBadge priority={pipeline.priority} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Pane: Main Area */}
      <div className="flex-1 border border-border bg-card rounded-xl overflow-hidden shadow-sm flex flex-col relative">
        <div className="absolute inset-0 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-full overflow-hidden"
              >
                {/* Header aligned with sidebar header */}
                <div className="p-5 border-b border-border bg-muted/10 shrink-0 h-[120px] flex items-center justify-between px-8">
                  <div className="flex items-center gap-6">
                    <StatusDot status={getPipelineHealth(selected.id)} pulse size="lg" />
                    <div className="flex flex-col">
                      <h2 className="text-lg font-bold flex items-center gap-3">
                        {selected.name}
                        <EnvBadge env={selected.environment} />
                      </h2>
                      <div className="flex items-center gap-3 mt-1">
                        <TypeBadge type={selected.type} />
                        <PriorityBadge priority={selected.priority} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="h-9 gap-3 shadow-sm font-semibold">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                        </DialogHeader>
                        <div className="py-6 text-sm text-muted-foreground">
                          {pipelineGroups.length > 0 ? (
                            <div className="p-4 bg-status-critical/10 border border-status-critical/20 rounded-lg text-status-critical">
                              <strong>Restricted:</strong> This pipeline has {pipelineGroups.length} associated groups. Move or delete them before proceeding.
                            </div>
                          ) : (
                            <p>Are you sure you want to delete <strong>{selected.name}</strong>? This action cannot be undone.</p>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                          <Button
                            variant="destructive"
                            disabled={pipelineGroups.length > 0}
                            onClick={handleDeletePipeline}
                          >
                            Confirm Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Content Container (Locked vertical height) */}
                <div className="flex-1 min-h-0 p-3.5 space-y-3.5 overflow-hidden flex flex-col">

                  <Tabs defaultValue="overview" className="flex-1 min-h-0 flex flex-col space-y-2">
                    <TabsList className="bg-muted/10 p-0.5 rounded-lg shrink-0 w-fit">
                      <TabsTrigger value="overview" className="gap-2 px-5 h-7 text-[10px] font-bold uppercase tracking-tight data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
                      <TabsTrigger value="groups" className="gap-2 px-5 h-7 text-[10px] font-bold uppercase tracking-tight data-[state=active]:bg-background data-[state=active]:shadow-sm">Groups ({pipelineGroups.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="flex-1 min-h-0 m-0">
                      <div className="h-full rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
                        <div className="w-full bg-muted/5 border-b border-border/50 py-1.5 px-4 flex items-center justify-between shrink-0">
                          <h3 className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-muted-foreground/40 flex items-center gap-2">
                            <RotateCcw className="w-3 h-3 text-primary/30 animate-spin-slow" />
                            System Architecture
                          </h3>
                        </div>
                        <div className="flex-1 bg-muted/5 flex items-center justify-center p-2 overflow-hidden">
                          <svg viewBox="0 0 880 430" className="w-full h-auto pointer-events-none max-w-[1000px]" style={{ zIndex: 0 }}>
                            <defs>
                              <marker id="arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto-start-reverse">
                                <path d="M 0 0 L 6 3 L 0 6 z" fill="currentColor" className="text-muted-foreground/50" />
                              </marker>
                              <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto-start-reverse">
                                <path d="M 0 0 L 6 3 L 0 6 z" fill="currentColor" className="text-status-critical/80" />
                              </marker>
                              <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto-start-reverse">
                                <path d="M 0 0 L 6 3 L 0 6 z" fill="currentColor" className="text-blue-500/80" />
                              </marker>
                            </defs>
                            {/* SVG Flow Contents */}
                            {(() => {
                              const renderNode = (svcName: string, x: number, y: number) => {
                                const svc = pipelineServices.find(s => s.name === svcName);
                                return (
                                  <foreignObject key={svcName} x={x} y={y} width="160" height="110" className="overflow-visible pointer-events-auto">
                                    <div className={`w-full h-full rounded border flex flex-col justify-center gap-1 p-2.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
                                      ${svc ? (() => {
                                        const latestLag = (() => {
                                          const l = metrics.filter(m => m.pipelineId === selected.id && m.serviceId === svc.id && m.type === 'kafka_lag');
                                          return l.length > 0 ? l[l.length - 1].value : 0;
                                        })();
                                        const lagThreshold = Number(import.meta.env.VITE_KAFKA_LAG_THRESHOLD) || 1000;
                                        const effectiveStatus = svc.status === 'degraded' ? 'degraded' : (latestLag > lagThreshold ? 'lagging' : 'healthy');

                                        return effectiveStatus === 'degraded' ? 'bg-status-critical/5 border-status-critical/40 shadow-[0_0_15px_rgba(255,0,0,0.05)]' :
                                          effectiveStatus === 'lagging' ? 'bg-status-warning/5 border-status-warning/40' :
                                            'bg-card border-border shadow-sm';
                                      })() : 'bg-muted/10 border-dashed border-border/40 opacity-40'}`}>
                                      <div className="flex items-center justify-between border-b border-border/30 pb-1.5 mb-1">
                                        <span className="font-mono text-[10px] font-black underline decoration-primary/20 underline-offset-4 truncate text-foreground/90 uppercase tracking-tight">{svcName}</span>
                                        {svc ? (() => {
                                          const latestLag = (() => {
                                            const l = metrics.filter(m => m.pipelineId === selected.id && m.serviceId === svc.id && m.type === 'kafka_lag');
                                            return l.length > 0 ? l[l.length - 1].value : 0;
                                          })();
                                          const lagThreshold = Number(import.meta.env.VITE_KAFKA_LAG_THRESHOLD) || 1000;
                                          const effectiveStatus = svc.status === 'degraded' ? 'degraded' : (latestLag > lagThreshold ? 'lagging' : 'healthy');
                                          return <StatusDot status={effectiveStatus} pulse size="xs" />;
                                        })() : <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />}
                                      </div>
                                      {svc && (() => {
                                        const latestLag = (() => {
                                          const l = metrics.filter(m => m.pipelineId === selected.id && m.serviceId === svc.id && m.type === 'kafka_lag');
                                          return l.length > 0 ? l[l.length - 1].value : 0;
                                        })();

                                        const lagThreshold = Number(import.meta.env.VITE_KAFKA_LAG_THRESHOLD) || 1000;
                                        const effectiveStatus = svc.status === 'degraded' ? 'degraded' : (latestLag > lagThreshold ? 'lagging' : 'healthy');

                                        return (
                                          <div className="flex flex-col text-[11px] text-muted-foreground font-mono gap-1.5">
                                            <div className="flex items-center justify-between">
                                              <span className="uppercase text-[8px] font-black tracking-tighter text-primary/80">Health</span>
                                              <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded-[2px] ${effectiveStatus === 'degraded' ? 'text-status-critical bg-status-critical/10' : effectiveStatus === 'lagging' ? 'text-status-warning bg-status-warning/10' : 'text-status-healthy bg-status-healthy/10'}`}>
                                                {effectiveStatus.toUpperCase()}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="uppercase text-[8px] font-black tracking-tighter text-primary/80">Kafka Lag</span>
                                              <span className="font-bold text-[11px] text-foreground/80 tabular-nums">
                                                {latestLag.toLocaleString()}
                                              </span>
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-6.5 w-full mt-1.5 gap-1.5 px-2 text-[9px] font-bold uppercase tracking-wider bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary transition-all shadow-none hvr-shrink"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toast.info(`Rollout of ${svcName} initiated.`);
                                                updateService(svc.id, { status: 'degraded' });
                                                setTimeout(() => updateService(svc.id, { status: 'healthy' }), 1500);
                                              }}
                                            >
                                              <RotateCcw className="w-2.5 h-2.5" />
                                              Rollout
                                            </Button>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </foreignObject>
                                );
                              };
                              return (
                                <>
                                  <path d="M 165 90 L 197.5 90 L 197.5 190 L 230 190" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/30" markerEnd="url(#arrow)" />
                                  <path d="M 165 220 L 197.5 220 L 197.5 190 L 230 190" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/30" markerEnd="url(#arrow)" />
                                  <path d="M 165 345 L 197.5 345 L 197.5 190 L 230 190" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/30" markerEnd="url(#arrow)" />
                                  <path d="M 390 190 L 420 190 L 420 230 L 450 230" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/30" markerEnd="url(#arrow)" />
                                  <path d="M 390 190 L 420 190 L 420 115 L 450 115" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/30" markerEnd="url(#arrow)" />
                                  <path d="M 390 190 L 420 190 L 420 300 L 640 300 L 640 230" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/30" />
                                  <path d="M 310 245 L 310 285" stroke="currentColor" fill="none" strokeWidth="2" className="text-status-critical/40" markerEnd="url(#arrow-red)" />
                                  <path d="M 610 230 L 640 230 L 640 115 L 670 115" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/30" markerEnd="url(#arrow)" />
                                  <path d="M 610 230 L 640 230 L 640 345 L 670 345" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/30" markerEnd="url(#arrow)" />
                                  <path d="M 550 60 L 550 25 L 310 25 L 310 135" stroke="currentColor" fill="none" strokeWidth="2" className="text-blue-500/40" markerEnd="url(#arrow-blue)" />

                                  {renderNode('push-data', 5, 30)}
                                  {renderNode('kafka-consumer', 5, 160)}
                                  {renderNode('get-data', 5, 290)}
                                  {renderNode('python-validate', 230, 135)}
                                  {renderNode('informative-validation', 230, 285)}
                                  {renderNode('external-transform', 450, 60)}
                                  {renderNode('transform-data', 450, 175)}
                                  {renderNode('publish', 670, 60)}
                                  {renderNode('sink-data', 670, 290)}
                                </>
                              );
                            })()}
                          </svg>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="groups" className="flex-1 min-h-0 overflow-auto custom-scrollbar pr-2 space-y-6">
                      <div className="flex items-center justify-between bg-muted/20 p-4 rounded-xl border border-border">
                        <div className="flex flex-col gap-1">
                          <h3 className="font-bold text-sm">Associated Owner Groups</h3>
                          <p className="text-xs text-muted-foreground">Manage service ownership and permissions for this pipeline.</p>
                        </div>
                        <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 shadow-sm font-semibold"><Plus className="w-3.5 h-3.5" /> Assign Group</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Assign New Group</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-xs font-medium">Group Name</label>
                                <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Core Infra" />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>Cancel</Button>
                              <Button onClick={handleCreateGroup}>Confirm Assign</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Filter groups..."
                          value={groupSearch}
                          onChange={e => setGroupSearch(e.target.value)}
                          className="h-9 pl-9 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {pipelineGroups.map(group => (
                          <div key={group.id} className="group relative rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-all shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-muted group-hover:bg-primary/5 transition-colors">
                                  <Users className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold">{group.name}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono">ID: {group.id.slice(0, 8)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={group.primaryPipelineId}
                                  onValueChange={(v) => handleMoveGroup(group.id, v)}
                                >
                                  <SelectTrigger className="h-8 w-32 text-[10px] bg-muted/50 border-none"><ArrowRightLeft className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {primaryPipelines.map(p => (
                                      <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setGroupToDelete({ id: group.id, name: group.name })}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-border/40">
                              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest block mb-3">Linked Secondary Pipelines</span>
                              <div className="flex flex-wrap gap-2">
                                {secondaryPipelines.map(sp => {
                                  const isActive = group.secondaryPipelineIds.includes(sp.id);
                                  return (
                                    <button
                                      key={sp.id}
                                      onClick={() => handleToggleSecondary(group.id, sp.id, group.secondaryPipelineIds)}
                                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight transition-all border
                                        ${isActive
                                          ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                                          : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50'}`}
                                    >
                                      {sp.name}
                                    </button>
                                  );
                                })}
                                {secondaryPipelines.length === 0 && (
                                  <span className="text-xs text-muted-foreground/40 italic">No secondary pipelines defined</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {pipelineGroups.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-2xl border-2 border-dashed border-border/50">
                          <Users className="w-12 h-12 text-muted-foreground/20 mb-4" />
                          <span className="text-sm text-muted-foreground">No groups associated with this pipeline</span>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 border border-border/40 flex items-center justify-center mb-6 shadow-sm">
                  <Server className="w-8 h-8 opacity-20 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground/80 tracking-tight">No Pipeline Selected</h3>
                <p className="text-xs text-muted-foreground max-w-[200px] mt-2 leading-relaxed">Select an active pipeline from the registry to monitor its health and flow.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Group Confirmation Dialog */}
      <Dialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Group</DialogTitle></DialogHeader>
          <div className="py-6 text-sm">
            Are you sure you want to delete <strong>{groupToDelete?.name}</strong>?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupToDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (groupToDelete) {
                  await deleteGroup(groupToDelete.id);
                  setGroupToDelete(null);
                  toast.success('Group deleted successfully');
                }
              }}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
