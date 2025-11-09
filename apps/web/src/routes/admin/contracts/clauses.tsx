import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  Tag as TagIcon,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Clause {
  id: string;
  slug: string;
  title: string;
  bodyHtml: string;
  tags: string[];
  mandatory: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClauseStats {
  total: number;
  mandatory: number;
  optional: number;
  active: number;
  inactive: number;
}

export default function ClausesPage() {
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [stats, setStats] = useState<ClauseStats | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [mandatoryFilter, setMandatoryFilter] = useState<'all' | 'mandatory' | 'optional'>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingClause, setEditingClause] = useState<Clause | null>(null);

  useEffect(() => {
    loadClauses();
    loadStats();
    loadTags();
  }, []);

  async function loadClauses() {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/clauses`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch clauses');

      const data = await response.json();
      setClauses(data);
    } catch (error) {
      console.error('Failed to load clauses:', error);
      alert('Failed to load clauses');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/clauses/stats`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async function loadTags() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/clauses/tags`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch tags');

      const data = await response.json();
      setAllTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this clause? It will be marked as inactive.')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/clauses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete clause');

      alert('Clause deleted successfully');
      loadClauses();
      loadStats();
    } catch (error: any) {
      console.error('Failed to delete clause:', error);
      alert(error.message || 'Failed to delete clause');
    }
  }

  async function handleClone(clause: Clause) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/clauses`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: `${clause.slug}-copy`,
          title: `${clause.title} (Copy)`,
          bodyHtml: clause.bodyHtml,
          tags: clause.tags,
          mandatory: false, // Copies are always optional by default
        }),
      });

      if (!response.ok) throw new Error('Failed to clone clause');

      alert('Clause cloned successfully');
      loadClauses();
      loadStats();
    } catch (error: any) {
      console.error('Failed to clone clause:', error);
      alert(error.message || 'Failed to clone clause');
    }
  }

  function openEditor(clause?: Clause) {
    setEditingClause(clause || null);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingClause(null);
  }

  function handleEditorSuccess() {
    closeEditor();
    loadClauses();
    loadStats();
    loadTags();
  }

  const filteredClauses = clauses.filter((clause) => {
    // Search filter
    if (searchTerm && !clause.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !clause.slug.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Tag filter
    if (selectedTags.length > 0 && !selectedTags.some((tag) => clause.tags.includes(tag))) {
      return false;
    }

    // Active/inactive filter
    if (!showInactive && !clause.isActive) {
      return false;
    }

    // Mandatory filter
    if (mandatoryFilter === 'mandatory' && !clause.mandatory) {
      return false;
    }
    if (mandatoryFilter === 'optional' && clause.mandatory) {
      return false;
    }

    return true;
  });

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  }

  function getTagColor(tag: string): string {
    if (tag === 'mandatory') return 'bg-destructive/10 text-destructive border-destructive/20';
    if (tag === 'legal') return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    if (tag === 'payment') return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    if (tag === 'delivery') return 'bg-primary/10 text-primary border-primary/20';
    if (tag === 'optional') return 'bg-muted text-foreground border-border';
    return 'bg-muted text-foreground border-border';
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading clauses...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clause Library</h1>
            <p className="text-muted-foreground mt-1">
              Manage reusable contract clauses for templates
            </p>
          </div>
          <Button onClick={() => openEditor()}>
            <Plus className="w-4 h-4 mr-2" />
            New Clause
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-card rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Clauses</div>
            </div>
            <div className="bg-card rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-destructive">{stats.mandatory}</div>
              <div className="text-sm text-muted-foreground">Mandatory</div>
            </div>
            <div className="bg-card rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-primary">{stats.optional}</div>
              <div className="text-sm text-muted-foreground">Optional</div>
            </div>
            <div className="bg-card rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-success">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="bg-card rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
              <div className="text-sm text-muted-foreground">Inactive</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-card rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search clauses by title or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Mandatory Filter */}
            <select
              value={mandatoryFilter}
              onChange={(e) => setMandatoryFilter(e.target.value as any)}
              className="px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Clauses</option>
              <option value="mandatory">Mandatory Only</option>
              <option value="optional">Optional Only</option>
            </select>

            {/* Show Inactive */}
            <label className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg cursor-pointer hover:bg-muted">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm text-foreground">Show Inactive</span>
            </label>
          </div>

          {/* Tag Cloud */}
          {allTags.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <TagIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Filter by tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-primary text-white border-primary'
                        : getTagColor(tag)
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="mt-2 text-sm text-primary hover:text-primary dark:text-primary"
                >
                  Clear tag filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredClauses.length} of {clauses.length} clauses
      </div>

      {/* Clauses Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredClauses.map((clause) => (
          <div
            key={clause.id}
            className={`bg-card rounded-lg shadow p-6 hover:shadow-md transition-shadow ${
              !clause.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-2">
                  {clause.mandatory ? (
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">{clause.title}</h3>
                      {clause.mandatory && (
                        <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-medium rounded">
                          MANDATORY
                        </span>
                      )}
                      {!clause.isActive && (
                        <span className="px-2 py-0.5 bg-muted text-foreground text-xs font-medium rounded">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono mb-2">{clause.slug}</p>
                    <div
                      className="text-sm text-foreground prose prose-sm max-w-none line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: clause.bodyHtml }}
                    />
                  </div>
                </div>

                {/* Tags */}
                {clause.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {clause.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 text-xs font-medium rounded border ${getTagColor(
                          tag
                        )}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="mt-3 text-xs text-muted-foreground">
                  Updated {new Date(clause.updatedAt).toLocaleDateString()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-4">
                <Button
                  variant="secondary"
                  onClick={() => openEditor(clause)}
                  title="Edit clause"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleClone(clause)}
                  title="Clone clause"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {!clause.mandatory && (
                  <Button
                    variant="secondary"
                    onClick={() => handleDelete(clause.id)}
                    title="Delete clause"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredClauses.length === 0 && (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No clauses found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedTags.length > 0
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first clause'}
          </p>
          {!searchTerm && selectedTags.length === 0 && (
            <Button onClick={() => openEditor()}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Clause
            </Button>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <ClauseEditorModal
          clause={editingClause}
          onClose={closeEditor}
          onSuccess={handleEditorSuccess}
        />
      )}
    </div>
  );
}

// Clause Editor Modal Component
interface ClauseEditorModalProps {
  clause: Clause | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ClauseEditorModal({ clause, onClose, onSuccess }: ClauseEditorModalProps) {
  const [formData, setFormData] = useState({
    slug: clause?.slug || '',
    title: clause?.title || '',
    bodyHtml: clause?.bodyHtml || '',
    tags: clause?.tags || [],
    mandatory: clause?.mandatory || false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newTag, setNewTag] = useState('');

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function handleTitleChange(title: string) {
    setFormData({
      ...formData,
      title,
      slug: clause ? formData.slug : generateSlug(title), // Only auto-generate for new clauses
    });
  }

  function addTag() {
    if (!newTag.trim()) return;
    const tag = newTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
    }
    setNewTag('');
  }

  function removeTag(tag: string) {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  }

  async function handleSave() {
    if (!formData.title.trim() || !formData.slug.trim() || !formData.bodyHtml.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);

      const url = clause
        ? `${API_BASE_URL}/api/clauses/${clause.id}`
        : `${API_BASE_URL}/api/clauses`;

      const method = clause ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save clause');
      }

      alert(clause ? 'Clause updated successfully' : 'Clause created successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save clause:', error);
      alert(error.message || 'Failed to save clause');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-modal-backdrop"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="fixed inset-0 flex flex-col items-center justify-start z-modal p-4 pt-12 overflow-y-auto scrollbar-thin pointer-events-none"
      >
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl pointer-events-auto">
        <div className="bg-card rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">
            {clause ? 'Edit Clause' : 'New Clause'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground"
            disabled={isSaving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g., Cancellation Policy"
              disabled={isSaving}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Slug <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
              placeholder="e.g., cancellation-policy"
              disabled={isSaving}
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Unique identifier for this clause (lowercase, hyphens only)
            </p>
          </div>

          {/* Body HTML */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Content <span className="text-destructive">*</span>
            </label>
            <textarea
              value={formData.bodyHtml}
              onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
              rows={12}
              className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
              placeholder="<h3>Clause Title</h3><p>Clause content...</p>"
              disabled={isSaving}
            />
            <p className="mt-1 text-sm text-muted-foreground">
              HTML content. Use variables like {'{{client_name}}'}, {'{{event_date}}'}, etc.
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Add tag (e.g., payment, delivery)"
                disabled={isSaving}
              />
              <Button onClick={addTag} disabled={isSaving || !newTag.trim()}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={isSaving}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Mandatory */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.mandatory}
                onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                className="w-4 h-4 text-primary"
                disabled={isSaving}
              />
              <span className="text-sm font-medium text-foreground">
                Mandatory clause (must be included in all contracts)
              </span>
            </label>
            {formData.mandatory && (
              <p className="mt-1 ml-6 text-sm text-amber-600 flex items-start gap-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Mandatory clauses cannot be removed from templates and cannot be deleted.
              </p>
            )}
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Preview</label>
            <div
              className="p-4 border border-input rounded-lg bg-background prose prose-sm max-w-none [&_h3]:text-foreground [&_h4]:text-foreground [&_h5]:text-foreground [&_h6]:text-foreground [&_p]:text-foreground [&_li]:text-foreground [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: formData.bodyHtml }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-card border-t px-6 py-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : clause ? 'Update Clause' : 'Create Clause'}
          </Button>
        </div>
        </div>
        </div>
      </div>
    </>
  );
}
