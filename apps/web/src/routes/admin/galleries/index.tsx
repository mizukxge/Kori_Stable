import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Grid3x3, List, Calendar, Heart, Image, Pencil, Trash2, CheckSquare, Square, Archive, Lock } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { createGallery, getAllGalleries } from '../../../lib/api';

// Mock gallery data - will be replaced with API call later
const INITIAL_GALLERIES = [
  {
    id: 'test-123',
    name: 'Summer Wedding 2025',
    description: 'Beautiful outdoor ceremony and reception',
    coverPhoto: 'https://picsum.photos/seed/gallery1/600/400',
    photoCount: 60,
    favoriteCount: 12,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-23T14:30:00Z',
    clientName: 'Sarah & Michael',
  },
  {
    id: 'gallery-2',
    name: 'Corporate Headshots',
    description: 'Professional portraits for company website',
    coverPhoto: 'https://picsum.photos/seed/gallery2/600/400',
    photoCount: 24,
    favoriteCount: 8,
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-20T16:45:00Z',
    clientName: 'Tech Solutions Ltd',
  },
  {
    id: 'gallery-3',
    name: 'Family Portrait Session',
    description: 'Outdoor family photos in the park',
    coverPhoto: 'https://picsum.photos/seed/gallery3/600/400',
    photoCount: 45,
    favoriteCount: 15,
    createdAt: '2025-01-05T11:30:00Z',
    updatedAt: '2025-01-18T10:20:00Z',
    clientName: 'The Johnson Family',
  },
  {
    id: 'gallery-4',
    name: 'Product Photography',
    description: 'E-commerce product shots with white background',
    coverPhoto: 'https://picsum.photos/seed/gallery4/600/400',
    photoCount: 36,
    favoriteCount: 5,
    createdAt: '2025-01-02T14:00:00Z',
    updatedAt: '2025-01-15T09:15:00Z',
    clientName: 'Fashion Boutique',
  },
  {
    id: 'gallery-5',
    name: 'Engagement Shoot',
    description: 'Romantic sunset photos by the beach',
    coverPhoto: 'https://picsum.photos/seed/gallery5/600/400',
    photoCount: 52,
    favoriteCount: 18,
    createdAt: '2024-12-28T13:00:00Z',
    updatedAt: '2025-01-12T11:30:00Z',
    clientName: 'Emma & David',
  },
];

type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'name' | 'photos';

interface Gallery {
  id: string;
  name: string;
  description: string;
  coverPhoto: string;
  photoCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  isPasswordProtected?: boolean;
}

interface GalleryFormData {
  name: string;
  description: string;
  clientName: string;
}

