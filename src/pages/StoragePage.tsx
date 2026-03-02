import { useState } from 'react';
import { useStorageStore, StorageFolder, StorageItem } from '@/stores/useStorageStore';
import { useAppStore } from '@/stores/useAppStore';
import { Plus, MoreVertical, Trash2, Edit2, Link as LinkIcon, Image as ImageIcon, FileText, ExternalLink } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CreateFolderDialog } from '@/components/storage/CreateFolderDialog';
import { CreateItemDialog } from '@/components/storage/CreateItemDialog';
import { StorageBreadcrumbs } from '@/components/storage/StorageBreadcrumbs';
import {
  SiSplunk, SiGrafana, SiApachekafka, SiPostgresql, SiRedis,
  SiJira, SiConfluence, SiRedhatopenshift,
} from 'react-icons/si';

const BRAND_ICONS: { id: string; icon?: any; imgUrl?: string; label: string; color?: string }[] = [
  { id: 'kafka', icon: SiApachekafka, label: 'Kafka' },
  { id: 'postgres', icon: SiPostgresql, label: 'Postgres', color: '#4169E1' },
  { id: 'redis', icon: SiRedis, label: 'Redis', color: '#DC382D' },
  { id: 'airflow', imgUrl: '/airflow-icon.svg', label: 'Airflow' },
  { id: 'grafana', icon: SiGrafana, label: 'Grafana', color: '#F46800' },
  { id: 'splunk', icon: SiSplunk, label: 'Splunk' },
  { id: 'openshift', icon: SiRedhatopenshift, label: 'OpenShift', color: '#EE0000' },
  { id: 'jira', icon: SiJira, label: 'Jira', color: '#0052CC' },
  { id: 'confluence', icon: SiConfluence, label: 'Confluence', color: '#172B4D' },
  { id: 'cloud', icon: Icons.Cloud, label: 'Cloud' },
];

