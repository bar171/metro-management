import { useState, useEffect } from 'react';
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
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import {
  SiSplunk,
  SiGrafana,
  SiApachekafka,
  SiPostgresql,
  SiRedis,
  SiJira,
  SiConfluence,
  SiRedhatopenshift
} from 'react-icons/si';

export const BRAND_ICONS: { id: string; icon?: LucideIcon | React.ComponentType; imgUrl?: string; label: string; color?: string }[] = [
  { id: 'kafka', icon: SiApachekafka, label: 'Kafka' }, // No color -> inherits text color
  { id: 'postgres', icon: SiPostgresql, label: 'Postgres', color: '#4169E1' },
  { id: 'redis', icon: SiRedis, label: 'Redis', color: '#DC382D' },
  { id: 'airflow', imgUrl: '/airflow-icon.svg', label: 'Airflow' },
  { id: 'grafana', icon: SiGrafana, label: 'Grafana', color: '#F46800' },
  { id: 'splunk', icon: SiSplunk, label: 'Splunk' }, // No color -> inherits text color
  { id: 'openshift', icon: SiRedhatopenshift, label: 'OpenShift', color: '#EE0000' },
  { id: 'jira', icon: SiJira, label: 'Jira', color: '#0052CC' },
  { id: 'confluence', icon: SiConfluence, label: 'Confluence', color: '#172B4D' },
  { id: 'cloud', icon: LucideIcons.Cloud, label: 'Cloud' },
];

const GENERIC_ICONS = [
  'Folder',
  'Database',
  'Server',
  'Cloud',
  'Boxes',
  'Settings',
  'File',
  'Shield',
  'Cpu',
  'Network',
  'Terminal',
  'Globe'
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
  const [selectedIcon, setSelectedIcon] = useState(folderToEdit?.icon || 'kafka');
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(folderToEdit?.customIconUrl || null);
  const [selectedColor, setSelectedColor] = useState(folderToEdit?.color || 'default');

  useEffect(() => {
    if (open) {
      setName(folderToEdit?.name || '');
      setSelectedIcon(folderToEdit?.icon || 'kafka');
      setCustomIconUrl(folderToEdit?.customIconUrl || null);
      setSelectedColor(folderToEdit?.color || 'default');
    }
  }, [open, folderToEdit]);

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
                placeholder="e.g., Kafka Clusters, Redis Caches"
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
                    className={`h-8 w-8 rounded-full border-2 transition-all ${c.class} ${selectedColor === c.name ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-70 hover:opacity-100'
                      }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="flex justify-between items-center">
                <span>select icon</span>
              </Label>
              <div className="grid grid-cols-6 gap-2">
                {BRAND_ICONS.map((brand) => {
                  const Icon = brand.icon;
                  return (
                    <button
                      key={brand.id}
                      type="button"
                      title={brand.label}
                      onClick={() => {
                        setSelectedIcon(brand.id);
                        setCustomIconUrl(null); // Clear custom if selecting a standard one
                      }}
                      className={`p-2 flex items-center justify-center rounded-md border ${selectedIcon === brand.id && !customIconUrl
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-input'
                        } transition-colors`}
                    >
                      {Icon ? <Icon className="h-5 w-5" style={brand.color ? { color: brand.color } : {}} /> : null}
                      {brand.imgUrl ? <img src={brand.imgUrl} alt={brand.label} className="h-5 w-5 object-contain" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="flex justify-between items-center">
                <span>Or select a generic icon</span>
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
                        <LucideIcons.X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="h-full w-full rounded-md border border-dashed border-muted-foreground/50 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/50 cursor-pointer transition-colors px-1 text-center">
                      <LucideIcons.ImagePlus className="h-4 w-4 text-muted-foreground mb-1" />
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
                {GENERIC_ICONS.map((iconName) => {
                  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
                  if (!Icon) return null;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      title={iconName}
                      onClick={() => {
                        setSelectedIcon(iconName);
                        setCustomIconUrl(null);
                      }}
                      className={`p-2 flex items-center justify-center rounded-md border ${selectedIcon === iconName && !customIconUrl
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-input'
                        } transition-colors`}
                    >
                      <Icon className="h-5 w-5" />
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
