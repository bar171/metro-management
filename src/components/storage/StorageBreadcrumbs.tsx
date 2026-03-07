import { ChevronRight, Home } from 'lucide-react';
import { StorageFolder, useStorageStore } from '@/stores/useStorageStore';
import { Button } from '@/components/ui/button';

interface StorageBreadcrumbsProps {
  currentFolderId: string | null;
  onNavigate: (folderId: string | null) => void;
}

export function StorageBreadcrumbs({ currentFolderId, onNavigate }: StorageBreadcrumbsProps) {
  const folders = useStorageStore(state => state.folders);

  // Build the path bottom-up
  const path: StorageFolder[] = [];
  let current = folders.find(f => f.id === currentFolderId);
  
  while (current) {
    path.unshift(current);
    const parentId = current.parentId;
    current = folders.find(f => f.id === parentId);
  }

  return (
    <div className="flex items-center space-x-1 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border/50 w-full overflow-x-auto custom-scrollbar">
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 px-2 hover:bg-muted hover:text-foreground shrink-0"
        onClick={() => onNavigate(null)}
      >
        <Home className="h-4 w-4 mr-2" />
        Root
      </Button>
      
      {path.map((folder, index) => (
        <div key={folder.id} className="flex items-center shrink-0">
          <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0 text-muted-foreground/50" />
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 px-2 shrink-0 ${
              index === path.length - 1 
                ? 'text-foreground font-medium bg-muted/50' 
                : 'hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => onNavigate(folder.id)}
          >
            <span className="truncate max-w-[150px]">{folder.name}</span>
          </Button>
        </div>
      ))}
    </div>
  );
}
