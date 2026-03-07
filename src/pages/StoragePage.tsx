import { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { useStorageStore, StorageFolder, StorageItem } from '@/stores/useStorageStore';
import { useAppStore } from '@/stores/useAppStore';
import { Plus, Trash2, Edit2, Link as LinkIcon, Image as ImageIcon, FileText, ExternalLink, LayoutGrid, List, CheckSquare, X, FolderInput } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CreateFolderDialog, BRAND_ICONS } from '@/components/storage/CreateFolderDialog';
import { CreateItemDialog } from '@/components/storage/CreateItemDialog';
import { MoveStorageDialog } from '@/components/storage/MoveStorageDialog';
import { StorageBreadcrumbs } from '@/components/storage/StorageBreadcrumbs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Copy, ClipboardPaste } from 'lucide-react';

const COLOR_VARIANTS: Record<string, string> = {
  default: 'border-border/50 bg-card/50 hover:border-primary/30',
  red: 'border-red-500/50 bg-red-500/10 hover:border-red-500 hover:bg-red-500/20',
  orange: 'border-orange-500/50 bg-orange-500/10 hover:border-orange-500 hover:bg-orange-500/20',
  yellow: 'border-yellow-500/50 bg-yellow-500/10 hover:border-yellow-500 hover:bg-yellow-500/20',
  green: 'border-green-500/50 bg-green-500/10 hover:border-green-500 hover:bg-green-500/20',
  blue: 'border-blue-500/50 bg-blue-500/10 hover:border-blue-500 hover:bg-blue-500/20',
  purple: 'border-purple-500/50 bg-purple-500/10 hover:border-purple-500 hover:bg-purple-500/20',
  pink: 'border-pink-500/50 bg-pink-500/10 hover:border-pink-500 hover:bg-pink-500/20',
};

