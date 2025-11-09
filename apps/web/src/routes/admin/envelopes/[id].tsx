/**
 * Envelope Editor
 * View and manage individual envelope
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getEnvelopeById,
  sendEnvelope,
  addSigner,
  removeSigner,
  updateEnvelope,
} from '../../../lib/envelopes-api';
import { StatusBadge } from '../../../components/envelope/StatusBadge';
import { SignerCard } from '../../../components/envelope/SignerCard';
import { AuditTrail } from '../../../components/envelope/AuditTrail';

export default function EnvelopeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [envelope, setEnvelope] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'signers' | 'documents' | 'audit'>('overview');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [showAddSigner, setShowAddSigner] = useState(false);
  const [newSigner, setNewSigner] = useState({
    name: '',
    email: '',
    role: '',
    sequenceNumber: 1,
  });

  useEffect(() => {
    if (id) loadEnvelope();
  }, [id]);

  async function loadEnvelope() {
    try {
      setLoading(true);
      const data = await getEnvelopeById(id!);
      setEnvelope(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load envelope');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!envelope) return;
    if (envelope.signers?.length === 0) {
      alert('Please add at least one signer');
      return;
    }
    if (envelope.documents?.length === 0) {
      alert('Please add at least one document');
      return;
    }

    try {
      setSubmitting(true);
      await sendEnvelope(id!);
      await loadEnvelope();
      alert('Envelope sent successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send envelope');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddSigner() {
    try {
      setSubmitting(true);
      await addSigner(id!, newSigner);
      setNewSigner({ name: '', email: '', role: '', sequenceNumber: 1 });
      setShowAddSigner(false);
      await loadEnvelope();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add signer');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveSigner(signerId: string) {
    if (!confirm('Remove this signer?')) return;

    try {
      setSubmitting(true);
      await removeSigner(id!, signerId);
      await loadEnvelope();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove signer');
    } finally {
      setSubmitting(false);
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

  if (error || !envelope) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 p-8 text-center">
          <p className="text-red-800 dark:text-red-200 font-medium">{error || 'Envelope not found'}</p>
          <button
            onClick={() => navigate('/admin/envelopes')}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            ← Back to envelopes
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'signers', label: `Signers (${envelope.signers?.length || 0})` },
    { id: 'documents', label: `Documents (${envelope.documents?.length || 0})` },
    { id: 'audit', label: 'Audit Trail' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/admin/envelopes')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium mb-2"
          >
            ← Back to envelopes
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{envelope.name}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{envelope.description}</p>
        </div>
        <StatusBadge status={envelope.status} size="lg" />
      </div>

      {/* Actions */}
      {envelope.status === 'DRAFT' && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">Ready to send?</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {envelope.signers?.length || 0} signers • {envelope.documents?.length || 0} documents
            </p>
          </div>
          <button
            onClick={handleSend}
            disabled={submitting}
            className="rounded-lg bg-blue-600 dark:bg-blue-700 px-6 py-2 font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? '⏳ Sending...' : '📤 Send Envelope'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 font-medium text-sm border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">{envelope.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Workflow</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {envelope.signingWorkflow === 'SEQUENTIAL' ? '📋 Sequential (A→B→C)' : '🎯 Parallel'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">{new Date(envelope.createdAt).toLocaleString()}</p>
            </div>
            {envelope.sentAt && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sent</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{new Date(envelope.sentAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signers Tab */}
      {activeTab === 'signers' && (
        <div className="space-y-4">
          {envelope.signers && envelope.signers.length > 0 && (
            <div className="space-y-3">
              {envelope.signers.map((signer: any) => (
                <SignerCard
                  key={signer.id}
                  name={signer.name}
                  email={signer.email}
                  role={signer.role}
                  status={signer.status}
                  sequenceNumber={signer.sequenceNumber}
                  signedAt={signer.signedAt}
                  viewedAt={signer.viewedAt}
                  declinedAt={signer.declinedAt}
                  declinedReason={signer.declinedReason}
                  onRemove={
                    envelope.status === 'DRAFT' ? () => handleRemoveSigner(signer.id) : undefined
                  }
                />
              ))}
            </div>
          )}

          {envelope.status === 'DRAFT' && (
            <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
              {!showAddSigner ? (
                <button
                  onClick={() => setShowAddSigner(true)}
                  className="w-full py-2 px-4 text-center font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  + Add Signer
                </button>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Signer Name"
                    value={newSigner.name}
                    onChange={(e) => setNewSigner({ ...newSigner, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={newSigner.email}
                    onChange={(e) => setNewSigner({ ...newSigner, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g., Client, Witness)"
                    value={newSigner.role}
                    onChange={(e) => setNewSigner({ ...newSigner, role: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white"
                  />
                  {envelope.signingWorkflow === 'SEQUENTIAL' && (
                    <select
                      value={newSigner.sequenceNumber}
                      onChange={(e) =>
                        setNewSigner({ ...newSigner, sequenceNumber: parseInt(e.target.value) })
                      }
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Sequence {i + 1}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddSigner}
                      disabled={submitting || !newSigner.name || !newSigner.email}
                      className="flex-1 rounded-lg bg-blue-600 dark:bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddSigner(false);
                        setNewSigner({ name: '', email: '', role: '', sequenceNumber: 1 });
                      }}
                      className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
          {envelope.documents && envelope.documents.length > 0 ? (
            <div className="space-y-2">
              {envelope.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{doc.fileName}</p>
                  </div>
                  <a
                    href={doc.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    View →
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No documents added yet</p>
          )}
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
          {envelope.auditLogs && envelope.auditLogs.length > 0 ? (
            <AuditTrail logs={envelope.auditLogs} />
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No activity yet</p>
          )}
        </div>
      )}
    </div>
  );
}
