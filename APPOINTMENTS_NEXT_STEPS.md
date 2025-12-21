# Appointments System - Next Steps (Slices 3-5)

**Current Status:** v0.2 — Slices 1-2 Complete
**Total Code:** 3,000+ lines (Backend + Frontend)
**Progress:** 40% → 60% of full MVP

---

## 📊 Summary of Completed Work

### ✅ Slice 1: Data + Admin List
- Prisma schema with 4 models (Appointment, AuditLog, BlockedTime, Settings)
- 12 admin API endpoints with full CRUD
- Admin appointments list page with stats, filters, pagination
- Service layer with audit logging

### ✅ Slice 2: Public Booking + Availability
- End-to-end tokenized invite system
- AvailabilityService with comprehensive business rules:
  - Mon-Sat only, 11:00-16:00 UTC
  - 14-day booking window
  - 15-min buffer enforcement
  - Double-booking prevention
- Multi-step public booking page (beautiful UI)
- Admin invitation link manager
- Fake Teams provider for dev/test
- Public API endpoints with validation

### ✅ Additional Features Implemented
- Appointment audit trail
- Status transitions (Draft → InviteSent → Booked → Completed/NoShow/Cancelled)
- Token generation + expiry checking + single-use enforcement
- Meeting provider abstraction for future real Teams integration

---

## 🎯 Next Steps - Recommended Order

### **Priority 1: Slice 3 - Calendar UI + Settings** (~8-10 hours)
**Impact:** HIGH — Gives admin visual interface for appointments
**Dependency:** All Slice 1-2 logic already complete

#### Features to Implement:
1. **Calendar View Component** (`/admin/appointments/calendar.tsx`)
   - Week view by default (Mon-Sat, times 11:00-16:00)
   - Visual display of appointments (color by type)
   - Show blocked times (hatched/grey)
   - Click appointment → detail panel
   - Drag-and-drop reschedule (optional for v0.2)
   - Empty slot visualization

2. **Settings Page** (`/admin/appointments/settings.tsx`)
   - Working hours configuration (per-day, Mon-Sat only)
   - Buffer time setting (default 15 min)
   - Booking window (default 14 days)
   - Toggle active appointment types
   - Timezone selection (default Europe/London)

3. **Blocked Times Management UI**
   - Add blocked time form (date range + reason)
   - List existing blocks
   - Delete blocks
   - Integration with calendar visualization

4. **API Enhancements**
   - PATCH `/admin/appointments/settings` (already exists)
   - Better GET `/admin/appointments/blocked-times` query support
   - DELETE `/admin/appointments/blocked-times/:id` endpoint

#### Files to Create/Modify:
```
NEW: apps/web/src/routes/admin/appointments/calendar.tsx (400+ lines)
NEW: apps/web/src/routes/admin/appointments/settings.tsx (350+ lines)
NEW: apps/web/src/components/calendar/WeekCalendar.tsx (300+ lines)
NEW: apps/web/src/components/calendar/TimeSlot.tsx (150+ lines)
MODIFY: apps/api/src/routes/appointments.ts (add DELETE blocked-time)
MODIFY: apps/web/src/lib/api.ts (add calendar + settings functions)
```

**Estimated Effort:** 8-10 hours

---

### **Priority 2: Slice 4 - Email + Teams Integration + Reminders** (~12-15 hours)
**Impact:** CRITICAL — Completes end-to-end booking flow
**Dependency:** Needs Slice 3 optional (works without it)

#### Features to Implement:

1. **Email Templates & Service**
   - Confirmation email (client + admin)
   - Reminder emails (24h + 30min before)
   - Reschedule notification
   - Cancellation notice
   - Integration with existing email service (Postmark/SES)

2. **Reminder Job** (`apps/api/src/jobs/appointmentsReminders.ts`)
   - Background task runs every minute
   - Finds appointments needing reminders
   - Sends idempotent emails (check flags)
   - Updates reminder sent flags
   - Clean up old reminders

3. **Real Teams Integration** (Phase A: Mock + Logging)
   - Implement `MicrosoftTeamsProvider.createMeeting()`
   - MS Graph API integration (with proper auth)
   - Error handling + fallback to fake provider
   - Recording URL stub (for Phase B)

4. **Reschedule Workflow**
   - POST `/admin/appointments/:id/reschedule` updates implementation
   - Cancel old Teams meeting
   - Create new Teams meeting with new time
   - Send reschedule email with new link + ICS
   - Update audit log with before/after times

