import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GridTheme } from '../../../components/gallery/GridTheme';
import { Lightbox } from '../../../components/gallery/Lightbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Label } from '../../../components/ui/Label';
import { Button } from '../../../components/ui/Button';
import { Settings, Grid3x3, Image as ImageIcon } from 'lucide-react';

interface GallerySettings {
  aspectRatio: 'square' | 'portrait' | 'landscape' | 'original';
  showGutters: boolean;
  showCaptions: 'always' | 'hover' | 'never';
  showFavorites: boolean;
}

export default function GalleryAdminPage() {
  const { id } = useParams<{ id: string }>();
  const [gallery, setGallery] = useState<any>(null);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [displayedAssets, setDisplayedAssets] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<GallerySettings>({
    aspectRatio: 'square',
    showGutters: true,
    showCaptions: 'hover',
    showFavorites: true,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    setLoading(true);
    
    setTimeout(() => {
      setGallery({
        id,
        name: 'Sample Gallery',
        description: 'Wedding Photography - June 2025',
      });
      
      const testAssets = Array.from({ length: 60 }, (_, i) => ({
        id: `asset-${i + 1}`,
        filename: `wedding-photo-${String(i + 1).padStart(3, '0')}.jpg`,
        path: `/path/${i + 1}`,
        mimeType: 'image/jpeg',
        thumbnailPath: `/thumb/${i + 1}`,
      }));
      
      setAllAssets(testAssets);
      setDisplayedAssets(testAssets.slice(0, ITEMS_PER_PAGE));
      setHasMore(testAssets.length > ITEMS_PER_PAGE);
      setFavorites(new Set(['asset-1', 'asset-5', 'asset-12']));
      setLoading(false);
    }, 500);
  }, [id]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = page * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const newAssets = allAssets.slice(startIndex, endIndex);
      
      setDisplayedAssets(prev => [...prev, ...newAssets]);
      setPage(nextPage);
      setHasMore(endIndex < allAssets.length);
      setLoadingMore(false);
      console.log(`Loaded page ${nextPage}: ${newAssets.length} more photos`);
    }, 500);
  };

  const handleAssetClick = (assetId: string) => {
    const asset = displayedAssets.find(a => a.id === assetId);
    if (asset) {
      setSelectedAsset(asset);
      setLightboxOpen(true);
      console.log('✅ Opening lightbox for:', assetId);
    }
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
    setSelectedAsset(null);
    console.log('❌ Lightbox closed');
  };

  const handleLightboxNext = () => {
    const currentIndex = displayedAssets.findIndex(a => a.id === selectedAsset?.id);
    if (currentIndex < displayedAssets.length - 1) {
      setSelectedAsset(displayedAssets[currentIndex + 1]);
    }
  };

  const handleLightboxPrevious = () => {
    const currentIndex = displayedAssets.findIndex(a => a.id === selectedAsset?.id);
    if (currentIndex > 0) {
      setSelectedAsset(displayedAssets[currentIndex - 1]);
    }
  };

  const currentIndex = selectedAsset ? displayedAssets.findIndex(a => a.id === selectedAsset.id) : -1;
  const hasNext = currentIndex < displayedAssets.length - 1;
  const hasPrevious = currentIndex > 0;

  const handleFavoriteToggle = (assetId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(assetId)) {
        newFavorites.delete(assetId);
        console.log('❌ Removed from favorites:', assetId);
      } else {
        newFavorites.add(assetId);
        console.log('✅ Added to favorites:', assetId);
      }
      return newFavorites;
    });
  };

  const handleSettingChange = (key: keyof GallerySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    console.log(`Setting changed: ${key} =`, value);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Loading gallery...</p>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Gallery not found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{gallery.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{gallery.description}</p>
        </div>

        {/* Gallery Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allAssets.length}</div>
              <p className="text-xs text-muted-foreground">{displayedAssets.length} loaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grid Layout</CardTitle>
              <Grid3x3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{settings.aspectRatio}</div>
              <p className="text-xs text-muted-foreground">Current aspect ratio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorites</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favorites.size}</div>
              <p className="text-xs text-muted-foreground">Marked as favorite</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Captions</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{settings.showCaptions}</div>
              <p className="text-xs text-muted-foreground">Display mode</p>
            </CardContent>
          </Card>
        </div>

        {/* Gallery Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Gallery Display Settings</CardTitle>
            <CardDescription>Configure how photos are displayed in the grid</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                <select
                  id="aspectRatio"
                  value={settings.aspectRatio}
                  onChange={(e) => handleSettingChange('aspectRatio', e.target.value as any)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="square">Square (1:1)</option>
                  <option value="portrait">Portrait (3:4)</option>
                  <option value="landscape">Landscape (4:3)</option>
                  <option value="original">Original</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="showCaptions">Caption Display</Label>
                <select
                  id="showCaptions"
                  value={settings.showCaptions}
                  onChange={(e) => handleSettingChange('showCaptions', e.target.value as any)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="always">Always Show</option>
                  <option value="hover">Show on Hover</option>
                  <option value="never">Never Show</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showGutters}
                  onChange={(e) => handleSettingChange('showGutters', e.target.checked)}
                  className="h-4 w-4 rounded border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <span className="text-sm font-medium">Show Gutters</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showFavorites}
                  onChange={(e) => handleSettingChange('showFavorites', e.target.checked)}
                  className="h-4 w-4 rounded border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <span className="text-sm font-medium">Show Favorites</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => console.log('Settings applied:', settings)}>
                Apply Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => setSettings({
                  aspectRatio: 'square',
                  showGutters: true,
                  showCaptions: 'hover',
                  showFavorites: true,
                })}
              >
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Gallery Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Gallery Photos</CardTitle>
            <CardDescription>
              Click any photo to open in lightbox view • {favorites.size} favorite{favorites.size !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GridTheme
              galleryId={id!}
              assets={displayedAssets}
              settings={settings}
              favorites={favorites}
              onAssetClick={handleAssetClick}
              onFavoriteToggle={handleFavoriteToggle}
              onLoadMore={loadMore}
              hasMore={hasMore}
              loadingMore={loadingMore}
            />
          </CardContent>
        </Card>
      </div>

      {/* Lightbox */}
      <Lightbox
        isOpen={lightboxOpen}
        asset={selectedAsset}
        onClose={handleCloseLightbox}
        onNext={handleLightboxNext}
        onPrevious={handleLightboxPrevious}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        isFavorite={selectedAsset !== null && favorites.has(selectedAsset.id)}
        onFavoriteToggle={() => {
          if (selectedAsset) {
            console.log('💗 Lightbox calling handleFavoriteToggle for:', selectedAsset.id);
            handleFavoriteToggle(selectedAsset.id);
          }
        }}
      />
    </>
  );
}