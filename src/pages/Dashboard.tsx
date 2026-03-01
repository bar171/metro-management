import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { KpiTile, SeverityBadge } from '@/components/shared/StatusIndicators';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Zap, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { axes, services, metrics, logs, loading, envFilter } = useAppStore();

  const filteredAxes = useMemo(() => {
    if (envFilter === 'all') return axes;
    return axes.filter(a => a.environment === envFilter);
  }, [axes, envFilter]);

  const totalPods = useMemo(() =>
    services.filter(s => filteredAxes.some(a => a.id === s.axisId)).reduce((sum, s) => sum + s.replicas, 0),
    [services, filteredAxes]);

  const avgKafkaLag = useMemo(() => {
    const lagMetrics = metrics.filter(m => m.type === 'kafka_lag' && filteredAxes.some(a => a.id === m.axisId));
    if (!lagMetrics.length) return 0;
    const latest = new Map<string, number>();
    lagMetrics.forEach(m => latest.set(m.axisId, m.value));
    const values = Array.from(latest.values());
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [metrics, filteredAxes]);

  const dbConnections = useMemo(() => {
    const dbMetrics = metrics.filter(m => m.type === 'db_connections');
    if (!dbMetrics.length) return 0;
    const latest = new Map<string, number>();
    dbMetrics.forEach(m => latest.set(m.axisId, m.value));
    return Array.from(latest.values()).reduce((a, b) => a + b, 0);
  }, [metrics]);

  const criticalLogs = useMemo(() =>
    logs.filter(l => l.severity !== 'info').slice(0, 15),
    [logs]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><span className="font-mono text-muted-foreground">Loading...</span></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Executive Overview</h2>
        <p className="text-xs text-muted-foreground font-mono">Real-time ETL infrastructure status</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <KpiTile label="Total Axes" value={filteredAxes.length} subtitle={`${axes.filter(a => a.priority === 'critical').length} critical`} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <KpiTile label="Total Pods" value={totalPods} variant="accent" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <KpiTile label="Avg Kafka Lag" value={avgKafkaLag.toLocaleString()} variant={avgKafkaLag > 8000 ? 'warning' : 'default'} subtitle="messages" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <KpiTile label="DB Connections" value={dbConnections} />
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Live Feed */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">Live Alert Feed</span>
            <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
          </div>
          <div className="max-h-80 overflow-auto custom-scrollbar divide-y divide-border">
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

        {/* Quick Actions */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <span className="text-sm font-medium">Quick Actions</span>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-xs h-9"
              onClick={() => toast.success('Scaling all high-priority axes...', { description: 'This is a simulated action.' })}
            >
              <Zap className="h-3.5 w-3.5 text-status-degraded" />
              Scale All High-Priority Axes
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-xs h-9"
              onClick={() => toast.info('Rolling stale pods...', { description: 'Simulating pod restart across all axes.' })}
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary" />
              Roll Stale Pods
            </Button>
          </div>

          <div className="pt-3 border-t border-border">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">System Health</span>
            <div className="mt-2 space-y-1.5">
              {['Kafka Cluster 1', 'Kafka Cluster 2', 'PG Instance 1'].map((sys, i) => (
                <div key={sys} className="flex items-center justify-between text-xs">
                  <span className="font-mono">{sys}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-healthy" />
                    <span className="text-muted-foreground">OK</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
