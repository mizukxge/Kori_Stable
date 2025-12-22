import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  listAppointments,
  completeAppointment,
  markAppointmentNoShow,
  cancelAppointment,
  type Appointment,
} from '../../../lib/api';
import { WeekCalendar } from '../../../components/calendar/WeekCalendar';
import { AppointmentDetailPanel } from '../../../components/calendar/AppointmentDetailPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Calendar, Settings } from 'lucide-react';

interface CalendarBlockedTime {
  id: string;
  startAt: string;
  endAt: string;
  reason: string;
}

export default function AppointmentsCalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<CalendarBlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load appointments
        const appResponse = await listAppointments({ limit: 100 });
        setAppointments(appResponse.data);

        // Load blocked times for current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const blockedResponse = await fetch(
          `${API_BASE_URL}/admin/appointments/blocked-times?startAt=${monthStart.toISOString()}&endAt=${monthEnd.toISOString()}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (blockedResponse.ok) {
          const blockedData = await blockedResponse.json();
          setBlockedTimes(blockedData.data || []);
        }
      } catch (err) {
        console.error('Failed to load calendar data:', err);
        setError('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCompleteAppointment = async (id: string, outcome: string, callSummary: string) => {
    setActionLoading(true);
    setError(null);

    try {
      const result = await completeAppointment(id, outcome, callSummary);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? result.data : apt))
      );
      setSelectedAppointment(null);
      setSuccessMessage('Appointment marked as completed');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkNoShow = async (id: string, reason: string) => {
    setActionLoading(true);
    setError(null);

    try {
      const result = await markAppointmentNoShow(id, reason);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? result.data : apt))
      );
      setSelectedAppointment(null);
      setSuccessMessage('Appointment marked as no-show');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as no-show');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAppointment = async (id: string, reason: string) => {
    setActionLoading(true);
    setError(null);

    try {
      const result = await cancelAppointment(id, reason);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? result.data : apt))
      );
      setSelectedAppointment(null);
      setSuccessMessage('Appointment cancelled');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments Calendar</h1>
          <p className="text-muted-foreground">Visual week view of your schedule</p>
        </div>
        <Button asChild variant="outline" className="flex items-center gap-2">
          <Link to="/admin/appointments/settings">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
          ✓ {successMessage}
        </div>
      )}

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          <WeekCalendar
            appointments={appointments}
            blockedTimes={blockedTimes}
            onAppointmentClick={setSelectedAppointment}
          />
        </CardContent>
      </Card>

      {/* Detail panel */}
      {selectedAppointment && (
        <AppointmentDetailPanel
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onComplete={handleCompleteAppointment}
          onNoShow={handleMarkNoShow}
          onCancel={handleCancelAppointment}
        />
      )}

      {/* Quick info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About this view</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            📅 <strong>Week view:</strong> Shows appointments Mon–Sat, 11:00–16:00 UTC
          </p>
          <p>
            🔗 <strong>Click an appointment:</strong> View details, mark complete/no-show, reschedule, or cancel
          </p>
          <p>
            🚫 <strong>Blocked times:</strong> Holidays and out-of-office periods appear greyed out
          </p>
          <p>
            ⚙️ <strong>Settings:</strong> Configure working hours, buffer time, and blocked dates
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
