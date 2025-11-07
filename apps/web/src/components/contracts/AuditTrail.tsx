import { useState, useEffect } from 'react';
import {
  FileText,
  Send,
  Eye,
  FileSignature,
  Clock,
  XCircle,
  CheckCircle,
  Link as LinkIcon,
  Mail,
  Shield,
  Key,
  User,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  getContractEvents,
  type ContractEvent,
  type AuditLog,
  type ContractAuditTrail,
} from '../../lib/contracts-api';

interface AuditTrailProps {
  contractId: string;
}

interface TimelineEvent {
  id: string;
  type: 'contract' | 'audit';
  timestamp: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  metadata?: any;
  actor?: string;
}

export function AuditTrail({ contractId }: AuditTrailProps) {
  const [events, setEvents] = useState<ContractAuditTrail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'contract' | 'audit'>('all');

  useEffect(() => {
    loadEvents();
  }, [contractId]);

  async function loadEvents() {
    try {
      setIsLoading(true);
      const data = await getContractEvents(contractId);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load contract events:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getEventIcon(type: string): { icon: React.ReactNode; color: string } {
    const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
      CREATED: { icon: <FileText className="w-4 h-4" />, color: 'bg-gray-500' },
      SENT: { icon: <Send className="w-4 h-4" />, color: 'bg-blue-500' },
      VIEWED: { icon: <Eye className="w-4 h-4" />, color: 'bg-purple-500' },
      SIGNED: { icon: <FileSignature className="w-4 h-4" />, color: 'bg-green-500' },
      COUNTERSIGNED: { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-600' },
      EXPIRED: { icon: <Clock className="w-4 h-4" />, color: 'bg-orange-500' },
      VOIDED: { icon: <XCircle className="w-4 h-4" />, color: 'bg-red-500' },
      LINK_LOCKED: { icon: <Shield className="w-4 h-4" />, color: 'bg-red-600' },
      REMINDER_SENT: { icon: <Mail className="w-4 h-4" />, color: 'bg-yellow-500' },
      PDF_VIEWED: { icon: <Download className="w-4 h-4" />, color: 'bg-indigo-500' },
      PASSWORD_FAILED: { icon: <AlertCircle className="w-4 h-4" />, color: 'bg-red-500' },
      OTP_SENT: { icon: <Key className="w-4 h-4" />, color: 'bg-cyan-500' },
      OTP_VERIFIED: { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-cyan-600' },
      SESSION_STARTED: { icon: <User className="w-4 h-4" />, color: 'bg-teal-500' },
      SESSION_EXPIRED: { icon: <Clock className="w-4 h-4" />, color: 'bg-gray-500' },
      REISSUED: { icon: <LinkIcon className="w-4 h-4" />, color: 'bg-blue-400' },
      REACTIVATED: { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-400' },
    };

    return iconMap[type] || { icon: <FileText className="w-4 h-4" />, color: 'bg-gray-400' };
  }

  function formatContractEvent(event: ContractEvent): TimelineEvent {
    const { icon, color } = getEventIcon(event.type);

    const descriptions: Record<string, string> = {
      CREATED: 'Contract was created',
      SENT: 'Contract sent to client',
      VIEWED: 'Client viewed the contract',
      SIGNED: 'Contract was signed by client',
      COUNTERSIGNED: 'Contract countersigned',
      EXPIRED: 'Contract link expired',
      VOIDED: 'Contract was voided',
      LINK_LOCKED: 'Access link locked due to failed attempts',
      REMINDER_SENT: 'Reminder email sent to client',
      PDF_VIEWED: 'PDF document viewed',
      PASSWORD_FAILED: 'Failed password attempt',
      OTP_SENT: 'OTP code sent to client email',
      OTP_VERIFIED: 'Client verified OTP code successfully',
      SESSION_STARTED: 'Client started signing session',
      SESSION_EXPIRED: 'Signing session expired',
      REISSUED: 'New magic link issued',
      REACTIVATED: 'Contract reactivated',
    };

    return {
      id: event.id,
      type: 'contract',
      timestamp: event.createdAt,
      title: event.type.replace(/_/g, ' '),
      description: descriptions[event.type] || event.type,
      icon,
      iconColor: color,
      metadata: event.meta,
    };
  }

  function formatAuditLog(log: AuditLog): TimelineEvent {
    const actionIcons: Record<string, { icon: React.ReactNode; color: string }> = {
      CREATE_CONTRACT: { icon: <FileText className="w-4 h-4" />, color: 'bg-gray-500' },
      UPDATE_CONTRACT: { icon: <FileText className="w-4 h-4" />, color: 'bg-blue-500' },
      DELETE_CONTRACT: { icon: <XCircle className="w-4 h-4" />, color: 'bg-red-500' },
      SEND_CONTRACT: { icon: <Send className="w-4 h-4" />, color: 'bg-blue-500' },
      GENERATE_PDF: { icon: <FileText className="w-4 h-4" />, color: 'bg-indigo-500' },
      DOWNLOAD_PDF: { icon: <Download className="w-4 h-4" />, color: 'bg-indigo-400' },
    };

    const { icon, color } = actionIcons[log.action] || { icon: <FileText className="w-4 h-4" />, color: 'bg-gray-400' };

    return {
      id: log.id,
      type: 'audit',
      timestamp: log.createdAt,
      title: log.action.replace(/_/g, ' '),
      description: `Action performed by ${log.user?.name || 'system'}`,
      icon,
      iconColor: color,
      metadata: log.metadata,
      actor: log.user?.name || log.user?.email,
    };
  }

  function getCombinedTimeline(): TimelineEvent[] {
    if (!events) return [];

    const contractEvents = events.contractEvents.map(formatContractEvent);
    const auditEvents = events.auditLogs.map(formatAuditLog);
    const combined = [...contractEvents, ...auditEvents];

    // Sort by timestamp descending (newest first)
    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply filter
    if (filter === 'contract') {
      return combined.filter((e) => e.type === 'contract');
    } else if (filter === 'audit') {
      return combined.filter((e) => e.type === 'audit');
    }

    return combined;
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-muted-foreground">Loading audit trail...</p>
        </div>
      </div>
    );
  }

  const timeline = getCombinedTimeline();

  return (
    <div className="bg-card rounded-lg shadow">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Audit Trail</h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({events?.contractEvents.length! + events?.auditLogs.length!})
            </Button>
            <Button
              variant={filter === 'contract' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('contract')}
            >
              Events ({events?.contractEvents.length})
            </Button>
            <Button
              variant={filter === 'audit' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('audit')}
            >
              Actions ({events?.auditLogs.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        {timeline.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">No events recorded yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-muted"></div>

            {/* Events */}
            <div className="space-y-6">
              {timeline.map((event, index) => (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full ${event.iconColor} flex items-center justify-center text-white`}>
                    {event.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-background rounded-lg p-4 border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground capitalize">
                          {event.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        {event.actor && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <User className="w-3 h-3 inline mr-1" />
                            {event.actor}
                          </p>
                        )}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-primary cursor-pointer hover:text-primary">
                              View details
                            </summary>
                            <pre className="mt-2 text-xs bg-card p-2 rounded border border-border overflow-x-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${
                            event.type === 'contract'
                              ? 'bg-blue-100 text-primary'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {event.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {timeline.length > 0 && (
        <div className="border-t px-6 py-3 bg-background text-center">
          <p className="text-xs text-muted-foreground">
            Showing {timeline.length} {timeline.length === 1 ? 'event' : 'events'} ·
            All times are in your local timezone ·
            Events are logged immutably for compliance
          </p>
        </div>
      )}
    </div>
  );
}
