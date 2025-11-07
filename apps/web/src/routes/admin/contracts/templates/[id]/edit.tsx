import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Eye } from 'lucide-react';
import { Button } from '../../../../../components/ui/Button';
import { Input } from '../../../../../components/ui/Input';
import { Label } from '../../../../../components/ui/Label';
import {
  getTemplateById,
  updateTemplate,
  createTemplate,
  getAllClauses,
  type ContractTemplate,
  type Clause,
} from '../../../../../lib/contracts-api';

export default function TemplateEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'SERVICE_AGREEMENT',
    eventType: '',
    bodyHtml: '',
    variablesSchema: { sections: [] as any[] },
    mandatoryClauseIds: [] as string[],
    isActive: true,
    isPublished: false,
  });

  // UI state
  const [activePanel, setActivePanel] = useState<'clauses' | 'content' | 'variables'>('content');

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setIsLoading(true);
      const [clausesData] = await Promise.all([getAllClauses()]);
      setClauses(clausesData);

      if (!isNew && id) {
        const templateData = await getTemplateById(id);
        setTemplate(templateData);
        setFormData({
          name: templateData.name,
          description: templateData.description || '',
          type: templateData.type || 'SERVICE_AGREEMENT',
          eventType: templateData.eventType || '',
          bodyHtml: templateData.bodyHtml || '',
          variablesSchema: templateData.variablesSchema || { sections: [] },
          mandatoryClauseIds: templateData.mandatoryClauseIds || [],
          isActive: templateData.isActive,
          isPublished: templateData.isPublished,
        });
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      alert('Failed to load template');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!formData.name) {
      alert('Please enter a template name');
      return;
    }

    try {
      setIsSaving(true);

      if (isNew) {
        const created = await createTemplate(formData);
        navigate(`/admin/contracts/templates/${created.id}/edit`);
      } else if (id) {
        await updateTemplate(id, formData);
      }

      alert('Template saved successfully!');
    } catch (error: any) {
      console.error('Failed to save template:', error);
      alert(error.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  }

  function addSection() {
    setFormData({
      ...formData,
      variablesSchema: {
        ...formData.variablesSchema,
        sections: [
          ...formData.variablesSchema.sections,
          {
            title: `Section ${formData.variablesSchema.sections.length + 1}`,
            fields: [],
          },
        ],
      },
    });
  }

  function addField(sectionIndex: number) {
    const newSections = [...formData.variablesSchema.sections];
    newSections[sectionIndex].fields.push({
      name: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false,
    });

    setFormData({
      ...formData,
      variablesSchema: {
        ...formData.variablesSchema,
        sections: newSections,
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/contracts/templates')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? 'Create Template' : 'Edit Template'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">{formData.name || 'Untitled Template'}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>
      </div>

      {/* Panel Toggle */}
      <div className="bg-card border-b border-border px-6 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActivePanel('clauses')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activePanel === 'clauses'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Clauses
          </button>
          <button
            onClick={() => setActivePanel('content')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activePanel === 'content'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Content & Settings
          </button>
          <button
            onClick={() => setActivePanel('variables')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activePanel === 'variables'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Variables
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {/* Clauses Panel */}
        {activePanel === 'clauses' && (
          <div className="max-w-4xl mx-auto bg-card rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Available Clauses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clauses.map((clause) => (
                <div
                  key={clause.id}
                  className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{clause.title}</h3>
                      <div
                        className="text-sm text-gray-600 mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: clause.bodyHtml }}
                      />
                    </div>
                    {clause.mandatory && (
                      <span className="ml-2 px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                        Required
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Panel */}
        {activePanel === 'content' && (
          <div className="max-w-4xl mx-auto bg-card rounded-lg shadow p-6 space-y-6">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Wedding Photography Contract"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this template"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Document Type</Label>
                <select
                  id="type"
                  className="w-full px-3 py-2 border border-input rounded-lg"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="SERVICE_AGREEMENT">Service Agreement</option>
                  <option value="MODEL_RELEASE">Model Release</option>
                  <option value="PROPERTY_RELEASE">Property Release</option>
                </select>
              </div>

              <div>
                <Label htmlFor="eventType">Event Type</Label>
                <select
                  id="eventType"
                  className="w-full px-3 py-2 border border-input rounded-lg"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="WEDDING">Wedding</option>
                  <option value="PORTRAIT">Portrait</option>
                  <option value="CORPORATE">Corporate</option>
                  <option value="COMMERCIAL">Commercial</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="bodyHtml">Template Content (HTML)</Label>
              <textarea
                id="bodyHtml"
                className="w-full px-3 py-2 border border-input rounded-lg font-mono text-sm"
                rows={15}
                value={formData.bodyHtml}
                onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                placeholder="<h1>Contract Title</h1><p>Contract content with {{variables}}...</p>"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {'{{variable_name}}'} for dynamic content
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-input rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublished: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-input rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Published</span>
              </label>
            </div>
          </div>
        )}

        {/* Variables Panel */}
        {activePanel === 'variables' && (
          <div className="max-w-4xl mx-auto bg-card rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Variable Schema</h2>
              <Button onClick={addSection} size="sm">
                Add Section
              </Button>
            </div>

            {formData.variablesSchema.sections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No sections yet. Click "Add Section" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.variablesSchema.sections.map((section: any, sectionIdx: number) => (
                  <div key={sectionIdx} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Input
                        value={section.title}
                        onChange={(e) => {
                          const newSections = [...formData.variablesSchema.sections];
                          newSections[sectionIdx].title = e.target.value;
                          setFormData({
                            ...formData,
                            variablesSchema: { ...formData.variablesSchema, sections: newSections },
                          });
                        }}
                        className="flex-1 font-medium"
                      />
                      <Button onClick={() => addField(sectionIdx)} size="sm" className="ml-2">
                        Add Field
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {section.fields?.map((field: any, fieldIdx: number) => (
                        <div key={fieldIdx} className="grid grid-cols-4 gap-2 items-center">
                          <Input
                            value={field.name}
                            onChange={(e) => {
                              const newSections = [...formData.variablesSchema.sections];
                              newSections[sectionIdx].fields[fieldIdx].name = e.target.value;
                              setFormData({
                                ...formData,
                                variablesSchema: { ...formData.variablesSchema, sections: newSections },
                              });
                            }}
                            placeholder="field_name"
                            className="text-sm"
                          />
                          <Input
                            value={field.label}
                            onChange={(e) => {
                              const newSections = [...formData.variablesSchema.sections];
                              newSections[sectionIdx].fields[fieldIdx].label = e.target.value;
                              setFormData({
                                ...formData,
                                variablesSchema: { ...formData.variablesSchema, sections: newSections },
                              });
                            }}
                            placeholder="Field Label"
                            className="text-sm"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => {
                              const newSections = [...formData.variablesSchema.sections];
                              newSections[sectionIdx].fields[fieldIdx].type = e.target.value;
                              setFormData({
                                ...formData,
                                variablesSchema: { ...formData.variablesSchema, sections: newSections },
                              });
                            }}
                            className="px-2 py-1 border border-input rounded text-sm"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="currency">Currency</option>
                            <option value="select">Select</option>
                          </select>
                          <label className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => {
                                const newSections = [...formData.variablesSchema.sections];
                                newSections[sectionIdx].fields[fieldIdx].required = e.target.checked;
                                setFormData({
                                  ...formData,
                                  variablesSchema: { ...formData.variablesSchema, sections: newSections },
                                });
                              }}
                              className="w-3 h-3 mr-1"
                            />
                            Required
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
