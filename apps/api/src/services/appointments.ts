import { PrismaClient, AppointmentStatus, AppointmentType, Appointment, AppointmentOutcome } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export interface CreateAppointmentData {
  clientId: string;
  type: AppointmentType;
  proposalId?: string;
  contractId?: string;
  invoiceId?: string;
  expiresInDays?: number;
}

export interface RescheduleData {
  newScheduledAt: Date;
}

export interface CompleteAppointmentData {
  outcome: AppointmentOutcome;
  callSummary?: string;
}

export interface NoShowData {
  reason?: string;
}

/**
 * AppointmentService - Core business logic for appointment scheduling
 */
export class AppointmentService {
  /**
   * Generate a cryptographically secure token for invite links
   * 24 bytes = 32 base64url characters (URL-safe)
   */
  static generateInviteToken(): string {
    return randomBytes(24).toString('base64url');
  }

  /**
   * Create a new appointment invitation with a token
   * Returns: Appointment with inviteToken and bookingUrl
   */
  static async createInvitation(data: CreateAppointmentData): Promise<Appointment & { bookingUrl: string }> {
    const expiresInDays = data.expiresInDays ?? 3;
    const inviteToken = this.generateInviteToken();
    const inviteTokenExpiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const appointment = await prisma.appointment.create({
      data: {
        type: data.type,
        clientId: data.clientId,
        proposalId: data.proposalId,
        contractId: data.contractId,
        invoiceId: data.invoiceId,
        status: 'InviteSent',
        inviteToken,
        inviteTokenExpiresAt,
      },
      include: {
        client: true,
      },
    });

    // Generate booking URL
    const typeSlug = data.type.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
    const bookingUrl = `${process.env.APP_URL || 'https://shotbymizu.co.uk'}/book/${typeSlug}/${inviteToken}`;

    return {
      ...appointment,
      bookingUrl,
    };
  }

