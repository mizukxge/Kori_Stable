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
  RefreshCw,
  Download,
  ArrowRight,
  Loader,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { listContracts, resendContract, type Contract } from '../../lib/contracts-api';

interface DashboardStats {
  total: number;
  draft: number;
  sent: number;
  viewed: number;
  signed: number;
  declined: number;
  avgTimeToSign: number;
  signatureRate: number;
}

export function ContractsDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      const data = await listContracts();
      setContracts(data);
      calculateStats(data);
      setRecentContracts(data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function calculateStats(contractList: Contract[]) {
    const stats: DashboardStats = {
      total: contractList.length,
      draft: contractList.filter((c) => c.status === 'DRAFT').length,
      sent: contractList.filter((c) => c.status === 'SENT').length,
      viewed: contractList.filter((c) => c.status === 'VIEWED').length,
      signed: contractList.filter((c) => c.status === 'SIGNED').length,
      declined: contractList.filter((c) => c.status === 'VOIDED').length,
      avgTimeToSign: calculateAvgTimeToSign(contractList),
      signatureRate: calculateSignatureRate(contractList),
    };
    setStats(stats);
  }

  function calculateAvgTimeToSign(contractList: Contract[]): number {
    const signedContracts = contractList.filter((c) => c.status === 'SIGNED' && c.sentAt && c.signedAt);
    if (signedContracts.length === 0) return 0;

    const totalTime = signedContracts.reduce((sum, c) => {
      const sent = new Date(c.sentAt!).getTime();
      const signed = new Date(c.signedAt!).getTime();
      return sum + (signed - sent);
    }, 0);

    const avgMs = totalTime / signedContracts.length;
    return Math.round(avgMs / (1000 * 60 * 60 * 24)); // Convert to days
  }

  function calculateSignatureRate(contractList: Contract[]): number {
    const sentOrMore = contractList.filter((c) => c.status !== 'DRAFT').length;
    if (sentOrMore === 0) return 0;

    const signed = contractList.filter((c) => c.status === 'SIGNED').length;
    return Math.round((signed / sentOrMore) * 100);
  }

  async function handleResend(contractId: string) {
    try {
      setIsResending(contractId);
      await resendContract(contractId);
      alert('Contract resent successfully!');
      loadDashboardData();
    } catch (error: any) {
      alert(error.message || 'Failed to resend contract');
    } finally {
      setIsResending(null);
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
      case 'SIGNED':
        return 'bg-green-100 text-green-800';
      case 'VOIDED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-yellow-100 text-yellow-800';
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
      case 'SIGNED':
        return <CheckCircle className="w-4 h-4" />;
      case 'VOIDED':
        return <XCircle className="w-4 h-4" />;
      case 'EXPIRED':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contracts Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of all contracts and their status</p>
        </div>
        <Link to="/admin/contracts">
          <Button className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            View All Contracts
          </Button>
        </Link>
      </div>

      {/* Statistics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Contracts */}
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Contracts</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>

          {/* Draft */}
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Draft</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.draft}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>

          {/* Sent */}
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Sent</p>
                <p className="text-3xl font-bold text-primary mt-1">{stats.sent}</p>
              </div>
              <Send className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          {/* Viewed */}
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Viewed</p>
                <p className="text-3xl font-bold text-secondary mt-1">{stats.viewed}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          {/* Signed */}
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Signed</p>
                <p className="text-3xl font-bold text-success mt-1">{stats.signed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          {/* Declined */}
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Declined</p>
                <p className="text-3xl font-bold text-destructive mt-1">{stats.declined}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Signature Rate */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-semibold">Signature Rate</p>
                <p className="text-4xl font-bold text-success mt-2">{stats.signatureRate}%</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {stats.signed} of {stats.sent + stats.viewed + stats.signed} sent contracts signed
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-400" />
            </div>
          </div>

          {/* Avg Time to Sign */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-semibold">Avg Time to Sign</p>
                <p className="text-4xl font-bold text-primary mt-2">{stats.avgTimeToSign} days</p>
                <p className="text-sm text-muted-foreground mt-2">Average time from send to signature</p>
              </div>
              <Clock className="w-12 h-12 text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Contracts */}
      <div className="bg-card rounded-lg shadow">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Recent Contracts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Contract</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Created</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentContracts.length > 0 ? (
                recentContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-background transition">
                    <td className="px-6 py-4">
                      <Link to={`/admin/contracts/${contract.id}`} className="hover:underline">
                        <p className="font-medium text-primary">{contract.title}</p>
                        <p className="text-sm text-muted-foreground">{contract.contractNumber}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">{contract.client?.name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{contract.client?.email || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                        {getStatusIcon(contract.status)}
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(contract.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/contracts/${contract.id}`}>
                          <Button variant="secondary" size="sm" className="text-xs">
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                        {(contract.status === 'SENT' || contract.status === 'VIEWED') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleResend(contract.id)}
                            disabled={isResending === contract.id}
                            className="text-xs"
                          >
                            {isResending === contract.id ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-muted-foreground">No contracts yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {recentContracts.length > 0 && (
          <div className="px-6 py-4 border-t border-border">
            <Link to="/admin/contracts" className="inline-flex items-center gap-2 text-primary hover:text-primary font-medium text-sm">
              View All Contracts
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Status Distribution Chart (Text-based for simplicity) */}
      {stats && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Status Distribution</h2>
          <div className="space-y-3">
            {[
              { label: 'Draft', value: stats.draft, color: 'bg-gray-400', total: stats.total },
              { label: 'Sent', value: stats.sent, color: 'bg-blue-400', total: stats.total },
              { label: 'Viewed', value: stats.viewed, color: 'bg-purple-400', total: stats.total },
              { label: 'Signed', value: stats.signed, color: 'bg-green-400', total: stats.total },
              { label: 'Declined', value: stats.declined, color: 'bg-red-400', total: stats.total },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {item.value} ({Math.round((item.value / Math.max(item.total, 1)) * 100)}%)
                  </p>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color} transition-all`}
                    style={{ width: `${(item.value / Math.max(item.total, 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
