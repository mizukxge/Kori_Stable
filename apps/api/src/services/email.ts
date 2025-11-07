import nodemailer from 'nodemailer';
import { PrismaClient, EmailStatus } from '@prisma/client';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const prisma = new PrismaClient();

// Email configuration from environment
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== 'false';

// AWS SES configuration
const USE_SES = process.env.USE_SES === 'true';
const AWS_REGION = process.env.AWS_REGION || 'eu-west-2';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || EMAIL_FROM;

// Create transporter for Nodemailer
const transporter = EMAIL_USER && EMAIL_PASS && !USE_SES
  ? nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    })
  : null;

// Create SES client
const sesClient = USE_SES && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
  ? new SESClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  from?: string;
  replyTo?: string;
  metadata?: any;
}

/**
 * Send email using SES
 */
async function sendEmailWithSES(
  to: string[],
  subject: string,
  html?: string,
  text?: string,
  replyTo?: string,
  from?: string
): Promise<string | null> {
  if (!sesClient) {
    console.error('[Email] SES not configured, cannot send:', subject);
    return null;
  }

  try {
    const command = new SendEmailCommand({
      Source: from || SENDER_EMAIL || 'noreply@shotbymizu.co.uk',
      Destination: {
        ToAddresses: to,
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: html
            ? {
                Data: html,
                Charset: 'UTF-8',
              }
            : undefined,
          Text: text
            ? {
                Data: text,
                Charset: 'UTF-8',
              }
            : undefined,
        },
      },
      ReplyToAddresses: replyTo ? [replyTo] : undefined,
    });

    const result = await sesClient.send(command);
    console.log(`[Email/SES] Sent: ${subject} to ${to.join(', ')} (MessageId: ${result.MessageId})`);
    return result.MessageId || null;
  } catch (error: any) {
    console.error('[Email/SES] Failed to send:', error);
    throw error;
  }
}

/**
 * Send an email (supports both Nodemailer and AWS SES)
 */
export async function sendEmail(options: EmailOptions): Promise<string | null> {
  if (!EMAIL_ENABLED) {
    console.log('[Email] Email disabled, skipping:', options.subject);
    return null;
  }

  // Use SES if configured
  if (USE_SES && sesClient) {
    try {
      const to = Array.isArray(options.to) ? options.to : [options.to];
      const cc = options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : [];
      const bcc = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : [];

      // Create email log entry
      const emailLog = await prisma.emailLog.create({
        data: {
          to: to.join(', '),
          cc: cc.length > 0 ? cc.join(', ') : undefined,
          bcc: bcc.length > 0 ? bcc.join(', ') : undefined,
          from: options.from || SENDER_EMAIL || '',
          replyTo: options.replyTo,
          subject: options.subject,
          template: options.template,
          status: EmailStatus.PENDING,
          metadata: options.metadata || {},
        },
      });

      // Update status to sending
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: EmailStatus.SENDING },
      });

      // Send email with SES
      const messageId = await sendEmailWithSES(
        to.concat(cc, bcc),
        options.subject,
        options.html,
        options.text,
        options.replyTo,
        options.from
      );

      // Update log with success
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
          messageId: messageId || undefined,
        },
      });

      console.log(`[Email] Sent via SES: ${options.subject} to ${to.join(', ')}`);
      return emailLog.id;
    } catch (error: any) {
      console.error('[Email] Failed to send via SES:', error);

      // Log failure
      try {
        await prisma.emailLog.create({
          data: {
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            from: options.from || SENDER_EMAIL || '',
            subject: options.subject,
            template: options.template,
            status: EmailStatus.FAILED,
            error: error.message,
            metadata: options.metadata || {},
          },
        });
      } catch (logError) {
        console.error('[Email] Failed to log error:', logError);
      }

      return null;
    }
  }

  // Fall back to Nodemailer
  if (!transporter) {
    console.error('[Email] Email not configured (neither SES nor Nodemailer), cannot send:', options.subject);
    return null;
  }

  try {
    // Prepare recipients
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const cc = options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined;
    const bcc = options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined;

    // Create email log entry
    const emailLog = await prisma.emailLog.create({
      data: {
        to,
        cc,
        bcc,
        from: options.from || EMAIL_FROM || '',
        replyTo: options.replyTo,
        subject: options.subject,
        template: options.template,
        status: EmailStatus.PENDING,
        metadata: options.metadata || {},
      },
    });

    // Update status to sending
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: { status: EmailStatus.SENDING },
    });

    // Send email via Nodemailer
    const info = await transporter.sendMail({
      from: options.from || EMAIL_FROM,
      to,
      cc,
      bcc,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
    });

    // Update log with success
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
        messageId: info.messageId,
      },
    });

    console.log(`[Email] Sent via Nodemailer: ${options.subject} to ${to}`);
    return emailLog.id;
  } catch (error: any) {
    console.error('[Email] Failed to send via Nodemailer:', error);

    // Log failure
    try {
      await prisma.emailLog.create({
        data: {
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          from: options.from || EMAIL_FROM || '',
          subject: options.subject,
          template: options.template,
          status: EmailStatus.FAILED,
          error: error.message,
          metadata: options.metadata || {},
        },
      });
    } catch (logError) {
      console.error('[Email] Failed to log error:', logError);
    }

    return null;
  }
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(
  to: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): Promise<string | null> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Kori Photography</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <p>${message}</p>
            ${
              actionUrl && actionText
                ? `<a href="${actionUrl}" class="button">${actionText}</a>`
                : ''
            }
          </div>
          <div class="footer">
            <p>This is an automated notification from Kori Photography.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: title,
    html,
    template: 'notification',
  });
}

/**
 * Send digest email
 */
export async function sendDigestEmail(
  to: string,
  notifications: any[],
  frequency: string
): Promise<string | null> {
  const notificationList = notifications
    .map(
      (n) => `
      <div style="margin-bottom: 20px; padding: 15px; background: white; border-left: 4px solid #4F46E5;">
        <h3 style="margin: 0 0 10px 0;">${n.title}</h3>
        <p style="margin: 0;">${n.message}</p>
        <small style="color: #666;">${new Date(n.createdAt).toLocaleString()}</small>
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${frequency} Notification Digest</h1>
          </div>
          <div class="content">
            <p>You have ${notifications.length} new notifications:</p>
            ${notificationList}
          </div>
          <div class="footer">
            <p>This is your ${frequency.toLowerCase()} notification digest.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `${frequency} Notification Digest - ${notifications.length} updates`,
    html,
    template: 'digest',
  });
}