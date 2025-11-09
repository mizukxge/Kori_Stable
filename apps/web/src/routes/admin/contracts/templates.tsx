import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  FileText,
  CheckCircle,
  XCircle,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Trash,
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
}

interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  eventType?: string;
  bodyHtml?: string;
  variablesSchema?: any;
  mandatoryClauseIds: string[];
  isActive: boolean;
  isPublished: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdByUser?: { name: string; email: string };
}

interface TemplateWithClauses extends ContractTemplate {
  clauses: Clause[];
}

interface VariableField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  default?: any;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

interface VariableSection {
  title: string;
  fields: VariableField[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithClauses | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/contract-templates`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      alert('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePublish(id: string) {
    if (!confirm('Publish this template? It will be available for contract generation.')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/contract-templates/${id}/publish`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to publish template');

      alert('Template published successfully');
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to publish template:', error);
      alert(error.message || 'Failed to publish template');
    }
  }

  async function handleUnpublish(id: string) {
    if (!confirm('Unpublish this template? It will not be available for new contracts.')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/contract-templates/${id}/unpublish`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to unpublish template');

      alert('Template unpublished successfully');
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to unpublish template:', error);
      alert(error.message || 'Failed to unpublish template');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template? This action cannot be undone.')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/contract-templates/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete template');

      alert('Template deleted successfully');
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      alert(error.message || 'Failed to delete template');
    }
  }

  async function handleClone(template: ContractTemplate) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/contract-templates`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          description: template.description,
          type: template.type,
          eventType: template.eventType,
          bodyHtml: template.bodyHtml,
          variablesSchema: template.variablesSchema,
          mandatoryClauseIds: template.mandatoryClauseIds,
        }),
      });

      if (!response.ok) throw new Error('Failed to clone template');

      alert('Template cloned successfully');
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to clone template:', error);
      alert(error.message || 'Failed to clone template');
    }
  }

  async function openEditor(templateId?: string) {
    if (templateId) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/contract-templates/${templateId}/with-clauses`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) throw new Error('Failed to fetch template');

        const data = await response.json();
        setEditingTemplate(data);
      } catch (error) {
        console.error('Failed to load template:', error);
        alert('Failed to load template');
        return;
      }
    } else {
      setEditingTemplate(null);
    }
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingTemplate(null);
  }

  function handleEditorSuccess() {
    closeEditor();
    loadTemplates();
  }

  const filteredTemplates = templates.filter((template) => {
    // Search filter
    if (
      searchTerm &&
      !template.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Published filter
    if (publishedFilter === 'published' && !template.isPublished) {
      return false;
    }
    if (publishedFilter === 'draft' && template.isPublished) {
      return false;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contract Templates</h1>
            <p className="text-muted-foreground mt-1">Design and manage contract templates</p>
          </div>
          <Button onClick={() => openEditor()}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search templates by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Published Filter */}
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value as any)}
              className="px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Templates</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredTemplates.length} of {templates.length} templates
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-card rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                  {template.isPublished ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Published
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-muted text-foreground text-xs font-medium rounded">
                      Draft
                    </span>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                )}
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-50 text-primary rounded">
                    {template.type}
                  </span>
                  {template.eventType && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                      {template.eventType}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-background text-foreground rounded">
                    v{template.version}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="text-xs text-muted-foreground mb-4 space-y-1">
              <div>Clauses: {template.mandatoryClauseIds.length}</div>
              <div>Updated {new Date(template.updatedAt).toLocaleDateString()}</div>
              {template.createdByUser && <div>By {template.createdByUser.name}</div>}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openEditor(template.id)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleClone(template)}
                title="Clone template"
              >
                <Copy className="w-4 h-4" />
              </Button>
              {template.isPublished ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUnpublish(template.id)}
                  title="Unpublish template"
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePublish(template.id)}
                  title="Publish template"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDelete(template.id)}
                title="Delete template"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || publishedFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first template'}
          </p>
          {!searchTerm && publishedFilter === 'all' && (
            <Button onClick={() => openEditor()}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Template
            </Button>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <TemplateEditorModal
          template={editingTemplate}
          onClose={closeEditor}
          onSuccess={handleEditorSuccess}
        />
      )}
    </div>
  );
}

// Template Editor Modal Component
interface TemplateEditorModalProps {
  template: TemplateWithClauses | null;
  onClose: () => void;
  onSuccess: () => void;
}

function TemplateEditorModal({ template, onClose, onSuccess }: TemplateEditorModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [allClauses, setAllClauses] = useState<Clause[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    type: template?.type || 'SERVICE_AGREEMENT',
    eventType: template?.eventType || '',
    bodyHtml: template?.bodyHtml || '<div class="contract-header"><h1>{{contract_title}}</h1></div>',
    mandatoryClauseIds: template?.mandatoryClauseIds || [],
    variablesSchema: template?.variablesSchema || { sections: [] },
  });

  useEffect(() => {
    loadClauses();
  }, []);

  async function loadClauses() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/clauses`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch clauses');

      const data = await response.json();
      setAllClauses(data);

      // Add mandatory clauses to selection
      const mandatoryClauses = data.filter((c: Clause) => c.mandatory).map((c: Clause) => c.id);
      if (!template) {
        setFormData((prev) => ({
          ...prev,
          mandatoryClauseIds: mandatoryClauses,
        }));
      }
    } catch (error) {
      console.error('Failed to load clauses:', error);
    }
  }

  function toggleClause(clauseId: string, isMandatory: boolean) {
    if (isMandatory) return; // Can't remove mandatory clauses

    setFormData((prev) => ({
      ...prev,
      mandatoryClauseIds: prev.mandatoryClauseIds.includes(clauseId)
        ? prev.mandatoryClauseIds.filter((id) => id !== clauseId)
        : [...prev.mandatoryClauseIds, clauseId],
    }));
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      setIsSaving(true);

      const url = template
        ? `${API_BASE_URL}/api/contract-templates/${template.id}`
        : `${API_BASE_URL}/api/contract-templates`;

      const method = template ? 'PUT' : 'POST';

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
        throw new Error(error.message || 'Failed to save template');
      }

      alert(template ? 'Template updated successfully' : 'Template created successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save template:', error);
      alert(error.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  }

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Name and type' },
    { number: 2, title: 'Clauses', description: 'Select clauses' },
    { number: 3, title: 'Variables', description: 'Define variables' },
    { number: 4, title: 'Content', description: 'HTML template' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {template ? 'Edit Template' : 'New Template'}
            </h2>
            <div className="flex gap-2 mt-2">
              {steps.map((step) => (
                <button
                  key={step.number}
                  onClick={() => setCurrentStep(step.number)}
                  className={`px-3 py-1 text-xs rounded ${
                    currentStep === step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {step.number}. {step.title}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground" disabled={isSaving}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Step1BasicInfo formData={formData} setFormData={setFormData} />
          )}

          {/* Step 2: Clauses */}
          {currentStep === 2 && (
            <Step2Clauses
              allClauses={allClauses}
              selectedClauseIds={formData.mandatoryClauseIds}
              onToggleClause={toggleClause}
            />
          )}

          {/* Step 3: Variables */}
          {currentStep === 3 && (
            <Step3Variables formData={formData} setFormData={setFormData} />
          )}

          {/* Step 4: Content */}
          {currentStep === 4 && <Step4Content formData={formData} setFormData={setFormData} />}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="secondary" onClick={() => setCurrentStep(currentStep - 1)}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            {currentStep < 4 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1: Basic Info
function Step1BasicInfo({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Template Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="e.g., Wedding Photography Contract"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Brief description of this template..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Document Type <span className="text-destructive">*</span>
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="SERVICE_AGREEMENT">Service Agreement</option>
            <option value="USAGE_LICENSE">Usage License</option>
            <option value="MODEL_RELEASE">Model Release</option>
            <option value="PROPERTY_RELEASE">Property Release</option>
            <option value="NDA">NDA</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Event Type</label>
          <select
            value={formData.eventType}
            onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">None</option>
            <option value="WEDDING">Wedding</option>
            <option value="PORTRAIT">Portrait</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="EVENT">Event</option>
            <option value="BRAND">Brand/Editorial</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Step 2: Clauses Selection
function Step2Clauses({
  allClauses,
  selectedClauseIds,
  onToggleClause,
}: {
  allClauses: Clause[];
  selectedClauseIds: string[];
  onToggleClause: (clauseId: string, isMandatory: boolean) => void;
}) {
  const mandatoryClauses = allClauses.filter((c) => c.mandatory);
  const optionalClauses = allClauses.filter((c) => !c.mandatory);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Mandatory Clauses</h3>
        <p className="text-sm text-muted-foreground mb-4">
          These clauses are automatically included and cannot be removed.
        </p>
        <div className="space-y-2">
          {mandatoryClauses.map((clause) => (
            <div
              key={clause.id}
              className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <CheckCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-foreground">{clause.title}</div>
                <div className="text-sm text-muted-foreground">{clause.slug}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Optional Clauses</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select additional clauses to include in this template.
        </p>
        <div className="space-y-2">
          {optionalClauses.map((clause) => {
            const isSelected = selectedClauseIds.includes(clause.id);
            return (
              <button
                key={clause.id}
                onClick={() => onToggleClause(clause.id, clause.mandatory)}
                className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                    : 'bg-card border-border hover:bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-input'
                  }`}
                >
                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-foreground">{clause.title}</div>
                  <div className="text-sm text-muted-foreground">{clause.slug}</div>
                  {clause.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {clause.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-muted rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-blue-900">
              {selectedClauseIds.length} clauses selected
            </div>
            <div className="text-sm text-primary">
              {mandatoryClauses.length} mandatory + {selectedClauseIds.length - mandatoryClauses.length} optional
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Variables Schema Designer
function Step3Variables({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (data: any) => void;
}) {
  const [sections, setSections] = useState<VariableSection[]>(
    formData.variablesSchema?.sections || []
  );

  useEffect(() => {
    setFormData({
      ...formData,
      variablesSchema: { sections },
    });
  }, [sections]);

  function addSection() {
    setSections([...sections, { title: 'New Section', fields: [] }]);
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
  }

  function updateSection(index: number, updates: Partial<VariableSection>) {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], ...updates };
    setSections(newSections);
  }

  function addField(sectionIndex: number) {
    const newSections = [...sections];
    newSections[sectionIndex].fields.push({
      name: 'new_field',
      type: 'text',
      label: 'New Field',
      required: false,
    });
    setSections(newSections);
  }

  function removeField(sectionIndex: number, fieldIndex: number) {
    const newSections = [...sections];
    newSections[sectionIndex].fields = newSections[sectionIndex].fields.filter(
      (_, i) => i !== fieldIndex
    );
    setSections(newSections);
  }

  function updateField(
    sectionIndex: number,
    fieldIndex: number,
    updates: Partial<VariableField>
  ) {
    const newSections = [...sections];
    newSections[sectionIndex].fields[fieldIndex] = {
      ...newSections[sectionIndex].fields[fieldIndex],
      ...updates,
    };
    setSections(newSections);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Variable Schema</h3>
          <p className="text-sm text-muted-foreground">
            Define the variables that will be filled when generating contracts
          </p>
        </div>
        <Button onClick={addSection} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 && (
        <div className="text-center py-12 bg-background rounded-lg border-2 border-dashed">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No variable sections defined</p>
          <Button onClick={addSection} size="sm">
            Add First Section
          </Button>
        </div>
      )}

      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="bg-card border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              value={section.title}
              onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
              className="text-lg font-semibold px-2 py-1 border border-transparent hover:border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addField(sectionIndex)}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => removeSection(sectionIndex)}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {section.fields.map((field, fieldIndex) => (
              <VariableFieldEditor
                key={fieldIndex}
                field={field}
                onUpdate={(updates) => updateField(sectionIndex, fieldIndex, updates)}
                onRemove={() => removeField(sectionIndex, fieldIndex)}
              />
            ))}
            {section.fields.length === 0 && (
              <div className="text-center py-6 bg-background rounded border-2 border-dashed">
                <p className="text-sm text-muted-foreground">No fields in this section</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Variable Field Editor
function VariableFieldEditor({
  field,
  onUpdate,
  onRemove,
}: {
  field: VariableField;
  onUpdate: (updates: Partial<VariableField>) => void;
  onRemove: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded p-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-muted-foreground hover:text-muted-foreground">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="flex-1 px-2 py-1 border border-transparent hover:border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Field Label"
        />
        <span className="text-xs text-muted-foreground font-mono">{`{{${field.name}}}`}</span>
        <button onClick={onRemove} className="text-destructive hover:text-destructive">
          <Trash className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pl-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Variable Name
              </label>
              <input
                type="text"
                value={field.name}
                onChange={(e) => onUpdate({ name: e.target.value.replace(/[^a-z0-9_]/g, '_') })}
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-ring font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Type</label>
              <select
                value={field.type}
                onChange={(e) => onUpdate({ type: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="number">Number</option>
                <option value="currency">Currency</option>
                <option value="date">Date</option>
                <option value="select">Select</option>
                <option value="multiselect">Multi-Select</option>
                <option value="textarea">Textarea</option>
              </select>
            </div>
          </div>

          {(field.type === 'select' || field.type === 'multiselect') && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Options (comma-separated)
              </label>
              <input
                type="text"
                value={field.options?.join(', ') || ''}
                onChange={(e) =>
                  onUpdate({ options: e.target.value.split(',').map((s) => s.trim()) })
                }
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="w-4 h-4"
              />
              Required
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 4: Content HTML
function Step4Content({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-foreground">HTML Content</label>
          <span className="text-xs text-muted-foreground">
            Use {'{{variable_name}}'} for variables
          </span>
        </div>
        <textarea
          value={formData.bodyHtml}
          onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
          rows={20}
          className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
          placeholder="<div>Contract HTML content...</div>"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Preview</label>
        <div
          className="p-6 border rounded-lg bg-background prose max-w-none"
          dangerouslySetInnerHTML={{ __html: formData.bodyHtml }}
        />
      </div>
    </div>
  );
}
