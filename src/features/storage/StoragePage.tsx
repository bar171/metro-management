/**
 * Storage page (route: /storage).
 *
 * 615-line monolith → ~200-line composition. Sub-components:
 *   - FolderCard, ItemCard  → presentational cards with context menu
 *   - SelectionToolbar      → toggleable action bar
 *
 * The existing storage dialogs (CreateFolderDialog, CreateItemDialog,
 * MoveStorageDialog, StorageBreadcrumbs) live under `src/components/storage/`
 * and are imported as-is — they were already well-bounded.
 */

import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { ClipboardPaste, FileText, FolderInput, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { CreateFolderDialog } from '@/components/storage/CreateFolderDialog';
import { CreateItemDialog } from '@/components/storage/CreateItemDialog';
import { MoveStorageDialog } from '@/components/storage/MoveStorageDialog';
import { StorageBreadcrumbs } from '@/components/storage/StorageBreadcrumbs';
import { useAppStore } from '@/stores/useAppStore';
import { useStorageStore, type StorageFolder, type StorageItem } from '@/stores/useStorageStore';
import { FolderCard, type StorageViewMode } from './components/FolderCard';
import { ItemCard } from './components/ItemCard';
import { SelectionToolbar } from './components/SelectionToolbar';
import './storage.css';

interface DeleteDialogState {
  isOpen: boolean;
  type: 'folder' | 'item' | 'bulk';
  id?: string;
  name?: string;
}

export default function StoragePage() {
  const currentEnv = useAppStore((state) => state.envFilter);
  const { folders, items, deleteFolder, deleteItem, bulkDelete, clipboard, paste, setClipboard } = useStorageStore();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<StorageFolder | null>(null);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StorageItem | null>(null);
  const [viewMode, setViewMode] = useState<StorageViewMode>('grid');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ isOpen: false, type: 'folder' });

  // Reset to root path whenever environment changes.
  useEffect(() => {
    setCurrentFolderId(null);
    setIsSelectionMode(false);
    setSelectedFolderIds([]);
    setSelectedItemIds([]);
  }, [currentEnv]);

  const query = searchQuery.toLowerCase();
  const folderMatches = (f: StorageFolder) =>
    (f.parentId || null) === currentFolderId && (query ? f.name.toLowerCase().includes(query) : true);

  const globalFolders = folders.filter((f) => f.isGlobal && folderMatches(f));
  const envFolders = folders.filter((f) => !f.isGlobal && f.environmentId === currentEnv && folderMatches(f));
  const activeItems = items.filter(
    (i) => (i.folderId || null) === currentFolderId && (query ? i.name.toLowerCase().includes(query) : true),
  );

  const exitSelection = () => {
    setIsSelectionMode(false);
    setSelectedFolderIds([]);
    setSelectedItemIds([]);
  };

  const executeDelete = () => {
    if (deleteDialog.type === 'folder' && deleteDialog.id) deleteFolder(deleteDialog.id);
    else if (deleteDialog.type === 'item' && deleteDialog.id) deleteItem(deleteDialog.id);
    else if (deleteDialog.type === 'bulk') {
      bulkDelete(selectedFolderIds, selectedItemIds);
      exitSelection();
    }
    setDeleteDialog({ isOpen: false, type: 'folder' });
  };

  const renderFolder = (folder: StorageFolder) => (
    <FolderCard
      key={folder.id}
      folder={folder}
      viewMode={viewMode}
      isSelected={selectedFolderIds.includes(folder.id)}
      isSelectionMode={isSelectionMode}
      onOpen={() => setCurrentFolderId(folder.id)}
      onToggleSelect={() =>
        setSelectedFolderIds((prev) =>
          prev.includes(folder.id) ? prev.filter((id) => id !== folder.id) : [...prev, folder.id],
        )
      }
      onEdit={() => {
        setFolderToEdit(folder);
        setIsCreateFolderOpen(true);
      }}
      onCopy={() => setClipboard('folder', folder.id)}
      onMove={() => {
        setSelectedFolderIds([folder.id]);
        setSelectedItemIds([]);
        setIsMoveDialogOpen(true);
      }}
      onDelete={() => setDeleteDialog({ isOpen: true, type: 'folder', id: folder.id, name: folder.name })}
    />
  );

  const renderItem = (item: StorageItem) => (
    <ItemCard
      key={item.id}
      item={item}
      viewMode={viewMode}
      isSelected={selectedItemIds.includes(item.id)}
      isSelectionMode={isSelectionMode}
      onOpen={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
      onToggleSelect={() =>
        setSelectedItemIds((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]))
      }
      onEdit={() => {
        setItemToEdit(item);
        setIsCreateItemOpen(true);
      }}
      onCopy={() => setClipboard('item', item.id)}
      onMove={() => {
        setSelectedItemIds([item.id]);
        setSelectedFolderIds([]);
        setIsMoveDialogOpen(true);
      }}
      onDelete={() => setDeleteDialog({ isOpen: true, type: 'item', id: item.id, name: item.name })}
    />
  );

  const gridClass = viewMode === 'grid' ? 'storage-page__grid--grid' : 'storage-page__grid--list';
  const isEmpty = globalFolders.length === 0 && envFolders.length === 0 && activeItems.length === 0;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="storage-page animate-fade-in">
          <div className="storage-page__header">
            <h1 className="storage-page__title">
              Storage & Resources
            </h1>

            <div className="storage-page__toolbar-row">
              <div className="storage-page__breadcrumbs-wrapper">
                <StorageBreadcrumbs
                  currentFolderId={currentFolderId}
                  onNavigate={(id) => {
                    setCurrentFolderId(id);
                    exitSelection();
                  }}
                />
              </div>
              <div className="storage-page__controls">
                <div className="storage-page__search-wrapper">
                  <Icons.Search className="storage-page__search-icon" />
                  <Input
                    type="text"
                    placeholder="Search folder..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="storage-page__search-input"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="storage-page__search-clear"
                    >
                      <X className="storage-page__search-clear-icon" />
                    </button>
                  )}
                </div>

                <SelectionToolbar
                  selectionCount={selectedFolderIds.length + selectedItemIds.length}
                  isSelectionMode={isSelectionMode}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onEnterSelection={() => setIsSelectionMode(true)}
                  onExitSelection={exitSelection}
                  onMove={() => setIsMoveDialogOpen(true)}
                  onBulkDelete={() => setDeleteDialog({ isOpen: true, type: 'bulk' })}
                  onCreateItem={() => setIsCreateItemOpen(true)}
                  onCreateFolder={() => setIsCreateFolderOpen(true)}
                />
              </div>
            </div>
          </div>

          <div className="storage-page__body">
            {isEmpty ? (
              <div className="storage-page__empty">
                <div className="storage-page__empty-icon-wrapper">
                  <Icons.FolderPlus className="storage-page__empty-icon" />
                </div>
                <h3 className="storage-page__empty-title">This directory is empty</h3>
                <p className="storage-page__empty-text">
                  Use the buttons above to create a new folder or add an item here.
                </p>
              </div>
            ) : (
              <div className="storage-page__sections">
                {currentFolderId ? (
                  (globalFolders.length > 0 || envFolders.length > 0) && (
                    <div>
                      <h3 className="storage-page__section-label">Folders</h3>
                      <div className={gridClass}>{[...globalFolders, ...envFolders].map(renderFolder)}</div>
                    </div>
                  )
                ) : (
                  <>
                    {globalFolders.length > 0 && (
                      <div>
                        <h3 className="storage-page__section-label--global">
                          <Icons.Globe className="storage-page__section-label-icon" />
                          Global Folders
                        </h3>
                        <div className={gridClass}>{globalFolders.map(renderFolder)}</div>
                      </div>
                    )}
                    {envFolders.length > 0 && (
                      <div>
                        <h3 className="storage-page__section-label">
                          Environment Folders
                        </h3>
                        <div className={gridClass}>{envFolders.map(renderFolder)}</div>
                      </div>
                    )}
                  </>
                )}

                {activeItems.length > 0 && (
                  <div>
                    <h3 className="storage-page__section-label">
                      Files & Links
                    </h3>
                    <div className={gridClass}>{activeItems.map(renderItem)}</div>
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
            onMoveComplete={exitSelection}
          />

          <AlertDialog
            open={deleteDialog.isOpen}
            onOpenChange={(isOpen) => setDeleteDialog((prev) => ({ ...prev, isOpen }))}
          >
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
                  className="storage-delete-action"
                >
                  Delete {deleteDialog.type === 'bulk' ? 'Items' : deleteDialog.type === 'folder' ? 'Folder' : 'Item'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="storage-ctx-menu">
        <ContextMenuItem onClick={() => setIsCreateFolderOpen(true)}>
          <FolderInput className="storage-ctx-icon" />
          New Folder
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setIsCreateItemOpen(true)}>
          <FileText className="storage-ctx-icon" />
          New File / Link
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={!clipboard}
          onClick={() => {
            if (clipboard) paste(currentFolderId);
          }}
        >
          <ClipboardPaste className="storage-ctx-icon" />
          Paste {clipboard ? (clipboard.type === 'folder' ? 'Folder' : 'Item') : ''}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
