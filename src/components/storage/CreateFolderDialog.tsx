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

const COLORS = [
  { name: 'default', class: 'bg-muted/50 border-input' },
  { name: 'red', class: 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-500' },
  { name: 'orange', class: 'bg-orange-500/20 border-orange-500/50 hover:bg-orange-500/30 text-orange-500' },
  { name: 'yellow', class: 'bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30 text-yellow-500' },
  { name: 'green', class: 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30 text-green-500' },
  { name: 'blue', class: 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30 text-blue-500' },
  { name: 'purple', class: 'bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30 text-purple-500' },
  { name: 'pink', class: 'bg-pink-500/20 border-pink-500/50 hover:bg-pink-500/30 text-pink-500' },
];

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
  const [selectedColor, setSelectedColor] = useState(folderToEdit?.color || 'default');

  // Reset form when opening to edit a different folder or creating new
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(folderToEdit?.name || '');
      setSelectedIcon(folderToEdit?.icon || 'Folder');
      setCustomIconUrl(folderToEdit?.customIconUrl || null);
      setSelectedColor(folderToEdit?.color || 'default');
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
        customIconUrl: customIconUrl || undefined,
        color: selectedColor === 'default' ? undefined : selectedColor
      });
    } else {
      addFolder({
        name,
        icon: selectedIcon,
        customIconUrl: customIconUrl || undefined,
        color: selectedColor === 'default' ? undefined : selectedColor,
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
              <Label>Color Theme</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${c.class} ${
                      selectedColor === c.name ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label className="flex justify-between items-center">
                <span>Icon</span>
              </Label>
              <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                {/* Custom Image Upload acts as the very first grid item */}
                <div className="relative group col-span-1 h-10">
                  {customIconUrl ? (
                    <div className="h-full w-full rounded-md border border-primary ring-2 ring-primary/20 overflow-hidden bg-muted">
                      <img src={customIconUrl} alt="Custom Icon" className="h-full w-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setCustomIconUrl(null)}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icons.X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="h-full w-full rounded-md border border-dashed border-muted-foreground/50 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/50 cursor-pointer transition-colors px-1 text-center">
                      <Icons.ImagePlus className="h-4 w-4 text-muted-foreground mb-1" />
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                {/* Standard Icons follow immediately after */}
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
