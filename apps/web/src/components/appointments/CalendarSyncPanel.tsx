import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface OAuthStatus {
  google: {
    connected: boolean;
    email?: string;
    calendarId?: string;
    lastError?: string | null;
  };
  outlook: {
    connected: boolean;
    email?: string;
    lastError?: string | null;
  };
}

interface CalendarSyncSettings {
  googleCalendarEnabled: boolean;
  outlookCalendarEnabled: boolean;
}

interface CalendarSyncPanelProps {
  settings: CalendarSyncSettings;
  onConnect?: (provider: 'google' | 'outlook') => void;
  onDisconnect?: (provider: 'google' | 'outlook') => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function CalendarSyncPanel({
  settings,
  onConnect,
  onDisconnect,
}: CalendarSyncPanelProps) {
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState<'google' | 'outlook' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch OAuth status on mount and when URL params change
  useEffect(() => {
    fetchOAuthStatus();

    // Check for OAuth success/error in URL params
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const message = params.get('message');
    const errorParam = params.get('error');

    if (success) {
      setSuccessMessage(message || 'Connected successfully!');
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refetch status after successful connection
      setTimeout(() => fetchOAuthStatus(), 1000);
    } else if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchOAuthStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/oauth/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch OAuth status: ${response.statusText}`);
      }

      const data = (await response.json()) as OAuthStatus;
      setOauthStatus(data);
    } catch (err) {
      console.error('Error fetching OAuth status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogle = () => {
    // Redirect to OAuth authorize endpoint
    const redirectUrl = encodeURIComponent(window.location.href);
    window.location.href = `${API_BASE_URL}/auth/oauth/google/authorize?redirectUrl=${redirectUrl}`;
  };

  const handleConnectOutlook = () => {
    // Redirect to OAuth authorize endpoint
    const redirectUrl = encodeURIComponent(window.location.href);
    window.location.href = `${API_BASE_URL}/auth/oauth/outlook/authorize?redirectUrl=${redirectUrl}`;
  };

  const handleDisconnect = async (provider: 'google' | 'outlook') => {
    try {
      setIsDisconnecting(provider);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/oauth/${provider}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to disconnect: ${response.statusText}`);
      }

      setSuccessMessage(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar disconnected`);
      onDisconnect?.(provider);
      await fetchOAuthStatus();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect calendar');
    } finally {
      setIsDisconnecting(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar Integrations</CardTitle>
          <CardDescription>Sync appointments with your personal calendar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const googleConnected = oauthStatus?.google.connected || false;
  const outlookConnected = oauthStatus?.outlook.connected || false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar Integrations</CardTitle>
        <CardDescription>Sync appointments with your personal calendar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Connection Error</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Success!</p>
              <p className="text-xs mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Google Calendar */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-red-400 rounded-lg flex items-center justify-center text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Google Calendar</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically add appointments to your Google Calendar
                </p>
              </div>
            </div>
            {googleConnected && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
          </div>

          {googleConnected ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-2">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <span>Connected to Google Calendar</span>
              </div>
              {oauthStatus?.google.email && (
                <p className="text-xs text-green-700">Account: {oauthStatus.google.email}</p>
              )}
              <p className="text-xs text-green-700">
                Appointments will automatically sync when confirmed.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect('google')}
                disabled={isDisconnecting === 'google'}
                className="text-red-600 hover:text-red-700"
              >
                {isDisconnecting === 'google' ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConnectGoogle}
              className="w-full"
              variant="outline"
            >
              Connect Google Calendar
            </Button>
          )}

          {oauthStatus?.google.lastError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">
              Last sync error: {oauthStatus.google.lastError}
            </div>
          )}
        </div>

        {/* Outlook Calendar */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Outlook / Office 365</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically add appointments to your Outlook calendar
                </p>
              </div>
            </div>
            {outlookConnected && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
          </div>

          {outlookConnected ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-2">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <span>Connected to Outlook Calendar</span>
              </div>
              {oauthStatus?.outlook.email && (
                <p className="text-xs text-green-700">Account: {oauthStatus.outlook.email}</p>
              )}
              <p className="text-xs text-green-700">
                Appointments will automatically sync when confirmed.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect('outlook')}
                disabled={isDisconnecting === 'outlook'}
                className="text-red-600 hover:text-red-700"
              >
                {isDisconnecting === 'outlook' ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConnectOutlook}
              className="w-full"
              variant="outline"
            >
              Connect Outlook Calendar
            </Button>
          )}

          {oauthStatus?.outlook.lastError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">
              Last sync error: {oauthStatus.outlook.lastError}
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex items-start gap-3">
          <Lock className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Your data is secure</p>
            <p className="text-xs mt-1">
              We never store your calendar credentials. OAuth tokens are encrypted and securely stored on our servers.
              We only request permission to create and manage calendar events on your behalf.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
