import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  FileCode,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Label } from '../../../../components/ui/Label';
import {
  getAllTemplates,
  deleteTemplate,
  publishTemplate,
  unpublishTemplate,
  type ContractTemplate,
} from '../../../../lib/contracts-api';

export default function TemplatesIndex() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ContractTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter templates
  useEffect(() => {
    let filtered = templates;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) =>
        statusFilter === 'published' ? t.isPublished : !t.isPublished
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, typeFilter, statusFilter]);

  async function loadTemplates() {
    try {
      setIsLoading(true);
      const data = await getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      alert('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(template: ContractTemplate) {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      await deleteTemplate(template.id);
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      alert(error.message || 'Failed to delete template');
    }
  }

  async function handleTogglePublish(template: ContractTemplate) {
    try {
      if (template.isPublished) {
        await unpublishTemplate(template.id);
      } else {
        await publishTemplate(template.id);
      }
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to toggle publish status:', error);
      alert(error.message || 'Failed to update template');
    }
  }

  // Get all unique types
  const allTypes = Array.from(new Set(templates.map((t) => t.type).filter(Boolean))).sort();

  // Calculate stats
  const stats = {
    total: templates.length,
    published: templates.filter((t) => t.isPublished).length,
    draft: templates.filter((t) => !t.isPublished).length,
    active: templates.filter((t) => t.isActive).length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contract Templates</h1>
          <p className="text-muted-foreground mt-1">Manage and create contract templates</p>
        </div>
        <Link to="/admin/contracts/templates/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileCode className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-success mt-1">{stats.published}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold text-warning mt-1">{stats.draft}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <XCircle className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-secondary mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Eye className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                id="search"
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Type filter */}
          <div>
            <Label htmlFor="type-filter">Type</Label>
            <select
              id="type-filter"
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              {allTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <Label htmlFor="status-filter">Status</Label>
            <select
              id="status-filter"
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="published">Published Only</option>
              <option value="draft">Draft Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-12 text-center">
          <FileCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first template'}
          </p>
          <Link to="/admin/contracts/templates/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-card rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-muted text-foreground">
                    {template.type || 'No Type'}
                  </span>
                  {template.eventType && (
                    <span className="px-2 py-1 rounded bg-blue-100 text-primary">
                      {template.eventType}
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded ${
                      template.isPublished
                        ? 'bg-green-100 text-success'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {template.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  <div>Version {template.version}</div>
                  <div>Updated {new Date(template.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-2">
                  <Link to={`/admin/contracts/templates/${template.id}/edit`}>
                    <button className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-primary hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  </Link>
                  <button
                    onClick={() => handleTogglePublish(template)}
                    className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      template.isPublished
                        ? 'text-warning hover:bg-orange-50'
                        : 'text-success hover:bg-green-50'
                    }`}
                  >
                    {template.isPublished ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Publish
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link to={`/admin/contracts/templates/${template.id}/clone`}>
                    <button className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-background rounded-lg transition-colors">
                      <Copy className="w-4 h-4 mr-1" />
                      Clone
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(template)}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium text-destructive hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
