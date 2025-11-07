# Contracts & Document Management System - Implementation Plan

**Project**: Mizu Studio Photography System
**Feature**: Contracts & Template Manager with E-Signing
**Created**: 2025-11-03
**Status**: Planning Phase

---

## Executive Summary

This implementation plan breaks down the Contracts & Document Management System into **5 manageable phases** with clear milestones, deliverables, and acceptance criteria. The system will enable full contract lifecycle management from template creation through e-signature and invoice automation.

**Total Estimated Effort**: 15-20 development sessions
**Timeline**: Phased rollout over multiple weeks
**Risk Level**: Medium-High (complex e-signing workflow, encryption, legal compliance)

---

## Architecture Overview

### Tech Stack
- **Backend**: Fastify + Prisma (PostgreSQL) + TypeScript
- **Frontend**: React + Vite + TypeScript + Tailwind
- **PDF Generation**: Puppeteer (Headless Chrome) → PDF/A
- **Search**: PostgreSQL FTS5 (Full-Text Search)
- **Encryption**: AES-256 for signed PDFs and snapshots
- **Email**: Existing SMTP (DKIM/SPF configured)

### Key Components
```
┌─────────────────────────────────────────────────────────────┐
│                     CONTRACTS SYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Clause     │  │   Template   │  │   Contract   │      │
│  │   Library    │─▶│   Designer   │─▶│  Generator   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌──────────────────────────────────────────────────┐       │
│  │           Conditional Logic Engine                │       │
│  │        (JSONLogic for auto-clause insertion)      │       │
│  └──────────────────────────────────────────────────┘       │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────┐       │
│  │              PDF Generation Service               │       │
│  │     (HTML → PDF/A with XMP metadata)             │       │
│  └──────────────────────────────────────────────────┘       │
│                          │                                    │
│         ┌────────────────┼────────────────┐                 │
│         ▼                ▼                 ▼                 │
│  ┌──────────┐   ┌──────────────┐   ┌───────────┐           │
│  │  Public  │   │   E-Sign      │   │  Invoice  │           │
│  │  Portal  │   │   Workflow    │   │ Automation│           │
│  └──────────┘   └──────────────┘   └───────────┘           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation & Data Models

**Goal**: Establish database schema, migrations, and basic CRUD operations
**Estimated Effort**: 2-3 sessions
**Priority**: CRITICAL (all other phases depend on this)

### Deliverables

#### 1.1 Database Schema & Migrations
- [ ] **Prisma Schema Updates**
  - Enhance existing `ContractTemplate` model
  - Add `Clause` model with tags and mandatory flags
  - Add `ClauseRule` model for conditional logic (JSONLogic)
  - Enhance `Contract` model with e-signing fields
  - Add `ContractEvent` model for audit trail
  - Add `ContractReminderRule` model
  - Add `PricingRule` model
  - Update `Invoice` model with contract linkage

- [ ] **Migration Files**
  - Create migration: `add_clause_library`
  - Create migration: `enhance_contract_templates`
  - Create migration: `enhance_contracts_esigning`
  - Create migration: `add_contract_events`
  - Create migration: `add_automation_rules`

- [ ] **Enums**
  ```typescript
  enum ContractStatus {
    DRAFT, SENT, VIEWED, SIGNED, COUNTERSIGNED,
    ACTIVE, EXPIRED, TERMINATED, VOIDED, CANCELLED
  }

  enum ContractEventType {
    CREATED, SENT, VIEWED, SIGNED, COUNTERSIGNED,
    EXPIRED, VOIDED, LINK_LOCKED, REMINDER_SENT,
    PDF_VIEWED, PASSWORD_FAILED, OTP_SENT, OTP_VERIFIED,
    SESSION_STARTED, SESSION_EXPIRED, REISSUED, REACTIVATED
  }

  enum DocumentType {
    SERVICE_AGREEMENT, BOOKING_CONTRACT,
    LICENSE_AGREEMENT, MODEL_RELEASE_ADULT,
    NDA, SUBCONTRACTOR_AGREEMENT, PRIVACY_CONSENT
  }

  enum EventType {
    WEDDING, BRAND_EDITORIAL, EVENT, PORTRAIT
  }
  ```

#### 1.2 Seed Data
- [ ] **Mandatory Clauses** (6 required)
  1. Liability & Indemnity
  2. IP & Usage Rights
  3. Payment & Cancellation
  4. Force Majeure
  5. Governing Law & Jurisdiction
  6. Data Protection (GDPR)

- [ ] **Optional Clauses** (15-20 common clauses)
  - Portfolio usage clause
  - Social media usage clause
  - Reschedule policy
  - Weather contingency
  - Equipment failure clause
  - Copyright transfer clause
  - Exclusive photographer clause
  - Image delivery timeline
  - Editing style clause
  - Second shooter clause
  - Raw file policy
  - Print rights clause

- [ ] **Template Examples** (3-4 starter templates)
  - Wedding Photography Contract
  - Brand/Editorial Contract
  - Portrait Session Agreement
  - Event Photography Contract

- [ ] **Pricing Rules**
  - Default: 50% deposit, balance due 30 days after event
  - Wedding: 30% deposit, 50% before event, 20% on delivery
  - Commercial: 100% upfront or NET 30 for established clients

#### 1.3 Backend Services (Foundation)
- [ ] `apps/api/src/services/clause.ts`
  - `createClause(data)`
  - `updateClause(id, data)`
  - `getClauseById(id)`
  - `listClauses(filters)`
  - `deleteClause(id)` (soft delete)

- [ ] `apps/api/src/services/contract-template.ts`
  - `createTemplate(data)`
  - `updateTemplate(id, data)`
  - `publishTemplate(id)`
  - `unpublishTemplate(id)`
  - `getTemplateById(id)`
  - `listTemplates(filters)`
  - `deleteTemplate(id)` (with confirmation)

- [ ] `apps/api/src/services/contract.ts` (basic CRUD only)
  - `createContractDraft(data)`
  - `getContractById(id)`
  - `listContracts(filters)`
  - `updateContract(id, data)`

### Acceptance Criteria
- ✅ All Prisma migrations run successfully
- ✅ Seed script creates 6 mandatory clauses + 20 optional clauses
- ✅ Seed script creates 4 template examples
- ✅ Can create, read, update, delete clauses via API
- ✅ Can create, read, update, delete templates via API
- ✅ Template includes clause references and variable schema
- ✅ Unit tests pass for all CRUD operations

### Testing Checklist
```bash
# Migration tests
pnpm prisma migrate dev
pnpm prisma db seed

