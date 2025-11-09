/**
 * StatusBadge Component
 * Displays envelope status with appropriate styling
 */

interface StatusBadgeProps {
  status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  DRAFT: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    icon: '✏️',
    label: 'Draft',
  },
  PENDING: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: '⏳',
    label: 'Pending',
  },
  IN_PROGRESS: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: '⌛',
    label: 'In Progress',
  },
  COMPLETED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: '✅',
    label: 'Completed',
  },
  CANCELLED: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: '❌',
    label: 'Cancelled',
  },
  EXPIRED: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: '⏰',
    label: 'Expired',
  },
};

const sizeConfig = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bg} ${config.text} ${sizeClass}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
