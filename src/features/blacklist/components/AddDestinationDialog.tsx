import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Pipeline } from '@/types';

interface AddDestinationDialogProps {
  pipelines: Pipeline[];
  onSubmit: (entry: {
    pipelineId: string;
    targetType: 'destination';
    targetValue: string;
    reason: string;
  }) => Promise<void>;
}

const DESTINATION_TYPES_BY_SERVICE: Record<string, { value: string; label: string }[]> = {
  publish: [
    { value: 'kafka', label: 'Kafka' },
    { value: 'gateway', label: 'Gateway' },
  ],
  'sink-data': [{ value: 'postgres', label: 'Postgres' }],
};
const DEFAULT_DESTINATION_TYPES = [
  { value: 'kafka', label: 'Kafka' },
  { value: 'gateway', label: 'Gateway' },
  { value: 'postgres', label: 'Postgres' },
];

export function AddDestinationDialog({ pipelines, onSubmit }: AddDestinationDialogProps) {
  const [open, setOpen] = useState(false);
  const [pipelineId, setPipelineId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [destinationType, setDestinationType] = useState('');
  const [elementId, setElementId] = useState('');
  const [reason, setReason] = useState('');

  const reset = () => {
    setPipelineId('');
    setServiceName('');
    setDestinationType('');
    setElementId('');
    setReason('');
  };

  const submit = async () => {
    if (!pipelineId || !serviceName || !destinationType || !elementId || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    const pipelineName = pipeline ? pipeline.name.toLowerCase() : '';
    const targetValue = `${pipelineName}:${serviceName}:${destinationType}:${elementId}`;
    try {
      await onSubmit({ pipelineId, targetType: 'destination', targetValue, reason });
      setOpen(false);
      reset();
      toast.success('Destination block deployed');
    } catch {
      toast.error('Failed to deploy block');
    }
  };

  const typeOptions = serviceName ? (DESTINATION_TYPES_BY_SERVICE[serviceName] ?? []) : DEFAULT_DESTINATION_TYPES;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : (setOpen(false), reset()))}>
      <DialogTrigger asChild>
        <Button variant="outline" className="blacklist-btn--destination">
          <Plus className="blacklist-btn__icon" /> Destination Stop
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block Destination</DialogTitle>
          <DialogDescription>Stop all traffic to a specific sink.</DialogDescription>
        </DialogHeader>
        <div className="blacklist-dialog__form">
          <div className="blacklist-dialog__field">
            <label className="blacklist-dialog__label">Pipeline</label>
            <Select
              value={pipelineId}
              onValueChange={(v) => {
                setPipelineId(v);
                setServiceName('');
                setDestinationType('');
                setElementId('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="blacklist-dialog__field">
            <label className="blacklist-dialog__label">Service Name</label>
            <Select
              disabled={!pipelineId}
              value={serviceName}
              onValueChange={(v) => {
                setServiceName(v);
                setDestinationType('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publish">Publish</SelectItem>
                <SelectItem value="sink-data">Sink Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="blacklist-dialog__field">
            <label className="blacklist-dialog__label">Destination Type</label>
            <Select disabled={!serviceName} value={destinationType} onValueChange={setDestinationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="blacklist-dialog__field">
            <label className="blacklist-dialog__label">Destination ID</label>
            <Input
              disabled={!pipelineId}
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              value={elementId}
              onChange={(e) => setElementId(e.target.value)}
            />
          </div>
          <div className="blacklist-dialog__field">
            <label className="blacklist-dialog__label">Reason</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Critical failure details..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Block Destination</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
