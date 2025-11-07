import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Send,
  CheckCircle,
  Trash2,
  PoundSterling,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Share2,
  Copy,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { QRCodeModal } from '../../../components/QRCodeModal';
import {
  getInvoiceById,
  sendInvoice,
  markInvoicePaid,
  deleteInvoice,
  type Invoice,
} from '../../../lib/invoices-api';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  async function loadInvoice() {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await getInvoiceById(id);
      setInvoice(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoice');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend() {
    if (!invoice) return;
    try {
      setIsSubmitting(true);
      const updated = await sendInvoice(invoice.id);
      setInvoice(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invoice');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMarkPaid() {
    if (!invoice) return;
    try {
      setIsSubmitting(true);
      const updated = await markInvoicePaid(invoice.id);
      setInvoice(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark invoice as paid');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!invoice || !window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      setIsSubmitting(true);
      await deleteInvoice(invoice.id);
      navigate('/admin/invoices');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete invoice');
      setIsSubmitting(false);
    }
  }

  function handleCopyLink() {
    if (!invoice) return;
    const url = `${window.location.origin}/client/invoice/${invoice.invoiceNumber}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getInvoiceShareUrl() {
    if (!invoice) return '';
    return `${window.location.origin}/client/invoice/${invoice.invoiceNumber}`;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-muted text-foreground';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'OVERDUE':
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
      case 'PARTIAL':
        return <AlertCircle className="w-4 h-4" />;
      case 'PAID':
        return <CheckCircle className="w-4 h-4" />;
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/admin/invoices')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error || 'Invoice not found'}</p>
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
            onClick={() => navigate('/admin/invoices')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{invoice.title}</h1>
            <p className="text-muted-foreground mt-1">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
          {getStatusIcon(invoice.status)}
          {invoice.status}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2">
          {/* Client Information */}
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Bill To</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Client Name</p>
                <p className="font-medium text-foreground">{invoice.client?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium text-foreground">{invoice.client?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Invoice Description */}
          {invoice.description && (
            <div className="bg-card rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Description</h2>
              <p className="text-foreground whitespace-pre-wrap">{invoice.description}</p>
            </div>
          )}

          {/* Line Items */}
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Items</h2>
            {invoice.items && invoice.items.length > 0 ? (
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
                    {invoice.items.map((item) => (
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

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-card rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Notes</h2>
              <p className="text-foreground whitespace-pre-wrap">{invoice.notes}</p>
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
                  £{Number(invoice.subtotal).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tax Rate</span>
                <span className="font-medium text-foreground">{Number(invoice.taxRate)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tax Amount</span>
                <span className="font-medium text-foreground">
                  £{Number(invoice.taxAmount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold text-blue-600">
                £{Number(invoice.total).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Amount Due */}
            {invoice.status !== 'PAID' && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
                <p className="text-sm text-red-800 font-medium">Amount Due</p>
                <p className="text-2xl font-bold text-red-600">
                  £{Number(invoice.amountDue || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}

            {/* Dates */}
            <div className="space-y-3 mb-6 pb-6 border-b border-border text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium text-foreground">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {invoice.sentAt && (
                <div>
                  <p className="text-muted-foreground">Sent</p>
                  <p className="font-medium text-foreground">
                    {new Date(invoice.sentAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {invoice.paidAt && (
                <div>
                  <p className="text-muted-foreground">Paid</p>
                  <p className="font-medium text-foreground">
                    {new Date(invoice.paidAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Terms */}
            {invoice.paymentTerms && (
              <div className="mb-6 pb-6 border-b border-border">
                <p className="text-sm text-muted-foreground mb-2">Payment Terms</p>
                <p className="font-medium text-foreground">{invoice.paymentTerms}</p>
              </div>
            )}

            {/* Created By */}
            {invoice.createdByUser && (
              <div className="mb-6 pb-6 border-b border-border">
                <p className="text-sm text-muted-foreground mb-2">Created By</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{invoice.createdByUser.name}</p>
                    <p className="text-sm text-muted-foreground">{invoice.createdByUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {invoice.status === 'DRAFT' && (
                <>
                  <Button onClick={handleSend} disabled={isSubmitting} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send Invoice
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

              {(invoice.status === 'SENT' || invoice.status === 'PARTIAL' || invoice.status === 'OVERDUE') && (
                <Button
                  onClick={handleMarkPaid}
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Paid
                </Button>
              )}

              {invoice.pdfPath && (
                <Button variant="secondary" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              )}

              {/* Share Section */}
              {invoice.status !== 'DRAFT' && (
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
        url={getInvoiceShareUrl()}
        title={`Invoice: ${invoice?.title || 'View Invoice'}`}
        description="Scan this QR code to view and pay the invoice"
      />
    </div>
  );
}
