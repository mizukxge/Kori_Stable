import React from 'react';
import { Heart } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TileProps {
  asset: {
    id: string;
    filename: string;
    thumbnailPath?: string;
  };
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'original';
  showCaption?: 'always' | 'hover' | 'never';
  showFavorite?: boolean;
  isFavorite?: boolean;
  onClick?: () => void;
  onFavoriteToggle?: () => void;
  animationDelay?: number;
  isFocused?: boolean;
  index?: number;
}

export const Tile: React.FC<TileProps> = ({
  asset,
  aspectRatio = 'square',
  showCaption = 'hover',
  showFavorite = true,
  isFavorite = false,
  onClick,
  onFavoriteToggle,
  animationDelay = 0,
  isFocused = false,
  index = 0,
}) => {
  const aspectRatioClass = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    original: 'aspect-auto',
  }[aspectRatio];

  const showCaptionClass = {
    always: 'opacity-100',
    hover: 'opacity-0 group-hover:opacity-100',
    never: 'hidden',
  }[showCaption];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'tile-button group relative overflow-hidden rounded-lg bg-muted transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        
        isFocused && 'ring-2 ring-primary ring-offset-2',
        aspectRatioClass
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'forwards',
      }}
      tabIndex={0}
      aria-label={`View ${asset.filename}`}
    >
      {/* Thumbnail Image */}
      <img
        src={asset.thumbnailPath || asset.path}
        alt={asset.filename}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          // Fallback to placeholder on error
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      
      {/* Fallback Placeholder (hidden by default) */}
      <div className="absolute inset-0 hidden flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
        <div className="text-6xl opacity-20">📷</div>
      </div>

      {/* Overlay for hover effect */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />

      {/* Favorite Button */}
      {showFavorite && (
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
              isFavorite ? 'fill-current text-red-500' : 'text-white'
            )}
          />
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
  );
};