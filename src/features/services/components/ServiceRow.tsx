import { motion } from 'framer-motion';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusDot } from '@/components/shared/StatusIndicators';
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
import { CPU_LIMIT_MIN, MEMORY_LIMIT_MIN, REPLICAS_MAX, REPLICAS_MIN } from '@/config/constants';
import { usePipelines } from '@/hooks/data/usePipelines';
import { useServices } from '@/hooks/data/useServices';
import type { ServiceStatus } from '@/types';
import { toast } from 'sonner';

export interface ServiceRowItem {
  id: string;
  name: string;
  pipelineId: string;
  pipelineName: string;
  status: ServiceStatus;
  replicas: number;
  cpuLimit: number;
  memoryLimit: number;
}

interface ServiceRowProps {
  service: ServiceRowItem;
  isRolling: boolean;
  onRollout: (id: string) => void;
}

export function ServiceRow({ service, isRolling, onRollout }: ServiceRowProps) {
  const { updateService } = useServices();
  const { pipelines } = usePipelines();

  const handleScale = async (replicaDelta = 0, newCpu?: number, newMem?: number) => {
    const pipeline = pipelines.find((p) => p.id === service.pipelineId);
    const newReplicas = Math.max(REPLICAS_MIN, Math.min(REPLICAS_MAX, service.replicas + replicaDelta));
    if (pipeline?.priority === 'critical' && newReplicas === 0) {
      toast.error('Cannot scale to 0 replicas on critical pipeline');
      return;
    }

    const updates: Record<string, number> = {};
    if (replicaDelta !== 0) updates.replicas = newReplicas;
    if (newCpu !== undefined) updates.cpuLimit = Math.max(CPU_LIMIT_MIN, newCpu);
    if (newMem !== undefined) updates.memoryLimit = Math.max(MEMORY_LIMIT_MIN, newMem);

    if (Object.keys(updates).length > 0) {
      await updateService(service.id, updates);
    }
  };

  return (
    <motion.div
      className={`service-row ${isRolling ? 'animate-pod-roll' : ''}`}
      layout
    >
      <div className="service-row__status">
        <StatusDot status={service.status} pulse />
      </div>
      <div className="service-row__name">{service.name}</div>
      <div className="service-row__pipeline">{service.pipelineName}</div>

      <div>
        <div className="service-row__replicas">
          <Button variant="ghost" size="icon" className="service-row__replica-btn" onClick={() => handleScale(-1)}>
            <Minus className="service-row__replica-icon" />
          </Button>
          <span className="service-row__replica-value">{service.replicas}</span>
          <Button variant="ghost" size="icon" className="service-row__replica-btn" onClick={() => handleScale(1)}>
            <Plus className="service-row__replica-icon" />
          </Button>
        </div>
      </div>

      <div>
        <div className="service-row__resources">
          <div className="service-row__resource-group">
            <Input
              type="number"
              defaultValue={service.cpuLimit}
              onBlur={(e) => handleScale(0, Number(e.target.value), undefined)}
              className="service-row__resource-input"
            />
            <span className="service-row__resource-unit">m</span>
          </div>
          <div className="service-row__resource-group">
            <Input
              type="number"
              defaultValue={service.memoryLimit}
              onBlur={(e) => handleScale(0, undefined, Number(e.target.value))}
              className="service-row__resource-input"
            />
            <span className="service-row__resource-unit">Mi</span>
          </div>
        </div>
      </div>

      <div className="service-row__actions">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="service-row__rollout-btn">
              <RotateCcw className="service-row__rollout-icon" /> Rollout
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rollout Service</AlertDialogTitle>
              <AlertDialogDescription>
                Rollout <span className="font-mono font-bold">{service.name}</span> on{' '}
                <span className="font-mono">{service.pipelineName}</span>? This will trigger a rolling deployment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRollout(service.id)}>Rollout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}
