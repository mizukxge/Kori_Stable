import React, { useEffect, useRef, useState } from 'react';
import { Tile } from './Tile';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

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
  currentCoverPhotoId?: string | null;
  selectionMode?: boolean;
  selectedAssets?: Set<string>;
  onAssetClick?: (assetId: string) => void;
  onFavoriteToggle?: (assetId: string) => void;
  onSetCover?: (assetId: string) => void;
  onDelete?: (assetId: string) => void;
  onSelectToggle?: (assetId: string) => void;
  onReorder?: (assets: any[]) => void;
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
  currentCoverPhotoId,
  selectionMode = false,
  selectedAssets = new Set(),
  onAssetClick,
  onFavoriteToggle,
  onSetCover,
  onDelete,
  onSelectToggle,
  onReorder,
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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = assets.findIndex((asset) => asset.id === active.id);
      const newIndex = assets.findIndex((asset) => asset.id === over.id);

      const reorderedAssets = arrayMove(assets, oldIndex, newIndex);

      console.log(`📦 Reordered: moved ${active.id} from ${oldIndex} to ${newIndex}`);

      if (onReorder) {
        onReorder(reorderedAssets);
      }
    }
  };

  // ✅ AG1 STEP 3: INFINITE SCROLL WITH INTERSECTION OBSERVER
  useEffect(() => {
    if (!onLoadMore || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('🔄 Intersection detected - Loading more assets...');
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px', // Start loading 200px before reaching the sentinel
        threshold: 0,
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
      console.log('👀 Infinite scroll observer attached');
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [onLoadMore, hasMore, loadingMore]);

  // Get current column count based on screen size
  const getColumnCount = () => {
    if (typeof window === 'undefined') return 2;
    const width = window.innerWidth;
    if (width >= 1536) return 6; // 2xl
    if (width >= 1280) return 5; // xl
    if (width >= 1024) return 4; // lg
    if (width >= 768) return 3;  // md
    return 2; // sm
  };

  // ✅ AG1 STEP 3: KEYBOARD NAVIGATION (disabled when lightbox is open)
  useEffect(() => {
    if (disableKeyboardNav || assets.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={assets.map(a => a.id)} strategy={rectSortingStrategy}>
          {/* ✅ AG1 STEP 3: RESPONSIVE GRID */}
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
                  isCover={currentCoverPhotoId === asset.id}
                  selectionMode={selectionMode}
                  isSelected={selectedAssets.has(asset.id)}
                  onClick={() => {
                    if (!selectionMode) {
                      setFocusedIndex(index);
                      onAssetClick?.(asset.id);
                    }
                  }}
                  onFavoriteToggle={() => onFavoriteToggle?.(asset.id)}
                  onSetCover={onSetCover ? () => onSetCover(asset.id) : undefined}
                  onDelete={onDelete ? () => onDelete(asset.id) : undefined}
                  onSelectToggle={onSelectToggle ? () => onSelectToggle(asset.id) : undefined}
                  animationDelay={index * 30}
                  isFocused={focusedIndex === index}
                  index={index}
                  isDraggable={!!onReorder && !selectionMode}
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* ✅ AG1 STEP 3: LOADING MORE INDICATOR */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading more photos...</span>
          </div>
        </div>
      )}

      {/* ✅ AG1 STEP 3: INFINITE SCROLL SENTINEL */}
      {hasMore && !loadingMore && (
        <div ref={loadMoreRef} className="h-20" aria-hidden="true" />
      )}

      {/* ✅ AG1 STEP 3: END OF CONTENT INDICATOR */}
      {!hasMore && assets.length > 0 && (
        <div className="flex justify-center py-8">
          <p className="text-sm text-muted-foreground">
            All {assets.length} photos loaded
          </p>
        </div>
      )}

      {/* ✅ AG1 STEP 3: EMPTY STATE */}
      {assets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mx-auto mb-4 h-24 w-24 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-6xl">📷</span>
          </div>
          <p className="text-lg font-medium text-muted-foreground">No photos in this gallery</p>
          <p className="mt-1 text-sm text-muted-foreground">Upload photos to get started</p>
        </div>
      )}

      {/* ✅ AG1 STEP 3: KEYBOARD NAVIGATION HINTS */}
      {!disableKeyboardNav && assets.length > 0 && (
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