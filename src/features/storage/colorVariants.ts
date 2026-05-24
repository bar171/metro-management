/**
 * Border/background tint classes for folders/items.
 * Single source of truth — used by FolderCard, ItemCard.
 */
export const COLOR_VARIANTS: Record<string, string> = {
  default: 'border-border/50 bg-card/50 hover:border-primary/30',
  red: 'border-red-500/50 bg-red-500/10 hover:border-red-500 hover:bg-red-500/20',
  orange: 'border-orange-500/50 bg-orange-500/10 hover:border-orange-500 hover:bg-orange-500/20',
  yellow: 'border-yellow-500/50 bg-yellow-500/10 hover:border-yellow-500 hover:bg-yellow-500/20',
  green: 'border-green-500/50 bg-green-500/10 hover:border-green-500 hover:bg-green-500/20',
  blue: 'border-blue-500/50 bg-blue-500/10 hover:border-blue-500 hover:bg-blue-500/20',
  purple: 'border-purple-500/50 bg-purple-500/10 hover:border-purple-500 hover:bg-purple-500/20',
  pink: 'border-pink-500/50 bg-pink-500/10 hover:border-pink-500 hover:bg-pink-500/20',
};
