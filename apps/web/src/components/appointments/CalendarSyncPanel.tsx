import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface CalendarSyncSettings {
  googleCalendarEnabled: boolean;
  outlookCalendarEnabled: boolean;
}

interface CalendarSyncPanelProps {
  settings: CalendarSyncSettings;
  onConnect?: (provider: 'google' | 'outlook') => void;
  onDisconnect?: (provider: 'google' | 'outlook') => void;
}

export function CalendarSyncPanel({
  settings,
  onConnect,
  onDisconnect,
}: CalendarSyncPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleConnect = (provider: 'google' | 'outlook') => {
    setIsLoading(true);
    setShowComingSoon(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowComingSoon(false);
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar Integrations</CardTitle>
        <CardDescription>
          Sync appointments with your personal calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coming Soon Notice */}
        {showComingSoon && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Calendar sync coming soon!</p>
              <p className="text-xs mt-1">OAuth integration is being set up. You'll be able to connect your Google Calendar and Outlook accounts shortly.</p>
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
            {settings.googleCalendarEnabled && (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            )}
          </div>

          {settings.googleCalendarEnabled ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-2">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <span>Connected to Google Calendar</span>
              </div>
              <p className="text-xs text-green-700">
                Appointments will automatically sync when confirmed.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDisconnect?.('google')}
                className="text-red-600 hover:text-red-700"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => handleConnect('google')}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
            </Button>
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
            {settings.outlookCalendarEnabled && (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            )}
          </div>

          {settings.outlookCalendarEnabled ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-2">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <span>Connected to Outlook Calendar</span>
              </div>
              <p className="text-xs text-green-700">
                Appointments will automatically sync when confirmed.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDisconnect?.('outlook')}
                className="text-red-600 hover:text-red-700"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => handleConnect('outlook')}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? 'Connecting...' : 'Connect Outlook'}
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex items-start gap-3">
          <Lock className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Your data is secure</p>
            <p className="text-xs mt-1">
              We never store your calendar credentials. We only request permission to create calendar events on your behalf.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
