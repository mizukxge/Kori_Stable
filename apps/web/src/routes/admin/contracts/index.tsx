import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  List,
  FileCode,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Activity,
  Download,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import {
  listContracts,
  getPublishedTemplates,
  getTemplateWithClauses,
  generateContract,
  type Contract,
  type ContractTemplate,
} from '../../../lib/contracts-api';
import { getClients, type Client } from '../../../lib/api';

type ContractStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED' | 'VOIDED' | 'EXPIRED';

interface GenerationStep {
  step: 1 | 2 | 3;
  template?: ContractTemplate & { clauses?: any[] };
  variables?: Record<string, any>;
  clientId?: string;
  title?: string;
}

export default function ContractsIndex() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Generation modal state
  const [isGenerationOpen, setIsGenerationOpen] = useState(false);
  const [generationStep, setGenerationStep] = useState<GenerationStep>({ step: 1 });
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load contracts
  useEffect(() => {
    loadContracts();
  }, []);

  // Filter contracts
  useEffect(() => {
    let filtered = contracts;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredContracts(filtered);
  }, [contracts, searchQuery, statusFilter]);

  async function loadContracts() {
    try {
      setIsLoading(true);
      const data = await listContracts();
      setContracts(data);
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function openGenerationModal() {
    try {
      const [templatesData, clientsData] = await Promise.all([
        getPublishedTemplates(),
        getClients({}),
      ]);
      setTemplates(templatesData);
      setClients(clientsData.data);
      setGenerationStep({ step: 1 });
      setIsGenerationOpen(true);
    } catch (error) {
      console.error('Failed to load generation data:', error);
      alert('Failed to open contract wizard');
    }
  }

  async function selectTemplate(templateId: string) {
    try {
      const template = await getTemplateWithClauses(templateId);
      setGenerationStep({ step: 2, template });
    } catch (error) {
      console.error('Failed to load template:', error);
      alert('Failed to load template');
    }
  }

  function buildVariableForm() {
    const { template } = generationStep;
    if (!template || !template.variablesSchema) return null;

    const schema = template.variablesSchema;
    const sections = schema.sections || [];

    return (
      <div className="space-y-6">
        <div className="mb-4">
          <Label htmlFor="contract-title">Contract Title *</Label>
          <Input
            id="contract-title"
            value={generationStep.title || ''}
            onChange={(e) =>
              setGenerationStep({ ...generationStep, title: e.target.value })
            }
            placeholder={`e.g., ${template.name} - Client Name`}
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="client-select">Client (Optional)</Label>
          <select
            id="client-select"
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring bg-background"
            value={generationStep.clientId || ''}
            onChange={(e) =>
              setGenerationStep({ ...generationStep, clientId: e.target.value })
            }
          >
            <option value="">No client selected</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} - {client.email}
              </option>
            ))}
          </select>
        </div>

        {sections.map((section: any, sectionIdx: number) => (
          <div key={sectionIdx} className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-4">{section.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields?.map((field: any, fieldIdx: number) => (
                <div key={fieldIdx} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <Label htmlFor={`field-${field.name}`}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderField(field: any) {
    const value = generationStep.variables?.[field.name] || field.default || '';

    const onChange = (newValue: any) => {
      setGenerationStep({
        ...generationStep,
        variables: {
          ...generationStep.variables,
          [field.name]: newValue,
        },
      });
    };

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <Input
            id={`field-${field.name}`}
            type={field.type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.label}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={`field-${field.name}`}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring bg-background"
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.label}
            required={field.required}
          />
        );

      case 'number':
      case 'currency':
        return (
          <Input
            id={`field-${field.name}`}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.label}
            required={field.required}
            min={field.min}
            max={field.max}
          />
        );

      case 'date':
        return (
          <Input
            id={`field-${field.name}`}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            id={`field-${field.name}`}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring bg-background"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <select
            id={`field-${field.name}`}
            multiple
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring bg-background"
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
              onChange(selected);
            }}
            required={field.required}
          >
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return <Input value={value} onChange={(e) => onChange(e.target.value)} />;
    }
  }

  async function handleGenerate() {
    const { template, title, variables, clientId } = generationStep;

    if (!template || !title) {
      alert('Please provide a contract title');
      return;
    }

    try {
      setIsGenerating(true);
      const contract = await generateContract({
        templateId: template.id,
        title,
        clientId,
        variables: variables || {},
      });

      alert('Contract generated successfully!');
      setIsGenerationOpen(false);
      loadContracts();
    } catch (error: any) {
      console.error('Failed to generate contract:', error);
      alert(error.message || 'Failed to generate contract');
    } finally {
      setIsGenerating(false);
    }
  }

  function getStatusIcon(status: ContractStatus) {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-5 h-5 text-muted-foreground" />;
      case 'SENT':
        return <Send className="w-5 h-5 text-primary" />;
      case 'VIEWED':
        return <Eye className="w-5 h-5 text-secondary" />;
      case 'SIGNED':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'VOIDED':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'EXPIRED':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  }

  function getStatusBadge(status: ContractStatus) {
    const colors = {
      DRAFT: 'bg-muted text-foreground',
      SENT: 'bg-blue-100 text-primary dark:text-primary',
      VIEWED: 'bg-purple-100 text-purple-800',
      SIGNED: 'bg-green-100 text-green-800',
      VOIDED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status}
      </span>
    );
  }

  // Calculate statistics from contracts
  function calculateStats() {
    const total = contracts.length;
    const draft = contracts.filter((c) => c.status === 'DRAFT').length;
    const sent = contracts.filter((c) => c.status === 'SENT').length;
    const viewed = contracts.filter((c) => c.status === 'VIEWED').length;
    const signed = contracts.filter((c) => c.status === 'SIGNED').length;
    const voided = contracts.filter((c) => c.status === 'VOIDED').length;
    const expired = contracts.filter((c) => c.status === 'EXPIRED').length;

    // Calculate conversion rate (sent → signed)
    const totalSent = sent + viewed + signed + voided;
    const conversionRate = totalSent > 0 ? (signed / totalSent) * 100 : 0;

    // Find pending contracts (sent or viewed)
    const pending = sent + viewed;

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentContracts = contracts.filter(
      (c) => new Date(c.createdAt) > sevenDaysAgo
    );

    return {
      total,
      draft,
      sent,
      viewed,
      signed,
      voided,
      expired,
      pending,
      conversionRate,
      recentCount: recentContracts.length,
    };
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contracts</h1>
          <p className="text-muted-foreground mt-1">Manage and generate contracts</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/contracts/dashboard">
            <Button variant="secondary">
              <TrendingUp className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link to="/admin/contracts/templates">
            <Button variant="secondary">
              <FileCode className="w-4 h-4 mr-2" />
              Templates
            </Button>
          </Link>
          <Link to="/admin/contracts/clauses">
            <Button variant="secondary">
              <List className="w-4 h-4 mr-2" />
              Clauses
            </Button>
          </Link>
          <Button onClick={openGenerationModal}>
            <Plus className="w-4 h-4 mr-2" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      {!isLoading && contracts.length > 0 && (() => {
        const stats = calculateStats();
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Contracts */}
            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Contracts</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.recentCount} in last 7 days
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-full">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>

            {/* Signed Contracts */}
            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Signed</p>
                  <p className="text-3xl font-bold text-success mt-2">{stats.signed}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-success mr-1" />
                    <p className="text-sm text-success">
                      {stats.conversionRate.toFixed(1)}% conversion
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-950 rounded-full">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </div>
            </div>

            {/* Pending Contracts */}
            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-secondary mt-2">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.sent} sent, {stats.viewed} viewed
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-full">
                  <Activity className="w-8 h-8 text-secondary" />
                </div>
              </div>
            </div>

            {/* Needs Attention */}
            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Needs Attention</p>
                  <p className="text-3xl font-bold text-warning mt-2">
                    {stats.draft + stats.voided + stats.expired}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.draft} draft, {stats.voided} voided
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-full">
                  <AlertCircle className="w-8 h-8 text-warning" />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Status Breakdown */}
      {!isLoading && contracts.length > 0 && (() => {
        const stats = calculateStats();
        return (
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Contract Status Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <button
                onClick={() => setStatusFilter('DRAFT')}
                className="text-center p-4 rounded-lg hover:bg-muted transition-colors border border-border"
              >
                <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.draft}</p>
                <p className="text-xs text-muted-foreground mt-1">Draft</p>
              </button>

              <button
                onClick={() => setStatusFilter('SENT')}
                className="text-center p-4 rounded-lg hover:bg-muted transition-colors border border-border"
              >
                <Send className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">{stats.sent}</p>
                <p className="text-xs text-muted-foreground mt-1">Sent</p>
              </button>

              <button
                onClick={() => setStatusFilter('VIEWED')}
                className="text-center p-4 rounded-lg hover:bg-muted transition-colors border border-border"
              >
                <Eye className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className="text-2xl font-bold text-secondary">{stats.viewed}</p>
                <p className="text-xs text-muted-foreground mt-1">Viewed</p>
              </button>

              <button
                onClick={() => setStatusFilter('SIGNED')}
                className="text-center p-4 rounded-lg hover:bg-muted transition-colors border border-border"
              >
                <CheckCircle className="w-6 h-6 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-success">{stats.signed}</p>
                <p className="text-xs text-muted-foreground mt-1">Signed</p>
              </button>

              <button
                onClick={() => setStatusFilter('VOIDED')}
                className="text-center p-4 rounded-lg hover:bg-muted transition-colors border border-border"
              >
                <XCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
                <p className="text-2xl font-bold text-destructive">{stats.voided}</p>
                <p className="text-xs text-muted-foreground mt-1">Voided</p>
              </button>

              <button
                onClick={() => setStatusFilter('EXPIRED')}
                className="text-center p-4 rounded-lg hover:bg-muted transition-colors border border-border"
              >
                <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-warning">{stats.expired}</p>
                <p className="text-xs text-muted-foreground mt-1">Expired</p>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Filters */}
      <div className="bg-card rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring bg-background"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="VIEWED">Viewed</option>
              <option value="SIGNED">Signed</option>
              <option value="VOIDED">Voided</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading contracts...</p>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No contracts found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first contract'}
          </p>
          <Button onClick={openGenerationModal}>
            <Plus className="w-4 h-4 mr-2" />
            Create Contract
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contract
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-muted">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(contract.status)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-foreground">
                          {contract.title}
                        </div>
                        <div className="text-sm text-muted-foreground">{contract.contractNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">
                      {contract.client?.name || 'No client'}
                    </div>
                    <div className="text-sm text-muted-foreground">{contract.client?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(contract.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(contract.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/contracts/${contract.id}`}>
                        <Button variant="secondary" size="sm" className="text-xs">
                          View
                        </Button>
                      </Link>
                      {contract.pdfPath && (
                        <a href={`http://localhost:3002${contract.pdfPath}`} download>
                          <Button variant="secondary" size="sm" className="text-xs">
                            <Download className="w-3 h-3" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Generation Modal */}
      <Modal
        isOpen={isGenerationOpen}
        onClose={() => setIsGenerationOpen(false)}
        title="Generate Contract"
        size="xl"
      >
        <div className="space-y-6">
          {/* Step 1: Select Template */}
          {generationStep.step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Select a Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => selectTemplate(template.id)}
                    className="text-left p-4 border border-border rounded-lg hover:border-primary hover:bg-muted transition-colors"
                  >
                    <h4 className="font-semibold text-foreground">{template.name}</h4>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <span className="bg-muted px-2 py-1 rounded">{template.type}</span>
                      {template.eventType && (
                        <span className="ml-2 bg-primary/10 text-primary px-2 py-1 rounded">
                          {template.eventType}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Fill Variables */}
          {generationStep.step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Fill Contract Details</h3>
                <button
                  onClick={() => setGenerationStep({ step: 1 })}
                  className="text-sm text-primary hover:text-primary dark:text-primary"
                >
                  ← Back to templates
                </button>
              </div>
              {buildVariableForm()}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => setIsGenerationOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Generate Contract'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
