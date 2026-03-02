import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { StatusDot, PriorityBadge, EnvBadge, TypeBadge } from '@/components/shared/StatusIndicators';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Server, Settings2, Plus, Trash2, ArrowRightLeft, RotateCcw, ArrowRight, HardDrive } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Pipeline, ServiceStatus, PipelineType, Environment, Priority } from '@/types';

export default function PipelinesPage() {
  const {
    pipelines, groups, services,
    selectedPipelineId, setSelectedPipelineId, envFilter,
    updateService,
    createPipeline, deletePipeline,
    createGroup, updateGroup, deleteGroup
  } = useAppStore();

  const [search, setSearch] = useState('');

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

  const filteredPipelines = useMemo(() => {
    let result = pipelines;
    if (envFilter !== 'all') result = result.filter(a => a.environment === envFilter);
    if (search) result = result.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [pipelines, envFilter, search]);

  const selected = useMemo(() => pipelines.find(a => a.id === selectedPipelineId), [pipelines, selectedPipelineId]);
  const pipelineServices = useMemo(() => services.filter(s => s.pipelineId === selectedPipelineId), [services, selectedPipelineId]);
  const pipelineGroups = useMemo(() => groups.filter(g => g.primaryPipelineId === selectedPipelineId || g.secondaryPipelineIds.includes(selectedPipelineId || '')), [groups, selectedPipelineId]);

  const getPipelineHealth = (pipelineId: string): ServiceStatus => {
    const svcs = services.filter(s => s.pipelineId === pipelineId);
    if (svcs.some(s => s.status === 'lagging')) return 'lagging';
    if (svcs.some(s => s.status === 'degraded')) return 'degraded';
    return 'healthy';
  };



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
      etlDailyTransportMaxSizeGb: 15
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
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search pipelines..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-surface-1"
            />
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
                  <div className="text-sm font-medium truncate">{pipeline.name}</div>
                  <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                    <TypeBadge type={pipeline.type} />
                    <PriorityBadge priority={pipeline.priority} />
                  </div>
                  {groupsForPipe.length > 0 && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 truncate">
                      <Users className="w-3 h-3 inline" />
                      {groupsForPipe.map(g => g.name).join(', ')}
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
              className="p-6 pb-24"
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
                        Owned by: <span className="font-medium text-foreground">{pipelineGroups.map(g => g.name).join(', ')}</span>
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
                            <strong>Warning:</strong> This pipeline has {pipelineGroups.length} associated owner group(s). You must move them to another pipeline or delete them before deleting this pipeline.
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
                  <TabsTrigger value="groups" className="text-xs gap-1.5"><Users className="h-3.5 w-3.5" />Owner Groups</TabsTrigger>
                  <TabsTrigger value="workloads" className="text-xs gap-1.5"><Settings2 className="h-3.5 w-3.5" />Workloads</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs items-stretch">
                    <div className="rounded-lg border border-border bg-card p-3 flex flex-col justify-center">
                      <span className="text-muted-foreground font-mono text-[10px] uppercase">Kafka Cluster</span>
                      <p className="font-mono mt-1">{selected.kafkaCluster}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3 flex flex-col justify-center">
                      <span className="text-muted-foreground font-mono text-[10px] uppercase">Database</span>
                      <p className="font-mono mt-1">{selected.databaseInstance}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3 flex flex-col justify-center">
                      <span className="text-muted-foreground font-mono text-[10px] uppercase">Owner Groups</span>
                      <p className="font-mono mt-1">{pipelineGroups.length}</p>
                    </div>

                  </div>

                  <div className="rounded-lg border border-border bg-card">
                    <div className="px-5 py-3.5 border-b border-border text-sm font-semibold flex justify-between items-center text-foreground uppercase tracking-wider">
                      Metro Microservices Flow
                    </div>
                    <div className="overflow-x-auto overflow-y-hidden relative w-full custom-scrollbar h-[550px] bg-surface-1/5">
                      <div className="min-w-[1450px] h-[550px] relative">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
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
                            <path d="M 190 110 L 475 110 L 475 190 L 520 190" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />
                          )}

                          {/* kafka-consumer -> python-validate */}
                          {pipelineServices.some(s => s.name === 'kafka-consumer') && (
                            <path d="M 190 190 L 520 190" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />
                          )}

                          {/* scheduler -> get-data */}
                          {pipelineServices.some(s => s.name === 'scheduler') && (
                            <path d="M 190 270 L 280 270" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />
                          )}

                          {/* get-data -> python-validate */}
                          <path d="M 430 270 L 475 270 L 475 190 L 520 190" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />

                          {/* Python Validate -> Transform Data/External Transform and Publish */}
                          {pipelineServices.some(s => s.name === 'external-transform' || s.name === 'transform-data') ? (
                            <>
                              {/* Validate -> Transform Data */}
                              {pipelineServices.some(s => s.name === 'transform-data') && (
                                <path d="M 670 190 L 760 190" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />
                              )}

                              {/* Validate -> External Transform */}
                              {pipelineServices.some(s => s.name === 'external-transform') && (
                                <path d="M 670 190 L 715 190 L 715 110 L 760 110" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />
                              )}

                              {/* Bypass: Validate -> Common junction point before parallel split */}
                              <path d="M 670 190 L 715 190 L 715 240 L 910 240 L 910 190" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" />

                              {/* External Transform Loop Back -> Python Validate */}
                              {pipelineServices.some(s => s.name === 'external-transform') && (
                                <path d="M 835 80 L 835 40 L 595 40 L 595 154" stroke="currentColor" fill="none" strokeWidth="2" className="text-blue-500/60" markerEnd="url(#arrow-blue)" />
                              )}

                              {/* Transform Data -> Junction point */}
                              {pipelineServices.some(s => s.name === 'transform-data') && (
                                <path d="M 910 190 L 910 190" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" />
                              )}
                            </>
                          ) : (
                            /* Directly Validate -> Junction point if no transform */
                            <path d="M 670 190 L 910 190" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" />
                          )}

                          {/* Python Validate -> Informative Validation (Invalid) */}
                          <path d="M 595 220 L 595 274" stroke="currentColor" fill="none" strokeWidth="2" className="text-status-critical/60" markerEnd="url(#arrow-red)" />
                          <text x="605" y="250" className="text-[10px] fill-status-critical/80 font-mono font-bold tracking-widest">INVALID</text>

                          {/* Parallel Split from Junction Point (910, 190) */}
                          <path d="M 910 190 L 955 190 L 955 110 L 1000 110" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />
                          <path d="M 910 190 L 955 190 L 955 270 L 1000 270" stroke="currentColor" fill="none" strokeWidth="2" className="text-muted-foreground/40" markerEnd="url(#arrow)" />
                        </svg>

                        {/* Rendering Nodes Helper */}
                        {(() => {
                          const renderNode = (name: string, x: number, y: number) => {
                            const svc = pipelineServices.find(s => s.name === name);

                            const nodeContent = (
                              <div
                                className={`absolute rounded-md border flex flex-col justify-center gap-1.5 p-2 cursor-pointer
                                  ${svc ? (svc.status === 'degraded' ? 'bg-status-critical/10 border-status-critical/50 shadow-[0_0_15px_rgba(255,0,0,0.15)]' :
                                    svc.status === 'lagging' ? 'bg-status-warning/10 border-status-warning/50' :
                                      'bg-card border-border shadow-sm') : 'bg-surface-1/30 border-dashed border-border/50 opacity-60'
                                  } z-10 transition-colors hover:border-primary/50`}
                                style={{ left: x, top: y, width: 150, height: 60 }}
                              >
                                <div className="flex items-center gap-2">
                                  {svc ? <StatusDot status={svc.status} pulse /> : <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                                  <span className="font-mono text-[11px] font-bold truncate text-foreground" title={name}>{name}</span>
                                </div>
                                {svc && (
                                  <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                                    <span>{svc.replicas} pods</span>
                                    <span>{svc.cpuLimit}m</span>
                                  </div>
                                )}
                              </div>
                            );

                            if (!svc) return <div key={name}>{nodeContent}</div>;

                            return (
                              <Popover key={name}>
                                <PopoverTrigger asChild>
                                  {nodeContent}
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-4 space-y-4" side="top">
                                  <div className="flex items-center gap-2 border-b border-border pb-2">
                                    <StatusDot status={svc.status} pulse />
                                    <h4 className="font-mono font-bold text-sm">{svc.name}</h4>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Pods</label>
                                        <span className="font-mono text-[10px] text-muted-foreground">{svc.replicas} / 16</span>
                                      </div>
                                      <Slider
                                        value={[svc.replicas]}
                                        min={0}
                                        max={16}
                                        step={1}
                                        onValueChange={([v]) => updateService(svc.id, { replicas: v })}
                                      />
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-border">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">CPU Limit</label>
                                        <Input
                                          type="number"
                                          value={svc.cpuLimit}
                                          onChange={e => updateService(svc.id, { cpuLimit: Number(e.target.value) || 10 })}
                                          className="h-6 w-16 text-[10px] font-mono px-1.5"
                                        />
                                      </div>
                                      <Slider
                                        value={[svc.cpuLimit]}
                                        min={100}
                                        max={4000}
                                        step={100}
                                        onValueChange={([v]) => updateService(svc.id, { cpuLimit: v })}
                                      />
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-border">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Mem Limit (Mi)</label>
                                        <Input
                                          type="number"
                                          value={svc.memoryLimit}
                                          onChange={e => updateService(svc.id, { memoryLimit: Number(e.target.value) || 16 })}
                                          className="h-6 w-16 text-[10px] font-mono px-1.5"
                                        />
                                      </div>
                                      <Slider
                                        value={[svc.memoryLimit]}
                                        min={128}
                                        max={8192}
                                        step={128}
                                        onValueChange={([v]) => updateService(svc.id, { memoryLimit: v })}
                                      />
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            );
                          };
                          return (
                            <>
                              {/* Sources */}
                              {pipelineServices.some(s => s.name === 'push-data') && renderNode('push-data', 40, 80)}
                              {pipelineServices.some(s => s.name === 'kafka-consumer') && renderNode('kafka-consumer', 40, 160)}
                              {pipelineServices.some(s => s.name === 'scheduler') && renderNode('scheduler', 40, 240)}

                              {/* Get Data */}
                              {renderNode('get-data', 280, 240)}
                              {/* Validate */}
                              {renderNode('python-validate', 520, 160)}
                              {renderNode('informative-validation', 520, 280)}

                              {/* Transform (Optional) */}
                              {pipelineServices.some(s => s.name === 'external-transform' || s.name === 'transform-data') && (
                                <>
                                  {pipelineServices.some(s => s.name === 'external-transform') && renderNode('external-transform', 760, 80)}
                                  {pipelineServices.some(s => s.name === 'transform-data') && renderNode('transform-data', 760, 160)}
                                </>
                              )}

                              {/* Publish & Sink (Parallel) */}
                              {renderNode('publish', 1000, 80)}
                              {renderNode('sink-data', 1000, 240)}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="groups" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Pipeline Owner Groups</h3>
                    <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2"><Plus className="w-3.5 h-3.5" /> Add Group</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign New Owner Group</DialogTitle>
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
                              <div className="text-[10px] text-muted-foreground font-mono mt-1">
                                Last active: {new Date(group.lastActive).toUTCString()}
                              </div>
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

                          <div className="pt-2 border-t border-border space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                                <HardDrive className="w-3 h-3" />
                                ETL Daily Transport Max Size
                              </div>
                              <span className="text-xs font-mono font-bold text-primary">{group.etlDailyTransportMaxSizeGb} GB</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <Slider
                                value={[group.etlDailyTransportMaxSizeGb]}
                                min={1}
                                max={100}
                                step={1}
                                className="flex-1"
                                onValueChange={([val]) => updateGroup(group.id, { etlDailyTransportMaxSizeGb: val })}
                              />
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
                                      className={`px - 3 py - 1.5 rounded - md text - xs font - medium border transition - all ${isActive
                                          ? 'bg-primary/15 border-primary/50 text-primary'
                                          : 'bg-surface-1 border-border text-muted-foreground hover:border-primary/30'
                                        } `}
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

                <TabsContent value="workloads" className="space-y-6">
                  {/* Individual Services */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {pipelineServices.map(svc => (
                      <div key={svc.id} className="rounded-lg border border-border bg-card p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <div className="flex items-center gap-2">
                            <StatusDot status={svc.status} pulse />
                            <span className="font-mono font-bold text-sm">{svc.name}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] gap-1.5 px-2.5"
                            onClick={() => {
                              toast.info(`Rolling out ${svc.name}...`, { description: 'Deployment rollout initiated.' });
                              updateService(svc.id, { status: 'degraded' });
                              setTimeout(() => updateService(svc.id, { status: 'healthy' }), 2000);
                            }}
                          >
                            <RotateCcw className="w-3 h-3" />
                            Rollout
                          </Button>
                        </div>

                        {/* Pods */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Active Pods</label>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="icon" className="h-5 w-5 rounded min-w-[20px] p-0 flex items-center justify-center" onClick={() => updateService(svc.id, { replicas: Math.max(0, svc.replicas - 1) })}>-</Button>
                              <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-surface-1 min-w-[40px] text-center">{svc.replicas} / 16</span>
                              <Button variant="outline" size="icon" className="h-5 w-5 rounded min-w-[20px] p-0 flex items-center justify-center" onClick={() => updateService(svc.id, { replicas: Math.min(16, svc.replicas + 1) })}>+</Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 p-2 rounded bg-surface-1/50 border border-border min-h-[36px]">
                            {Array.from({ length: svc.replicas }).map((_, i) => (
                              <div key={i} className={`w - 3 h - 3 rounded - full ${svc.status === 'healthy' ? 'bg-status-healthy' : 'bg-status-degraded'} shadow - [0_0_8px_rgba(0, 0, 0, 0.2)]`} title={`Pod ${i + 1} `} />
                            ))}
                            {svc.replicas === 0 && <span className="text-[10px] text-muted-foreground italic my-auto">Scaled to zero (0) pods.</span>}
                          </div>
                          <Slider
                            value={[svc.replicas]}
                            min={0}
                            max={16}
                            step={1}
                            onValueChange={([v]) => updateService(svc.id, { replicas: v })}
                            className="w-full pt-2"
                          />
                        </div>

                        {/* CPU Limit */}
                        <div className="space-y-2 mt-4 pt-4 border-t border-border">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">CPU Limit</label>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="icon" className="h-5 w-5 rounded min-w-[20px] p-0 flex items-center justify-center" onClick={() => updateService(svc.id, { cpuLimit: Math.max(100, svc.cpuLimit - 100) })}>-</Button>
                              <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-surface-1 min-w-[50px] text-center">{svc.cpuLimit}m</span>
                              <Button variant="outline" size="icon" className="h-5 w-5 rounded min-w-[20px] p-0 flex items-center justify-center" onClick={() => updateService(svc.id, { cpuLimit: Math.min(4000, svc.cpuLimit + 100) })}>+</Button>
                            </div>
                          </div>
                          <Slider
                            value={[svc.cpuLimit]}
                            min={100}
                            max={4000}
                            step={100}
                            onValueChange={([v]) => updateService(svc.id, { cpuLimit: v })}
                            className="w-full pt-1"
                          />
                        </div>

                        {/* Memory Limit */}
                        <div className="space-y-2 mt-4 pt-4 border-t border-border">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Memory Limit</label>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="icon" className="h-5 w-5 rounded min-w-[20px] p-0 flex items-center justify-center" onClick={() => updateService(svc.id, { memoryLimit: Math.max(128, svc.memoryLimit - 128) })}>-</Button>
                              <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-surface-1 min-w-[50px] text-center">{svc.memoryLimit}Mi</span>
                              <Button variant="outline" size="icon" className="h-5 w-5 rounded min-w-[20px] p-0 flex items-center justify-center" onClick={() => updateService(svc.id, { memoryLimit: Math.min(8192, svc.memoryLimit + 128) })}>+</Button>
                            </div>
                          </div>
                          <Slider
                            value={[svc.memoryLimit]}
                            min={128}
                            max={8192}
                            step={128}
                            onValueChange={([v]) => updateService(svc.id, { memoryLimit: v })}
                            className="w-full pt-1"
                          />
                        </div>

                      </div>
                    ))}
                  </div>
                </TabsContent>
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
