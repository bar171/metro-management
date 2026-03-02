import { useState } from 'react';
import { useStorageStore, StorageFolder } from '@/stores/useStorageStore';
import { useAppStore } from '@/stores/useAppStore';
import { Plus } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreateFolderDialog } from '@/components/storage/CreateFolderDialog';
import { FolderDialog } from '@/components/storage/FolderDialog';

export default function StoragePage() {
  const currentEnv = useAppStore((state) => state.envFilter);
  const folders = useStorageStore((state) => state.folders);
  
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<StorageFolder | null>(null);

  const envFolders = folders.filter(f => f.environmentId === currentEnv);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Storage & Resources
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage links, documents, and photos for {currentEnv.toUpperCase()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="default" className="gap-2 shrink-0 shadow-sm" onClick={() => setIsCreateFolderOpen(true)}>
            <Plus className="h-4 w-4" />
            New Folder
          </Button>
        </div>
      </div>

      {envFolders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card/50 border-dashed">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Icons.Folder className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No folders found</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            You don't have any folders in the {currentEnv.toUpperCase()} environment yet. Create one to start organizing your files and links.
          </p>
          <Button variant="outline" className="mt-6 gap-2" onClick={() => setIsCreateFolderOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Folder
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {envFolders.map((folder) => {
            const Icon = (Icons as any)[folder.icon] || Icons.Folder;
            return (
              <Card 
                key={folder.id} 
                className="hover:shadow-md transition-all cursor-pointer group border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30"
                onClick={() => setSelectedFolder(folder)}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors group-hover:scale-105 duration-300">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                      {folder.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {new Date(folder.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateFolderDialog 
        open={isCreateFolderOpen} 
        onOpenChange={setIsCreateFolderOpen} 
      />

      <FolderDialog 
        folder={selectedFolder}
        open={!!selectedFolder}
        onOpenChange={(op) => !op && setSelectedFolder(null)}
      />
    </div>
  );
}
