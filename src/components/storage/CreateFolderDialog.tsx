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

const BRAND_ICONS: { id: string; icon?: any; imgUrl?: string; label: string; color?: string }[] = [
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
  const [folderColor, setFolderColor] = useState(folderToEdit?.color || '');

  useEffect(() => {
    if (open) {
      setName(folderToEdit?.name || '');
      setSelectedIcon(folderToEdit?.icon || 'kafka');
      setCustomIconUrl(folderToEdit?.customIconUrl || null);
      setFolderColor(folderToEdit?.color || '');
    }
  }, [open, folderToEdit]);

  // Reset form when opening to edit a different folder or creating new
  const handleOpenChange = (newOpen: boolean) => {
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
        color: folderColor || undefined
      });
    } else {
      addFolder({
        name,
        icon: selectedIcon,
        customIconUrl: customIconUrl || undefined,
        color: folderColor || undefined,
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
              <Label>Folder Custom Color (Optional)</Label>
              <div className="flex gap-2">
                {['', '#3B82F6', '#10B981', '#F59E0B', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#64748B'].map(c => (
                  <button
                    key={c || 'none'}
                    type="button"
                    onClick={() => setFolderColor(c)}
                    className={`h-6 w-6 rounded-full border-2 ${folderColor === c ? 'border-primary border-[3px]' : 'border-transparent'} ${!c ? 'bg-muted/50 border-input' : ''} transition-all`}
                    style={c ? { backgroundColor: c } : {}}
                    title={c || 'Default color'}
                  />
                ))}
              </div>
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
                      <LucideIcons.X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/20">
                    <LucideIcons.Image className="h-5 w-5 text-muted-foreground/50" />
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
                <span>Or select a brand icon</span>
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
              <div className="grid grid-cols-6 gap-2">
                {GENERIC_ICONS.map((iconName) => {
                  const Icon = (LucideIcons as any)[iconName];
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
