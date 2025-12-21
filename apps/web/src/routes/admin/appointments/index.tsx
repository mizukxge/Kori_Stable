import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listAppointments, getAppointmentStats, type Appointment } from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Calendar, Plus, Search, Clock, CheckCircle2, XCircle, AlertCircle, Eye } from 'lucide-react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const loadAppointments = async () => {
    try {
      const response = await listAppointments({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        limit: 20,
        offset: (page - 1) * 20,
      });

      setAppointments(response.data);
      setPagination(response.pagination);
      console.log(`✅ Loaded ${response.data.length} appointments`);
    } catch (error) {
      console.error('❌ Failed to load appointments:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getAppointmentStats();
      setStats(response.data);
    } catch (error) {
      console.error('❌ Failed to load appointment stats:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadAppointments(), loadStats()]);
      setLoading(false);
    };
    load();
  }, [page, statusFilter, typeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Booked':
        return 'text-blue-600';
      case 'Completed':
        return 'text-green-600';
      case 'Cancelled':
        return 'text-gray-600';
      case 'NoShow':
        return 'text-red-600';
      case 'InviteSent':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'NoShow':
        return <XCircle className="h-4 w-4" />;
      case 'Booked':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage client appointment scheduling</p>
        </div>
        <Button asChild>
          <Link to="/admin/appointments/links" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Invitation
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Booked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.booked}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.completed > 0
                  ? ((stats.noShow / (stats.completed + stats.noShow)) * 100).toFixed(1)
                  : '0'}
                %
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search appointments..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border border-input bg-background"
        >
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="InviteSent">Invite Sent</option>
          <option value="Booked">Booked</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="NoShow">No-Show</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border border-input bg-background"
        >
          <option value="">All Types</option>
          <option value="Introduction">Introduction</option>
          <option value="CreativeDirection">Creative Direction</option>
          <option value="ContractInvoicing">Contract/Invoicing</option>
        </select>

        <Button asChild variant="outline">
          <Link to="/admin/appointments/settings">Settings</Link>
        </Button>
      </div>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>
            {pagination?.total || 0} total appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No appointments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Date & Time</th>
                    <th className="text-left py-3 px-4 font-medium">Client</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Outcome</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{formatDate(apt.scheduledAt)}</td>
                      <td className="py-3 px-4">{apt.client.name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-muted">
                          {apt.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`flex items-center gap-2 ${getStatusColor(apt.status)}`}>
                          {getStatusIcon(apt.status)}
                          <span>{apt.status}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {apt.outcome ? (
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-muted">
                            {apt.outcome}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/admin/appointments/${apt.id}`} className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total > 20 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(pagination.total / 20)}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(pagination.total / 20)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card className="cursor-pointer hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="text-lg">Calendar View</CardTitle>
            <CardDescription>Coming soon: Week calendar with availability</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="text-lg">Invite Links</CardTitle>
            <CardDescription>Create and manage booking invitations</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="text-lg">Reports</CardTitle>
            <CardDescription>Coming soon: Metrics and analytics</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