# Service tests
pnpm test src/services/clause.test.ts
pnpm test src/services/contract-template.test.ts
```

---

## Phase 2: Template Designer & Contract Generation

**Goal**: Build admin UI for template/clause management and contract generation
**Estimated Effort**: 3-4 sessions
**Priority**: HIGH

### Deliverables

#### 2.1 Clause Library UI
- [ ] **Admin Page**: `/admin/contracts/clauses`
  - List view with tags filter
  - Search by title/slug
  - Mandatory clause badges
  - Create/Edit modal with rich text editor
  - Read-only zones for mandatory clauses
  - Tag management

- [ ] **Components**
  - `ClauseCard` - Display clause preview
  - `ClauseEditor` - Rich text editor with validation
  - `ClauseTagFilter` - Multi-select tag filter
  - `MandatoryBadge` - Visual indicator

#### 2.2 Template Designer UI
- [ ] **Admin Page**: `/admin/contracts/templates`
  - Template list with status (Published/Draft)
  - Create/Edit template page
  - Visual template builder
  - Clause selector (drag & drop or checkbox)
  - Variable definition designer
  - Preview with sample data
  - Publish/Unpublish toggle

- [ ] **Variable Designer**
  - Variable types: text, number, date, currency, percentage, email, phone, select
  - Validation rules: required, regex, min/max
  - Input masks for phone/currency
  - Default values
  - Placeholder text

- [ ] **Conditional Logic UI**
  - Simple condition builder (no-code)
  - AND/OR operators
  - Field comparisons (equals, contains, in, gt, lt)
  - Preview: "If [event_type] is [WEDDING] then include clause [X]"

#### 2.3 Contract Generation
- [ ] **Admin Page**: `/admin/contracts/new`
  - Step 1: Select client (autocomplete)
  - Step 2: Select template or quote (if from quote)
  - Step 3: Fill required variables with validation
  - Step 4: Review clauses (conditional clauses auto-inserted)
  - Step 5: Set sign-by date and effective date
  - Step 6: Generate preview PDF (watermarked)
  - Step 7: Approve & send

- [ ] **Backend: Contract Resolution**
  - `apps/api/src/services/contract-resolver.ts`
    - `resolveTemplate(templateId, variables, context)`
    - `evaluateClauseConditions(rules, context)`
    - `validateVariables(schema, values)`
    - `generateContractSnapshot(templateId, variables, clauses)`

#### 2.4 Contract Management UI
- [ ] **Admin Page**: `/admin/contracts`
  - Status board view (columns: Draft, Sent, Viewed, Signed, etc.)
  - List view with filters
  - Search by client name, contract number, content
  - Bulk actions: Send reminders, Archive expired
  - CSV export

- [ ] **Contract Detail Page**: `/admin/contracts/:id`
  - Timeline view (all events)
  - Snapshot viewer (immutable content)
  - PDF download
  - SHA-256 fingerprint display
  - Reissue button (creates -R1, -R2 version)
  - Void button (with reason)
  - Send/Resend button
  - Invoice linkage section

### Acceptance Criteria
- ✅ Can create and publish clause library
- ✅ Template designer saves variable schema correctly
- ✅ Conditional logic correctly inserts/omits clauses
- ✅ Missing required variables block contract generation
- ✅ Generated preview PDF shows watermark
- ✅ Contract snapshot JSON is immutable
- ✅ Timeline shows all actions chronologically

---

## Phase 3: PDF Generation Service

**Goal**: Implement HTML → PDF/A with pagination, XMP metadata, and deterministic rendering
**Estimated Effort**: 2-3 sessions
**Priority**: HIGH

### Deliverables

#### 3.1 PDF Service Setup
- [ ] Install dependencies
  ```bash
  pnpm add puppeteer pdf-lib
  pnpm add -D @types/puppeteer
  ```

- [ ] **PDF Service**: `apps/api/src/services/pdf-generator.ts`
  - `generateContractPDF(contract, options)`
  - PDF/A compliance mode
  - Embed fonts (subset for file size)
  - Fixed pagination with page breaks
  - Footer: `Page X/Y | Contract: CT-2025-0001`
  - Header: Studio logo + contract title

#### 3.2 HTML Template Engine
- [ ] **Template**: `apps/api/src/templates/contract.html`
  - Responsive A4 layout
  - Print-safe styles (no backgrounds, web fonts)
  - Page header/footer regions
  - Page-initial markers: `[Initial here: _____]`
  - Signature block at end

- [ ] **CSS**: `apps/api/src/templates/contract.css`
  - @page rules for pagination
  - Avoid orphan/widow lines
  - Keep clauses together (avoid mid-clause breaks)
  - Print color adjustments

#### 3.3 XMP Metadata Embedding
- [ ] **Metadata Service**: `apps/api/src/services/pdf-metadata.ts`
  - `embedXMP(pdfBuffer, metadata)`
  - Metadata includes:
    - Contract ID and number
    - Client info (hashed)
    - Signature timestamp and IP (hashed)
    - Template snapshot hash (SHA-256)
    - Audit trail JSON
  - No visible certificate page (metadata only)

#### 3.4 Watermarking
- [ ] **Watermark**: Preview PDFs only
  - Diagonal "PREVIEW - NOT FOR SIGNATURE" text
  - Light gray, 30% opacity
  - Repeated across all pages
  - Final signed PDF has NO watermark

#### 3.5 Hash & Verification
- [ ] **Hash Service**: `apps/api/src/services/hash.ts`
  - `computeSHA256(buffer)`
  - Store hash in database
  - Display hash on portal download page
  - Verification endpoint: `POST /api/contracts/:id/verify-pdf`

### Acceptance Criteria
- ✅ Generated PDF is valid PDF/A format
- ✅ All fonts embedded correctly
- ✅ Pagination is deterministic (same input = same output)
- ✅ Page numbers appear in footer on all pages
- ✅ Initial markers appear on every page
- ✅ XMP metadata present and readable
- ✅ Watermark only on preview, not on signed PDF
- ✅ SHA-256 hash matches downloaded file
- ✅ Golden master test passes (regression test for layout)

### Testing Checklist
```bash
# Visual regression test
pnpm test:pdf-generation

