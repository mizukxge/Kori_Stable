import { useEffect, useState } from 'react';
import { Plus, Edit2, Copy, Trash2, Loader } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import {
  listProposalTemplates,
  deleteProposalTemplate,
  duplicateProposalTemplate,
  type ProposalTemplate,
} from '../../../lib/proposal-templates-api';
import { TemplateEditor } from '../../../components/proposal-templates/TemplateEditor';

export function AdminProposalTemplates() {
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ProposalTemplate | null>(null);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listProposalTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError('Failed to load proposal templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsCreating(true);
    setIsEditorOpen(true);
  };

  const handleEdit = (template: ProposalTemplate) => {
    setSelectedTemplate(template);
    setIsCreating(false);
    setIsEditorOpen(true);
  };

  const handleDuplicate = async (template: ProposalTemplate) => {
    try {
      const newName = `${template.name} (Copy)`;
      await duplicateProposalTemplate(template.id, newName);
      await loadTemplates();
    } catch (err) {
      console.error('Failed to duplicate template:', err);
      setError('Failed to duplicate template');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    try {
      await deleteProposalTemplate(templateToDelete.id);
      await loadTemplates();
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Failed to delete template:', err);
      setError('Failed to delete template');
    }
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setSelectedTemplate(null);
  };

  const handleEditorSave = async () => {
    await loadTemplates();
    handleEditorClose();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Proposal Templates</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Create and manage reusable proposal templates
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <Loader className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">No proposal templates yet</p>
          <Button onClick={handleCreateNew}>Create First Template</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                    {!template.isActive && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                    {template.isPublic && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        Public
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{template.items.length} item{template.items.length !== 1 ? 's' : ''}</span>
                    <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(template)}
                    title="Edit template"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDuplicate(template)}
                    title="Duplicate template"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTemplateToDelete(template)}
                    title="Delete template"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Line Items Preview */}
              {template.items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Items:</p>
                  <div className="space-y-1">
                    {template.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        {item.quantity}x {item.description} @ £{Number(item.unitPrice).toFixed(2)}
                      </div>
                    ))}
                    {template.items.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{template.items.length - 3} more item{template.items.length - 3 !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Template Editor Modal */}
      <Modal isOpen={isEditorOpen} onClose={handleEditorClose} title="">
        <TemplateEditor
          template={selectedTemplate}
          isCreating={isCreating}
          onSave={handleEditorSave}
          onClose={handleEditorClose}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      {templateToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Template?"
          message={`Are you sure you want to delete "${templateToDelete.name}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setTemplateToDelete(null)}
          isDangerous
        />
      )}
    </div>
  );
}
