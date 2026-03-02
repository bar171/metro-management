import { useState } from 'react';
import { useStorageStore, StorageItem, StorageItemType } from '@/stores/useStorageStore';
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

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  itemToEdit?: StorageItem | null;
}

export function CreateItemDialog({ open, onOpenChange, folderId, itemToEdit }: CreateItemDialogProps) {
  const { addItem, updateItem } = useStorageStore();
  const currentEnv = useAppStore(s => s.envFilter);
  
  const [name, setName] = useState(itemToEdit?.name || '');
  const [type, setType] = useState<StorageItemType>(itemToEdit?.type || 'link');
  const [url, setUrl] = useState(itemToEdit?.url || '');
  const [selectedColor, setSelectedColor] = useState(itemToEdit?.color || 'default');
  // For file simulation
  const [fileToSimulate, setFile] = useState<File | null>(null);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(itemToEdit?.name || '');
      setType(itemToEdit?.type || 'link');
      setUrl(itemToEdit?.url || '');
      setSelectedColor(itemToEdit?.color || 'default');
      setFile(null);
    }
    onOpenChange(newOpen);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      if (!name) setName(f.name);
      
      // Simulate file upload with object URL
      const objUrl = URL.createObjectURL(f);
      setUrl(objUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (type === 'link' && !url.trim()) return;

    if (itemToEdit) {
      updateItem(itemToEdit.id, { 
        name, 
        type, 
        url,
        color: selectedColor === 'default' ? undefined : selectedColor
      });
    } else {
      addItem({
        folderId,
        name,
        type,
        url: url || '#', 
        color: selectedColor === 'default' ? undefined : selectedColor,
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
            <DialogTitle>{itemToEdit ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="grid gap-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                {(['link', 'photo', 'document'] as StorageItemType[]).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={type === t ? 'default' : 'outline'}
                    className="flex-1 capitalize"
                    disabled={!!itemToEdit}
                    onClick={() => setType(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
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
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'link' ? 'e.g., Kafka Dashboard' : 'e.g., Architecture.pdf'}
              />
            </div>
            
            {type === 'link' ? (
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="file">Upload File</Label>
                <Input
                  id="file"
                  type="file"
                  accept={type === 'photo' ? 'image/*' : '*/*'}
                  onChange={handleFileChange}
                />
                {url && !fileToSimulate && itemToEdit && (
                  <p className="text-xs text-muted-foreground mt-1">Current file uploaded. Select a new one to replace.</p>
                )}
              </div>
            )}
            
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || (type === 'link' && !url.trim() && !fileToSimulate)}>
              {itemToEdit ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
