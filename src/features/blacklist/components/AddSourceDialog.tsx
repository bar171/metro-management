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

interface AddSourceDialogProps {
  pipelines: Pipeline[];
  onSubmit: (entry: {
    pipelineId: string;
    targetType: 'source';
    targetValue: string;
    reason: string;
  }) => Promise<void>;
}

const SOURCE_SERVICES = [
  { value: 'kafka-consumer', label: 'Kafka Consumer' },
  { value: 'get-data', label: 'Get Data' },
  { value: 'push-data', label: 'Push Data' },
];

export function AddSourceDialog({ pipelines, onSubmit }: AddSourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [pipelineId, setPipelineId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [elementId, setElementId] = useState('');
  const [reason, setReason] = useState('');

  const reset = () => {
    setPipelineId('');
    setServiceName('');
    setElementId('');
    setReason('');
  };

  const submit = async () => {
    if (!pipelineId || !serviceName || !elementId || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    const pipelineName = pipeline ? pipeline.name.toLowerCase() : '';
    const targetValue = `${pipelineName}:${serviceName}:source:${elementId}`;
    try {
      await onSubmit({ pipelineId, targetType: 'source', targetValue, reason });
      setOpen(false);
      reset();
      toast.success('Source block deployed');
    } catch {
      toast.error('Failed to deploy block');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : (setOpen(false), reset()))}>
      <DialogTrigger asChild>
        <Button variant="outline" className="blacklist-btn--source">
          <Plus className="blacklist-btn__icon" /> Source Stop
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block Source</DialogTitle>
          <DialogDescription>Select a specific source to halt ingress.</DialogDescription>
        </DialogHeader>
        <div className="blacklist-dialog__form">
          <div className="blacklist-dialog__field">
            <label className="blacklist-dialog__label">Pipeline</label>
            <Select
              value={pipelineId}
              onValueChange={(v) => {
                setPipelineId(v);
                setServiceName('');
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
            <Select disabled={!pipelineId} value={serviceName} onValueChange={setServiceName}>
              <SelectTrigger>
                <SelectValue placeholder="Select Service" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_SERVICES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="blacklist-dialog__field">
            <label className="blacklist-dialog__label">Source ID</label>
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
              placeholder="Incident ID or reason..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Block Source</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
