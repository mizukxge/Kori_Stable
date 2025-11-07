import { useState, useEffect } from 'react';
import { CheckCircle, Loader, AlertCircle, XCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import {
  acceptAndConvertProposal,
  getProposalConversionStatus,
  undoProposalConversion,
  type ConversionStatus,
} from '../lib/proposal-conversion-api';

interface ProposalConversionButtonProps {
  proposalId: string;
  proposalStatus: string;
  onConversionComplete?: () => void;
  onConversionUndo?: () => void;
}

export function ProposalConversionButton({
  proposalId,
  proposalStatus,
  onConversionComplete,
  onConversionUndo,
}: ProposalConversionButtonProps) {
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversion status on mount and when proposal status changes
  useEffect(() => {
    loadConversionStatus();
  }, [proposalId, proposalStatus]);

  const loadConversionStatus = async () => {
    try {
      const status = await getProposalConversionStatus(proposalId);
      setConversionStatus(status);
    } catch (err) {
      console.error('Failed to load conversion status:', err);
    }
  };

  const handleConvert = async () => {
    try {
      setLoading(true);
      setError(null);
      await acceptAndConvertProposal(proposalId);
      await loadConversionStatus();
      setShowModal(false);
      onConversionComplete?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to convert proposal';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    try {
      setLoading(true);
      setError(null);
      await undoProposalConversion(proposalId);
      await loadConversionStatus();
      setShowModal(false);
      onConversionUndo?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to undo conversion';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if proposal is not in a convertible state
  if (!proposalStatus || !['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED'].includes(proposalStatus)) {
    return null;
  }

  // If already converted, show status
  if (conversionStatus?.accepted) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Converted
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              {conversionStatus.hasContract && conversionStatus.hasInvoice
                ? 'Contract & Invoice created'
                : 'Conversion in progress'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          {loading ? <Loader className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Undo
        </Button>
      </div>
    );
  }

  // Show conversion button
  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="gap-2"
        disabled={loading || proposalStatus === 'DECLINED' || proposalStatus === 'EXPIRED'}
      >
        {loading && <Loader className="h-4 w-4 animate-spin" />}
        {proposalStatus === 'ACCEPTED' ? 'View Conversion' : 'Accept & Convert'}
      </Button>

      {/* Conversion Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="">
        <div className="space-y-6 py-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              {conversionStatus?.accepted ? 'Undo Conversion?' : 'Accept & Convert Proposal?'}
            </h2>
            <p className="text-muted-foreground">
              {conversionStatus?.accepted
                ? 'This will revert the proposal to SENT status and mark the contract and invoice as voided/cancelled.'
                : 'This will accept the proposal and automatically create a linked contract and invoice. You can customize them afterward.'}
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="font-medium text-red-900 dark:text-red-100">Error</p>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Conversion Benefits */}
          {!conversionStatus?.accepted && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
              <p className="font-medium text-blue-900 dark:text-blue-100">What happens next:</p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>✓ Proposal marked as ACCEPTED</li>
                <li>✓ Contract created with proposal details</li>
                <li>✓ Invoice created and linked to contract</li>
                <li>✓ You can customize both documents before sending</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <Button onClick={() => setShowModal(false)} variant="outline" disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={conversionStatus?.accepted ? handleUndo : handleConvert}
              disabled={loading}
              variant={conversionStatus?.accepted ? 'destructive' : 'default'}
              className="gap-2"
            >
              {loading && <Loader className="h-4 w-4 animate-spin" />}
              {conversionStatus?.accepted ? 'Undo Conversion' : 'Accept & Convert'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
