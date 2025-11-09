/**
 * Create Envelope Wizard
 * Multi-step form for creating new envelopes with documents and signers
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEnvelope, addDocument, addSigner, AddDocumentData } from '../../lib/envelopes-api';
import { createDocumentMetadata } from '../../lib/file-utils';
import { EnvelopeBasicInfo } from './EnvelopeBasicInfo';
import { DocumentUpload } from './DocumentUpload';
import { SignerListStep } from './SignerListStep';
import { ReviewStep } from './ReviewStep';

interface WizardData {
  // Step 1: Basic Info
  name: string;
  description: string;
  signingWorkflow: 'SEQUENTIAL' | 'PARALLEL';

  // Step 2: Documents
  documents: Array<{
    id: string; // temporary ID for UI
    name: string;
    file: File;
  }>;

  // Step 3: Signers
  signers: Array<{
    id: string; // temporary ID for UI
    name: string;
    email: string;
    role: string;
    sequenceNumber: number;
  }>;
}

export function CreateEnvelopeWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEnvelopeId, setCreatedEnvelopeId] = useState<string | null>(null);

  const [data, setData] = useState<WizardData>({
    name: '',
    description: '',
    signingWorkflow: 'SEQUENTIAL',
    documents: [],
    signers: [],
  });

  const updateBasicInfo = (updates: {
    name?: string;
    description?: string;
    signingWorkflow?: 'SEQUENTIAL' | 'PARALLEL';
  }) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const addDoc = (name: string, file: File) => {
    setData((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          id: crypto.randomUUID(),
          name,
          file,
        },
      ],
    }));
  };

  const removeDoc = (docId: string) => {
    setData((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== docId),
    }));
  };

  const addNewSigner = (signer: {
    name: string;
    email: string;
    role: string;
    sequenceNumber: number;
  }) => {
    setData((prev) => ({
      ...prev,
      signers: [
        ...prev.signers,
        {
          id: crypto.randomUUID(),
          ...signer,
        },
      ],
    }));
  };

  const removeSigner = (signerId: string) => {
    setData((prev) => ({
      ...prev,
      signers: prev.signers.filter((s) => s.id !== signerId),
    }));
  };

  const updateSignerSequence = (signerId: string, sequenceNumber: number) => {
    setData((prev) => ({
      ...prev,
      signers: prev.signers.map((s) =>
        s.id === signerId ? { ...s, sequenceNumber } : s
      ),
    }));
  };

  const canProceedToStep2 = () => {
    return data.name.trim().length > 0;
  };

  const canProceedToStep3 = () => {
    return data.documents.length > 0;
  };

  const canProceedToStep4 = () => {
    return data.signers.length > 0;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create envelope
      const envelope = await createEnvelope({
        name: data.name,
        description: data.description,
        signingWorkflow: data.signingWorkflow,
      });

      setCreatedEnvelopeId(envelope.id);

      // Add documents with computed metadata
      for (const doc of data.documents) {
        try {
          // Create document metadata (calculate hash, etc.)
          const metadata = await createDocumentMetadata(doc.name, doc.file);

          // Send metadata to API
          await addDocument(envelope.id, metadata as AddDocumentData);
        } catch (docError) {
          throw new Error(`Failed to add document "${doc.name}": ${
            docError instanceof Error ? docError.message : 'Unknown error'
          }`);
        }
      }

      // Add signers
      for (const signer of data.signers) {
        await addSigner(envelope.id, {
          name: signer.name,
          email: signer.email,
          role: signer.role,
          sequenceNumber: signer.sequenceNumber,
        });
      }

      // Show success step
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create envelope');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (step === 4 && createdEnvelopeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="rounded-lg border border-green-200 bg-white p-8 max-w-md w-full text-center shadow-lg">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Envelope Created!</h1>
          <p className="text-gray-600 mb-6">
            Your envelope "{data.name}" has been created with {data.documents.length} document
            {data.documents.length !== 1 ? 's' : ''} and {data.signers.length} signer
            {data.signers.length !== 1 ? 's' : ''}.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You can now send the envelope or add more details before sending.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() =>
                navigate(`/admin/envelopes/${createdEnvelopeId}`)
              }
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              View Envelope
            </button>
            <button
              onClick={() => navigate('/admin/envelopes')}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main wizard steps
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Envelope</h1>
          <p className="mt-2 text-gray-600">Step {step} of 3</p>
        </div>
        <button
          onClick={() => navigate('/admin/envelopes')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Cancel
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full transition-colors ${
              s <= step ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="rounded-lg bg-white border border-gray-200 p-6">
          <EnvelopeBasicInfo
            data={{
              name: data.name,
              description: data.description,
              signingWorkflow: data.signingWorkflow,
            }}
            onUpdate={updateBasicInfo}
          />
        </div>
      )}

      {/* Step 2: Documents */}
      {step === 2 && (
        <div className="rounded-lg bg-white border border-gray-200 p-6">
          <DocumentUpload
            documents={data.documents}
            onAddDocument={addDoc}
            onRemoveDocument={removeDoc}
          />
        </div>
      )}

      {/* Step 3: Signers */}
      {step === 3 && (
        <div className="rounded-lg bg-white border border-gray-200 p-6">
          <SignerListStep
            signers={data.signers}
            workflow={data.signingWorkflow}
            onAddSigner={addNewSigner}
            onRemoveSigner={removeSigner}
            onUpdateSequence={updateSignerSequence}
          />
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-4 justify-between">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4)}
          disabled={step === 1}
          className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        {step < 3 ? (
          <button
            onClick={() => {
              if (step === 1 && !canProceedToStep2()) {
                setError('Please fill in the envelope name');
                return;
              }
              if (step === 2 && !canProceedToStep3()) {
                setError('Please add at least one document');
                return;
              }
              setError(null);
              setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3 | 4);
            }}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceedToStep4() || loading}
            className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Creating...' : '✅ Create Envelope'}
          </button>
        )}
      </div>

      {/* Step summary */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Summary:</span> {data.name || '(No name)'} •{' '}
          {data.documents.length} document
          {data.documents.length !== 1 ? 's' : ''} • {data.signers.length} signer
          {data.signers.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
