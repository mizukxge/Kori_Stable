/**
 * Email Template Editor Modal Component
 * Handles creating and editing proposal email templates
 */

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { X, ChevronDown } from 'lucide-react';
import {
  createEmailTemplate,
  updateEmailTemplate,
  type ProposalEmailTemplate,
  type CreateEmailTemplateInput,
  type UpdateEmailTemplateInput,
} from '../../lib/proposal-email-templates-api';

interface EmailTemplateEditorProps {
  template: ProposalEmailTemplate | null;
  onClose: () => void;
}

// Common template variables for proposals
const TEMPLATE_VARIABLES = [
  { name: 'clientName', label: 'Client Name' },
  { name: 'clientEmail', label: 'Client Email' },
  { name: 'proposalNumber', label: 'Proposal Number' },
  { name: 'proposalDate', label: 'Proposal Date' },
  { name: 'proposalTotal', label: 'Proposal Total' },
  { name: 'dueDate', label: 'Due Date' },
  { name: 'projectDescription', label: 'Project Description' },
  { name: 'adminName', label: 'Your Name' },
  { name: 'adminEmail', label: 'Your Email' },
  { name: 'proposalLink', label: 'Proposal Link' },
];

export function EmailTemplateEditor({ template, onClose }: EmailTemplateEditorProps) {
  const [formData, setFormData] = useState<{
    name: string;
    subject: string;
    content: string;
  }>({
    name: template?.name || '',
    subject: template?.subject || '',
    content: template?.content || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVariables, setShowVariables] = useState(false);

  const isCreating = !template;
  const isValid = formData.name.trim() && formData.subject.trim() && formData.content.trim();

  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const insertVariable = (varName: string) => {
    const placeholder = `{{${varName}}}`;
    setFormData((prev) => ({
      ...prev,
      content: prev.content + placeholder,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isCreating) {
        const input: CreateEmailTemplateInput = {
          name: formData.name.trim(),
          subject: formData.subject.trim(),
          content: formData.content.trim(),
        };
        await createEmailTemplate(input);
      } else {
        const input: UpdateEmailTemplateInput = {
          name: formData.name.trim(),
          subject: formData.subject.trim(),
          content: formData.content.trim(),
        };
        await updateEmailTemplate(template.id, input);
      }

      onClose();
    } catch (err) {
      console.error('Failed to save template:', err);
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-modal bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-bold">
            {isCreating ? 'New Email Template' : 'Edit Email Template'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {error && (
            <Card className="p-4 border-destructive bg-destructive/10">
              <p className="text-sm text-destructive">{error}</p>
            </Card>
          )}

          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Template Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Welcome Proposal, Follow-up Proposal"
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              A descriptive name for easy identification
            </p>
          </div>

          {/* Email Subject */}
          <div>
            <label className="block text-sm font-medium mb-2">Email Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="e.g., Your Project Proposal - {{proposalNumber}}"
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              You can use template variables like {'{clientName}'}
            </p>
          </div>

          {/* Email Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Email Content</label>
              <div className="relative">
                <button
                  onClick={() => setShowVariables(!showVariables)}
                  className="inline-flex items-center gap-2 px-3 py-1 text-sm border rounded-lg bg-background hover:bg-muted transition-colors"
                  disabled={loading}
                >
                  Insert Variable
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showVariables && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border rounded-lg shadow-lg z-10">
                    <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                      {TEMPLATE_VARIABLES.map((variable) => (
                        <button
                          key={variable.name}
                          onClick={() => {
                            insertVariable(variable.name);
                            setShowVariables(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded transition-colors"
                          disabled={loading}
                        >
                          <div className="font-medium">{variable.label}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {'{'}
                            {variable.name}
                            {'}'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder={`Dear {{clientName}},\n\nHere is your proposal for {{projectDescription}}...\n\nBest regards,\n{{adminName}}`}
              className="w-full h-64 px-3 py-2 border rounded-lg bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Use variables in the format {'{variableName}'} - click "Insert Variable" for a list of available options
            </p>
          </div>

          {/* Template Preview Info */}
          <Card className="p-4 bg-muted/50 border-dashed">
            <h4 className="text-sm font-medium mb-2">Variable Usage Tips:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>" Variables are replaced with actual data when the template is used</li>
              <li>" Use {'{clientName}'} to personalize messages</li>
              <li>" {'{proposalLink}'} provides a direct link to the proposal</li>
              <li>" All variables are optional - they'll show as [Missing] if not available</li>
            </ul>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-card flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !isValid}
            className="gap-2"
          >
            {loading ? 'Saving...' : isCreating ? 'Create Template' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
