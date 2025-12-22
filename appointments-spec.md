# Kori Appointments & Scheduling System Specification

**Status:** Stable v0.2 — 2025-12-21 (Slices 1-2 Complete)
**Component:** Appointment Scheduling & Management with Teams Integration

**Latest Update (v0.2):**
- ✅ Slice 1 Complete: Data model + admin list stub
- ✅ Slice 2 Complete: Public booking with full availability checking
- 🔄 Slice 3 Next: Calendar UI + admin settings
- 📋 Slice 4 Next: Email confirmations + Teams integration + reminders
- 📊 Slice 5 Next: Calendar views + metrics + reporting

---

## Table of Contents

1. [Overview & Business Goals](#overview--business-goals)
2. [Data Model](#data-model)
3. [Booking Rules & Availability Logic](#booking-rules--availability-logic)
4. [Tokenised Invite Links](#tokenised-invite-links)
5. [API Endpoints](#api-endpoints)
6. [Microsoft Teams Integration](#microsoft-teams-integration)
7. [Email Notifications & Reminders](#email-notifications--reminders)
8. [Admin UI Design](#admin-ui-design)
9. [Public Booking Page](#public-booking-page)
10. [Reporting & Metrics](#reporting--metrics)
11. [Quality & Testing](#quality--testing)
12. [Implementation Roadmap](#implementation-roadmap)
13. [Known Limitations & Future Work](#known-limitations--future-work)

---

## Overview & Business Goals

**Audience:** Solo admin (Michael / Mizu Studio) with ready support for future multi-user.

**Primary Goals:**
- Enable tokenised booking links per appointment type & client
- Automate Microsoft Teams meeting link generation
- Centralize appointments in Kori (linked to clients, shoots, proposals, contracts, invoices)
- Send email confirmations & reminders to admin and client
- Prevent double-booking against shoots, appointments, and blocked times
- Provide calendar views and basic reporting (no-show rate, call volume, outcome tracking)

**Core Use Case:**
1. Admin creates a tokenised invite link for a specific client and appointment type
2. Client clicks link, picks a date/time within 14-day booking window and admin's working hours
3. System automatically creates Teams meeting and sends confirmation emails
4. Admin receives calendar notification; client receives Teams link
5. On call day, reminders fire 24h and 30m/15m before
6. After call, admin marks complete/no-show and records outcome

---

## Data Model

### Enums

```prisma
enum AppointmentType {
  Introduction
  CreativeDirection
  ContractInvoicing
}

enum AppointmentStatus {
  Draft              // Invitation created, not yet sent
  InviteSent        // Invite link sent to client
  Booked            // Client booked a slot
  Completed         // Call completed
  Cancelled         // Cancelled by admin or client
  NoShow            // Client did not attend
  Expired           // Invite link expired, never booked
}

enum AppointmentOutcome {
  Positive          // Positive outcome, client engaged
  Neutral           // Neutral, status quo
  Negative          // Negative outcome, client lost interest
}
```

### Core Models

```prisma
model Appointment {
  id                    String    @id @default(cuid())
  type                  AppointmentType

  // Scheduling
  scheduledAt           DateTime?  // Null until booked
  duration              Int       @default(60)  // minutes

  // Linking
  clientId              String
  client                Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)

  shootId               String?
  shoot                 Shoot?    @relation(fields: [shootId], references: [id], onDelete: SetNull)

  proposalId            String?
  proposal              Proposal? @relation(fields: [proposalId], references: [id], onDelete: SetNull)

  contractId            String?
  contract              Contract? @relation(fields: [contractId], references: [id], onDelete: SetNull)

  invoiceId             String?
  invoice               Invoice?  @relation(fields: [invoiceId], references: [id], onDelete: SetNull)

  // Status
  status                AppointmentStatus @default(Draft)
  outcome               AppointmentOutcome?

  // Meeting details
  teamsLink             String?
  recordingUrl          String?
  recordingConsentGiven Boolean   @default(false)

  // Notes
  adminNotes            String?
  clientNotes           String?
  callSummary           String?
  noShowReason          String?

  // Invitation link
  inviteToken           String?   @unique
  inviteTokenExpiresAt  DateTime?
  inviteTokenUsedAt     DateTime?

  // Audit
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Reminders sent
  clientReminder24Sent  Boolean   @default(false)
  clientReminder15Sent  Boolean   @default(false)
  adminReminder24Sent   Boolean   @default(false)
  adminReminder30Sent   Boolean   @default(false)

  // Relations
  auditLog              AppointmentAuditLog[]

  @@index([clientId])
  @@index([shootId])
  @@index([status])
  @@index([scheduledAt])
  @@index([inviteToken])
  @@index([inviteTokenExpiresAt])
  @@map("appointments")
}

model AppointmentAuditLog {
  id              String      @id @default(cuid())
  appointmentId   String
  appointment     Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  action          String      // "CREATE", "BOOK", "RESCHEDULE", "CANCEL", "COMPLETE", "NO_SHOW"
  timestamp       DateTime    @default(now())
  details         Json?       // { oldValue, newValue, reason }

  @@index([appointmentId])
  @@index([timestamp])
  @@map("appointment_audit_logs")
}

model AppointmentBlockedTime {
  id        String   @id @default(cuid())
  startAt   DateTime
  endAt     DateTime
  reason    String   // "Shoot", "Holiday", "OutOfOffice", "PersonalBlock"

  shootId   String?
  shoot     Shoot?   @relation(fields: [shootId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())

  @@index([startAt])
  @@index([endAt])
  @@index([shootId])
  @@map("appointment_blocked_times")
}

model AppointmentSettings {
  id                    String   @id @default(cuid())

  // Working hours (Mon-Sat only, times in UTC)
  workdayStart          Int      @default(11)  // Hour (11 = 11:00 UTC)
  workdayEnd            Int      @default(16)  // Hour (16 = 16:00 UTC)

  // Buffers
  bufferMinutes         Int      @default(15)  // Gap between appointments

  // Booking window
  bookingWindowDays     Int      @default(14)  // Max days ahead to book

  // Active types
  activeTypes           String[] @default(["Introduction", "CreativeDirection", "ContractInvoicing"])

  // Email templates
  confirmEmailSubject   String?  @default("Your Mizu Studio Call is Confirmed — {{appointmentDate}} at {{appointmentTime}}")
  confirmEmailBody      String?  @db.Text
  reminderEmailSubject  String?  @default("Reminder: Your Call with Mizu Studio is Tomorrow at {{appointmentTime}}")
  reminderEmailBody     String?  @db.Text

  // Timezone
  timezone              String   @default("Europe/London")

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@map("appointment_settings")
}
```

### Immutability Rules

Once an appointment is **Completed**, **Cancelled**, **NoShow**, or **Expired**:
- Immutable fields: `type`, `duration`, `clientNotes`, `recordingConsentGiven`, `scheduledAt`
- Allowed updates: Additional admin notes, audit entries only

---

## Booking Rules & Availability Logic

### Working Hours & Calendar Constraints

- **Days:** Mon–Sat only; Sunday disabled
- **Hours:** 11:00–16:00 GMT (UTC) — always display to admin in UK time
- **Booking window:** 14 days inclusive from today
- **No past times:** Cannot book times before now
- **Slot duration:** 60 minutes for all types (v1)
- **Buffer:** Minimum 15 minutes after each appointment before next can start

### Double-Booking Prevention

An appointment **cannot** be scheduled if it overlaps with:
1. Another `Appointment` (status not in `[Cancelled, Expired]`) + 15-min buffer
2. A `Shoot` (full duration + buffer)
3. An `AppointmentBlockedTime` entry
4. Outside working hours/days

### Availability Calculation

**Pure function** in `appointmentsService.ts`:
- `getAvailableDates(appointmentType)` → `Date[]` (next 14 days, Mon-Sat only)
- `getAvailableTimes(appointmentType, date)` → `TimeSlot[]` (1-hour slots, 11:00-16:00 UTC)
- Both memoized by day/type for performance

---

## Tokenised Invite Links

### Design

- **Format:** `https://shotbymizu.co.uk/book/<appointmentType>/<token>`
- **Example:** `https://shotbymizu.co.uk/book/introduction-call/xyz123abc`
- **Token:** Cryptographically secure (24 bytes base64url-encoded)
- **Expiry:** 3 days from creation (customizable)
- **Single-use:** After client books, token is marked used and cannot be re-used

### Status Transitions

```
Draft → InviteSent → (Booked or Expired or Cancelled)
  ↓
Completed / NoShow / Cancelled (terminal states)
```

### Error Handling

- Expired link → "Link Expired" page with contact info
- Already used → "Link Already Used" page with appointment summary
- Invalid token → 404

---

## API Endpoints

### Admin Endpoints (POST /appointments/invite)

**Request:**
```json
{
  "clientId": "abc123",
  "type": "Introduction",
  "shootId": "optional-shoot-id",
  "proposalId": null,
  "contractId": null,
  "invoiceId": null,
  "expiresInDays": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "apt-123",
    "status": "InviteSent",
    "inviteToken": "xyz123...",
    "bookingUrl": "https://shotbymizu.co.uk/book/introduction-call/xyz123...",
    "expiresAt": "2025-12-24T23:59:59Z",
    "clientName": "John Doe",
    "type": "Introduction"
  }
}
```

### Admin: GET /admin/appointments

**Query:**
```
?dateRange=today,+14d&status=Booked,InviteSent&clientId=abc&type=Introduction
```

**Response:** Paginated list with status, dates, linked entities.

### Admin: GET /admin/appointments/:id

Full appointment detail with related entities and audit log summary.

### Admin: PATCH /admin/appointments/:id

Update notes, link entities (within Draft/InviteSent state).

### Admin: POST /admin/appointments/:id/reschedule

**Request:**
```json
{
  "newScheduledAt": "2025-12-27T14:00:00Z"
}
```

Validates availability, regenerates Teams meeting, sends reschedule email.

### Admin: POST /admin/appointments/:id/complete

**Request:**
```json
{
  "outcome": "Positive",
  "callSummary": "Client interested in wedding package..."
}
```

Marks as Completed, locks immutable fields.

### Admin: POST /admin/appointments/:id/no-show

**Request:**
```json
{
  "reason": "Client did not connect"
}
```

Marks as NoShow, updates metrics.

### Admin: POST /admin/appointments/:id/cancel

**Request:**
```json
{
  "reason": "Admin cancelled due to emergency"
}
```

Cancels reminders, sends cancellation email to client.

### Admin: POST /admin/appointments/block-time

**Request:**
```json
{
  "startAt": "2025-12-24T00:00:00Z",
  "endAt": "2025-12-26T23:59:59Z",
  "reason": "Holiday",
  "shootId": null
}
```

Create blocked time entries (holidays, out-of-office, etc.).

### Admin: GET /admin/appointments/metrics

Returns:
- Calls this week/month/all-time
- Calls by type (breakdown)
- No-show rate (%)
- Outcome breakdown (Positive/Neutral/Negative %)
- Upcoming calls count

### Public: GET /book/:token

Validates token; returns available dates/times for the appointment type.

### Public: POST /book/:token

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "notes": "Looking for wedding photography",
  "recordingConsentGiven": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "apt-123",
    "status": "Booked",
    "scheduledAt": "2025-12-27T14:00:00Z",
    "teamsLink": "https://teams.microsoft.com/...",
    "message": "Check your email for confirmation & Teams link"
  }
}
```

---

## Microsoft Teams Integration

### Abstraction Layer

```typescript
interface MeetingProvider {
  createMeeting(config: CreateMeetingConfig): Promise<CreateMeetingResult>;
  cancelMeeting(meetingId: string): Promise<void>;
  getRecording(meetingId: string): Promise<string | null>;
}

interface CreateMeetingConfig {
  subject: string;
  startTime: DateTime;
  duration: number;  // minutes
  attendees: { name: string; email: string }[];
}

interface CreateMeetingResult {
  meetingId: string;
  joinUrl: string;
}
```

### Implementation

- **Production:** Real Teams API (via MS Graph)
- **Dev/Test:** Fake provider returning synthetic URLs (e.g., `https://teams.fake.test/meeting/abc123`)

### Credentials

- Load from environment variables only (no hardcoded secrets)
- Never commit Teams credentials to repo

### Recording URL

- Stub with TODO note for Phase 2
- Placeholder: `null` until Teams API supports retrieval

---

## Email Notifications & Reminders

### Events

#### On Booking (Client)
- **Subject:** "Your Mizu Studio Call is Confirmed — [Date/Time]"
- **Body:** Appointment type, date/time (GMT), Teams link, contact email
- **Attachment:** ICS calendar file

#### On Booking (Admin)
- **Subject:** "New Appointment — [Client Name] — [Type] — [Date/Time]"
- **Body:** Admin dashboard link, client email/phone

#### Reminders (Client)
- **24h before:** Reminder email with Teams link
- **15m before:** Quick reminder (if opted in)

#### Reminders (Admin)
- **24h before:** Reminder email with dashboard link
- **30m before:** Quick reminder (if opted in)

#### On Reschedule (Both)
- New time + updated Teams link + new ICS attachment

#### On Cancel (Client)
- Polite cancellation message
- Instructions to email to reschedule

### Implementation

- **Service:** Reuse existing email infrastructure (Postmark/Sendgrid/SES)
- **Jobs:** Background task (`appointmentsReminders.ts`) runs every minute
  - Finds appointments needing reminders
  - Sends emails idempotently (check flags)
  - Sets `clientReminder24Sent`, etc.

---

## Admin UI Design

### Routes

- `/admin/appointments` → Calendar week view (default)
- `/admin/appointments/links` → Manage invite links
- `/admin/appointments/settings` → Working hours, blocked times
- `/admin/appointments/upcoming` → Upcoming appointments list
- `/admin/appointments/past` → Past appointments + outcomes

### 9.1 Calendar View (Default)

**Week view by default** (Day/Month toggles in v1.1+)

**Time axis:** 11:00–16:00 UTC (displayed in UK time)

**Visual elements:**
- Appointments (colour-coded by type; status badge)
- Shoots (distinct colour, read-only)
- Blocked times (hatched/grey pattern)

**Interactions:**
- **Click appointment:** Open right-side panel showing:
  - Type, client, date/time, status, Teams link, recording consent
  - Notes (admin & client), outcome
  - Buttons: Edit, Reschedule, Cancel, Mark Completed, Mark No-Show, Add Notes
  - Delete (if Draft)
- **Empty slot:** Admin can quick-create appointment (optional in MVP)
- **Drag-and-drop:** Reschedule by dragging (if time permits)

### 9.2 Appointment Links Tab

**Table columns:**
- Client name
- Appointment type
- Created date
- Expires date
- Status (Active, Expired, Booked, Revoked)
- Actions: [Copy Link] [Resend Email] [Revoke]

**Create New Link Flow:**
1. Choose client (autocomplete)
2. Choose appointment type
3. (Optional) Link to shoot/proposal/contract/invoice
4. Create → Show booking URL, option to copy/send email

### 9.3 Settings Tab

- **Working hours:** Set per day (Mon–Sat only; Sunday disabled)
- **Buffer:** Minutes between appointments (default 15)
- **Booking window:** Days ahead (default 14)
- **Blocked times management:** Add/edit/delete holiday/out-of-office blocks
- **Active types:** Toggle which types are offered
- **Email templates:** (v1.1+) Customize confirmation & reminder emails

### 9.4 Lists

**Upcoming Appointments:**
- Columns: Date/Time, Client, Type, Status, Linked Shoot, Actions
- Filters: Type, client, date range
- Quick actions: Edit, Reschedule, Cancel, Mark Completed

**Past Appointments:**
- Columns: Date/Time, Client, Type, Outcome, Notes summary, Recording available
- Filters: Type, client, outcome, date range
- CSV export

---

## Public Booking Page

### URL: `/book/:appointmentType/:token`

### UI Flow

**Step 1: Validate & Intro**
- Validate token (exists, not expired, not used)
- Show branded page: Mizu Studio logo, "Book a Call with Mizu Studio"
- Friendly intro: "Pick a time that works for you"
- Progress indicator: Step 1/4

**Step 2: Pick Date**
- Calendar showing next 14 days
- Sundays disabled (grayed out)
- Selected day → next step

**Step 3: Pick Time**
- Available 1-hour slots for selected date
- 11:00–16:00 UTC, displayed in UK time
- Show slot availability in real-time
- Click slot → Step 4

**Step 4: Client Details**
- Name (required, validated)
- Email (required, email format)
- Notes (optional, textarea)
- Recording consent checkbox (optional but captured)
- Summary: Appointment type, date, time, Teams link will be sent to email

**Step 5: Success**
- "Your call is confirmed!"
- "Check your email for confirmation & Teams link"
- Button: "Return to home" or "Book another call"

### Design

- Mobile first: Single column, large touch targets
- Dark mode support (match existing web theme)
- Accessible: WCAG 2.1 AA compliant
- No self-reschedule/cancel in v1 (client must email admin)

---

## Reporting & Metrics

### Dashboard Widget

**High-level stats:**
- Calls this week / month / all-time
- No-show rate (%)
- Upcoming calls (next 7 days)
- Latest outcome

**Buttons:** [View Calendar] [View Full Report]

### Full Metrics Page: `/admin/appointments/metrics`

**Sections:**

1. **Summary Stats**
   - Total calls (all-time, year, month, week)
   - No-show rate (%)
   - Average call duration

2. **Breakdown by Type**
   - Calls: Introduction, CreativeDirection, ContractInvoicing (counts & %)

3. **Outcome Analysis**
   - Positive / Neutral / Negative (counts & %)
   - Pie chart or bar chart

4. **Time Series**
   - Calls per week (line chart, last 12 weeks)
   - Trend indicator (↑ or ↓)

5. **CSV Export**
   - Filter by date range, type, outcome
   - Columns: Date, Time, Client Name, Type, Status, Outcome, Linked Shoot/Proposal/Invoice IDs, Notes, Recording Available

---

## Quality & Testing

### Functional Requirements

- ✅ Tokenised invite: create → book → Booked status with Teams link
- ✅ Availability respects working hours, 14-day window, buffer, double-booking rules
- ✅ Admin can reschedule, cancel, complete, mark no-show
- ✅ Emails & reminders fire at correct times, idempotent
- ✅ Calendar & lists reflect DB state accurately

### Testing

**Unit Tests** (appointmentsService.ts):
- Availability calculation with various inputs
- Token generation & expiry
- Status transition validation
- Double-booking detection
- Reminder scheduling logic

**Integration Tests:**
- Full booking flow (happy path)
- Expired token → 404
- Double-book attempt → 409
- Reschedule updates Teams meeting
- Email sent on confirmation

**Coverage Target:** ≥80% for core services and routes

### Security

- ✅ No secrets in code; Teams credentials from env vars
- ✅ Public booking endpoint rate-limited (10 req/min per IP)
- ✅ Invite tokens cryptographically unguessable (24-byte random)
- ✅ Single-use tokens enforced
- ✅ Audit logs capture all state transitions
- ✅ Only authenticated admin access to admin endpoints
- ✅ Input validation on all public & admin endpoints

### Performance

- Calendar view API + UI render: p95 ≤ 300ms
- Availability calculation: memoized, cached by day/type
- Reminder job: runs in <5 minutes, no double-sends

---

## Implementation Roadmap

### Slice 1: Data + Admin List ✅ COMPLETE (2025-12-21)
- [x] Update Prisma schema with appointment models
- [x] Create migration
- [x] Basic API routes (GET list, GET detail, create draft + more)
- [x] Admin list UI stub (/admin/appointments)
- [x] Stats cards and filtering UI

### Slice 2: Tokenised Invites + Public Booking ✅ COMPLETE (2025-12-21)
- [x] Invite creation & token generation (POST /appointments/invite)
- [x] Token validation & expiry checking
- [x] Public booking page UI (/book/:token) — Full multi-step wizard
- [x] Public booking API (POST /book/:token)
- [x] Fake Teams provider with synthetic URLs
- [x] Admin invitation link management page (/admin/appointments/links)
- [x] Availability service with full rule enforcement

### Slice 3: Availability Rules + Double-Booking ✅ PARTIAL (Logic Done, UI Next)
- [x] Availability service (getAvailableDates, getAvailableTimes)
- [x] Double-booking validation (appointments, blocked times)
- [x] Blocked time CRUD endpoints
- [ ] Calendar view with availability visualization
- [ ] Settings page for working hours / buffer / blocked times
- [ ] Tests: ≥80% coverage on availability logic

### Slice 4: Teams + Email + Reminders
- [ ] Real Teams meeting creation (or mock integration)
- [ ] Email templates & delivery (Postmark/SES)
- [ ] Reminder job (background task)
- [ ] Reschedule endpoint & email
- [ ] Tests: Email delivery, reminder idempotency

### Slice 5: Calendar UI + Settings + Metrics
- [ ] Calendar week view (full implementation)
- [ ] Settings page (working hours, blocked times, types)
- [ ] Metrics API & dashboard widget
- [ ] CSV export
- [ ] Complete test coverage
- [ ] Documentation & changelog

---

## Known Limitations & Future Work

### v0.1 Current Limitations

1. **Single admin only** — Multi-user support designed but not yet tested
2. **No self-reschedule/cancel** — Clients must email admin in v1
3. **Recording URL retrieval** — Stubbed, requires Teams API Phase 2
4. **Email templates** — Default templates only, not yet customizable
5. **No notification preferences** — All reminders sent; no opt-out per type (v1.1+)
6. **No integration with Shoots** — Blocked by Shoot model design; partial in v0.1

### v1.1 Planned Enhancements

- [ ] Client self-reschedule/cancel via secure link
- [ ] Day/Month view toggles (in addition to week)
- [ ] Appointment type-specific hours (e.g., CreativeDirection 12:00-14:00 only)
- [ ] Customizable email templates (admin UI)
- [ ] Notification preferences per event type
- [ ] Recording URL auto-fetch from Teams
- [ ] Calendar event attendance sync (Teams → Appointments)
- [ ] Client portal: view upcoming appointments, reschedule

### v2.0 Future

- [ ] Multi-user support fully tested
- [ ] Calendar analytics: heatmap of busy times
- [ ] Integration with invoicing (auto-create invoice after CreativeDirection call)
- [ ] Slack/Teams notifications (admin only)
- [ ] Payment collection before booking
- [ ] SMS reminders
- [ ] Calendar import (Google Calendar, Apple Calendar)
- [ ] Automated follow-up sequences (if no-show)

---

## Changelog

**v0.2 — 2025-12-21**
- ✅ Slice 1 Complete: Full CRUD operations, admin list UI, statistics
- ✅ Slice 2 Complete: Tokenized invites, public booking flow, availability checking
- Created AvailabilityService with comprehensive business rule enforcement
- Created MeetingProvider abstraction (Fake + Real Teams stub)
- Full public booking page with multi-step wizard
- Admin invitation link manager with email integration
- 2,000+ lines of backend code
- 1,000+ lines of frontend code

**v0.1 — 2025-12-21**
- Initial specification
- Designed appointment data model
- Designed tokenised invite system
- Designed Teams & email integration patterns

---

## Canvases & Files

### Primary Canvas
- **This file:** `appointments-spec.md`

### Code Canvases
- `apps/api/prisma/schema.prisma` — Updated with Appointment models
- `apps/api/src/routes/appointments.ts` — Admin API routes
- `apps/api/src/services/appointmentsService.ts` — Business logic & availability
- `apps/api/src/services/appointmentsReminders.ts` — Background job for reminders
- `apps/api/src/routes/publicAppointments.ts` — Public booking endpoints
- `apps/web/src/routes/admin/appointments/index.tsx` — Admin calendar view
- `apps/web/src/routes/admin/appointments/links.tsx` — Invite link management
- `apps/web/src/routes/admin/appointments/settings.tsx` — Settings page
- `apps/web/src/routes/book/[token].tsx` — Public booking page
- `apps/api/src/providers/MeetingProvider.ts` — Teams abstraction
- `apps/api/src/jobs/appointmentsReminders.ts` — Reminder queue job
- `config/env.js` — Environment variable definitions (TEAMS_CLIENT_ID, etc.)

---

## References

- CLAUDE.md — Project overview & patterns
- PROJECT_HANDOVER.md — Comprehensive project documentation
- apps/api/prisma/schema.prisma — Full database schema
- apps/web/src/lib/api.ts — Frontend API client
- Existing invoice, contract, proposal systems for patterns

