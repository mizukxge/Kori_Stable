import { useState } from 'react';
import { Trash2, Plus, Loader } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import {
  createProposalTemplate,
  updateProposalTemplate,
  type ProposalTemplate,
  type ProposalTemplateItem,
  type CreateProposalTemplateData,
} from '../../lib/proposal-templates-api';

interface TemplateEditorProps {
  template?: ProposalTemplate | null;
  isCreating: boolean;
  onSave: () => void;
  onClose: () => void;
}

export function TemplateEditor({ template, isCreating, onSave, onClose }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [title, setTitle] = useState(template?.title || '');
  const [defaultTerms, setDefaultTerms] = useState(template?.defaultTerms || '');
  const [items, setItems] = useState<ProposalTemplateItem[]>(template?.items || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        position: items.length,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ProposalTemplateItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'unitPrice' ? parseFloat(value) || 0 : value,
    };
    setItems(newItems);
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    if (items.some((item) => !item.description.trim())) {
      setError('All items must have a description');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const data: CreateProposalTemplateData = {
        name,
        description,
        title,
        defaultTerms,
        items: items.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          position: index,
        })),
      };

      if (template && !isCreating) {
        // Update existing
        await updateProposalTemplate(template.id, data);
      } else {
        // Create new
        await createProposalTemplate(data);
      }

      onSave();
    } catch (err) {
      console.error('Failed to save template:', err);
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Template Info */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {isCreating ? 'Create Proposal Template' : `Edit "${template?.name}"`}
        </h2>

        <div>
          <Label htmlFor="name">Template Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Wedding Full Day"
            disabled={saving}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this template"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            rows={2}
            disabled={saving}
          />
        </div>

        <div>
          <Label htmlFor="title">Default Proposal Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Wedding Photography Services"
            disabled={saving}
          />
        </div>

        <div>
          <Label htmlFor="defaultTerms">Default Terms & Conditions</Label>
          <textarea
            id="defaultTerms"
            value={defaultTerms}
            onChange={(e) => setDefaultTerms(e.target.value)}
            placeholder="Standard terms that will be included in proposals using this template"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            rows={3}
            disabled={saving}
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Line Items</h3>
          <Button
            onClick={handleAddItem}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={saving}
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No items yet. Add your first item.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                  <Button
                    onClick={() => handleRemoveItem(index)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Label htmlFor={`item-${index}-description`} className="text-sm">
                    Description
                  </Label>
                  <Input
                    id={`item-${index}-description`}
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(index, 'description', e.target.value)
                    }
                    placeholder="e.g., Full day coverage"
                    disabled={saving}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor={`item-${index}-quantity`} className="text-sm">
                      Qty
                    </Label>
                    <Input
                      id={`item-${index}-quantity`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor={`item-${index}-price`} className="text-sm">
                      Unit Price (£)
                    </Label>
                    <Input
                      id={`item-${index}-price`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="text-right text-sm font-medium">
                  Subtotal: £{(Number(item.unitPrice) * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}

            {/* Items Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm font-medium">
                Total: £
                {items
                  .reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0)
                  .toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button onClick={onClose} variant="outline" disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : isCreating ? 'Create Template' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
