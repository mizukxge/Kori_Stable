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
  Trash2,
  PoundSterling,
  TrendingUp,
  Filter,
  BarChart3,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { listProposals, getProposalStats, type Proposal, type ProposalStats } from '../../../lib/proposals-api';
import { getClients, type Client } from '../../../lib/api';

export default function ProposalsIndex() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<ProposalStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProposals();
  }, [proposals, searchQuery, statusFilter, clientFilter]);

  async function loadData() {
    try {
      setIsLoading(true);
      const [proposalsData, clientsResponse, statsData] = await Promise.all([
        listProposals(),
        getClients({}),
        getProposalStats(),
      ]);
      setProposals(proposalsData);
      setClients(clientsResponse.data);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load proposals:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function filterProposals() {
    let filtered = proposals;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (clientFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.clientId === clientFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.proposalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProposals(filtered);
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-4 h-4" />;
      case 'SENT':
        return <Send className="w-4 h-4" />;
      case 'VIEWED':
        return <Eye className="w-4 h-4" />;
      case 'ACCEPTED':
        return <CheckCircle className="w-4 h-4" />;
      case 'DECLINED':
        return <XCircle className="w-4 h-4" />;
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
      case 'VIEWED':
        return 'bg-purple-100 text-purple-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proposals</h1>
          <p className="text-muted-foreground mt-1">Create and manage client proposals</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/proposals/dashboard">
            <Button variant="secondary">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link to="/admin/proposals/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Proposal
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Proposals</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-primary">{stats.pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold text-success">{stats.accepted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                <p className="text-2xl font-bold text-secondary">{stats.acceptanceRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
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
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            className="md:w-40 px-3 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="VIEWED">Viewed</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="DECLINED">Declined</option>
          </select>
          <select
            className="md:w-40 px-3 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring"
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

      {/* Proposals Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading proposals...</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No proposals found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || statusFilter !== 'ALL' || clientFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first proposal'}
          </p>
          <Link to="/admin/proposals/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Proposal
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Proposal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Amount
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
              {filteredProposals.map((proposal) => (
                <tr key={proposal.id} className="hover:bg-muted">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(proposal.status)}
                      <div className="ml-3">
                        <p className="font-medium text-foreground">{proposal.title}</p>
                        <p className="text-sm text-muted-foreground">{proposal.proposalNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{proposal.client?.name}</p>
                    <p className="text-sm text-muted-foreground">{proposal.client?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <PoundSterling className="w-4 h-4 text-muted-foreground mr-1" />
                      <p className="font-medium text-foreground">
                        {Number(proposal.total).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                      {getStatusIcon(proposal.status)}
                      {proposal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(proposal.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/admin/proposals/${proposal.id}`}>
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
