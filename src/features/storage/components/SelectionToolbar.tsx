import { CheckSquare, FolderInput, LayoutGrid, List, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StorageViewMode } from './FolderCard';

interface SelectionToolbarProps {
  selectionCount: number;
  isSelectionMode: boolean;
  viewMode: StorageViewMode;
  onViewModeChange: (mode: StorageViewMode) => void;
  onEnterSelection: () => void;
  onExitSelection: () => void;
  onMove: () => void;
  onBulkDelete: () => void;
  onCreateItem: () => void;
  onCreateFolder: () => void;
}

export function SelectionToolbar({
  selectionCount,
  isSelectionMode,
  viewMode,
  onViewModeChange,
  onEnterSelection,
  onExitSelection,
  onMove,
  onBulkDelete,
  onCreateItem,
  onCreateFolder,
}: SelectionToolbarProps) {
  if (isSelectionMode) {
    return (
      <div className="sel-toolbar animate-in fade-in slide-in-from-right-4">
        <div className="sel-toolbar__count px-3 py-1.5 bg-primary/10 text-primary rounded-md mr-2">
          {selectionCount} Selected
        </div>
        {selectionCount > 0 && (
          <>
            <Button variant="outline" className="sel-toolbar__action-btn shadow-sm" onClick={onMove}>
              <FolderInput className="sel-toolbar__action-icon" />
              Move
            </Button>
            <Button variant="destructive" className="sel-toolbar__action-btn shadow-sm" onClick={onBulkDelete}>
              <Trash2 className="sel-toolbar__action-icon" />
              Delete
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" onClick={onExitSelection} className="sel-toolbar__exit-btn">
          <X className="sel-toolbar__exit-icon" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex bg-muted/50 p-1 rounded-lg mr-2 border">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-1.5 rounded-md transition-colors ${
            viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutGrid className="sel-toolbar__view-icon" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-1.5 rounded-md transition-colors ${
            viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="sel-toolbar__view-icon" />
        </button>
      </div>
      <Button variant="secondary" className="sel-toolbar__action-btn shadow-sm" onClick={onEnterSelection}>
        <CheckSquare className="sel-toolbar__action-icon" />
        Select
      </Button>
      <Button variant="outline" className="sel-toolbar__action-btn shadow-sm" onClick={onCreateItem}>
        <Plus className="sel-toolbar__action-icon" />
        Add File / Link
      </Button>
      <Button variant="default" className="sel-toolbar__action-btn shadow-sm" onClick={onCreateFolder}>
        <Plus className="sel-toolbar__action-icon" />
        New Folder
      </Button>
    </>
  );
}
