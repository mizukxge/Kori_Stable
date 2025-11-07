/**
 * Proposal Templates Management Page
 * Manage email templates for sending proposals to clients
 */

import { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import { Mail, Plus, Edit2, Trash2, Star } from 'lucide-react';
import {
  listEmailTemplates,
  deleteEmailTemplate,
  setDefaultEmailTemplate,
  getTemplateStats,
  type ProposalEmailTemplate,
  type TemplateStats,
} from '../../../../lib/proposal-email-templates-api';
import { EmailTemplateEditor } from '../../../../components/proposal-email-templates/EmailTemplateEditor';

export default function ProposalTemplatesPage() {
  const [templates, setTemplates] = useState<ProposalEmailTemplate[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor modal state
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProposalEmailTemplate | null>(null);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    template: ProposalEmailTemplate | null;
  }>({ show: false, template: null });

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTemplates();
    loadStats();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listEmailTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getTemplateStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const handleEdit = (template: ProposalEmailTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingTemplate(null);
    loadTemplates();
    loadStats();
  };

  const handleDelete = async (template: ProposalEmailTemplate) => {
    setDeleteConfirm({ show: true, template });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.template) return;

    try {
      await deleteEmailTemplate(deleteConfirm.template.id);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteConfirm.template!.id));
      setDeleteConfirm({ show: false, template: null });
      loadStats();
    } catch (err) {
      console.error('Failed to delete template:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleSetDefault = async (template: ProposalEmailTemplate) => {
    try {
      await setDefaultEmailTemplate(template.id);
      loadTemplates();
      loadStats();
    } catch (err) {
      console.error('Failed to set default:', err);
      alert(err instanceof Error ? err.message : 'Failed to set as default');
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            Email Templates
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage email templates for sending proposals to clients
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-destructive">{error}</p>
        </Card>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Templates</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.active}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Inactive</div>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Default Template</div>
            <div className="text-sm font-medium truncate">
              {stats.hasDefault ? stats.defaultTemplate?.name : 'None set'}
            </div>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Templates list */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? 'No templates match your search.'
              : 'Create your first email template to get started.'}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="p-6 hover:border-primary transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    {template.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        <Star className="h-3 w-3" />
                        Default
                      </span>
                    )}
                    {!template.isActive && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Subject: </span>
                      <span className="text-sm">{template.subject}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {template._count && (
                        <span>Used in {template._count.proposals} proposals</span>
                      )}
                      <span>
                        Created {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(template)}
                    title="Edit template"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {!template.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSetDefault(template)}
                      title="Set as default"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(template)}
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Email Template Editor Modal */}
      {showEditor && (
        <EmailTemplateEditor
          template={editingTemplate}
          onClose={handleEditorClose}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, template: null })}
        onConfirm={confirmDelete}
        title="Delete Email Template"
        description={`Are you sure you want to delete "${deleteConfirm.template?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </div>
  );
}
