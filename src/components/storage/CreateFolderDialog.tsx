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
  parentId?: string | null;
}

export function CreateFolderDialog({ open, onOpenChange, folderToEdit, parentId }: CreateFolderDialogProps) {
  const { addFolder, updateFolder } = useStorageStore();
  const currentEnv = useAppStore(s => s.envFilter);
  
  const [name, setName] = useState(folderToEdit?.name || '');
  const [selectedIcon, setSelectedIcon] = useState(folderToEdit?.icon || 'Folder');
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(folderToEdit?.customIconUrl || null);

  // Reset form when opening to edit a different folder or creating new
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(folderToEdit?.name || '');
      setSelectedIcon(folderToEdit?.icon || 'Folder');
      setCustomIconUrl(folderToEdit?.customIconUrl || null);
    }
    onOpenChange(newOpen);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objUrl = URL.createObjectURL(file);
      setCustomIconUrl(objUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (folderToEdit) {
      updateFolder(folderToEdit.id, { 
        name, 
        icon: selectedIcon,
        customIconUrl: customIconUrl || undefined
      });
    } else {
      addFolder({
        name,
        icon: selectedIcon,
        customIconUrl: customIconUrl || undefined,
        environmentId: currentEnv,
        parentId: parentId || null,
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
              <Label>Custom Icon Image</Label>
              <div className="flex items-center gap-4">
                {customIconUrl ? (
                  <div className="relative h-12 w-12 rounded-lg border border-border overflow-hidden bg-muted group">
                    <img src={customIconUrl} alt="Custom Icon" className="h-full w-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setCustomIconUrl(null)}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icons.X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/20">
                    <Icons.Image className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="text-xs" 
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">Upload a logo or photo</p>
                </div>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label className="flex justify-between items-center">
                <span>Or select a standard icon</span>
              </Label>
              <div className="grid grid-cols-6 gap-2">
                {COMMON_ICONS.map((iconName) => {
                  const Icon = (Icons as any)[iconName];
                  if (!Icon) return null;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(iconName);
                        setCustomIconUrl(null); // Clear custom if selecting a standard one
                      }}
                      className={`p-2 flex items-center justify-center rounded-md border ${
                        selectedIcon === iconName && !customIconUrl
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