# Verify PDF/A compliance
pdfinfo contracts/CT-2025-0001.pdf | grep "PDF/A"

# Extract and verify XMP
exiftool contracts/CT-2025-0001.pdf
```

---

## Phase 4: Public Portal & E-Signing Workflow

**Goal**: Build client-facing signing portal with security (OTP, magic links, sessions)
**Estimated Effort**: 4-5 sessions
**Priority**: CRITICAL

### Deliverables

#### 4.1 Magic Link Generation
- [ ] **Service**: `apps/api/src/services/magic-link.ts`
  - `createMagicLink(contractId, email, expiresInDays)`
  - Generate cryptographically secure token (32 bytes)
  - Store SHA-256 hash of token (not plaintext)
  - Email client with link: `https://app.com/portal/:token`
  - Default expiry: 7 days
  - Track IP hash and UA hash for security

- [ ] **Security**
  - Rate limit: 10 magic link requests per hour per IP
  - Void link after 6 failed password attempts
  - Block if token used (one-time use for OTP verification)

#### 4.2 Portal Gateway
- [ ] **Public Route**: `/portal/:token`
  - Step 1: Validate token (not expired, not used)
  - Step 2: Optional password gate
  - Step 3: Email OTP verification
  - Step 4: Start signer session (30 min idle, 24h absolute)

