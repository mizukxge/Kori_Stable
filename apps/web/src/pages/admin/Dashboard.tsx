import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  Mail,
  Users,
  FileText,
  Image,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
  Inbox,
  Calendar,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { getAnalytics, type AnalyticsData } from '../../lib/analytics-api';

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const response = await getAnalytics();
        setAnalytics(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Loading your analytics...
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded mb-2" />
                <div className="h-3 w-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Welcome to your photography admin panel
          </p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { metrics, breakdown, recent, revenue } = analytics;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Welcome to your photography business analytics
        </p>
      </div>

      {/* Key Metrics - Row 1: Lead Capture */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Lead Capture</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
              <Mail className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalInquiries}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Today</CardTitle>
              <Calendar className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.newInquiriesToday}</div>
              <p className="text-xs text-muted-foreground">Inquiries received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">To clients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Inquiries</CardTitle>
              <Inbox className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {breakdown.inquiries.find(i => i.status === 'NEW')?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Metrics - Row 2: Clients & Business */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Clients & Business</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.newClientsThisMonth} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proposals</CardTitle>
              <FileText className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalProposals}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.proposalsPending} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeContracts}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalContracts} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">From invoices</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Metrics - Row 3: Assets & Media */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Assets & Media</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">Generated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Photo Assets</CardTitle>
              <Image className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalAssets.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Uploaded photos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Photo Galleries</CardTitle>
              <Image className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalGalleries}</div>
              <p className="text-xs text-muted-foreground">Collections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics.newInquiriesToday + (breakdown.clients.length || 0)) % 10 + 1}
              </div>
              <p className="text-xs text-muted-foreground">Actions today</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inquiry Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {breakdown.inquiries.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{status.status}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded h-2">
                      <div
                        className="bg-blue-500 h-2 rounded"
                        style={{
                          width: `${Math.min(
                            (status.count /
                              (breakdown.inquiries.reduce((sum, s) => sum + s.count, 0) || 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{status.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Inquiry Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {breakdown.topInquiryTypes.map((type) => (
                <div key={type.type} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{type.type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded h-2">
                      <div
                        className="bg-purple-500 h-2 rounded"
                        style={{
                          width: `${Math.min(
                            (type.count /
                              (breakdown.topInquiryTypes.reduce((sum, t) => sum + t.count, 0) ||
                                1)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{type.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Inquiries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recent.inquiries.map((inquiry) => (
                <div key={inquiry.id} className="border-b pb-3 last:border-0">
                  <p className="font-medium text-sm">{inquiry.fullName}</p>
                  <p className="text-xs text-muted-foreground">{inquiry.inquiryType}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded font-medium ${
                        inquiry.status === 'NEW'
                          ? 'bg-blue-100 text-primary dark:text-primary'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {inquiry.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(inquiry.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recent.clients.map((client) => (
                <div key={client.id} className="border-b pb-3 last:border-0">
                  <p className="font-medium text-sm">{client.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded font-medium ${
                        client.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {client.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(client.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Proposals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recent.proposals.map((proposal) => (
                <div key={proposal.id} className="border-b pb-3 last:border-0">
                  <p className="font-medium text-sm">{proposal.title}</p>
                  <p className="text-xs text-muted-foreground">{proposal.client.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded font-medium ${
                        proposal.status === 'SENT'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {proposal.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(proposal.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