5. **ICS Calendar Files**
   - Generate `.ics` files for bookings
   - Attach to confirmation + reschedule emails
   - Support for Outlook, Google Calendar, Apple Calendar

#### Files to Create/Modify:
```
NEW: apps/api/src/services/appointmentEmails.ts (250+ lines)
NEW: apps/api/src/jobs/appointmentsReminders.ts (200+ lines)
NEW: apps/api/src/templates/appointmentEmails/ (email templates)
MODIFY: apps/api/src/providers/MeetingProvider.ts (real Teams impl)
MODIFY: apps/api/src/services/appointments.ts (email triggers)
MODIFY: apps/api/src/routes/publicAppointments.ts (send confirmation)
MODIFY: apps/web/src/lib/api.ts (email preview functions)
CONFIG: Update .env with TEAMS_* variables and email service config
```

**Estimated Effort:** 12-15 hours

---

### **Priority 3: Slice 5 - Metrics + Reporting** (~6-8 hours)
**Impact:** MEDIUM — Provides business insights
**Dependency:** All previous slices

#### Features to Implement:

1. **Metrics API** (already partially exists)
   - GET `/admin/appointments/metrics` enhancements
   - Calls per week/month/all-time
   - Breakdown by type + outcome
   - No-show rate calculation
   - Upcoming appointments count

2. **Metrics Dashboard Page** (`/admin/appointments/metrics.tsx`)
   - Summary stats cards
   - Charts (calls per week, outcome breakdown)
   - Time-series visualization
   - Filter by date range, type, outcome

3. **CSV Export**
   - Export appointment data
   - Columns: Date, Time, Client, Type, Status, Outcome, Notes, Recording
   - Configurable filters
   - Download as CSV file

4. **Dashboard Widget** (for home page)
   - Upcoming calls (next 7 days)
   - No-show rate
   - Latest outcome
   - Link to full metrics page

#### Files to Create/Modify:
```
NEW: apps/web/src/routes/admin/appointments/metrics.tsx (400+ lines)
NEW: apps/web/src/components/charts/CallsChart.tsx (200+ lines)
MODIFY: apps/api/src/services/appointments.ts (enhance getAppointmentStats)
MODIFY: apps/api/src/routes/appointments.ts (add CSV export endpoint)
MODIFY: apps/web/src/lib/api.ts (CSV export function)
```

**Estimated Effort:** 6-8 hours

---

## 💻 Implementation Quick Start

### Slice 3 Starting Point:
```typescript
// Create basic calendar week view component
// 1. Create WeekCalendar component that accepts appointments
// 2. Create time grid (11:00-16:00, Mon-Sat)
// 3. Fetch appointments from API
// 4. Overlay appointments on time grid
// 5. Add click handler for appointment details
// 6. Create settings form component
// 7. Wire up API calls for save/load
```

### Slice 4 Starting Point:
```typescript
// Create email service
// 1. Write email template functions
// 2. Create confirmation email builder
// 3. Integrate with existing email service
// 4. Add email triggers to booking flow
// 5. Implement reminder job (cron-like)
// 6. Implement real Teams API calls
// 7. Test with mock provider first
```

### Slice 5 Starting Point:
```typescript
// Create metrics page
// 1. Fetch stats from API
// 2. Display in summary cards
// 3. Add simple chart library (recharts or chart.js)
// 4. Build CSV export function
// 5. Add dashboard widget
```

---

## 🧪 Testing Checklist

### Slice 3 Testing:
- [ ] Calendar displays appointments correctly
- [ ] Appointments show in correct time slots
- [ ] Blocked times display visually
- [ ] Settings form saves and loads
- [ ] Working hours validation works
- [ ] Timezone changes reflected in UI

### Slice 4 Testing:
- [ ] Confirmation email sent on booking
- [ ] Email contains correct details + Teams link
- [ ] Reminder job triggers at correct times
- [ ] Email flags prevent duplicate sends
- [ ] Reschedule updates Teams meeting
- [ ] ICS files are valid and importable
- [ ] Teams meeting creation logged/tracked

### Slice 5 Testing:
- [ ] Metrics calculate correctly
- [ ] Charts render properly
- [ ] CSV export contains correct data
- [ ] Filters work on export
- [ ] Dashboard widget shows correct info

---

## 🔌 Environment Variables Needed

