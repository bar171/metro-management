import { Copy, Edit2, FolderInput, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { BRAND_ICONS } from '@/components/storage/CreateFolderDialog';
import type { StorageFolder } from '@/stores/useStorageStore';
import { COLOR_VARIANTS } from '../colorVariants';

export type StorageViewMode = 'grid' | 'list';

interface FolderCardProps {
  folder: StorageFolder;
  viewMode: StorageViewMode;
  isSelected: boolean;
  isSelectionMode: boolean;
  onOpen: () => void;
  onToggleSelect: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onMove: () => void;
  onDelete: () => void;
}

function renderIcon(iconName: string) {
  const brand = BRAND_ICONS.find((b) => b.id === iconName);
  if (brand) {
    if (brand.imgUrl) return <img src={brand.imgUrl} alt={brand.label} className="h-full w-full object-contain" />;
    const BrandIcon = brand.icon;
    return <BrandIcon style={{ color: brand.color || '#ffffff' }} />;
  }
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[iconName] || Icons.Folder;
  return <Icon className="text-white" />;
}

export function FolderCard({
  folder,
  viewMode,
  isSelected,
  isSelectionMode,
  onOpen,
  onToggleSelect,
  onEdit,
  onCopy,
  onMove,
  onDelete,
}: FolderCardProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onClick={() => (isSelectionMode ? onToggleSelect() : onOpen())}
          className={`relative group border rounded-xl overflow-hidden backdrop-blur-sm transition-all hover:shadow-md cursor-pointer ${
            viewMode === 'grid'
              ? 'flex flex-col items-center justify-center aspect-square p-4 text-center'
              : 'flex items-center p-1'
          } ${isSelected ? 'ring-2 ring-primary ring-offset-2 border-primary/50' : ''} ${
            COLOR_VARIANTS[folder.color || 'default'] || COLOR_VARIANTS.default
          }`}
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            style={folder.color ? { backgroundImage: `linear-gradient(to bottom right, ${folder.color}20, transparent)` } : {}}
          />
          <div
            className={`flex items-center flex-1 min-w-0 z-10 w-full ${viewMode === 'grid' ? 'flex-col justify-center h-full gap-2' : 'p-3 gap-3'}`}
          >
            {folder.customIconUrl ? (
              <div
                className={`${viewMode === 'grid' ? 'h-24 w-24' : 'h-10 w-10'} rounded-2xl overflow-hidden shrink-0 border border-border/50 shadow-sm transition-transform group-hover:scale-105`}
              >
                <img src={folder.customIconUrl} alt={folder.name} className="object-contain w-full h-full p-2" />
              </div>
            ) : (
              <div
                className={`${viewMode === 'grid' ? 'h-24 w-24' : 'h-10 w-10'} rounded-2xl flex items-center justify-center shrink-0 border border-border/50 transition-colors shadow-sm bg-background/80`}
                style={folder.color ? { borderColor: `${folder.color}40`, color: folder.color } : {}}
              >
                <div className={`${viewMode === 'grid' ? 'scale-[3] max-w-6' : 'max-w-6'}`}>{renderIcon(folder.icon)}</div>
              </div>
            )}
            <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'text-center w-full' : ''}`}>
              <h3
                className={`font-semibold text-foreground truncate group-hover:text-primary transition-colors flex items-center ${viewMode === 'grid' ? 'justify-center text-sm' : 'text-base'}`}
              >
                {folder.name}
              </h3>
              <p
                className={`text-xs text-muted-foreground truncate mt-0.5 ${viewMode === 'grid' ? 'max-w-full' : 'max-w-[200px] sm:max-w-md'}`}
              >
                {folder.createdAt ? new Date(folder.createdAt).toLocaleDateString() : 'New'}
              </p>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      {!isSelectionMode && (
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </ContextMenuItem>
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </ContextMenuItem>
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onMove();
            }}
          >
            <FolderInput className="h-4 w-4 mr-2" />
            Move
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
