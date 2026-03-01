import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { StatusDot, TypeBadge } from '@/components/shared/StatusIndicators';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Activity, Clock, ServerCrash, AlertTriangle, AlertCircle, CheckCircle2, ArrowRight, Database, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Service } from '@/types';

export default function LivenessPage() {
    const { pipelines, services, groups, metrics, envFilter } = useAppStore();

    const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'degraded'>('all');
    const [groupSearch, setGroupSearch] = useState('');
    const [selectedLogs, setSelectedLogs] = useState<{ pipelineName: string, stage: string, svcs: Service[] } | null>(null);

    // Helpers
    const isStale = (lastMessageAt?: string) => {
        if (!lastMessageAt) return true;
        const diff = Date.now() - new Date(lastMessageAt).getTime();
        return diff > 5 * 60 * 1000; // > 5 minutes
    };

    const getPipelineHealth = (pipelineId: string) => {
        const svcs = services.filter(s => s.pipelineId === pipelineId);
        if (svcs.some(s => s.status === 'lagging' || s.status === 'degraded')) return 'degraded';
        return 'healthy';
    };

    const getPipelineLag = (pipelineId: string) => {
        const pipeMetrics = metrics.filter(m => m.pipelineId === pipelineId && m.type === 'kafka_lag');
        if (pipeMetrics.length === 0) return 0;
        // get latest
        return pipeMetrics.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].value;
    };

    const hasTransformWarning = (svcs: Service[]) => {
        // Mocking external-transform latency warning if any transform service is degraded/lagging
        const transformSvcs = svcs.filter(s => s.stage === 'transform');
        return transformSvcs.some(s => s.status !== 'healthy');
    };

    const globalDbConnections = useMemo(() => {
        const latestPerSvc = new Map<string, number>();
        const dbMetrics = metrics.filter(m => m.type === 'db_connections');
        // Sort oldest to newest so last set is newest
        dbMetrics.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        dbMetrics.forEach(m => latestPerSvc.set(m.serviceId, m.value));
        return Array.from(latestPerSvc.values()).reduce((sum, val) => sum + val, 0);
    }, [metrics]);

    // Compile full table data
    const tableData = useMemo(() => {
        const activePipelines = envFilter === 'all' ? pipelines : pipelines.filter(p => p.environment === envFilter);
        return activePipelines.map(pipeline => {
            const svcs = services.filter(s => s.pipelineId === pipeline.id);
            const pipeGroups = groups.filter(g => g.pipelineId === pipeline.id);
            const health = getPipelineHealth(pipeline.id);
            const stale = isStale(pipeline.lastMessageAt);
            const lag = getPipelineLag(pipeline.id);

            return {
                pipeline,
                svcs,
                pipeGroups,
                health,
                stale,
                lag,
                transformWarning: hasTransformWarning(svcs),
                dlqCount: pipeline.dlqCount,
                groupNames: pipeGroups.map(g => g.name).join(', ')
            };
        });
    }, [pipelines, services, groups, metrics, envFilter]);

    // Apply Filters
    const filteredData = useMemo(() => {
        let res = tableData;

        if (statusFilter !== 'all') {
            res = res.filter(item => item.health === statusFilter);
        }

        if (groupSearch.trim()) {
            const q = groupSearch.toLowerCase();
            res = res.filter(item => item.groupNames.toLowerCase().includes(q));
        }

        return res;
    }, [tableData, statusFilter, groupSearch]);

    return (
        <div className="p-6 h-[calc(100vh-3rem)] flex flex-col gap-6">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Liveness
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono">Global pipeline health and metrics monitor</p>
                </div>

                <div className="flex items-center gap-4 bg-card border border-border px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-3 pr-4 border-r border-border">
                        <div className="p-2 bg-primary/10 rounded-md">
                            <Database className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-muted-foreground font-mono">Management DB Conns</span>
                            <span className="font-bold tabular-nums text-lg leading-none">{globalDbConnections}</span>
                        </div>
                    </div>
                    <div className="flex flex-col px-4 border-r border-border">
                        <span className="text-[10px] uppercase text-muted-foreground font-mono">Total Pipelines</span>
                        <span className="font-bold tabular-nums text-lg leading-none">{tableData.length}</span>
                    </div>
                    <div className="flex flex-col pl-4">
                        <span className="text-[10px] uppercase text-muted-foreground font-mono text-status-degraded">Degraded</span>
                        <span className="font-bold tabular-nums text-lg leading-none text-status-degraded">
                            {tableData.filter(d => d.health === 'degraded').length}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
                <div className="w-64">
                    <Input
                        placeholder="Filter by Group Name..."
                        value={groupSearch}
                        onChange={e => setGroupSearch(e.target.value)}
                        className="h-9 bg-card"
                    />
                </div>
                <div className="w-48">
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                        <SelectTrigger className="h-9 bg-card">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="healthy">Healthy</SelectItem>
                            <SelectItem value="degraded">Degraded</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-card border border-border rounded-lg shadow-sm">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="sticky top-0 bg-surface-1/95 backdrop-blur z-10 text-xs uppercase tracking-wider text-muted-foreground font-mono">
                        <tr>
                            <th className="px-5 py-3 border-b border-border font-medium">Status</th>
                            <th className="px-5 py-3 border-b border-border font-medium">Pipeline</th>
                            <th className="px-5 py-3 border-b border-border font-medium">Type</th>
                            <th className="px-5 py-3 border-b border-border font-medium">Pipeline Components</th>
                            <th className="px-5 py-3 border-b border-border font-medium text-right">Sink (Publish)</th>
                            <th className="px-5 py-3 border-b border-border font-medium text-right">Kafka Lag</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                                    No pipelines match your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((row) => (
                                <motion.tr
                                    key={row.pipeline.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`hover:bg-surface-1/50 transition-colors ${row.lag > 1000 ? 'bg-status-critical/15 border border-status-critical/50 shadow-[inset_0_0_15px_rgba(255,0,0,0.1)]' : row.health === 'degraded' ? 'bg-status-critical/5' : ''}`}
                                >
                                    <td className="px-5 py-4">
                                        {row.health === 'degraded' ? (
                                            <Badge variant="destructive" className="gap-1.5 glow-critical border-status-critical font-mono">
                                                <ServerCrash className="w-3 h-3" /> CRITICAL
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="gap-1.5 text-status-healthy border-status-healthy font-mono bg-status-healthy/10">
                                                <CheckCircle2 className="w-3 h-3" /> UP
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="font-bold flex items-center gap-2">
                                            <StatusDot status={row.health as any} pulse={row.health === 'degraded'} />
                                            {row.pipeline.name}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <TypeBadge type={row.pipeline.type} />
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            {['source', 'get-data', 'python-validate', 'transform', 'sink'].map((stage, idx, arr) => {
                                                const svcs = row.svcs.filter(s => s.stage === stage);
                                                const isMissing = svcs.length === 0;
                                                const isDegraded = svcs.some(s => s.status === 'degraded' || s.status === 'lagging');

                                                let bgColor = 'bg-surface-2 border-border';
                                                let title = `${stage}: Not Configured`;
                                                if (!isMissing) {
                                                    bgColor = isDegraded ? 'bg-status-critical border-status-critical glow-critical' : 'bg-status-healthy border-status-healthy glow-healthy';
                                                    title = `${stage}: ${isDegraded ? 'Degraded' : 'Healthy'} (${svcs.length} services)`;
                                                }

                                                return (
                                                    <div key={stage} className="flex items-center gap-2">
                                                        <div
                                                            className={`w-3.5 h-3.5 rounded-full border shadow-sm ${bgColor} transition-colors flex items-center justify-center ${!isMissing ? 'cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-1 bg-background' : ''}`}
                                                            title={title}
                                                            onClick={() => !isMissing && setSelectedLogs({ pipelineName: row.pipeline.name, stage, svcs })}
                                                        />
                                                        {idx < arr.length - 1 && (
                                                            <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </td>

                                    <td className="px-5 py-4 text-right">
                                        <div className="flex flex-col gap-1">
                                            {row.pipeline.lastMessageAt ? (
                                                <div className="flex items-center justify-end gap-2 text-xs font-mono text-foreground font-medium">
                                                    <Clock className="w-3 h-3 text-primary" />
                                                    {new Date(row.pipeline.lastMessageAt).toLocaleTimeString()}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Never</span>
                                            )}

                                            {row.stale && (
                                                <span className="text-[10px] font-bold text-status-critical flex items-center justify-end gap-1 uppercase tracking-wider">
                                                    <AlertTriangle className="w-3 h-3" /> Stale
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            {row.lag > 1000 ? (
                                                <span className="font-bold text-status-critical font-mono text-base flex items-center justify-end gap-1.5 glow-critical">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {row.lag.toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="font-mono text-muted-foreground text-sm font-medium">
                                                    {row.lag.toLocaleString()}
                                                </span>
                                            )}
                                            {row.transformWarning && (
                                                <span className="text-[10px] text-status-warning font-mono flex items-center gap-1.5">
                                                    <AlertTriangle className="w-3 h-3" /> Latency Warning
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog open={!!selectedLogs} onOpenChange={(open) => !open && setSelectedLogs(null)}>
                <DialogContent className="max-w-3xl border-border bg-card shadow-lg p-0">
                    <DialogHeader className="p-4 border-b border-border bg-surface-1/50">
                        <DialogTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                            <Terminal className="w-4 h-4 text-primary" />
                            {selectedLogs?.pipelineName} — {selectedLogs?.stage} logs
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-4 bg-black/90 text-green-400 font-mono text-xs h-[400px] overflow-auto whitespace-pre-wrap">
                        {selectedLogs?.svcs.map(svc => (
                            <div key={svc.id} className="mb-4">
                                <div className="text-blue-400 font-bold mb-1">[{svc.name}] (pods: {svc.replicas}, status: {svc.status})</div>
                                {svc.status === 'healthy' ? (
                                    <>
                                        <div>[INFO] {new Date().toISOString()} - Service healthy and processing events normally.</div>
                                        <div>[INFO] {new Date().toISOString()} - CPU: {svc.cpuLimit / 2}m / {svc.cpuLimit}m, RAM: {svc.memoryLimit / 2}Mi / {svc.memoryLimit}Mi</div>
                                        <div>[INFO] {new Date().toISOString()} - Successfully processed {Math.floor(Math.random() * 500) + 10} batches...</div>
                                    </>
                                ) : svc.status === 'degraded' ? (
                                    <>
                                        <div className="text-red-400">[ERROR] {new Date().toISOString()} - Container crash loop backoff detected.</div>
                                        <div className="text-red-400">[FATAL] {new Date().toISOString()} - OutOfMemoryException: Required {svc.memoryLimit * 1.5}Mi but limit is {svc.memoryLimit}Mi.</div>
                                        <div>[INFO] {new Date().toISOString()} - Restarting pod...</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-yellow-400">[WARN] {new Date().toISOString()} - High consumer lag detected. Processing rate slower than ingestion.</div>
                                        <div className="text-yellow-400">[WARN] {new Date().toISOString()} - CPU throttling. Usage at {svc.cpuLimit}m limit.</div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
