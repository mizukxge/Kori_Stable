/**
 * Envelope Basic Info Step
 * Step 1 of the wizard: Enter name, description, and workflow type
 */

import { useState } from 'react';

interface EnvelopeBasicInfoProps {
  data: {
    name: string;
    description: string;
    signingWorkflow: 'SEQUENTIAL' | 'PARALLEL';
  };
  onUpdate: (updates: {
    name?: string;
    description?: string;
    signingWorkflow?: 'SEQUENTIAL' | 'PARALLEL';
  }) => void;
}

export function EnvelopeBasicInfo({ data, onUpdate }: EnvelopeBasicInfoProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNameChange = (value: string) => {
    onUpdate({ name: value });
    if (value.trim().length > 0) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  };

  const handleDescriptionChange = (value: string) => {
    onUpdate({ description: value });
  };

  const handleWorkflowChange = (workflow: 'SEQUENTIAL' | 'PARALLEL') => {
    onUpdate({ signingWorkflow: workflow });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Envelope Details</h2>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Envelope Name *
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., Contract Agreement 2025"
          className={`w-full rounded-lg border px-4 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-950' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700'
          }`}
          maxLength={200}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {data.name.length}/200 characters
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={data.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Add any notes about this envelope..."
          rows={4}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {data.description.length}/1000 characters
        </p>
      </div>

      {/* Workflow Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Signing Workflow *
        </label>
        <div className="space-y-3">
          {/* Sequential */}
          <button
            onClick={() => handleWorkflowChange('SEQUENTIAL')}
            className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
              data.signingWorkflow === 'SEQUENTIAL'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    data.signingWorkflow === 'SEQUENTIAL'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {data.signingWorkflow === 'SEQUENTIAL' && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">📋 Sequential</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Signers sign one after another in order (A → B → C)
                </p>
                <div className="mt-2 flex gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>✓ Ensures proper approval chain</span>
                </div>
              </div>
            </div>
          </button>

          {/* Parallel */}
          <button
            onClick={() => handleWorkflowChange('PARALLEL')}
            className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
              data.signingWorkflow === 'PARALLEL'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    data.signingWorkflow === 'PARALLEL'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {data.signingWorkflow === 'PARALLEL' && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">🎯 Parallel</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  All signers sign simultaneously (A, B, C at the same time)
                </p>
                <div className="mt-2 flex gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>✓ Faster execution</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <span className="font-semibold">💡 Tip:</span> You can add documents and signers in the next steps. The workflow type determines how signers access the envelope.
        </p>
      </div>
    </div>
  );
}
