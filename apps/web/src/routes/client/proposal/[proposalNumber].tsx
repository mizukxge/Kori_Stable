import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, XCircle, Send, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  getProposal,
  requestProposalOTP,
  acceptProposal,
  declineProposal,
  type PublicProposal,
} from '../../../lib/public-views-api';

export default function ClientProposalPage() {
  const { proposalNumber } = useParams<{ proposalNumber: string }>();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState<PublicProposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // OTP and action states
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<'accept' | 'decline' | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    loadProposal();
  }, [proposalNumber]);

  async function loadProposal() {
    if (!proposalNumber) return;
    try {
      setIsLoading(true);
      const data = await getProposal(proposalNumber);
      setProposal(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load proposal:', err);
      setError(err instanceof Error ? err.message : 'Failed to load proposal');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRequestOTP() {
    if (!proposal) return;
    try {
      setIsSubmitting(true);
      await requestProposalOTP(proposal.proposalNumber);
      setShowOTPInput(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to request OTP');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAccept() {
    if (!proposal || !otpCode) return;
    try {
      setIsSubmitting(true);
      const result = await acceptProposal(proposal.proposalNumber, otpCode);
      alert('Proposal accepted! We will contact you shortly.');
      setProposal({
        ...proposal,
        status: 'ACCEPTED',
        acceptedAt: result.acceptedAt,
      });
      setShowOTPInput(false);
      setOtpCode('');
      setAction(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to accept proposal');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDecline() {
    if (!proposal) return;
    if (action === 'decline' && !declineReason) {
      alert('Please provide a reason for declining');
      return;
    }

    try {
      setIsSubmitting(true);
      await declineProposal(proposal.proposalNumber, declineReason);
      alert('Proposal declined. Thank you for your time.');
      setProposal({
        ...proposal,
        status: 'DECLINED',
        declinedAt: new Date().toISOString(),
      });
      setAction(null);
      setDeclineReason('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to decline proposal');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
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
            <p className="text-red-800 text-lg">{error || 'Proposal not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = new Date(proposal.expiresAt) < new Date();
  const isProcessed = proposal.status === 'ACCEPTED' || proposal.status === 'DECLINED';

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
              <h1 className="text-3xl font-bold text-foreground">{proposal.title}</h1>
              <p className="text-muted-foreground mt-1">Proposal {proposal.proposalNumber}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${
              isExpired
                ? 'bg-red-100 text-red-800'
                : proposal.status === 'ACCEPTED'
                ? 'bg-green-100 text-green-800'
                : proposal.status === 'DECLINED'
                ? 'bg-muted text-foreground'
                : proposal.status === 'SENT'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-muted text-foreground'
            }`}
          >
            {isExpired ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Expired
              </>
            ) : proposal.status === 'ACCEPTED' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Accepted
              </>
            ) : proposal.status === 'DECLINED' ? (
              <>
                <XCircle className="w-4 h-4" />
                Declined
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {proposal.status}
              </>
            )}
          </span>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Client Information */}
            <div className="bg-card rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">From</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Contact Name</p>
                  <p className="font-medium text-foreground">{proposal.client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium text-foreground">{proposal.client.email}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {proposal.description && (
              <div className="bg-card rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Description</h2>
                <p className="text-foreground whitespace-pre-wrap">{proposal.description}</p>
              </div>
            )}

            {/* Line Items */}
            <div className="bg-card rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Items</h2>
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
                    {proposal.items.map((item, index) => (
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
            </div>

            {/* Terms */}
            {proposal.terms && (
              <div className="bg-card rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Terms & Conditions</h2>
                <p className="text-foreground whitespace-pre-wrap text-sm">{proposal.terms}</p>
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
                  <span className="text-muted-foreground">Tax ({Number(proposal.taxRate)}%)</span>
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

              {/* Expiration Notice */}
              {isExpired && (
                <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
                  <p className="text-sm text-red-800 font-medium">This proposal has expired</p>
                  <p className="text-xs text-red-700 mt-1">
                    Expired on {new Date(proposal.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Valid Until */}
              {!isExpired && !isProcessed && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                  <p className="text-sm text-blue-800 font-medium">Valid Until</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {new Date(proposal.expiresAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {/* Actions */}
              {!isExpired && !isProcessed && (
                <div className="space-y-2">
                  {!showOTPInput ? (
                    <>
                      <Button
                        onClick={() => {
                          setAction('accept');
                          handleRequestOTP();
                        }}
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Proposal
                      </Button>
                      <Button
                        onClick={() => setAction('decline')}
                        disabled={isSubmitting}
                        variant="secondary"
                        className="w-full"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline Proposal
                      </Button>
                    </>
                  ) : action === 'accept' ? (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-900 font-medium mb-3">Enter verification code sent to your email</p>
                        <Input
                          type="text"
                          placeholder="Enter OTP code"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="mb-3"
                        />
                        <Button
                          onClick={handleAccept}
                          disabled={isSubmitting || !otpCode}
                          className="w-full"
                        >
                          Verify & Accept
                        </Button>
                        <button
                          onClick={() => {
                            setShowOTPInput(false);
                            setOtpCode('');
                            setAction(null);
                          }}
                          className="w-full mt-2 px-4 py-2 text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {action === 'decline' && (
                <div className="space-y-2">
                  <textarea
                    placeholder="Tell us why you're declining (optional)"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={handleDecline}
                    disabled={isSubmitting}
                    variant="secondary"
                    className="w-full"
                  >
                    Confirm Decline
                  </Button>
                  <button
                    onClick={() => {
                      setAction(null);
                      setDeclineReason('');
                    }}
                    className="w-full px-4 py-2 text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
