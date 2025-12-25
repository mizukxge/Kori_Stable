import { PrismaClient, Appointment, CalendarCredential } from '@prisma/client';
import { google } from 'googleapis';
import { OAuthService } from './oauth.js';

const prisma = new PrismaClient();

interface CalendarEventData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  teamsLink?: string;
  clientEmail?: string;
}

export class CalendarSyncService {
  private oauthService: OAuthService;

  constructor(oauthService: OAuthService) {
    this.oauthService = oauthService;
  }

  /**
   * Sync appointment to calendar (creates event)
   */
  async syncAppointment(appointmentId: string, adminId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
      },
    });

    if (!appointment) {
      throw new Error(`Appointment not found: ${appointmentId}`);
    }

    if (!appointment.scheduledAt) {
      throw new Error('Appointment must be scheduled before syncing to calendar');
    }

    // Get admin's calendar credentials
    const googleCred = await this.oauthService.getCredential(adminId, 'google');
    const outlookCred = await this.oauthService.getCredential(adminId, 'outlook');

    // Sync to Google Calendar if enabled
    if (googleCred?.syncEnabled && googleCred?.autoSync) {
      try {
        await this.syncToGoogleCalendar(googleCred, {
          title: `${appointment.type} - ${appointment.client.name}`,
          description: this.buildEventDescription(appointment),
          startTime: appointment.scheduledAt,
          endTime: new Date(appointment.scheduledAt.getTime() + appointment.duration * 60000),
          teamsLink: appointment.teamsLink || undefined,
          clientEmail: appointment.client.email || undefined,
        });

        // Update lastSyncedAt
        await prisma.calendarCredential.update({
          where: { id: googleCred.id },
          data: { lastSyncedAt: new Date() },
        });
      } catch (error) {
        console.error(`Failed to sync appointment ${appointmentId} to Google Calendar:`, error);
        await prisma.calendarCredential.update({
          where: { id: googleCred.id },
          data: {
            lastError: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    // Sync to Outlook if enabled
    if (outlookCred?.syncEnabled && outlookCred?.autoSync) {
      try {
        await this.syncToOutlookCalendar(outlookCred, {
          title: `${appointment.type} - ${appointment.client.name}`,
          description: this.buildEventDescription(appointment),
          startTime: appointment.scheduledAt,
          endTime: new Date(appointment.scheduledAt.getTime() + appointment.duration * 60000),
          teamsLink: appointment.teamsLink || undefined,
          clientEmail: appointment.client.email || undefined,
        });

        // Update lastSyncedAt
        await prisma.calendarCredential.update({
          where: { id: outlookCred.id },
          data: { lastSyncedAt: new Date() },
        });
      } catch (error) {
        console.error(`Failed to sync appointment ${appointmentId} to Outlook:`, error);
        await prisma.calendarCredential.update({
          where: { id: outlookCred.id },
          data: {
            lastError: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  }

  /**
   * Sync to Google Calendar
   */
  private async syncToGoogleCalendar(credential: CalendarCredential, eventData: CalendarEventData): Promise<void> {
    const accessToken = await this.oauthService.ensureValidToken(credential);

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar('v3');
    const calendarId = credential.calendarId || 'primary';

    const eventBody = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: eventData.clientEmail
        ? [
            {
              email: eventData.clientEmail,
              displayName: 'Client',
              responseStatus: 'needsAction',
            },
          ]
        : undefined,
    };

    try {
      const response = await calendar.events.insert({
        auth,
        calendarId,
        requestBody: eventBody as any,
      });

      const eventId = response.data.id;
      if (!eventId) {
        throw new Error('Failed to create Google Calendar event - no event ID returned');
      }

      // Save to database
      await prisma.calendarEvent.create({
        data: {
          appointmentId: '', // Will be linked by caller
          provider: 'google',
          providerEventId: eventId,
          title: eventData.title,
          description: eventData.description,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          status: 'synced',
        },
      });
    } catch (error) {
      throw new Error(`Failed to sync to Google Calendar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sync to Outlook Calendar
   */
  private async syncToOutlookCalendar(credential: CalendarCredential, eventData: CalendarEventData): Promise<void> {
    const accessToken = await this.oauthService.ensureValidToken(credential);

    const eventBody = {
      subject: eventData.title,
      bodyPreview: eventData.description,
      body: {
        contentType: 'HTML',
        content: eventData.description || '',
      },
      start: {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: eventData.clientEmail
        ? [
            {
              emailAddress: {
                address: eventData.clientEmail,
                name: 'Client',
              },
              type: 'required',
            },
          ]
        : undefined,
      isOnlineMeeting: !!eventData.teamsLink,
      onlineMeetingProvider: eventData.teamsLink ? 'teamsForBusiness' : undefined,
    };

    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to create Outlook event: ${response.statusText}`);
      }

      const data = (await response.json()) as { id: string };

      if (!data.id) {
        throw new Error('Failed to create Outlook Calendar event - no event ID returned');
      }

      // Save to database
      await prisma.calendarEvent.create({
        data: {
          appointmentId: '', // Will be linked by caller
          provider: 'outlook',
          providerEventId: data.id,
          title: eventData.title,
          description: eventData.description,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          status: 'synced',
        },
      });
    } catch (error) {
      throw new Error(`Failed to sync to Outlook Calendar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update calendar event when appointment is rescheduled
   */
  async updateAppointment(appointmentId: string, adminId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
      },
    });

    if (!appointment) {
      throw new Error(`Appointment not found: ${appointmentId}`);
    }

    if (!appointment.scheduledAt) {
      throw new Error('Appointment must be scheduled before updating calendar');
    }

    // Find existing calendar events for this appointment
    const existingEvents = await prisma.calendarEvent.findMany({
      where: { appointmentId },
    });

    if (existingEvents.length === 0) {
      // If no events exist, create them instead
      return this.syncAppointment(appointmentId, adminId);
    }

    // Get admin's calendar credentials
    const googleCred = await this.oauthService.getCredential(adminId, 'google');
    const outlookCred = await this.oauthService.getCredential(adminId, 'outlook');

    const eventData = {
      title: `${appointment.type} - ${appointment.client.name}`,
      description: this.buildEventDescription(appointment),
      startTime: appointment.scheduledAt,
      endTime: new Date(appointment.scheduledAt.getTime() + appointment.duration * 60000),
      teamsLink: appointment.teamsLink || undefined,
      clientEmail: appointment.client.email || undefined,
    };

    // Update Google Calendar events
    const googleEvents = existingEvents.filter((e) => e.provider === 'google');
    if (googleCred?.syncEnabled && googleEvents.length > 0) {
      try {
        for (const event of googleEvents) {
          await this.updateGoogleCalendarEvent(googleCred, event.providerEventId, eventData);
          await prisma.calendarEvent.update({
            where: { id: event.id },
            data: {
              title: eventData.title,
              description: eventData.description,
              startTime: eventData.startTime,
              endTime: eventData.endTime,
              lastSyncedAt: new Date(),
            },
          });
        }

        await prisma.calendarCredential.update({
          where: { id: googleCred.id },
          data: { lastSyncedAt: new Date() },
        });
      } catch (error) {
        console.error(`Failed to update Google Calendar event for appointment ${appointmentId}:`, error);
        await prisma.calendarCredential.update({
          where: { id: googleCred.id },
          data: {
            lastError: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    // Update Outlook Calendar events
    const outlookEvents = existingEvents.filter((e) => e.provider === 'outlook');
    if (outlookCred?.syncEnabled && outlookEvents.length > 0) {
      try {
        for (const event of outlookEvents) {
          await this.updateOutlookCalendarEvent(outlookCred, event.providerEventId, eventData);
          await prisma.calendarEvent.update({
            where: { id: event.id },
            data: {
              title: eventData.title,
              description: eventData.description,
              startTime: eventData.startTime,
              endTime: eventData.endTime,
              lastSyncedAt: new Date(),
            },
          });
        }

        await prisma.calendarCredential.update({
          where: { id: outlookCred.id },
          data: { lastSyncedAt: new Date() },
        });
      } catch (error) {
        console.error(`Failed to update Outlook Calendar event for appointment ${appointmentId}:`, error);
        await prisma.calendarCredential.update({
          where: { id: outlookCred.id },
          data: {
            lastError: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  }

  /**
   * Delete calendar events when appointment is cancelled/no-show
   */
  async deleteAppointment(appointmentId: string): Promise<void> {
    // Find existing calendar events for this appointment
    const existingEvents = await prisma.calendarEvent.findMany({
      where: { appointmentId },
    });

    if (existingEvents.length === 0) {
      return; // Nothing to delete
    }

    // Get all credentials that might own these events (by provider and sync status)
    const googleCredentials = await prisma.calendarCredential.findMany({
      where: {
        provider: 'google',
        syncEnabled: true,
      },
    });

    const outlookCredentials = await prisma.calendarCredential.findMany({
      where: {
        provider: 'outlook',
        syncEnabled: true,
      },
    });

    // Delete from Google Calendar
    const googleEvents = existingEvents.filter((e) => e.provider === 'google');
    for (const event of googleEvents) {
      try {
        // Try to delete from first available Google credential
        if (googleCredentials.length > 0) {
          await this.deleteGoogleCalendarEvent(googleCredentials[0], event.providerEventId);
        }

        await prisma.calendarEvent.delete({
          where: { id: event.id },
        });
      } catch (error) {
        console.error(`Failed to delete Google Calendar event ${event.providerEventId}:`, error);
        // Continue with other deletions even if one fails
      }
    }

    // Delete from Outlook Calendar
    const outlookEvents = existingEvents.filter((e) => e.provider === 'outlook');
    for (const event of outlookEvents) {
      try {
        // Try to delete from first available Outlook credential
        if (outlookCredentials.length > 0) {
          await this.deleteOutlookCalendarEvent(outlookCredentials[0], event.providerEventId);
        }

        await prisma.calendarEvent.delete({
          where: { id: event.id },
        });
      } catch (error) {
        console.error(`Failed to delete Outlook Calendar event ${event.providerEventId}:`, error);
        // Continue with other deletions even if one fails
      }
    }
  }

  /**
   * Build event description from appointment details
   */
  private buildEventDescription(appointment: Appointment & { client: { name: string; email?: string | null } }): string {
    const lines: string[] = [];

    lines.push(`Appointment: ${appointment.type}`);
    lines.push(`Client: ${appointment.client.name}`);

    if (appointment.adminNotes) {
      lines.push(`\nNotes: ${appointment.adminNotes}`);
    }

    if (appointment.teamsLink) {
      lines.push(`\nMeeting Link: ${appointment.teamsLink}`);
    }

    if (appointment.recordingConsentGiven) {
      lines.push('\nRecording consent: Given');
    }

    return lines.join('\n');
  }

  /**
   * Update Google Calendar event
   */
  private async updateGoogleCalendarEvent(
    credential: CalendarCredential,
    eventId: string,
    eventData: CalendarEventData
  ): Promise<void> {
    const accessToken = await this.oauthService.ensureValidToken(credential);

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar('v3');
    const calendarId = credential.calendarId || 'primary';

    const eventBody = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: eventData.clientEmail
        ? [
            {
              email: eventData.clientEmail,
              displayName: 'Client',
              responseStatus: 'needsAction',
            },
          ]
        : undefined,
    };

    try {
      await calendar.events.update({
        auth,
        calendarId,
        eventId,
        requestBody: eventBody as any,
      });
    } catch (error) {
      throw new Error(`Failed to update Google Calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update Outlook Calendar event
   */
  private async updateOutlookCalendarEvent(
    credential: CalendarCredential,
    eventId: string,
    eventData: CalendarEventData
  ): Promise<void> {
    const accessToken = await this.oauthService.ensureValidToken(credential);

    const eventBody = {
      subject: eventData.title,
      bodyPreview: eventData.description,
      body: {
        contentType: 'HTML',
        content: eventData.description || '',
      },
      start: {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: eventData.clientEmail
        ? [
            {
              emailAddress: {
                address: eventData.clientEmail,
                name: 'Client',
              },
              type: 'required',
            },
          ]
        : undefined,
      isOnlineMeeting: !!eventData.teamsLink,
      onlineMeetingProvider: eventData.teamsLink ? 'teamsForBusiness' : undefined,
    };

    try {
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to update Outlook event: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to update Outlook Calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete Google Calendar event
   */
  private async deleteGoogleCalendarEvent(credential: CalendarCredential, eventId: string): Promise<void> {
    const accessToken = await this.oauthService.ensureValidToken(credential);

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar('v3');
    const calendarId = credential.calendarId || 'primary';

    try {
      await calendar.events.delete({
        auth,
        calendarId,
        eventId,
      });
    } catch (error) {
      throw new Error(`Failed to delete Google Calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete Outlook Calendar event
   */
  private async deleteOutlookCalendarEvent(credential: CalendarCredential, eventId: string): Promise<void> {
    const accessToken = await this.oauthService.ensureValidToken(credential);

    try {
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete Outlook event: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete Outlook Calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
