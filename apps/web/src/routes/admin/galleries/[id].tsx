import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GridTheme } from '../../../components/gallery/GridTheme';
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
  const [assets, setAssets] = useState<any[]>([]);
  const [settings, setSettings] = useState<GallerySettings>({
    aspectRatio: 'original',
    showGutters: true,
    showCaptions: 'hover',
    showFavorites: true,
  });
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch gallery data from API
    setLoading(true);
    
    setTimeout(() => {
      setGallery({
        id,
        name: 'Sample Gallery',
        description: 'Wedding Photography - June 2025',
      });
      
      setAssets([
        { id: '1', filename: 'photo1.jpg', path: '/path/1', mimeType: 'image/jpeg' },
        { id: '2', filename: 'photo2.jpg', path: '/path/2', mimeType: 'image/jpeg' },
        { id: '3', filename: 'photo3.jpg', path: '/path/3', mimeType: 'image/jpeg' },
        { id: '4', filename: 'photo4.jpg', path: '/path/4', mimeType: 'image/jpeg' },
      ]);
      
      setLoading(false);
    }, 500);
  }, [id]);

  const handleAssetClick = (assetId: string) => {
    setSelectedAsset(assetId);
    // TODO: Open Lightbox (AG2)
    console.log('Asset clicked:', assetId);
  };

  const handleSettingChange = (key: keyof GallerySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">In this gallery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grid Layout</CardTitle>
            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.aspectRatio}</div>
            <p className="text-xs text-muted-foreground">Current aspect ratio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Display Options</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[settings.showGutters, settings.showFavorites].filter(Boolean).length}
            </div>
            <p className="text-xs text-muted-foreground">Active settings</p>
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
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label htmlFor="aspectRatio">Aspect Ratio</Label>
              <select
                id="aspectRatio"
                value={settings.aspectRatio}
                onChange={(e) => handleSettingChange('aspectRatio', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="original">Original</option>
                <option value="square">Square</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            {/* Caption Display */}
            <div className="space-y-2">
              <Label htmlFor="showCaptions">Caption Display</Label>
              <select
                id="showCaptions"
                value={settings.showCaptions}
                onChange={(e) => handleSettingChange('showCaptions', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="always">Always Show</option>
                <option value="hover">Show on Hover</option>
                <option value="never">Never Show</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Show Gutters */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showGutters}
                onChange={(e) => handleSettingChange('showGutters', e.target.checked)}
                className="h-4 w-4 rounded border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <span className="text-sm font-medium">Show Gutters</span>
            </label>

            {/* Show Favorites */}
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
            <Button>Apply Settings</Button>
            <Button variant="outline">Reset to Default</Button>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Photos</CardTitle>
          <CardDescription>Click any photo to open in lightbox view</CardDescription>
        </CardHeader>
        <CardContent>
          <GridTheme
            galleryId={id!}
            assets={assets}
            settings={settings}
            onAssetClick={handleAssetClick}
          />
        </CardContent>
      </Card>
    </div>
  );
}