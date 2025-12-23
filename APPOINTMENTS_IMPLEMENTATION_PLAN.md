# Appointments Tab - Implementation Plan

**Status:** Ready for implementation
**Priority Order:** 1) Settings, 2) Calendar + Invitation, 3) Metrics
**Branch:** `claude/appointments-tab-features-fHNzi`

---

## 1. PHASE 1: Enhanced Settings Page

### Objective
Extend the settings page with email template configuration and calendar sync setup (Google Calendar, Outlook).

### Current State
- ✅ Working hours configuration (start/end time UTC)
- ✅ Booking window & buffer time
- ✅ Appointment types selection
- ✅ Timezone selector
- ✅ Blocked times management
- ❌ Missing: Email template customization
- ❌ Missing: Calendar sync configuration (Google, Outlook)

### Requirements

#### 1.1 Email Template Configuration

**New section:** "Email Templates"

- **Fields:**
  - `invitationEmailTemplate` (rich text / markdown editor)
    - Template variables: `{clientName}`, `{appointmentType}`, `{proposedDate}`, `{proposedTime}`, `{bookingLink}`, `{adminName}`
    - Default template provided
  - `confirmationEmailTemplate` (rich text)
    - Variables: `{clientName}`, `{confirmedDate}`, `{confirmedTime}`, `{teamsLink}`, `{calendarFile}`, `{adminName}`
  - `reminderEmailTemplate` (rich text)
    - Variables: `{clientName}`, `{appointmentDate}`, `{appointmentTime}`, `{teamsLink}`
  - `recipientEmailCC` (comma-separated emails)
    - CC all appointment emails to these addresses (e.g., assistant email)
- **Save behavior:** PATCH to `/admin/appointments/settings` (extend schema)
- **Error handling:** Show validation errors for template syntax

#### 1.2 Calendar Sync Configuration

**New section:** "Calendar Integrations"

- **Google Calendar:**
  - Button: "Connect Google Calendar"
  - On click: OAuth flow (redirect to Google)
  - On success: Show "Connected as: user@gmail.com" + Disconnect button
  - Behavior: Auto-create calendar events when appointments are booked
  - Show: Last sync time, next sync time

- **Outlook/Office 365:**
  - Button: "Connect Outlook"
  - On click: OAuth flow (redirect to Microsoft)
  - On success: Show "Connected as: user@outlook.com" + Disconnect button
  - Behavior: Auto-create calendar events when appointments are booked
  - Show: Last sync time, next sync time

- **Storage:** In AppointmentSettings model (or separate CalendarIntegration model):
  ```prisma
  googleCalendarEnabled: Boolean
  googleCalendarRefreshToken: String (encrypted)
  outlookCalendarEnabled: Boolean
  outlookCalendarRefreshToken: String (encrypted)
  ```

### Implementation Files

**Backend:**
- `apps/api/src/services/appointments.ts` - Add methods: `getEmailTemplates()`, `updateEmailTemplates()`, `syncToGoogleCalendar()`, `syncToOutlookCalendar()`
- `apps/api/src/services/calendarSync.ts` (NEW) - Handle Google & Outlook OAuth flows
- `apps/api/src/routes/appointments.ts` - Extend PATCH `/admin/appointments/settings` to handle templates & sync configs
- `apps/api/prisma/schema.prisma` - Extend `AppointmentSettings` model with email templates & calendar sync fields

**Frontend:**
- `apps/web/src/routes/admin/appointments/settings.tsx` - Add sections for email templates & calendar sync
- `apps/web/src/components/appointments/EmailTemplateEditor.tsx` (NEW) - Rich text editor for templates
- `apps/web/src/components/appointments/CalendarSyncPanel.tsx` (NEW) - OAuth buttons & connection status
- `apps/web/src/lib/api.ts` - Add methods: `updateEmailTemplates()`, `initiateGoogleCalendarOAuth()`, `initiateOutlookOAuth()`

