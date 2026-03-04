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
      toast.error(`Cannot delete !Pipeline has ${pipelineGroups.length} associated groups.Please reassign them first.`);
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
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Left Pane */}
      <div className="w-80 border-r border-border bg-card/50 flex flex-col shrink-0">
        <div className="p-3 border-b border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Pipelines</h3>
            <Dialog open={isCreatePipelineOpen} onOpenChange={setIsCreatePipelineOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="h-8 text-xs font-semibold"><Plus className="h-3 w-3 mr-1" /> Create Pipeline</Button>
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
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search pipelines..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-surface-1"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: 'all' | 'healthy' | 'degraded') => setStatusFilter(v)}>
              <SelectTrigger className="h-8 w-[110px] text-xs bg-surface-1">
                <SelectValue placeholder="Status" />
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
            const groupsForPipe = groups.filter(g => g.primaryPipelineId === pipeline.id);
            return (
              <button
                key={pipeline.id}
                onClick={() => setSelectedPipelineId(pipeline.id)}
                className={`w-full text-left px-3 py-3 border-b border-border hover:bg-surface-1 transition-colors flex items-start gap-3 ${selectedPipelineId === pipeline.id ? 'bg-surface-2 border-l-2 border-l-primary' : ''}`}
              >
                <div className="mt-1"><StatusDot status={getPipelineHealth(pipeline.id)} pulse /></div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="text-sm font-medium truncate flex justify-between items-center gap-2">
                    {pipeline.name}
                    {groupsForPipe.length > 0 && (
                      <span className="text-[10px] bg-muted-foreground/10 text-muted-foreground px-1.5 py-0.5 rounded-full font-mono">
                        {groupsForPipe.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                    <TypeBadge type={pipeline.type} />
                    <PriorityBadge priority={pipeline.priority} />
                  </div>
                  {groupsForPipe.length > 0 && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 truncate" title={groupsForPipe.map(g => g.name).join(', ')}>
                      <Users className="w-3 h-3 inline shrink-0" />
                      <span className="truncate">
                        {groupsForPipe.length <= 2
                          ? groupsForPipe.map(g => g.name).join(', ')
                          : `${groupsForPipe.slice(0, 2).map(g => g.name).join(', ')} +${groupsForPipe.length - 2} more`}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Pane */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-2 pb-8"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <StatusDot status={getPipelineHealth(selected.id)} pulse className="w-4 h-4" />
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      {selected.name}
                      <TypeBadge type={selected.type} />
                      <PriorityBadge priority={selected.priority} />
                    </h2>
                    {pipelineGroups.length > 0 ? (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        Owned by:
                        <span className="font-medium text-foreground line-clamp-1" title={pipelineGroups.map(g => g.name).join(', ')}>
                          {pipelineGroups.length <= 5
                            ? pipelineGroups.map(g => g.name).join(', ')
                            : `${pipelineGroups.slice(0, 5).map(g => g.name).join(', ')} +${pipelineGroups.length - 5} more`}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1 italic">No owner groups assigned</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      toast.info(`Rolling out all ${selected.name} services...`, { description: `Rollout of ${pipelineServices.length} services initiated.` });
                      pipelineServices.forEach((svc, i) => {
                        setTimeout(() => updateService(svc.id, { status: 'degraded' }), i * 200);
                        setTimeout(() => updateService(svc.id, { status: 'healthy' }), 2000 + i * 200);
                      });
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Rollout Pipeline
                  </Button>

                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Pipeline
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Pipeline: {selected.name}</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        {pipelineGroups.length > 0 ? (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm">
                            <strong>Warning:</strong> This pipeline has {pipelineGroups.length} associated group(s). You must move them to another pipeline or delete them before deleting this pipeline.
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Are you sure you want to delete this pipeline? This action cannot be undone.</p>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeletePipeline} disabled={pipelineGroups.length > 0}>
                          Confirm Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-surface-1">
                  <TabsTrigger value="overview" className="text-xs gap-1.5"><Server className="h-3.5 w-3.5" />Overview</TabsTrigger>
                  <TabsTrigger value="groups" className="text-xs gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Groups
                    <span className="ml-1 text-[10px] opacity-60 font-mono">({pipelineGroups.length})</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">

                  <div className="rounded-lg border border-border bg-card">
                    <div className="w-full bg-surface-1/5 rounded-b-lg overflow-hidden p-0.5">
                      <svg viewBox="0 0 880 440" className="w-full h-auto pointer-events-none" style={{ zIndex: 0 }}>
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

                        {/* push-data -> python-validate */}
                        {pipelineServices.some(s => s.name === 'push-data') && (
                          <path d="M 210 95 L 220 95 L 220 210 L 230 210" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />
                        )}

                        {/* kafka-consumer -> python-validate */}
                        {pipelineServices.some(s => s.name === 'kafka-consumer') && (
                          <path d="M 210 210 L 230 210" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />
                        )}

                        {/* get-data -> python-validate */}
                        <path d="M 210 325 L 220 325 L 220 210 L 230 210" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />

                        {/* Python Validate -> Transform Data/External Transform and Publish */}
                        {pipelineServices.some(s => s.name === 'external-transform' || s.name === 'transform-data') ? (
                          <>
                            {/* Validate -> Transform Data */}
                            {pipelineServices.some(s => s.name === 'transform-data') && (
                              <path d="M 430 210 L 450 210" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />
                            )}

                            {/* Validate -> External Transform */}
                            {pipelineServices.some(s => s.name === 'external-transform') && (
                              <path d="M 430 210 L 440 210 L 440 95 L 450 95" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />
                            )}

                            {/* Bypass/Junction */}
                            <path d="M 430 210 L 440 210 L 440 270 L 640 270 L 640 210" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" />

                            {/* External Transform Loop Back */}
                            {pipelineServices.some(s => s.name === 'external-transform') && (
                              <path d="M 550 95 L 550 40 L 330 40 L 330 170" stroke="currentColor" fill="none" strokeWidth="2" className="text-blue-500/60" markerEnd="url(#arrow-blue)" />
                            )}
                          </>
                        ) : (
                          <path d="M 430 210 L 640 210" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" />
                        )}

                        {/* Informative Validation */}
                        <path d="M 330 265 L 330 325" stroke="currentColor" fill="none" strokeWidth="2" className="text-status-critical/60" markerEnd="url(#arrow-red)" />

                        {/* Parallel Split to Sink/Publish */}
                        <path d="M 640 210 L 660 210 L 660 95 L 670 95" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />
                        <path d="M 640 210 L 660 210 L 660 325 L 670 325" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />

                        {/* Rendering Nodes Helper */}
                        {(() => {
                          const renderNode = (name: string, x: number, y: number) => {
                            const svc = pipelineServices.find(s => s.name === name);

                            const nodeContent = (
                              <div
                                className={`w-full h-full rounded-md border flex flex-col justify-center gap-1.5 p-3
                                  ${svc ? (svc.status === 'degraded' ? 'bg-status-critical/10 border-status-critical/50 shadow-[0_0_15px_rgba(255,0,0,0.15)]' :
                                    svc.status === 'lagging' ? 'bg-status-warning/10 border-status-warning/50' :
                                      'bg-card border-border shadow-sm') : 'bg-surface-1/30 border-dashed border-border/50 opacity-60'
                                  } z-10 transition-colors hover:border-primary/50`}
                              >
                                <div className="flex items-center gap-2">
                                  {svc ? <StatusDot status={svc.status} pulse className="w-2.5 h-2.5" /> : <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />}
                                  <span className="font-mono text-[11px] font-bold truncate text-foreground/90" title={name}>{name}</span>
                                </div>
                                {svc && (
                                  <div className="flex flex-col text-xs text-muted-foreground font-mono mt-2 gap-2 border-t border-border/40 pt-2">
                                    <div className="flex items-center justify-between">
                                      <span className="uppercase text-[9px] opacity-70 font-bold tracking-tight">Status</span>
                                      <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${svc.status === 'degraded' ? 'bg-status-critical/20 text-status-critical' : svc.status === 'lagging' ? 'bg-status-warning/20 text-status-warning' : 'bg-status-healthy/20 text-status-healthy'}`}>
                                        {svc.status.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="uppercase text-[9px] opacity-70 font-bold tracking-tight">Kafka Lag</span>
                                      <span className="font-bold text-sm text-foreground">
                                        {(() => {
                                          const l = metrics.filter(m => m.pipelineId === selected?.id && m.serviceId === svc.id && m.type === 'kafka_lag');
                                          return l.length > 0 ? l[l.length - 1].value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0';
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );

                            return (
                              <foreignObject key={name} x={x} y={y} width="200" height="105" className="overflow-visible pointer-events-auto">
                                {nodeContent}
                              </foreignObject>
                            );
                          };
                          return (
                            <>
                              {/* Sources */}
                              {pipelineServices.some(s => s.name === 'push-data') && renderNode('push-data', 10, 40)}
                              {pipelineServices.some(s => s.name === 'kafka-consumer') && renderNode('kafka-consumer', 10, 155)}
                              {/* Get Data */}
                              {renderNode('get-data', 10, 270)}
                              {/* Validate */}
                              {renderNode('python-validate', 230, 155)}
                              {renderNode('informative-validation', 230, 325)}

                              {/* Transform (Optional) */}
                              {pipelineServices.some(s => s.name === 'external-transform' || s.name === 'transform-data') && (
                                <>
                                  {pipelineServices.some(s => s.name === 'external-transform') && renderNode('external-transform', 450, 40)}
                                  {pipelineServices.some(s => s.name === 'transform-data') && renderNode('transform-data', 450, 155)}
                                </>
                              )}

                              {/* Publish & Sink (Parallel) */}
                              {renderNode('publish', 670, 40)}
                              {renderNode('sink-data', 670, 270)}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="groups" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      Pipeline Groups
                      <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-full">
                        Total: {pipelineGroups.length}
                      </span>
                    </h3>
                    <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2"><Plus className="w-3.5 h-3.5" /> Add Group</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign New Group</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium">Group Name</label>
                            <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Data Science Team" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>Cancel</Button>
                          <Button onClick={handleCreateGroup}>Assign</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search groups in this pipeline..."
                      value={groupSearch}
                      onChange={e => setGroupSearch(e.target.value)}
                      className="h-8 pl-8 text-xs bg-surface-1"
                    />
                  </div>

                  {pipelineGroups.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg bg-card/30 text-muted-foreground text-sm">
                      No groups currently own this pipeline. Add one above.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {pipelineGroups.map(group => (
                        <div key={group.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{group.name}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Select
                                value={group.primaryPipelineId}
                                onValueChange={(newPipeId) => {
                                  if (newPipeId !== group.primaryPipelineId) {
                                    handleMoveGroup(group.id, newPipeId);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8 w-[180px] text-xs">
                                  <div className="flex items-center gap-2"><ArrowRightLeft className="w-3 h-3 text-muted-foreground" /> <SelectValue /></div>
                                </SelectTrigger>
                                <SelectContent>
                                  {primaryPipelines.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setGroupToDelete({ id: group.id, name: group.name })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>


                          {secondaryPipelines.length > 0 && (
                            <div className="pt-2 border-t border-border">
                              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Secondary Pipelines</div>
                              <div className="flex flex-wrap gap-2">
                                {secondaryPipelines.map(sp => {
                                  const isActive = group.secondaryPipelineIds.includes(sp.id);
                                  return (
                                    <button
                                      key={sp.id}
                                      onClick={() => handleToggleSecondary(group.id, sp.id, group.secondaryPipelineIds)}
                                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${isActive
                                        ? 'bg-primary/15 border-primary/50 text-primary'
                                        : 'bg-surface-1 border-border text-muted-foreground hover:border-primary/30'
                                        }`}
                                    >
                                      {sp.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Delete Group Confirmation Dialog */}
                <Dialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Group: {groupToDelete?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm text-muted-foreground">Are you sure you want to delete this owner group? This action cannot be undone.</p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setGroupToDelete(null)}>Cancel</Button>
                      <Button variant="destructive" onClick={async () => {
                        if (groupToDelete) {
                          await deleteGroup(groupToDelete.id);
                          setGroupToDelete(null);
                          toast.success('Group deleted');
                        }
                      }}>Delete</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>


              </Tabs>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-full text-muted-foreground text-sm font-mono"
            >
              Select a pipeline to view details
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div >
  );
}