### For Slice 3:
```bash
# Already configured
VITE_API_URL=http://localhost:3001
```

### For Slice 4 (Teams Integration):
```bash
TEAMS_CLIENT_ID=your-app-id
TEAMS_CLIENT_SECRET=your-client-secret
TEAMS_TENANT_ID=your-tenant-id
MEETING_PROVIDER=teams  # or 'fake' for dev
```

### For Slice 4 (Email):
```bash
EMAIL_PROVIDER=postmark  # or 'ses', 'sendgrid'
POSTMARK_TOKEN=your-token
SEND_FROM_EMAIL=noreply@shotbymizu.co.uk
SEND_FROM_NAME="Mizu Studio"
```

---

## 📋 Code Architecture Notes

### Key Services Created:
1. **AvailabilityService** — Pure, testable availability logic
2. **AppointmentService** — CRUD + status management + audit
3. **MeetingProvider** — Pluggable meeting creation (Teams, Zoom, etc.)
4. **AppointmentEmailService** (Slice 4) — Email template + sending
5. **ReminderJob** (Slice 4) — Background reminder scheduling

### API Layer:
- Admin routes: `/admin/appointments/*` (require auth)
- Public routes: `/book/:token/*` (rate-limited)
- All endpoints use Zod validation
- Comprehensive error handling with HTTP status codes

### Frontend Architecture:
- React Router v7 file-based routing
- API client functions in `lib/api.ts`
- Shadcn UI components for consistency
- Mobile-first responsive design

---

## 🚀 Deployment Considerations

### Before Production Deployment:
1. **Database:** Ensure Prisma migration runs on all environments
2. **Teams API:** Configure real credentials (not fake provider)
3. **Email Service:** Set up Postmark/SES account + templates
4. **Background Jobs:** Configure reminder job runner (cron or systemd timer)
5. **Rate Limiting:** Verify Fastify rate-limit configured for public endpoints
6. **Error Tracking:** Wire up Sentry or error monitoring
7. **Logging:** Ensure appointment events logged properly
8. **Tests:** Achieve ≥80% coverage on critical paths

### Production Checklist:
- [ ] Run `pnpm typecheck` — no TypeScript errors
- [ ] Run `pnpm lint` — no linting errors
- [ ] Run `pnpm test` — all tests pass
- [ ] Review `appointments-spec.md` for any TODOs
- [ ] Verify email templates reviewed by designer
- [ ] Test Teams meeting creation with real account
- [ ] Test reminder job in staging
- [ ] Security review of token generation
- [ ] Performance test with 1000+ appointments

---

## 📞 Quick Reference

### What's Already Built:
- ✅ Database schema (4 models)
- ✅ 12 admin API endpoints
- ✅ Public booking API (3 endpoints)
- ✅ Availability logic (fully tested)
- ✅ Token generation + validation
- ✅ Public booking UI (multi-step wizard)
- ✅ Admin list page with stats
- ✅ Invitation manager page
- ✅ Meeting provider abstraction

### What Needs to Be Built (Next 25-35 hours):
- **Slice 3:** Calendar view (8-10h)
- **Slice 4:** Email + Teams + Reminders (12-15h)
- **Slice 5:** Metrics + Reporting (6-8h)
- **Testing:** 5-10h across all slices
- **Documentation:** 2-3h

### Total Effort Remaining:
**25-35 hours** for full MVP (Slices 3-5)
**Current Progress:** ~60% complete

---

## 🎓 Key Architectural Decisions

1. **Availability as Pure Service** — No side effects, easy to test
2. **Meeting Provider Pattern** — Pluggable, testable, supports multiple providers
3. **Token Single-Use Enforcement** — Prevents accidental double-booking
4. **Audit Trail on All Changes** — Complete history for support/debugging
5. **Fake Provider for Dev** — No external dependencies needed for development
6. **Background Jobs for Reminders** — Decouples from request/response cycle

---

## 📞 Questions? Start with:

1. **For availability logic:** See `appointmentsAvailability.ts`
2. **For API design:** See `appointments-spec.md` sections 5-6
3. **For UI patterns:** Check existing components in `apps/web/src/components/ui/`
4. **For database:** Review Prisma schema in `schema.prisma`

---

**Next Action:** Choose which slice to implement first (recommend Slice 3 for visual admin interface), then create feature branch and begin implementation.

**Branch Strategy:** All work continues on `claude/add-appointments-tab-QD5wD` branch, pushed after each slice.
