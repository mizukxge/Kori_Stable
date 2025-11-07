import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Plus,
  PoundSterling,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  listProposals,
  getProposalStats,
  type Proposal,
  type ProposalStats,
} from '../../lib/proposals-api';

export function ProposalsDashboard() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<ProposalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [proposalsData, statsData] = await Promise.all([
        listProposals(),
        getProposalStats(),
      ]);
      setProposals(proposalsData.slice(0, 5)); // Recent 5
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load proposals dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }

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
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

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

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading proposals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proposals</h1>
          <p className="text-muted-foreground mt-1">Overview of your proposal pipeline</p>
        </div>
        <Link to="/admin/proposals/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Proposal
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.draft}</p>
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

      {/* Status Distribution */}
      {stats && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Status Distribution</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Draft</span>
                <span className="text-sm text-muted-foreground">{stats.draft}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-gray-400 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.draft / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Sent</span>
                <span className="text-sm text-muted-foreground">{stats.sent}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.sent / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Viewed</span>
                <span className="text-sm text-muted-foreground">{stats.viewed}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-purple-400 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.viewed / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Accepted</span>
                <span className="text-sm text-muted-foreground">{stats.accepted}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-400 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.accepted / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Declined</span>
                <span className="text-sm text-muted-foreground">{stats.declined}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-red-400 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.declined / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Proposals */}
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Recent Proposals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
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
              {proposals.length > 0 ? (
                proposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-background">
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
                      <p className="text-sm text-foreground">{proposal.client?.name || 'N/A'}</p>
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
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}
                      >
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
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No proposals yet</h3>
                    <p className="text-muted-foreground mb-6">Get started by creating your first proposal</p>
                    <Link to="/admin/proposals/new">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Proposal
                      </Button>
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {proposals.length > 0 && (
          <div className="p-4 border-t border-border text-center">
            <Link to="/admin/proposals" className="text-primary hover:text-primary font-medium">
              View All Proposals
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
