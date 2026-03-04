import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell } from '@/components/ui/table';
import { StatusDot } from '@/components/shared/StatusIndicators';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';
import type { ServiceStatus } from '@/types';

interface ServiceType {
    id: string;
    name: string;
    pipelineId: string;
    pipelineName: string;
    status: ServiceStatus;
    replicas: number;
    cpuLimit: number;
    memoryLimit: number;
    [key: string]: any;
}

export function ServiceRow({
    service,
    isRolling,
    onRollout
}: {
    service: ServiceType;
    isRolling: boolean;
    onRollout: (id: string) => void;
}) {
    const { updateService, pipelines } = useAppStore();

    const handleScale = async (replicaDelta: number = 0, newCpu?: number, newMem?: number) => {
        const pipeline = pipelines.find(a => a.id === service.pipelineId);
        const newReplicas = Math.max(0, Math.min(16, service.replicas + replicaDelta));
        if (pipeline?.priority === 'critical' && newReplicas === 0) {
            toast.error('Cannot scale to 0 replicas on critical pipeline');
            return;
        }

        const updates: Partial<typeof service> = {};
        if (replicaDelta !== 0) updates.replicas = newReplicas;
        if (newCpu !== undefined) updates.cpuLimit = Math.max(10, newCpu);
        if (newMem !== undefined) updates.memoryLimit = Math.max(16, newMem);

        if (Object.keys(updates).length > 0) {
            await updateService(service.id, updates);
        }
    };

    return (
        <motion.tr
            className={`border-b border-border hover:bg-surface-1 transition-colors text-xs ${isRolling ? 'animate-pod-roll' : ''}`}
            layout
        >
            <TableCell><StatusDot status={service.status} pulse /></TableCell>
            <TableCell className="font-mono font-medium">{service.name}</TableCell>
            <TableCell className="text-muted-foreground">{service.pipelineName}</TableCell>
            <TableCell>
                <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleScale(-1)}>
                        <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-mono font-bold w-6 text-center tabular-nums">{service.replicas}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleScale(1)}>
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 w-20">
                        <Input
                            type="number"
                            defaultValue={service.cpuLimit}
                            onBlur={(e) => handleScale(0, Number(e.target.value), undefined)}
                            className="h-7 w-16 text-xs font-mono px-1.5"
                        />
                        <span className="text-[10px] text-muted-foreground font-mono">m</span>
                    </div>
                    <div className="flex items-center gap-1 w-20">
                        <Input
                            type="number"
                            defaultValue={service.memoryLimit}
                            onBlur={(e) => handleScale(0, undefined, Number(e.target.value))}
                            className="h-7 w-16 text-xs font-mono px-1.5"
                        />
                        <span className="text-[10px] text-muted-foreground font-mono">Mi</span>
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-right">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1">
                            <RotateCcw className="h-3 w-3" /> Rollout
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Rollout Service</AlertDialogTitle>
                            <AlertDialogDescription>
                                Rollout <span className="font-mono font-bold">{service.name}</span> on <span className="font-mono">{service.pipelineName}</span>? This will trigger a rolling deployment.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onRollout(service.id)}>Rollout</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
        </motion.tr>
    );
}