import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAppointmentById,
  completeAppointment,
  cancelAppointment,
  markAppointmentNoShow,
  rescheduleAppointment,
  type Appointment,
} from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { ArrowLeft, Calendar, Clock, Mail, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showNoShowForm, setShowNoShowForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);

  const [completeData, setCompleteData] = useState({ outcome: 'Positive', callSummary: '' });
  const [noShowReason, setNoShowReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleData, setRescheduleData] = useState({ scheduledAt: '' });

  useEffect(() => {
    if (!id) return;

    const loadAppointment = async () => {
      try {
        const response = await getAppointmentById(id);
        setAppointment(response.data);
      } catch (err) {
        setError('Failed to load appointment');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [id]);

  const handleComplete = async () => {
    if (!appointment?.id) return;

    setSaving(true);
    setError(null);

    try {
      await completeAppointment(appointment.id, completeData.outcome, completeData.callSummary);
      setSuccessMessage('Appointment marked as completed');
      setShowCompleteForm(false);
      setTimeout(() => navigate('/admin/appointments'), 2000);
    } catch (err) {
      setError('Failed to complete appointment');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleNoShow = async () => {
    if (!appointment?.id) return;

    setSaving(true);
    setError(null);

    try {
      await markAppointmentNoShow(appointment.id, noShowReason);
      setSuccessMessage('Appointment marked as no-show');
      setShowNoShowForm(false);
      setTimeout(() => navigate('/admin/appointments'), 2000);
    } catch (err) {
      setError('Failed to mark as no-show');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment?.id) return;

    setSaving(true);
    setError(null);

    try {
      await cancelAppointment(appointment.id, cancelReason);
      setSuccessMessage('Appointment cancelled');
      setShowCancelForm(false);
      setTimeout(() => navigate('/admin/appointments'), 2000);
    } catch (err) {
      setError('Failed to cancel appointment');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReschedule = async () => {
    if (!appointment?.id) return;

    setSaving(true);
    setError(null);

    try {
      const newScheduledAt = new Date(rescheduleData.scheduledAt).toISOString();
      await rescheduleAppointment(appointment.id, newScheduledAt);
      setSuccessMessage('Appointment rescheduled');
      setShowRescheduleForm(false);
      setTimeout(() => navigate('/admin/appointments'), 2000);
    } catch (err) {
      setError('Failed to reschedule appointment');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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
    });
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const colors: Record<string, string> = {
      Draft: 'bg-gray-100 text-gray-800',
      InviteSent: 'bg-yellow-100 text-yellow-800',
      Booked: 'bg-blue-100 text-blue-800',
      Completed: 'bg-green-100 text-green-800',
      NoShow: 'bg-red-100 text-red-800',
      Cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <p className="text-red-600">Appointment not found</p>
          <Button onClick={() => navigate('/admin/appointments')} className="mt-4">
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/appointments')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Appointment Details</h1>
          <p className="text-muted-foreground">ID: {appointment.id}</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                  <p className="text-lg font-semibold">{appointment.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 text-sm rounded-full ${getStatusBadge(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Scheduled At</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">{formatDate(appointment.scheduledAt)}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">{appointment.duration} minutes</p>
                  </div>
                </div>
              </div>

              {appointment.outcome && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Outcome</Label>
                  <p className="text-lg font-semibold">{appointment.outcome}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="font-semibold">{appointment.client?.name || '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${appointment.client?.email}`} className="text-blue-600 hover:underline">
                  {appointment.client?.email}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Teams Meeting */}
          {appointment.teamsLink && (
            <Card>
              <CardHeader>
                <CardTitle>Teams Meeting</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={appointment.teamsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Join Meeting
                  <span className="text-lg">→</span>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointment.adminNotes ? (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Admin Notes</Label>
                  <p className="mt-2 p-3 bg-muted rounded">{appointment.adminNotes}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No admin notes</p>
              )}
              {appointment.clientNotes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Client Notes</Label>
                  <p className="mt-2 p-3 bg-muted rounded">{appointment.clientNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {appointment.status !== 'Completed' && appointment.status !== 'Cancelled' && appointment.status !== 'NoShow' && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowRescheduleForm(!showRescheduleForm)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowCompleteForm(!showCompleteForm)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Completed
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-orange-600"
                    onClick={() => setShowNoShowForm(!showNoShowForm)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Mark No-Show
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600"
                    onClick={() => setShowCancelForm(!showCancelForm)}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-xs">{formatDate(appointment.createdAt)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Updated</Label>
                <p className="text-xs">{formatDate(appointment.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reschedule Form */}
      {showRescheduleForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Reschedule Appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>New Date & Time</Label>
              <input
                type="datetime-local"
                value={rescheduleData.scheduledAt}
                onChange={(e) => setRescheduleData({ ...rescheduleData, scheduledAt: e.target.value })}
                className="w-full p-2 border rounded-lg mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleReschedule} disabled={saving} className="flex-1">
                Reschedule
              </Button>
              <Button variant="outline" onClick={() => setShowRescheduleForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Form */}
      {showCompleteForm && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle>Complete Appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Outcome</Label>
              <select
                value={completeData.outcome}
                onChange={(e) => setCompleteData({ ...completeData, outcome: e.target.value })}
                className="w-full p-2 border rounded-lg mt-2"
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
                className="w-full p-2 border rounded-lg mt-2 min-h-24"
                placeholder="Summary of the call..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleComplete} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700">
                Complete
              </Button>
              <Button variant="outline" onClick={() => setShowCompleteForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No-Show Form */}
      {showNoShowForm && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle>Mark as No-Show</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Reason</Label>
              <textarea
                value={noShowReason}
                onChange={(e) => setNoShowReason(e.target.value)}
                className="w-full p-2 border rounded-lg mt-2 min-h-20"
                placeholder="Why did the client not show up?"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleNoShow} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700">
                Mark No-Show
              </Button>
              <Button variant="outline" onClick={() => setShowNoShowForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Form */}
      {showCancelForm && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle>Cancel Appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Reason</Label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 border rounded-lg mt-2 min-h-20"
                placeholder="Why is the appointment being cancelled?"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCancel} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700">
                Cancel Appointment
              </Button>
              <Button variant="outline" onClick={() => setShowCancelForm(false)} className="flex-1">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
