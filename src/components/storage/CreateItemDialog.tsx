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
  // For file simulation
  const [fileToSimulate, setFile] = useState<File | null>(null);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(itemToEdit?.name || '');
      setType(itemToEdit?.type || 'link');
      setUrl(itemToEdit?.url || '');
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
      updateItem(itemToEdit.id, { name, type, url });
    } else {
      addItem({
        folderId,
        name,
        type,
        url: url || '#', 
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
                    onClick={() => setType(t)}
                  >
                    {t}
                  </Button>
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
