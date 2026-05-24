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
import { toast } from 'sonner';

interface AddBrokerDialogProps {
  onSubmit: (entry: {
    pipelineId: 'all';
    targetType: 'broker';
    targetValue: string;
    reason: string;
  }) => Promise<void>;
}

export function AddBrokerDialog({ onSubmit }: AddBrokerDialogProps) {
  const [open, setOpen] = useState(false);
  const [targetValue, setTargetValue] = useState('');
  const [reason, setReason] = useState('');

  const reset = () => {
    setTargetValue('');
    setReason('');
  };

  const submit = async () => {
    if (!targetValue || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await onSubmit({ pipelineId: 'all', targetType: 'broker', targetValue, reason });
      setOpen(false);
      reset();
      toast.success('Broker block deployed');
    } catch {
      toast.error('Failed to deploy block');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : (setOpen(false), reset()))}>
      <DialogTrigger asChild>
        <Button variant="outline" className="blacklist-btn--broker">
          <Plus className="blacklist-btn__icon" /> Global Broker Block
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Isolate Kafka Broker</DialogTitle>
          <DialogDescription>Block all connections to a specific broker across all pipelines.</DialogDescription>
        </DialogHeader>
        <div className="blacklist-dialog__form">
          <div className="blacklist-dialog__field">
            <label className="blacklist-dialog__label">Broker Address</label>
            <Input
              placeholder="e.g. kafka-broker-01.metro.svc:9092"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            />
          </div>
          <div className="blacklist-dialog__field">
            <label className="blacklist-dialog__label">Reason</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Maintenance or failure isolation reason..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Isolate Broker</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
