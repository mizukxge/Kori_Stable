/**
 * Review Step (Summary)
 * Displays a summary of all envelope details before creation
 * This component is referenced in the wizard but the wizard handles the review inline
 */

interface ReviewStepProps {
  name: string;
  description: string;
  signingWorkflow: 'SEQUENTIAL' | 'PARALLEL';
  documentCount: number;
  signerCount: number;
  onConfirm: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function ReviewStep({
  name,
  description,
  signingWorkflow,
  documentCount,
  signerCount,
  onConfirm,
  onBack,
  isLoading,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Review & Create</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Name */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Envelope Name</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{name}</p>
        </div>

        {/* Description */}
        {description && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Description</p>
            <p className="mt-1 text-gray-900">{description}</p>
          </div>
        )}

        {/* Workflow */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Signing Workflow</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {signingWorkflow === 'SEQUENTIAL'
              ? '📋 Sequential (A → B → C)'
              : '🎯 Parallel (Simultaneous)'}
          </p>
        </div>

        {/* Documents count */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Documents</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {documentCount} document{documentCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Signers count */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Signers</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {signerCount} signer{signerCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">✅ Ready to create:</span> Your envelope is ready to be created. Once created, you can view it, add more details, or send it to signers.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Go Back
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '⏳ Creating...' : '✅ Create Envelope'}
        </button>
      </div>
    </div>
  );
}
