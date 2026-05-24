import { Copy, Edit2, ExternalLink, FileText, FolderInput, Image as ImageIcon, Link as LinkIcon, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { StorageItem } from '@/stores/useStorageStore';
import { COLOR_VARIANTS } from '../colorVariants';
import type { StorageViewMode } from './FolderCard';

interface ItemCardProps {
  item: StorageItem;
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

function getItemIcon(type: string) {
  switch (type) {
    case 'link':
      return <LinkIcon className="h-6 w-6 text-blue-500" />;
    case 'photo':
      return <ImageIcon className="h-6 w-6 text-green-500" />;
    case 'document':
      return <FileText className="h-6 w-6 text-orange-500" />;
    default:
      return <FileText className="h-6 w-6" />;
  }
}

export function ItemCard({
  item,
  viewMode,
  isSelected,
  isSelectionMode,
  onOpen,
  onToggleSelect,
  onEdit,
  onCopy,
  onMove,
  onDelete,
}: ItemCardProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onClick={() => (isSelectionMode ? onToggleSelect() : onOpen())}
          className={`relative group border rounded-xl overflow-hidden backdrop-blur-sm transition-all hover:shadow-md cursor-pointer ${
            viewMode === 'grid' ? 'flex flex-col aspect-square' : 'flex items-center p-1'
          } ${isSelected ? 'ring-2 ring-primary ring-offset-2 border-primary/50' : ''} ${
            COLOR_VARIANTS[item.color || 'default'] || COLOR_VARIANTS.default
          }`}
        >
          {viewMode === 'grid' ? (
            <>
              <div
                className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0"
                style={item.color ? { backgroundImage: `linear-gradient(to bottom right, ${item.color}20, transparent)` } : {}}
              />
              {item.type === 'photo' && item.url !== '#' ? (
                <div className="flex-1 w-full bg-muted overflow-hidden relative border-b border-border/50 z-10">
                  <img
                    src={item.url}
                    alt={item.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              ) : (
                <div className="flex-1 w-full bg-muted/40 flex items-center justify-center border-b border-border/50 group-hover:bg-muted/60 transition-colors z-10">
                  <div
                    className="h-16 w-16 rounded-2xl bg-background shadow-sm border border-border flex items-center justify-center"
                    style={item.color ? { borderColor: `${item.color}40`, color: item.color } : {}}
                  >
                    <div className="scale-[1.5]">{getItemIcon(item.type)}</div>
                  </div>
                </div>
              )}
              <div className="p-3 bg-background/80 backdrop-blur-md z-10">
                <h3
                  className="font-semibold text-foreground truncate group-hover:text-primary transition-colors flex justify-between items-center text-sm"
                  title={item.name}
                >
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