- [ ] **Password Gate** (optional)
  - If contract has `portal_password_hash`, show password input
  - Track failed attempts
  - After 6 failures: void magic link + send admin alert

- [ ] **OTP Verification**
  - Send 6-digit code to `contract.otp_email`
  - Rate limit: 10 OTP requests per hour per IP
  - Expires in 10 minutes
  - Must match intended signer email
  - If email mismatch, block signing + log event

#### 4.3 Signer Session
- [ ] **Session Service**: `apps/api/src/services/signer-session.ts`
  - `createSession(contractId, token)`
  - Session stored in HTTP-only cookie
  - Idle timeout: 30 minutes (refresh on activity)
  - Absolute timeout: 24 hours
  - On timeout: redirect to expired page, allow request reactivation

#### 4.4 Signing UI
- [ ] **Portal Page**: `/portal/:token/sign`
  - Contract summary (fees, deliverables, key dates)
  - Full contract view (read-only, scrollable)
  - Required fields form (client fills in variables like address, phone, etc.)
  - Per-page initials:
    - Checkbox or signature pad for each page
    - Auto-scroll to next page after initial
    - Progress indicator: "Page 2/10 initialed"
  - Final signature section:
    - Typed name input
    - Checkbox: "I agree to be bound by this contract"
    - Large "Sign Contract" button

- [ ] **Responsive Design**
  - Mobile-first (most clients sign on phone)
  - Large tap targets (min 44x44px)
  - Dark mode support (OS preference)
  - Auto-scroll to next required field
  - Inline validation with helpful error messages

