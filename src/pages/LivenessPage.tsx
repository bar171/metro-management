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
import { Activity, Clock, ServerCrash, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LivenessPage() {
    const { pipelines, services, groups, metrics } = useAppStore();

    const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'degraded'>('all');
    const [groupSearch, setGroupSearch] = useState('');

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

    // Compile full table data
    const tableData = useMemo(() => {
        return pipelines.map(pipeline => {
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
                groupNames: pipeGroups.map(g => g.name).join(', ')
            };
        });
    }, [pipelines, services, groups, metrics]);

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
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted-foreground font-mono">Total Pipelines</span>
                        <span className="font-bold tabular-nums text-lg leading-none">{pipelines.length}</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex flex-col">
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
                            <th className="px-5 py-3 border-b border-border font-medium">Owner Groups</th>
                            <th className="px-5 py-3 border-b border-border font-medium">Heartbeat</th>
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
                                    className={`hover:bg-surface-1/50 transition-colors ${row.health === 'degraded' ? 'bg-status-critical/5' : ''}`}
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
                                        {row.pipeGroups.length > 0 ? (
                                            <span className="font-medium text-foreground">{row.groupNames}</span>
                                        ) : (
                                            <span className="text-muted-foreground italic text-xs">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col gap-1">
                                            {row.pipeline.lastMessageAt ? (
                                                <div className="flex items-center gap-2 text-xs font-mono">
                                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                                    {new Date(row.pipeline.lastMessageAt).toLocaleTimeString()}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Never</span>
                                            )}

                                            {row.stale && (
                                                <span className="text-[10px] font-bold text-status-degraded flex items-center gap-1 uppercase tracking-wider">
                                                    <AlertTriangle className="w-3 h-3" /> Stale
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        {row.lag > 1000 ? (
                                            <span className="font-bold text-status-critical font-mono text-base flex items-center justify-end gap-1.5">
                                                <AlertCircle className="w-4 h-4" />
                                                {row.lag.toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="font-mono text-muted-foreground">
                                                {row.lag.toLocaleString()}
                                            </span>
                                        )}
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
