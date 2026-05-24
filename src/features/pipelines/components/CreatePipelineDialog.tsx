import { ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Pipeline, PipelineType } from '@/types';

interface CreatePipelineDialogProps {
  children: ReactNode; // trigger element
  onCreate: (data: { name: string; type: PipelineType }) => Promise<void>;
  defaultEnvironment: Pipeline['environment'];
}

export function CreatePipelineDialog({ children, onCreate }: CreatePipelineDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<PipelineType>('BASIC');

  const handleCreate = async () => {
    if (!name) return;
    await onCreate({ name, type });
    setName('');
    setOpen(false);
    toast.success('Pipeline created successfully');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Pipeline</DialogTitle>
        </DialogHeader>
        <div className="create-pipeline__form">
          <div className="create-pipeline__field">
            <label className="create-pipeline__label">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fraud-Detection" />
          </div>
          <div className="create-pipeline__grid">
            <div className="create-pipeline__field">
              <label className="create-pipeline__label">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as PipelineType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">BASIC</SelectItem>
                  <SelectItem value="STREAM">STREAM</SelectItem>
                  <SelectItem value="BACKFILL">BACKFILL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
