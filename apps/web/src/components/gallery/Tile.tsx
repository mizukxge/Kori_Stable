import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TileProps {
  asset: {
    id: string;
    filename: string;
    thumbnailPath?: string;
    path: string;
    mimeType: string;
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
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    if (mediaQuery.matches) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, animationDelay);

      return () => clearTimeout(timer);
    }
  }, [animationDelay]);

  return (
    <button
      type="button"
      className={cn(
        'tile-button group relative w-full overflow-hidden rounded-lg bg-muted',
        'transition-all duration-200',
        'hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:scale-[1.02]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isFocused && 'ring-2 ring-primary ring-offset-2',
        aspectRatio === 'square' && 'aspect-square',
        aspectRatio === 'portrait' && 'aspect-[3/4]',
        aspectRatio === 'landscape' && 'aspect-[4/3]',
        aspectRatio === 'original' && 'aspect-square min-h-[200px]',
        !prefersReducedMotion && 'opacity-0 translate-y-4',
        isVisible && !prefersReducedMotion && 'animate-fade-in',
        prefersReducedMotion && 'opacity-100'
      )}
      style={{
        animationDelay: prefersReducedMotion ? '0ms' : `${animationDelay}ms`,
      }}
      onClick={onClick}
      aria-label={`View ${asset.filename}, photo ${index + 1}`}
      tabIndex={0}
      role="gridcell"
    >
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 via-muted to-accent/5">
        <div className="text-center px-4">
          <div className="mx-auto mb-3 h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-4xl">📷</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium line-clamp-2">
            {asset.filename}
          </span>
        </div>
      </div>

      {showCaption !== 'never' && (
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4',
            'text-white text-sm font-medium',
            showCaption === 'hover'
              ? 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200'
              : 'opacity-100',
            isFocused && showCaption === 'hover' && 'opacity-100'
          )}
        >
          <p className="truncate">{asset.filename}</p>
          <p className="text-xs text-white/80 mt-1">Click to view</p>
        </div>
      )}

      {showFavorite && (
        <button
          type="button"
          className={cn(
            'absolute top-3 right-3 p-2 rounded-lg z-10',
            'transition-all duration-200',
            'backdrop-blur-md shadow-lg',
            isFavorite
              ? 'bg-primary text-primary-foreground'
              : 'bg-white/90 text-muted-foreground hover:bg-white hover:text-primary hover:scale-110'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle?.();
          }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          tabIndex={-1}
        >
          <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
        </button>
      )}

      <div className={cn(
        'absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 pointer-events-none',
        isFocused && 'bg-black/10'
      )} />

      {isFocused && (
        <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium">
          Selected
        </div>
      )}
    </button>
  );
};