import { useMemo, useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { SeverityBadge } from '@/components/shared/StatusIndicators';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

export default function LogsPage() {
  const { axes, services, logs } = useAppStore();
  const [axisFilter, setAxisFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (axisFilter !== 'all') result = result.filter(l => l.axisId === axisFilter);
    if (severityFilter !== 'all') result = result.filter(l => l.severity === severityFilter);
    return result;
  }, [logs, axisFilter, severityFilter]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [filteredLogs, autoScroll]);

  const getAxisName = (id: string) => axes.find(a => a.id === id)?.name ?? 'Unknown';
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name ?? '—';

  return (
    <div className="p-6 space-y-4 h-[calc(100vh-3rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Logs & Alerts</h2>
          <p className="text-xs text-muted-foreground font-mono">{filteredLogs.length} entries</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="autoscroll" checked={autoScroll} onCheckedChange={setAutoScroll} />
            <Label htmlFor="autoscroll" className="text-xs">Auto-scroll</Label>
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-8 w-28 text-xs bg-surface-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={axisFilter} onValueChange={setAxisFilter}>
            <SelectTrigger className="h-8 w-36 text-xs bg-surface-1">
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

      <div
        ref={scrollRef}
        className="flex-1 rounded-lg border border-border bg-card overflow-auto custom-scrollbar font-mono text-xs"
      >
        <AnimatePresence initial={false}>
          {filteredLogs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2 border-b border-border hover:bg-surface-1 transition-colors flex items-start gap-3"
            >
              <span className="text-muted-foreground w-20 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <SeverityBadge severity={log.severity} />
              <span className="text-muted-foreground w-24 shrink-0 truncate">{getAxisName(log.axisId)}</span>
              <span className="text-muted-foreground w-20 shrink-0">{getServiceName(log.serviceId)}</span>
              <span className="flex-1 leading-relaxed">{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
