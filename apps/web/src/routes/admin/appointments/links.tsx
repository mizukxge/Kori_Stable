import React, { useState, useEffect } from 'react';
import { createAppointmentInvitation, getClients, type Client } from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Copy, Plus, Mail, Check } from 'lucide-react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

export default function AppointmentLinksPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [createdLink, setCreatedLink] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedType, setSelectedType] = useState('Introduction');
  const [expiresInDays, setExpiresInDays] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await getClients({ limit: 100 });
        setClients(response.data);
      } catch (err) {
        console.error('Failed to load clients:', err);
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  const handleCreateInvitation = async () => {
    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await createAppointmentInvitation({
        clientId: selectedClientId,
        type: selectedType,
        expiresInDays,
      });

      setCreatedLink(response.data);
      setSelectedClientId('');
      setSelectedType('Introduction');
      setExpiresInDays(3);
      setShowForm(false);
    } catch (err) {
      console.error('Error creating invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, linkId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(linkId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointment Links</h1>
          <p className="text-muted-foreground">Create and manage client booking invitations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Invitation
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Booking Invitation</CardTitle>
            <CardDescription>Send a client a personalized booking link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="client">Client *</Label>
              <select
                id="client"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full mt-2 px-4 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="type">Appointment Type *</Label>
              <select
                id="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full mt-2 px-4 py-2 rounded-lg border border-input bg-background"
              >
                <option value="Introduction">Introduction Call</option>
                <option value="CreativeDirection">Creative Direction</option>
                <option value="ContractInvoicing">Contract/Invoicing</option>
              </select>
            </div>

            <div>
              <Label htmlFor="expires">Link Expires In (Days)</Label>
              <select
                id="expires"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value, 10))}
                className="w-full mt-2 px-4 py-2 rounded-lg border border-input bg-background"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateInvitation}
                disabled={submitting || !selectedClientId}
                className="flex-1"
              >
                {submitting ? 'Creating...' : 'Create Invitation'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Created Link Display */}
      {createdLink && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <CardTitle>Invitation Created!</CardTitle>
            </div>
            <CardDescription>Share this link with {createdLink.client?.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Booking Link</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={createdLink.bookingUrl}
                  readOnly
                  className="flex-1 px-4 py-2 rounded-lg border border-input bg-background font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(createdLink.bookingUrl, createdLink.id)}
                  className="flex items-center gap-2"
                >
                  {copiedLink === createdLink.id ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="text-blue-800">
                <strong>Expires:</strong> {new Date(createdLink.expiresAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 flex-1"
                onClick={() => {
                  const mailtoLink = `mailto:${createdLink.client?.email}?subject=Book%20Your%20Call%20with%20Mizu%20Studio&body=${encodeURIComponent(
                    `Hi ${createdLink.client?.name},\n\nHere's your personalized booking link:\n\n${createdLink.bookingUrl}\n\nPlease select a time that works for you.\n\nBest regards,\nMizu Studio`
                  )}`;
                  window.location.href = mailtoLink;
                }}
              >
                <Mail className="h-4 w-4" />
                Send Email
              </Button>
              <Button
                size="sm"
                onClick={() => setCreatedLink(null)}
              >
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Future: Active Links List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Links</CardTitle>
          <CardDescription>Coming soon: View and manage all active invitation links</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Track all invitation links, expiry dates, and booking status here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