#### 4.5 Signature Submission
- [ ] **Backend**: `POST /portal/:token/sign`
  - Validate session
  - Validate all required fields filled
  - Validate all pages initialed
  - Validate typed name matches
  - Create audit JSON:
    ```json
    {
      "signedAt": "2025-11-03T14:23:10Z",
      "ip": "sha256(1.2.3.4)",
      "userAgent": "sha256(Mozilla...)",
      "typedName": "John Doe",
      "initialsPerPage": [true, true, true, ...],
      "sessionId": "abc123"
    }
    ```
  - Generate final PDF (no watermark)
  - Embed XMP metadata with audit trail
  - Compute SHA-256 hash
  - Encrypt PDF and snapshot JSON (AES-256)
  - Store encrypted files
  - Update contract status: SIGNED
  - Auto-countersign (set COUNTERSIGNED status)
  - Log `CONTRACT_EVENT: SIGNED` and `COUNTERSIGNED`
  - Trigger invoice automation (Phase 5)
  - Send confirmation email to client + admin

#### 4.6 Post-Signature
- [ ] **Download Portal**: `/portal/:token/download`
  - Display contract summary
  - Show SHA-256 fingerprint
  - Download signed PDF button
  - Log `PDF_VIEWED` event on each download

- [ ] **Reactivation Request**: `/portal/:token/request-reactivation`
  - If magic link expired, client can request reactivation
  - Sends email to admin (does not auto-reactivate)
  - Admin can reactivate same token with new expiry window
  - Preserves contract ID and content

### Acceptance Criteria
- ✅ Magic link email sent with correct expiry
- ✅ Password gate blocks incorrect passwords
- ✅ OTP sent to correct email
- ✅ Email mismatch blocks signing
- ✅ All pages must be initialed before signing
- ✅ Session expires after 30 min idle
- ✅ Audit trail contains IP (hashed), UA (hashed), timestamp
- ✅ PDF generated without watermark
- ✅ XMP metadata embedded correctly
- ✅ SHA-256 hash displayed and verified
- ✅ Encrypted files stored securely
- ✅ Confirmation email sent to both parties
- ✅ Contract status updated to COUNTERSIGNED
- ✅ Link voided after 6 password failures

### Security Testing
```bash
# Test OTP rate limiting
curl -X POST /portal/TOKEN/otp -H "X-Real-IP: 1.2.3.4" # 11th request should fail

# Test session timeout
# Wait 31 minutes, then try to access signing page

# Test password lockout
# Enter wrong password 6 times, verify link voided

# Test email mismatch
# Submit signing with different email, verify rejection
```

---

## Phase 5: Automation & Reminders

**Goal**: Auto-create invoices on signature, send reminders, calendar integration
**Estimated Effort**: 2-3 sessions
**Priority**: MEDIUM

### Deliverables

#### 5.1 Invoice Automation
- [ ] **Service**: `apps/api/src/services/invoice-automation.ts`
  - `createInvoiceFromContract(contractId)`
  - Lookup pricing rule by `event_type` or `template_id`
  - Create invoice with:
    - Deposit invoice (XX% of total)
    - Due date: immediate or before event date
    - Link to contract ID
  - If pricing rule has multiple payments:
    - Create invoice series (deposit + final payment)
  - On failure:
    - Set `contract.needs_invoice_retry = true`
    - Set `contract.invoice_failure_reason`
    - Show banner on admin detail page
    - Admin can retry manually

- [ ] **Webhook**: Called after signature
  - `POST /internal/contracts/:id/after-signature`
  - Triggers invoice creation
  - Catches and logs errors
  - Returns success/failure to caller

#### 5.2 Reminder System
- [ ] **Service**: `apps/api/src/services/contract-reminders.ts`
  - `scheduleReminders(contractId)`
  - Default cadence: T-3, T, T+3, T+7 (relative to sign_by_at)
  - Check reminder rules table for custom cadences
  - Business hours only: 9 AM - 5 PM in `Europe/London`
  - Per-client cooldown: 24 hours (no spam)
  - Mark events: `REMINDER_SENT`

- [ ] **Cron Job**: `apps/api/src/jobs/send-contract-reminders.ts`
  - Runs every hour
  - Query contracts with:
    - Status: SENT or VIEWED
    - `sign_by_at` approaching
    - Last reminder > 24 hours ago
  - Send reminder email
  - Respect business hours (adjust for DST)

