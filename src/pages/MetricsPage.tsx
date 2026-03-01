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
  const { axes, metrics, appendMetric, refreshMetrics } = useAppStore();
  const [axisFilter, setAxisFilter] = useState<string>('all');

  // Live simulation
  useEffect(() => {
    const interval = setInterval(async () => {
      const targetAxes = axisFilter === 'all' ? axes : axes.filter(a => a.id === axisFilter);
      for (const axis of targetAxes) {
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
            axisId: axis.id,
            type: mc.type,
            value: Math.round(value * 100) / 100,
            timestamp: new Date().toISOString(),
          });

          // Memory pressure check
          if (mc.type === 'memory_usage' && value > 85) {
            toast.warning(`Memory Pressure on ${axis.name}`, {
              description: `Memory at ${Math.round(value)}%`,
            });
          }
        }
      }
      await refreshMetrics();
    }, 3000);
    return () => clearInterval(interval);
  }, [axes, axisFilter]);

  const getChartData = useCallback((type: MetricType) => {
    let filtered = metrics.filter(m => m.type === type);
    if (axisFilter !== 'all') filtered = filtered.filter(m => m.axisId === axisFilter);

    // Group by timestamp (approximate), take last 20 points
    const grouped = new Map<string, number[]>();
    filtered.forEach(m => {
      const key = new Date(m.timestamp).toLocaleTimeString();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(m.value);
    });

    return Array.from(grouped.entries())
      .map(([time, values]) => ({
        time,
        value: Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100,
      }))
      .slice(-20);
  }, [metrics, axisFilter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Metrics</h2>
          <p className="text-xs text-muted-foreground font-mono">Live system telemetry · Refreshing every 3s</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
          <span className="text-xs text-muted-foreground">LIVE</span>
          <Select value={axisFilter} onValueChange={setAxisFilter}>
            <SelectTrigger className="h-8 w-40 text-xs bg-surface-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pipelines</SelectItem>
              {axes.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
