import React from 'react';

interface GridThemeProps {
  galleryId: string;
  assets: any[];
  settings?: {
    aspectRatio?: 'square' | 'portrait' | 'landscape' | 'original';
    showGutters?: boolean;
    showCaptions?: 'always' | 'hover' | 'never';
    showFavorites?: boolean;
  };
  onAssetClick?: (assetId: string) => void;
}

export const GridTheme: React.FC<GridThemeProps> = ({
  galleryId,
  assets,
  settings = {},
  onAssetClick,
}) => {
  const {
    aspectRatio = 'original',
    showGutters = true,
    showCaptions = 'hover',
    showFavorites = true,
  } = settings;

  return (
    <div className="grid-theme-container">
      <div
        className={`grid gap-${showGutters ? '4' : '0'} grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6`}
      >
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="grid-tile"
            onClick={() => onAssetClick?.(asset.id)}
          >
            {/* Tile component will be imported here */}
            <div className="bg-gray-200 aspect-square rounded">
              <p className="p-4 text-sm text-gray-500">Asset {asset.id}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
