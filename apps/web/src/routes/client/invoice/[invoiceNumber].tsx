import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, AlertCircle, PoundSterling } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  getInvoice,
  requestInvoiceOTP,
  verifyInvoicePayment,
  type PublicInvoice,
} from '../../../lib/public-views-api';

export default function ClientInvoicePage() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // OTP and payment states
  const [email, setEmail] = useState('');
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');

  useEffect(() => {
    loadInvoice();
  }, [invoiceNumber]);

  async function loadInvoice() {
    if (!invoiceNumber) return;
    try {
      setIsLoading(true);
      const data = await getInvoice(invoiceNumber);
      setInvoice(data);
      setEmail(data.client.email);
      setError(null);
    } catch (err) {
      console.error('Failed to load invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoice');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRequestOTP() {
    if (!invoice || !email) return;
    try {
      setIsSubmitting(true);
      await requestInvoiceOTP(invoice.invoiceNumber, email);
      setShowOTPInput(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to request OTP');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyPayment() {
    if (!invoice || !otpCode) return;
    try {
      setIsSubmitting(true);
      const result = await verifyInvoicePayment(invoice.invoiceNumber, otpCode, paymentMethod);
      alert('Payment confirmed! Thank you for your payment.');
      setInvoice({
        ...invoice,
        status: result.status,
        paidAt: result.paidAt,
      });
      setShowOTPInput(false);
      setOtpCode('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to verify payment');
    } finally {
      setIsSubmitting(false);
    }
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

  const isOverdue =
    invoice && invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID';
  const isPaid = invoice && invoice.status === 'PAID';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-background p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </button>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 text-lg">{error || 'Invoice not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{invoice.title}</h1>
              <p className="text-muted-foreground mt-1">Invoice {invoice.invoiceNumber}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
            {isPaid ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Paid
              </>
            ) : isOverdue ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Overdue
              </>
            ) : (
              <>
                <PoundSterling className="w-4 h-4" />
                {invoice.status}
              </>
            )}
          </span>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Bill To */}
            <div className="bg-card rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Bill To</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Client Name</p>
                  <p className="font-medium text-foreground">{invoice.client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium text-foreground">{invoice.client.email}</p>
                </div>
              </div>
            </div>

            {/* Description */}
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
                      {invoice.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 text-sm text-foreground">{item.description}</td>
                          <td className="px-6 py-4 text-sm text-foreground text-right">{item.quantity}</td>
                          <td className="px-6 py-4 text-sm text-foreground text-right">
                            £{Number(item.unitPrice).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground text-right">
                            £{Number(item.amount).toLocaleString('en-US', {
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
                <span className="text-lg font-semibold text-foreground">Total Due</span>
                <span className="text-2xl font-bold text-blue-600">
                  £{Number(invoice.total).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Dates */}
              <div className="space-y-3 mb-6 pb-6 border-b border-border text-sm">
                <div>
                  <p className="text-muted-foreground">Sent</p>
                  <p className="font-medium text-foreground">
                    {new Date(invoice.sentAt).toLocaleDateString()}
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
                {isPaid && invoice.paidAt && (
                  <div>
                    <p className="text-muted-foreground">Paid On</p>
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

              {/* Alerts */}
              {isOverdue && (
                <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
                  <p className="text-sm text-red-800 font-medium">This invoice is overdue</p>
                  <p className="text-xs text-red-700 mt-1">
                    Due date was {new Date(invoice.dueDate!).toLocaleDateString()}
                  </p>
                </div>
              )}

              {isPaid && (
                <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
                  <p className="text-sm text-green-800 font-medium">Payment confirmed</p>
                  <p className="text-xs text-green-700 mt-1">Thank you for your payment</p>
                </div>
              )}

              {/* Payment Actions */}
              {!isPaid && (
                <div className="space-y-2">
                  {!showOTPInput ? (
                    <>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Payment Method
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ONLINE">Online Payment</option>
                          <option value="BANK_TRANSFER">Bank Transfer</option>
                          <option value="CHECK">Check</option>
                          <option value="CASH">Cash</option>
                        </select>
                      </div>
                      <Button
                        onClick={handleRequestOTP}
                        disabled={isSubmitting || !email}
                        className="w-full"
                      >
                        <PoundSterling className="w-4 h-4 mr-2" />
                        Mark as Paid
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-900 font-medium mb-3">
                          Enter verification code sent to your email
                        </p>
                        <Input
                          type="text"
                          placeholder="Enter OTP code"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="mb-3"
                        />
                        <Button
                          onClick={handleVerifyPayment}
                          disabled={isSubmitting || !otpCode}
                          className="w-full"
                        >
                          Confirm Payment
                        </Button>
                        <button
                          onClick={() => {
                            setShowOTPInput(false);
                            setOtpCode('');
                          }}
                          className="w-full mt-2 px-4 py-2 text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
