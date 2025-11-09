/**
 * Public Signer Interface
 * Accessed via magic link token for signing envelopes
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getSignerEnvelope,
  markEnvelopeViewed,
  captureSignature,
  declineSignature,
} from '../../lib/envelopes-api';
import { SignatureCanvas } from '../../components/envelope/SignatureCanvas';
import { StatusBadge } from '../../components/envelope/StatusBadge';

export default function SigningPage() {
  const { token } = useParams<{ token: string }>();
  const [envelope, setEnvelope] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState('');
  const [initials, setInitials] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    if (!token) return;
    loadEnvelope();
  }, [token]);

  async function loadEnvelope() {
    try {
      setLoading(true);
      const data = await getSignerEnvelope(token!);
      setEnvelope(data);

      // Mark as viewed
      try {
        await markEnvelopeViewed(token!);
      } catch (err) {
        console.warn('Failed to mark as viewed:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load envelope');
    } finally {
      setLoading(false);
    }
  }

  async function handleSign() {
    if (!signature) {
      alert('Please draw your signature');
      return;
    }

    try {
      setSubmitting(true);
      await captureSignature(token!, {
        signatureDataUrl: signature,
        initialsDataUrl: initials,
        pageNumber: 1,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit signature');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    if (!declineReason.trim()) {
      alert('Please provide a reason');
      return;
    }

    try {
      setSubmitting(true);
      await declineSignature(token!, declineReason);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline signature');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading envelope...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="rounded-lg border border-red-200 bg-white p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Envelope</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            The signing link may be invalid or expired. Please check your email for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (!envelope) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No envelope data available</p>
      </div>
    );
  }

  const signer = envelope.envelope?.signers?.[0]; // Current signer

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="rounded-lg border border-green-200 bg-white p-8 max-w-md w-full text-center shadow-lg">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            {declineReason ? 'We received your response.' : 'Your signature has been submitted successfully.'}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {declineReason
              ? 'The envelope has been marked as declined.'
              : 'The next signer will be notified to review the document.'}
          </p>
          <p className="text-xs text-gray-400">You can close this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{envelope.envelope?.name}</h1>
              <p className="mt-2 text-gray-600">{envelope.envelope?.description}</p>
            </div>
            <StatusBadge status={envelope.envelope?.status} size="lg" />
          </div>

          {signer && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Signer:</span> {signer.name}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Role:</span> {signer.role || 'Signer'}
              </p>
            </div>
          )}
        </div>

        {/* Documents */}
        {envelope.envelope?.documents && envelope.envelope.documents.length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents to Sign</h2>
            <div className="space-y-2">
              {envelope.envelope.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-500">{doc.fileName}</p>
                  </div>
                  <a
                    href={doc.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature Pads */}
        {!showDeclineForm && (
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 mb-6 space-y-6">
            <SignatureCanvas
              placeholder="Your Signature"
              onSignatureChange={setSignature}
              width={640}
              height={200}
            />

            <div className="border-t border-gray-200 pt-6">
              <SignatureCanvas
                placeholder="Your Initials"
                onSignatureChange={setInitials}
                width={300}
                height={100}
              />
            </div>
          </div>
        )}

        {/* Decline Form */}
        {showDeclineForm && (
          <div className="rounded-lg bg-white p-6 shadow-sm border border-red-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reason for Declining</h2>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Please explain why you're unable to sign this envelope..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={4}
            />
            <p className="mt-2 text-sm text-gray-500">This reason will be recorded in the audit trail.</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6 text-red-800">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {!showDeclineForm ? (
            <>
              <button
                onClick={handleSign}
                disabled={submitting || !signature}
                className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '⏳ Submitting...' : '✅ Sign & Submit'}
              </button>
              <button
                onClick={() => setShowDeclineForm(true)}
                disabled={submitting}
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decline
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDecline}
                disabled={submitting || !declineReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '⏳ Submitting...' : '❌ Confirm Decline'}
              </button>
              <button
                onClick={() => {
                  setShowDeclineForm(false);
                  setDeclineReason('');
                }}
                disabled={submitting}
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Your signature is secure and will be cryptographically verified.
        </p>
      </div>
    </div>
  );
}
