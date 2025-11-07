import { useEffect, useState } from 'react';
import { listProposals, type Proposal } from '../../lib/proposals-api';
import { listInvoices, type Invoice } from '../../lib/invoices-api';
import { listContracts, type Contract } from '../../lib/contracts-api';
import { FileText, Eye, Download, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';

type DocumentType = 'all' | 'proposals' | 'invoices' | 'contracts';

interface Document {
  id: string;
  type: 'proposal' | 'invoice' | 'contract';
  number: string;
  title: string;
  clientName: string;
  amount: number | string;
  status: string;
  createdAt: string;
  pdfPath?: string;
}

export function AdminDocuments() {
  const [activeTab, setActiveTab] = useState<DocumentType>('all');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const [proposalsData, invoicesData, contractsData] = await Promise.all([
          listProposals(),
          listInvoices(),
          listContracts(),
        ]);

        const allDocs: Document[] = [];

        // Add proposals
        if (Array.isArray(proposalsData)) {
          proposalsData.forEach((p: Proposal) => {
            allDocs.push({
              id: p.id,
              type: 'proposal',
              number: p.proposalNumber,
              title: p.title,
              clientName: p.client?.name || 'Unknown Client',
              amount: p.total,
              status: p.status,
              createdAt: p.createdAt,
              pdfPath: p.pdfPath,
            });
          });
        }

        // Add invoices
        if (Array.isArray(invoicesData)) {
          invoicesData.forEach((i: Invoice) => {
            allDocs.push({
              id: i.id,
              type: 'invoice',
              number: i.invoiceNumber,
              title: i.title,
              clientName: i.client?.name || 'Unknown Client',
              amount: i.total,
              status: i.status,
              createdAt: i.createdAt,
              pdfPath: i.pdfPath,
            });
          });
        }

        // Add contracts
        if (Array.isArray(contractsData)) {
          contractsData.forEach((c: Contract) => {
            allDocs.push({
              id: c.id,
              type: 'contract',
              number: c.contractNumber,
              title: c.title,
              clientName: c.client?.name || 'Unknown Client',
              amount: 0,
              status: c.status,
              createdAt: c.createdAt,
              pdfPath: c.pdfPath,
            });
          });
        }

        // Sort by creation date (newest first)
        allDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setDocuments(allDocs);
      } catch (err) {
        console.error('Failed to fetch documents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const getFilteredDocuments = () => {
    if (activeTab === 'all') return documents;
    return documents.filter((doc) => doc.type === activeTab.slice(0, -1));
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (['draft'].includes(statusLower)) return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    if (['sent', 'partial'].includes(statusLower)) return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
    if (['viewed', 'pending'].includes(statusLower)) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
    if (['accepted', 'paid'].includes(statusLower)) return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
    if (['declined', 'overdue'].includes(statusLower)) return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
    return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      proposal: 'Proposal',
      invoice: 'Invoice',
      contract: 'Contract',
    };
    return labels[type] || type;
  };

  const filteredDocs = getFilteredDocuments();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Documents</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          All proposals, invoices, and contracts
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-8">
          {['all', 'proposals', 'invoices', 'contracts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as DocumentType)}
              className={`px-1 py-3 border-b-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No documents found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocs.map((doc) => (
            <div
              key={`${doc.type}-${doc.id}`}
              className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground truncate">{doc.title}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {doc.number}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded whitespace-nowrap">
                        {getTypeLabel(doc.type)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {doc.clientName} • {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {(typeof doc.amount === 'number' ? doc.amount : Number(doc.amount)) > 0 && (
                    <span className="font-semibold text-foreground whitespace-nowrap">
                      {typeof doc.amount === 'number' ? `£${doc.amount.toFixed(2)}` : `£${doc.amount}`}
                    </span>
                  )}
                  <Button variant="ghost" size="icon" title="View details">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {doc.pdfPath && (
                    <Button variant="ghost" size="icon" title="Download PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" title="Open">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}