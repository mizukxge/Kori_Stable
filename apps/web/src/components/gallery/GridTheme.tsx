import React from 'react';
import { Tile } from './Tile';
import { cn } from '../../lib/utils';

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
}

export const GridTheme: React.FC<GridThemeProps> = ({
  galleryId,
  assets,
  settings = {},
  favorites = new Set(),
  onAssetClick,
  onFavoriteToggle,
}) => {
  const {
    aspectRatio = 'square',
    showGutters = true,
    showCaptions = 'hover',
    showFavorites = true,
  } = settings;

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
        {assets.map((asset) => (
          <Tile
            key={asset.id}
            asset={asset}
            aspectRatio={aspectRatio}
            showCaption={showCaptions}
            showFavorite={showFavorites}
            isFavorite={favorites.has(asset.id)}
            onClick={() => onAssetClick?.(asset.id)}
            onFavoriteToggle={() => onFavoriteToggle?.(asset.id)}
          />
        ))}
      </div>

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