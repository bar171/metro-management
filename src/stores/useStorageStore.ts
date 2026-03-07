import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StorageItemType = 'link' | 'photo' | 'document';

export interface StorageFolder {
    id: string;
    name: string;
    icon: string;
    customIconUrl?: string; // Optional user-uploaded image URL
    color?: string; // Optional background/border tint
    isGlobal?: boolean; // Determines if the folder ignores environmentId
    environmentId: string;
    parentId?: string | null; // Optional parent folder for nesting
    createdAt: string;
}

export interface StorageItem {
    id: string;
    folderId: string | null;
    type: StorageItemType;
    name: string;
    url: string; // URL for links, data/blob URL for simulated files, or external link
    environmentId: string;
    createdAt: string;
    color?: string; // Optional background/border tint
    description?: string;
    size?: number; // Simulated size for documents/photos
}

interface StorageStore {
    folders: StorageFolder[];
    items: StorageItem[];
    clipboard: { type: 'folder' | 'item'; id: string } | null;

    // Actions
    addFolder: (folder: Omit<StorageFolder, 'id' | 'createdAt'>) => void;
    updateFolder: (id: string, updates: Partial<StorageFolder>) => void;
    deleteFolder: (id: string) => void;

    addItem: (item: Omit<StorageItem, 'id' | 'createdAt'>) => void;
    updateItem: (id: string, updates: Partial<StorageItem>) => void;
    deleteItem: (id: string) => void;

    // Bulk Actions
    bulkDelete: (folderIds: string[], itemIds: string[]) => void;
    moveItems: (folderIds: string[], itemIds: string[], targetParentId: string | null) => void;
    // Clipboard Actions
    setClipboard: (type: 'folder' | 'item', id: string) => void;
    clearClipboard: () => void;
    paste: (targetParentId: string | null) => void;
}

