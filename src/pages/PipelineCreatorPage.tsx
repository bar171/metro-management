import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Plus, Users, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import type { PipelineType, Environment } from '@/types';

export default function PipelineCreatorPage() {
    const { pipelines, groups, createPipeline, deletePipeline, deleteGroup } = useAppStore();

    const [newPipelineName, setNewPipelineName] = useState('');
    const [newPipelineType, setNewPipelineType] = useState<PipelineType>('BASIC');
    const [newPipelineEnv, setNewPipelineEnv] = useState<Environment>('dev');

    const handleCreatePipeline = async () => {
        if (!newPipelineName.trim()) {
            toast.error('Pipeline name is required');
            return;
        }
        await createPipeline({
            name: newPipelineName,
            type: newPipelineType,
            environment: newPipelineEnv,
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

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Pipeline Creator</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage pipelines and their associated owner groups.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Create Pipeline Form */}
                <div className="md:col-span-1 space-y-4 rounded-lg border border-border bg-card p-5 h-fit">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Plus className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold">Create New Pipeline</h3>
                    </div>
                    <div className="space-y-4">
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
                        <div className="space-y-2">
                            <label className="text-xs font-medium">Environment</label>
                            <Select value={newPipelineEnv} onValueChange={(v) => setNewPipelineEnv(v as Environment)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dev">dev</SelectItem>
                                    <SelectItem value="prep">prep</SelectItem>
                                    <SelectItem value="prod">prod</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleCreatePipeline} className="w-full text-xs h-8">
                            Create Pipeline
                        </Button>
                    </div>
                </div>

                {/* Existing Pipelines and Groups */}
                <div className="md:col-span-2 space-y-4">
                    <div className="rounded-lg border border-border bg-card overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-border p-4 bg-surface-1/50">
                            <GitBranch className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-sm font-semibold">Managed Pipelines & Groups</h3>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface-1">
                                    <TableHead className="text-[10px] font-mono uppercase">Pipeline</TableHead>
                                    <TableHead className="text-[10px] font-mono uppercase">Groups</TableHead>
                                    <TableHead className="text-[10px] font-mono uppercase text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pipelines.map(pipeline => {
                                    const pipelineGroups = groups.filter(g => g.pipelineId === pipeline.id);
                                    return (
                                        <TableRow key={pipeline.id} className="border-b border-border hover:bg-surface-1/50 transition-colors">
                                            <TableCell className="font-medium align-top pt-4">
                                                <div className="flex flex-col gap-1">
                                                    <span>{pipeline.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">{pipeline.type} · {pipeline.environment}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top pt-4">
                                                {pipelineGroups.length === 0 ? (
                                                    <span className="text-[10px] text-muted-foreground italic">No groups attached</span>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        {pipelineGroups.map(group => (
                                                            <div key={group.id} className="flex items-center justify-between bg-surface-2 p-1.5 px-2 rounded border border-border">
                                                                <span className="text-xs flex items-center gap-1.5"><Users className="w-3 h-3 text-muted-foreground" />{group.name}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-5 w-5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                    onClick={() => handleDeleteGroup(group.id)}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
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
    );
}
