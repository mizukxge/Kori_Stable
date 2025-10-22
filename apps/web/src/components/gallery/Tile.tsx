import React from 'react';

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
}

export const Tile: React.FC<TileProps> = ({
  asset,
  aspectRatio = 'original',
  showCaption = 'hover',
  showFavorite = true,
  isFavorite = false,
  onClick,
  onFavoriteToggle,
}) => {
  return (
    <button
      type="button"
      className="tile-button relative w-full overflow-hidden rounded bg-gray-100 hover:ring-2 hover:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      onClick={onClick}
      aria-label={`View ${asset.filename}`}
    >
      <div className={`tile-image-container aspect-${aspectRatio === 'square' ? 'square' : 'auto'}`}>
        {/* Placeholder - will be replaced with actual image */}
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-xs text-gray-400">{asset.filename}</span>
        </div>
      </div>

      {/* Caption overlay */}
      {showCaption !== 'never' && (
        <div
          className={`tile-caption absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs ${
            showCaption === 'hover' ? 'opacity-0 hover:opacity-100 transition-opacity' : ''
          }`}
        >
          {asset.filename}
        </div>
      )}

      {/* Favorite indicator */}
      {showFavorite && (
        <button
          type="button"
          className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle?.();
          }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '??' : '??'}
        </button>
      )}
    </button>
  );
};
