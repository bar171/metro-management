import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StorageItemType = 'link' | 'photo' | 'document';

export interface StorageFolder {
    id: string;
    name: string;
    icon: string;
    customIconUrl?: string; // Optional user-uploaded image URL
    color?: string; // Optional background/border tint
    environmentId: string;
    parentId?: string | null; // Optional parent folder for nesting
    createdAt: string;
}

export interface StorageItem {
    id: string;
    folderId: string;
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

    // Actions
    addFolder: (folder: Omit<StorageFolder, 'id' | 'createdAt'>) => void;
    updateFolder: (id: string, updates: Partial<StorageFolder>) => void;
    deleteFolder: (id: string) => void;

    addItem: (item: Omit<StorageItem, 'id' | 'createdAt'>) => void;
    updateItem: (id: string, updates: Partial<StorageItem>) => void;
    deleteItem: (id: string) => void;
}

export const useStorageStore = create<StorageStore>()(
    persist(
        (set) => ({
            folders: [
                // Dummy initial data
                {
                    id: '1',
                    name: 'Kafka',
                    icon: 'Database',
                    environmentId: 'dev',
                    createdAt: new Date().toISOString(),
                },
                {
                    id: '2',
                    name: 'Redis',
                    icon: 'DatabaseZap',
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
        }),
        {
            name: 'metro-storage-store', // persisted in localStorage
        }
    )
);
