import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface DeletePipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineName: string;
  associatedGroupsCount: number;
  onConfirm: () => Promise<void>;
}

export function DeletePipelineDialog({
  open,
  onOpenChange,
  pipelineName,
  associatedGroupsCount,
  onConfirm,
}: DeletePipelineDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="delete-pipeline__trigger">
          <Trash2 className="delete-pipeline__trigger-icon" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <div className="delete-pipeline__body">
          {associatedGroupsCount > 0 ? (
            <div className="delete-pipeline__restriction">
              <strong>Restricted:</strong> This pipeline has {associatedGroupsCount} associated groups. Move or delete
              them before proceeding.
            </div>
          ) : (
            <p>
              Are you sure you want to delete <strong>{pipelineName}</strong>? This action cannot be undone.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={associatedGroupsCount > 0} onClick={onConfirm}>
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
