import { useState } from 'react';
import { ArrowRightLeft, Plus, Search, Trash2, Users } from 'lucide-react';
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
import type { Group, Pipeline } from '@/types';

interface GroupsTabProps {
  selectedPipeline: Pipeline;
  pipelineGroups: Group[];
  primaryPipelines: Pipeline[];
  secondaryPipelines: Pipeline[];
  onCreateGroup: (name: string) => Promise<void>;
  onMoveGroup: (groupId: string, newPipelineId: string) => Promise<void>;
  onToggleSecondary: (groupId: string, secondaryId: string, current: string[]) => Promise<void>;
  onDeleteGroup: (group: Group) => void;
}

export function GroupsTab({
  selectedPipeline,
  pipelineGroups,
  primaryPipelines,
  secondaryPipelines,
  onCreateGroup,
  onMoveGroup,
  onToggleSecondary,
  onDeleteGroup,
}: GroupsTabProps) {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const visible = search
    ? pipelineGroups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : pipelineGroups;

  const handleCreate = async () => {
    if (!newName) return;
    await onCreateGroup(newName);
    setNewName('');
    setCreateOpen(false);
  };

  // suppress unused warning — kept to make the prop explicit at the type boundary
  void selectedPipeline;

  return (
    <div className="groups-tab">
      <div className="groups-tab__header">
        <div className="groups-tab__header-text">
          <h3 className="groups-tab__title">Associated Owner Groups</h3>
          <p className="groups-tab__subtitle">Manage service ownership and permissions for this pipeline.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="groups-tab__assign-btn">
              <Plus className="groups-tab__assign-icon" /> Assign Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign New Group</DialogTitle>
            </DialogHeader>
            <div className="create-pipeline__form">
              <div className="create-pipeline__field">
                <label className="create-pipeline__label">Group Name</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Core Infra" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Confirm Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="groups-tab__search-wrapper">
        <Search className="groups-tab__search-icon" />
        <Input
          placeholder="Filter groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-9 text-xs"
        />
      </div>

      <div className="groups-tab__grid">
        {visible.map((group) => (
          <div
            key={group.id}
            className="groups-tab__card"
          >
            <div className="groups-tab__card-header">
              <div className="groups-tab__card-info">
                <div className="groups-tab__card-icon-wrapper">
                  <Users className="groups-tab__card-icon" />
                </div>
                <div className="groups-tab__card-text">
                  <span className="groups-tab__card-name">{group.name}</span>
                  <span className="groups-tab__card-id">ID: {group.id.slice(0, 8)}</span>
                </div>
              </div>
              <div className="groups-tab__card-actions">
                <Select value={group.primaryPipelineId} onValueChange={(v) => onMoveGroup(group.id, v)}>
                  <SelectTrigger className="groups-tab__move-trigger">
                    <ArrowRightLeft className="groups-tab__move-icon" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {primaryPipelines.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="groups-tab__delete-btn"
                  onClick={() => onDeleteGroup(group)}
                >
                  <Trash2 className="groups-tab__delete-icon" />
                </Button>
              </div>
            </div>
            <div className="groups-tab__secondary-section">
              <span className="groups-tab__secondary-label">
                Linked Secondary Pipelines
              </span>
              <div className="groups-tab__secondary-list">
                {secondaryPipelines.map((sp) => {
                  const isActive = group.secondaryPipelineIds.includes(sp.id);
                  return (
                    <button
                      key={sp.id}
                      onClick={() => onToggleSecondary(group.id, sp.id, group.secondaryPipelineIds)}
                      className={`groups-tab__secondary-btn ${
                        isActive
                          ? 'groups-tab__secondary-btn--active'
                          : 'groups-tab__secondary-btn--inactive'
                      }`}
                    >
                      {sp.name}
                    </button>
                  );
                })}
                {secondaryPipelines.length === 0 && (
                  <span className="groups-tab__secondary-empty">No secondary pipelines defined</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {pipelineGroups.length === 0 && (
        <div className="groups-tab__empty">
          <Users className="groups-tab__empty-icon" />
          <span className="groups-tab__empty-text">No groups associated with this pipeline</span>
        </div>
      )}
    </div>
  );
}

interface DeleteGroupDialogProps {
  group: { id: string; name: string } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteGroupDialog({ group, onClose, onConfirm }: DeleteGroupDialogProps) {
  return (
    <Dialog open={!!group} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Group</DialogTitle>
        </DialogHeader>
        <div className="delete-group__body">
          Are you sure you want to delete <strong>{group?.name}</strong>?
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              toast.success('Group deleted successfully');
            }}
          >
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