### UX Flow

1. Admin navigates to `/admin/appointments/settings`
2. Scrolls down to "Email Templates" section
3. Clicks on a template name (e.g., "Invitation Email")
4. Opens modal with rich text editor
5. Edits template, sees preview with example variables
6. Clicks "Save Template" → API call → Toast notification
7. For calendar sync:
   - Clicks "Connect Google Calendar" → Redirects to Google OAuth
   - After auth, shows "Connected as john@gmail.com" ✓
   - Appointments will auto-sync to Google Calendar on booking

### Edge Cases
- Template has invalid/typo variable name → Show warning
- User disconnects calendar sync → Delete stored refresh token
- OAuth flow cancelled by user → Show error, allow retry
- Calendar event creation fails → Log error, don't block appointment creation (graceful degradation)

---

## 2. PHASE 2: Interactive Calendar + New Invitation Flow

### 2.1 Calendar Month View

**Current:** Week view only (11:00-16:00 UTC, Mon-Sat)
**Target:** Add month view toggle

**New component:** `MonthCalendar.tsx`
- Shows full month grid
- Appointments appear as small colored dots/badges on dates
- Click date → show day view or list of appointments that day
- Show blocked times as greyed-out dates
- Navigation: Previous/Next month buttons
- "Today" button to jump to current month

### 2.2 Interactive Time Slot Selection

**Feature:** Click empty slot to create appointment

**Flow:**
1. Admin views calendar (week or month)
2. Clicks an empty time slot (or clicks a date in month view)
3. Modal opens: "Create Appointment"
4. Form appears with:
   - Appointment type (required) - dropdown
   - Client (required) - searchable dropdown (approved clients only)
   - Date (prefilled from clicked slot)
   - Time (prefilled from clicked slot, or editable)
   - Duration (default 60 min, editable)
   - Admin notes (optional)
5. On "Create & Send Invite":
   - Validates against availability (no conflicts, respects blocked times)
   - Creates appointment with status = "InviteSent"
   - Generates invite token
   - Sends invitation email (uses template from settings)
   - Returns booking link
   - Success toast: "Invitation sent to [Client]"

### 2.3 Drag-to-Reschedule

**Feature:** Drag appointment block to new time slot

**Flow:**
1. Admin drags appointment block from 2pm to 3pm slot
2. Confirmation dialog appears:
   - Shows old time & new time
   - "Are you sure?" with Cancel / Confirm buttons
3. On confirm:
   - Validates new slot against availability
   - Updates appointment.scheduledAt
   - Sends "Rescheduled" email to client (with new Teams link if applicable)
   - Updates calendar view
   - Toast: "Appointment rescheduled"
4. On cancel:
   - Closes dialog, calendar reverts

**Edge cases:**
- Dragging to blocked time → Show error: "This time is blocked"
- Dragging past booking window → Show warning: "This slot is outside normal booking hours"
- Concurrent edit → Show conflict: "Appointment was modified elsewhere"

### 2.4 New Invitation: Modal vs Page

**Two entry points:**

**Path A: Modal (from calendar)**
- User clicks empty slot or "New Appointment" button
- Modal opens with form
- On success, closes modal, calendar refreshes
- Use case: Quick scheduling during day

**Path B: Dedicated page `/admin/appointments/new`**
- Link in sidebar or header "New Appointment"
- Full-page form with more space for notes
- Client preview (shows client details, past appointments)
- On success, redirects to appointment detail view or list page
- Use case: Detailed scheduling with notes/context

### Implementation Files

