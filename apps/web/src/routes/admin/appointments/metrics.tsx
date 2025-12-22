import React, { useEffect, useState } from 'react';
import { getAppointmentStats, listAppointments, exportAppointmentsCSV } from '../../lib/api';
import { ArrowUp, Download, Filter } from 'lucide-react';

interface MetricsData {
  totalAppointments: number;
  completedAppointments: number;
  bookedAppointments: number;
  noShowCount: number;
  noShowRate: string;
  cancelledAppointments: number;
  byType: Record<string, number>;
  byOutcome: Record<string, number>;
  upcomingAppointmentsCount: number;
  thisWeekCount: number;
  thisMonthCount: number;
  allTimeStats: {
    totalMinutes: number;
    averageMinutesPerCall: number;
  };
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    switch (dateRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case 'all':
        start.setFullYear(2000);
        break;
    }

    return { start, end };
  };

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError('');

      const range = getDateRange();
      const response = await getAppointmentStats({
        startDate: range.start.toISOString().split('T')[0],
        endDate: range.end.toISOString().split('T')[0],
      });

      if (response.success) {
        setMetrics(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const range = getDateRange();
      const blob = await exportAppointmentsCSV({
        startDate: range.start.toISOString().split('T')[0],
        endDate: range.end.toISOString().split('T')[0],
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointments-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading metrics...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || 'No data available'}
        </div>
      </div>
    );
  }

  // Calculate percentages for visualizations
  const completionRate = metrics.totalAppointments > 0
    ? Math.round((metrics.completedAppointments / metrics.totalAppointments) * 100)
    : 0;

  const typeColors: Record<string, string> = {
    Introduction: '#3b82f6',
    CreativeDirection: '#a855f7',
    ContractInvoicing: '#10b981',
  };

  const outcomeColors: Record<string, string> = {
    Positive: '#10b981',
    Neutral: '#f59e0b',
    Negative: '#ef4444',
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments Metrics</h1>
            <p className="text-gray-600 mt-1">Analytics and reporting for your appointment system</p>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <Download size={20} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
            {error}
          </div>
        )}

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h2 className="font-semibold text-gray-900">Date Range</h2>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : range === '90d' ? 'Last 90 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Appointments"
            value={metrics.totalAppointments}
            icon="📅"
          />
          <StatCard
            title="Completed"
            value={metrics.completedAppointments}
            icon="✅"
            subtext={`${completionRate}%`}
          />
          <StatCard
            title="No-Show Rate"
            value={metrics.noShowRate}
            icon="❌"
            subtext={`${metrics.noShowCount} appointments`}
          />
          <StatCard
            title="Upcoming (This Week)"
            value={metrics.thisWeekCount}
            icon="📍"
          />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Breakdown by Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Appointments by Type</h2>
            <div className="space-y-3">
              {Object.entries(metrics.byType).map(([type, count]) => (
                <div key={type}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{type}</span>
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${metrics.totalAppointments > 0 ? (count / metrics.totalAppointments) * 100 : 0}%`,
                        backgroundColor: typeColors[type] || '#6b7280',
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown by Outcome */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Outcomes (Completed Only)</h2>
            <div className="space-y-3">
              {Object.entries(metrics.byOutcome).map(([outcome, count]) => (
                <div key={outcome}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{outcome}</span>
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${metrics.completedAppointments > 0 ? (count / metrics.completedAppointments) * 100 : 0}%`,
                        backgroundColor: outcomeColors[outcome] || '#6b7280',
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics Box */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatBox
              label="Booked"
              value={metrics.bookedAppointments}
              color="bg-blue-100"
            />
            <StatBox
              label="Cancelled"
              value={metrics.cancelledAppointments}
              color="bg-red-100"
            />
            <StatBox
              label="Average Call Duration"
              value={`${metrics.allTimeStats.averageMinutesPerCall} min`}
              color="bg-green-100"
            />
            <StatBox
              label="Total Completed Minutes"
              value={metrics.allTimeStats.totalMinutes}
              color="bg-purple-100"
            />
            <StatBox
              label="This Month"
              value={metrics.thisMonthCount}
              color="bg-orange-100"
            />
            <StatBox
              label="Upcoming (Total)"
              value={metrics.upcomingAppointmentsCount}
              color="bg-indigo-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtext }: {
  title: string;
  value: number | string;
  icon: string;
  subtext?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className={`${color} rounded-lg p-4`}>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}
