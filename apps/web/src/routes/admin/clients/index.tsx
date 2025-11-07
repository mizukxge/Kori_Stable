import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClients, getClientStats, deleteClient, createClient, type Client } from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Users, Plus, Search, Mail, Phone, Building2, Trash2, Eye, MoreHorizontal, Archive, UserCheck, UserX, Clock, X, MapPin, Check, Share2 } from 'lucide-react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Create client form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'ACTIVE',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    notes: '',
    tags: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadClients = async () => {
    try {
      const response = await getClients({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });

      setClients(response.data);
      setPagination(response.pagination);
      console.log(`✅ Loaded ${response.data.length} clients`);
    } catch (error) {
      console.error('❌ Failed to load clients:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getClientStats();
      setStats(response.data);
    } catch (error) {
      console.error('❌ Failed to load client stats:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadClients(), loadStats()]);
      setLoading(false);
    };
    load();
  }, [page, search, statusFilter, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!clientToDelete) return;

    try {
      await deleteClient(clientToDelete);
      console.log('✅ Client archived');
      setDeleteConfirmOpen(false);
      setClientToDelete(null);
      await loadClients();
      await loadStats();
    } catch (error) {
      console.error('❌ Failed to archive client:', error);
      alert('Failed to archive client. Please try again.');
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCreateClient = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        status: formData.status,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        zipCode: formData.zipCode.trim() || undefined,
        country: formData.country,
        notes: formData.notes.trim() || undefined,
        tags: formData.tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0),
      };

      await createClient(clientData);
      console.log('✅ Client created successfully');

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'ACTIVE',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
        notes: '',
        tags: '',
      });
      setFormErrors({});
      setCreateModalOpen(false);

      // Reload data
      await loadClients();
      await loadStats();
    } catch (error) {
      console.error('❌ Failed to create client:', error);
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          setFormErrors({ email: 'A client with this email already exists' });
        } else {
          alert(`Failed to create client: ${error.message}`);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setCreateModalOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'ACTIVE',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      notes: '',
      tags: '',
    });
    setFormErrors({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'INACTIVE':
        return 'bg-muted text-muted-foreground';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'ARCHIVED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <UserCheck className="w-4 h-4" />;
      case 'INACTIVE':
        return <UserX className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'ARCHIVED':
        return <Archive className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const handleCopyLink = () => {
    const signupUrl = `${window.location.origin}/new-client`;
    navigator.clipboard.writeText(signupUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Loading clients...</p>
      </div>
    );
  }

  return (
    <>
      {/* Create Client Modal - Rendered at top level to escape space-y-6 constraints */}
      {createModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-modal-backdrop"
            onClick={handleCloseModal}
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 flex flex-col items-center justify-start z-modal p-4 pt-12 overflow-y-auto scrollbar-thin pointer-events-none"
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl pointer-events-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Add New Client
                    </CardTitle>
                    <CardDescription>Create a new client record</CardDescription>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Basic Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                          formErrors.name ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="John & Jane Doe"
                      />
                      {formErrors.name && (
                        <p className="text-sm text-destructive">{formErrors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                          formErrors.email ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="client@email.com"
                      />
                      {formErrors.email && (
                        <p className="text-sm text-destructive">{formErrors.email}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    {/* Company */}
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <input
                        id="company"
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleFormChange('company', e.target.value)}
                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Company Name"
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => handleFormChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING">Pending</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Address Information</h3>
                  <div className="grid gap-4">
                    {/* Street Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <input
                        id="address"
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleFormChange('address', e.target.value)}
                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      {/* City */}
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <input
                          id="city"
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleFormChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="San Francisco"
                        />
                      </div>

                      {/* State */}
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <input
                          id="state"
                          type="text"
                          value={formData.state}
                          onChange={(e) => handleFormChange('state', e.target.value)}
                          className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="CA"
                        />
                      </div>

                      {/* ZIP Code */}
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <input
                          id="zipCode"
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => handleFormChange('zipCode', e.target.value)}
                          className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="94102"
                        />
                      </div>
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <select
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleFormChange('country', e.target.value)}
                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="AU">Australia</option>
                        <option value="NZ">New Zealand</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Additional Information</h3>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleFormChange('notes', e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                      placeholder="Any additional information about this client..."
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <input
                      id="tags"
                      type="text"
                      value={formData.tags}
                      onChange={(e) => handleFormChange('tags', e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="wedding, vip, 2025 (comma separated)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate tags with commas
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCloseModal}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateClient}
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Client'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </>
      )}

      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Clients</h1>
          <p className="mt-2 text-base sm:text-lg text-muted-foreground">
            Manage your client relationships
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>

          {/* Client Signup Link Button */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              title="Click to copy client signup link"
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Client Signup</span>
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
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All client records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.active}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archived</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.archived}</div>
              <p className="text-xs text-muted-foreground">Inactive/archived</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Name, email, company..."
                  className="w-full pl-10 pr-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label htmlFor="sortBy">Sort By</Label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="createdAt">Date Added</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="company">Company</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Order</Label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            {pagination ? `Showing ${clients.length} of ${pagination.total} clients` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <Users className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No Clients Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {search || statusFilter
                  ? 'Try adjusting your search or filters'
                  : "You haven't added any clients yet. Create your first client to get started."}
              </p>
              {!search && !statusFilter && (
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Client
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Client</th>
                    <th className="pb-3 font-medium">Contact</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Added</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4">
                        <div>
                          <div className="font-medium">{client.name}</div>
                          {client.company && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Building2 className="w-3 h-3" />
                              {client.company}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <div className="text-sm flex items-center gap-2">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="text-sm flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                          {getStatusIcon(client.status)}
                          {client.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/clients/${client.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => {
                              setClientToDelete(client.id);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Archive Client?"
        message="Are you sure you want to archive this client? They will be moved to archived status and can be restored later."
        confirmText="Archive"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setClientToDelete(null);
        }}
      />
      </div>
    </>
  );
}
