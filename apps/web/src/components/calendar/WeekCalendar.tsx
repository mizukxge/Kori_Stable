import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export interface CalendarAppointment {
  id: string;
  type: string;
  status: string;
  scheduledAt: string;
  duration: number;
  client: {
    name: string;
    email: string;
  };
  outcome?: string;
  teamsLink?: string;
}

export interface CalendarBlockedTime {
  id: string;
  startAt: string;
  endAt: string;
  reason: string;
}

interface TimeSlot {
  hour: number;
  minute: number;
  time: string;
}

interface WeekCalendarProps {
  appointments: CalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  onAppointmentClick: (appointment: CalendarAppointment) => void;
  onEmptySlotClick?: (date: Date, time: string) => void;
}

/**
 * WeekCalendar - Visual week view of appointments
 * Shows Monday-Saturday, 11:00-16:00 UTC
 * Color-codes by appointment type
 */
export function WeekCalendar({
  appointments,
  blockedTimes,
  onAppointmentClick,
  onEmptySlotClick,
}: WeekCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getUTCDay();
    // If Sunday (0), start from Monday. Otherwise, go back to Monday of current week
    const diff = day === 0 ? 1 : day === 1 ? 0 : 1 - day;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() + diff);
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
  });

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const HOURS = Array.from({ length: 6 }, (_, i) => 11 + i); // 11:00 to 16:00
  const TIME_SLOTS: TimeSlot[] = [];

  for (let hour = 11; hour < 16; hour++) {
    TIME_SLOTS.push({ hour, minute: 0, time: `${hour.toString().padStart(2, '0')}:00` });
    TIME_SLOTS.push({ hour, minute: 30, time: `${hour.toString().padStart(2, '0')}:30` });
  }

  // Generate week dates (Mon-Sat)
  const weekDates = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setUTCDate(date.getUTCDate() + i);
    return date;
  });

  // Get appointments for a specific date and time slot
  const getAppointmentsForSlot = (date: Date, hour: number): CalendarAppointment[] => {
    return appointments.filter((apt) => {
      if (!apt.scheduledAt) return false;
      const aptDate = new Date(apt.scheduledAt);
      return (
        aptDate.getUTCFullYear() === date.getUTCFullYear() &&
        aptDate.getUTCMonth() === date.getUTCMonth() &&
        aptDate.getUTCDate() === date.getUTCDate() &&
        aptDate.getUTCHours() === hour
      );
    });
  };

  // Check if slot is blocked
  const isSlotBlocked = (date: Date, hour: number): CalendarBlockedTime | null => {
    const slotStart = new Date(date);
    slotStart.setUTCHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setUTCHours(hour + 1, 0, 0, 0);

    return (
      blockedTimes.find(
        (block) => new Date(block.startAt) <= slotStart && new Date(block.endAt) > slotStart
      ) || null
    );
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Introduction':
        return 'bg-blue-100 border-blue-300 text-blue-900';
      case 'CreativeDirection':
        return 'bg-purple-100 border-purple-300 text-purple-900';
      case 'ContractInvoicing':
        return 'bg-green-100 border-green-300 text-green-900';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Booked':
        return 'ring-2 ring-blue-500';
      case 'Completed':
        return 'ring-2 ring-green-500';
      case 'NoShow':
        return 'ring-2 ring-red-500 opacity-50';
      case 'Cancelled':
        return 'ring-2 ring-gray-500 opacity-30';
      default:
        return '';
    }
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setUTCDate(newDate.getUTCDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setUTCDate(newDate.getUTCDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const handleTodayClick = () => {
    const today = new Date();
    const day = today.getUTCDay();
    const diff = day === 0 ? 1 : day === 1 ? 0 : 1 - day;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() + diff);
    monday.setUTCHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">
            Week of {currentWeekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
          </h2>
          <p className="text-sm text-muted-foreground">Mon–Sat, 11:00–16:00 UTC</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleTodayClick}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted">
          <div className="p-3 text-xs font-semibold text-muted-foreground">Time</div>
          {weekDates.map((date, idx) => (
            <div key={idx} className="p-3 text-xs font-semibold text-center border-l border-border">
              <div>{DAYS[idx]}</div>
              <div className="text-muted-foreground">
                {date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div>
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-7 border-t border-border divide-x divide-border">
              {/* Time label */}
              <div className="p-3 text-xs font-medium text-muted-foreground bg-muted sticky left-0">
                {hour.toString().padStart(2, '0')}:00
              </div>

              {/* Day cells */}
              {weekDates.map((date, dayIdx) => {
                const dayAppointments = getAppointmentsForSlot(date, hour);
                const blockedTime = isSlotBlocked(date, hour);

                return (
                  <div
                    key={`${dayIdx}-${hour}`}
                    onClick={() => {
                      if (!blockedTime && dayAppointments.length === 0 && onEmptySlotClick) {
                        onEmptySlotClick(date, `${hour.toString().padStart(2, '0')}:00`);
                      }
                    }}
                    className={`p-2 min-h-20 relative ${
                      !blockedTime && dayAppointments.length === 0 ? 'cursor-pointer hover:bg-muted/50' : ''
                    } ${blockedTime ? 'bg-gray-200 opacity-50' : ''}`}
                  >
                    {blockedTime && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-xs font-semibold text-gray-600 text-center px-1">
                          {blockedTime.reason}
                        </div>
                      </div>
                    )}

                    {dayAppointments.map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => onAppointmentClick(apt)}
                        className={`w-full p-2 rounded text-xs font-medium border mb-1 transition-all hover:shadow-md ${getTypeColor(
                          apt.type
                        )} ${getStatusColor(apt.status)}`}
                      >
                        <div className="font-semibold truncate">{apt.client.name}</div>
                        <div className="text-xs opacity-75 truncate">{apt.type}</div>
                        <div className="text-xs opacity-60">{apt.status}</div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-sm pt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
          <span>Introduction</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
          <span>Creative Direction</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
          <span>Contract/Invoicing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-200"></div>
          <span>Blocked</span>
        </div>
      </div>
    </div>
  );
}
