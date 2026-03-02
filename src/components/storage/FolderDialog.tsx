import { useState } from 'react';
import { useStorageStore, StorageFolder, StorageItem } from '@/stores/useStorageStore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Link as LinkIcon, Image as ImageIcon, FileText, Trash2, ExternalLink, MoreVertical, Edit2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CreateItemDialog } from './CreateItemDialog';
import { CreateFolderDialog } from './CreateFolderDialog';

interface FolderDialogProps {
  folder: StorageFolder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FolderDialog({ folder, open, onOpenChange }: FolderDialogProps) {
  const { items, deleteItem, deleteFolder } = useStorageStore();
  
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StorageItem | null>(null);

  if (!folder) return null;

  const folderItems = items.filter(i => i.folderId === folder.id);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'link': return <LinkIcon className="h-6 w-6 text-blue-500" />;
      case 'photo': return <ImageIcon className="h-6 w-6 text-green-500" />;
      case 'document': return <FileText className="h-6 w-6 text-orange-500" />;
      default: return <FileText className="h-6 w-6" />;
    }
  };

  const handleDeleteFolder = () => {
    if (confirm(`Are you sure you want to delete folder "${folder.name}" and all its contents?`)) {
      deleteFolder(folder.id);
      onOpenChange(false);
    }
  };

  const handleItemClick = (item: StorageItem) => {
    if (item.type === 'link') {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else {
      // For photos/docs, normally we might display a preview but for now just open object url in new tab if possible
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[95vw] h-[95vh] overflow-hidden flex flex-col p-0">
          <div className="p-6 border-b border-border/50 flex items-center justify-between bg-card">
            <DialogHeader className="p-0 m-0">
              <DialogTitle className="text-2xl flex items-center gap-2">
                {folder.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setIsAddItemOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditFolderOpen(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Folder
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={handleDeleteFolder}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 bg-muted/20 custom-scrollbar">
            {folderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">This folder is empty</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  Add some links, documents, or photos to get started.
                </p>
                <Button variant="outline" className="mt-6 gap-2" onClick={() => setIsAddItemOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {folderItems.map(item => (
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

                    {/* Actions Menu */}
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
                            setIsAddItemOpen(true); 
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
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateItemDialog 
        open={isAddItemOpen} 
        onOpenChange={(op) => {
          setIsAddItemOpen(op);
          if (!op) setItemToEdit(null);
        }}
        folderId={folder.id}
        itemToEdit={itemToEdit}
      />

      <CreateFolderDialog
        open={isEditFolderOpen}
        onOpenChange={setIsEditFolderOpen}
        folderToEdit={folder}
      />
    </>
  );
}
