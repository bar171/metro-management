import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import {
    ShieldAlert,
    Plus,
    Trash2,
    AlertCircle,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    ArrowRight
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StatusDot } from '@/components/shared/StatusIndicators';

const BlacklistPage = () => {
    const {
        blacklistEntries,
        pipelines,
        services,
        loadBlacklist,
        toggleBlacklist,
        addBlacklist,
        deleteBlacklist,
        loading
    } = useAppStore();

    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState<null | 'source' | 'destination' | 'broker'>(null);
    const [formData, setFormData] = useState({
        pipelineId: '',
        targetValue: '',
        reason: '',
        serviceName: '',
        destinationType: '',
        elementId: ''
    });

    useEffect(() => {
        loadBlacklist();
    }, [loadBlacklist]);

    const filteredEntries = blacklistEntries.filter(entry =>
        entry.reason.toLowerCase().includes(search.toLowerCase()) ||
        entry.pipelineId.toLowerCase().includes(search.toLowerCase()) ||
        entry.targetValue.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddEntry = async (type: 'source' | 'destination' | 'broker' | 'pipeline') => {
        let finalTargetValue = formData.targetValue;
        const pipeline = pipelines.find(p => p.id === formData.pipelineId);
        const pipelineName = pipeline ? pipeline.name.toLowerCase() : '';

        if (type === 'source') {
            if (!formData.pipelineId || !formData.serviceName || !formData.elementId || !formData.reason) {
                toast.error('Please fill in all required fields');
                return;
            }
            finalTargetValue = `${pipelineName}:${formData.serviceName}:source:${formData.elementId}`;
        } else if (type === 'destination') {
            if (!formData.pipelineId || !formData.serviceName || !formData.destinationType || !formData.elementId || !formData.reason) {
                toast.error('Please fill in all required fields');
                return;
            }
            finalTargetValue = `${pipelineName}:${formData.serviceName}:${formData.destinationType}:${formData.elementId}`;
        } else if (type === 'broker') {
            if (!formData.targetValue || !formData.reason) {
                toast.error('Please fill in all required fields');
                return;
            }
        }

        try {
            await addBlacklist({
                pipelineId: type === 'broker' ? 'all' : formData.pipelineId,
                targetType: type,
                targetValue: finalTargetValue,
                reason: formData.reason
            });
            setDialogOpen(null);
            setFormData({ pipelineId: '', targetValue: '', reason: '', serviceName: '', destinationType: '', elementId: '' });
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} block deployed`);
        } catch (error) {
            toast.error('Failed to deploy block');
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-status-critical" />
                        Blacklist Admin
                    </h1>
                    <p className="text-muted-foreground">
                        Direct incident response: immediate blocks for sources, destinations, and infrastructure.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Dialog open={dialogOpen === 'source'} onOpenChange={(open) => !open && setDialogOpen(null)}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 border-status-warning/50 hover:bg-status-warning/10" onClick={() => setDialogOpen('source')}>
                                <Plus className="h-4 w-4" /> Source Stop
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Block Source</DialogTitle>
                                <DialogDescription>Select a specific source to halt ingress.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Pipeline</label>
                                    <Select onValueChange={(v) => setFormData({ ...formData, pipelineId: v, targetValue: '', serviceName: '', elementId: '' })}>
                                        <SelectTrigger><SelectValue placeholder="Select Pipeline" /></SelectTrigger>
                                        <SelectContent>{pipelines.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Service Name</label>
                                    <Select disabled={!formData.pipelineId} value={formData.serviceName} onValueChange={(v) => setFormData({ ...formData, serviceName: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Service" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kafka-consumer">Kafka Consumer</SelectItem>
                                            <SelectItem value="get-data">Get Data</SelectItem>
                                            <SelectItem value="push-data">Push Data</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Source ID</label>
                                    <Input
                                        disabled={!formData.pipelineId}
                                        placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                                        value={formData.elementId}
                                        onChange={(e) => setFormData({ ...formData, elementId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Reason</label>
                                    <Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Incident ID or reason..." />
                                </div>
                            </div>
                            <DialogFooter><Button onClick={() => handleAddEntry('source')}>Block Source</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={dialogOpen === 'destination'} onOpenChange={(open) => !open && setDialogOpen(null)}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 border-status-critical/50 hover:bg-status-critical/10" onClick={() => setDialogOpen('destination')}>
                                <Plus className="h-4 w-4" /> Destination Stop
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Block Destination</DialogTitle>
                                <DialogDescription>Stop all traffic to a specific sink.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Pipeline</label>
                                    <Select onValueChange={(v) => setFormData({ ...formData, pipelineId: v, targetValue: '', serviceName: '', destinationType: '', elementId: '' })}>
                                        <SelectTrigger><SelectValue placeholder="Select Pipeline" /></SelectTrigger>
                                        <SelectContent>{pipelines.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Service Name</label>
                                    <Select disabled={!formData.pipelineId} value={formData.serviceName} onValueChange={(v) => setFormData({ ...formData, serviceName: v, destinationType: '' })}>
                                        <SelectTrigger><SelectValue placeholder="Select Service" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="publish">Publish</SelectItem>
                                            <SelectItem value="sink-data">Sink Data</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Destination Type</label>
                                    <Select disabled={!formData.serviceName} value={formData.destinationType} onValueChange={(v) => setFormData({ ...formData, destinationType: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                        <SelectContent>
                                            {formData.serviceName === 'publish' && (
                                                <>
                                                    <SelectItem value="kafka">Kafka</SelectItem>
                                                    <SelectItem value="gateway">Gateway</SelectItem>
                                                </>
                                            )}
                                            {formData.serviceName === 'sink-data' && (
                                                <SelectItem value="postgres">Postgres</SelectItem>
                                            )}
                                            {!formData.serviceName && (
                                                <>
                                                    <SelectItem value="kafka">Kafka</SelectItem>
                                                    <SelectItem value="gateway">Gateway</SelectItem>
                                                    <SelectItem value="postgres">Postgres</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Destination ID</label>
                                    <Input
                                        disabled={!formData.pipelineId}
                                        placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                                        value={formData.elementId}
                                        onChange={(e) => setFormData({ ...formData, elementId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Reason</label>
                                    <Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Critical failure details..." />
                                </div>
                            </div>
                            <DialogFooter><Button onClick={() => handleAddEntry('destination')}>Block Destination</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={dialogOpen === 'broker'} onOpenChange={(open) => !open && setDialogOpen(null)}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 border-primary/50 hover:bg-primary/10" onClick={() => setDialogOpen('broker')}>
                                <Plus className="h-4 w-4" /> Global Broker Block
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Isolate Kafka Broker</DialogTitle>
                                <DialogDescription>Block all connections to a specific broker across all pipelines.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Broker Address</label>
                                    <Input
                                        placeholder="e.g. kafka-broker-01.metro.svc:9092"
                                        value={formData.targetValue}
                                        onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Reason</label>
                                    <Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Maintenance or failure isolation reason..." />
                                </div>
                            </div>
                            <DialogFooter><Button onClick={() => handleAddEntry('broker')}>Isolate Broker</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="bg-card border rounded-lg p-4 shadow-sm flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Filter blocks..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Scope</TableHead>
                            <TableHead>Target Type</TableHead>
                            <TableHead>Identifier</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {filteredEntries.map((entry) => (
                                <motion.tr key={entry.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group hover:bg-muted/30">
                                    <TableCell className="font-semibold">
                                        {entry.pipelineId === 'all' ? <Badge variant="outline" className="text-primary border-primary/30">GLOBAL</Badge> : pipelines.find(p => p.id === entry.pipelineId)?.name}
                                    </TableCell>
                                    <TableCell><Badge variant="secondary" className="capitalize">{entry.targetType}</Badge></TableCell>
                                    <TableCell><code className="text-[10px] font-mono">{entry.targetValue}</code></TableCell>
                                    <TableCell className="max-w-xs truncate text-muted-foreground" title={entry.reason}>{entry.reason}</TableCell>
                                    <TableCell className="text-[10px] text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="hover:text-status-critical" onClick={() => { deleteBlacklist(entry.id); toast.error('Block removed'); }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                        {filteredEntries.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
                                        <span>No active blocks found.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

        </div>
    );
};

export default BlacklistPage;
