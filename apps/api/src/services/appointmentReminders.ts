import { PrismaClient, AppointmentStatus } from '@prisma/client';
import { getAppointmentEmailService } from './appointmentEmails.js';

const prisma = new PrismaClient();

/**
 * Reminder job configuration
 */
export interface ReminderConfig {
  // Check for reminders every N seconds
  checkIntervalSeconds?: number;
  // Send 24-hour reminder (in minutes before appointment)
  twentyFourHourReminderMinutes?: number;
  // Send 1-hour reminder (in minutes before appointment)
  oneHourReminderMinutes?: number;
}

/**
 * Appointment Reminders Service
 * Handles scheduling and sending reminder emails for appointments
 */
export class AppointmentRemindersService {
  private checkInterval: NodeJS.Timeout | null = null;
  private config: ReminderConfig;
  private emailService = getAppointmentEmailService();

  constructor(config: ReminderConfig = {}) {
    this.config = {
      checkIntervalSeconds: config.checkIntervalSeconds || 300, // Check every 5 minutes by default
      twentyFourHourReminderMinutes: config.twentyFourHourReminderMinutes || 24 * 60, // 24 hours
      oneHourReminderMinutes: config.oneHourReminderMinutes || 60, // 1 hour
    };
  }

  /**
   * Start the reminder job scheduler
   */
  start(): void {
    if (this.checkInterval) {
      console.warn('⏰ Reminder scheduler already running');
      return;
    }

    console.log('⏰ Starting appointment reminder scheduler');
    this.checkInterval = setInterval(() => {
      this.checkAndSendReminders().catch((error) => {
        console.error('❌ Error in reminder scheduler:', error);
      });
    }, (this.config.checkIntervalSeconds || 300) * 1000);

    // Run immediately on start
    this.checkAndSendReminders().catch((error) => {
      console.error('❌ Error checking reminders on start:', error);
    });
  }

  /**
   * Stop the reminder job scheduler
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏹️  Stopped appointment reminder scheduler');
    }
  }

  /**
   * Check for appointments that need reminders
   */
  private async checkAndSendReminders(): Promise<void> {
    const now = new Date();

    // Find appointments in Booked status
    const appointments = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.Booked,
        scheduledAt: {
          gt: now, // Only future appointments
        },
      },
      include: { client: true },
    });

    for (const appointment of appointments) {
      if (!appointment.scheduledAt) continue;

      const minutesUntilAppointment =
        (appointment.scheduledAt.getTime() - now.getTime()) / (1000 * 60);

      // Check if we should send 24-hour reminder
      const twentyFourThreshold = this.config.twentyFourHourReminderMinutes || 1440;
      if (
        minutesUntilAppointment <= twentyFourThreshold &&
        minutesUntilAppointment > twentyFourThreshold - 5 // Only send once in the 5-minute window
      ) {
        try {
          await this.emailService.sendTwentyFourHourReminder(appointment.id);
          await this.recordReminderSent(appointment.id, '24hour');
        } catch (error) {
          console.error(
            `❌ Failed to send 24-hour reminder for appointment ${appointment.id}:`,
            error
          );
        }
      }

      // Check if we should send 1-hour reminder
      const oneHourThreshold = this.config.oneHourReminderMinutes || 60;
      if (
        minutesUntilAppointment <= oneHourThreshold &&
        minutesUntilAppointment > oneHourThreshold - 5 // Only send once in the 5-minute window
      ) {
        try {
          await this.emailService.sendOneHourReminder(appointment.id);
          await this.recordReminderSent(appointment.id, '1hour');
        } catch (error) {
          console.error(
            `❌ Failed to send 1-hour reminder for appointment ${appointment.id}:`,
            error
          );
        }
      }
    }
  }

  /**
   * Record that a reminder was sent for tracking/audit purposes
   */
  private async recordReminderSent(appointmentId: string, reminderType: string): Promise<void> {
    try {
      await prisma.appointmentAuditLog.create({
        data: {
          appointmentId,
          action: `REMINDER_SENT_${reminderType.toUpperCase()}`,
          details: {
            reminderType,
            sentAt: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error(`Failed to record reminder audit log: ${error}`);
      // Don't fail the reminder sending if audit logging fails
    }
  }

  /**
   * Manually send a reminder for a specific appointment
   */
  async sendReminderManually(appointmentId: string, reminderType: '24hour' | '1hour'): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    if (reminderType === '24hour') {
      await this.emailService.sendTwentyFourHourReminder(appointmentId);
    } else if (reminderType === '1hour') {
      await this.emailService.sendOneHourReminder(appointmentId);
    }

    await this.recordReminderSent(appointmentId, reminderType);
  }

  /**
   * Get reminder status for an appointment
   */
  async getReminderStatus(appointmentId: string): Promise<{
    twentyFourHourSent: boolean;
    oneHourSent: boolean;
  }> {
    const logs = await prisma.appointmentAuditLog.findMany({
      where: {
        appointmentId,
        action: {
          in: ['REMINDER_SENT_24HOUR', 'REMINDER_SENT_1HOUR'],
        },
      },
    });

    return {
      twentyFourHourSent: logs.some((log) => log.action === 'REMINDER_SENT_24HOUR'),
      oneHourSent: logs.some((log) => log.action === 'REMINDER_SENT_1HOUR'),
    };
  }
}

/**
 * Create singleton instance
 */
let reminderServiceInstance: AppointmentRemindersService | null = null;

export function getAppointmentRemindersService(): AppointmentRemindersService {
  if (!reminderServiceInstance) {
    reminderServiceInstance = new AppointmentRemindersService({
      checkIntervalSeconds: parseInt(process.env.REMINDER_CHECK_INTERVAL_SECONDS || '300', 10),
      twentyFourHourReminderMinutes: parseInt(process.env.REMINDER_24HOUR_MINUTES || '1440', 10),
      oneHourReminderMinutes: parseInt(process.env.REMINDER_1HOUR_MINUTES || '60', 10),
    });
  }
  return reminderServiceInstance;
}
