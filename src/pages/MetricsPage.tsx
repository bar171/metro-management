import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { MetricType } from '@/types';

const METRIC_CONFIGS: { type: MetricType; label: string; color: string; unit: string }[] = [
  { type: 'kafka_lag', label: 'Kafka Consumer Lag', color: 'hsl(210, 100%, 55%)', unit: 'msgs' },
  { type: 'throughput', label: 'Throughput', color: 'hsl(172, 66%, 50%)', unit: 'msg/s' },
  { type: 'cpu_usage', label: 'CPU Usage', color: 'hsl(38, 92%, 50%)', unit: '%' },
  { type: 'memory_usage', label: 'Memory Usage', color: 'hsl(0, 72%, 51%)', unit: '%' },
  { type: 'db_connections', label: 'DB Connections', color: 'hsl(262, 60%, 55%)', unit: 'conn' },
  { type: 'error_rate', label: 'Error Rate', color: 'hsl(0, 72%, 60%)', unit: '%' },
];

export default function MetricsPage() {
  const { pipelines, services, metrics, appendMetric, refreshMetrics } = useAppStore();
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  // Reset service filter when pipeline changes
  useEffect(() => {
    setServiceFilter('all');
  }, [pipelineFilter]);

  const activeServices = useMemo(() => {
    if (pipelineFilter === 'all') return [];
    return services.filter(s => s.pipelineId === pipelineFilter);
  }, [services, pipelineFilter]);

  // Live simulation
  useEffect(() => {
    const interval = setInterval(async () => {
      const targetPipelines = pipelineFilter === 'all' ? pipelines : pipelines.filter(a => a.id === pipelineFilter);
      for (const pipeline of targetPipelines) {
        const pipeServices = services.filter(s => s.pipelineId === pipeline.id);
        const targetServices = serviceFilter === 'all' ? pipeServices : pipeServices.filter(s => s.id === serviceFilter);

        for (const svc of targetServices) {
          for (const mc of METRIC_CONFIGS) {
            let value: number;
            switch (mc.type) {
              case 'kafka_lag': value = Math.floor(Math.random() * 15000); break;
              case 'throughput': value = 500 + Math.floor(Math.random() * 4500); break;
              case 'cpu_usage': value = 20 + Math.floor(Math.random() * 70); break;
              case 'memory_usage': value = 30 + Math.floor(Math.random() * 60); break;
              case 'db_connections': value = 10 + Math.floor(Math.random() * 90); break;
              case 'error_rate': value = Math.random() * 5; break;
            }
            await appendMetric({
              pipelineId: pipeline.id,
              serviceId: svc.id,
              type: mc.type,
              value: Math.round(value * 100) / 100,
              timestamp: new Date().toISOString(),
            });

            // Memory pressure check
            if (mc.type === 'memory_usage' && value > 85) {
              toast.warning(`Memory Pressure on ${svc.name}`, {
                description: `Memory at ${Math.round(value)}% in Pipeline ${pipeline.name}`,
              });
            }
          }
        }
      }
      await refreshMetrics();
    }, 3000);
    return () => clearInterval(interval);
  }, [pipelines, services, pipelineFilter, serviceFilter]);

  const getChartData = useCallback((type: MetricType) => {
    let filtered = metrics.filter(m => m.type === type);
    if (pipelineFilter !== 'all') {
      filtered = filtered.filter(m => m.pipelineId === pipelineFilter);
      if (serviceFilter !== 'all') {
        filtered = filtered.filter(m => m.serviceId === serviceFilter);
      }
    }

    // Group by timestamp (bucketed to nearest ~5s for aggregation)
    const grouped = new Map<string, number[]>();
    filtered.forEach(m => {
      // Normalize time to a stable bucket string (hour:minute:second rounded to 5s)
      const d = new Date(m.timestamp);
      d.setSeconds(Math.floor(d.getSeconds() / 5) * 5);
      const key = d.toLocaleTimeString();

      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(m.value);
    });

    return Array.from(grouped.entries())
      .map(([time, values]) => {
        let aggValue = 0;
        // Logic constraint: CPU/Mem/Error percentages should be averaged when global.
        // Throughput/DB Connections/Lag should be summed when global.
        const isSumType = ['throughput', 'db_connections', 'kafka_lag'].includes(type);

        if (isSumType) {
          aggValue = values.reduce((sum, v) => sum + v, 0);
        } else {
          aggValue = values.reduce((sum, v) => sum + v, 0) / values.length;
        }

        return {
          time,
          value: Math.round(aggValue * 100) / 100,
        };
      })
      .slice(-20); // Maintain max 20 data points on chart
  }, [metrics, pipelineFilter, serviceFilter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Metrics</h2>
          <p className="text-xs text-muted-foreground font-mono">Live system telemetry · Refreshing every 3s</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
          <span className="text-xs text-muted-foreground mr-2">LIVE</span>
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

          {pipelineFilter !== 'all' && (
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="h-8 w-56 text-xs bg-surface-1 border-primary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-semibold text-primary">All Services</SelectItem>
                {activeServices.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {METRIC_CONFIGS.map((mc, i) => {
          const data = getChartData(mc.type);
          const lastValue = data[data.length - 1]?.value ?? 0;
          return (
            <motion.div
              key={mc.type}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium">{mc.label}</span>
                <span className="font-mono text-sm font-bold tabular-nums">
                  {lastValue.toLocaleString()} <span className="text-muted-foreground text-[10px]">{mc.unit}</span>
                </span>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id={`grad-${mc.type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={mc.color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={mc.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={35} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke={mc.color} fill={`url(#grad-${mc.type})`} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