**Frontend Components:**
- `apps/web/src/components/calendar/MonthCalendar.tsx` (NEW)
- `apps/web/src/components/calendar/TimeSlotPicker.tsx` (NEW) - For interactive slot selection
- `apps/web/src/components/calendar/WeekCalendar.tsx` (EXTEND) - Add drag-to-reschedule, click handlers
- `apps/web/src/components/appointments/CreateAppointmentModal.tsx` (NEW) - Modal form
- `apps/web/src/components/appointments/CreateAppointmentPage.tsx` (NEW) - Full page form
- `apps/web/src/routes/admin/appointments/new.tsx` (NEW) - Route for /admin/appointments/new
- `apps/web/src/routes/admin/appointments/calendar.tsx` (EXTEND) - Add month view toggle, modal state

**Backend:**
- `apps/api/src/services/appointmentsAvailability.ts` (EXTEND) - Better validation for drag-to-reschedule
- `apps/api/src/services/appointments.ts` (EXTEND) - Add `rescheduleAppointment()` method
- `apps/api/src/routes/appointments.ts` (EXTEND) - POST for create, PATCH for reschedule

**Database:**
- No schema changes (use existing Appointment model)

### UX Flow: Create via Modal (from calendar)

```
Admin on calendar page
  ↓
Click empty Friday 2:00pm slot
  ↓
"Create Appointment" modal opens
  Form fields:
  - Type: [Introduction ▼]
  - Client: [Search clients... ▼] → "Client X"
  - Date: Friday, Dec 27, 2024 (prefilled, read-only)
  - Time: 2:00 PM (prefilled, editable)
  - Duration: 60 minutes (editable)
  - Notes: [optional text area]
  ↓
Click "Create & Send Invite"
  ↓
Validation:
  - Type selected? ✓
  - Client selected? ✓
  - Slot available? ✓
  ↓
POST /admin/appointments/invite
  {
    clientId: "...",
    type: "Introduction",
    expiresInDays: 3,
    proposedDate: "2024-12-27",
    proposedTime: "14:00"
  }
  ↓
Response: { bookingUrl: "...", appointment: {...} }
  ↓
Success toast: "Invitation sent to Client X"
Modal closes
Calendar refreshes
```

### UX Flow: Drag-to-Reschedule

```
Admin on calendar page
  ↓
Sees "Client X - Introduction 2:00 PM" block
  ↓
Drags block down to 3:00 PM slot
  ↓
"Confirm Reschedule" dialog appears:
  Old: Friday 2:00 PM - 3:00 PM
  New: Friday 3:00 PM - 4:00 PM
  [Cancel] [Confirm]
  ↓
Click "Confirm"
  ↓
Validation:
  - Slot available? ✓
  - Within availability? ✓
  ↓
PATCH /admin/appointments/{id}/reschedule
  { newScheduledAt: "2024-12-27T15:00:00Z" }
  ↓
Email sent to client: "Your appointment has been rescheduled to Friday 3:00 PM"
Calendar updates immediately
Toast: "Appointment rescheduled"
```

### Edge Cases & Error Handling

| Scenario | Behavior |
|----------|----------|
| Drag to blocked time | Show inline error: "This time is blocked" |
| Drag past booking window | Show warning: "This slot is outside normal hours. Continue?" |
| Client not selected | Form disable create button until selected |
| Appointment already booked | Can't create/reschedule to conflicting slot |
| Email send fails | Show warning: "Invitation created but email failed. [Retry]" |
| Concurrent edit (race condition) | Show: "This appointment was modified elsewhere. [Refresh]" |

---

## 3. PHASE 3: Metrics Dashboard

### Objective
Show analytics and reporting: appointment statistics, no-show rates, client patterns, revenue impact.

### Requirements

**Main Dashboard Page:** `/admin/appointments/metrics`

#### 3.1 Key Metrics Cards (Top Section)

- **Total Appointments** - Count of all appointments (statuses: Draft, InviteSent, Booked, Completed, NoShow)
- **Booked Rate** - % of invitations that were booked (Booked / InviteSent)
- **No-Show Rate** - % of booked that were no-shows (NoShow / (NoShow + Completed))
- **Average Outcome** - Sentiment breakdown: Positive / Neutral / Negative (of completed appointments)
- **Revenue per Meeting** - Sum of related invoices / number of completed appointments
- **Avg Duration** - Average length of booked/completed appointments

