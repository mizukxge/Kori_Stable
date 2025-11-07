import { useEffect, useState } from 'react';
import { FileText, Calendar, DollarSign, Eye, Download, ExternalLink, Loader } from 'lucide-react';
import { Button } from './ui/Button';
import { listProposals, type Proposal } from '../lib/proposals-api';
import { listInvoices, type Invoice } from '../lib/invoices-api';
import { listContracts, type Contract } from '../lib/contracts-api';

interface ClientDocument {
  id: string;
  type: 'proposal' | 'invoice' | 'contract';
  number: string;
  title: string;
  amount: number | string;
  status: string;
  date: string;
  link?: string;
}

interface ClientDocumentsProps {
  clientId: string;
}

type FilterType = 'all' | 'proposals' | 'invoices' | 'contracts';

export function ClientDocuments({ clientId }: ClientDocumentsProps) {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadDocuments();
  }, [clientId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const [proposalsData, invoicesData, contractsData] = await Promise.all([
        listProposals().catch(() => []),
        listInvoices().catch(() => []),
        listContracts().catch(() => []),
      ]);

      const allDocs: ClientDocument[] = [];

      // Add proposals
      if (Array.isArray(proposalsData)) {
        proposalsData
          .filter((p: any) => p.clientId === clientId)
          .forEach((p: any) => {
            allDocs.push({
              id: p.id,
              type: 'proposal',
              number: p.proposalNumber,
              title: p.title,
              amount: p.total || 0,
              status: p.status,
              date: new Date(p.createdAt).toLocaleDateString(),
              link: `/admin/proposals/${p.id}`,
            });
          });
      }

      // Add invoices
      if (Array.isArray(invoicesData)) {
        invoicesData
          .filter((i: any) => i.clientId === clientId)
          .forEach((i: any) => {
            allDocs.push({
              id: i.id,
              type: 'invoice',
              number: i.invoiceNumber,
              title: i.title,
              amount: i.total || 0,
              status: i.status,
              date: new Date(i.createdAt).toLocaleDateString(),
              link: `/admin/invoices/${i.id}`,
            });
          });
      }

      // Add contracts
      if (Array.isArray(contractsData)) {
        contractsData
          .filter((c: any) => c.clientId === clientId)
          .forEach((c: any) => {
            allDocs.push({
              id: c.id,
              type: 'contract',
              number: c.contractNumber,
              title: c.title,
              amount: 0,
              status: c.status,
              date: new Date(c.createdAt).toLocaleDateString(),
              link: `/admin/contracts/${c.id}`,
            });
          });
      }

      // Sort by date (newest first)
      allDocs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDocuments(allDocs);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDocuments = () => {
    if (activeFilter === 'all') return documents;
    return documents.filter((doc) => doc.type === activeFilter.slice(0, -1));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'proposal':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'invoice':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'contract':
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'proposal':
        return 'Proposal';
      case 'invoice':
        return 'Invoice';
      case 'contract':
        return 'Contract';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (['draft'].includes(statusLower))
      return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    if (['sent', 'partial'].includes(statusLower))
      return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
    if (['viewed', 'pending'].includes(statusLower))
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
    if (['accepted', 'paid', 'signed'].includes(statusLower))
      return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
    if (['declined', 'overdue', 'voided', 'cancelled'].includes(statusLower))
      return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
    return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
  };

  const filteredDocs = getFilteredDocuments();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2 border-b border-border pb-4">
        {(['all', 'proposals', 'invoices', 'contracts'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeFilter === filter
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <Loader className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No documents found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <div
              key={`${doc.type}-${doc.id}`}
              className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">{getTypeIcon(doc.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-medium text-foreground truncate">{doc.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ({doc.number})
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(
                        doc.status
                      )}`}
                    >
                      {doc.status}
                    </span>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded whitespace-nowrap">
                      {getTypeLabel(doc.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{doc.date}</span>
                    {doc.amount > 0 && (
                      <>
                        <span>•</span>
                        <DollarSign className="h-3 w-3" />
                        <span>£{Number(doc.amount).toFixed(2)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.link && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="View details"
                      onClick={() => (window.location.href = doc.link!)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {documents.length > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Proposals</p>
            <p className="text-2xl font-bold">
              {documents.filter((d) => d.type === 'proposal').length}
            </p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Contracts</p>
            <p className="text-2xl font-bold">
              {documents.filter((d) => d.type === 'contract').length}
            </p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Invoices</p>
            <p className="text-2xl font-bold">
              {documents.filter((d) => d.type === 'invoice').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
