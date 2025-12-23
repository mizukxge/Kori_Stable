import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { OAuthService, generateStateToken, verifyStateToken } from '../services/oauth.js';
import { CalendarSyncService } from '../services/calendarSync.js';
import { calendarSyncSettingsSchema } from '../schemas/oauth.js';
import { requireAdmin } from '../middleware/auth.js';

const prisma = new PrismaClient();

const oauthService = new OAuthService({
  googleClientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3001/auth/oauth/google/callback',
  microsoftClientId: process.env.MICROSOFT_OAUTH_CLIENT_ID || '',
  microsoftClientSecret: process.env.MICROSOFT_OAUTH_CLIENT_SECRET || '',
  microsoftRedirectUri: process.env.MICROSOFT_OAUTH_REDIRECT_URI || 'http://localhost:3001/auth/oauth/outlook/callback',
  microsoftTenant: process.env.MICROSOFT_OAUTH_TENANT || 'common',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
});

export async function oauthRoutes(fastify: FastifyInstance) {
  /**
   * GET /auth/oauth/google/authorize
   */
  fastify.get('/auth/oauth/google/authorize', { onRequest: requireAdmin }, async (request, reply) => {
    const adminId = (request.user as any)?.id;
    if (!adminId) return reply.code(401).send({ error: 'Unauthorized' });

    const redirectUrl = (request.query as any).redirectUrl;
    const state = generateStateToken();

    // @ts-ignore - session is added by @fastify/session plugin
    request.session.oauthState = state;
    // @ts-ignore
    request.session.oauthRedirectUrl = redirectUrl || `${process.env.APP_URL || 'http://localhost:3000'}/admin/appointments/settings`;

    const authUrl = oauthService.generateGoogleAuthUrl(state);
    return reply.redirect(authUrl);
  });

  /**
   * GET /auth/oauth/google/callback
   */
  fastify.get('/auth/oauth/google/callback', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const { code, state, error } = query;
    const adminId = (request.user as any)?.id;

    if (!adminId) return reply.code(401).send({ error: 'Unauthorized' });
    if (error) {
      return reply.redirect(
        `${process.env.APP_URL || 'http://localhost:3000'}/admin/appointments/settings?error=${encodeURIComponent(error)}`
      );
    }

    // @ts-ignore
    const storedState = request.session.oauthState;
    if (!state || !storedState || !verifyStateToken(state, storedState)) {
      return reply.code(403).send({ error: 'Invalid state parameter' });
    }

    try {
      const tokenResponse = await oauthService.exchangeGoogleCode(code);
      const userInfo = await oauthService.getGoogleUserInfo(tokenResponse.access_token);

      const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
      await oauthService.saveCredential(
        adminId,
        'google',
        tokenResponse.access_token,
        tokenResponse.refresh_token || null,
        tokenResponse.id_token || null,
        expiresAt,
        userInfo.calendars[0]?.id || null,
        userInfo.sub,
        ['calendar.events', 'userinfo.email', 'userinfo.profile']
      );

      // @ts-ignore
      delete request.session.oauthState;
      // @ts-ignore
      const redirectUrl = request.session.oauthRedirectUrl || `${process.env.APP_URL || 'http://localhost:3000'}/admin/appointments/settings`;
      // @ts-ignore
      delete request.session.oauthRedirectUrl;

      return reply.redirect(
        `${redirectUrl}?success=google_connected&message=${encodeURIComponent('Google Calendar connected successfully')}`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth error';
      return reply.redirect(
        `${process.env.APP_URL || 'http://localhost:3000'}/admin/appointments/settings?error=${encodeURIComponent(errorMessage)}`
      );
    }
  });

  /**
   * GET /auth/oauth/outlook/authorize
   */
  fastify.get('/auth/oauth/outlook/authorize', { onRequest: requireAdmin }, async (request, reply) => {
    const adminId = (request.user as any)?.id;
    if (!adminId) return reply.code(401).send({ error: 'Unauthorized' });

    const redirectUrl = (request.query as any).redirectUrl;
    const state = generateStateToken();

    // @ts-ignore
    request.session.oauthState = state;
    // @ts-ignore
    request.session.oauthRedirectUrl = redirectUrl || `${process.env.APP_URL || 'http://localhost:3000'}/admin/appointments/settings`;

    const authUrl = oauthService.generateMicrosoftAuthUrl(state);
    return reply.redirect(authUrl);
  });

  /**
   * GET /auth/oauth/outlook/callback
   */
  fastify.get('/auth/oauth/outlook/callback', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const { code, state, error } = query;
    const adminId = (request.user as any)?.id;

    if (!adminId) return reply.code(401).send({ error: 'Unauthorized' });
    if (error) {
      return reply.redirect(
        `${process.env.APP_URL || 'http://localhost:3000'}/admin/appointments/settings?error=${encodeURIComponent(error)}`
      );
    }

    // @ts-ignore
    const storedState = request.session.oauthState;
    if (!state || !storedState || !verifyStateToken(state, storedState)) {
      return reply.code(403).send({ error: 'Invalid state parameter' });
    }

    try {
      const tokenResponse = await oauthService.exchangeMicrosoftCode(code);
      const userInfo = await oauthService.getMicrosoftUserInfo(tokenResponse.access_token);

      const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
      await oauthService.saveCredential(
        adminId,
        'outlook',
        tokenResponse.access_token,
        tokenResponse.refresh_token || null,
        tokenResponse.id_token || null,
        expiresAt,
        'calendar',
        userInfo.id,
        ['Calendars.ReadWrite', 'User.Read']
      );

      // @ts-ignore
      delete request.session.oauthState;
      // @ts-ignore
      const redirectUrl = request.session.oauthRedirectUrl || `${process.env.APP_URL || 'http://localhost:3000'}/admin/appointments/settings`;
      // @ts-ignore
      delete request.session.oauthRedirectUrl;

      return reply.redirect(
        `${redirectUrl}?success=outlook_connected&message=${encodeURIComponent('Outlook Calendar connected successfully')}`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth error';
      return reply.redirect(
        `${process.env.APP_URL || 'http://localhost:3000'}/admin/appointments/settings?error=${encodeURIComponent(errorMessage)}`
      );
    }
  });

  /**
   * GET /admin/oauth/status
   */
  fastify.get('/admin/oauth/status', { onRequest: requireAdmin }, async (request, reply) => {
    const adminId = (request.user as any)?.id;
    if (!adminId) return reply.code(401).send({ error: 'Unauthorized' });

    const [googleCred, outlookCred] = await Promise.all([
      prisma.calendarCredential.findUnique({
        where: { provider_adminUserId: { provider: 'google', adminUserId: adminId } },
      }),
      prisma.calendarCredential.findUnique({
        where: { provider_adminUserId: { provider: 'outlook', adminUserId: adminId } },
      }),
    ]);

    return {
      google: googleCred ? {
        connected: true,
        email: googleCred.providerUserId,
        calendarId: googleCred.calendarId,
        lastError: googleCred.lastError,
      } : { connected: false },
      outlook: outlookCred ? {
        connected: true,
        email: outlookCred.providerUserId,
        lastError: outlookCred.lastError,
      } : { connected: false },
    };
  });

  /**
   * DELETE /admin/oauth/:provider
   */
  fastify.delete('/admin/oauth/:provider', { onRequest: requireAdmin }, async (request, reply) => {
    const adminId = (request.user as any)?.id;
    if (!adminId) return reply.code(401).send({ error: 'Unauthorized' });

    const { provider } = request.params as Record<string, string>;
    if (!['google', 'outlook'].includes(provider)) {
      return reply.code(400).send({ error: 'Invalid provider' });
    }

    try {
      await oauthService.disconnect(adminId, provider as 'google' | 'outlook');
      return reply.send({ message: `${provider} Calendar disconnected` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ error: msg });
    }
  });

  /**
   * PATCH /admin/oauth/:provider/settings
   */
  fastify.patch('/admin/oauth/:provider/settings', { onRequest: requireAdmin }, async (request, reply) => {
    const adminId = (request.user as any)?.id;
    if (!adminId) return reply.code(401).send({ error: 'Unauthorized' });

    const { provider } = request.params as Record<string, string>;
    const body = request.body as Record<string, unknown>;
    const validation = calendarSyncSettingsSchema.safeParse({ ...body, provider });

    if (!validation.success) {
      return reply.code(400).send({ error: 'Invalid request' });
    }

    try {
      const updated = await prisma.calendarCredential.update({
        where: {
          provider_adminUserId: { provider: provider as 'google' | 'outlook', adminUserId: adminId },
        },
        data: {
          syncEnabled: validation.data.syncEnabled,
          autoSync: validation.data.autoSync,
        },
      });

      return reply.send({
        id: updated.id,
        provider: updated.provider,
        syncEnabled: updated.syncEnabled,
        autoSync: updated.autoSync,
        calendarId: updated.calendarId,
        lastSyncedAt: updated.lastSyncedAt,
        lastError: updated.lastError,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ error: msg });
    }
  });
}
