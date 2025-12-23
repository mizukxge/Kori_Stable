import { PrismaClient, AdminUser, CalendarCredential } from '@prisma/client';
import { google } from 'googleapis';
import { Client as GraphClient } from '@microsoft/microsoft-graph-client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { GoogleTokenResponse, MicrosoftTokenResponse, GoogleUserInfo, MicrosoftUserInfo } from '../schemas/oauth.js';

const prisma = new PrismaClient();

interface OAuthConfig {
  googleClientId: string;
  googleClientSecret: string;
  googleRedirectUri: string;
  microsoftClientId: string;
  microsoftClientSecret: string;
  microsoftRedirectUri: string;
  microsoftTenant: string;
  appUrl: string;
}

export class OAuthService {
  private config: OAuthConfig;
  private googleOAuth2Client: InstanceType<typeof google.auth.OAuth2>;

  constructor(config: OAuthConfig) {
    this.config = config;
    this.googleOAuth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleRedirectUri
    );
  }

  /**
   * Generate Google OAuth authorization URL
   */
  generateGoogleAuthUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  /**
   * Generate Microsoft OAuth authorization URL
   */
  generateMicrosoftAuthUrl(state: string): string {
    const scopes = [
      'https://graph.microsoft.com/Calendars.ReadWrite',
      'https://graph.microsoft.com/User.Read',
    ];

    const params = new URLSearchParams({
      client_id: this.config.microsoftClientId,
      redirect_uri: this.config.microsoftRedirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      response_mode: 'query',
      prompt: 'consent', // Force consent to get refresh token
    });

    return `https://login.microsoftonline.com/${this.config.microsoftTenant}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange Google authorization code for tokens
   */
  async exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
    try {
      const { tokens } = await this.googleOAuth2Client.getToken(code);
      return {
        access_token: tokens.access_token!,
        expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
        refresh_token: tokens.refresh_token || undefined,
        scope: tokens.scope || '',
        token_type: 'Bearer',
        id_token: tokens.id_token || undefined,
      };
    } catch (error) {
      throw new Error(`Failed to exchange Google authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Exchange Microsoft authorization code for tokens
   */
  async exchangeMicrosoftCode(code: string): Promise<MicrosoftTokenResponse> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.microsoftClientId,
        client_secret: this.config.microsoftClientSecret,
        code,
        redirect_uri: this.config.microsoftRedirectUri,
        grant_type: 'authorization_code',
        scope: 'https://graph.microsoft.com/.default',
      });

      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        access_token: string;
        expires_in: number;
        refresh_token?: string;
        scope: string;
        token_type: string;
        id_token?: string;
      };

      return {
        access_token: data.access_token,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        scope: data.scope,
        token_type: data.token_type,
        id_token: data.id_token,
      };
    } catch (error) {
      throw new Error(`Failed to exchange Microsoft authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Google user info and calendar ID
   */
  async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo & { calendars: { id: string; name: string }[] }> {
    try {
      this.googleOAuth2Client.setCredentials({ access_token: accessToken });

      // Get user info
      const oauth2 = google.oauth2('v2');
      const userInfoResponse = await oauth2.userinfo.get({ auth: this.googleOAuth2Client });
      const userInfo = userInfoResponse.data as GoogleUserInfo;

      // Get calendar list
      const calendar = google.calendar('v3');
      const calendarResponse = await calendar.calendarList.list({ auth: this.googleOAuth2Client });
      const calendars = (calendarResponse.data.items || []).map((cal) => ({
        id: cal.id || '',
        name: cal.summary || 'Untitled Calendar',
      }));

      return {
        ...userInfo,
        calendars,
      };
    } catch (error) {
      throw new Error(`Failed to get Google user info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Microsoft user info
   */
  async getMicrosoftUserInfo(accessToken: string): Promise<MicrosoftUserInfo> {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=id,userPrincipalName,displayName,mailboxSettings', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      const user = (await response.json()) as MicrosoftUserInfo;
      return user;
    } catch (error) {
      throw new Error(`Failed to get Microsoft user info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh Google access token
   */
  async refreshGoogleToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      this.googleOAuth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.googleOAuth2Client.refreshAccessToken();

      return {
        accessToken: credentials.access_token!,
        expiresIn: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600,
      };
    } catch (error) {
      throw new Error(`Failed to refresh Google token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh Microsoft access token
   */
  async refreshMicrosoftToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.microsoftClientId,
        client_secret: this.config.microsoftClientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/.default',
      });

      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        access_token: string;
        expires_in: number;
      };

      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      throw new Error(`Failed to refresh Microsoft token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save calendar credential to database
   */
  async saveCredential(
    adminId: string,
    provider: 'google' | 'outlook',
    accessToken: string,
    refreshToken: string | null,
    idToken: string | null,
    expiresAt: Date | null,
    calendarId: string | null,
    providerUserId: string | null,
    scopes: string[]
  ): Promise<CalendarCredential> {
    // Delete existing credential for this provider to ensure only one per provider
    await prisma.calendarCredential.deleteMany({
      where: {
        adminUserId: adminId,
        provider,
      },
    });

    // Create new credential
    return prisma.calendarCredential.create({
      data: {
        provider,
        adminUserId: adminId,
        accessToken,
        refreshToken,
        idToken,
        expiresAt,
        calendarId,
        providerUserId,
        scopes,
        syncEnabled: true,
        autoSync: true,
      },
    });
  }

  /**
   * Get credential for a provider
   */
  async getCredential(adminId: string, provider: 'google' | 'outlook'): Promise<CalendarCredential | null> {
    return prisma.calendarCredential.findUnique({
      where: {
        provider_adminUserId: {
          provider,
          adminUserId: adminId,
        },
      },
    });
  }

  /**
   * Check if token needs refresh and refresh if necessary
   */
  async ensureValidToken(credential: CalendarCredential): Promise<string> {
    if (!credential.expiresAt || credential.expiresAt > new Date()) {
      return credential.accessToken;
    }

    if (!credential.refreshToken) {
      throw new Error('Token expired and no refresh token available');
    }

    try {
      let newAccessToken: string;
      let expiresIn: number;

      if (credential.provider === 'google') {
        const result = await this.refreshGoogleToken(credential.refreshToken);
        newAccessToken = result.accessToken;
        expiresIn = result.expiresIn;
      } else {
        const result = await this.refreshMicrosoftToken(credential.refreshToken);
        newAccessToken = result.accessToken;
        expiresIn = result.expiresIn;
      }

      // Update credential with new token
      const expiresAt = new Date(Date.now() + expiresIn * 1000);
      await prisma.calendarCredential.update({
        where: { id: credential.id },
        data: {
          accessToken: newAccessToken,
          expiresAt,
        },
      });

      return newAccessToken;
    } catch (error) {
      // Log error and update credential with error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await prisma.calendarCredential.update({
        where: { id: credential.id },
        data: {
          lastError: errorMessage,
          syncEnabled: false, // Disable sync on token failure
        },
      });
      throw error;
    }
  }

  /**
   * Disconnect/revoke calendar credential
   */
  async disconnect(adminId: string, provider: 'google' | 'outlook'): Promise<void> {
    // Get the credential
    const credentials = await prisma.calendarCredential.findUnique({
      where: {
        provider_adminUserId: {
          provider,
          adminUserId: adminId,
        },
      },
    });

    if (!credentials) {
      return;
    }

    // Try to revoke token if provider supports it
    try {
      if (provider === 'google' && credentials.accessToken) {
        // Google token revocation
        await fetch(`https://oauth2.googleapis.com/revoke?token=${credentials.accessToken}`, {
          method: 'POST',
        }).catch(() => {
          // Ignore revocation errors
        });
      }
    } catch {
      // Ignore revocation errors
    }

    // Delete credential and related calendar events
    await prisma.calendarCredential.delete({
      where: { id: credentials.id },
    });
  }
}

/**
 * Generate CSRF state token
 */
export function generateStateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify state token
 */
export function verifyStateToken(token: string, storedToken: string): boolean {
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken));
}
