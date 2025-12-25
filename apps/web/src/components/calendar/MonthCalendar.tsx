import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

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
}

export interface CalendarBlockedTime {
  id: string;
  startAt: string;
  endAt: string;
  reason: string;
}

interface MonthCalendarProps {
  appointments: CalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  onDateClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: CalendarAppointment) => void;
}

export function MonthCalendar({
  appointments,
  blockedTimes,
  onDateClick,
  onAppointmentClick,
}: MonthCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of month and pad with previous month's days
  const startDate = monthStart;
  const endDate = monthEnd;
  const firstDayOfWeek = startDate.getDay();
  const previousMonthDays = Array.from({ length: firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() - (firstDayOfWeek === 0 ? 7 - i : firstDayOfWeek - i));
    return date;
  }).reverse();

  // Pad with next month's days
  const totalCells = 42; // 6 weeks * 7 days
  const filledCells = previousMonthDays.length + daysInMonth.length;
  const nextMonthDays = Array.from({ length: totalCells - filledCells }, (_, i) => {
    const date = new Date(endDate);
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const allDays = [...previousMonthDays, ...daysInMonth, ...nextMonthDays];

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): CalendarAppointment[] => {
    return appointments.filter((apt) => {
      if (!apt.scheduledAt) return false;
      const aptDate = new Date(apt.scheduledAt);
      return isSameDay(aptDate, date);
    });
  };

  // Check if date is blocked
  const isDateBlocked = (date: Date): boolean => {
    return blockedTimes.some((block) => {
      const blockStart = new Date(block.startAt);
      const blockEnd = new Date(block.endAt);
      return date >= blockStart && date < blockEnd;
    });
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Introduction':
        return 'bg-blue-900/50 text-blue-200 border border-blue-700';
      case 'CreativeDirection':
        return 'bg-purple-900/50 text-purple-200 border border-purple-700';
      case 'ContractInvoicing':
        return 'bg-green-900/50 text-green-200 border border-green-700';
      default:
        return 'bg-slate-700/50 text-slate-200 border border-slate-600';
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button size="sm" variant="outline" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-muted">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="p-2 text-center font-semibold text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {allDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isBlocked = isDateBlocked(day);

            return (
              <div
                key={index}
                onClick={() => isCurrentMonth && onDateClick?.(day)}
                className={`min-h-24 p-2 border-b border-r border-slate-700 text-sm cursor-pointer transition ${
                  !isCurrentMonth ? 'bg-slate-800/50' : 'bg-slate-800/30 hover:bg-slate-700/40'
                } ${isToday ? 'bg-blue-900/30 border-blue-600' : ''} ${
                  isBlocked ? 'bg-slate-700/40' : ''
                }`}
              >
                <div
                  className={`font-semibold mb-1 ${
                    isToday ? 'text-blue-600' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {format(day, 'd')}
                </div>

                {isBlocked && (
                  <div className="text-xs text-slate-400 font-medium mb-1">Blocked</div>
                )}

                {/* Appointments */}
                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map((apt) => (
                    <button
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick?.(apt);
                      }}
                      className={`block w-full text-left text-xs px-1 py-0.5 rounded truncate ${getTypeColor(
                        apt.type
                      )}`}
                      title={apt.client.name}
                    >
                      {apt.client.name.split(' ')[0]}
                    </button>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{dayAppointments.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-600" />
          Introduction
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-600" />
          Creative Direction
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-600" />
          Contract/Invoicing
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-600" />
          Blocked
        </div>
      </div>
    </div>
  );
}
