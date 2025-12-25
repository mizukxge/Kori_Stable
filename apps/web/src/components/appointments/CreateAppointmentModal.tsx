import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { format } from 'date-fns';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface CreateAppointmentModalProps {
  selectedDate?: Date;
  selectedTime?: string;
  onClose: () => void;
  onSubmit: (data: {
    clientId: string;
    type: string;
    scheduledAt?: string;
    duration: number;
    adminNotes?: string;
  }) => Promise<void>;
}

const APPOINTMENT_TYPES = ['Introduction', 'CreativeDirection', 'ContractInvoicing'];

export function CreateAppointmentModal({
  selectedDate,
  selectedTime,
  onClose,
  onSubmit,
}: CreateAppointmentModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    type: 'Introduction',
    duration: 60,
    adminNotes: '',
    time: selectedTime || '11:00',
  });

  // Load clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_BASE_URL}/admin/clients`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setClients(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load clients:', err);
        setError('Failed to load clients. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.clientId) {
      setError('Please select a client');
      return;
    }

    setSubmitting(true);
    try {
      const scheduledAt = selectedDate
        ? format(selectedDate, 'yyyy-MM-dd') + 'T' + formData.time + ':00Z'
        : undefined;

      await onSubmit({
        clientId: formData.clientId,
        type: formData.type,
        duration: formData.duration,
        adminNotes: formData.adminNotes,
        scheduledAt,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Appointment Created!</h3>
            <p className="text-sm text-muted-foreground">
              Invitation has been sent to the client. They'll receive an email with the booking link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <CardTitle>Create Appointment</CardTitle>
          <button onClick={onClose} className="hover:bg-muted p-1 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Appointment Type */}
            <div>
              <Label htmlFor="type">Appointment Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded border border-input bg-background"
              >
                {APPOINTMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Client Selection */}
            <div>
              <Label htmlFor="client">Client *</Label>
              <div className="relative mt-1">
                <input
                  id="client"
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-input bg-background"
                />
                {searchTerm && filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-input rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, clientId: client.id });
                          setSearchTerm(client.name);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted border-b last:border-0"
                      >
                        <div className="font-medium">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {formData.clientId && (
                <div className="text-sm text-green-600 mt-1">
                  ✓ {clients.find((c) => c.id === formData.clientId)?.name}
                </div>
              )}
            </div>

            {/* Date & Time */}
            {selectedDate && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <div className="px-3 py-2 rounded border border-input bg-muted text-sm">
                    {format(selectedDate, 'EEE, MMM d, yyyy')}
                  </div>
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded border border-input bg-background"
                  />
                </div>
              </div>
            )}

            {/* Duration */}
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <input
                id="duration"
                type="number"
                min="15"
                max="240"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded border border-input bg-background"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Admin Notes (Optional)</Label>
              <textarea
                id="notes"
                value={formData.adminNotes}
                onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                placeholder="Any special instructions or context..."
                className="w-full mt-1 px-3 py-2 rounded border border-input bg-background resize-none h-20"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !formData.clientId} className="flex-1">
                {submitting ? 'Creating...' : 'Create & Send Invite'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
