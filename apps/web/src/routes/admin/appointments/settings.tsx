import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAppointmentSettings, type Appointment } from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Settings, Plus, Trash2, Calendar } from 'lucide-react';

interface AppointmentSettings {
  id: string;
  workdayStart: number;
  workdayEnd: number;
  bufferMinutes: number;
  bookingWindowDays: number;
  activeTypes: string[];
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

interface BlockedTime {
  id: string;
  startAt: string;
  endAt: string;
  reason: string;
}

const APPOINTMENT_TYPES = ['Introduction', 'CreativeDirection', 'ContractInvoicing'];
const TIMEZONES = [
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export default function AppointmentsSettingsPage() {
  const [settings, setSettings] = useState<AppointmentSettings | null>(null);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showBlockedTimeForm, setShowBlockedTimeForm] = useState(false);
  const [blockedTimeForm, setBlockedTimeForm] = useState({
    startDate: '',
    startTime: '00:00',
    endDate: '',
    endTime: '23:59',
    reason: 'Holiday',
  });

  // Settings form state
  const [formData, setFormData] = useState({
    workdayStart: 11,
    workdayEnd: 16,
    bufferMinutes: 15,
    bookingWindowDays: 14,
    activeTypes: APPOINTMENT_TYPES,
    timezone: 'Europe/London',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getAppointmentSettings();
        setSettings(response.data);
        setFormData({
          workdayStart: response.data.workdayStart,
          workdayEnd: response.data.workdayEnd,
          bufferMinutes: response.data.bufferMinutes,
          bookingWindowDays: response.data.bookingWindowDays,
          activeTypes: response.data.activeTypes,
          timezone: response.data.timezone,
        });

        // Load blocked times
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const blockedResponse = await fetch(
          `${API_BASE_URL}/admin/appointments/blocked-times?startAt=${new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ).toISOString()}&endAt=${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}`,
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
        console.error('Failed to load settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/admin/appointments/settings`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      const result = await response.json();
      setSettings(result.data);
      setSuccessMessage('Settings saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlockedTime = async () => {
    if (!blockedTimeForm.startDate || !blockedTimeForm.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/admin/appointments/blocked-times`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startAt: `${blockedTimeForm.startDate}T${blockedTimeForm.startTime}:00Z`,
          endAt: `${blockedTimeForm.endDate}T${blockedTimeForm.endTime}:00Z`,
          reason: blockedTimeForm.reason,
        }),
      });

      if (!response.ok) throw new Error('Failed to add blocked time');

      // Reload blocked times
      const now = new Date();
      const blockedResponse = await fetch(
        `${API_BASE_URL}/admin/appointments/blocked-times?startAt=${new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        ).toISOString()}&endAt=${new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (blockedResponse.ok) {
        const blockedData = await blockedResponse.json();
        setBlockedTimes(blockedData.data || []);
      }

      setBlockedTimeForm({
        startDate: '',
        startTime: '00:00',
        endDate: '',
        endTime: '23:59',
        reason: 'Holiday',
      });
      setShowBlockedTimeForm(false);
      setSuccessMessage('Blocked time added');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add blocked time');
    }
  };

  const handleDeleteBlockedTime = async (id: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/admin/appointments/blocked-times/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete blocked time');

      setBlockedTimes((prev) => prev.filter((bt) => bt.id !== id));
      setSuccessMessage('Blocked time removed');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete blocked time');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointment Settings</h1>
          <p className="text-muted-foreground">Configure working hours, buffers, and availability</p>
        </div>
        <Button asChild variant="outline" className="flex items-center gap-2">
          <Link to="/admin/appointments/calendar">
            <Calendar className="h-4 w-4" />
            Calendar
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

      {/* Working Hours Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Working Hours</CardTitle>
          <CardDescription>When are you available for appointments?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time (UTC)</Label>
              <select
                value={formData.workdayStart}
                onChange={(e) => setFormData({ ...formData, workdayStart: parseInt(e.target.value, 10) })}
                className="w-full mt-2 px-4 py-2 rounded border border-input bg-background"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>End Time (UTC)</Label>
              <select
                value={formData.workdayEnd}
                onChange={(e) => setFormData({ ...formData, workdayEnd: parseInt(e.target.value, 10) })}
                className="w-full mt-2 px-4 py-2 rounded border border-input bg-background"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            ℹ️ Appointments are currently available Monday–Saturday. Sundays are disabled.
          </div>
        </CardContent>
      </Card>

      {/* Booking Window & Buffer */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Rules</CardTitle>
          <CardDescription>Set constraints for client bookings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Booking Window (Days)</Label>
              <input
                type="number"
                min="1"
                max="90"
                value={formData.bookingWindowDays}
                onChange={(e) => setFormData({ ...formData, bookingWindowDays: parseInt(e.target.value, 10) })}
                className="w-full mt-2 px-4 py-2 rounded border border-input bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">How many days ahead can clients book?</p>
            </div>

            <div>
              <Label>Buffer Time (Minutes)</Label>
              <input
                type="number"
                min="0"
                max="120"
                value={formData.bufferMinutes}
                onChange={(e) => setFormData({ ...formData, bufferMinutes: parseInt(e.target.value, 10) })}
                className="w-full mt-2 px-4 py-2 rounded border border-input bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">Gap required between appointments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Types */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Types</CardTitle>
          <CardDescription>Which types are currently available for booking?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {APPOINTMENT_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.activeTypes.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      activeTypes: [...formData.activeTypes, type],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      activeTypes: formData.activeTypes.filter((t) => t !== type),
                    });
                  }
                }}
                className="w-4 h-4 rounded border-input"
              />
              <span className="font-medium">{type}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle>Timezone</CardTitle>
          <CardDescription>Display timezone for appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full px-4 py-2 rounded border border-input bg-background"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Save button */}
      <Button
        onClick={handleSaveSettings}
        disabled={saving}
        className="w-full"
        size="lg"
      >
        {saving ? 'Saving...' : '💾 Save Settings'}
      </Button>

      {/* Blocked Times */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Blocked Times</CardTitle>
              <CardDescription>Holidays, vacations, and out-of-office periods</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowBlockedTimeForm(!showBlockedTimeForm)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Block
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {showBlockedTimeForm && (
            <div className="border-t pt-4 space-y-4 bg-muted p-4 rounded">
              <div>
                <Label>Reason</Label>
                <input
                  type="text"
                  value={blockedTimeForm.reason}
                  onChange={(e) => setBlockedTimeForm({ ...blockedTimeForm, reason: e.target.value })}
                  placeholder="e.g., Holiday, Vacation, Out-of-office"
                  className="w-full mt-2 px-4 py-2 rounded border border-input bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <input
                    type="date"
                    value={blockedTimeForm.startDate}
                    onChange={(e) => setBlockedTimeForm({ ...blockedTimeForm, startDate: e.target.value })}
                    className="w-full mt-2 px-4 py-2 rounded border border-input bg-background"
                  />
                </div>
                <div>
                  <Label>Start Time</Label>
                  <input
                    type="time"
                    value={blockedTimeForm.startTime}
                    onChange={(e) => setBlockedTimeForm({ ...blockedTimeForm, startTime: e.target.value })}
                    className="w-full mt-2 px-4 py-2 rounded border border-input bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>End Date</Label>
                  <input
                    type="date"
                    value={blockedTimeForm.endDate}
                    onChange={(e) => setBlockedTimeForm({ ...blockedTimeForm, endDate: e.target.value })}
                    className="w-full mt-2 px-4 py-2 rounded border border-input bg-background"
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <input
                    type="time"
                    value={blockedTimeForm.endTime}
                    onChange={(e) => setBlockedTimeForm({ ...blockedTimeForm, endTime: e.target.value })}
                    className="w-full mt-2 px-4 py-2 rounded border border-input bg-background"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddBlockedTime} className="flex-1">
                  Add Block
                </Button>
                <Button variant="outline" onClick={() => setShowBlockedTimeForm(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {blockedTimes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No blocked times configured</p>
          ) : (
            <div className="space-y-2">
              {blockedTimes.map((block) => (
                <div key={block.id} className="flex items-center justify-between p-3 rounded border border-border">
                  <div className="flex-1">
                    <div className="font-medium">{block.reason}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(block.startAt).toLocaleDateString('en-GB')} →{' '}
                      {new Date(block.endAt).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteBlockedTime(block.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
