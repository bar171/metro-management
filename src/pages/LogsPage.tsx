import { useMemo, useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { SeverityBadge } from '@/components/shared/StatusIndicators';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function LogsPage() {
  const { pipelines, services, logs, groups } = useAppStore();
  const [pipelineFilter, setPipelineFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (pipelineFilter !== 'all') result = result.filter(l => l.pipelineId === pipelineFilter);
    if (severityFilter !== 'all') result = result.filter(l => l.severity === severityFilter);
    if (serviceFilter !== 'all') result = result.filter(l => l.serviceId === serviceFilter);
    if (groupFilter !== 'all') {
      const g = groups.find(g => g.id === groupFilter);
      if (g) result = result.filter(l => l.pipelineId === g.pipelineId); // groups map to pipelines primarily
    }
    if (dateFilter?.from) {
      const from = new Date(dateFilter.from);
      from.setHours(0, 0, 0, 0); // Start of day
      const to = dateFilter.to ? new Date(dateFilter.to) : new Date(dateFilter.from);
      to.setHours(23, 59, 59, 999); // End of day
      result = result.filter(l => {
        const t = new Date(l.timestamp).getTime();
        return t >= from.getTime() && t <= to.getTime();
      });
    }
    return result;
  }, [logs, pipelineFilter, severityFilter, serviceFilter, groupFilter, dateFilter, groups]);

  // Default to metro-pipeline
  useEffect(() => {
    if (pipelines.length > 0 && pipelineFilter === 'all') {
      const metro = pipelines.find(p => p.name.toLowerCase() === 'metro-pipeline');
      if (metro) {
        setPipelineFilter(metro.id);
      }
    }
  }, [pipelines]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [filteredLogs, autoScroll]);

  const getPipelineName = (id: string) => pipelines.find(a => a.id === id)?.name ?? 'Unknown';
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name ?? '—';

  return (
    <div className="p-6 space-y-4 h-[calc(100vh-3rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Logs & Alerts</h2>
          <p className="text-xs text-muted-foreground font-mono">{filteredLogs.length} entries</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <Switch id="autoscroll" checked={autoScroll} onCheckedChange={setAutoScroll} />
            <Label htmlFor="autoscroll" className="text-xs">Auto-scroll</Label>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[260px] justify-start text-left font-normal h-8 text-xs bg-surface-1",
                  !dateFilter && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {dateFilter?.from ? (
                  dateFilter.to ? (
                    <>
                      {format(dateFilter.from, "LLL dd, y")} -{" "}
                      {format(dateFilter.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateFilter.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={dateFilter?.from}
                selected={dateFilter}
                onSelect={setDateFilter}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>

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

          <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs bg-surface-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pipelines</SelectItem>
              {pipelines.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs bg-surface-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs bg-surface-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name} ({getPipelineName(s.pipelineId)})</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {dateFilter && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => setDateFilter(undefined)}>
              Clear Date
            </Button>
          )}
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
              <span className="text-muted-foreground w-24 shrink-0 truncate">{getPipelineName(log.pipelineId)}</span>
              <span className="text-muted-foreground w-20 shrink-0">{getServiceName(log.serviceId)}</span>
              <span className="flex-1 leading-relaxed">{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
