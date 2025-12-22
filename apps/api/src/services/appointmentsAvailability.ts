import { PrismaClient, AppointmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface TimeSlot {
  startTime: string; // HH:MM format
  startDate: Date;
  endDate: Date;
  available: boolean;
}

/**
 * AvailabilityService - Calculate available appointment slots
 * Enforces business rules:
 * - Mon-Sat only (no Sundays)
 * - 11:00-16:00 UTC
 * - 14-day booking window
 * - 15-minute buffer between appointments
 * - No overlaps with existing appointments, blocked times
 */
export class AvailabilityService {
  static readonly WORKDAY_START = 11; // 11:00 UTC
  static readonly WORKDAY_END = 16; // 16:00 UTC
  static readonly SLOT_DURATION = 60; // minutes
  static readonly BUFFER_MINUTES = 15;
  static readonly BOOKING_WINDOW_DAYS = 14;
  static readonly TIMEZONE = 'Europe/London';

  /**
   * Get all available dates for booking (next 14 days, Mon-Sat only)
   */
  static getAvailableDates(): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < this.BOOKING_WINDOW_DAYS; i++) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() + i);

      const dayOfWeek = date.getUTCDay();
      // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      if (dayOfWeek !== 0) {
        // Exclude Sundays
        dates.push(new Date(date));
      }
    }

    return dates;
  }

  /**
   * Get available time slots for a specific date
   * Returns 1-hour slots from 11:00 to 15:00 (leaves 16:00 as end time)
   */
  static async getAvailableTimesForDate(date: Date): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];

    // Create slots for each hour in working hours
    for (let hour = this.WORKDAY_START; hour < this.WORKDAY_END; hour++) {
      const startDate = new Date(date);
      startDate.setUTCHours(hour, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setUTCMinutes(endDate.getUTCMinutes() + this.SLOT_DURATION);

      // Check if slot is available
      const isAvailable = await this.isSlotAvailable(startDate, endDate);

      slots.push({
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        startDate,
        endDate,
        available: isAvailable,
      });
    }

    return slots;
  }

  /**
   * Check if a specific time slot is available
   * Validates against:
   * - Existing appointments (with 15-min buffer)
   * - Blocked times
   * - Past times
   */
  static async isSlotAvailable(startTime: Date, endTime: Date): Promise<boolean> {
    // Don't allow past times
    if (startTime < new Date()) {
      return false;
    }

    // Add buffer time for checking overlaps
    const bufferStart = new Date(startTime);
    bufferStart.setUTCMinutes(bufferStart.getUTCMinutes() - this.BUFFER_MINUTES);

    const bufferEnd = new Date(endTime);
    bufferEnd.setUTCMinutes(bufferEnd.getUTCMinutes() + this.BUFFER_MINUTES);

    // Check for overlapping appointments (excluding terminal states)
    const overlappingAppointments = await prisma.appointment.count({
      where: {
        scheduledAt: {
          gte: bufferStart,
          lt: bufferEnd,
        },
        status: {
          notIn: ['Cancelled' as AppointmentStatus, 'Expired' as AppointmentStatus],
        },
      },
    });

    if (overlappingAppointments > 0) {
      return false;
    }

    // Check for overlapping blocked times
    const overlappingBlockedTimes = await prisma.appointmentBlockedTime.count({
      where: {
        AND: [
          { startAt: { lt: bufferEnd } },
          { endAt: { gt: bufferStart } },
        ],
      },
    });

    if (overlappingBlockedTimes > 0) {
      return false;
    }

    return true;
  }

  /**
   * Find the next available slot after a given date
   * Used for quick booking suggestions
   */
  static async findNextAvailableSlot(afterDate: Date = new Date()): Promise<{ startTime: Date; endTime: Date } | null> {
    const availableDates = this.getAvailableDates().filter((d) => d >= afterDate);

    for (const date of availableDates) {
      const slots = await this.getAvailableTimesForDate(date);
      const firstAvailable = slots.find((s) => s.available);

      if (firstAvailable) {
        return {
          startTime: firstAvailable.startDate,
          endTime: firstAvailable.endDate,
        };
      }
    }

    return null;
  }

  /**
   * Validate that a proposed time is within allowed booking window
   */
  static isWithinBookingWindow(proposedTime: Date): boolean {
    const now = new Date();
    const maxBookingDate = new Date(now);
    maxBookingDate.setUTCDate(maxBookingDate.getUTCDate() + this.BOOKING_WINDOW_DAYS);

    return proposedTime > now && proposedTime <= maxBookingDate;
  }

  /**
   * Validate that time is within working hours (11:00-16:00 UTC)
   */
  static isWithinWorkingHours(date: Date): boolean {
    const hour = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();

    // Check if start time is within working hours
    const startValid = hour >= this.WORKDAY_START && hour < this.WORKDAY_END;

    // If at the end hour, only allow if starting exactly at workday end (which shouldn't happen, but be safe)
    if (hour === this.WORKDAY_END) {
      return minutes === 0 && seconds === 0;
    }

    // Check that appointment ends by workday end
    const endHour = hour + 1; // Assuming 60-min slots
    const endValid = endHour <= this.WORKDAY_END;

    return startValid && endValid;
  }

  /**
   * Validate that date is a working day (Mon-Sat, not Sunday)
   */
  static isWorkingDay(date: Date): boolean {
    const dayOfWeek = date.getUTCDay();
    return dayOfWeek !== 0; // 0 = Sunday
  }

  /**
   * Comprehensive validation of a proposed appointment time
   */
  static async validateProposedTime(
    startTime: Date
  ): Promise<{ valid: boolean; reason?: string }> {
    // Check booking window
    if (!this.isWithinBookingWindow(startTime)) {
      return {
        valid: false,
        reason: 'Appointment is outside the 14-day booking window',
      };
    }

    // Check working day
    if (!this.isWorkingDay(startTime)) {
      return {
        valid: false,
        reason: 'Appointments are only available Monday to Saturday',
      };
    }

    // Check working hours
    if (!this.isWithinWorkingHours(startTime)) {
      return {
        valid: false,
        reason: 'Appointment time is outside working hours (11:00-16:00 UTC)',
      };
    }

    // Check past time
    if (startTime < new Date()) {
      return {
        valid: false,
        reason: 'Cannot book times in the past',
      };
    }

    // Check availability
    const endTime = new Date(startTime);
    endTime.setUTCMinutes(endTime.getUTCMinutes() + this.SLOT_DURATION);

    const available = await this.isSlotAvailable(startTime, endTime);
    if (!available) {
      return {
        valid: false,
        reason: 'This time slot is no longer available',
      };
    }

    return { valid: true };
  }
}
