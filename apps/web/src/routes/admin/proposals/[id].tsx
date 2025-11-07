import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  Trash2,
  PoundSterling,
  Calendar,
  User,
  FileText,
  Share2,
  Copy,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { QRCodeModal } from '../../../components/QRCodeModal';
import {
  getProposalById,
  sendProposal,
  acceptProposal,
  declineProposal,
  deleteProposal,
  type Proposal,
} from '../../../lib/proposals-api';

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProposal();
  }, [id]);

  async function loadProposal() {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await getProposalById(id);
      setProposal(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load proposal:', err);
      setError(err instanceof Error ? err.message : 'Failed to load proposal');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend() {
    if (!proposal) return;
    try {
      setIsSubmitting(true);
      const updated = await sendProposal(proposal.id);
      setProposal(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send proposal');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAccept() {
    if (!proposal) return;
    try {
      setIsSubmitting(true);
      const updated = await acceptProposal(proposal.id);
      setProposal(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to accept proposal');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDecline() {
    if (!proposal) return;
    try {
      setIsSubmitting(true);
      await declineProposal(proposal.id, declineReason);
      setShowDeclineModal(false);
      await loadProposal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to decline proposal');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!proposal || !window.confirm('Are you sure you want to delete this proposal?')) return;
    try {
      setIsSubmitting(true);
      await deleteProposal(proposal.id);
      navigate('/admin/proposals');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete proposal');
      setIsSubmitting(false);
    }
  }

  function handleCopyLink() {
    if (!proposal) return;
    const url = `${window.location.origin}/client/proposal/${proposal.proposalNumber}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getProposalShareUrl() {
    if (!proposal) return '';
    return `${window.location.origin}/client/proposal/${proposal.proposalNumber}`;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-muted text-foreground';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
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
        return <FileText className="w-4 h-4" />;
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
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/admin/proposals')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Proposals
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error || 'Proposal not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/proposals')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{proposal.title}</h1>
            <p className="text-muted-foreground mt-1">{proposal.proposalNumber}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
          {getStatusIcon(proposal.status)}
          {proposal.status}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2">
          {/* Client Information */}
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Client Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Client Name</p>
                <p className="font-medium text-foreground">{proposal.client?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium text-foreground">{proposal.client?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Proposal Description */}
          {proposal.description && (
            <div className="bg-card rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Description</h2>
              <p className="text-foreground whitespace-pre-wrap">{proposal.description}</p>
            </div>
          )}

          {/* Line Items */}
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Line Items</h2>
            {proposal.items && proposal.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {proposal.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 text-sm text-foreground">{item.description}</td>
                        <td className="px-6 py-4 text-sm text-foreground text-right">{item.quantity}</td>
                        <td className="px-6 py-4 text-sm text-foreground text-right">
                          £{Number(item.unitPrice).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground text-right">
                          £{Number(item.amount || item.quantity * Number(item.unitPrice)).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No line items</p>
            )}
          </div>

          {/* Terms */}
          {proposal.terms && (
            <div className="bg-card rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Terms & Conditions</h2>
              <p className="text-foreground whitespace-pre-wrap">{proposal.terms}</p>
            </div>
          )}

          {/* Notes */}
          {proposal.notes && (
            <div className="bg-card rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Notes</h2>
              <p className="text-foreground whitespace-pre-wrap">{proposal.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Summary & Actions */}
        <div>
          {/* Financial Summary */}
          <div className="bg-card rounded-lg shadow p-6 mb-6 sticky top-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Summary</h2>

            <div className="space-y-4 mb-6 pb-6 border-b border-border">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">
                  £{Number(proposal.subtotal).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tax Rate</span>
                <span className="font-medium text-foreground">{Number(proposal.taxRate) * 100}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tax Amount</span>
                <span className="font-medium text-foreground">
                  £{Number(proposal.taxAmount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold text-blue-600">
                £{Number(proposal.total).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Validity Information */}
            {proposal.validUntil && (
              <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                <p className="text-sm text-blue-900">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Valid until: {new Date(proposal.validUntil).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Dates */}
            <div className="space-y-3 mb-6 pb-6 border-b border-border text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium text-foreground">
                  {new Date(proposal.createdAt).toLocaleDateString()} {new Date(proposal.createdAt).toLocaleTimeString()}
                </p>
              </div>
              {proposal.sentAt && (
                <div>
                  <p className="text-muted-foreground">Sent</p>
                  <p className="font-medium text-foreground">
                    {new Date(proposal.sentAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {proposal.viewedAt && (
                <div>
                  <p className="text-muted-foreground">Viewed</p>
                  <p className="font-medium text-foreground">
                    {new Date(proposal.viewedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {proposal.acceptedAt && (
                <div>
                  <p className="text-muted-foreground">Accepted</p>
                  <p className="font-medium text-foreground">
                    {new Date(proposal.acceptedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {proposal.declinedAt && (
                <div>
                  <p className="text-muted-foreground">Declined</p>
                  <p className="font-medium text-foreground">
                    {new Date(proposal.declinedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Created By */}
            {proposal.createdByUser && (
              <div className="mb-6 pb-6 border-b border-border">
                <p className="text-sm text-muted-foreground mb-2">Created By</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{proposal.createdByUser.name}</p>
                    <p className="text-sm text-muted-foreground">{proposal.createdByUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {proposal.status === 'DRAFT' && (
                <>
                  <Link to={`/admin/proposals/${proposal.id}/edit`} className="w-full block">
                    <Button variant="secondary" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button onClick={handleSend} disabled={isSubmitting} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send Proposal
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    variant="secondary"
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}

              {(proposal.status === 'SENT' || proposal.status === 'VIEWED') && (
                <>
                  <Button onClick={handleAccept} disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Proposal
                  </Button>
                  <Button
                    onClick={() => setShowDeclineModal(true)}
                    disabled={isSubmitting}
                    variant="secondary"
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </>
              )}

              {proposal.status === 'ACCEPTED' && proposal.contract && (
                <Link to={`/admin/contracts/${proposal.contract.id}`} className="w-full block">
                  <Button className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    View Contract
                  </Button>
                </Link>
              )}

              {proposal.pdfPath && (
                <Button variant="secondary" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              )}

              {/* Share Section */}
              {proposal.status !== 'DRAFT' && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <Button
                      onClick={handleCopyLink}
                      variant="secondary"
                      className="w-full"
                    >
                      {copied ? 'Copied!' : <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>}
                    </Button>
                  </div>
                  <Button
                    onClick={() => setShowQRModal(true)}
                    variant="secondary"
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Show QR Code
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        url={getProposalShareUrl()}
        title={`Proposal: ${proposal?.title || 'View Proposal'}`}
        description="Scan this QR code to view and respond to the proposal"
      />

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Decline Proposal</h3>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason for declining (optional)"
              className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring mb-4"
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeclineModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDecline}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
