import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getInquiries,
  getInquiryStats,
  deleteInquiry,
  updateInquiryStatus,
  type Inquiry,
  type InquiryStats,
} from '../../../lib/inquiries-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import {
  MessageCircle,
  Search,
  Mail,
  Trash2,
  Eye,
  Archive,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
} from 'lucide-react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

const INQUIRY_TYPES = ['WEDDING', 'PORTRAIT', 'COMMERCIAL', 'EVENT', 'FAMILY', 'PRODUCT', 'REAL_ESTATE', 'HEADSHOT', 'OTHER'];
const INQUIRY_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CONVERTED', 'REJECTED', 'ARCHIVED'];

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const loadInquiries = async () => {
    try {
      const response = await getInquiries({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        sortBy,
        sortOrder,
      });

      setInquiries(response.data);
      setPagination(response.pagination);
      console.log(`✅ Loaded ${response.data.length} inquiries`);
    } catch (error) {
      console.error('❌ Failed to load inquiries:', error);
      alert('Failed to load inquiries. Please try again.');
    }
  };

  const loadStats = async () => {
    try {
      const response = await getInquiryStats();
      setStats(response.data);
    } catch (error) {
      console.error('❌ Failed to load inquiry stats:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadInquiries(), loadStats()]);
      setLoading(false);
    };
    load();
  }, [page, search, statusFilter, typeFilter, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!inquiryToDelete) return;

    try {
      await deleteInquiry(inquiryToDelete, true);
      console.log('✅ Inquiry archived');
      setDeleteConfirmOpen(false);
      setInquiryToDelete(null);
      await loadInquiries();
      await loadStats();
    } catch (error) {
      console.error('❌ Failed to archive inquiry:', error);
      alert('Failed to archive inquiry. Please try again.');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary';
      case 'CONTACTED':
        return 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning';
      case 'QUALIFIED':
        return 'bg-success/10 text-success dark:bg-success/20 dark:text-success';
      case 'PROPOSAL_SENT':
        return 'bg-secondary/10 text-secondary dark:bg-secondary/20 dark:text-secondary';
      case 'NEGOTIATING':
        return 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning';
      case 'CONVERTED':
        return 'bg-success/10 text-success dark:bg-success/20 dark:text-success';
      case 'REJECTED':
        return 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive';
      case 'ARCHIVED':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (!min && !max) return '-';
    if (min && max) return `£${min} - £${max}`;
    if (min) return `£${min}+`;
    return `up to £${max}`;
  };

  const handleCopyLink = () => {
    const inquiryUrl = `${window.location.origin}/inquiry`;
    navigator.clipboard.writeText(inquiryUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inquiries</h1>
          <p className="text-muted-foreground">Manage customer inquiries and track conversions</p>
        </div>
        {/* Inquiry Form Link Button */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            title="Click to copy inquiry form link"
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Inquiry Form</span>
            <span className="sm:hidden">Share Link</span>
            {linkCopied && <Check className="w-4 h-4 ml-1" />}
          </Button>
          {linkCopied && (
            <div className="absolute -bottom-8 right-0 bg-green-600 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none">
              Link copied!
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalThisPeriod}</div>
              <p className="text-xs text-muted-foreground">Total inquiries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.newToday}</div>
              <p className="text-xs text-muted-foreground">New inquiries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">Converted to clients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.avgResponseTimeHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">Average first contact</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="ml-4"
            >
              <Filter size={20} />
              Filters
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="border-t border-border pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Status</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Statuses</option>
                  {INQUIRY_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Type</Label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Types</option>
                  {INQUIRY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Sort By</Label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="fullName">Name</option>
                  <option value="status">Status</option>
                  <option value="budgetMin">Budget</option>
                </select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Inquiries Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Inquiries
            {pagination && <span className="text-sm font-normal text-muted-foreground"> ({pagination.total} total)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading inquiries...</div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No inquiries found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Budget</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(inquiry.createdAt)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{inquiry.fullName}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{inquiry.email}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{inquiry.inquiryType}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(inquiry.status)}`}>
                          {inquiry.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{formatBudget(inquiry.budgetMin, inquiry.budgetMax)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link
                            to={`/admin/inquiries/${inquiry.id}`}
                            className="text-primary hover:text-primary dark:text-primary"
                            title="View details"
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => {
                              setInquiryToDelete(inquiry.id);
                              setDeleteConfirmOpen(true);
                            }}
                            className="text-destructive hover:text-red-800"
                            title="Archive"
                          >
                            <Archive size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={18} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Archive Inquiry"
        description="Are you sure you want to archive this inquiry? You can still access it later."
        onConfirm={handleDelete}
        confirmText="Archive"
        cancelText="Cancel"
      />
    </div>
  );
}
