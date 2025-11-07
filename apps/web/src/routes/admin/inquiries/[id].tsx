import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getInquiry,
  updateInquiry,
  updateInquiryStatus,
  convertInquiryToClient,
  sendInquiryEmail,
  deleteInquiry,
  type Inquiry,
} from '../../../lib/inquiries-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import {
  ArrowLeft,
  Mail,
  User,
  Phone,
  Building,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

const INQUIRY_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CONVERTED', 'REJECTED', 'ARCHIVED'];
const EMAIL_TEMPLATES = [
  { id: 'inquiry_confirmation', label: 'Inquiry Confirmation' },
  { id: 'status_update', label: 'Status Update' },
  { id: 'proposal_ready', label: 'Proposal Ready' },
  { id: 'follow_up', label: 'Follow-up' },
];

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');
  const [editingTags, setEditingTags] = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('inquiry_confirmation');
  const [customMessage, setCustomMessage] = useState('');
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInquiry = async () => {
    try {
      if (!id) return;
      const response = await getInquiry(id);
      setInquiry(response.data);
      setEditingNotes(response.data.internalNotes || '');
      setEditingTags(response.data.tags?.join(', ') || '');
      console.log('✅ Inquiry loaded');
    } catch (error) {
      console.error('❌ Failed to load inquiry:', error);
      alert('Failed to load inquiry. Redirecting...');
      navigate('/admin/inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiry();
  }, [id]);

  const handleSaveNotes = async () => {
    if (!inquiry) return;

    try {
      setSubmitting(true);
      const tags = editingTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const response = await updateInquiry(inquiry.id, {
        internalNotes: editingNotes,
        tags,
      });

      setInquiry(response.data);
      setEditing(false);
      console.log('✅ Notes updated');
    } catch (error) {
      console.error('❌ Failed to update inquiry:', error);
      alert('Failed to update inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!inquiry || !newStatus) return;

    try {
      setSubmitting(true);
      const response = await updateInquiryStatus(inquiry.id, newStatus);
      setInquiry(response.data);
      setStatusChangeModalOpen(false);
      setNewStatus('');
      console.log('✅ Status updated');
    } catch (error) {
      console.error('❌ Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!inquiry) return;

    try {
      setSubmitting(true);
      await sendInquiryEmail(inquiry.id, {
        templateName: selectedTemplate,
        customMessage: customMessage || undefined,
      });

      setEmailModalOpen(false);
      setCustomMessage('');
      setSelectedTemplate('inquiry_confirmation');
      console.log('✅ Email sent');
      alert('Email sent successfully!');
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvert = async () => {
    if (!inquiry) return;

    try {
      setSubmitting(true);
      const response = await convertInquiryToClient(inquiry.id, 'ACTIVE');
      setInquiry(response.inquiry);
      setConvertModalOpen(false);
      console.log('✅ Inquiry converted to client');
      alert(`Inquiry converted to client: ${response.client.name}`);
    } catch (error) {
      console.error('❌ Failed to convert inquiry:', error);
      alert('Failed to convert inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!inquiry) return;

    try {
      setSubmitting(true);
      await deleteInquiry(inquiry.id, true);
      console.log('✅ Inquiry archived');
      navigate('/admin/inquiries');
    } catch (error) {
      console.error('❌ Failed to archive inquiry:', error);
      alert('Failed to archive inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'CONTACTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'QUALIFIED':
        return 'bg-green-100 text-green-800';
      case 'PROPOSAL_SENT':
        return 'bg-purple-100 text-purple-800';
      case 'NEGOTIATING':
        return 'bg-orange-100 text-orange-800';
      case 'CONVERTED':
        return 'bg-emerald-100 text-emerald-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading inquiry...</div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Inquiry not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/inquiries')}
          className="p-2 hover:bg-gray-200 rounded-lg transition"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{inquiry.fullName}</h1>
          <p className="text-gray-600">{inquiry.email}</p>
        </div>
        <div className="ml-auto">
          <span className={`inline-block px-4 py-2 rounded-full font-medium ${getStatusBadgeColor(inquiry.status)}`}>
            {inquiry.status}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact & Inquiry Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Full Name</Label>
                <p className="text-gray-900 font-medium">{inquiry.fullName}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Email</Label>
                <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">
                  {inquiry.email}
                </a>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Phone</Label>
                <a href={`tel:${inquiry.phone}`} className="text-blue-600 hover:underline">
                  {inquiry.phone}
                </a>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Company</Label>
                <p className="text-gray-900 font-medium">{inquiry.company || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Inquiry Details */}
          <Card>
            <CardHeader>
              <CardTitle>Inquiry Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Type</Label>
                  <p className="text-gray-900 font-medium">{inquiry.inquiryType}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Shoot Date</Label>
                  <p className="text-gray-900 font-medium">
                    {inquiry.shootDate ? formatDate(inquiry.shootDate) : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Location</Label>
                  <p className="text-gray-900 font-medium">{inquiry.location || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Budget</Label>
                  <p className="text-gray-900 font-medium">
                    {inquiry.budgetMin || inquiry.budgetMax
                      ? `£${inquiry.budgetMin || 0} - £${inquiry.budgetMax || 'No limit'}`
                      : '-'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-600">Description</Label>
                <p className="text-gray-900 whitespace-pre-wrap">{inquiry.shootDescription}</p>
              </div>

              {inquiry.specialRequirements && (
                <div>
                  <Label className="text-sm text-gray-600">Special Requirements</Label>
                  <p className="text-gray-900 whitespace-pre-wrap">{inquiry.specialRequirements}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Internal Notes</CardTitle>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit2 size={18} />
                </button>
              )}
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-3">
                  <textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder="Add internal notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                  <div>
                    <Label className="text-sm text-gray-600 mb-2 block">Tags (comma-separated)</Label>
                    <input
                      type="text"
                      value={editingTags}
                      onChange={(e) => setEditingTags(e.target.value)}
                      placeholder="e.g., urgent, high-value, rush"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNotes} disabled={submitting}>
                      <Save size={18} className="mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {editingNotes || <span className="text-gray-400">No notes yet</span>}
                  </p>
                  {inquiry.tags && inquiry.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {inquiry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline & Actions */}
        <div className="flex flex-col gap-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-0.5 h-8 bg-gray-300"></div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Created</p>
                  <p className="text-sm text-gray-600">{formatDate(inquiry.createdAt)}</p>
                </div>
              </div>

              {inquiry.contactedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-0.5 h-8 bg-gray-300"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Contacted</p>
                    <p className="text-sm text-gray-600">{formatDate(inquiry.contactedAt)}</p>
                  </div>
                </div>
              )}

              {inquiry.qualifiedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="w-0.5 h-8 bg-gray-300"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Qualified</p>
                    <p className="text-sm text-gray-600">{formatDate(inquiry.qualifiedAt)}</p>
                  </div>
                </div>
              )}

              {inquiry.convertedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Converted</p>
                    <p className="text-sm text-gray-600">{formatDate(inquiry.convertedAt)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                onClick={() => setStatusChangeModalOpen(true)}
                className="w-full justify-start"
              >
                <Clock size={18} className="mr-2" />
                Change Status
              </Button>

              <Button
                variant="outline"
                onClick={() => setEmailModalOpen(true)}
                className="w-full justify-start"
              >
                <Mail size={18} className="mr-2" />
                Send Email
              </Button>

              {inquiry.status !== 'CONVERTED' && (
                <Button
                  variant="outline"
                  onClick={() => setConvertModalOpen(true)}
                  className="w-full justify-start"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Convert to Client
                </Button>
              )}

              {inquiry.client && (
                <Link
                  to={`/admin/clients/${inquiry.client.id}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <User size={18} className="inline mr-2" />
                  View Client
                </Link>
              )}

              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(true)}
                className="w-full justify-start text-red-600 hover:text-red-800"
              >
                <Trash2 size={18} className="mr-2" />
                Archive
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Change Modal */}
      <Modal
        open={statusChangeModalOpen}
        onOpenChange={setStatusChangeModalOpen}
        title="Change Status"
      >
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">New Status</Label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a status...</option>
              {INQUIRY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setStatusChangeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!newStatus || submitting}
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Email Modal */}
      <Modal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        title="Send Email"
      >
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Template</Label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EMAIL_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Custom Message (Optional)</Label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a custom message to the template..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setEmailModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={submitting}
            >
              Send Email
            </Button>
          </div>
        </div>
      </Modal>

      {/* Convert Modal */}
      <ConfirmDialog
        open={convertModalOpen}
        onOpenChange={setConvertModalOpen}
        title="Convert to Client"
        description="This will create a new client record from this inquiry. Are you sure?"
        onConfirm={handleConvert}
        confirmText="Convert"
        cancelText="Cancel"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Archive Inquiry"
        description="Are you sure you want to archive this inquiry?"
        onConfirm={handleDelete}
        confirmText="Archive"
        cancelText="Cancel"
      />
    </div>
  );
}
