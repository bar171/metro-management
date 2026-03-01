import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { StatusDot, PriorityBadge, EnvBadge } from '@/components/shared/StatusIndicators';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Server, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Axis, ServiceStatus } from '@/types';

export default function AxesPage() {
  const { axes, customers, services, selectedAxisId, setSelectedAxisId, envFilter, updateService, updateCustomer } = useAppStore();
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredAxes = useMemo(() => {
    let result = axes;
    if (envFilter !== 'all') result = result.filter(a => a.environment === envFilter);
    if (search) result = result.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [axes, envFilter, search]);

  const selected = useMemo(() => axes.find(a => a.id === selectedAxisId), [axes, selectedAxisId]);
  const axisCustomers = useMemo(() => customers.filter(c => c.axisId === selectedAxisId), [customers, selectedAxisId]);
  const axisServices = useMemo(() => services.filter(s => s.axisId === selectedAxisId), [services, selectedAxisId]);

  const getAxisHealth = (axisId: string): ServiceStatus => {
    const svcs = services.filter(s => s.axisId === axisId);
    if (svcs.some(s => s.status === 'lagging')) return 'lagging';
    if (svcs.some(s => s.status === 'degraded')) return 'degraded';
    return 'healthy';
  };

  const handleScaleReplicas = async (serviceId: string, replicas: number) => {
    const svc = services.find(s => s.id === serviceId);
    if (!svc) return;
    const axis = axes.find(a => a.id === svc.axisId);
    if (axis?.priority === 'critical' && replicas === 0) {
      toast.error('Cannot scale to 0 on critical axis');
      return;
    }
    setSaving(true);
    await updateService(serviceId, { replicas });
    setSaving(false);
    toast.success(`Scaled to ${replicas} replicas`);
  };

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Left Pane */}
      <div className="w-72 border-r border-border bg-card/50 flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search axes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-surface-1"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar">
          {filteredAxes.map(axis => (
            <button
              key={axis.id}
              onClick={() => setSelectedAxisId(axis.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-border hover:bg-surface-1 transition-colors flex items-center gap-3 ${
                selectedAxisId === axis.id ? 'bg-surface-2 border-l-2 border-l-primary' : ''
              }`}
            >
              <StatusDot status={getAxisHealth(axis.id)} pulse />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{axis.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <EnvBadge env={axis.environment} />
                  <PriorityBadge priority={axis.priority} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Pane */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <StatusDot status={getAxisHealth(selected.id)} pulse className="w-3 h-3" />
                <h2 className="text-xl font-bold">{selected.name}</h2>
                <EnvBadge env={selected.environment} />
                <PriorityBadge priority={selected.priority} />
              </div>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-surface-1">
                  <TabsTrigger value="overview" className="text-xs gap-1.5"><Server className="h-3.5 w-3.5" />Overview</TabsTrigger>
                  <TabsTrigger value="scaling" className="text-xs gap-1.5"><Settings2 className="h-3.5 w-3.5" />Resource Scaling</TabsTrigger>
                  <TabsTrigger value="customers" className="text-xs gap-1.5"><Users className="h-3.5 w-3.5" />Customers</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg border border-border bg-card p-3">
                      <span className="text-muted-foreground font-mono text-[10px] uppercase">Kafka Cluster</span>
                      <p className="font-mono mt-1">{selected.kafkaCluster}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <span className="text-muted-foreground font-mono text-[10px] uppercase">Database</span>
                      <p className="font-mono mt-1">{selected.databaseInstance}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <span className="text-muted-foreground font-mono text-[10px] uppercase">Customers</span>
                      <p className="font-mono mt-1">{axisCustomers.length}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card">
                    <div className="px-4 py-2.5 border-b border-border text-sm font-medium">Services</div>
                    <div className="divide-y divide-border">
                      {axisServices.map(svc => (
                        <div key={svc.id} className="px-4 py-2.5 flex items-center gap-3 text-xs">
                          <StatusDot status={svc.status} pulse />
                          <span className="font-mono font-medium w-28">{svc.name}</span>
                          <span className="text-muted-foreground">{svc.replicas} replicas</span>
                          <span className="text-muted-foreground">CPU: {svc.cpuLimit}</span>
                          <span className="text-muted-foreground">Mem: {svc.memoryLimit}</span>
                          <Badge variant={svc.status === 'healthy' ? 'default' : 'destructive'} className="ml-auto text-[10px]">
                            {svc.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="scaling" className="space-y-4">
                  {axisServices.map(svc => (
                    <div key={svc.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusDot status={svc.status} pulse />
                          <span className="font-mono font-medium text-sm">{svc.name}</span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">{svc.replicas} replicas</span>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground">Replicas</label>
                        <Slider
                          value={[svc.replicas]}
                          min={0}
                          max={16}
                          step={1}
                          onValueCommit={([v]) => handleScaleReplicas(svc.id, v)}
                          className="w-full"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                          <span>0</span><span>16</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="customers" className="space-y-3">
                  <p className="text-xs text-muted-foreground">Customers mapped to this axis:</p>
                  {axisCustomers.length === 0 ? (
                    <p className="text-xs text-muted-foreground font-mono italic">No customers assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {axisCustomers.map(c => (
                        <div key={c.id} className="rounded-lg border border-border bg-card px-4 py-3 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-medium">{c.name}</span>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px]">Vol: {c.dataVolumeLevel}</Badge>
                              <Badge variant="outline" className="text-[10px]">Crit: {c.streamCriticality}</Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] h-7"
                            onClick={async () => {
                              await updateCustomer(c.id, { axisId: '' });
                              toast.info(`Unassigned ${c.name}`);
                            }}
                          >
                            Unassign
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-full text-muted-foreground text-sm font-mono"
            >
              Select an axis to view details
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
