/**
 * AuditTrail Component
 * Displays timeline of envelope actions
 */

import { formatDistanceToNow } from 'date-fns';

interface AuditLogEntry {
  id: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface AuditTrailProps {
  logs: AuditLogEntry[];
  maxItems?: number;
}

const actionIcons: Record<string, string> = {
  ENVELOPE_CREATED: '📝',
  ENVELOPE_SENT: '📤',
  ENVELOPE_VIEWED: '👁️',
  ENVELOPE_SIGNED: '✅',
  ENVELOPE_COMPLETED: '🎉',
  ENVELOPE_CANCELLED: '❌',
  ENVELOPE_EXPIRED: '⏰',
  DOCUMENT_ADDED: '📄',
  DOCUMENT_REMOVED: '🗑️',
  SIGNER_ADDED: '👤',
  SIGNER_REMOVED: '👤❌',
  SIGNER_VIEWED: '👁️',
  SIGNER_SIGNED: '✍️',
  SIGNER_DECLINED: '🚫',
  SIGNATURE_VERIFIED: '✔️',
  TAMPER_DETECTED: '⚠️',
};

const actionLabels: Record<string, string> = {
  ENVELOPE_CREATED: 'Envelope Created',
  ENVELOPE_SENT: 'Envelope Sent',
  ENVELOPE_VIEWED: 'Envelope Viewed',
  ENVELOPE_SIGNED: 'Envelope Signed',
  ENVELOPE_COMPLETED: 'Envelope Completed',
  ENVELOPE_CANCELLED: 'Envelope Cancelled',
  ENVELOPE_EXPIRED: 'Envelope Expired',
  DOCUMENT_ADDED: 'Document Added',
  DOCUMENT_REMOVED: 'Document Removed',
  SIGNER_ADDED: 'Signer Added',
  SIGNER_REMOVED: 'Signer Removed',
  SIGNER_VIEWED: 'Signer Viewed',
  SIGNER_SIGNED: 'Signer Signed',
  SIGNER_DECLINED: 'Signer Declined',
  SIGNATURE_VERIFIED: 'Signature Verified',
  TAMPER_DETECTED: 'Tamper Detected',
};

function getActionColor(action: string): string {
  if (action.includes('CANCELLED') || action.includes('DECLINED') || action.includes('TAMPER')) {
    return 'text-red-600';
  }
  if (action.includes('COMPLETED') || action.includes('SIGNED') || action.includes('VERIFIED')) {
    return 'text-green-600';
  }
  if (action.includes('VIEWED')) {
    return 'text-blue-600';
  }
  return 'text-gray-600';
}

export function AuditTrail({ logs, maxItems = 10 }: AuditTrailProps) {
  const displayLogs = logs.slice(0, maxItems);

  if (displayLogs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-600">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayLogs.map((log, index) => {
        const icon = actionIcons[log.action] || '📍';
        const label = actionLabels[log.action] || log.action;
        const color = getActionColor(log.action);
        const time = formatDistanceToNow(new Date(log.timestamp), { addSuffix: true });

        return (
          <div key={log.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`text-2xl ${color}`}>{icon}</div>
              {index < displayLogs.length - 1 && (
                <div className="mt-2 h-8 w-0.5 bg-gray-200" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-baseline justify-between">
                <h4 className="font-medium text-gray-900">{label}</h4>
                <span className="text-xs text-gray-500">{time}</span>
              </div>

              {/* Metadata */}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  {Object.entries(log.metadata).map(([key, value]) => {
                    // Skip complex objects
                    if (typeof value === 'object') return null;

                    return (
                      <div key={key} className="flex gap-2">
                        <span className="font-medium">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {logs.length > maxItems && (
        <div className="pt-4 text-center text-xs text-gray-500">
          ... and {logs.length - maxItems} more events
        </div>
      )}
    </div>
  );
}
