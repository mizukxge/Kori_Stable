import { z } from 'zod';

/**
 * OAuth Authorization Request
 * Initiates OAuth flow to a provider
 */
export const oauthAuthorizeSchema = z.object({
  provider: z.enum(['google', 'outlook']),
  state: z.string().optional(), // Generated and stored in session
});

export type OAuthAuthorizeRequest = z.infer<typeof oauthAuthorizeSchema>;

/**
 * OAuth Callback Handler
 * Receives authorization code from provider after user grants permission
 */
export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type OAuthCallbackRequest = z.infer<typeof oauthCallbackSchema>;

/**
 * Calendar Credential Response
 * Data returned after successful OAuth
 */
export const calendarCredentialResponseSchema = z.object({
  id: z.string(),
  provider: z.enum(['google', 'outlook']),
  syncEnabled: z.boolean(),
  autoSync: z.boolean(),
  calendarId: z.string().optional(),
  lastSyncedAt: z.date().nullable(),
  lastError: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CalendarCredentialResponse = z.infer<typeof calendarCredentialResponseSchema>;

/**
 * Calendar Credential List Response
 */
export const calendarCredentialsListSchema = z.object({
  credentials: z.array(calendarCredentialResponseSchema),
});

export type CalendarCredentialsList = z.infer<typeof calendarCredentialsListSchema>;

/**
 * Disconnect OAuth Provider
 */
export const oauthDisconnectSchema = z.object({
  provider: z.enum(['google', 'outlook']),
});

export type OAuthDisconnectRequest = z.infer<typeof oauthDisconnectSchema>;

/**
 * Google OAuth Token Response
 * Response from Google's token endpoint
 */
export const googleTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string(),
  token_type: z.string(),
  id_token: z.string().optional(),
});

export type GoogleTokenResponse = z.infer<typeof googleTokenResponseSchema>;

/**
 * Microsoft OAuth Token Response
 * Response from Microsoft's token endpoint
 */
export const microsoftTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string(),
  token_type: z.string(),
  id_token: z.string().optional(),
});

export type MicrosoftTokenResponse = z.infer<typeof microsoftTokenResponseSchema>;

/**
 * OAuth User Info from Google
 */
export const googleUserInfoSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().optional(),
});

export type GoogleUserInfo = z.infer<typeof googleUserInfoSchema>;

/**
 * OAuth User Info from Microsoft
 */
export const microsoftUserInfoSchema = z.object({
  id: z.string(),
  userPrincipalName: z.string().email(),
  displayName: z.string(),
  mailboxSettings: z
    .object({
      timeZone: z.string(),
    })
    .optional(),
});

export type MicrosoftUserInfo = z.infer<typeof microsoftUserInfoSchema>;

/**
 * Calendar Event Sync Request
 */
export const calendarEventSyncSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  provider: z.enum(['google', 'outlook']).optional(), // If omitted, sync to all enabled providers
});

export type CalendarEventSyncRequest = z.infer<typeof calendarEventSyncSchema>;

/**
 * Calendar Event Sync Response
 */
export const calendarEventSyncResponseSchema = z.object({
  success: z.boolean(),
  provider: z.string(),
  eventId: z.string(),
  message: z.string(),
});

export type CalendarEventSyncResponse = z.infer<typeof calendarEventSyncResponseSchema>;

/**
 * Sync Settings Update Request
 */
export const calendarSyncSettingsSchema = z.object({
  provider: z.enum(['google', 'outlook']),
  syncEnabled: z.boolean().optional(),
  autoSync: z.boolean().optional(),
});

export type CalendarSyncSettingsRequest = z.infer<typeof calendarSyncSettingsSchema>;
