import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Label';
import { Lock, Eye, EyeOff, Heart, Download } from 'lucide-react';
import JSZip from 'jszip';
import { GridTheme } from '../../components/gallery/GridTheme';
import { Lightbox } from '../../components/gallery/Lightbox';

interface GalleryMeta {
  name: string;
  description?: string;
  isPasswordProtected: boolean;
  expiresAt?: string;
  isActive: boolean;
  viewCount: number;
  client?: {
    name: string;
  };
}

interface GalleryAsset {
  id: string;
  filename: string;
  path: string;
  thumbnailPath?: string;
  mimeType: string;
}

export default function PublicGalleryPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [galleryMeta, setGalleryMeta] = useState<GalleryMeta | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  
  // Gallery items state
  const [galleryItems, setGalleryItems] = useState<GalleryAsset[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Lightbox state
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    console.log('📋 Copied gallery link:', url);
    
    setTimeout(() => {
      setCopySuccess(false);
    }, 2000);
  };

  const handleClearSelections = () => {
    if (confirm(`Clear all ${favorites.size} selections?`)) {
      setFavorites(new Set());
      console.log('🗑️ Cleared all selections');
    }
  };
  // Load gallery metadata
  useEffect(() => {
    loadGalleryMeta();
  }, [token]);

  // Load gallery items when access is granted
  useEffect(() => {
    if (hasAccess && token) {
      loadGalleryItems();
    }
  }, [hasAccess, token]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (token) {
      const stored = localStorage.getItem(`gallery-favorites-${token}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setFavorites(new Set(parsed));
          console.log('✅ Loaded favorites from localStorage:', parsed.length);
        } catch (e) {
          console.error('Failed to parse stored favorites');
        }
      }
    }
  }, [token]);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (token) {
      if (favorites.size > 0) {
        localStorage.setItem(`gallery-favorites-${token}`, JSON.stringify(Array.from(favorites)));
        console.log('💾 Saved favorites to localStorage:', favorites.size);
      } else {
        localStorage.removeItem(`gallery-favorites-${token}`);
      }
    }
  }, [favorites, token]);

  const loadGalleryMeta = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3002/g/${token}/meta`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Gallery not found');
        } else {
          setError('Failed to load gallery');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setGalleryMeta(data.data);
      
      // Check if gallery is active
      if (!data.data.isActive) {
        setError('This gallery is no longer available');
        setLoading(false);
        return;
      }

      // Check if expired
      if (data.data.expiresAt && new Date(data.data.expiresAt) < new Date()) {
        setError('This gallery has expired');
        setLoading(false);
        return;
      }

      // Check if needs password
      if (data.data.isPasswordProtected) {
        setNeedsPassword(true);
      } else {
        setHasAccess(true);
      }

      console.log('✅ Gallery metadata loaded:', data.data.name);
    } catch (err) {
      console.error('❌ Failed to load gallery:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const loadGalleryItems = async () => {
    if (!token) return;

    setLoadingItems(true);

    try {
      const url = password 
        ? `http://localhost:3002/g/${token}/items?password=${encodeURIComponent(password)}`
        : `http://localhost:3002/g/${token}/items`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error('Failed to load gallery items');
        setLoadingItems(false);
        return;
      }

      const data = await response.json();
      
      // Transform API response to match our format
      const assets = data.data.map((asset: any) => {
        // Extract category and storedName from filepath
        // filepath format: "uploads\\EDIT\\filename.jpg"
        const pathParts = asset.filepath.split('\\');
        const category = pathParts[1]; // EDIT, RAW, VIDEO
        const storedName = pathParts[2]; // actual filename
        
        return {
          id: asset.id,
          filename: asset.filename,
          path: `http://localhost:3002/uploads/${category}/${storedName}`,
          thumbnailPath: `http://localhost:3002/uploads/${category}/${storedName}`,
          mimeType: asset.mimeType,
        };
      });

      setGalleryItems(assets);
      console.log(`✅ Loaded ${assets.length} gallery items`);
    } catch (err) {
      console.error('❌ Failed to load gallery items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;

    setVerifying(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3002/g/${token}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Incorrect password');
        setVerifying(false);
        return;
      }

      console.log('✅ Password verified');
      setHasAccess(true);
      setNeedsPassword(false);
    } catch (err) {
      console.error('❌ Password verification failed:', err);
      setError('Failed to verify password');
    } finally {
      setVerifying(false);
    }
  };

  const handleAssetClick = (assetId: string) => {
    const asset = galleryItems.find(a => a.id === assetId);
    if (asset) {
      setSelectedAsset(asset);
      setLightboxOpen(true);
      console.log('✅ Opening lightbox for:', assetId);
    }
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
    setSelectedAsset(null);
  };

  const handleLightboxNext = () => {
    const currentIndex = galleryItems.findIndex(a => a.id === selectedAsset?.id);
    if (currentIndex < galleryItems.length - 1) {
      setSelectedAsset(galleryItems[currentIndex + 1]);
    }
  };

  const handleLightboxPrevious = () => {
    const currentIndex = galleryItems.findIndex(a => a.id === selectedAsset?.id);
    if (currentIndex > 0) {
      setSelectedAsset(galleryItems[currentIndex - 1]);
    }
  };

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

  const handleDownloadSelected = async () => {
    if (favorites.size === 0) return;

    console.log('📥 Creating ZIP with', favorites.size, 'selected photos');

    try {
      // Get selected assets
      const selectedAssets = galleryItems.filter(item => favorites.has(item.id));

      // Create ZIP file
      const zip = new JSZip();

      // Add each photo to ZIP
      for (const asset of selectedAssets) {
        try {
          const response = await fetch(asset.path);
          const blob = await response.blob();
          zip.file(asset.filename, blob);
          console.log('✅ Added to ZIP:', asset.filename);
        } catch (error) {
          console.error('Failed to add to ZIP:', asset.filename, error);
        }
      }

      // Generate ZIP file
      console.log('📦 Generating ZIP file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Create download link
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Clean gallery name for filename (remove special chars)
      const cleanName = galleryMeta?.name.replace(/[^a-z0-9]/gi, '-') || 'gallery';
      link.download = `Selected-${cleanName}.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ ZIP download complete');
    } catch (error) {
      console.error('❌ Failed to create ZIP:', error);
      alert('Failed to create ZIP file. Please try again.');
    }
  };

  const currentIndex = selectedAsset ? galleryItems.findIndex(a => a.id === selectedAsset.id) : -1;
  const hasNext = currentIndex < galleryItems.length - 1;
  const hasPrevious = currentIndex > 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading gallery...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-destructive text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">Gallery Unavailable</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password entry
  if (needsPassword && !hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">{galleryMeta?.name}</h2>
              <p className="text-muted-foreground">
                This gallery is password protected
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter password"
                    disabled={verifying}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={verifying || !password}
              >
                {verifying ? 'Verifying...' : 'Access Gallery'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gallery content (has access)
  if (hasAccess && galleryMeta) {
    return (
      <>
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold mb-2">{galleryMeta.name}</h1>
              {galleryMeta.description && (
                <p className="text-lg text-muted-foreground">
                  {galleryMeta.description}
                </p>
              )}
              {galleryMeta.client && (
                <p className="text-sm text-muted-foreground mt-2">
                  by {galleryMeta.client.name}
                </p>
              )}
              
              {/* Share Button */}
              <div className="mt-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCopyLink}
                >
                  {copySuccess ? (
                    <>✓ Link Copied!</>
                  ) : (
                    <>📋 Share Gallery</>
                  )}
                </Button>
              </div>
            </div>
{/* Expiration Warning */}
            {galleryMeta.expiresAt && (
              <Card className="mb-6 border-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-orange-600">
                    <span className="text-xl">⏰</span>
                    <span className="text-sm">
                      This gallery expires on {new Date(galleryMeta.expiresAt).toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Selection Summary */}
            {favorites.size > 0 && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      <span className="font-medium">
                        {favorites.size} photo{favorites.size !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleClearSelections}
                      >
                        Clear All
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={handleDownloadSelected}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download ZIP ({favorites.size})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gallery Grid */}
            {loadingItems ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading photos...</p>
                </CardContent>
              </Card>
            ) : galleryItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No photos in this gallery yet</p>
                </CardContent>
              </Card>
            ) : (
              <GridTheme
                galleryId={token || ''}
                assets={galleryItems}
                settings={{
                  aspectRatio: 'square',
                  showGutters: true,
                  showCaptions: 'hover',
                  showFavorites: true,
                }}
                favorites={favorites}
                onAssetClick={handleAssetClick}
                onFavoriteToggle={handleFavoriteToggle}
                onLoadMore={() => {}}
                hasMore={false}
                loadingMore={false}
              />
            )}
            {/* Footer Stats */}
            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>{galleryItems.length} photo{galleryItems.length !== 1 ? 's' : ''} • Viewed {galleryMeta.viewCount} time{galleryMeta.viewCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
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
              handleFavoriteToggle(selectedAsset.id);
            }
          }}
        />
      </>
    );
  }

  return null;
}