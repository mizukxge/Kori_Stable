import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EmailConfig {
  from: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  awsRegion?: string;
  awsAccessKey?: string;
  awsSecretKey?: string;
}

/**
 * Appointment email templates
 */
const emailTemplates = {
  bookingConfirmation: `
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #f0f4f8; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
      .section { margin-bottom: 20px; }
      .label { font-weight: bold; color: #555; }
      .value { color: #333; margin-bottom: 10px; }
      .button { background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; }
      .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Appointment Confirmed!</h1>
        <p>Your {{type}} appointment has been scheduled.</p>
      </div>

      <div class="section">
        <h2>Appointment Details</h2>
        <div class="value">
          <span class="label">Type:</span> {{type}}<br/>
          <span class="label">Date & Time:</span> {{scheduledAt}}<br/>
          <span class="label">Duration:</span> {{duration}} minutes<br/>
          <span class="label">Meet Link:</span> <a href="{{teamsLink}}">{{teamsLink}}</a>
        </div>
      </div>

      <div class="section">
        <h2>What to Expect</h2>
        <p>You will receive a reminder email 24 hours before your appointment, and another reminder 1 hour before.</p>
        <p>Please ensure you have a stable internet connection and a working camera/microphone for the video call.</p>
      </div>

      <div class="section">
        <h2>Reschedule or Cancel</h2>
        <p>If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance.</p>
      </div>

      <div class="footer">
        <p>© {{year}} Kori Photography. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
  `,

  twentyFourHourReminder: `
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #fff8e6; padding: 20px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #ff9800; }
      .section { margin-bottom: 20px; }
      .label { font-weight: bold; color: #555; }
      .value { color: #333; margin-bottom: 10px; }
      .button { background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; }
      .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Reminder: Your Appointment Tomorrow</h1>
        <p>Your {{type}} appointment is scheduled for tomorrow.</p>
      </div>

      <div class="section">
        <h2>Appointment Details</h2>
        <div class="value">
          <span class="label">Type:</span> {{type}}<br/>
          <span class="label">Date & Time:</span> {{scheduledAt}}<br/>
          <span class="label">Duration:</span> {{duration}} minutes<br/>
          <span class="label">Meet Link:</span> <a href="{{teamsLink}}">Join Video Call</a>
        </div>
      </div>

      <div class="section">
        <h2>Preparation Tips</h2>
        <ul>
          <li>Test your internet connection</li>
          <li>Check your camera and microphone are working</li>
          <li>Find a quiet, well-lit space for the call</li>
          <li>Plan to join 5 minutes early</li>
        </ul>
      </div>

      <div class="footer">
        <p>© {{year}} Kori Photography. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
  `,

  oneHourReminder: `
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #ffe6e6; padding: 20px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #f44336; }
      .section { margin-bottom: 20px; }
      .label { font-weight: bold; color: #555; }
      .value { color: #333; margin-bottom: 10px; }
      .button { background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; }
      .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Appointment in 1 Hour!</h1>
        <p>Your {{type}} appointment is starting very soon.</p>
      </div>

      <div class="section">
        <h2>Appointment Details</h2>
        <div class="value">
          <span class="label">Time:</span> {{scheduledAt}}<br/>
          <span class="label">Duration:</span> {{duration}} minutes<br/>
          <a href="{{teamsLink}}" class="button">Join Video Call Now</a>
        </div>
      </div>

      <div class="section">
        <h2>Quick Checklist</h2>
        <ul>
          <li>✓ Internet connection stable</li>
          <li>✓ Camera and microphone working</li>
          <li>✓ Camera access permitted</li>
          <li>✓ Quiet environment</li>
        </ul>
      </div>

      <div class="footer">
        <p>© {{year}} Kori Photography. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
  `,

  appointmentRescheduled: `
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #e8f5e9; padding: 20px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #4caf50; }
      .section { margin-bottom: 20px; }
      .label { font-weight: bold; color: #555; }
      .value { color: #333; margin-bottom: 10px; }
      .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Appointment Rescheduled</h1>
        <p>Your appointment has been rescheduled.</p>
      </div>

      <div class="section">
        <h2>New Appointment Details</h2>
        <div class="value">
          <span class="label">Type:</span> {{type}}<br/>
          <span class="label">New Date & Time:</span> {{newScheduledAt}}<br/>
          <span class="label">Duration:</span> {{duration}} minutes<br/>
          <span class="label">Meet Link:</span> <a href="{{teamsLink}}">{{teamsLink}}</a>
        </div>
      </div>

      <div class="section">
        <p>If you did not request this change or have any questions, please contact us immediately.</p>
      </div>

      <div class="footer">
        <p>© {{year}} Kori Photography. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
  `,

  appointmentCancelled: `
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #f3e5f5; padding: 20px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #9c27b0; }
      .section { margin-bottom: 20px; }
      .label { font-weight: bold; color: #555; }
      .value { color: #333; margin-bottom: 10px; }
      .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Appointment Cancelled</h1>
        <p>Your {{type}} appointment has been cancelled.</p>
      </div>

      <div class="section">
        <h2>Cancelled Appointment Details</h2>
        <div class="value">
          <span class="label">Type:</span> {{type}}<br/>
          <span class="label">Original Date & Time:</span> {{scheduledAt}}<br/>
          {{#if reason}}<span class="label">Reason:</span> {{reason}}<br/>{{/if}}
        </div>
      </div>

      <div class="section">
        <h2>Next Steps</h2>
        <p>If you would like to reschedule, please contact us to book a new appointment.</p>
      </div>

      <div class="footer">
        <p>© {{year}} Kori Photography. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
  `,
};

