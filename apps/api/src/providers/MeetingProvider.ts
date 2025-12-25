/**
 * MeetingProvider - Abstraction for meeting creation (Teams, Zoom, etc.)
 * Supports both real and fake implementations for dev/test
 */

export interface CreateMeetingConfig {
  subject: string;
  startTime: Date;
  duration: number; // minutes
  attendees: Array<{
    name: string;
    email: string;
  }>;
  description?: string;
}

export interface CreateMeetingResult {
  meetingId: string;
  joinUrl: string;
  provider: string;
}

export interface MeetingProvider {
  createMeeting(config: CreateMeetingConfig): Promise<CreateMeetingResult>;
  cancelMeeting(meetingId: string): Promise<void>;
  getRecording(meetingId: string): Promise<string | null>;
}

/**
 * Fake Meeting Provider - Returns synthetic URLs for dev/test
 * Useful when Teams credentials aren't available
 */
export class FakeMeetingProvider implements MeetingProvider {
  async createMeeting(config: CreateMeetingConfig): Promise<CreateMeetingResult> {
    const meetingId = this.generateMeetingId();
    const joinUrl = this.generateFakeTeamsUrl(meetingId);

    console.log(`[FAKE TEAMS] Created meeting: ${config.subject}`);
    console.log(`  Meeting ID: ${meetingId}`);
    console.log(`  Join URL: ${joinUrl}`);
    console.log(`  Start: ${config.startTime.toISOString()}`);
    console.log(`  Attendees: ${config.attendees.map((a) => a.email).join(', ')}`);

    return {
      meetingId,
      joinUrl,
      provider: 'fake-teams',
    };
  }

  async cancelMeeting(meetingId: string): Promise<void> {
    console.log(`[FAKE TEAMS] Cancelled meeting: ${meetingId}`);
  }

  async getRecording(meetingId: string): Promise<string | null> {
    // Fake implementation - no recordings available
    return null;
  }

  private generateMeetingId(): string {
    return `fake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFakeTeamsUrl(meetingId: string): string {
    return `https://teams.fake.test/meeting/${meetingId}`;
  }
}

/**
 * Real Microsoft Teams Provider
 * Uses Microsoft Graph API to create and manage Teams meetings
 * Requires Azure app registration with the following permissions:
 * - OnlineMeetings.ReadWrite
 * - User.Read (delegated)
 */
export class MicrosoftTeamsProvider implements MeetingProvider {
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    this.clientId = process.env.TEAMS_CLIENT_ID || '';
    this.clientSecret = process.env.TEAMS_CLIENT_SECRET || '';
    this.tenantId = process.env.TEAMS_TENANT_ID || '';

    if (!this.clientId || !this.clientSecret || !this.tenantId) {
      throw new Error(
        'Microsoft Teams credentials not found in environment. Set TEAMS_CLIENT_ID, TEAMS_CLIENT_SECRET, and TEAMS_TENANT_ID.'
      );
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get Teams access token: ${error}`);
      }

      const data = (await response.json()) as {
        access_token: string;
        expires_in: number;
      };

      this.accessToken = data.access_token;
      // Set expiry 5 minutes before actual expiry
      this.tokenExpiresAt = new Date(Date.now() + (data.expires_in - 300) * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to obtain Teams access token:', error);
      throw error;
    }
  }

  async createMeeting(config: CreateMeetingConfig): Promise<CreateMeetingResult> {
    try {
      const accessToken = await this.getAccessToken();

      // Calculate end time
      const endTime = new Date(config.startTime.getTime() + config.duration * 60000);

      // Build the meeting request body
      const meetingBody = {
        startDateTime: config.startTime.toISOString(),
        endDateTime: endTime.toISOString(),
        subject: config.subject,
        description: config.description,
        allowedPresenters: 'everyone' as const,
        isEntryExitAnnouncementEnabled: true,
        recordAutomatically: true,
        participants: {
          attendees: config.attendees.map((attendee) => ({
            identity: {
              user: {
                id: attendee.email,
              },
            },
            upn: attendee.email,
            role: 'attendee' as const,
          })),
        },
      };

      // Create meeting via Graph API
      const response = await fetch('https://graph.microsoft.com/v1.0/me/onlineMeetings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to create Teams meeting: ${JSON.stringify(error)}`
        );
      }

      const meeting = (await response.json()) as {
        id: string;
        joinWebUrl: string;
      };

      console.log(`✅ Created Teams meeting: ${config.subject}`);
      console.log(`  Meeting ID: ${meeting.id}`);
      console.log(`  Join URL: ${meeting.joinWebUrl}`);

      return {
        meetingId: meeting.id,
        joinUrl: meeting.joinWebUrl,
        provider: 'microsoft-teams',
      };
    } catch (error) {
      console.error('❌ Error creating Teams meeting:', error);
      throw error;
    }
  }

  async cancelMeeting(meetingId: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        const error = await response.text();
        throw new Error(`Failed to cancel Teams meeting: ${error}`);
      }

      console.log(`✅ Cancelled Teams meeting: ${meetingId}`);
    } catch (error) {
      console.error('❌ Error cancelling Teams meeting:', error);
      throw error;
    }
  }

  async getRecording(meetingId: string): Promise<string | null> {
    try {
      const accessToken = await this.getAccessToken();

      // Get the meeting transcripts/recordings
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}/recordings`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.warn(`Could not fetch recordings for meeting ${meetingId}`);
        return null;
      }

      const data = (await response.json()) as {
        value: Array<{
          id: string;
          contentUrl: string;
          createdDateTime: string;
        }>;
      };

      // Return the first recording if available
      if (data.value && data.value.length > 0) {
        console.log(`📹 Found recording for meeting ${meetingId}`);
        return data.value[0].contentUrl;
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching Teams recording:', error);
      return null;
    }
  }
}

/**
 * Factory function to get the appropriate meeting provider
 */
export function getMeetingProvider(): MeetingProvider {
  const provider = process.env.MEETING_PROVIDER || 'fake';

  switch (provider) {
    case 'teams':
      try {
        return new MicrosoftTeamsProvider();
      } catch (error) {
        console.warn('Failed to initialize Teams provider, falling back to fake provider');
        return new FakeMeetingProvider();
      }
    case 'fake':
    default:
      return new FakeMeetingProvider();
  }
}

