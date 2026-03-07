import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { KpiTile, SeverityBadge } from '@/components/shared/StatusIndicators';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Zap, Server, Cpu, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { mockOpenShiftApi, type ClusterMetrics } from '@/lib/openshift';

export default function Dashboard() {
  const { pipelines, services, metrics, logs, loading, envFilter } = useAppStore();
  const [clusterMetrics, setClusterMetrics] = useState<ClusterMetrics | null>(null);
  const [alertClickCount, setAlertClickCount] = useState(0);

  useEffect(() => {
    mockOpenShiftApi.getClusterMetrics().then(setClusterMetrics);
  }, []);

  const filteredPipelines = useMemo(() => {
    if (envFilter === 'all') return pipelines;
    return pipelines.filter(a => a.environment === envFilter);
  }, [pipelines, envFilter]);

  const totalPods = useMemo(() =>
    services.filter(s => filteredPipelines.some(a => a.id === s.pipelineId)).reduce((sum, s) => sum + s.replicas, 0),
    [services, filteredPipelines]);

  const avgKafkaLag = useMemo(() => {
    const lagMetrics = metrics.filter(m => m.type === 'kafka_lag' && filteredPipelines.some(a => a.id === m.pipelineId));
    if (!lagMetrics.length) return 0;
    const latest = new Map<string, number>();
    lagMetrics.forEach(m => latest.set(m.pipelineId, m.value));
    const values = Array.from(latest.values());
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [metrics, filteredPipelines]);

  const dbConnections = useMemo(() => {
    const dbMetrics = metrics.filter(m => m.type === 'db_connections');
    if (!dbMetrics.length) return 0;
    const latest = new Map<string, number>();
    dbMetrics.forEach(m => latest.set(m.pipelineId, m.value));
    return Array.from(latest.values()).reduce((a, b) => a + b, 0);
  }, [metrics]);

  const criticalLogs = useMemo(() =>
    logs.filter(l => l.severity !== 'info').slice(0, 15),
    [logs]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><span className="font-mono text-muted-foreground">Loading...</span></div>;
  }

  return (
    <div className="p-6 gap-6 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-semibold">Metro Overview</h2>
          <p className="text-xs text-muted-foreground font-mono">Real-time status</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <KpiTile
            label="Total Pipelines"
            value={filteredPipelines.length}
            subtitle={`${pipelines.filter(a => a.priority === 'critical').length} critical`}
            variant={pipelines.filter(a => a.priority === 'critical').length > 0 ? 'critical' : 'default'}
            icon={Activity}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <KpiTile label="Total Pods" value={totalPods} variant="accent" icon={Server} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <KpiTile label="Avg Kafka Lag" value={avgKafkaLag.toLocaleString()} variant={avgKafkaLag > 5000 ? 'warning' : 'default'} subtitle="messages" icon={Zap} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <KpiTile label="DB Connections" value={dbConnections} variant={dbConnections > 1000 ? 'warning' : 'default'} icon={Activity} />
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Live Feed */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
            <span
              className="text-sm font-medium cursor-pointer select-none transition-opacity"
              onClick={() => {
                setAlertClickCount(prev => {
                  const newCount = prev + 1;
                  if (newCount >= 3) {
                    toast.custom(() => (
                      <div className="flex items-center gap-5 bg-yellow-400 text-yellow-950 px-6 py-5 rounded-2xl shadow-[0_0_60px_rgba(250,204,21,0.6)] border-4 border-yellow-500 transform animate-in slide-in-from-top-8 duration-500">
                        <div className="text-5xl animate-bounce">⚠️</div>
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-2xl tracking-[0.2em] uppercase text-yellow-900 border-b border-yellow-500/50 pb-1 whitespace-nowrap">
                            Station Announcement
                          </span>
                          <span className="font-bold text-xl mt-1">
                            Emanuel, please step behind the yellow line! 🚇
                          </span>
                        </div>
                      </div>
                    ), {
                      duration: 6000,
                      position: 'top-center',
                    });
                    return 0;
                  }
                  return newCount;
                });
              }}
            >
              Live Alert Feed
            </span>
            <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar divide-y divide-border min-h-0">
            {criticalLogs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="px-4 py-2.5 flex items-start gap-3 text-xs hover:bg-surface-1 transition-colors"
              >
                <SeverityBadge severity={log.severity} />
                <span className="flex-1 font-mono leading-relaxed">{log.message}</span>
                <span className="text-muted-foreground font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Cluster Status (OpenShift) */}
        <div className="rounded-lg border border-border bg-card p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4 shrink-0">
            <span className="text-sm font-medium flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              OpenShift Cluster
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">Live</span>
          </div>

          {clusterMetrics ? (
            <div className="space-y-4 flex-1 overflow-auto custom-scrollbar pr-1 min-h-0">
              {/* Nodes */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Worker Nodes</span>
                </div>
                <span className="font-mono text-sm">{clusterMetrics.healthyNodes} / {clusterMetrics.nodes} <span className="text-xs text-status-healthy">Ready</span></span>
              </div>

              {/* CPU */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium"><Cpu className="w-3.5 h-3.5" /> CPU Usage</span>
                  <span className="font-mono">{Math.round((clusterMetrics.cpu.used / clusterMetrics.cpu.total) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${clusterMetrics.cpu.used / clusterMetrics.cpu.total > 0.8 ? 'bg-status-degraded' : 'bg-primary'}`}
                    style={{ width: `${(clusterMetrics.cpu.used / clusterMetrics.cpu.total) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground font-mono text-right">
                  {(clusterMetrics.cpu.used / 1000).toFixed(1)} / {clusterMetrics.cpu.total / 1000} Cores
                </div>
              </div>

              {/* Memory */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium"><Server className="w-3.5 h-3.5" /> Memory Usage</span>
                  <span className="font-mono">{Math.round((clusterMetrics.memory.used / clusterMetrics.memory.total) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${clusterMetrics.memory.used / clusterMetrics.memory.total > 0.8 ? 'bg-status-degraded' : 'bg-status-healthy'}`}
                    style={{ width: `${(clusterMetrics.memory.used / clusterMetrics.memory.total) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground font-mono text-right">
                  {Math.round(clusterMetrics.memory.used / 1024)} / {Math.round(clusterMetrics.memory.total / 1024)} GB
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-mono text-muted-foreground animate-pulse">
              Fetching OpenShift metrics...
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