export default function StoragePage() {
  const currentEnv = useAppStore((state) => state.envFilter);
  const { folders, items, deleteFolder, deleteItem } = useStorageStore();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<StorageFolder | null>(null);

  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StorageItem | null>(null);

  // Filter entities according to environment and current nested path level
  const activeFolders = folders.filter(
    f => f.environmentId === currentEnv && (f.parentId || null) === currentFolderId
  );

  const activeItems = currentFolderId
    ? items.filter(i => i.folderId === currentFolderId)
    : []; // Items only exist inside folders

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    if (confirm(`Are you sure you want to delete folder "${folderName}" and all its contents?`)) {
      deleteFolder(folderId);
    }
  };

  const handleItemClick = (item: StorageItem) => {
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'link': return <LinkIcon className="h-6 w-6 text-blue-500" />;
      case 'photo': return <ImageIcon className="h-6 w-6 text-green-500" />;
      case 'document': return <FileText className="h-6 w-6 text-orange-500" />;
      default: return <FileText className="h-6 w-6" />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex-1 w-full sm:w-auto">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Storage & Resources
          </h1>
          <div className="mt-4">
            <StorageBreadcrumbs
              currentFolderId={currentFolderId}
              onNavigate={setCurrentFolderId}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          {currentFolderId && (
            <Button variant="outline" className="gap-2 shrink-0 shadow-sm" onClick={() => setIsCreateItemOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          )}
          <Button variant="default" className="gap-2 shrink-0 shadow-sm" onClick={() => setIsCreateFolderOpen(true)}>
            <Plus className="h-4 w-4" />
            New Folder
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto -mx-6 px-6 -mb-8 pb-8">
        {activeFolders.length === 0 && activeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card/50 border-dashed h-64">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Icons.FolderPlus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">This directory is empty</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Use the buttons above to create a new folder or add an item here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Render Folders */}
            {activeFolders.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Folders</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {activeFolders.map((folder) => {
                    const Icon = (Icons as any)[folder.icon] || Icons.Folder;
                    return (
                      <div
                        key={folder.id}
                        className="relative group border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm transition-all hover:shadow-md flex items-center p-1"
                        style={folder.color ? {
                          borderColor: `${folder.color}40`,
                          backgroundColor: `${folder.color}10`,
                          boxShadow: `inset 0 0 20px ${folder.color}05`
                        } : {
                          borderColor: 'hsl(var(--border) / 0.5)'
                        }}
                      >
                        <div
                          className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                          style={folder.color ? { backgroundImage: `linear-gradient(to bottom right, ${folder.color}20, transparent)` } : {}}
                        />
                        <div
                          className="flex-1 flex items-center gap-4 p-3 cursor-pointer z-10"
                          onClick={() => setCurrentFolderId(folder.id)}
                        >
                          {folder.customIconUrl ? (
                            <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-border shadow-sm">
                              <img src={folder.customIconUrl} alt={folder.name} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div
                              className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border transition-colors"
                              style={folder.color ? {
                                backgroundColor: `${folder.color}20`,
                                borderColor: `${folder.color}40`,
                                color: folder.color
                              } : {
                                backgroundColor: 'hsl(var(--muted))',
                                borderColor: 'hsl(var(--border) / 0.5)'
                              }}
                            >
                              {(() => {
                                const brand = BRAND_ICONS.find(b => b.id === folder.icon);
                                if (brand) {
                                  if (brand.imgUrl) return <img src={brand.imgUrl} alt={brand.label} className="h-6 w-6 object-contain" />;
                                  const BrandIcon = brand.icon;
                                  return <BrandIcon className="h-5 w-5" style={brand.color ? { color: brand.color } : folder.color ? {} : {}} />;
                                }
                                const Icon = (Icons as any)[folder.icon] || Icons.Folder;
                                return <Icon className="h-5 w-5" />;
                              })()}
                            </div>
                          )}

                          <div className="flex-1 min-w-0 pr-4">
                            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate"
                              style={folder.color ? { color: folder.color } : { color: 'hsl(var(--foreground))' }}>
                              {folder.name}
                            </h3>
                          </div>
                        </div>

                        <div className="relative z-20 mr-1 shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setFolderToEdit(folder);
                                setIsCreateFolderOpen(true);
                              }}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id, folder.name);
                              }}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Render Items */}
            {activeItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Files & Links</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {activeItems.map(item => (
                    <div
                      key={item.id}
                      className="relative group border border-border/50 rounded-xl overflow-hidden bg-card transition-all hover:shadow-md hover:border-primary/30"
                    >
                      <div
                        className="cursor-pointer"
                        onClick={() => handleItemClick(item)}
                      >
                        {item.type === 'photo' && item.url !== '#' ? (
                          <div className="h-32 w-full bg-muted overflow-hidden relative border-b border-border/50">
                            <img src={item.url} alt={item.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </div>
                        ) : (
                          <div className="h-32 w-full bg-muted/40 flex items-center justify-center border-b border-border/50 group-hover:bg-muted/60 transition-colors">
                            <div className="h-16 w-16 rounded-2xl bg-background shadow-sm border border-border flex items-center justify-center">
                              {getItemIcon(item.type)}
                            </div>
                          </div>
                        )}

                        <div className="p-3">
                          <p className="font-medium text-sm truncate flex justify-between items-center" title={item.name}>
                            {item.name}
                            {item.type === 'link' && <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 capitalize truncate">
                            {item.type} {item.createdAt && `• ${new Date(item.createdAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToEdit(item);
                              setIsCreateItemOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(item.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={(op) => {
          setIsCreateFolderOpen(op);
          if (!op) setFolderToEdit(null);
        }}
        folderToEdit={folderToEdit}
        parentId={currentFolderId} // Passes active dir to create new folders inside it
      />

      {currentFolderId && (
        <CreateItemDialog
          open={isCreateItemOpen}
          onOpenChange={(op) => {
            setIsCreateItemOpen(op);
            if (!op) setItemToEdit(null);
          }}
          folderId={currentFolderId}
          itemToEdit={itemToEdit}
        />
      )}
    </div>
  );
}
