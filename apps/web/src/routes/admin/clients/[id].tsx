import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getClient, updateClient, updateClientStatus, type Client } from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { ClientDocuments } from '../../../components/ClientDocuments';
import { ClientNotesPanel } from '../../../components/ClientNotesPanel';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Edit,
  ArrowLeft,
  FileText,
  ImageIcon,
  Receipt,
  FileSignature,
  MessageSquare,
  Clock,
  Tag,
  X,
  Save,
  CheckCircle2,
} from 'lucide-react';

type TabType = 'overview' | 'galleries' | 'proposals' | 'contracts' | 'invoices';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState({
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

  const loadClient = async () => {
    if (!id) return;

    try {
      const response = await getClient(id);
      setClient(response.data);

      // Populate edit form
      setEditData({
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone || '',
        company: response.data.company || '',
        status: response.data.status,
        address: response.data.address || '',
        city: response.data.city || '',
        state: response.data.state || '',
        zipCode: response.data.zipCode || '',
        country: response.data.country || 'US',
        notes: response.data.notes || '',
        tags: response.data.tags?.join(', ') || '',
      });

      console.log('✅ Loaded client:', response.data.name);
    } catch (error) {
      console.error('❌ Failed to load client:', error);
      alert('Failed to load client. Redirecting to client list.');
      navigate('/admin/clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
  }, [id]);

  const handleSaveEdit = async () => {
    if (!id) return;

    setSaving(true);
    try {
      await updateClient(id, {
        name: editData.name,
        email: editData.email,
        phone: editData.phone || undefined,
        company: editData.company || undefined,
        status: editData.status,
        address: editData.address || undefined,
        city: editData.city || undefined,
        state: editData.state || undefined,
        zipCode: editData.zipCode || undefined,
        country: editData.country,
        notes: editData.notes || undefined,
        tags: editData.tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0),
      });

      console.log('✅ Client updated');
      setEditMode(false);
      await loadClient();
    } catch (error) {
      console.error('❌ Failed to update client:', error);
      alert('Failed to update client. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!client) return;

    setEditData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      company: client.company || '',
      status: client.status,
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      zipCode: client.zipCode || '',
      country: client.country || 'US',
      notes: client.notes || '',
      tags: client.tags?.join(', ') || '',
    });
    setEditMode(false);
  };

  const handleApproveClient = async () => {
    if (!id || client?.status !== 'PENDING') return;

    setApproving(true);
    try {
      await updateClientStatus(id, 'ACTIVE');
      console.log('✅ Client approved');
      await loadClient();
    } catch (error) {
      console.error('❌ Failed to approve client:', error);
      alert('Failed to approve client. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'ARCHIVED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Loading client...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Client not found</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'galleries', label: 'Galleries', icon: ImageIcon },
    { id: 'proposals', label: 'Proposals', icon: FileText },
    { id: 'contracts', label: 'Contracts', icon: FileSignature },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/clients')}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{client.name}</h1>
              <p className="mt-1 text-base sm:text-lg text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {client.email}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status)}`}>
            {client.status}
          </span>
          {!editMode && (
            <>
              {client.status === 'PENDING' && (
                <Button onClick={handleApproveClient} disabled={approving} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {approving ? 'Approving...' : 'Approve Client'}
                </Button>
              )}
              <Button onClick={() => setEditMode(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Client
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Client Information */}
          <div className="lg:col-span-2 space-y-6">
            {editMode ? (
              /* Edit Mode */
              <Card>
                <CardHeader>
                  <CardTitle>Edit Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Basic Information</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <input
                          id="edit-name"
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <input
                          id="edit-email"
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone</Label>
                        <input
                          id="edit-phone"
                          type="tel"
                          value={editData.phone}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-company">Company</Label>
                        <input
                          id="edit-company"
                          type="text"
                          value={editData.company}
                          onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-status">Status</Label>
                        <select
                          id="edit-status"
                          value={editData.status}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="PENDING">Pending</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Address</h3>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-address">Street Address</Label>
                        <input
                          id="edit-address"
                          type="text"
                          value={editData.address}
                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="edit-city">City</Label>
                          <input
                            id="edit-city"
                            type="text"
                            value={editData.city}
                            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-state">State</Label>
                          <input
                            id="edit-state"
                            type="text"
                            value={editData.state}
                            onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-zipCode">ZIP Code</Label>
                          <input
                            id="edit-zipCode"
                            type="text"
                            value={editData.zipCode}
                            onChange={(e) => setEditData({ ...editData, zipCode: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Tags */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-notes">Notes</Label>
                      <textarea
                        id="edit-notes"
                        value={editData.notes}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-tags">Tags</Label>
                      <input
                        id="edit-tags"
                        type="text"
                        value={editData.tags}
                        onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Comma separated"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* View Mode */
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{client.email}</p>
                        </div>
                      </div>
                      {client.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-medium">{client.phone}</p>
                          </div>
                        </div>
                      )}
                      {client.company && (
                        <div className="flex items-start gap-3">
                          <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Company</p>
                            <p className="font-medium">{client.company}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {(client.address || client.city || client.state) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          {client.address && <p>{client.address}</p>}
                          <p>
                            {[client.city, client.state, client.zipCode]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                          {client.country && <p>{client.country}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

              </>
            )}
          </div>

          {/* Right Column - Stats & Tags */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Galleries</span>
                  <span className="text-2xl font-bold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Proposals</span>
                  <span className="text-2xl font-bold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Contracts</span>
                  <span className="text-2xl font-bold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Invoices</span>
                  <span className="text-2xl font-bold">0</span>
                </div>
              </CardContent>
            </Card>

            <ClientNotesPanel
              notes={client.notes || null}
              tags={client.tags || []}
              onSave={async (notes, tags) => {
                if (!id) return;
                await updateClient(id, {
                  name: client.name,
                  email: client.email,
                  notes: notes || undefined,
                  tags,
                });
                await loadClient();
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle>Client Since</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(client.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              </CardContent>
            </Card>

            {(client.source || client.preferredContactMethod) && (
              <Card>
                <CardHeader>
                  <CardTitle>Source & Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {client.source && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">How They Found Us</p>
                      <p className="font-medium capitalize">{client.source}</p>
                    </div>
                  )}
                  {client.preferredContactMethod && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Preferred Contact Method</p>
                      <p className="font-medium capitalize">{client.preferredContactMethod}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'galleries' && (
        <Card>
          <CardHeader>
            <CardTitle>Galleries</CardTitle>
            <CardDescription>Photo galleries for this client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Galleries Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create a gallery and associate it with this client
              </p>
              <Button asChild>
                <Link to="/admin/galleries">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Go to Galleries
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'proposals' && client && <ClientDocuments clientId={client.id} />}

      {activeTab === 'contracts' && client && <ClientDocuments clientId={client.id} />}

      {activeTab === 'invoices' && client && <ClientDocuments clientId={client.id} />}
    </div>
  );
}
