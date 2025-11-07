const API_BASE_URL = 'http://localhost:3002';

export interface AnalyticsMetrics {
  totalInquiries: number;
  newInquiriesToday: number;
  conversionRate: number;
  totalClients: number;
  newClientsThisMonth: number;
  totalProposals: number;
  proposalsPending: number;
  totalInvoices: number;
  totalRevenue: number;
  totalContracts: number;
  activeContracts: number;
  totalGalleries: number;
  totalAssets: number;
}

export interface StatusBreakdown {
  inquiries: { status: string; count: number }[];
  proposals: { status: string; count: number }[];
  clients: { status: string; count: number }[];
  contracts: { status: string; count: number }[];
  topInquiryTypes: { type: string; count: number }[];
}

export interface RecentActivity {
  inquiries: Array<{
    id: string;
    fullName: string;
    email: string;
    inquiryType: string;
    status: string;
    createdAt: string;
  }>;
  clients: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
  }>;
  proposals: Array<{
    id: string;
    title: string;
    status: string;
    client: { name: string };
    createdAt: string;
  }>;
}

export interface RevenueData {
  byMonth: Array<{
    date: string;
    total: number;
  }>;
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics;
  breakdown: StatusBreakdown;
  recent: RecentActivity;
  revenue: RevenueData;
}

/**
 * Get comprehensive site analytics
 */
export async function getAnalytics(): Promise<{
  success: boolean;
  data: AnalyticsData;
}> {
  const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to load analytics');
  }

  return response.json();
}