- [ ] **Manual Reminder**: Admin UI button
  - "Send Reminder Now" on contract detail page
  - Bypasses cooldown (admin override)

#### 5.3 Email Templates
- [ ] **Templates**: `apps/api/src/templates/emails/`
  - `contract-invitation.html` - Magic link email
  - `contract-reminder.html` - Reminder email
  - `contract-signed-confirmation.html` - Sent after signing
  - `contract-expired.html` - Sent when contract expires unsigned
  - `contract-voided.html` - Sent when link is voided
  - All templates use placeholders:
    - `{{client_name}}`
    - `{{contract_id}}`
    - `{{sign_by_date}}`
    - `{{magic_link}}`
    - `{{studio_footer}}`

#### 5.4 Calendar Integration
- [ ] **Service**: `apps/api/src/services/calendar.ts`
  - `addContractDates(contractId)`
  - Push to Google Calendar:
    - Event: "Contract Sign-By: [Client Name]"
    - Date: `sign_by_at`
    - Event: "Contract Effective: [Client Name]"
    - Date: `effective_at`
  - On API failure:
    - Generate .ics file
    - Attach to confirmation email as fallback

### Acceptance Criteria
- ✅ Invoice created automatically on signature
- ✅ Invoice linked to contract ID
- ✅ Failure shows retry banner on admin UI
- ✅ Reminders sent at correct times (T-3, T, T+3, T+7)
- ✅ Reminders only sent during business hours
- ✅ No reminder sent within 24 hours of last one
- ✅ Admin can trigger manual reminder
- ✅ Calendar events created for sign-by and effective dates
- ✅ .ics file attached if Google Calendar fails
- ✅ All emails deliverable (DKIM/SPF pass)

---

## Phase 6: Search, OCR & Advanced Features

**Goal**: Full-text search, OCR for scanned documents, advanced admin workflows
**Estimated Effort**: 2-3 sessions
**Priority**: LOW (nice-to-have)

### Deliverables

#### 6.1 Full-Text Search (FTS5)
- [ ] **Migration**: Add FTS5 virtual table
  ```sql
  CREATE VIRTUAL TABLE contract_search USING fts5(
    contract_id, contract_number, client_name,
    snapshot_text, ocr_text
  );
  ```

- [ ] **Indexer**: `apps/api/src/services/contract-indexer.ts`
  - `indexContract(contractId)`
  - Extract text from snapshot JSON
  - Extract text from OCR sidecar (if exists)
  - Insert into FTS5 table
  - Update on contract changes

- [ ] **Search API**: `GET /api/contracts/search?q=term`
  - Full-text search across contracts
  - Filters: status, client, date range, tags
  - Results ranked by relevance
  - Highlight matching terms

#### 6.2 OCR for Scanned PDFs
- [ ] **OCR Service**: `apps/api/src/services/ocr.ts`
  - `extractTextFromPDF(pdfPath)`
  - Use Tesseract.js or similar
  - Save sidecar text file: `contracts/CT-2025-0001.txt`
  - Index text in FTS5

- [ ] **Worker**: Background job for OCR
  - Process uploaded PDFs asynchronously
  - Update contract with `ocr_text_path`
  - Re-index after OCR complete

#### 6.3 Advanced Admin Workflows
- [ ] **Reissue Contract** (`-R1`, `-R2`)
  - Freeze current contract (set TERMINATED)
  - Increment `reissue_index`
  - Create new contract with same `base_number`
  - New contract number: `CT-2025-0001-R1`
  - Regenerate PDF with updated content
  - Preserve audit trail link to original

- [ ] **Bulk Operations**
  - Archive expired contracts (batch update status)
  - Send reminders to multiple contracts
  - Export contracts to CSV/Excel
  - Bulk void (with confirmation)

- [ ] **Destructive Actions**
  - Void template: Requires email OTP
  - Delete template: Requires email OTP
  - Void contract: Requires reason + email OTP