#### 3.2 Time Series Charts (Middle Section)

**Chart 1: Appointments Over Time**
- X-axis: Week or month (date range picker)
- Y-axis: Count
- Lines: Total created, Completed, NoShow
- Interaction: Hover for details

**Chart 2: Client Type Distribution**
- Pie chart: Introduction vs Creative Direction vs Contract/Invoicing
- Shows %

#### 3.3 Filters & Export (Top Bar)

- Date range picker: "Last 7 days" / "Last 30 days" / "Last 90 days" / Custom
- Type filter: All types / Introduction / Creative Direction / Contract
- Status filter: All / Booked / Completed / NoShow
- **Export CSV** button - Downloads filtered data

#### 3.4 Table: Top Clients by Appointments

- Client name, # appointments, completion rate, last appointment date
- Sort by frequency or completion rate

### Implementation Files

**Frontend:**
- `apps/web/src/routes/admin/appointments/metrics.tsx` (NEW)
- `apps/web/src/components/appointments/MetricsCards.tsx` (NEW)
- `apps/web/src/components/appointments/AppointmentChart.tsx` (NEW) - Time series chart (using chart library)
- `apps/web/src/components/appointments/ClientDistributionChart.tsx` (NEW) - Pie chart
- `apps/web/src/lib/api.ts` - Add `getAppointmentMetrics(filters)`

**Backend:**
- `apps/api/src/services/appointmentMetrics.ts` (NEW)
- `apps/api/src/routes/appointments.ts` - Add GET `/admin/appointments/metrics` endpoint

**Libraries:**
- Use existing `recharts` or `chart.js` (check package.json for available charting lib)

### UX Flow

```
Admin navigates to Appointments → Metrics tab
  ↓
Loads dashboard with:
  - Key metrics cards (top)
  - Date range selector + filters
  - Time series chart
  - Distribution pie chart
  - Top clients table
  ↓
Click "Last 30 days" button
  ↓
Dashboard refreshes with data for last 30 days
  ↓
Click "Export CSV"
  ↓
Downloads: appointments-2024-12-23.csv
  With columns: Date, Client, Type, Status, Outcome, Duration
```

### Backend Query Logic

```
GET /admin/appointments/metrics?startDate=X&endDate=Y&type=Z&status=W

Response: {
  summary: {
    total: number,
    booked: number,
    completed: number,
    noShow: number,
    bookingRate: percentage,
    noShowRate: percentage,
    avgDuration: minutes,
    revenuePerMeeting: number,
    avgOutcome: "Positive" | "Neutral" | "Negative"
  },
  timeline: [
    { week: "2024-12-16", created: 5, completed: 3, noShow: 1 },
    ...
  ],
  typeDistribution: [
    { type: "Introduction", count: 10, percentage: 50 },
    ...
  ],
  topClients: [
    { name: "Client X", appointments: 5, completionRate: 100%, lastDate: "..." },
    ...
  ]
}
```

---

## 4. Implementation Order & Dependencies

### Phase 1: Settings (Foundation) ✓ FIRST
- **Time:** ~4-6 hours
- **Dependencies:** None (extends existing settings page)
- **Why first:** Email templates are needed for all phases; calendar sync config is independent

### Phase 2: Calendar + Invitation (Core Feature) → SECOND
- **Time:** ~8-10 hours
- **Dependencies:** Phase 1 (email templates ready)
- **Why second:** Most interactive; unlocks "new invitation" workflow

### Phase 3: Metrics Dashboard (Polish/Analytics) → THIRD
- **Time:** ~3-4 hours
- **Dependencies:** None (read-only data)
- **Why last:** Nice-to-have; not blocking core workflow

---

## 5. Testing Strategy

