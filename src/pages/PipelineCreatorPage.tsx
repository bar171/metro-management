import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus, Users, GitBranch, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { PipelineType, Environment } from '@/types';

export default function PipelineCreatorPage() {
    const { pipelines, groups, createPipeline, deletePipeline, createGroup, deleteGroup, envFilter } = useAppStore();

    const [newPipelineName, setNewPipelineName] = useState('');
    const [newPipelineType, setNewPipelineType] = useState<PipelineType>('BASIC');
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupPipelineId, setNewGroupPipelineId] = useState('');
    const [groupSearchQuery, setGroupSearchQuery] = useState('');

    const displayPipelines = envFilter === 'all' ? pipelines : pipelines.filter(p => p.environment === envFilter);

    const handleCreatePipeline = async () => {
        if (!newPipelineName.trim()) {
            toast.error('Pipeline name is required');
            return;
        }
        await createPipeline({
            name: newPipelineName,
            type: newPipelineType,
            environment: envFilter === 'all' ? 'dev' : envFilter,
            priority: 'normal',
            kafkaCluster: 'new-cluster',
            databaseInstance: 'new-db',
            resourceProfileId: 'rp-1',
            totalCpuLimit: 4000,
            totalMemoryLimit: 8192
        });
        setNewPipelineName('');
        toast.success('Pipeline created successfully');
    };

    const handleDeletePipeline = async (pipelineId: string) => {
        const pipelineGroups = groups.filter(g => g.pipelineId === pipelineId);
        if (pipelineGroups.length > 0) {
            toast.error(`Cannot delete! Pipeline has ${pipelineGroups.length} associated groups. Please remove them first.`);
            return;
        }
        await deletePipeline(pipelineId);
        toast.success('Pipeline deleted');
    };

    const handleDeleteGroup = async (groupId: string) => {
        await deleteGroup(groupId);
        toast.success('Group removed');
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || !newGroupPipelineId) {
            toast.error('Group name and Target Pipeline are required');
            return;
        }
        await createGroup({
            name: newGroupName,
            pipelineId: newGroupPipelineId
        });
        setNewGroupName('');
        toast.success('Owner Group assigned successfully');
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Pipeline Creator</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage pipelines and their associated owner groups.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-stretch">
                {/* Left Column Forms */}
                <div className="md:col-span-1 flex flex-col justify-between gap-6">
                    {/* Create Pipeline Form */}
                    <div className="rounded-lg border border-border bg-card p-5 h-fit">
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                            <Plus className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-semibold">Create New Pipeline</h3>
                        </div>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Name</label>
                                <Input value={newPipelineName} onChange={e => setNewPipelineName(e.target.value)} placeholder="e.g. Fraud-Detection" className="h-8 text-xs" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Type</label>
                                <Select value={newPipelineType} onValueChange={(v) => setNewPipelineType(v as PipelineType)}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BASIC">BASIC</SelectItem>
                                        <SelectItem value="STREAM">STREAM</SelectItem>
                                        <SelectItem value="BACKFILL">BACKFILL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleCreatePipeline} className="w-full text-xs h-8">
                                Create Pipeline
                            </Button>
                        </div>
                    </div>

                    {/* Create Group Form */}
                    <div className="rounded-lg border border-border bg-card p-5 h-fit mt-auto">
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                            <Users className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-semibold">Assign Owner Group</h3>
                        </div>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Group Name</label>
                                <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Data Science Team" className="h-8 text-xs" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Target Pipeline</label>
                                <Select value={newGroupPipelineId} onValueChange={setNewGroupPipelineId}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select pipeline..." /></SelectTrigger>
                                    <SelectContent>
                                        {displayPipelines.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleCreateGroup} className="w-full text-xs h-8">
                                Assign Group
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Existing Pipelines and Groups */}
                <div className="md:col-span-2">
                    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col h-full max-h-[calc(100vh-140px)] min-h-[500px]">
                        <div className="flex items-center gap-2 border-b border-border p-4 bg-surface-1/50 shrink-0">
                            <GitBranch className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-sm font-semibold">Managed Pipelines & Groups</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <Table>
                                <TableHeader className="sticky top-0 bg-surface-1 z-10 shadow-sm border-b border-border">
                                    <TableRow className="bg-surface-1 hover:bg-surface-1">
                                        <TableHead className="text-[10px] font-mono uppercase">Pipeline</TableHead>
                                        <TableHead className="text-[10px] font-mono uppercase">Groups</TableHead>
                                        <TableHead className="text-[10px] font-mono uppercase text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayPipelines.map(pipeline => {
                                        const pipelineGroups = groups.filter(g => g.pipelineId === pipeline.id);
                                        return (
                                            <TableRow key={pipeline.id} className="border-b border-border hover:bg-surface-1/50 transition-colors">
                                                <TableCell className="font-medium align-top pt-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span>{pipeline.name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">{pipeline.type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top pt-4">
                                                    <Dialog onOpenChange={(open) => !open && setGroupSearchQuery('')}>
                                                        <DialogTrigger asChild>
                                                            <Button variant={pipelineGroups.length === 0 ? "ghost" : "outline"} size="sm" className={`h-7 text-xs gap-2 ${pipelineGroups.length === 0 ? 'text-muted-foreground' : ''}`}>
                                                                <Users className="w-3.5 h-3.5" />
                                                                {pipelineGroups.length === 0 ? 'No groups' : `Manage ${pipelineGroups.length} Group${pipelineGroups.length === 1 ? '' : 's'}`}
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-md">
                                                            <DialogHeader>
                                                                <DialogTitle>Groups for {pipeline.name}</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="py-2 space-y-4">
                                                                {pipelineGroups.length > 0 && (
                                                                    <div className="relative">
                                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                                        <Input
                                                                            placeholder="Search groups..."
                                                                            value={groupSearchQuery}
                                                                            onChange={e => setGroupSearchQuery(e.target.value)}
                                                                            className="h-8 pl-8 text-xs bg-surface-1"
                                                                        />
                                                                    </div>
                                                                )}
                                                                {pipelineGroups.length === 0 ? (
                                                                    <div className="text-center py-8 text-muted-foreground italic text-sm border border-dashed rounded-md bg-surface-1/50">
                                                                        No groups are currently assigned.
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                                        {pipelineGroups.filter(g => g.name.toLowerCase().includes(groupSearchQuery.toLowerCase())).map(group => (
                                                                            <div key={group.id} className="flex items-center justify-between bg-surface-2 p-2 px-3 rounded-md border border-border transition-colors hover:border-muted-foreground/30">
                                                                                <span className="text-sm font-medium flex items-center gap-2">
                                                                                    <Users className="w-4 h-4 text-muted-foreground" />
                                                                                    {group.name}
                                                                                </span>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                                    onClick={() => handleDeleteGroup(group.id)}
                                                                                    title="Remove Group"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                        {pipelineGroups.filter(g => g.name.toLowerCase().includes(groupSearchQuery.toLowerCase())).length === 0 && (
                                                                            <div className="text-center py-4 text-muted-foreground italic text-xs">
                                                                                No groups match your search.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                                <TableCell className="text-right align-top pt-4">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-7 text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5">
                                                                <Trash2 className="w-3 h-3" /> Delete Pipeline
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Pipeline: {pipeline.name}</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    {pipelineGroups.length > 0
                                                                        ? `You must first remove the ${pipelineGroups.length} associated groups before deleting this pipeline.`
                                                                        : "Are you sure you want to delete this pipeline? This action cannot be undone."}
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeletePipeline(pipeline.id)}
                                                                    disabled={pipelineGroups.length > 0}
                                                                    className={pipelineGroups.length === 0 ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                                                                >
                                                                    Confirm Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
