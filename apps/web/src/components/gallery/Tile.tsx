import React from 'react';
import { Heart, Image as ImageIcon, Trash2, GripVertical, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TileProps {
  asset: {
    id: string;
    filename: string;
    path?: string;
    thumbnailPath?: string;
  };
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'original';
  showCaption?: 'always' | 'hover' | 'never';
  showFavorite?: boolean;
  isFavorite?: boolean;
  isCover?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
  onClick?: () => void;
  onFavoriteToggle?: () => void;
  onSetCover?: () => void;
  onDelete?: () => void;
  onSelectToggle?: () => void;
  animationDelay?: number;
  isFocused?: boolean;
  index?: number;
  isDraggable?: boolean;
}

export const Tile: React.FC<TileProps> = ({
  asset,
  aspectRatio = 'square',
  showCaption = 'hover',
  showFavorite = true,
  isFavorite = false,
  isCover = false,
  isSelected = false,
  selectionMode = false,
  onClick,
  onFavoriteToggle,
  onSetCover,
  onDelete,
  onSelectToggle,
  animationDelay = 0,
  isFocused = false,
  index = 0,
  isDraggable = false,
}) => {
  const aspectRatioClass = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    original: 'min-h-[300px]', // Changed from aspect-auto
  }[aspectRatio];

  const showCaptionClass = {
    always: 'opacity-100',
    hover: 'opacity-0 group-hover:opacity-100',
    never: 'hidden',
  }[showCaption];

  // Sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    animationDelay: `${animationDelay}ms`,
    animationFillMode: 'forwards',
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'tile-button relative overflow-hidden rounded-lg bg-muted transition-all duration-300 w-full',
          !isDragging && 'hover:scale-[1.02] hover:shadow-lg',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',

          isFocused && 'ring-2 ring-primary ring-offset-2',
          isDragging && 'cursor-grabbing scale-105 shadow-2xl ring-2 ring-primary',
          aspectRatioClass
        )}
        tabIndex={0}
        aria-label={`View ${asset.filename}`}
      >
      {/* Thumbnail Image */}
      <img
        src={asset.thumbnailPath || asset.path}
        alt={asset.filename}
        className={cn(
          'absolute inset-0 w-full',
          aspectRatio === 'original' ? 'h-auto object-contain' : 'h-full object-cover'
        )}
        loading="lazy"
        onError={(e) => {
          console.error('Failed to load image:', asset.filename);
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      
      {/* Fallback Placeholder (hidden by default) */}
      <div className="absolute inset-0 hidden flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
        <div className="text-6xl opacity-20">📷</div>
      </div>

      {/* Overlay for hover effect */}
      <div className={cn(
        "absolute inset-0 transition-colors duration-200",
        isSelected ? 'bg-primary/20 ring-4 ring-primary ring-inset' : 'bg-black/0 group-hover:bg-black/10'
      )} />

      {/* Selection Checkbox (shows in selection mode) */}
      {selectionMode && onSelectToggle && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelectToggle();
          }}
          className={cn(
            'absolute top-3 right-3 z-10',
            'w-9 h-9 rounded-full flex items-center justify-center',
            'bg-black/60 backdrop-blur-sm',
            'transition-all duration-200',
            'hover:bg-black/80 hover:scale-110',
            'cursor-pointer',
            'opacity-100'
          )}
          role="button"
          aria-label={isSelected ? 'Deselect photo' : 'Select photo'}
          tabIndex={-1}
        >
          {isSelected ? (
            <CheckCircle2 className="h-6 w-6 text-primary fill-current" />
          ) : (
            <Circle className="h-6 w-6 text-white" />
          )}
        </div>
      )}

      {/* Favorite Button (hidden in selection mode) */}
      {showFavorite && !selectionMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle?.();
          }}
          className={cn(
            'absolute top-3 right-3 z-10',
            'w-9 h-9 rounded-full flex items-center justify-center',
            'bg-black/40 backdrop-blur-sm',
            'opacity-0 group-hover:opacity-100 transition-all duration-200',
            'hover:bg-black/60 hover:scale-110',
            'cursor-pointer',
            isFavorite && 'opacity-100'
          )}
          role="button"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          tabIndex={-1}
        >
          <Heart
            className={cn(
              'h-5 w-5 transition-all duration-200',
              isFavorite ? 'fill-current text-destructive' : 'text-white'
            )}
          />
        </div>
      )}

      {/* Set as Cover Button (hidden in selection mode) */}
      {onSetCover && !selectionMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSetCover();
          }}
          className={cn(
            'absolute top-3 left-3 z-10',
            'w-9 h-9 rounded-full flex items-center justify-center',
            'bg-black/40 backdrop-blur-sm',
            'opacity-0 group-hover:opacity-100 transition-all duration-200',
            'hover:bg-black/60 hover:scale-110',
            'cursor-pointer',
            isCover && 'opacity-100 bg-blue-500/60'
          )}
          role="button"
          aria-label={isCover ? 'Current cover photo' : 'Set as cover photo'}
          tabIndex={-1}
        >
          <ImageIcon
            className={cn(
              'h-5 w-5 transition-all duration-200',
              isCover ? 'text-white' : 'text-white'
            )}
          />
        </div>
      )}

      {/* Delete Button (hidden in selection mode) */}
      {onDelete && !selectionMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={cn(
            'absolute bottom-3 right-3 z-10',
            'w-9 h-9 rounded-full flex items-center justify-center',
            'bg-black/40 backdrop-blur-sm',
            'opacity-0 group-hover:opacity-100 transition-all duration-200',
            'hover:bg-red-500/80 hover:scale-110',
            'cursor-pointer'
          )}
          role="button"
          aria-label="Delete photo"
          tabIndex={-1}
        >
          <Trash2 className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Caption Overlay */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3',
          'transition-opacity duration-200',
          showCaptionClass
        )}
      >
        <p className="text-sm font-medium text-white truncate">{asset.filename}</p>
      </div>

      {/* Focus Indicator */}
      {isFocused && (
        <div className="absolute inset-0 ring-2 ring-primary ring-inset rounded-lg pointer-events-none" />
      )}
    </button>

      {/* Drag Handle */}
      {isDraggable && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute bottom-3 left-3 z-10',
            'w-9 h-9 rounded-full flex items-center justify-center',
            'bg-black/40 backdrop-blur-sm',
            'opacity-0 group-hover:opacity-100 transition-all duration-200',
            'hover:bg-black/60 hover:scale-110',
            'cursor-grab active:cursor-grabbing',
            isDragging && 'opacity-100'
          )}
          role="button"
          aria-label="Drag to reorder"
          tabIndex={-1}
        >
          <GripVertical className="h-5 w-5 text-white" />
        </div>
      )}
    </div>
  );
};