  /**
   * Get appointment by ID with all related data
   */
  static async getAppointmentById(id: string): Promise<Appointment | null> {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        proposal: true,
        contract: true,
        invoice: true,
        auditLog: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });
  }

  /**
   * List appointments with filters
   */
  static async listAppointments(filters?: {
    clientId?: string;
    status?: AppointmentStatus;
    type?: AppointmentType;
    dateRangeStart?: Date;
    dateRangeEnd?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ appointments: Appointment[]; total: number }> {
    const limit = filters?.limit ?? 20;
    const offset = filters?.offset ?? 0;

    const where: any = {};

    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;

    if (filters?.dateRangeStart || filters?.dateRangeEnd) {
      where.scheduledAt = {};
      if (filters.dateRangeStart) {
        where.scheduledAt.gte = filters.dateRangeStart;
      }
      if (filters.dateRangeEnd) {
        where.scheduledAt.lte = filters.dateRangeEnd;
      }
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          client: true,
          proposal: true,
          contract: true,
          invoice: true,
        },
        orderBy: {
          scheduledAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.appointment.count({ where }),
    ]);

    return { appointments, total };
  }

  /**
   * Validate and book an appointment from an invite token
   */
  static async bookAppointmentFromInvite(
    token: string,
    scheduledAt: Date,
    clientData: {
      name: string;
      email: string;
      notes?: string;
      recordingConsentGiven: boolean;
    }
  ): Promise<Appointment> {
    // Validate token
    const appointment = await prisma.appointment.findUnique({
      where: { inviteToken: token },
    });

    if (!appointment) {
      throw new Error('Invalid appointment token');
    }

    if (appointment.inviteTokenExpiresAt && appointment.inviteTokenExpiresAt < new Date()) {
      throw new Error('Appointment invitation has expired');
    }

    if (appointment.inviteTokenUsedAt) {
      throw new Error('Appointment invitation has already been used');
    }

    // Update appointment
    const booked = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'Booked',
        scheduledAt,
        clientNotes: clientData.notes,
        recordingConsentGiven: clientData.recordingConsentGiven,
        inviteTokenUsedAt: new Date(),
      },
      include: {
        client: true,
      },
    });

    // Log audit event
    await this.logAuditEvent(booked.id, 'BOOK', {
      clientName: clientData.name,
      clientEmail: clientData.email,
      scheduledAt: scheduledAt.toISOString(),
    });

    return booked;
  }

  /**
   * Reschedule an appointment
   */
  static async rescheduleAppointment(id: string, newScheduledAt: Date): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (!['Booked'].includes(appointment.status)) {
      throw new Error(`Cannot reschedule appointment with status ${appointment.status}`);
    }

    const oldScheduledAt = appointment.scheduledAt;

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        scheduledAt: newScheduledAt,
      },
    });

    // Log audit event
    await this.logAuditEvent(id, 'RESCHEDULE', {
      oldScheduledAt: oldScheduledAt?.toISOString(),
      newScheduledAt: newScheduledAt.toISOString(),
    });

    return updated;
  }

  /**
   * Complete an appointment
   */
  static async completeAppointment(id: string, data: CompleteAppointmentData): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'Completed',
        outcome: data.outcome,
        callSummary: data.callSummary,
      },
    });

    // Log audit event
    await this.logAuditEvent(id, 'COMPLETE', {
      outcome: data.outcome,
      callSummary: data.callSummary,
    });

    return updated;
  }

  /**
   * Mark appointment as no-show
   */
  static async markNoShow(id: string, data?: NoShowData): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'NoShow',
        noShowReason: data?.reason,
      },
    });

    // Log audit event
    await this.logAuditEvent(id, 'NO_SHOW', {
      reason: data?.reason,
    });

    return updated;
  }

  /**
   * Cancel an appointment
   */
  static async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'Cancelled',
        adminNotes: reason ? `${appointment.adminNotes || ''}\n\nCancellation reason: ${reason}` : appointment.adminNotes,
      },
    });

    // Log audit event
    await this.logAuditEvent(id, 'CANCEL', {
      reason,
    });

    return updated;
  }

  /**
   * Log audit event
   */
  static async logAuditEvent(appointmentId: string, action: string, details?: any): Promise<void> {
    await prisma.appointmentAuditLog.create({
      data: {
        appointmentId,
        action,
        details: details || {},
        timestamp: new Date(),
      },
    });
  }

  /**
   * Get appointment statistics
   */
  static async getAppointmentStats(): Promise<{
    total: number;
    booked: number;
    completed: number;
    cancelled: number;
    noShow: number;
    byType: Record<string, number>;
    byOutcome: Record<string, number>;
  }> {
    const [total, booked, completed, cancelled, noShow] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'Booked' } }),
      prisma.appointment.count({ where: { status: 'Completed' } }),
      prisma.appointment.count({ where: { status: 'Cancelled' } }),
      prisma.appointment.count({ where: { status: 'NoShow' } }),
    ]);

    const byType: Record<string, number> = {};
    for (const type of Object.values(AppointmentType)) {
      byType[type] = await prisma.appointment.count({
        where: { type: type as AppointmentType },
      });
    }

    const byOutcome: Record<string, number> = {};
    for (const outcome of Object.values(AppointmentOutcome)) {
      byOutcome[outcome] = await prisma.appointment.count({
        where: { outcome: outcome as AppointmentOutcome },
      });
    }

    return {
      total,
      booked,
      completed,
      cancelled,
      noShow,
      byType,
      byOutcome,
    };
  }

  /**
   * Add blocked time
   */
  static async createBlockedTime(data: { startAt: Date; endAt: Date; reason: string }): Promise<void> {
    await prisma.appointmentBlockedTime.create({
      data,
    });
  }

  /**
   * Get blocked times
   */
  static async getBlockedTimes(startAt: Date, endAt: Date): Promise<any[]> {
    return prisma.appointmentBlockedTime.findMany({
      where: {
        AND: [
          { startAt: { lte: endAt } },
          { endAt: { gte: startAt } },
        ],
      },
    });
  }

  /**
   * Delete blocked time
   */
  static async deleteBlockedTime(id: string): Promise<void> {
    await prisma.appointmentBlockedTime.delete({
      where: { id },
    });
  }

  /**
   * Get or create appointment settings
   */
  static async getSettings(): Promise<any> {
    let settings = await prisma.appointmentSettings.findFirst();
    if (!settings) {
      settings = await prisma.appointmentSettings.create({
        data: {
          workdayStart: 11,
          workdayEnd: 16,
          bufferMinutes: 15,
          bookingWindowDays: 14,
          timezone: 'Europe/London',
        },
      });
    }
    return settings;
  }

  /**
   * Update appointment settings
   */
  static async updateSettings(data: Partial<any>): Promise<any> {
    const settings = await this.getSettings();
    return prisma.appointmentSettings.update({
      where: { id: settings.id },
      data,
    });
  }
}
