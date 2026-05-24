import { useState } from 'react';
import { Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { BackfillRequest, Pipeline } from '@/types';

interface TriggerBackfillDialogProps {
  pipelines: Pipeline[];
  onSubmit: (data: BackfillRequest & { pipelineId: string }) => Promise<void>;
}

export function TriggerBackfillDialog({ pipelines, onSubmit }: TriggerBackfillDialogProps) {
  const [open, setOpen] = useState(false);
  const [pipelineId, setPipelineId] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [deltaMs, setDeltaMs] = useState(3600000);
  const [queryIntervalMs, setQueryIntervalMs] = useState(1000);

  const reset = () => {
    setPipelineId('');
    setFromTime('');
    setToTime('');
    setDeltaMs(3600000);
    setQueryIntervalMs(1000);
  };

  const submit = async () => {
    if (!pipelineId || !fromTime || !toTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await onSubmit({ pipelineId, fromTime, toTime, deltaMs, queryIntervalMs });
      toast.success('Broad backfill triggered successfully');
      setOpen(false);
      reset();
    } catch {
      toast.error('Failed to trigger backfill');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="trigger-backfill__btn">
          <Play className="trigger-backfill__btn-icon" /> Trigger Broad Backfill
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Broad Backfill</DialogTitle>
          <DialogDescription>Submit a broad backfill request for a pipeline.</DialogDescription>
        </DialogHeader>
        <div className="trigger-backfill__form">
          <div className="trigger-backfill__field">
            <label className="trigger-backfill__label">Target Pipeline</label>
            <Select value={pipelineId} onValueChange={setPipelineId}>
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
          <div className="trigger-backfill__grid">
            <div className="trigger-backfill__field">
              <label className="trigger-backfill__label">From Time</label>
              <div className="trigger-backfill__time-wrapper">
                <Input
                  type="datetime-local"
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  className="trigger-backfill__time-input"
                />
                <Clock className="trigger-backfill__time-icon" />
              </div>
            </div>
            <div className="trigger-backfill__field">
              <label className="trigger-backfill__label">To Time</label>
              <div className="trigger-backfill__time-wrapper">
                <Input
                  type="datetime-local"
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                  className="trigger-backfill__time-input"
                />
                <Clock className="trigger-backfill__time-icon" />
              </div>
            </div>
          </div>
          <div className="trigger-backfill__grid">
            <div className="trigger-backfill__field">
              <label className="trigger-backfill__label">Delta (ms)</label>
              <Input
                type="number"
                value={deltaMs}
                onChange={(e) => setDeltaMs(Number(e.target.value))}
              />
            </div>
            <div className="trigger-backfill__field">
              <label className="trigger-backfill__label">Query Interval (ms)</label>
              <Input
                type="number"
                value={queryIntervalMs}
                onChange={(e) => setQueryIntervalMs(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Trigger Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
