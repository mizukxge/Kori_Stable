import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GridTheme } from '../../../components/gallery/GridTheme';
import { UploadZone } from '../../../components/gallery/UploadZone';
import { Lightbox } from '../../../components/gallery/Lightbox';
import { getGallery, toggleGalleryAssetFavorite, updateGalleryPassword, setGalleryCoverPhoto, removeAssetFromGallery, reorderGalleryAssets } from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Label } from '../../../components/ui/Label';
import { Button } from '../../../components/ui/Button';
import { Settings, Grid3x3, Image as ImageIcon, Share2, Copy, Mail, QrCode as QRCodeIcon, Eye, EyeOff, Lock, Trash2, Pencil, Upload, CheckSquare, X, Heart } from 'lucide-react';
import { updateGallery } from '../../../lib/api';
import { deleteGallery } from '../../../lib/api';
import QRCode from 'react-qr-code';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';



interface GallerySettings {
  aspectRatio: 'square' | 'portrait' | 'landscape' | 'original';
  showGutters: boolean;
  showCaptions: 'always' | 'hover' | 'never';
  showFavorites: boolean;
}

const ITEMS_PER_PAGE = 12;

export default function GalleryAdminPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();  
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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [deleteGalleryModalOpen, setDeleteGalleryModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/gallery/${gallery.token}`;
    navigator.clipboard.writeText(shareUrl);
    setShareLinkCopied(true);
    console.log('📋 Copied share link:', shareUrl);
    
    setTimeout(() => {
      setShareLinkCopied(false);
    }, 2000);
  };

  const handleEmailShare = () => {
    const shareUrl = `${window.location.origin}/gallery/${gallery.token}`;
    const subject = `Gallery: ${gallery.name}`;
    const body = `View the gallery here: ${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Load gallery data from API
  const loadGallery = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await getGallery(id);
      const galleryData = response.data;

      setGallery(galleryData);
      setIsPasswordProtected(!!(galleryData as any).password);

      // Transform API assets to match our format
      const assets = galleryData.assets.map((ga: any) => {
        // Debug log to check asset data
        console.log('🔍 Asset data:', {
          id: ga.asset.id,
          filename: ga.asset.filename,
          storedName: ga.asset.storedName,
          category: ga.asset.category,
        });

        return {
          id: ga.asset.id,
          filename: ga.asset.filename,
          // Use filepath from API to construct URL
          path: `http://localhost:3002/uploads/${ga.asset.category}/${ga.asset.storedName}`,
          thumbnailPath: `http://localhost:3002/uploads/${ga.asset.category}/${ga.asset.storedName}`,
          mimeType: ga.asset.mimeType,
        };
      });

      setAllAssets(assets);
      
      // Extract favorites
      const favoriteIds = new Set(
        galleryData.assets
          .filter((ga: any) => ga.isFavorite)
          .map((ga: any) => ga.asset.id)
      );
      setFavorites(favoriteIds);
      console.log(`💖 Loaded ${favoriteIds.size} favorites`);
      
      // Update displayed assets (show first page)
      setDisplayedAssets(assets.slice(0, ITEMS_PER_PAGE));
      setHasMore(assets.length > ITEMS_PER_PAGE);
      
      console.log(`✅ Loaded gallery: ${galleryData.name} with ${assets.length} assets`);
    } catch (error) {
      console.error('❌ Failed to load gallery:', error);
      // Fallback to mock data on error
      setGallery({
        id: id || 'error',
        name: 'Sample Gallery (API Error)',
        description: 'Could not connect to API - showing mock data',
      });
      
      const testAssets = Array.from({ length: 60 }, (_, i) => {
        const seed = 200 + i;
        return {
          id: `asset-${i + 1}`,
          filename: `wedding-photo-${String(i + 1).padStart(3, '0')}.jpg`,
          path: `https://picsum.photos/seed/${seed}/1920/1280`,
          thumbnailPath: `https://picsum.photos/seed/${seed}/600/400`,
          mimeType: 'image/jpeg',
        };
      });
      
      setAllAssets(testAssets);
      setDisplayedAssets(testAssets.slice(0, ITEMS_PER_PAGE));
      setHasMore(testAssets.length > ITEMS_PER_PAGE);
      setFavorites(new Set(['asset-1', 'asset-5', 'asset-12']));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, [id]);

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

  const handleFavoriteToggle = async (assetId: string) => {
    const isFavorited = favorites.has(assetId);
    const newIsFavorite = !isFavorited;

    // Optimistic update
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newIsFavorite) {
        newFavorites.add(assetId);
      } else {
        newFavorites.delete(assetId);
      }
      return newFavorites;
    });

    try {
      await toggleGalleryAssetFavorite(id!, assetId, newIsFavorite);
      console.log(newIsFavorite ? '✅ Added to favorites' : '❌ Removed from favorites', assetId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert on error
      setFavorites(prev => {
        const revert = new Set(prev);
        if (isFavorited) {
          revert.add(assetId);
        } else {
          revert.delete(assetId);
        }
        return revert;
      });
    }
  };

  const handleSettingChange = (key: keyof GallerySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    console.log(`⚙️ Setting changed: ${key} =`, value);
  };
  const handlePasswordToggle = () => {
    setPasswordModalOpen(true);
    setPasswordError('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handlePasswordSubmit = async () => {
    setPasswordError('');

    // Validation
    if (isPasswordProtected) {
      if (!newPassword) {
        setPasswordError('Password is required');
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
    }

    try {
      const password = isPasswordProtected ? newPassword : null;
      await updateGalleryPassword(id!, password);
      
      console.log(isPasswordProtected ? '🔒 Password set' : '🔓 Password removed');
      setPasswordModalOpen(false);
      
      // Update gallery state
      setGallery(prev => prev ? { ...prev, password: isPasswordProtected ? 'set' : null } : null);
      
    } catch (error) {
      console.error('Failed to update password:', error);
      setPasswordError('Failed to update password. Please try again.');
    }
  };

  const handleSetCoverPhoto = async (assetId: string) => {
    try {
      await setGalleryCoverPhoto(id!, assetId);
      
      // Update gallery state with new cover
      setGallery(prev => prev ? { ...prev, coverPhotoId: assetId } : null);
      
      console.log('✅ Cover photo set:', assetId);
    } catch (error) {
      console.error('Failed to set cover photo:', error);
    }
  };
const handleDeleteAsset = async (assetId: string) => {
    setAssetToDelete(assetId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;

    try {
      await removeAssetFromGallery(id!, assetToDelete);

      setAllAssets(prev => prev.filter(a => a.id !== assetToDelete));
      setDisplayedAssets(prev => prev.filter(a => a.id !== assetToDelete));
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        newFavorites.delete(assetToDelete);
        return newFavorites;
      });

      console.log('✅ Photo deleted:', assetToDelete);
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo. Please try again.');
    } finally {
      setAssetToDelete(null);
    }
  };

  const handleReorder = async (reorderedAssets: any[]) => {
    // Optimistically update UI
    setDisplayedAssets(reorderedAssets);
    setAllAssets(reorderedAssets);

    try {
      // Send new order to backend
      const assetIds = reorderedAssets.map(asset => asset.id);
      await reorderGalleryAssets(id!, assetIds);

      console.log('✅ Photos reordered successfully');
    } catch (error) {
      console.error('Failed to reorder photos:', error);
      // Revert on error
      await loadGallery();
    }
  };

  // Selection functions
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedAssets(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedAssets.size === displayedAssets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(displayedAssets.map(a => a.id)));
    }
  };

  const toggleSelectAsset = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  // Batch operations
  const handleBatchFavorite = async () => {
    if (selectedAssets.size === 0) return;

    try {
      // Toggle favorite status for all selected assets
      for (const assetId of selectedAssets) {
        const isFavorite = favorites.has(assetId);
        await toggleGalleryAssetFavorite(id!, assetId, !isFavorite);

        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (isFavorite) {
            newFavorites.delete(assetId);
          } else {
            newFavorites.add(assetId);
          }
          return newFavorites;
        });
      }

      console.log(`✅ Batch favorited ${selectedAssets.size} photos`);
      setSelectedAssets(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('Failed to batch favorite photos:', error);
      alert('Failed to favorite photos. Please try again.');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedAssets.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedAssets.size} photo${selectedAssets.size > 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      for (const assetId of selectedAssets) {
        await removeAssetFromGallery(id!, assetId);
      }

      // Update local state
      setAllAssets(prev => prev.filter(a => !selectedAssets.has(a.id)));
      setDisplayedAssets(prev => prev.filter(a => !selectedAssets.has(a.id)));
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        selectedAssets.forEach(id => newFavorites.delete(id));
        return newFavorites;
      });

      console.log(`✅ Batch deleted ${selectedAssets.size} photos`);
      setSelectedAssets(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('Failed to batch delete photos:', error);
      alert('Failed to delete photos. Please try again.');
    }
  };

  const handleDeleteGallery = async () => {
    try {
      await deleteGallery(id!);
      console.log('✅ Gallery deleted');
      navigate('/admin/galleries');
    } catch (error) {
      console.error('Failed to delete gallery:', error);
      alert('Failed to delete gallery. Please try again.');
    }
  };
