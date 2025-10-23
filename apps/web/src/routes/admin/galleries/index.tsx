import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Grid3x3, List, Calendar, Heart, Image, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';

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

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
    console.log('📦 Loading galleries...');
    setTimeout(() => {
      setGalleries(INITIAL_GALLERIES);
      setFilteredGalleries(INITIAL_GALLERIES);
      setIsLoading(false);
      console.log('✅ Loaded', INITIAL_GALLERIES.length, 'galleries');
    }, 500);
  }, []);

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

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    const newGallery: Gallery = {
      id: `gallery-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      clientName: formData.clientName,
      coverPhoto: `https://picsum.photos/seed/gallery${Date.now()}/600/400`,
      photoCount: 0,
      favoriteCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setGalleries([newGallery, ...galleries]);
    setIsCreateModalOpen(false);
    console.log('✅ Created gallery:', newGallery.name);
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

  // Delete Gallery
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Galleries</h1>
            <p className="text-gray-600 mt-1">
              Manage your photo galleries and collections
            </p>
          </div>
          <Button onClick={handleCreateGallery} size="default">
            <Plus className="w-5 h-5 mr-2" />
            Create Gallery
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Grid3x3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Galleries</p>
                <p className="text-2xl font-bold text-gray-900">{galleries.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Image className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Photos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {galleries.reduce((sum, g) => sum + g.photoCount, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Favorites</p>
                <p className="text-2xl font-bold text-gray-900">
                  {galleries.reduce((sum, g) => sum + g.favoriteCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search galleries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Last Modified</option>
              <option value="name">Name</option>
              <option value="photos">Photo Count</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Grid view"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredGalleries.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Grid3x3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No galleries found' : 'No galleries yet'}
          </h3>
          <p className="text-gray-600 mb-6">
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
              className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link to={`/admin/galleries/${gallery.id}`}>
                {/* Cover Photo */}
                <div className="aspect-[3/2] bg-gray-100 overflow-hidden">
                  <img
                    src={gallery.coverPhoto}
                    alt={gallery.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {gallery.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {gallery.description}
                  </p>

                  {/* Client */}
                  <p className="text-xs text-gray-500 mb-3">{gallery.clientName}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Image className="w-4 h-4" />
                      <span>{gallery.photoCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-600">
                      <Heart className="w-4 h-4" />
                      <span>{gallery.favoriteCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(gallery.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Actions */}
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={(e) => handleEditGallery(gallery, e)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => handleDeleteGallery(gallery, e)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gallery List */}
      {!isLoading && viewMode === 'list' && filteredGalleries.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gallery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Photos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Favorites
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Modified
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGalleries.map((gallery) => (
                <tr
                  key={gallery.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      to={`/admin/galleries/${gallery.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <img
                        src={gallery.coverPhoto}
                        alt={gallery.name}
                        className="w-16 h-16 object-cover rounded"
                        loading="lazy"
                      />
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-600">
                          {gallery.name}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {gallery.description}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {gallery.clientName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {gallery.photoCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    {gallery.favoriteCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(gallery.updatedAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleEditGallery(gallery, e)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label="Edit gallery"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteGallery(gallery, e)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Delete gallery"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
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
                <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <p className="text-sm text-red-600 mt-1">
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Gallery"
        description="This action cannot be undone"
        size="sm"
      >
        <div>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900">
              {selectedGallery?.name}
            </span>
            ?
          </p>
          {selectedGallery && selectedGallery.photoCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800">
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
    </div>
  );
}