export const useStorageStore = create<StorageStore>()(
    persist(
        (set) => ({
            folders: [
                // Dummy initial data
                {
                    id: '1',
                    name: 'Kafka',
                    icon: 'kafka',
                    environmentId: 'dev',
                    createdAt: new Date().toISOString(),
                },
                {
                    id: '2',
                    name: 'Redis',
                    icon: 'redis',
                    environmentId: 'dev',
                    createdAt: new Date().toISOString(),
                }
            ],
            items: [
                {
                    id: '1',
                    folderId: '1',
                    type: 'link',
                    name: 'Kafka UI (Dev)',
                    url: 'http://localhost:8080',
                    environmentId: 'dev',
                    createdAt: new Date().toISOString(),
                    description: 'Local Kafka cluster dashboard',
                }
            ],
            clipboard: null,

            addFolder: (folder) =>
                set((state) => ({
                    folders: [
                        ...state.folders,
                        {
                            ...folder,
                            id: crypto.randomUUID(),
                            createdAt: new Date().toISOString(),
                        },
                    ],
                })),

            updateFolder: (id, updates) =>
                set((state) => ({
                    folders: state.folders.map((f) => (f.id === id ? { ...f, ...updates } : f)),
                })),

            deleteFolder: (id) =>
                set((state) => {
                    // Start with the folder to delete
                    const folderIdsToDelete = new Set([id]);

                    // Iteratively find all child folder IDs to delete
                    let addedNew = true;
                    while (addedNew) {
                        addedNew = false;
                        for (const folder of state.folders) {
                            if (folder.parentId && folderIdsToDelete.has(folder.parentId) && !folderIdsToDelete.has(folder.id)) {
                                folderIdsToDelete.add(folder.id);
                                addedNew = true;
                            }
                        }
                    }

                    return {
                        folders: state.folders.filter((f) => !folderIdsToDelete.has(f.id)),
                        items: state.items.filter((i) => !folderIdsToDelete.has(i.folderId)),
                    };
                }),

            addItem: (item) =>
                set((state) => ({
                    items: [
                        ...state.items,
                        {
                            ...item,
                            id: crypto.randomUUID(),
                            createdAt: new Date().toISOString(),
                        },
                    ],
                })),

            updateItem: (id, updates) =>
                set((state) => ({
                    items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
                })),

            deleteItem: (id) =>
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                })),

            bulkDelete: (folderIds, itemIds) =>
                set((state) => {
                    const folderIdsToDelete = new Set(folderIds);
                    let addedNew = true;

                    // Recursively collect all nested folder IDs
                    while (addedNew) {
                        addedNew = false;
                        for (const folder of state.folders) {
                            if (folder.parentId && folderIdsToDelete.has(folder.parentId) && !folderIdsToDelete.has(folder.id)) {
                                folderIdsToDelete.add(folder.id);
                                addedNew = true;
                            }
                        }
                    }

                    return {
                        folders: state.folders.filter((f) => !folderIdsToDelete.has(f.id)),
                        items: state.items.filter((i) => !folderIdsToDelete.has(i.folderId) && !itemIds.includes(i.id)),
                    };
                }),

            moveItems: (folderIds, itemIds, targetParentId) =>
                set((state) => ({
                    folders: state.folders.map(f =>
                        folderIds.includes(f.id) ? { ...f, parentId: targetParentId } : f
                    ),
                    items: state.items.map(i =>
                        itemIds.includes(i.id) ? { ...i, folderId: targetParentId } : i
                    )
                })),

            setClipboard: (type, id) => set({ clipboard: { type, id } }),
            clearClipboard: () => set({ clipboard: null }),

            paste: (targetParentId) =>
                set((state) => {
                    if (!state.clipboard) return state;

                    const newFolders = [...state.folders];
                    const newItems = [...state.items];

                    if (state.clipboard.type === 'item') {
                        const itemToCopy = state.items.find(i => i.id === state.clipboard!.id);
                        if (itemToCopy) {
                            newItems.push({
                                ...itemToCopy,
                                id: crypto.randomUUID(),
                                folderId: targetParentId, // Assign to new parent
                                name: `${itemToCopy.name} (Copy)`,
                                createdAt: new Date().toISOString()
                            });
                        }
                    } else if (state.clipboard.type === 'folder') {
                        const folderToCopy = state.folders.find(f => f.id === state.clipboard!.id);
                        if (folderToCopy) {
                            // Helper to recursively copy a folder
                            const copyFolderRecursive = (originalFolderId: string, currentTargetParentId: string | null, isFirstLevel: boolean = false) => {
                                const originalFolder = state.folders.find(f => f.id === originalFolderId);
                                if (!originalFolder) return;

                                const newFolderId = crypto.randomUUID();
                                // Only append (Copy) to the topmost parent being pasted, keep exact names for deeply nested inner files
                                const newFolderName = isFirstLevel ? `${originalFolder.name} (Copy)` : originalFolder.name;

                                newFolders.push({
                                    ...originalFolder,
                                    id: newFolderId,
                                    parentId: currentTargetParentId,
                                    name: newFolderName,
                                    createdAt: new Date().toISOString()
                                });

                                // Copy all items that belonged to this specific original folder
                                const childrenItems = state.items.filter(i => i.folderId === originalFolderId);
                                for (const childItem of childrenItems) {
                                    newItems.push({
                                        ...childItem,
                                        id: crypto.randomUUID(),
                                        folderId: newFolderId,
                                        createdAt: new Date().toISOString()
                                    });
                                }

                                // Find all sub-folders and recursively copy them into this new folder ID
                                const subFolders = state.folders.filter(f => f.parentId === originalFolderId);
                                for (const childFolder of subFolders) {
                                    copyFolderRecursive(childFolder.id, newFolderId, false);
                                }
                            };

                            copyFolderRecursive(folderToCopy.id, targetParentId, true);
                        }
                    }

                    return { folders: newFolders, items: newItems };
                }),
        }),
        {
            name: 'metro-storage-store', // persisted in localStorage
        }
    )
);
