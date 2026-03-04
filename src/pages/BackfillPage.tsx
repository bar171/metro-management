import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import {
    Database,
    Play,
    StopCircle,
    Activity,
    Settings,
    Clock,
    Save,
    ChevronDown,
    ChevronRight,
    Search,
    History,
    Plus,
    XCircle,
    ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface ActiveBackfill {
    id: string;
    pipelineId: string;
    fromTime: string;
    toTime: string;
    status: 'running' | 'stopping';
    startedAt: string;
}

const BackfillPage = () => {
    const {
        pipelines,
        groups,
        services,
        updateGroup,
        broadBackfill
    } = useAppStore();

    const [activeBackfills, setActiveBackfills] = useState<ActiveBackfill[]>([
        {
            id: 'bf-mock-1',
            pipelineId: pipelines[0]?.id || 'pipeline-1',
            fromTime: '2024-01-01T00:00',
            toTime: '2024-01-31T23:59',
            status: 'running',
            startedAt: new Date().toISOString()
        }
    ]);

    const [recentBackfills, setRecentBackfills] = useState<ActiveBackfill[]>([]);

    const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        pipelineId: '',
        fromTime: '',
        toTime: '',
        deltaMs: 3600000,
        queryIntervalMs: 1000
    });

    const [editingGroupLimits, setEditingGroupLimits] = useState<{
        [groupId: string]: {
            etlDailyTransportMaxSizeGb?: string;
            etlBackfillLimitDays?: string;
        }
    }>({});
    const [expandedPipelines, setExpandedPipelines] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [registerSourceDialogOpen, setRegisterSourceDialogOpen] = useState(false);
    const [selectedSourceToRegister, setSelectedSourceToRegister] = useState('');
    const [sourceSearchQuery, setSourceSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Compute grouped limits
    const groupsByPipeline = React.useMemo(() => {
        const grouped: Record<string, typeof groups> = {};

        const filteredGroups = groups.filter(g =>
            g.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filteredGroups.forEach(g => {
            const pipId = g.primaryPipelineId || 'unassigned';
            if (!grouped[pipId]) grouped[pipId] = [];
            grouped[pipId].push(g);
        });
        return grouped;
    }, [groups, searchQuery]);

    const togglePipelineExpand = (pipelineId: string) => {
        setExpandedPipelines(prev => {
            const next = new Set(prev);
            if (next.has(pipelineId)) {
                next.delete(pipelineId);
            } else {
                next.add(pipelineId);
            }
            return next;
        });
    };

    const handleTriggerBackfill = async () => {
        if (!formData.pipelineId || !formData.fromTime || !formData.toTime) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await broadBackfill({
                fromTime: formData.fromTime,
                toTime: formData.toTime,
                deltaMs: formData.deltaMs,
                queryIntervalMs: formData.queryIntervalMs
            });

            const newId = `bf-${Date.now()}`;
            setActiveBackfills(prev => [...prev, {
                id: newId,
                pipelineId: formData.pipelineId,
                fromTime: formData.fromTime,
                toTime: formData.toTime,
                status: 'running',
                startedAt: new Date().toISOString()
            }]);

            toast.success('Broad backfill triggered successfully');
            setTriggerDialogOpen(false);
            setFormData({
                pipelineId: '',
                fromTime: '',
                toTime: '',
                deltaMs: 3600000,
                queryIntervalMs: 1000
            });
        } catch (error) {
            toast.error('Failed to trigger backfill');
        }
    };

    const handleStopBackfill = (id: string) => {
        setActiveBackfills(prev => prev.map(bf => bf.id === id ? { ...bf, status: 'stopping' } : bf));
        toast.info('Initiated stop for backfill job');

        // Simulating the backend job stopping process
        setTimeout(() => {
            setActiveBackfills(prev => {
                const stoppedJob = prev.find(bf => bf.id === id);
                if (stoppedJob) {
                    setRecentBackfills(recent => [{ ...stoppedJob, status: 'stopping' as const }, ...recent].slice(0, 10)); // keep last 10
                }
                return prev.filter(bf => bf.id !== id);
            });
            toast.success('Backfill job stopped successfully');
        }, 2000);
    };

    const handleLimitChange = (groupId: string, field: 'etlDailyTransportMaxSizeGb' | 'etlBackfillLimitDays', value: string) => {
        setEditingGroupLimits(prev => ({
            ...prev,
            [groupId]: {
                ...prev[groupId],
                [field]: value
            }
        }));
    };

    const saveGroupLimit = async (groupId: string) => {
        const edits = editingGroupLimits[groupId];
        if (!edits) return;

        const payload: any = {};
        if (edits.etlDailyTransportMaxSizeGb !== undefined) {
            payload.etlDailyTransportMaxSizeGb = edits.etlDailyTransportMaxSizeGb === '' ? null : Number(edits.etlDailyTransportMaxSizeGb);
        }
        if (edits.etlBackfillLimitDays !== undefined) {
            payload.etlBackfillLimitDays = edits.etlBackfillLimitDays === '' ? null : Number(edits.etlBackfillLimitDays);
        }

        if (Object.values(payload).some(v => v !== null && isNaN(v as number))) {
            toast.error('Invalid limit value');
            return;
        }

        try {
            await updateGroup(groupId, payload);
            toast.success('Group daily limit updated');
            setEditingGroupLimits(prev => {
                const next = { ...prev };
                delete next[groupId];
                return next;
            });
        } catch (err) {
            toast.error('Failed to update limit');
        }
    };

    const handleRegisterSource = async () => {
        if (!selectedSourceToRegister) return;
        try {
            // Because we pass the entire object to mockORM update we should be careful,
            // but the store updateService handles this gracefully.
            await useAppStore.getState().updateService(selectedSourceToRegister, { isRegisteredForBroadBackfill: true });
            toast.success('Source registered for broad backfills');
            setRegisterSourceDialogOpen(false);
            setSelectedSourceToRegister('');
        } catch (error) {
            toast.error('Failed to register source');
        }
    };

    const handleUnregisterSource = async (serviceId: string) => {
        try {
            await useAppStore.getState().updateService(serviceId, { isRegisteredForBroadBackfill: false });
            toast.success('Source unregistered from broad backfills');
        } catch (error) {
            toast.error('Failed to unregister source');
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Database className="h-6 w-6 text-primary" />
                        Backfill Manager
                    </h1>
                    <p className="text-muted-foreground">
                        Trigger broad backfills, manage running jobs, and adjust ETL limits across groups.
                    </p>
                </div>

                <Dialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/25 transition-all">
                            <Play className="h-4 w-4" /> Trigger Broad Backfill
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Configure Broad Backfill</DialogTitle>
                            <DialogDescription>Submit a broad backfill request for a pipeline.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target Pipeline</label>
                                <Select onValueChange={(v) => setFormData({ ...formData, pipelineId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select Pipeline" /></SelectTrigger>
                                    <SelectContent>
                                        {pipelines.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">From Time</label>
                                    <div className="relative w-full flex items-center">
                                        <Input
                                            type="datetime-local"
                                            value={formData.fromTime}
                                            onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })}
                                            className="relative z-10 bg-transparent text-sm cursor-text"
                                        />
                                        <Clock className="absolute right-3 w-4 h-4 text-muted-foreground z-0 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">To Time</label>
                                    <div className="relative w-full flex items-center">
                                        <Input
                                            type="datetime-local"
                                            value={formData.toTime}
                                            onChange={(e) => setFormData({ ...formData, toTime: e.target.value })}
                                            className="relative z-10 bg-transparent text-sm cursor-text"
                                        />
                                        <Clock className="absolute right-3 w-4 h-4 text-muted-foreground z-0 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Delta (ms)</label>
                                    <Input
                                        type="number"
                                        value={formData.deltaMs}
                                        onChange={(e) => setFormData({ ...formData, deltaMs: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Query Interval (ms)</label>
                                    <Input
                                        type="number"
                                        value={formData.queryIntervalMs}
                                        onChange={(e) => setFormData({ ...formData, queryIntervalMs: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setTriggerDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleTriggerBackfill}>Trigger Job</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Jobs Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" /> Current Running Jobs
                    </h2>
                    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Pipeline</TableHead>
                                    <TableHead>Time Range</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeBackfills.map((job) => {
                                    const pipeline = pipelines.find(p => p.id === job.pipelineId);
                                    return (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium">{pipeline?.name || job.pipelineId}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                <div>From: {new Date(job.fromTime).toLocaleDateString()}</div>
                                                <div>To: {new Date(job.toTime).toLocaleDateString()}</div>
                                            </TableCell>
                                            <TableCell>
                                                {job.status === 'running' ? (
                                                    <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10">
                                                        <Activity className="w-3 h-3 mr-1 animate-pulse" /> Running
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10">
                                                        Stopping...
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleStopBackfill(job.id)}
                                                    disabled={job.status === 'stopping'}
                                                    className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                >
                                                    <StopCircle className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {activeBackfills.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No active backfill jobs.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Recent Jobs Section */}
                    {recentBackfills.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <History className="h-5 w-5 text-muted-foreground" /> Recently Triggered Jobs
                            </h2>
                            <div className="rounded-lg border bg-card/50 shadow-sm overflow-hidden opacity-80">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead>Pipeline</TableHead>
                                            <TableHead>Time Range</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentBackfills.map((job) => {
                                            const pipeline = pipelines.find(p => p.id === job.pipelineId);
                                            return (
                                                <TableRow key={job.id}>
                                                    <TableCell className="font-medium text-muted-foreground">{pipeline?.name || job.pipelineId}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                        <div>From: {new Date(job.fromTime).toLocaleDateString()}</div>
                                                        <div>To: {new Date(job.toTime).toLocaleDateString()}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-muted-foreground border-muted">
                                                            Stopped
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Group Limits Section */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Settings className="h-5 w-5 text-purple-500" /> Group Daily Limits
                        </h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search groups..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        {Object.entries(groupsByPipeline).map(([pipelineId, pipelineGroups]) => {
                            const pipeline = pipelines.find(p => p.id === pipelineId);
                            const displayName = pipeline ? pipeline.name : 'Unassigned / Global Groups';
                            const isExpanded = expandedPipelines.has(pipelineId);

                            return (
                                <div key={pipelineId} className="rounded-lg border bg-card shadow-sm overflow-hidden">
                                    <div
                                        className="bg-muted/30 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => togglePipelineExpand(pipelineId)}
                                    >
                                        <div className="font-medium text-sm flex items-center gap-2">
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            {displayName}
                                            <Badge variant="secondary" className="ml-2">{pipelineGroups.length}</Badge>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t">
                                            <Table>
                                                <TableHeader className="bg-muted/10">
                                                    <TableRow>
                                                        <TableHead className="w-[40%]">Group Name</TableHead>
                                                        <TableHead>Daily (GB)</TableHead>
                                                        <TableHead>Range (Days)</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {pipelineGroups.map((group) => {
                                                        const edits = editingGroupLimits[group.id] || {};

                                                        const valDaily = edits.etlDailyTransportMaxSizeGb !== undefined ? edits.etlDailyTransportMaxSizeGb : (group.etlDailyTransportMaxSizeGb === null ? '' : group.etlDailyTransportMaxSizeGb);
                                                        const valBackfillDays = edits.etlBackfillLimitDays !== undefined ? edits.etlBackfillLimitDays : (group.etlBackfillLimitDays === null ? '' : (group.etlBackfillLimitDays || ''));

                                                        const isDirty =
                                                            (edits.etlDailyTransportMaxSizeGb !== undefined && String(group.etlDailyTransportMaxSizeGb === null ? '' : group.etlDailyTransportMaxSizeGb) !== edits.etlDailyTransportMaxSizeGb) ||
                                                            (edits.etlBackfillLimitDays !== undefined && String(group.etlBackfillLimitDays === null ? '' : (group.etlBackfillLimitDays || '')) !== edits.etlBackfillLimitDays);

                                                        return (
                                                            <TableRow key={group.id} className="group/row">
                                                                <TableCell className="font-medium">{group.name}</TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        type="number"
                                                                        value={valDaily}
                                                                        onChange={(e) => handleLimitChange(group.id, 'etlDailyTransportMaxSizeGb', e.target.value)}
                                                                        className="h-8 max-w-[100px] transition-colors focus-visible:ring-purple-500"
                                                                        placeholder="No Limit"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        type="number"
                                                                        value={valBackfillDays}
                                                                        onChange={(e) => handleLimitChange(group.id, 'etlBackfillLimitDays', e.target.value)}
                                                                        className="h-8 max-w-[100px] transition-colors focus-visible:ring-purple-500"
                                                                        placeholder="No Limit"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        size="sm"
                                                                        variant={isDirty ? "default" : "ghost"}
                                                                        disabled={!isDirty}
                                                                        onClick={() => saveGroupLimit(group.id)}
                                                                        className={`transition-all ${isDirty ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-500/20" : "opacity-0 group-hover/row:opacity-100"}`}
                                                                    >
                                                                        <Save className="h-4 w-4" />
                                                                        {isDirty && <span className="ml-2">Save</span>}
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {groups.length === 0 && (
                            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground shadow-sm">
                                No groups configured.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Registered Sources Section */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Database className="h-5 w-5 text-indigo-500" /> Registered Sources for Broad Backfill
                    </h2>

                    <Dialog open={registerSourceDialogOpen} onOpenChange={setRegisterSourceDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                                <Plus className="h-4 w-4" /> Register Source
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Register Source</DialogTitle>
                                <DialogDescription>Register an existing source service to participate in broad backfills.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Enter Source ID</label>
                                    <Input
                                        placeholder="Enter Source UUID..."
                                        value={selectedSourceToRegister}
                                        onChange={(e) => setSelectedSourceToRegister(e.target.value)}
                                        className="font-mono text-sm"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setRegisterSourceDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleRegisterSource} disabled={!selectedSourceToRegister || selectedSourceToRegister === 'none'}>Register</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search sources (Pipeline, Group, Project, Name, ID)..."
                        value={sourceSearchQuery}
                        onChange={e => {
                            setSourceSearchQuery(e.target.value);
                            setCurrentPage(1); // Reset to page 1 on search
                        }}
                        className="pl-9 bg-surface-1"
                    />
                </div>

                <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[15%]">Pipeline</TableHead>
                                <TableHead className="w-[15%]">Group</TableHead>
                                <TableHead className="w-[15%]">Project</TableHead>
                                <TableHead className="w-[20%]">Source Name</TableHead>
                                <TableHead className="w-[20%]">Source ID</TableHead>
                                <TableHead className="w-[15%] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(() => {
                                // 1. Filter out raw sources first
                                const baseRegisteredSources = services.filter(s => s.stage === 'source' && s.isRegisteredForBroadBackfill);

                                // 2. Flatten them to row items matching the groups (to handle one source in multiple groups potentially)
                                let tableRows: Array<{
                                    id: string;
                                    pipelineName: string;
                                    sourceId: string;
                                    groupName: string;
                                    projectName: string;
                                    sourceName: string;
                                }> = [];

                                baseRegisteredSources.forEach(source => {
                                    const pipeline = pipelines.find(p => p.id === source.pipelineId);
                                    const pipelineName = pipeline?.name || (source.pipelineId === 'global' ? 'Global' : source.pipelineId);

                                    // Filter out specific pipelines
                                    const pNameLower = pipelineName.toLowerCase();
                                    if (['global', 'backfill', 'excel'].includes(pNameLower)) {
                                        return; // Skip this source
                                    }

                                    const matchingGroups = groups.filter(g => g.primaryPipelineId === source.pipelineId);

                                    if (matchingGroups.length === 0) {
                                        tableRows.push({
                                            id: `${source.id}-nogroup`,
                                            pipelineName,
                                            sourceId: source.id,
                                            groupName: 'None',
                                            projectName: source.project || 'None',
                                            sourceName: source.name
                                        });
                                    } else {
                                        matchingGroups.forEach(group => {
                                            tableRows.push({
                                                id: `${source.id}-${group.id}`,
                                                pipelineName,
                                                sourceId: source.id,
                                                groupName: group.name,
                                                projectName: source.project || 'None',
                                                sourceName: source.name
                                            });
                                        });
                                    }
                                });

                                // 3. Filter by search query across all columns
                                if (sourceSearchQuery) {
                                    const q = sourceSearchQuery.toLowerCase();
                                    tableRows = tableRows.filter(row =>
                                        row.pipelineName.toLowerCase().includes(q) ||
                                        row.groupName.toLowerCase().includes(q) ||
                                        row.projectName.toLowerCase().includes(q) ||
                                        row.sourceName.toLowerCase().includes(q) ||
                                        row.sourceId.toLowerCase().includes(q)
                                    );
                                }

                                // 4. Paginate
                                const totalItems = tableRows.length;
                                const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
                                const startIndex = (currentPage - 1) * itemsPerPage;
                                const paginatedRows = tableRows.slice(startIndex, startIndex + itemsPerPage);

                                if (tableRows.length === 0) {
                                    return (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No registered sources found matching criteria.
                                            </TableCell>
                                        </TableRow>
                                    );
                                }

                                return (
                                    <>
                                        {paginatedRows.map(row => (
                                            <TableRow key={row.id} className="group/row">
                                                <TableCell className="font-medium">{row.pipelineName}</TableCell>
                                                <TableCell>{row.groupName}</TableCell>
                                                <TableCell className="text-muted-foreground">{row.projectName}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">{row.sourceName}</Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{row.sourceId}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                                                        onClick={() => handleUnregisterSource(row.sourceId)}
                                                        title="Unregister source"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {/* Pagination Controls Row inside TableBody or outside Table */}
                                        {totalItems > 0 && (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell colSpan={6} className="py-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-xs text-muted-foreground">
                                                            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-medium">{totalItems}</span> sources
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground">Rows per page</span>
                                                                <Select value={itemsPerPage.toString()} onValueChange={(val) => {
                                                                    setItemsPerPage(Number(val));
                                                                    setCurrentPage(1);
                                                                }}>
                                                                    <SelectTrigger className="h-8 w-16 text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="10">10</SelectItem>
                                                                        <SelectItem value="25">25</SelectItem>
                                                                        <SelectItem value="50">50</SelectItem>
                                                                        <SelectItem value="100">100</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                    disabled={currentPage === 1}
                                                                >
                                                                    <ChevronLeft className="h-4 w-4" />
                                                                </Button>
                                                                <div className="text-xs font-medium px-2">Page {currentPage} of {totalPages}</div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                                    disabled={currentPage === totalPages}
                                                                >
                                                                    <ChevronRight className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                );
                            })()}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default BackfillPage;
