import { useState } from 'react';
import { useStorageStore, StorageFolder } from '@/stores/useStorageStore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/stores/useAppStore';
import * as Icons from 'lucide-react';

const COMMON_ICONS = [
  'Folder',
  'Database',
  'Server',
  'Cloud',
  'Hexagon',
  'Code',
  'Terminal',
  'Boxes',
  'Layers',
  'Box',
  'DatabaseZap',
  'Globe',
  'Shield',
  'Cpu',
  'HardDrive',
  'Wifi',
  'Lock',
  'Key',
  'Image',
  'BookOpen',
  'File',
  'Settings',
  'MessageSquare'
] as const;

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderToEdit?: StorageFolder | null;
}

export function CreateFolderDialog({ open, onOpenChange, folderToEdit }: CreateFolderDialogProps) {
  const { addFolder, updateFolder } = useStorageStore();
  const currentEnv = useAppStore(s => s.envFilter);
  
  const [name, setName] = useState(folderToEdit?.name || '');
  const [selectedIcon, setSelectedIcon] = useState(folderToEdit?.icon || 'Folder');

  // Reset form when opening to edit a different folder or creating new
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(folderToEdit?.name || '');
      setSelectedIcon(folderToEdit?.icon || 'Folder');
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (folderToEdit) {
      updateFolder(folderToEdit.id, { name, icon: selectedIcon });
    } else {
      addFolder({
        name,
        icon: selectedIcon,
        environmentId: currentEnv,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{folderToEdit ? 'Edit Folder' : 'Create New Folder'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Kafka, Redis, Docs"
                autoFocus
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2">
                {COMMON_ICONS.map((iconName) => {
                  const Icon = (Icons as any)[iconName];
                  if (!Icon) return null;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`p-2 flex items-center justify-center rounded-md border ${
                        selectedIcon === iconName 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-background hover:bg-muted border-input'
                      } transition-colors`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {folderToEdit ? 'Save Changes' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
