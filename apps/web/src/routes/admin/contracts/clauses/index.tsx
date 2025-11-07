import { useState, useEffect } from 'react';
import { Plus, Search, Tag, FileText, Edit, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Modal } from '../../../../components/ui/Modal';
import { Label } from '../../../../components/ui/Label';
import {
  getAllClauses,
  createClause,
  updateClause,
  deleteClause,
  type Clause,
} from '../../../../lib/contracts-api';

export default function ClausesIndex() {
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [filteredClauses, setFilteredClauses] = useState<Clause[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mandatoryFilter, setMandatoryFilter] = useState<'all' | 'mandatory' | 'optional'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Editor modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingClause, setEditingClause] = useState<Clause | null>(null);
  const [editorForm, setEditorForm] = useState({
    title: '',
    slug: '',
    bodyHtml: '',
    tags: [] as string[],
    mandatory: false,
    isActive: true,
  });
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load clauses
  useEffect(() => {
    loadClauses();
  }, []);

  // Filter clauses
  useEffect(() => {
    let filtered = clauses;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.bodyHtml.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Mandatory filter
    if (mandatoryFilter !== 'all') {
      filtered = filtered.filter((c) =>
        mandatoryFilter === 'mandatory' ? c.mandatory : !c.mandatory
      );
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((c) =>
        selectedTags.every((tag) => c.tags.includes(tag))
      );
    }

    setFilteredClauses(filtered);
  }, [clauses, searchQuery, mandatoryFilter, selectedTags]);

  async function loadClauses() {
    try {
      setIsLoading(true);
      const data = await getAllClauses();
      setClauses(data);
    } catch (error) {
      console.error('Failed to load clauses:', error);
      alert('Failed to load clauses');
    } finally {
      setIsLoading(false);
    }
  }

  function openEditor(clause?: Clause) {
    if (clause) {
      setEditingClause(clause);
      setEditorForm({
        title: clause.title,
        slug: clause.slug,
        bodyHtml: clause.bodyHtml,
        tags: clause.tags,
        mandatory: clause.mandatory,
        isActive: clause.isActive,
      });
    } else {
      setEditingClause(null);
      setEditorForm({
        title: '',
        slug: '',
        bodyHtml: '',
        tags: [],
        mandatory: false,
        isActive: true,
      });
    }
    setIsEditorOpen(true);
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function handleTitleChange(title: string) {
    setEditorForm({
      ...editorForm,
      title,
      slug: editorForm.slug || generateSlug(title),
    });
  }

  function addTag() {
    if (newTag && !editorForm.tags.includes(newTag.trim())) {
      setEditorForm({
        ...editorForm,
        tags: [...editorForm.tags, newTag.trim()],
      });
      setNewTag('');
    }
  }

  function removeTag(tag: string) {
    setEditorForm({
      ...editorForm,
      tags: editorForm.tags.filter((t) => t !== tag),
    });
  }

  async function handleSave() {
    if (!editorForm.title || !editorForm.slug || !editorForm.bodyHtml) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);

      if (editingClause) {
        await updateClause(editingClause.id, editorForm);
      } else {
        await createClause(editorForm);
      }

      setIsEditorOpen(false);
      loadClauses();
    } catch (error: any) {
      console.error('Failed to save clause:', error);
      alert(error.message || 'Failed to save clause');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(clause: Clause) {
    if (!confirm(`Are you sure you want to delete "${clause.title}"?`)) {
      return;
    }

    try {
      await deleteClause(clause.id);
      loadClauses();
    } catch (error: any) {
      console.error('Failed to delete clause:', error);
      alert(error.message || 'Failed to delete clause');
    }
  }

  function handleClone(clause: Clause) {
    openEditor({
      ...clause,
      id: '',
      title: `${clause.title} (Copy)`,
      slug: `${clause.slug}-copy`,
    } as Clause);
  }

  // Get all unique tags
  const allTags = Array.from(new Set(clauses.flatMap((c) => c.tags))).sort();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clause Library</h1>
          <p className="text-muted-foreground mt-1">
            Manage contract clauses and building blocks
          </p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="w-4 h-4 mr-2" />
          New Clause
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clauses</p>
                <p className="text-2xl font-bold text-foreground mt-1">{clauses.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mandatory</p>
                <p className="text-2xl font-bold text-destructive mt-1">
                  {clauses.filter((c) => c.mandatory).length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Optional</p>
                <p className="text-2xl font-bold text-success mt-1">
                  {clauses.filter((c) => !c.mandatory).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <XCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Tags</p>
                <p className="text-2xl font-bold text-secondary mt-1">{allTags.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Tag className="w-6 h-6 text-secondary" />
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
                placeholder="Search clauses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Mandatory filter */}
          <div>
            <Label htmlFor="mandatory-filter">Type</Label>
            <select
              id="mandatory-filter"
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring"
              value={mandatoryFilter}
              onChange={(e) => setMandatoryFilter(e.target.value as any)}
            >
              <option value="all">All Clauses</option>
              <option value="mandatory">Mandatory Only</option>
              <option value="optional">Optional Only</option>
            </select>
          </div>

          {/* Tag filter */}
          <div>
            <Label htmlFor="tag-filter">Filter by Tags</Label>
            <select
              id="tag-filter"
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring"
              value=""
              onChange={(e) => {
                const tag = e.target.value;
                if (tag && !selectedTags.includes(tag)) {
                  setSelectedTags([...selectedTags, tag]);
                }
              }}
            >
              <option value="">Add tag filter...</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag} disabled={selectedTags.includes(tag)}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-primary dark:text-primary"
              >
                {tag}
                <button
                  onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
                  className="ml-2 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={() => setSelectedTags([])}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Clauses Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading clauses...</p>
        </div>
      ) : filteredClauses.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No clauses found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || selectedTags.length > 0 || mandatoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first clause'}
          </p>
          <Button onClick={() => openEditor()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Clause
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClauses.map((clause) => (
            <div
              key={clause.id}
              className="bg-card rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{clause.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{clause.slug}</p>
                </div>
                {clause.mandatory && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Mandatory
                  </span>
                )}
              </div>

              {/* Content preview */}
              <div
                className="text-sm text-muted-foreground mb-4 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: clause.bodyHtml }}
              />

              {/* Tags */}
              {clause.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {clause.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-muted text-foreground"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <button
                  onClick={() => openEditor(clause)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-primary hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleClone(clause)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-background rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Clone
                </button>
                <button
                  onClick={() => handleDelete(clause)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-destructive hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingClause ? 'Edit Clause' : 'Create New Clause'}
        size="xl"
      >
        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="clause-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="clause-title"
              value={editorForm.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Payment Terms"
            />
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="clause-slug">
              Slug <span className="text-destructive">*</span>
            </Label>
            <Input
              id="clause-slug"
              value={editorForm.slug}
              onChange={(e) => setEditorForm({ ...editorForm, slug: e.target.value })}
              placeholder="e.g., payment-terms"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL-friendly identifier (auto-generated from title)
            </p>
          </div>

          {/* Body HTML */}
          <div>
            <Label htmlFor="clause-body">
              Content <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="clause-body"
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring font-mono text-sm"
              rows={10}
              value={editorForm.bodyHtml}
              onChange={(e) => setEditorForm({ ...editorForm, bodyHtml: e.target.value })}
              placeholder="<p>Enter clause content with HTML...</p>"
            />
            <p className="text-xs text-muted-foreground mt-1">
              HTML content. Use variables like {'{{client_name}}'}, {'{{event_date}}'}, etc.
            </p>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="clause-tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="clause-tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add a tag..."
              />
              <Button type="button" onClick={addTag} variant="secondary">
                Add
              </Button>
            </div>
            {editorForm.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {editorForm.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-primary dark:text-primary"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Mandatory checkbox */}
          <div className="flex items-center">
            <input
              id="clause-mandatory"
              type="checkbox"
              checked={editorForm.mandatory}
              onChange={(e) =>
                setEditorForm({ ...editorForm, mandatory: e.target.checked })
              }
              className="w-4 h-4 text-primary border-input rounded focus:ring-ring"
            />
            <label htmlFor="clause-mandatory" className="ml-2 text-sm text-foreground">
              Mandatory (must be included in all contracts)
            </label>
          </div>

          {/* Active checkbox */}
          <div className="flex items-center">
            <input
              id="clause-active"
              type="checkbox"
              checked={editorForm.isActive}
              onChange={(e) =>
                setEditorForm({ ...editorForm, isActive: e.target.checked })
              }
              className="w-4 h-4 text-primary border-input rounded focus:ring-ring"
            />
            <label htmlFor="clause-active" className="ml-2 text-sm text-foreground">
              Active (available for use in templates)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : editingClause ? 'Update Clause' : 'Create Clause'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
