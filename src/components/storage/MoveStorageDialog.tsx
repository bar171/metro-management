import { useState } from 'react';
import { useStorageStore, StorageFolder } from '@/stores/useStorageStore';
import { useAppStore } from '@/stores/useAppStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderIcon, Home } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MoveStorageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFolderIds: string[];
  selectedItemIds: string[];
  currentFolderId: string | null;
  onMoveComplete: () => void;
}

export function MoveStorageDialog({
  open,
  onOpenChange,
  selectedFolderIds,
  selectedItemIds,
  currentFolderId,
  onMoveComplete
}: MoveStorageDialogProps) {
  const currentEnv = useAppStore((state) => state.envFilter);
  const { folders, moveItems } = useStorageStore();

  // State to track which folder is currently selected as the destination
  const [targetId, setTargetId] = useState<string | null>(currentFolderId);

  // We filter out folders that are currently selected (you can't move a folder inside itself)
  const availableFolders = folders.filter(
    f => !selectedFolderIds.includes(f.id) && (f.isGlobal || f.environmentId === currentEnv)
  );

  const renderTree = (parentId: string | null = null, depth: number = 0) => {
    const children = availableFolders.filter(f => f.parentId === parentId || (parentId === null && !f.parentId));
    
    return children.map(folder => (
      <div key={folder.id} className="flex flex-col">
        <button
          onClick={() => setTargetId(folder.id)}
          className={`flex items-center gap-3 w-full p-2 py-1.5 rounded-md transition-colors text-left text-sm ${
            targetId === folder.id 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'hover:bg-muted text-foreground'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <div className={`p-1.5 rounded-md ${targetId === folder.id ? 'bg-primary/20' : 'bg-muted'}`}>
            <FolderIcon className="h-4 w-4" />
          </div>
          <span className="truncate">{folder.name}</span>
          {folder.isGlobal && (
            <span className="ml-auto text-[10px] uppercase tracking-wider bg-muted-foreground/10 text-muted-foreground px-2 py-0.5 rounded-full">
              Global
            </span>
          )}
        </button>
        {/* Recursive call for nested children */}
        {renderTree(folder.id, depth + 1)}
      </div>
    ));
  };

  const handleMove = () => {
    moveItems(selectedFolderIds, selectedItemIds, targetId);
    onMoveComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move {selectedFolderIds.length + selectedItemIds.length} items</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select a destination folder:
          </p>

          <ScrollArea className="h-[250px] pr-4 rounded-md border p-2">
            <div className="flex flex-col gap-1">
              {/* Root Option */}
              <button
                onClick={() => setTargetId(null)}
                className={`flex items-center gap-3 w-full p-2 rounded-md transition-colors text-left text-sm ${
                  targetId === null 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <div className={`p-1.5 rounded-md ${targetId === null ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Home className="h-4 w-4" />
                </div>
                <span>Storage Root</span>
              </button>

              {/* Folder Options Tree */}
              {renderTree(null, 0)}
              
              {availableFolders.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No compatible folders available.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={targetId === currentFolderId}>
            Move Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