const handleEditGallery = () => {
    setEditName(gallery?.name || '');
    setEditDescription(gallery?.description || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateGallery(id!, {
        name: editName,
        description: editDescription,
      });

      // Update local state
      setGallery(prev => prev ? {
        ...prev,
        name: editName,
        description: editDescription,
      } : null);

      console.log('✅ Gallery updated');
      setEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update gallery:', error);
      alert('Failed to update gallery. Please try again.');
    }
  };
  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    
    setTimeout(() => {
      const currentLength = displayedAssets.length;
      const nextAssets = allAssets.slice(currentLength, currentLength + ITEMS_PER_PAGE);
      
      setDisplayedAssets(prev => [...prev, ...nextAssets]);
      setHasMore(currentLength + nextAssets.length < allAssets.length);
      setLoadingMore(false);
      
      console.log(`📦 Loaded ${nextAssets.length} more assets`);
    }, 500);
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
     <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{gallery.name}</h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditGallery}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              <p className="mt-2 text-base sm:text-lg text-muted-foreground">{gallery.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasswordToggle}
                className="flex-1 sm:flex-none"
              >
                <Lock className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{gallery?.password ? 'Change Password' : 'Set Password'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareModalOpen(true)}
                className="flex-1 sm:flex-none"
              >
                <Share2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-1 sm:flex-none"
                onClick={() => setDeleteGalleryModalOpen(true)}
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete Gallery</span>
              </Button>
            </div>
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
              <Button onClick={() => console.log('⚙️ Settings applied:', settings)}>
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

        {/* Upload Photos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Upload Photos
            </CardTitle>
            <CardDescription>
              Add photos to this gallery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadZone
              galleryId={id || 'test'}
              onUploadComplete={async (files) => {
                console.log('✅ Upload complete - refreshing gallery...');
                await loadGallery();
              }}
            />
          </CardContent>
        </Card>

        {/* Gallery Grid */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gallery Photos</CardTitle>
                <CardDescription>
                  {selectionMode
                    ? `${selectedAssets.size} of ${displayedAssets.length} selected`
                    : displayedAssets.length > 0
                    ? `Click any photo to open in lightbox view • ${favorites.size} favorite${favorites.size !== 1 ? 's' : ''}`
                    : 'Upload photos to get started'
                  }
                </CardDescription>
              </div>

              {displayedAssets.length > 0 && (
                <div className="flex items-center gap-2">
                  {selectionMode ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleSelectAll}
                      >
                        {selectedAssets.size === displayedAssets.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleSelectionMode}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      {selectedAssets.size > 0 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBatchFavorite}
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            Favorite ({selectedAssets.size})
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBatchDelete}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete ({selectedAssets.size})
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectionMode}
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Select Photos
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {displayedAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Gallery is Empty</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  This gallery doesn't have any photos yet. Upload your first photo using the upload zone above to get started.
                </p>
                <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Drag and drop photos into the upload zone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>Supports JPG, PNG, WEBP, and HEIC formats</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="w-4 h-4" />
                    <span>Photos will appear in the grid below</span>
                  </div>
                </div>
              </div>
            ) : (
              <GridTheme
                  galleryId={id || ''}
                  assets={displayedAssets}
                  settings={settings}
                  favorites={favorites}
                  currentCoverPhotoId={gallery?.coverPhotoId}
                  selectionMode={selectionMode}
                  selectedAssets={selectedAssets}
                  onAssetClick={handleAssetClick}
                  onFavoriteToggle={handleFavoriteToggle}
                  onSetCover={handleSetCoverPhoto}
                  onDelete={handleDeleteAsset}
                  onSelectToggle={toggleSelectAsset}
                  onReorder={handleReorder}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  loadingMore={loadingMore}
                />
            )}
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
      {/* Password Settings Modal */}
      {passwordModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
          onClick={() => setPasswordModalOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    <span>Password Protection</span>
                  </div>
                  <button
                    onClick={() => setPasswordModalOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toggle Password Protection */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Password Protected</p>
                    <p className="text-sm text-muted-foreground">
                      Require password to view gallery
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPasswordProtected(!isPasswordProtected)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPasswordProtected ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                        isPasswordProtected ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Password Fields (shown when enabled) */}
                {isPasswordProtected && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Enter password (min 6 characters)"
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Confirm password"
                      />
                    </div>
                  </>
                )}

                {/* Error Message */}
                {passwordError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{passwordError}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPasswordModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handlePasswordSubmit}
                  >
                    {isPasswordProtected ? 'Set Password' : 'Remove Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {/* Share Modal */}
      {shareModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
          onClick={() => setShareModalOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Card className="w-full max-w-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Share Gallery</span>
                  <button
                    onClick={() => setShareModalOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Gallery Info */}
                <div>
                  <h3 className="font-semibold mb-1">{gallery.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {displayedAssets.length} photos
                  </p>
                </div>

                {/* Two Column Layout: Link on left, QR on right */}
                <div className="grid grid-cols-2 gap-6 pt-4">
                  {/* Left Column: Share Link & Actions */}
                  <div className="space-y-4">
                    {/* Share Link */}
                    <div>
                      <Label className="text-sm font-medium">Gallery Link</Label>
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/gallery/${gallery.token}`}
                          className="flex-1 px-3 py-2 border border-input bg-background rounded-lg text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCopyShareLink}
                        >
                          {shareLinkCopied ? (
                            <>✓</>
                          ) : (
                            <><Copy className="w-4 h-4" /></>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleEmailShare}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email Link
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          window.open(`/gallery/${gallery.token}`, '_blank');
                        }}
                      >
                        👁️ Preview Gallery
                      </Button>
                    </div>
                  </div>

                  {/* Right Column: QR Code */}
                  <div className="flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="bg-card p-3 rounded-lg inline-block shadow-sm">
                        <QRCode 
                          value={`${window.location.origin}/gallery/${gallery.token}`}
                          size={160}
                          level="M"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Scan to view
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Views:</span>
                    <span className="font-medium">{gallery.viewCount || 0}</span>
                  </div>
                  {gallery.expiresAt && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="font-medium">
                        {new Date(gallery.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {/* Delete Photo Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Photo?"
        message="Are you sure you want to remove this photo from the gallery? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setAssetToDelete(null);
        }}
      />

      {/* Delete Gallery Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteGalleryModalOpen}
        title="Delete Gallery?"
        message={`Are you sure you want to delete "${gallery?.name}"? This will permanently remove the gallery and all ${displayedAssets.length} photos. This action cannot be undone.`}
        confirmText="Delete Gallery"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteGallery}
        onCancel={() => setDeleteGalleryModalOpen(false)}
      />

      {/* Edit Gallery Modal */}
      {editModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
          onClick={() => setEditModalOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-5 h-5" />
                    <span>Edit Gallery</span>
                  </div>
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Gallery Name</Label>
                  <input
                    id="editName"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter gallery name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editDescription">Description</Label>
                  <textarea
                    id="editDescription"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                    placeholder="Enter gallery description"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveEdit}
                    disabled={!editName.trim()}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      </>
  );
}