import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  PoundSterling,
  TrendingUp,
  Download,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  listInvoices,
  getInvoiceStats,
  type Invoice,
  type InvoiceStats,
} from '../../../lib/invoices-api';
import { getClients, type Client } from '../../../lib/api';

export default function InvoicesIndex() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchQuery, statusFilter, clientFilter]);

  async function loadData() {
    try {
      setIsLoading(true);
      const [invoicesData, clientsResponse, statsData] = await Promise.all([
        listInvoices(),
        getClients({}),
        getInvoiceStats(),
      ]);
      setInvoices(invoicesData);
      setClients(clientsResponse.data);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function filterInvoices() {
    let filtered = invoices;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    if (clientFilter !== 'ALL') {
      filtered = filtered.filter((inv) => inv.clientId === clientFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-4 h-4" />;
      case 'SENT':
        return <Send className="w-4 h-4" />;
      case 'PARTIAL':
        return <AlertCircle className="w-4 h-4" />;
      case 'PAID':
        return <CheckCircle className="w-4 h-4" />;
      case 'OVERDUE':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-muted text-foreground';
      case 'SENT':
        return 'bg-blue-100 text-primary dark:text-primary';
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Create and manage client invoices</p>
        </div>
        <Link to="/admin/invoices/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unpaid</p>
                <p className="text-2xl font-bold text-destructive">
                  £{Number(stats.unpaidAmount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-success">
                  £{Number(stats.totalRevenue).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">
                  £{(
                    Number(stats.totalRevenue) + Number(stats.unpaidAmount)
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            className="md:w-40 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring bg-background"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          <select
            className="md:w-40 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring bg-background"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="ALL">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading invoices...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No invoices found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || statusFilter !== 'ALL' || clientFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first invoice'}
          </p>
          <Link to="/admin/invoices/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-muted">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(invoice.status)}
                      <div className="ml-3">
                        <p className="font-medium text-foreground">{invoice.title}</p>
                        <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{invoice.client?.name}</p>
                    <p className="text-sm text-muted-foreground">{invoice.client?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <PoundSterling className="w-4 h-4 text-muted-foreground mr-1" />
                      <p className="font-medium text-foreground">
                        {Number(invoice.total).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : 'No due date'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/admin/invoices/${invoice.id}`}>
                      <Button variant="secondary" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