/**
 * Compile Handlebars templates
 */
const compiledTemplates = {
  bookingConfirmation: Handlebars.compile(emailTemplates.bookingConfirmation),
  twentyFourHourReminder: Handlebars.compile(emailTemplates.twentyFourHourReminder),
  oneHourReminder: Handlebars.compile(emailTemplates.oneHourReminder),
  appointmentRescheduled: Handlebars.compile(emailTemplates.appointmentRescheduled),
  appointmentCancelled: Handlebars.compile(emailTemplates.appointmentCancelled),
};

/**
 * Create email transporter
 */
function createTransporter(config: EmailConfig) {
  const smtpConfig = {
    host: config.smtpHost,
    port: config.smtpPort,
    secure: (config.smtpPort ?? 587) === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  };

  // If SMTP credentials are provided, use SMTP
  if (config.smtpHost && config.smtpUser && config.smtpPass) {
    return nodemailer.createTransport(smtpConfig);
  }

  // Otherwise, use test account (for development)
  return nodemailer.createTestAccount().then(async (testAccount) => {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  });
}

/**
 * Appointment email service
 */
export class AppointmentEmailService {
  private transporter: any;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.smtpHost || process.env.SMTP_HOST,
      port: config.smtpPort || parseInt(process.env.SMTP_PORT || '587', 10),
      secure: (config.smtpPort || parseInt(process.env.SMTP_PORT || '587', 10)) === 465,
      auth: {
        user: config.smtpUser || process.env.SMTP_USER,
        pass: config.smtpPass || process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Format date for email display
   */
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true },
    });

    if (!appointment || !appointment.client) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    const html = compiledTemplates.bookingConfirmation({
      type: appointment.type,
      scheduledAt: this.formatDate(appointment.scheduledAt!),
      duration: appointment.duration,
      teamsLink: appointment.teamsLink,
      year: new Date().getFullYear(),
    });

    await this.transporter.sendMail({
      from: this.config.from,
      to: appointment.client.email,
      subject: `Appointment Confirmation - ${appointment.type}`,
      html,
    });

    console.log(`✉️  Booking confirmation sent to ${appointment.client.email}`);
  }

  /**
   * Send 24-hour reminder email
   */
  async sendTwentyFourHourReminder(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true },
    });

    if (!appointment || !appointment.client) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    const html = compiledTemplates.twentyFourHourReminder({
      type: appointment.type,
      scheduledAt: this.formatDate(appointment.scheduledAt!),
      duration: appointment.duration,
      teamsLink: appointment.teamsLink,
      year: new Date().getFullYear(),
    });

    await this.transporter.sendMail({
      from: this.config.from,
      to: appointment.client.email,
      subject: `Reminder: Your ${appointment.type} Appointment Tomorrow`,
      html,
    });

    console.log(`✉️  24-hour reminder sent to ${appointment.client.email}`);
  }

  /**
   * Send 1-hour reminder email
   */
  async sendOneHourReminder(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true },
    });

    if (!appointment || !appointment.client) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    const html = compiledTemplates.oneHourReminder({
      type: appointment.type,
      scheduledAt: this.formatDate(appointment.scheduledAt!),
      duration: appointment.duration,
      teamsLink: appointment.teamsLink,
      year: new Date().getFullYear(),
    });

    await this.transporter.sendMail({
      from: this.config.from,
      to: appointment.client.email,
      subject: `Appointment in 1 Hour - ${appointment.type}`,
      html,
    });

    console.log(`✉️  1-hour reminder sent to ${appointment.client.email}`);
  }

  /**
   * Send rescheduled appointment email
   */
  async sendRescheduleNotification(
    appointmentId: string,
    newScheduledAt: Date
  ): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true },
    });

    if (!appointment || !appointment.client) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    const html = compiledTemplates.appointmentRescheduled({
      type: appointment.type,
      newScheduledAt: this.formatDate(newScheduledAt),
      duration: appointment.duration,
      teamsLink: appointment.teamsLink,
      year: new Date().getFullYear(),
    });

    await this.transporter.sendMail({
      from: this.config.from,
      to: appointment.client.email,
      subject: `Appointment Rescheduled - ${appointment.type}`,
      html,
    });

    console.log(`✉️  Reschedule notification sent to ${appointment.client.email}`);
  }

  /**
   * Send cancellation email
   */
  async sendCancellationNotification(appointmentId: string, reason?: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true },
    });

    if (!appointment || !appointment.client) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    const html = compiledTemplates.appointmentCancelled({
      type: appointment.type,
      scheduledAt: this.formatDate(appointment.scheduledAt!),
      reason: reason || 'No reason provided',
      year: new Date().getFullYear(),
    });

    await this.transporter.sendMail({
      from: this.config.from,
      to: appointment.client.email,
      subject: `Appointment Cancelled - ${appointment.type}`,
      html,
    });

    console.log(`✉️  Cancellation notification sent to ${appointment.client.email}`);
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('❌ Email connection verification failed:', error);
      return false;
    }
  }
}

/**
 * Create singleton instance
 */
let emailServiceInstance: AppointmentEmailService | null = null;

export function getAppointmentEmailService(): AppointmentEmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new AppointmentEmailService({
      from: process.env.EMAIL_FROM || 'appointments@kori.photography',
      smtpHost: process.env.SMTP_HOST,
      smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
    });
  }
  return emailServiceInstance;
}
