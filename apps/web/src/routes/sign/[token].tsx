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
  downloadSignedDocuments,
  downloadFile,
} from '../../lib/envelopes-api';
import { SignatureCanvas } from '../../components/envelope/SignatureCanvas';
import { StatusBadge } from '../../components/envelope/StatusBadge';
import { PDFViewer } from '../../components/envelope/PDFViewer';

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
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadedDocs, setDownloadedDocs] = useState<any>(null);

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

  async function handleDownloadDocuments() {
    if (!token) return;

    try {
      setDownloading(true);
      const docs = await downloadSignedDocuments(token);
      setDownloadedDocs(docs);

      // Download each document
      for (const doc of docs.documents) {
        try {
          await downloadFile(doc.filePath, doc.fileName);
          // Add delay between downloads
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (err) {
          console.error(`Failed to download ${doc.fileName}:`, err);
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download documents');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading envelope...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unable to Load Envelope</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The signing link may be invalid or expired. Please check your email for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (!envelope) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">No envelope data available</p>
      </div>
    );
  }

  const signer = envelope.envelope?.signers?.[0]; // Current signer

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-blue-950 to-indigo-50 dark:to-indigo-950 flex items-center justify-center px-4">
        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-white dark:bg-gray-800 p-8 max-w-md w-full text-center shadow-lg">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {declineReason ? 'We received your response.' : 'Your signature has been submitted successfully.'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {declineReason
              ? 'The envelope has been marked as declined.'
              : 'The next signer will be notified to review the document.'}
          </p>

          {!declineReason && (
            <button
              onClick={handleDownloadDocuments}
              disabled={downloading}
              className="w-full mb-4 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {downloading ? '⬇️ Downloading...' : '⬇️ Download Documents'}
            </button>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500">You can close this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{envelope.envelope?.name}</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{envelope.envelope?.description}</p>
            </div>
            <StatusBadge status={envelope.envelope?.status} size="lg" />
          </div>

          {signer && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Signer:</span> {signer.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span className="font-medium">Role:</span> {signer.role || 'Signer'}
              </p>
            </div>
          )}
        </div>

        {/* Documents */}
        {envelope.envelope?.documents && envelope.envelope.documents.length > 0 && (
          <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
            {/* Document Tabs */}
            {envelope.envelope.documents.length > 1 && (
              <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex overflow-x-auto">
                  {envelope.envelope.documents.map((doc: any, index: number) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocumentIndex(index)}
                      className={`flex-1 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        selectedDocumentIndex === index
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                      }`}
                    >
                      📄 {doc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PDF Viewer */}
            <div className="p-4">
              {envelope.envelope.documents[selectedDocumentIndex] && (
                <>
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {envelope.envelope.documents[selectedDocumentIndex].name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {envelope.envelope.documents[selectedDocumentIndex].fileName}
                    </p>
                  </div>
                  <PDFViewer
                    filePath={envelope.envelope.documents[selectedDocumentIndex].filePath}
                    fileName={envelope.envelope.documents[selectedDocumentIndex].fileName}
                    height="500px"
                    showFileInfo={false}
                    showDownloadButton={true}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Signature Pads */}
        {!showDeclineForm && (
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 space-y-6">
            <SignatureCanvas
              placeholder="Your Signature"
              onSignatureChange={setSignature}
              width={640}
              height={200}
            />

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
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
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-red-200 dark:border-red-800 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reason for Declining</h2>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Please explain why you're unable to sign this envelope..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={4}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This reason will be recorded in the audit trail.</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 mb-6 text-red-800 dark:text-red-200">
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
                className="flex-1 rounded-lg bg-blue-600 dark:bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '⏳ Submitting...' : '✅ Sign & Submit'}
              </button>
              <button
                onClick={() => setShowDeclineForm(true)}
                disabled={submitting}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-3 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decline
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDecline}
                disabled={submitting || !declineReason.trim()}
                className="flex-1 rounded-lg bg-red-600 dark:bg-red-700 px-6 py-3 font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '⏳ Submitting...' : '❌ Confirm Decline'}
              </button>
              <button
                onClick={() => {
                  setShowDeclineForm(false);
                  setDeclineReason('');
                }}
                disabled={submitting}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-3 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Your signature is secure and will be cryptographically verified.
        </p>
      </div>
    </div>
  );
}
