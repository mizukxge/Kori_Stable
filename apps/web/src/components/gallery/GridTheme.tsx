import React, { useEffect, useRef, useState } from 'react';
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
  disableKeyboardNav?: boolean;
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
  disableKeyboardNav = false,
}) => {
  const {
    aspectRatio = 'square',
    showGutters = true,
    showCaptions = 'hover',
    showFavorites = true,
  } = settings;

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Infinite scroll
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
        rootMargin: '200px',
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

  const getColumnCount = () => {
    if (typeof window === 'undefined') return 2;
    const width = window.innerWidth;
    if (width >= 1536) return 6;
    if (width >= 1280) return 5;
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    return 2;
  };

  // Keyboard navigation - ONLY when lightbox is CLOSED
  useEffect(() => {
    if (assets.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // CRITICAL: Block ALL arrow keys when lightbox is open
      if (disableKeyboardNav) {
        console.log('🚫 Grid keyboard nav DISABLED (lightbox open)');
        return;
      }

      const cols = getColumnCount();
      let newIndex = focusedIndex;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          newIndex = Math.min(focusedIndex + 1, assets.length - 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = Math.max(focusedIndex - 1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.min(focusedIndex + cols, assets.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.max(focusedIndex - cols, 0);
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = assets.length - 1;
          break;
        case 'Enter':
        case ' ':
          if (focusedIndex >= 0 && focusedIndex < assets.length) {
            e.preventDefault();
            onAssetClick?.(assets[focusedIndex].id);
          }
          break;
        default:
          return;
      }

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        const tiles = gridRef.current?.querySelectorAll('.tile-button');
        if (tiles && tiles[newIndex]) {
          (tiles[newIndex] as HTMLElement).focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disableKeyboardNav, focusedIndex, assets, onAssetClick]);

  const gapClass = showGutters ? 'gap-4' : 'gap-0';

  return (
    <div className="grid-theme-container">
      <div
        ref={gridRef}
        className={cn(
          'grid',
          gapClass,
          'grid-cols-2',
          'md:grid-cols-3',
          'lg:grid-cols-4',
          'xl:grid-cols-5',
          '2xl:grid-cols-6'
        )}
        role="grid"
        aria-label="Gallery photos"
      >
        {assets.map((asset, index) => (
          <Tile
            key={asset.id}
            asset={asset}
            aspectRatio={aspectRatio}
            showCaption={showCaptions}
            showFavorite={showFavorites}
            isFavorite={favorites.has(asset.id)}
            onClick={() => {
              setFocusedIndex(index);
              onAssetClick?.(asset.id);
            }}
            onFavoriteToggle={() => onFavoriteToggle?.(asset.id)}
            animationDelay={index * 30}
            isFocused={focusedIndex === index}
            index={index}
          />
        ))}
      </div>

      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading more photos...</span>
          </div>
        </div>
      )}

      {hasMore && !loadingMore && <div ref={loadMoreRef} className="h-20" />}

      {!hasMore && assets.length > 0 && (
        <div className="flex justify-center py-8">
          <p className="text-sm text-muted-foreground">All {assets.length} photos loaded</p>
        </div>
      )}

      {assets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">No photos in this gallery</p>
          <p className="mt-1 text-sm text-muted-foreground">Upload photos to get started</p>
        </div>
      )}

      {!disableKeyboardNav && (
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>
            Use <kbd className="px-1.5 py-0.5 rounded bg-muted border">←</kbd>{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-muted border">→</kbd>{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-muted border">↑</kbd>{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-muted border">↓</kbd>{' '}
            to navigate • <kbd className="px-1.5 py-0.5 rounded bg-muted border">Enter</kbd> to open
          </p>
        </div>
      )}
    </div>
  );
};