export default function GalleriesIndex() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [filteredGalleries, setFilteredGalleries] = useState<Gallery[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [isLoading, setIsLoading] = useState(true);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);

  // Form states
  const [formData, setFormData] = useState<GalleryFormData>({
    name: '',
    description: '',
    clientName: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<GalleryFormData>>({});

  // Simulate loading galleries
  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    console.log('📦 Loading galleries from API...');
    setIsLoading(true);
    
    try {
      const response = await getAllGalleries();
      const galleriesData = response.data.map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description || '',
        clientName: g.client?.name || '',
        coverPhoto: g.coverPhotoUrl || `https://picsum.photos/seed/${g.id}/600/400`,
        photoCount: g._count?.assets || 0,
        favoriteCount: g.favoriteCount || 0,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        isPasswordProtected: !!g.password,
      }));
      
      setGalleries(galleriesData);
      setFilteredGalleries(galleriesData);
      console.log('✅ Loaded', galleriesData.length, 'galleries from API');
    } catch (error) {
      console.error('❌ Failed to load galleries:', error);
      // Fallback to mock data if API fails
      setGalleries(INITIAL_GALLERIES);
      setFilteredGalleries(INITIAL_GALLERIES);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter galleries based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGalleries(galleries);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = galleries.filter(
      (gallery) =>
        gallery.name.toLowerCase().includes(query) ||
        gallery.description.toLowerCase().includes(query) ||
        gallery.clientName.toLowerCase().includes(query)
    );
    setFilteredGalleries(filtered);
    console.log('🔍 Filtered to', filtered.length, 'galleries for query:', searchQuery);
  }, [searchQuery, galleries]);

  // Sort galleries
  useEffect(() => {
    const sorted = [...filteredGalleries].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'photos':
          return b.photoCount - a.photoCount;
        default:
          return 0;
      }
    });
    setFilteredGalleries(sorted);
  }, [sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Bulk Selection Functions
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
    console.log(isSelectionMode ? '❌ Exited selection mode' : '✅ Entered selection mode');
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredGalleries.length) {
      setSelectedIds(new Set());
      console.log('❌ Deselected all galleries');
    } else {
      setSelectedIds(new Set(filteredGalleries.map((g) => g.id)));
      console.log('✅ Selected all', filteredGalleries.length, 'galleries');
    }
  };

  const toggleSelectGallery = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      console.log('❌ Deselected gallery:', id);
    } else {
      newSelected.add(id);
      console.log('✅ Selected gallery:', id);
    }
    setSelectedIds(newSelected);
  };

  const isGallerySelected = (id: string) => selectedIds.has(id);

  const getSelectedGalleries = () => {
    return galleries.filter((g) => selectedIds.has(g.id));
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: Partial<GalleryFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Gallery name is required';
    }
    if (!formData.clientName.trim()) {
      errors.clientName = 'Client name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create Gallery
  const handleCreateGallery = () => {
    console.log('➕ Opening create gallery modal');
    setFormData({ name: '', description: '', clientName: '' });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    try {
      console.log('📤 Creating gallery:', formData.name);
      
      const response = await createGallery({
        name: formData.name,
        description: formData.description,
        // Don't send clientId for now - backend expects UUID, not name
        // clientId: formData.clientName,
      });

      console.log('✅ Gallery created:', response.data);
      
      setIsCreateModalOpen(false);
      
      // Redirect to the new gallery page
      window.location.href = `/admin/galleries/${response.data.id}`;
      
    } catch (error) {
      console.error('❌ Failed to create gallery:', error);
      setFormErrors({ name: 'Failed to create gallery. Please try again.' });
    }
  };

  // Edit Gallery
  const handleEditGallery = (gallery: Gallery, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('✏️ Opening edit modal for:', gallery.name);
    setSelectedGallery(gallery);
    setFormData({
      name: gallery.name,
      description: gallery.description,
      clientName: gallery.clientName,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedGallery) {
      console.log('❌ Form validation failed');
      return;
    }

    const updatedGalleries = galleries.map((g) =>
      g.id === selectedGallery.id
        ? {
            ...g,
            name: formData.name,
            description: formData.description,
            clientName: formData.clientName,
            updatedAt: new Date().toISOString(),
          }
        : g
    );

    setGalleries(updatedGalleries);
    setIsEditModalOpen(false);
    console.log('✅ Updated gallery:', formData.name);
  };

  // Delete Gallery (Single)
  const handleDeleteGallery = (gallery: Gallery, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🗑️ Opening delete confirmation for:', gallery.name);
    setSelectedGallery(gallery);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedGallery) return;

    const updatedGalleries = galleries.filter((g) => g.id !== selectedGallery.id);
    setGalleries(updatedGalleries);
    setIsDeleteModalOpen(false);
    console.log('✅ Deleted gallery:', selectedGallery.name);
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;

    console.log('🗑️ Opening bulk delete confirmation for', selectedIds.size, 'galleries');
    setIsBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = () => {
    const selected = getSelectedGalleries();
    const totalPhotos = selected.reduce((sum, g) => sum + g.photoCount, 0);
    
    const updatedGalleries = galleries.filter((g) => !selectedIds.has(g.id));
    setGalleries(updatedGalleries);
    setSelectedIds(new Set());
    setIsBulkDeleteModalOpen(false);
    setIsSelectionMode(false);
    
    console.log('✅ Deleted', selected.length, 'galleries with', totalPhotos, 'photos');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Galleries</h1>
            <p className="text-muted-foreground mt-1">
              Manage your photo galleries and collections
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isSelectionMode && (
              <>
                <Button onClick={toggleSelectionMode} variant="outline" size="default">
                  <CheckSquare className="w-5 h-5 mr-2" />
                  Select
                </Button>
                <Button onClick={handleCreateGallery} size="default">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Gallery
                </Button>
              </>
            )}
            {isSelectionMode && (
              <>
                <Button onClick={toggleSelectionMode} variant="outline" size="default">
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  disabled={selectedIds.size === 0}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete ({selectedIds.size})
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Selection Bar */}
        {isSelectionMode && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-primary hover:text-primary font-medium"
                >
                  {selectedIds.size === filteredGalleries.length ? (
                    <>
                      <CheckSquare className="w-5 h-5" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="w-5 h-5" />
                      Select All
                    </>
                  )}
                </button>
                <div className="text-sm text-primary">
                  {selectedIds.size > 0 ? (
                    <span className="font-semibold">
                      {selectedIds.size} of {filteredGalleries.length} selected
                    </span>
                  ) : (
                    <span>Click galleries to select them</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Grid3x3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Galleries</p>
                <p className="text-2xl font-bold text-foreground">{galleries.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Image className="w-5 h-5 text-primary dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Photos</p>
                <p className="text-2xl font-bold text-foreground">
                  {galleries.reduce((sum, g) => sum + g.photoCount, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Heart className="w-5 h-5 text-destructive dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Favorites</p>
                <p className="text-2xl font-bold text-foreground">
                  {galleries.reduce((sum, g) => sum + g.favoriteCount, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Password Protected</p>
                <p className="text-2xl font-bold text-foreground">
                  {galleries.filter(g => g.isPasswordProtected).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search galleries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            >
              <option value="date">Last Modified</option>
              <option value="name">Name</option>
              <option value="photos">Photo Count</option>
            </select>
          </div>

          {/* View Toggle */}
          {!isSelectionMode && (
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-card shadow-sm text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-card shadow-sm text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredGalleries.length === 0 && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
          <Grid3x3 className="w-16 h-16 text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery ? 'No galleries found' : 'No galleries yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first gallery to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreateGallery} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Gallery
            </Button>
          )}
        </div>
      )}

      {/* Gallery Grid */}
      {!isLoading && viewMode === 'grid' && filteredGalleries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGalleries.map((gallery) => (
            <div
              key={gallery.id}
              className={`group bg-card rounded-lg shadow-sm border-2 overflow-hidden hover:shadow-md transition-all ${
                isGallerySelected(gallery.id)
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border'
              }`}
            >
              {/* Selection Checkbox */}
              {isSelectionMode && (
                <div className="p-3 bg-background border-b border-border">
                  <button
                    onClick={(e) => toggleSelectGallery(gallery.id, e)}
                    className="flex items-center gap-2 text-sm font-medium text-card-foreground hover:text-primary"
                  >
                    {isGallerySelected(gallery.id) ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    {isGallerySelected(gallery.id) ? 'Selected' : 'Select'}
                  </button>
                </div>
              )}

              <Link
                to={isSelectionMode ? '#' : `/admin/galleries/${gallery.id}`}
                onClick={
                  isSelectionMode
                    ? (e) => toggleSelectGallery(gallery.id, e)
                    : undefined
                }
              >
                {/* Cover Photo or Empty State */}
                <div className="aspect-[3/2] bg-muted overflow-hidden relative">
                  {gallery.photoCount > 0 ? (
                    <>
                      <img
                        src={gallery.coverPhoto}
                        alt={gallery.name}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          !isSelectionMode ? 'group-hover:scale-105' : ''
                        }`}
                        loading="lazy"
                      />
                      {/* Photo Count Badge */}
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5" />
                        {gallery.photoCount}
                      </div>
                      {/* Password Protected Badge */}
                      {gallery.isPasswordProtected && (
                        <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-sm text-white p-1.5 rounded-full" title="Password Protected">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 relative">
                      {/* Password Protected Badge for Empty Galleries */}
                      {gallery.isPasswordProtected && (
                        <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-sm text-white p-1.5 rounded-full" title="Password Protected">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">No Photos</p>
                      <p className="text-xs text-muted-foreground mt-1">Upload to get started</p>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {gallery.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {gallery.description}
                  </p>

                  {/* Client */}
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                    <span>{gallery.clientName}</span>
                    {gallery.isPasswordProtected && (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-500">
                        <Lock className="w-3 h-3" />
                        <span className="text-xs">Protected</span>
                      </span>
                    )}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {gallery.favoriteCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-destructive fill-red-500" />
                        <span>{gallery.favoriteCount}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Updated {formatDate(gallery.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Actions - Only show when NOT in selection mode */}
              {!isSelectionMode && (
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={(e) => handleEditGallery(gallery, e)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-muted text-card-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => handleDeleteGallery(gallery, e)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Gallery List */}
      {!isLoading && viewMode === 'list' && filteredGalleries.length > 0 && (
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                {isSelectionMode && (
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {selectedIds.size === filteredGalleries.length ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Gallery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Photos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Favorites
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Modified
                </th>
                {!isSelectionMode && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredGalleries.map((gallery) => (
                <tr
                  key={gallery.id}
                  className={`transition-colors ${
                    isGallerySelected(gallery.id)
                      ? 'bg-primary/10'
                      : 'hover:bg-background'
                  }`}
                >
                  {isSelectionMode && (
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => toggleSelectGallery(gallery.id, e)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        {isGallerySelected(gallery.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <Link
                      to={isSelectionMode ? '#' : `/admin/galleries/${gallery.id}`}
                      onClick={
                        isSelectionMode
                          ? (e) => toggleSelectGallery(gallery.id, e)
                          : undefined
                      }
                      className="flex items-center gap-3 group"
                    >
                      {gallery.photoCount > 0 ? (
                        <img
                          src={gallery.coverPhoto}
                          alt={gallery.name}
                          className="w-16 h-16 object-cover rounded"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <Image className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary flex items-center gap-2">
                          {gallery.name}
                          {gallery.isPasswordProtected && (
                            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" title="Password Protected" />
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {gallery.description || (gallery.photoCount === 0 ? 'No photos yet' : '')}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {gallery.clientName}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {gallery.photoCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-destructive">
                    {gallery.favoriteCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(gallery.updatedAt)}
                  </td>
                  {!isSelectionMode && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleEditGallery(gallery, e)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          aria-label="Edit gallery"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteGallery(gallery, e)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          aria-label="Delete gallery"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isCreateModalOpen ? 'Create New Gallery' : 'Edit Gallery'}
        description={
          isCreateModalOpen
            ? 'Add a new gallery to organize your photos'
            : 'Update gallery information'
        }
        size="md"
      >
        <form onSubmit={isCreateModalOpen ? handleSubmitCreate : handleSubmitEdit}>
          <div className="space-y-4">
            {/* Gallery Name */}
            <div>
              <Label htmlFor="name">Gallery Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Summer Wedding 2025"
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="e.g., Beautiful outdoor ceremony and reception"
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Client Name */}
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                type="text"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                placeholder="e.g., Sarah & Michael"
                className={formErrors.clientName ? 'border-red-500' : ''}
              />
              {formErrors.clientName && (
                <p className="text-sm text-destructive mt-1">
                  {formErrors.clientName}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isCreateModalOpen ? 'Create Gallery' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (Single) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Gallery"
        description="This action cannot be undone"
        size="sm"
      >
        <div>
          <p className="text-muted-foreground mb-4">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">
              {selectedGallery?.name}
            </span>
            ?
          </p>
          {selectedGallery && selectedGallery.photoCount > 0 && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-warning-foreground">
                ⚠️ This gallery contains{' '}
                <span className="font-semibold">{selectedGallery.photoCount} photos</span>.
                All photos will be removed from this gallery.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete Gallery
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title={`Delete ${selectedIds.size} ${selectedIds.size === 1 ? 'Gallery' : 'Galleries'}`}
        description="This action cannot be undone"
        size="md"
      >
        <div>
          <p className="text-muted-foreground mb-4">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">
              {selectedIds.size} {selectedIds.size === 1 ? 'gallery' : 'galleries'}
            </span>
            ?
          </p>

          {/* Selected Galleries Summary */}
          <div className="bg-background border border-border rounded-lg p-4 mb-4 max-h-64 overflow-y-auto scrollbar-thin">
            <h4 className="font-semibold text-foreground mb-2">Selected galleries:</h4>
            <ul className="space-y-2">
              {getSelectedGalleries().map((gallery) => (
                <li key={gallery.id} className="flex items-center justify-between text-sm">
                  <span className="text-card-foreground">{gallery.name}</span>
                  <span className="text-muted-foreground">
                    {gallery.photoCount} {gallery.photoCount === 1 ? 'photo' : 'photos'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Total Photos Warning */}
          {getSelectedGalleries().some((g) => g.photoCount > 0) && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-warning-foreground">
                ⚠️ Total of{' '}
                <span className="font-semibold">
                  {getSelectedGalleries().reduce((sum, g) => sum + g.photoCount, 0)} photos
                </span>{' '}
                will be removed from these galleries.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBulkDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmBulkDelete}
            >
              Delete {selectedIds.size} {selectedIds.size === 1 ? 'Gallery' : 'Galleries'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
