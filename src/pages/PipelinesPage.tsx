import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { StatusDot, PriorityBadge, EnvBadge, TypeBadge } from '@/components/shared/StatusIndicators';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Server, Settings2, Plus, Trash2, ArrowRightLeft, RotateCcw } from 'lucide-react';
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
    pipelines, groups, services,
    selectedPipelineId, setSelectedPipelineId, envFilter,
    updateService, updatePipelineResources,
    createPipeline, deletePipeline,
    createGroup, updateGroup
  } = useAppStore();

  const [search, setSearch] = useState('');

  // Pipeline Creation State
  const [isCreatePipelineOpen, setIsCreatePipelineOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineType, setNewPipelineType] = useState<PipelineType>('BASIC');
  const [newPipelineEnv, setNewPipelineEnv] = useState<Environment>('dev');

  // Group Creation State
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Delete Pipeline State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const filteredPipelines = useMemo(() => {
    let result = pipelines;
    if (envFilter !== 'all') result = result.filter(a => a.environment === envFilter);
    if (search) result = result.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [pipelines, envFilter, search]);

  const selected = useMemo(() => pipelines.find(a => a.id === selectedPipelineId), [pipelines, selectedPipelineId]);
  const pipelineServices = useMemo(() => services.filter(s => s.pipelineId === selectedPipelineId), [services, selectedPipelineId]);
  const pipelineGroups = useMemo(() => groups.filter(g => g.pipelineId === selectedPipelineId), [groups, selectedPipelineId]);

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
      environment: newPipelineEnv,
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
      pipelineId: selected.id
    });
    setNewGroupName('');
    setIsCreateGroupOpen(false);
    toast.success('Owner Group created');
  };

  const handleMoveGroup = async (groupId: string, newPipelineId: string) => {
    await updateGroup(groupId, { pipelineId: newPipelineId });
    toast.success('Group moved to another pipeline');
  };

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Left Pane */}
      <div className="w-80 border-r border-border bg-card/50 flex flex-col shrink-0">
        <div className="p-3 border-b border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Pipelines</h3>
            <Dialog open={isCreatePipelineOpen} onOpenChange={setIsCreatePipelineOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
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
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Environment</label>
                      <Select value={newPipelineEnv} onValueChange={(v) => setNewPipelineEnv(v as Environment)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dev">dev</SelectItem>
                          <SelectItem value="prod">prod</SelectItem>
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
            const groupsForPipe = groups.filter(g => g.pipelineId === pipeline.id);
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
                    <EnvBadge env={pipeline.environment} />
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
                      <EnvBadge env={selected.environment} />
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

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-surface-1">
                  <TabsTrigger value="overview" className="text-xs gap-1.5"><Server className="h-3.5 w-3.5" />Overview</TabsTrigger>
                  <TabsTrigger value="groups" className="text-xs gap-1.5"><Users className="h-3.5 w-3.5" />Owner Groups</TabsTrigger>
                  <TabsTrigger value="workloads" className="text-xs gap-1.5"><Settings2 className="h-3.5 w-3.5" />Workloads</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-lg border border-border bg-card p-3">
                      <span className="text-muted-foreground font-mono text-[10px] uppercase">Kafka Cluster</span>
                      <p className="font-mono mt-1">{selected.kafkaCluster}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <span className="text-muted-foreground font-mono text-[10px] uppercase">Database</span>
                      <p className="font-mono mt-1">{selected.databaseInstance}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <span className="text-muted-foreground font-mono text-[10px] uppercase">Owner Groups</span>
                      <p className="font-mono mt-1">{pipelineGroups.length}</p>
                    </div>

                  </div>

                  <div className="rounded-lg border border-border bg-card">
                    <div className="px-4 py-2.5 border-b border-border text-sm font-medium flex justify-between items-center">
                      Services Map
                    </div>
                    <div className="divide-y divide-border">
                      {pipelineServices.map(svc => (
                        <div key={svc.id} className="px-4 py-3 flex items-center gap-4 text-xs">
                          <StatusDot status={svc.status} pulse />
                          <span className="font-mono font-medium w-40">{svc.name}</span>
                          <span className="text-muted-foreground w-20">{svc.replicas} replicas</span>
                          <span className="text-muted-foreground w-24">CPU: {svc.cpuLimit}m</span>
                          <span className="text-muted-foreground w-24">Mem: {svc.memoryLimit}Mi</span>
                          <Badge variant={svc.status === 'healthy' ? 'default' : 'destructive'} className="ml-auto text-[10px] font-mono tracking-wide">
                            {svc.status}
                          </Badge>
                        </div>
                      ))}
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
                        <div key={group.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                          <div>
                            <div className="font-medium">{group.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-1">
                              Last active: {new Date(group.lastActive).toUTCString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Select
                              value={group.pipelineId}
                              onValueChange={(newPipeId) => {
                                if (newPipeId !== group.pipelineId) {
                                  handleMoveGroup(group.id, newPipeId);
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 w-[180px] text-xs">
                                <div className="flex items-center gap-2"><ArrowRightLeft className="w-3 h-3 text-muted-foreground" /> <SelectValue /></div>
                              </SelectTrigger>
                              <SelectContent>
                                {pipelines.map(p => (
                                  <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="workloads" className="space-y-6">
                  {/* Pipeline Level Resource Allocation */}
                  <div className="rounded-lg border border-border bg-card p-5 space-y-6">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                      <Settings2 className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold">Global Pipeline Resources</h3>
                      <Badge variant="secondary" className="ml-auto text-[10px] uppercase font-mono tracking-wide bg-surface-2 text-muted-foreground border-none">
                        Auto-Distributed
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Pipeline CPU */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Total CPU Allocation</label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={selected.totalCpuLimit}
                              onChange={(e) => updatePipelineResources(selected.id, Number(e.target.value) || 0, selected.totalMemoryLimit)}
                              className="h-7 w-20 text-xs font-mono px-2"
                            />
                            <span className="text-[10px] text-muted-foreground font-mono">m</span>
                          </div>
                        </div>
                        <Slider
                          value={[selected.totalCpuLimit]}
                          min={1000}
                          max={32000}
                          step={500}
                          onValueChange={([v]) => updatePipelineResources(selected.id, v, selected.totalMemoryLimit)}
                          className="w-full"
                        />
                        <div className="text-[10px] text-muted-foreground font-mono flex justify-between">
                          <span>1000m</span>
                          <span>32000m</span>
                        </div>
                      </div>

                      {/* Pipeline Memory */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Total Memory Allocation</label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={selected.totalMemoryLimit}
                              onChange={(e) => updatePipelineResources(selected.id, selected.totalCpuLimit, Number(e.target.value) || 0)}
                              className="h-7 w-20 text-xs font-mono px-2"
                            />
                            <span className="text-[10px] text-muted-foreground font-mono">Mi</span>
                          </div>
                        </div>
                        <Slider
                          value={[selected.totalMemoryLimit]}
                          min={1024}
                          max={65536}
                          step={1024}
                          onValueChange={([v]) => updatePipelineResources(selected.id, selected.totalCpuLimit, v)}
                          className="w-full"
                        />
                        <div className="text-[10px] text-muted-foreground font-mono flex justify-between">
                          <span>1024Mi</span>
                          <span>65536Mi</span>
                        </div>
                      </div>
                    </div>
                  </div>

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
                              toast.info(`Rolling out ${svc.name}...`, { description: 'Deployment restart initiated.' });
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
                            <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-surface-1">{svc.replicas} / 16</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 p-2 rounded bg-surface-1/50 border border-border min-h-[36px]">
                            {Array.from({ length: svc.replicas }).map((_, i) => (
                              <div key={i} className={`w-3 h-3 rounded-full ${svc.status === 'healthy' ? 'bg-status-healthy' : 'bg-status-degraded'} shadow-[0_0_8px_rgba(0,0,0,0.2)]`} title={`Pod ${i + 1}`} />
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

                        {/* Readonly CPU/Mem distribution view */}
                        <div className="flex items-center justify-between pt-2 border-t border-border mt-4">
                          <div className="text-[10px] font-mono text-muted-foreground group relative cursor-help">
                            Current Limit: <span className="text-foreground">{svc.cpuLimit}m</span> CPU / <span className="text-foreground">{svc.memoryLimit}Mi</span> Mem
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded border border-border">
                              These resources are automatically managed by the parent pipeline's global allocation.
                            </div>
                          </div>
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
    </div>
  );
}
