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
 * Real Microsoft Teams Provider (Stub for v0.1)
 * To be implemented in Slice 4 when Teams API credentials are available
 * Uses MS Graph API to create Teams meetings
 */
export class MicrosoftTeamsProvider implements MeetingProvider {
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;

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

  async createMeeting(config: CreateMeetingConfig): Promise<CreateMeetingResult> {
    // TODO: Implement real Teams API integration via MS Graph
    // For now, fall back to fake provider
    console.warn('[TEAMS] Real Teams integration not yet implemented (v0.1)');

    const fakeProvider = new FakeMeetingProvider();
    return fakeProvider.createMeeting(config);
  }

  async cancelMeeting(meetingId: string): Promise<void> {
    // TODO: Implement real Teams API integration
    console.warn('[TEAMS] Real Teams cancellation not yet implemented (v0.1)');
  }

  async getRecording(meetingId: string): Promise<string | null> {
    // TODO: Implement real Teams API integration to fetch recording URL
    return null;
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