export default function StoragePage() {
  const currentEnv = useAppStore((state) => state.envFilter);
  const { folders, items, deleteFolder, deleteItem, bulkDelete, clipboard, paste, setClipboard } = useStorageStore();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<StorageFolder | null>(null);

  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StorageItem | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  // Deletion Modal State
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'folder' | 'item' | 'bulk';
    id?: string;
    name?: string;
  }>({ isOpen: false, type: 'folder' });

  // Reset to root path whenever environment changes
  useEffect(() => {
    setCurrentFolderId(null);
    setIsSelectionMode(false);
    setSelectedFolderIds([]);
    setSelectedItemIds([]);
  }, [currentEnv]);

  // Filter entities according to environment, global flags, and current nested path level
  // and also filter them based on the search query
  const query = searchQuery.toLowerCase();

  const globalFolders = folders.filter(
    f => f.isGlobal && (f.parentId || null) === currentFolderId && (query ? f.name.toLowerCase().includes(query) : true)
  );
  
  const envFolders = folders.filter(
    f => !f.isGlobal && f.environmentId === currentEnv && (f.parentId || null) === currentFolderId && (query ? f.name.toLowerCase().includes(query) : true)
  );

  const activeItems = items.filter(i => (i.folderId || null) === currentFolderId && (query ? i.name.toLowerCase().includes(query) : true));

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    setDeleteDialog({ isOpen: true, type: 'folder', id: folderId, name: folderName });
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    setDeleteDialog({ isOpen: true, type: 'item', id: itemId, name: itemName });
  };

  const executeDelete = () => {
    if (deleteDialog.type === 'folder' && deleteDialog.id) {
      deleteFolder(deleteDialog.id);
    } else if (deleteDialog.type === 'item' && deleteDialog.id) {
      deleteItem(deleteDialog.id);
    } else if (deleteDialog.type === 'bulk') {
      bulkDelete(selectedFolderIds, selectedItemIds);
      setIsSelectionMode(false);
      setSelectedFolderIds([]);
      setSelectedItemIds([]);
    }
    setDeleteDialog({ isOpen: false, type: 'folder' });
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

  const getIcon = (iconName: string) => {
    const brand = BRAND_ICONS.find(b => b.id === iconName);
    if (brand) {
      if (brand.imgUrl) return <img src={brand.imgUrl} alt={brand.label} className="h-full w-full object-contain" />;
      const BrandIcon = brand.icon;
      return <BrandIcon style={{ color: brand.color || '#ffffff' }} />;
    }
    const Icon = (Icons as unknown as Record<string, LucideIcon>)[iconName] || Icons.Folder;
    return <Icon className="text-white" />;
  };

  const renderFolderCard = (folder: StorageFolder) => {
    const isSelected = selectedFolderIds.includes(folder.id);
    return (
      <ContextMenu key={folder.id}>
        <ContextMenuTrigger asChild>
      <div
        onClick={() => {
          if (isSelectionMode) {
            setSelectedFolderIds(prev => 
              prev.includes(folder.id) ? prev.filter(id => id !== folder.id) : [...prev, folder.id]
            );
          } else {
            setCurrentFolderId(folder.id);
          }
        }}
        className={`relative group border rounded-xl overflow-hidden backdrop-blur-sm transition-all hover:shadow-md cursor-pointer ${
          viewMode === 'grid' 
            ? 'flex flex-col items-center justify-center aspect-square p-4 text-center' 
            : 'flex items-center p-1'
        } ${isSelected ? 'ring-2 ring-primary ring-offset-2 border-primary/50' : ''} ${COLOR_VARIANTS[folder.color || 'default'] || COLOR_VARIANTS.default}`}
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          style={folder.color ? { backgroundImage: `linear-gradient(to bottom right, ${folder.color}20, transparent)` } : {}}
        />
        <div className={`flex items-center flex-1 min-w-0 z-10 w-full ${viewMode === 'grid' ? 'flex-col justify-center h-full gap-2' : 'p-3 gap-3'}`}>
          {folder.customIconUrl ? (
            <div className={`${viewMode === 'grid' ? 'h-24 w-24' : 'h-10 w-10'} rounded-2xl overflow-hidden shrink-0 border border-border/50 shadow-sm transition-transform group-hover:scale-105`}>
              <img src={folder.customIconUrl} alt={folder.name} className="object-contain w-full h-full p-2" />
            </div>
          ) : (
            <div
              className={`${viewMode === 'grid' ? 'h-24 w-24' : 'h-10 w-10'} rounded-2xl flex items-center justify-center shrink-0 border border-border/50 transition-colors shadow-sm bg-background/80`}
              style={folder.color ? { borderColor: `${folder.color}40`, color: folder.color } : {}}
            >
              <div className={`${viewMode === 'grid' ? 'scale-[3] max-w-6' : 'max-w-6'}`}>
                {getIcon(folder.icon)}
              </div>
            </div>
          )}
          <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'text-center w-full' : ''}`}>
            <h3 className={`font-semibold text-foreground truncate group-hover:text-primary transition-colors flex items-center ${viewMode === 'grid' ? 'justify-center text-sm' : 'text-base'}`}>
              {folder.name}
            </h3>
            <p className={`text-xs text-muted-foreground truncate mt-0.5 ${viewMode === 'grid' ? 'max-w-full' : 'max-w-[200px] sm:max-w-md'}`}>
               {folder.createdAt ? new Date(folder.createdAt).toLocaleDateString() : 'New'}
            </p>
          </div>
        </div>
      </div>
        </ContextMenuTrigger>
        {!isSelectionMode && (
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={(e) => {
            e.stopPropagation();
            setFolderToEdit(folder);
            setIsCreateFolderOpen(true);
          }}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </ContextMenuItem>
          <ContextMenuItem onClick={(e) => {
            e.stopPropagation();
            setClipboard('folder', folder.id);
          }}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </ContextMenuItem>
          <ContextMenuItem onClick={(e) => {
            e.stopPropagation();
            setSelectedFolderIds([folder.id]);
            setSelectedItemIds([]);
            setIsMoveDialogOpen(true);
          }}>
            <FolderInput className="h-4 w-4 mr-2" />
            Move
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem className="text-destructive" onClick={(e) => {
            e.stopPropagation();
            handleDeleteFolder(folder.id, folder.name);
          }}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
        )}
      </ContextMenu>
    );
  };

  const renderItemCard = (item: StorageItem) => {
    const isSelected = selectedItemIds.includes(item.id);
    return (
      <ContextMenu key={item.id}>
        <ContextMenuTrigger asChild>
          <div
            onClick={() => {
              if (isSelectionMode) {
                setSelectedItemIds(prev => 
                  prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                );
              } else {
                handleItemClick(item);
              }
            }}
            className={`relative group border rounded-xl overflow-hidden backdrop-blur-sm transition-all hover:shadow-md cursor-pointer ${
              viewMode === 'grid' 
                ? 'flex flex-col aspect-square' 
                : 'flex items-center p-1'
            } ${isSelected ? 'ring-2 ring-primary ring-offset-2 border-primary/50' : ''} ${COLOR_VARIANTS[item.color || 'default'] || COLOR_VARIANTS.default}`}
          >
            {viewMode === 'grid' ? (
              <>
                <div
                  className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0"
                  style={item.color ? { backgroundImage: `linear-gradient(to bottom right, ${item.color}20, transparent)` } : {}}
                />
                
                {item.type === 'photo' && item.url !== '#' ? (
                  <div className="flex-1 w-full bg-muted overflow-hidden relative border-b border-border/50 z-10">
                    <img src={item.url} alt={item.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                ) : (
                  <div className="flex-1 w-full bg-muted/40 flex items-center justify-center border-b border-border/50 group-hover:bg-muted/60 transition-colors z-10">
                    <div 
                      className="h-16 w-16 rounded-2xl bg-background shadow-sm border border-border flex items-center justify-center"
                      style={item.color ? { borderColor: `${item.color}40`, color: item.color } : {}}
                    >
                      <div className="scale-[1.5]">
                        {getItemIcon(item.type)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-background/80 backdrop-blur-md z-10">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors flex justify-between items-center text-sm" title={item.name}>
                    {item.name}
                    {item.type === 'link' && <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5 capitalize max-w-full">
                    {item.type} {item.createdAt ? `• ${new Date(item.createdAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                  style={item.color ? { backgroundImage: `linear-gradient(to bottom right, ${item.color}20, transparent)` } : {}}
                />
                <div className="flex items-center flex-1 min-w-0 z-10 w-full p-3 gap-3">
                  <div
                    className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border border-border/50 transition-colors shadow-sm bg-background/80"
                    style={item.color ? { borderColor: `${item.color}40`, color: item.color } : {}}
                  >
                    {getItemIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1 text-base">
                      {item.name}
                      {item.type === 'link' && <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 capitalize max-w-[200px] sm:max-w-md">
                      {item.type} {item.createdAt ? `• ${new Date(item.createdAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ContextMenuTrigger>
        {!isSelectionMode && (
          <ContextMenuContent className="w-48">
            <ContextMenuItem onClick={(e) => {
              e.stopPropagation();
              setItemToEdit(item);
              setIsCreateItemOpen(true);
            }}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem onClick={(e) => {
              e.stopPropagation();
              setClipboard('item', item.id);
            }}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </ContextMenuItem>
            <ContextMenuItem onClick={(e) => {
              e.stopPropagation();
              setSelectedItemIds([item.id]);
              setSelectedFolderIds([]);
              setIsMoveDialogOpen(true);
            }}>
              <FolderInput className="h-4 w-4 mr-2" />
              Move
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem className="text-destructive" onClick={(e) => {
              e.stopPropagation();
              handleDeleteItem(item.id, item.name);
            }}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>
    );
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in flex flex-col h-full relative z-0">
          <div className="flex flex-col gap-4 shrink-0">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Storage & Resources
            </h1>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 w-full min-w-0">
                <StorageBreadcrumbs
                  currentFolderId={currentFolderId}
                  onNavigate={(id) => {
                    setCurrentFolderId(id);
                    setIsSelectionMode(false);
                    setSelectedFolderIds([]);
                    setSelectedItemIds([]);
                  }}
                />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative mr-2">
                  <Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="Search folder..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64 h-9 bg-background focus-visible:ring-1"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
            {isSelectionMode ? (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium mr-2">
                  {selectedFolderIds.length + selectedItemIds.length} Selected
                </div>
                {selectedFolderIds.length + selectedItemIds.length > 0 && (
                  <>
                    <Button 
                      variant="outline" 
                      className="gap-2 shadow-sm"
                      onClick={() => setIsMoveDialogOpen(true)}
                    >
                      <FolderInput className="h-4 w-4" />
                      Move
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="gap-2 shadow-sm"
                      onClick={() => setDeleteDialog({ isOpen: true, type: 'bulk' })}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedFolderIds([]);
                    setSelectedItemIds([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex bg-muted/50 p-1 rounded-lg mr-2 border">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
                <Button 
                  variant="secondary" 
                  className="gap-2 shadow-sm" 
                  onClick={() => setIsSelectionMode(true)}
                >
                  <CheckSquare className="h-4 w-4" />
                  Select
                </Button>
                <Button variant="outline" className="gap-2 shadow-sm" onClick={() => setIsCreateItemOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add File / Link
                </Button>
                <Button variant="default" className="gap-2 shadow-sm" onClick={() => setIsCreateFolderOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New Folder
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto -mx-6 px-6 -mb-8 pb-8">
        {globalFolders.length === 0 && envFolders.length === 0 && activeItems.length === 0 ? (
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
            {currentFolderId ? (
              <>
                {(globalFolders.length > 0 || envFolders.length > 0) && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Folders</h3>
                    <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                      {[...globalFolders, ...envFolders].map((folder) => renderFolderCard(folder))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {globalFolders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Icons.Globe className="h-4 w-4" />
                      Global Folders
                    </h3>
                    <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                      {globalFolders.map((folder) => renderFolderCard(folder))}
                    </div>
                  </div>
                )}

                {envFolders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Environment Folders</h3>
                    <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                      {envFolders.map((folder) => renderFolderCard(folder))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Render Items */}
            {activeItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Files & Links</h3>
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                  {activeItems.map(item => renderItemCard(item))}
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
        parentId={currentFolderId}
      />

      <CreateItemDialog
        open={isCreateItemOpen}
        onOpenChange={(op) => {
          setIsCreateItemOpen(op);
          if (!op) setItemToEdit(null);
        }}
        folderId={currentFolderId}
        itemToEdit={itemToEdit}
      />

      <MoveStorageDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        selectedFolderIds={selectedFolderIds}
        selectedItemIds={selectedItemIds}
        currentFolderId={currentFolderId}
        onMoveComplete={() => {
          setIsSelectionMode(false);
          setSelectedFolderIds([]);
          setSelectedItemIds([]);
        }}
      />

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete 
              {deleteDialog.type === 'bulk' 
                ? ` ${selectedFolderIds.length + selectedItemIds.length} selected items and all of their contents.`
                : deleteDialog.type === 'folder' 
                  ? ` the folder "${deleteDialog.name}" and all of its contents.` 
                  : ` the item "${deleteDialog.name}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete {deleteDialog.type === 'bulk' ? 'Items' : deleteDialog.type === 'folder' ? 'Folder' : 'Item'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </div>
      </ContextMenuTrigger>
    <ContextMenuContent className="w-64">
      <ContextMenuItem onClick={() => setIsCreateFolderOpen(true)}>
        <FolderInput className="mr-2 h-4 w-4" />
        New Folder
      </ContextMenuItem>
      <ContextMenuItem onClick={() => setIsCreateItemOpen(true)}>
        <FileText className="mr-2 h-4 w-4" />
        New File / Link
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem 
        disabled={!clipboard} 
        onClick={() => {
          if (clipboard) paste(currentFolderId);
        }}
      >
        <ClipboardPaste className="mr-2 h-4 w-4" />
        Paste {clipboard ? (clipboard.type === 'folder' ? 'Folder' : 'Item') : ''}
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
  );
}