#### 6.4 Analytics & Reports
- [ ] **Dashboard Widgets**
  - Contracts pending signature (count)
  - Contracts expiring this week
  - Average time to signature
  - Signature completion rate
  - Most used templates

- [ ] **Reports**
  - Export all contracts for date range
  - Export by client
  - Export by template
  - Audit trail export for compliance

### Acceptance Criteria
- ✅ Search returns relevant contracts quickly
- ✅ OCR text indexed and searchable
- ✅ Reissued contracts preserve history
- ✅ Bulk operations work correctly
- ✅ Destructive actions require email confirmation
- ✅ Dashboard widgets display accurate data
- ✅ Reports export in CSV format

---

## Security & Compliance Checklist

### Encryption
- [ ] AES-256 encryption for signed PDFs
- [ ] AES-256 encryption for snapshot JSON
- [ ] Encryption keys stored in environment variables
- [ ] Key rotation support (future)
- [ ] Encrypted backups (server-side)

### Authentication & Authorization
- [ ] Magic links expire after 7 days
- [ ] OTP rate limiting (10/hour/IP)
- [ ] Password gate rate limiting (6 attempts max)
- [ ] Session timeouts enforced (30 min idle, 24h absolute)
- [ ] Admin actions logged in audit trail
- [ ] Email verification required for signing

### Data Retention
- [ ] Signed PDFs retained 6 years (configurable)
- [ ] Snapshot JSON retained 6 years
- [ ] Audit logs retained 12 months
- [ ] Personal data masked after retention period
- [ ] Purge scripts for expired data

### Audit & Compliance
- [ ] Every action logged in `contract_events`
- [ ] IP addresses hashed (SHA-256)
- [ ] User agents hashed
- [ ] SHA-256 fingerprint for every signed PDF
- [ ] XMP metadata embedded in PDF
- [ ] Immutable snapshot JSON
- [ ] Timeline view shows full history

### GDPR Compliance
- [ ] Client can request data export
- [ ] Client can request data deletion (after retention)
- [ ] Privacy consent clause in contracts
- [ ] Data processing agreement available
- [ ] Cookie consent for signer sessions

---

## Testing Strategy

### Unit Tests
```bash
# Service layer
pnpm test src/services/clause.test.ts
pnpm test src/services/contract-template.test.ts
pnpm test src/services/contract-resolver.test.ts
pnpm test src/services/pdf-generator.test.ts
pnpm test src/services/magic-link.test.ts
pnpm test src/services/invoice-automation.test.ts
```

### Integration Tests
```bash
# API endpoints
pnpm test:integration src/routes/contracts.test.ts
pnpm test:integration src/routes/portal.test.ts
```

### E2E Tests (Playwright)
```typescript
// Happy path
test('Create contract → Send → OTP verify → Sign → Countersign → Invoice created', async () => {
  // ...
});

// Edge cases
test('Expired link reactivated', async () => { ... });
test('6 password failures void link', async () => { ... });
test('Email mismatch blocks signing', async () => { ... });
test('Invoice failure shows retry banner', async () => { ... });
```

### Visual Regression Tests
```bash
# PDF layout stability
pnpm test:pdf-regression

# Ensure pagination doesn't change across runs
```

---

## Environment Configuration

```bash
# Contract System
CONTRACT_NUMBER_PREFIX=CT
TIMEZONE=Europe/London
MAGIC_LINK_DAYS=7
PORTAL_MAX_FAILED_PW=6
SIGNER_IDLE_MIN=30
SIGNER_ABSOLUTE_HOURS=24
OTP_RATE_PER_IP_PER_HOUR=10

# Encryption
AES_PASSPHRASE=<strong-secret-key>
AES_KEY_VERSION=1

# PDF Generation
PDF_PUPPETEER_ARGS=--no-sandbox
PDF_FONT_PATH=./fonts

# Reminders
REMINDER_BUSINESS_START=09:00
REMINDER_BUSINESS_END=17:00
REMINDER_COOLDOWN_HOURS=24

# Calendar
GOOGLE_CALENDAR_API_KEY=<api-key>
GOOGLE_CALENDAR_ID=<calendar-id>

# Email
EMAIL_FROM=contracts@mizustudio.com
EMAIL_DKIM_ENABLED=true
EMAIL_REPLY_TO=info@mizustudio.com
```

