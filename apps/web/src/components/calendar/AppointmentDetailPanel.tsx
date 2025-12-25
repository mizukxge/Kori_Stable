import React, { useState } from 'react';
import { X, ExternalLink, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';

export interface Appointment {
  id: string;
  type: string;
  status: string;
  scheduledAt?: string;
  duration: number;
  clientId: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  teamsLink?: string;
  outcome?: string;
  adminNotes?: string;
  clientNotes?: string;
  recordingConsentGiven: boolean;
  createdAt: string;
  updatedAt: string;
  auditLog?: any[];
}

interface AppointmentDetailPanelProps {
  appointment: Appointment;
  onClose: () => void;
  onComplete?: (id: string, outcome: string, summary: string) => void;
  onNoShow?: (id: string, reason: string) => void;
  onCancel?: (id: string, reason: string) => void;
  onEdit?: (id: string) => void;
  onReschedule?: (id: string) => void;
}

export function AppointmentDetailPanel({
  appointment,
  onClose,
  onComplete,
  onNoShow,
  onCancel,
  onEdit,
  onReschedule,
}: AppointmentDetailPanelProps) {
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showNoShowForm, setShowNoShowForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [completeData, setCompleteData] = useState({ outcome: 'Positive', callSummary: '' });
  const [noShowReason, setNoShowReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Draft: 'bg-gray-100 text-gray-800',
      InviteSent: 'bg-yellow-100 text-yellow-800',
      Booked: 'bg-blue-100 text-blue-800',
      Completed: 'bg-green-100 text-green-800',
      NoShow: 'bg-red-100 text-red-800',
      Cancelled: 'bg-gray-100 text-gray-800',
      Expired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canComplete = ['Booked'].includes(appointment.status);
  const canNoShow = ['Booked'].includes(appointment.status);
  const canCancel = ['Draft', 'InviteSent', 'Booked'].includes(appointment.status);
  const canReschedule = ['Booked'].includes(appointment.status);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-end">
      <Card className="w-96 rounded-none h-screen border-none">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <CardTitle>{appointment.client.name}</CardTitle>
          <button onClick={onClose} className="hover:bg-muted p-1 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <CardContent className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Status badge */}
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(appointment.status)}`}>
              {appointment.status}
            </span>
            {appointment.outcome && (
              <span className="ml-2 text-sm text-muted-foreground">• Outcome: {appointment.outcome}</span>
            )}
          </div>

          {/* Basic info */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <p className="font-medium">{appointment.type}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Date & Time</Label>
              <p className="font-medium">{formatDate(appointment.scheduledAt)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Duration</Label>
              <p className="font-medium">{appointment.duration} minutes</p>
            </div>
          </div>

          {/* Client info */}
          <div className="space-y-3 border-t pt-4">
            <div>
              <Label className="text-xs text-muted-foreground">Client Email</Label>
              <a
                href={`mailto:${appointment.client.email}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {appointment.client.email}
              </a>
            </div>
            {appointment.clientNotes && (
              <div>
                <Label className="text-xs text-muted-foreground">Client Notes</Label>
                <p className="text-sm">{appointment.clientNotes}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Recording Consent</Label>
              <p className="text-sm">{appointment.recordingConsentGiven ? '✓ Yes' : '✗ No'}</p>
            </div>
          </div>

          {/* Teams link */}
          {appointment.teamsLink && (
            <div className="space-y-3 border-t pt-4">
              <div>
                <Label className="text-xs text-muted-foreground">Teams Meeting</Label>
                <a
                  href={appointment.teamsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  Join Meeting
                </a>
              </div>
            </div>
          )}

          {/* Admin notes */}
          {appointment.adminNotes && (
            <div className="space-y-3 border-t pt-4">
              <div>
                <Label className="text-xs text-muted-foreground">Admin Notes</Label>
                <p className="text-sm">{appointment.adminNotes}</p>
              </div>
            </div>
          )}

          {/* Call summary (if completed) */}
          {appointment.callSummary && (
            <div className="space-y-3 border-t pt-4">
              <div>
                <Label className="text-xs text-muted-foreground">Call Summary</Label>
                <p className="text-sm">{appointment.callSummary}</p>
              </div>
            </div>
          )}

          {/* Forms */}
          {showCompleteForm && (
            <div className="space-y-3 border-t pt-4 bg-green-50 p-4 rounded">
              <div>
                <Label>Outcome</Label>
                <select
                  value={completeData.outcome}
                  onChange={(e) => setCompleteData({ ...completeData, outcome: e.target.value })}
                  className="w-full mt-2 px-3 py-2 rounded border border-input bg-background"
                >
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </select>
              </div>
              <div>
                <Label>Call Summary</Label>
                <textarea
                  value={completeData.callSummary}
                  onChange={(e) => setCompleteData({ ...completeData, callSummary: e.target.value })}
                  placeholder="Brief notes from the call..."
                  rows={3}
                  className="w-full mt-2 px-3 py-2 rounded border border-input bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (onComplete) {
                      onComplete(appointment.id, completeData.outcome, completeData.callSummary);
                      setShowCompleteForm(false);
                    }
                  }}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCompleteForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showNoShowForm && (
            <div className="space-y-3 border-t pt-4 bg-red-50 p-4 rounded">
              <div>
                <Label>No-Show Reason (Optional)</Label>
                <textarea
                  value={noShowReason}
                  onChange={(e) => setNoShowReason(e.target.value)}
                  placeholder="Why the client didn't show..."
                  rows={3}
                  className="w-full mt-2 px-3 py-2 rounded border border-input bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (onNoShow) {
                      onNoShow(appointment.id, noShowReason);
                      setShowNoShowForm(false);
                    }
                  }}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark No-Show
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNoShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showCancelForm && (
            <div className="space-y-3 border-t pt-4 bg-yellow-50 p-4 rounded">
              <div>
                <Label>Cancellation Reason (Optional)</Label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Why this appointment is being cancelled..."
                  rows={3}
                  className="w-full mt-2 px-3 py-2 rounded border border-input bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (onCancel) {
                      onCancel(appointment.id, cancelReason);
                      setShowCancelForm(false);
                    }
                  }}
                  className="flex-1"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCancelForm(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!showCompleteForm && !showNoShowForm && !showCancelForm && (
            <div className="space-y-2 border-t pt-4">
              {canReschedule && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    if (onReschedule) onReschedule(appointment.id);
                  }}
                >
                  📅 Reschedule
                </Button>
              )}
              {canComplete && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowCompleteForm(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              )}
              {canNoShow && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowNoShowForm(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark No-Show
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={() => setShowCancelForm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
              {onEdit && (
                <Button variant="outline" className="w-full justify-start" onClick={() => onEdit(appointment.id)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
