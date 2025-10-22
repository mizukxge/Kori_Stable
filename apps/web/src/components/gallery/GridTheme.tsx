import React, { useEffect, useRef } from 'react';
import { Tile } from './Tile';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface GridThemeProps {
  galleryId: string;
  assets: any[];
  settings?: {
    aspectRatio?: 'square' | 'portrait' | 'landscape' | 'original';
    showGutters?: boolean;
    showCaptions?: 'always' | 'hover' | 'never';
    showFavorites?: boolean;
  };
  favorites?: Set<string>;
  onAssetClick?: (assetId: string) => void;
  onFavoriteToggle?: (assetId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export const GridTheme: React.FC<GridThemeProps> = ({
  galleryId,
  assets,
  settings = {},
  favorites = new Set(),
  onAssetClick,
  onFavoriteToggle,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}) => {
  const {
    aspectRatio = 'square',
    showGutters = true,
    showCaptions = 'hover',
    showFavorites = true,
  } = settings;

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    if (!onLoadMore || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('🔄 Loading more assets...');
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px', // Preload when 200px from bottom
        threshold: 0,
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [onLoadMore, hasMore, loadingMore]);

  // Dynamic gap classes based on showGutters
  const gapClass = showGutters ? 'gap-4' : 'gap-0';

  return (
    <div className="grid-theme-container">
      <div
        className={cn(
          'grid',
          gapClass,
          // Responsive columns: 2 -> 3 -> 4 -> 5 -> 6
          'grid-cols-2',
          'md:grid-cols-3',
          'lg:grid-cols-4',
          'xl:grid-cols-5',
          '2xl:grid-cols-6'
        )}
      >
        {assets.map((asset, index) => (
          <Tile
            key={asset.id}
            asset={asset}
            aspectRatio={aspectRatio}
            showCaption={showCaptions}
            showFavorite={showFavorites}
            isFavorite={favorites.has(asset.id)}
            onClick={() => onAssetClick?.(asset.id)}
            onFavoriteToggle={() => onFavoriteToggle?.(asset.id)}
            animationDelay={index * 30} // Stagger fade-in by 30ms per item
          />
        ))}
      </div>

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading more photos...</span>
          </div>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && !loadingMore && (
        <div ref={loadMoreRef} className="h-20" />
      )}

      {/* End of Gallery */}
      {!hasMore && assets.length > 0 && (
        <div className="flex justify-center py-8">
          <p className="text-sm text-muted-foreground">
            All {assets.length} photos loaded
          </p>
        </div>
      )}

      {/* Empty State */}
      {assets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">No photos in this gallery</p>
          <p className="mt-1 text-sm text-muted-foreground">Upload photos to get started</p>
        </div>
      )}
    </div>
  );
};