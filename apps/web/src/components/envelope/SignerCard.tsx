/**
 * SignerCard Component
 * Displays signer information and status
 */

import { formatDistanceToNow } from 'date-fns';

interface SignerCardProps {
  name: string;
  email: string;
  role?: string;
  status: 'PENDING' | 'VIEWED' | 'SIGNED' | 'DECLINED' | 'EXPIRED';
  sequenceNumber?: number;
  signedAt?: string;
  viewedAt?: string;
  declinedAt?: string;
  declinedReason?: string;
  onRemove?: () => void;
}

const statusConfig = {
  PENDING: {
    icon: '⏳',
    label: 'Pending',
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-700',
  },
  VIEWED: {
    icon: '👁️',
    label: 'Viewed',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900',
  },
  SIGNED: {
    icon: '✅',
    label: 'Signed',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900',
  },
  DECLINED: {
    icon: '❌',
    label: 'Declined',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900',
  },
  EXPIRED: {
    icon: '⏰',
    label: 'Expired',
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-700',
  },
};

export function SignerCard({
  name,
  email,
  role,
  status,
  sequenceNumber,
  signedAt,
  viewedAt,
  declinedAt,
  declinedReason,
  onRemove,
}: SignerCardProps) {
  const config = statusConfig[status];

  let statusText = config.label;
  if (signedAt) {
    statusText = `Signed ${formatDistanceToNow(new Date(signedAt), { addSuffix: true })}`;
  } else if (declinedAt) {
    statusText = `Declined ${formatDistanceToNow(new Date(declinedAt), { addSuffix: true })}`;
  } else if (viewedAt) {
    statusText = `Viewed ${formatDistanceToNow(new Date(viewedAt), { addSuffix: true })}`;
  }

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${config.bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
            {sequenceNumber && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-sm font-bold text-blue-600 dark:text-blue-300">
                {sequenceNumber}
              </span>
            )}
            {role && <span className="text-sm text-gray-600 dark:text-gray-400">({role})</span>}
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{email}</p>
        </div>

        {onRemove && status === 'PENDING' && (
          <button
            onClick={onRemove}
            className="rounded text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
            title="Remove signer"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className={`text-lg ${config.color}`}>{config.icon}</span>
        <span className={`text-sm font-medium ${config.color}`}>{statusText}</span>
      </div>

      {declinedReason && (
        <div className="mt-2 rounded-md bg-red-100 dark:bg-red-900 p-2 text-sm text-red-800 dark:text-red-200">
          <strong>Reason:</strong> {declinedReason}
        </div>
      )}
    </div>
  );
}