---

## Rollout Plan

### Week 1-2: Phase 1 (Foundation)
- Set up database schema
- Create migrations
- Build seed scripts
- Implement basic CRUD services
- **Milestone**: Seed data loads successfully

### Week 3-4: Phase 2 (Template Designer)
- Build clause library UI
- Build template designer
- Implement contract generation
- **Milestone**: Can create and generate contracts from templates

### Week 5-6: Phase 3 (PDF Service)
- Set up Puppeteer
- Implement PDF generation
- Add XMP metadata embedding
- Test pagination and fonts
- **Milestone**: PDFs generate correctly with metadata

### Week 7-9: Phase 4 (E-Signing)
- Build public portal
- Implement magic links and OTP
- Build signing UI
- Implement signature submission
- **Milestone**: Full e-signing workflow functional

### Week 10-11: Phase 5 (Automation)
- Invoice automation on signature
- Reminder system and cron jobs
- Calendar integration
- **Milestone**: Invoices auto-create, reminders sent

### Week 12: Phase 6 (Advanced)
- FTS5 search
- OCR for scanned docs
- Analytics dashboard
- **Milestone**: System fully featured

---

## Risk Assessment

### High Risk
- **PDF Generation Complexity**: Pagination, fonts, XMP → Mitigate with golden master tests
- **E-Signing Legal Validity**: Audit trail must be complete → Mitigate with comprehensive logging
- **Data Encryption**: Key management, rotation → Mitigate with env vars + HSM plan

### Medium Risk
- **Email Deliverability**: Reminders, OTP → Mitigate with DKIM/SPF verification
- **Session Management**: Timeouts, security → Mitigate with industry-standard session library
- **Invoice Integration**: Failure handling → Mitigate with retry banner + manual trigger

### Low Risk
- **OCR Accuracy**: Optional feature → Mitigate with manual review option
- **Calendar Integration**: Fallback to .ics → Mitigate with email attachment
- **Search Performance**: FTS5 scalability → Mitigate with pagination, caching

---

## Success Metrics

### Functional Metrics
- [ ] Contract creation time < 5 minutes
- [ ] PDF generation time < 10 seconds
- [ ] Signature completion rate > 80%
- [ ] Zero lost signatures (audit trail complete)
- [ ] Invoice auto-creation success rate > 95%

### Performance Metrics
- [ ] Contract list page loads < 1 second
- [ ] Contract detail page loads < 2 seconds
- [ ] Portal signing page loads < 1 second
- [ ] Search results return < 500ms

### Security Metrics
- [ ] Zero magic link reuse incidents
- [ ] Zero session hijacking incidents
- [ ] 100% of signatures have complete audit trails
- [ ] 100% of PDFs have valid SHA-256 hashes

---

## Next Steps

1. **Review & Approve**: Review this plan and approve phases
2. **Environment Setup**: Configure environment variables
3. **Begin Phase 1**: Start with database schema and migrations
4. **Regular Check-ins**: Weekly progress reviews
5. **Iterate**: Adjust plan based on findings during implementation

---

## Questions & Decisions Needed

1. **PDF Storage**: Local filesystem or cloud (S3/GCS)?
2. **Encryption Key Management**: ENV vars now, HSM later?
3. **Email Provider**: Current SMTP or switch to SendGrid/Postmark?
4. **OCR Priority**: Phase 6 or defer to later?
5. **Calendar Provider**: Google Calendar API or iCal only?
6. **Backup Strategy**: Daily encrypted backups to where?
7. **Monitoring**: Sentry for errors? Logging service?

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Next Review**: After Phase 1 completion
