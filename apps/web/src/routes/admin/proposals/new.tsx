import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { createProposal, type ProposalItem } from '../../../lib/proposals-api';
import { getClients, type Client } from '../../../lib/api';
import { ClientSelector } from '../../../components/proposals/ClientSelector';

export default function NewProposalPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clientId, setClientId] = useState('');
  const [clientSelectorOpen, setClientSelectorOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<ProposalItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(20);
  const [validUntil, setValidUntil] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const response = await getClients({});
      setClients(response.data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function addLineItem() {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  }

  function removeLineItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: keyof ProposalItem, value: any) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  function calculateSubtotal(): number {
    return items.reduce((sum, item) => {
      return sum + item.quantity * Number(item.unitPrice);
    }, 0);
  }

  function calculateTax(): number {
    return calculateSubtotal() * (taxRate / 100);
  }

  function calculateTotal(): number {
    return calculateSubtotal() + calculateTax();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!clientId || !title || items.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const subtotal = calculateSubtotal();
      const taxAmount = calculateTax();
      const total = calculateTotal();

      const proposal = await createProposal({
        clientId,
        title,
        description,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
        taxRate: taxRate / 100,
        validUntil,
        terms,
        notes,
      });

      navigate(`/admin/proposals/${proposal.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create proposal');
    } finally {
      setIsSubmitting(false);
    }
  }

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = calculateTotal();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/proposals')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-foreground">New Proposal</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2">
          {/* Basic Information */}
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Client <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setClientSelectorOpen(true)}
                  className={`w-full px-4 py-2 border rounded-lg text-left flex items-center justify-between transition-colors ${
                    clientId
                      ? 'border-input bg-card hover:bg-muted'
                      : 'border-input bg-background'
                  }`}
                  required
                >
                  <span className={clientId ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                    {clientId
                      ? clients.find((c) => c.id === clientId)?.name || 'Select a client'
                      : 'Select a client'}
                  </span>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Photography Services"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional description..."
                  rows={4}
                  className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Line Items</h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addLineItem}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-background">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <Input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                          min="1"
                          className="text-right"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">£</span>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, 'unitPrice', Number(e.target.value))}
                            step="0.01"
                            min="0"
                            className="text-right"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        £{(item.quantity * Number(item.unitPrice)).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="text-destructive hover:text-destructive p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Terms & Notes */}
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Terms & Conditions</h2>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Terms and conditions..."
              rows={6}
              className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes..."
              rows={4}
              className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Right Column - Summary & Actions */}
        <div>
          {/* Tax & Validity */}
          <div className="bg-card rounded-lg shadow p-6 mb-6 sticky top-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Proposal Details</h2>

            <div className="space-y-4 mb-6 pb-6 border-b border-border">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tax Rate (%)
                </label>
                <Input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Valid Until
                </label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-4 mb-6 pb-6 border-b border-border">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">
                  £{subtotal.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                <span className="font-medium text-foreground">
                  £{tax.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">
                £{total.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Submit Actions */}
            <div className="space-y-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Creating...' : 'Create Proposal'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/proposals')}
                disabled={isSubmitting}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Client Selector Modal */}
      <ClientSelector
        clients={clients}
        selectedClientId={clientId}
        onSelectClient={setClientId}
        isOpen={clientSelectorOpen}
        onClose={() => setClientSelectorOpen(false)}
      />
    </div>
  );
}
