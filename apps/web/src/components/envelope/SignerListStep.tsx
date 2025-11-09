/**
 * Signer List Step
 * Step 3 of the wizard: Add and manage signers for the envelope
 */

import { useState } from 'react';

interface Signer {
  id: string;
  name: string;
  email: string;
  role: string;
  sequenceNumber: number;
}

interface SignerListStepProps {
  signers: Signer[];
  workflow: 'SEQUENTIAL' | 'PARALLEL';
  onAddSigner: (signer: {
    name: string;
    email: string;
    role: string;
    sequenceNumber: number;
  }) => void;
  onRemoveSigner: (signerId: string) => void;
  onUpdateSequence: (signerId: string, sequenceNumber: number) => void;
}

export function SignerListStep({
  signers,
  workflow,
  onAddSigner,
  onRemoveSigner,
  onUpdateSequence,
}: SignerListStepProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    sequenceNumber: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (signers.some((s) => s.email === formData.email)) {
      newErrors.email = 'This email is already added';
    }
    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSigner = () => {
    if (!validateForm()) return;

    onAddSigner({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      sequenceNumber: formData.sequenceNumber,
    });

    // Reset form
    setFormData({
      name: '',
      email: '',
      role: '',
      sequenceNumber: 1,
    });
    setErrors({});
    setShowForm(false);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      role: '',
      sequenceNumber: 1,
    });
    setErrors({});
    setShowForm(false);
  };

  const maxSequence = Math.max(...signers.map((s) => s.sequenceNumber), 0) + 1;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Signers</h2>

      {/* Signers list */}
      {signers.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Signers ({signers.length})
          </h3>

          {signers.map((signer) => (
            <div
              key={signer.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Sequence badge */}
                  {workflow === 'SEQUENTIAL' && (
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
                        {signer.sequenceNumber}
                      </div>
                    </div>
                  )}

                  {/* Signer info */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{signer.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{signer.email}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                        {signer.role}
                      </span>
                      {workflow === 'SEQUENTIAL' && (
                        <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                          📋 Sequence {signer.sequenceNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {workflow === 'SEQUENTIAL' && (
                    <select
                      value={signer.sequenceNumber}
                      onChange={(e) =>
                        onUpdateSequence(signer.id, parseInt(e.target.value))
                      }
                      className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[...Array(Math.max(signers.length, 1))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={() => onRemoveSigner(signer.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add signer form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-center font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
        >
          + Add Signer
        </button>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Add New Signer</h3>

          {/* Name field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (e.target.value.trim()) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              placeholder="Signer name"
              className={`w-full rounded border px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name
                  ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-950'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }
              }}
              placeholder="signer@example.com"
              className={`w-full rounded border px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email
                  ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-950'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Role field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role *
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => {
                setFormData({ ...formData, role: e.target.value });
                if (e.target.value.trim()) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.role;
                    return next;
                  });
                }
              }}
              placeholder="e.g., Client, Witness, Notary"
              className={`w-full rounded border px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.role
                  ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-950'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.role && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.role}</p>
            )}
          </div>

          {/* Sequence number (only for SEQUENTIAL) */}
          {workflow === 'SEQUENTIAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sequence Order
              </label>
              <select
                value={formData.sequenceNumber}
                onChange={(e) =>
                  setFormData({ ...formData, sequenceNumber: parseInt(e.target.value) })
                }
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[...Array(maxSequence)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Position {i + 1}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This signer will receive the document after position {formData.sequenceNumber - 1}
              </p>
            </div>
          )}

          {/* Form actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAddSigner}
              className="flex-1 rounded bg-blue-600 dark:bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Add Signer
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Workflow info */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <span className="font-semibold">💡 Tip:</span>
          {workflow === 'SEQUENTIAL'
            ? ' Signers will receive the envelope in the order specified. Each signer must sign before the next one can access it.'
            : ' All signers will receive the envelope at the same time and can sign in any order.'}
        </p>
      </div>

      {/* Empty state */}
      {signers.length === 0 && !showForm && (
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No signers added yet. Add at least one signer to proceed.
          </p>
        </div>
      )}
    </div>
  );
}