### Unit Tests
- `appointmentService.rescheduleAppointment()` - various scenarios
- `appointmentsAvailability.isSlotAvailable()` - conflict detection
- Template validation - variable substitution

### Integration Tests
- Create appointment via modal → email sent ✓
- Drag to reschedule → conflict detected ✓
- Calendar sync OAuth → token stored ✓

### E2E Tests (Manual)
1. Admin creates invite from calendar → receives in inbox ✓
2. Drag reschedule with confirmation ✓
3. View metrics dashboard ✓

---

## 6. File Checklist

### Phase 1: Settings
- [ ] `apps/api/prisma/schema.prisma` - Extend AppointmentSettings
- [ ] `apps/api/src/services/appointments.ts` - Methods for templates
- [ ] `apps/api/src/services/calendarSync.ts` (NEW)
- [ ] `apps/api/src/routes/appointments.ts` - Update PATCH settings endpoint
- [ ] `apps/web/src/routes/admin/appointments/settings.tsx` - Add sections
- [ ] `apps/web/src/components/appointments/EmailTemplateEditor.tsx` (NEW)
- [ ] `apps/web/src/components/appointments/CalendarSyncPanel.tsx` (NEW)
- [ ] `apps/web/src/lib/api.ts` - New methods

### Phase 2: Calendar + Invitation
- [ ] `apps/web/src/components/calendar/MonthCalendar.tsx` (NEW)
- [ ] `apps/web/src/components/calendar/TimeSlotPicker.tsx` (NEW)
- [ ] `apps/web/src/components/calendar/WeekCalendar.tsx` - Extend
- [ ] `apps/web/src/components/appointments/CreateAppointmentModal.tsx` (NEW)
- [ ] `apps/web/src/components/appointments/CreateAppointmentPage.tsx` (NEW)
- [ ] `apps/web/src/routes/admin/appointments/new.tsx` (NEW)
- [ ] `apps/web/src/routes/admin/appointments/calendar.tsx` - Extend
- [ ] `apps/api/src/services/appointments.ts` - Add reschedule method
- [ ] `apps/api/src/routes/appointments.ts` - Update endpoints
- [ ] `apps/web/src/lib/api.ts` - New methods

### Phase 3: Metrics
- [ ] `apps/api/src/services/appointmentMetrics.ts` (NEW)
- [ ] `apps/api/src/routes/appointments.ts` - Add metrics endpoint
- [ ] `apps/web/src/routes/admin/appointments/metrics.tsx` (NEW)
- [ ] `apps/web/src/components/appointments/MetricsCards.tsx` (NEW)
- [ ] `apps/web/src/components/appointments/AppointmentChart.tsx` (NEW)
- [ ] `apps/web/src/components/appointments/ClientDistributionChart.tsx` (NEW)
- [ ] `apps/web/src/lib/api.ts` - Add metrics method

---

## 7. Success Criteria

✅ **Phase 1 (Settings):**
- Email template editor saves/loads
- Calendar sync OAuth flows work
- Settings persist across sessions

✅ **Phase 2 (Calendar + Invitation):**
- Click slot → create appointment modal opens
- New invitation sends email with booking link
- Drag-to-reschedule works with confirmation
- Availability validation prevents conflicts
- Month view shows appointments

✅ **Phase 3 (Metrics):**
- Dashboard loads metrics data
- Filters work (date range, type, status)
- CSV export works
- Charts display correctly

---

## 8. Known Constraints & Gotchas

1. **Email template variables** - Must be clearly documented so admins know what's available
2. **OAuth tokens** - Must be encrypted at rest; use secure storage
3. **Calendar sync rate limits** - Google/Outlook have API quotas; batch syncs, handle backoff
4. **Time zones** - All times stored in UTC; display in user's timezone (from settings)
5. **Concurrent edits** - If two admins edit same appointment simultaneously, use optimistic locking or last-write-wins
6. **Email failures** - If send fails, appointment is still created; show warning and allow manual retry
