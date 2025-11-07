# Contract System Extension - Complete Roadmap

## Current Status ✅
- ✅ Database schema with 10+ models
- ✅ Backend services (clauses, templates, contracts)
- ✅ 26 seeded clauses (6 mandatory + 20 optional)
- ✅ 4 professional contract templates
- ✅ Contract generation wizard (UI)
- ✅ Contract list and detail pages
- ✅ Basic CRUD operations

## Extension Plan - 6 Phases

---

## **Phase 3: Template Designer & Clause Management**
*Priority: HIGH | Duration: 2-3 days | Complexity: Medium*

### 3.1 Clause Library UI
**Goal:** Let admins browse, create, and edit contract clauses

**Tasks:**
1. Create `/admin/contracts/clauses` route
   - Grid/list view of all clauses
   - Search and filter by tags
   - Filter by mandatory/optional
   - Tag cloud visualization

2. Build clause editor modal
   - Rich text editor for `bodyHtml` (use TinyMCE or Tiptap)
   - Slug generator (auto-create from title)
   - Tag multi-select with autocomplete
   - Mandatory checkbox (with warning)
   - Variable placeholder helper
   - Preview pane

3. Clause actions
   - Create new clause
   - Edit existing clause
   - Soft delete (isActive = false)
   - Clone clause
   - Export clause as JSON

**Files to create:**
- `apps/web/src/routes/admin/contracts/clauses/index.tsx`
- `apps/web/src/components/contracts/ClauseEditor.tsx`
- `apps/web/src/components/contracts/RichTextEditor.tsx`

**API already exists:** ✅ All clause endpoints ready

---

### 3.2 Template Designer
**Goal:** Visual template builder with drag-and-drop clause selection

**Tasks:**
1. Create `/admin/contracts/templates` route
   - List all templates
   - Show published/draft status
   - Version history
   - Usage stats (how many contracts generated)

2. Template editor page `/admin/contracts/templates/[id]/edit`
   - **Left panel:** Clause library browser
     - Search clauses
     - Drag clauses to template
     - Mandatory clauses auto-included
   - **Center panel:** Template HTML editor
     - Rich text editor
     - Variable placeholder insertion button
     - Live preview toggle
   - **Right panel:** Variable schema designer
     - Add/edit form fields
     - Field types: text, number, date, select, multiselect, currency
     - Field validation rules
     - Section organizer (group fields)

3. Template actions
   - Create blank template
   - Clone existing template
   - Create new version
   - Publish/unpublish
   - Preview with sample data
   - Test generation

**Files to create:**
- `apps/web/src/routes/admin/contracts/templates/index.tsx`
- `apps/web/src/routes/admin/contracts/templates/[id]/edit.tsx`
- `apps/web/src/components/contracts/TemplateEditor.tsx`
- `apps/web/src/components/contracts/ClauseSelector.tsx`
- `apps/web/src/components/contracts/VariableSchemaDesigner.tsx`

**API already exists:** ✅ All template endpoints ready

---

## **Phase 4: PDF Generation & Document Management**
*Priority: HIGH | Duration: 2-3 days | Complexity: High*

### 4.1 HTML to PDF/A Conversion
**Goal:** Generate professional, archival-quality PDFs from contracts

**Backend tasks:**
1. Install PDF library
   ```bash
   cd apps/api
   pnpm add puppeteer pdf-lib
   ```

2. Create PDF service `apps/api/src/services/pdf.ts`
   - HTML to PDF conversion (using Puppeteer)
   - PDF/A-2b compliance (archival standard)
   - XMP metadata embedding
   - SHA-256 hash generation for integrity
   - Watermark for draft/preview PDFs
   - Custom header/footer templates

3. Add PDF generation endpoints
   - `POST /admin/contracts/:id/generate-pdf` - Generate PDF
   - `GET /admin/contracts/:id/pdf` - Download PDF
   - `GET /admin/contracts/:id/preview-pdf` - Preview with watermark

4. Update contract service
   - Auto-generate PDF when contract moves to SENT status
   - Store PDF in `apps/api/contracts/` directory
   - Store SHA-256 hash in database
   - Track PDF versions (regenerate if contract edited)

**Frontend tasks:**
1. Add PDF actions to contract detail page
   - "Generate PDF" button
   - "Download PDF" button
   - "Preview PDF" (opens in new tab with watermark)
   - PDF status indicator

2. Create PDF preview modal
   - Embedded PDF viewer
   - Page navigation
   - Zoom controls
   - Download button

**Files to create:**
- `apps/api/src/services/pdf.ts`
- `apps/api/src/routes/pdf.ts`
- `apps/web/src/components/contracts/PdfPreview.tsx`

**Technical considerations:**
- PDF/A compliance ensures long-term archival
- SHA-256 hashing proves document hasn't been tampered
- Puppeteer can render any HTML/CSS accurately
- Consider using headless Chrome in production

---

### 4.2 Document Verification System
**Goal:** Cryptographic proof of document authenticity

**Tasks:**
1. Hash storage and verification
   - Store SHA-256 hash when PDF generated
   - Add `documentHash` field to Contract model
   - Add `hashAlgorithm` field (default: 'sha256')

2. Create verification endpoint
   - `POST /api/contracts/verify` - Upload PDF to verify
   - Compare uploaded file hash with stored hash
   - Return verification result + contract details

3. Public verification page
   - `/verify` - Public verification portal
   - File upload
   - Show verification result
   - Display contract metadata (without sensitive info)
   - QR code on PDFs linking to verification page

**Files to create:**
- `apps/api/src/services/verification.ts`
- `apps/web/src/routes/verify.tsx`

---

## **Phase 5: E-Signature & Public Portal**
*Priority: HIGH | Duration: 3-4 days | Complexity: High*

### 5.1 Magic Link Generation
**Goal:** Secure, passwordless contract access for clients

**Backend tasks:**
1. Update contract model
   - Add `magicToken` field (UUID)
   - Add `magicTokenExpiry` field (DateTime)
   - Add `viewedAt` field (first view timestamp)

2. Create magic link service
   - Generate secure token (crypto.randomUUID())
   - Set expiry (default: 30 days)
   - Send email with link
   - Track link opens (email read receipts)

3. Add magic link endpoints
   - `POST /admin/contracts/:id/send` - Generate link & send email
   - `GET /portal/contracts/:token` - Access contract via magic link
   - `POST /portal/contracts/:token/resend` - Resend link

**Frontend tasks:**
1. Update "Send Contract" button
   - Show email preview modal
   - Customize email message
   - Set expiry date
   - Send immediately or schedule

2. Create email preview component
   - Show how email will look
   - Include magic link
   - Customize sender name
   - Add CC/BCC options

**Files to create:**
- `apps/api/src/services/magic-link.ts`
- `apps/web/src/components/contracts/EmailPreview.tsx`

---

### 5.2 Public Signing Portal
**Goal:** Beautiful, client-facing portal for viewing and signing contracts

**Public routes (no auth required):**
1. `/portal/contracts/:token` - View contract
   - Verify magic link validity
   - Show contract content (read-only)
   - Client information display
   - Progress indicator (Sent → Viewed → Signed)
   - Download PDF button
   - "Sign Contract" CTA

2. `/portal/contracts/:token/sign` - Signing page
   - Step 1: OTP verification (email or SMS)
   - Step 2: Read & initial each page
   - Step 3: Final signature
   - Step 4: Download signed copy

**Signing workflow:**
1. **OTP Verification**
   - Generate 6-digit code
   - Send via email (or SMS if phone provided)
   - 5-minute expiry
   - 3 retry limit
   - Rate limiting

2. **Per-Page Initials**
   - Show contract page-by-page
   - Checkbox to confirm reading
   - Initial box (typed or drawn signature)
   - Must initial all pages to proceed

3. **Final Signature**
   - Full legal disclaimer
   - Type or draw signature
   - Confirm legal name
   - IP address logging
   - User agent logging
   - Timestamp with timezone

4. **Post-Signature**
   - Update contract status to SIGNED
   - Store signature data (image + metadata)
   - Generate signed PDF with signatures embedded
   - Send confirmation email to both parties
   - Create audit log entry

**Files to create:**
- `apps/web/src/routes/portal/contracts/[token].tsx`
- `apps/web/src/routes/portal/contracts/[token]/sign.tsx`
- `apps/web/src/components/portal/ContractViewer.tsx`
- `apps/web/src/components/portal/SignatureCanvas.tsx`
- `apps/web/src/components/portal/OtpVerification.tsx`
- `apps/api/src/services/signature.ts`
- `apps/api/src/services/otp.ts`

**Technical considerations:**
- Store signatures as base64 PNG images
- Log IP + User Agent for legal validity
- Use browser geolocation API for location (with consent)
- Comply with E-SIGN Act and GDPR requirements
- Consider DocuSign/HelloSign integration as alternative

---

### 5.3 Audit Trail & Compliance
**Goal:** Complete, immutable record of all contract actions

**Tasks:**
1. Expand audit log model
   - Track every contract view (timestamp, IP, user agent)
   - Track PDF downloads
   - Track email opens (webhook from email service)
   - Track signature attempts (success/failure)
   - Track all edits (who, when, what changed)

2. Create audit trail viewer
   - Timeline view of all actions
   - Filter by action type
   - Export as PDF report
   - Compliance-ready formatting

3. Legal compliance features
   - GDPR right-to-delete (anonymize audit logs)
   - Data retention policies (auto-delete after X years)
   - Export all client data (GDPR compliance)
   - Consent tracking

**Files to create:**
- `apps/web/src/components/contracts/AuditTrail.tsx`
- `apps/api/src/services/audit-export.ts`

---

## **Phase 6: Automation & Reminders**
*Priority: MEDIUM | Duration: 2 days | Complexity: Medium*

### 6.1 Automated Invoice Creation
**Goal:** Auto-generate invoices when contracts are signed

**Backend tasks:**
1. Update pricing rules logic
   - Match contract to pricing rule by event type or template
   - Calculate deposit amount
   - Calculate final payment amount
   - Set due dates based on event date

2. Create invoice automation service
   - Listen for contract SIGNED event
   - Generate deposit invoice immediately
   - Schedule final payment invoice
   - Apply tax rates if configured
   - Link invoices to contract

3. Add webhook system
   - `POST /webhooks/contract-signed` - Trigger automation
   - Support for external integrations (Stripe, QuickBooks)

**Frontend tasks:**
1. Show linked invoices on contract detail page
   - Invoice list with status
   - Total amount due
   - Payment status
   - Quick pay button

**Files to create:**
- `apps/api/src/services/invoice-automation.ts`
- `apps/api/src/jobs/invoice-scheduler.ts`

---

### 6.2 Reminder System
**Goal:** Automated email reminders for unsigned contracts

**Backend tasks:**
1. Create reminder job (runs daily)
   - Find contracts SENT but not SIGNED
   - Check days since sent
   - Send reminder based on schedule:
     - Day 7: Gentle reminder
     - Day 14: Urgent reminder
     - Day 21: Final reminder
     - Day 28: Expiry warning

2. Business hours compliance
   - Only send emails 9am-5pm client timezone
   - Skip weekends and holidays
   - Respect "do not disturb" hours

3. Add reminder configuration to templates
   - Customize reminder schedule
   - Custom reminder email templates
   - Auto-expire after X days

**Frontend tasks:**
1. Reminder settings in contract detail
   - Pause reminders
   - Send manual reminder now
   - Customize next reminder date
   - View reminder history

2. Email template editor
   - Visual email editor
   - Variable placeholders
   - Preview with sample data
   - A/B testing support

**Files to create:**
- `apps/api/src/jobs/reminder-scheduler.ts`
- `apps/api/src/services/email-templates.ts`
- `apps/web/src/components/contracts/ReminderSettings.tsx`

---

## **Phase 7: Analytics & Reporting**
*Priority: LOW | Duration: 2 days | Complexity: Medium*

### 7.1 Contract Analytics Dashboard
**Goal:** Insights into contract performance

**Metrics to track:**
1. **Conversion metrics**
   - Sent → Viewed rate
   - Viewed → Signed rate
   - Average time to sign
   - Contracts by status (pie chart)

2. **Template performance**
   - Most used templates
   - Templates with highest sign rate
   - Templates with fastest sign time
   - Template version comparison

3. **Client behavior**
   - Clients with most contracts
   - Average response time by client
   - Clients needing follow-up

4. **Revenue insights**
   - Total contract value (sum of all signed)
   - Revenue by template type
   - Revenue by month
   - Average contract value

**Frontend tasks:**
1. Create analytics dashboard `/admin/contracts/analytics`
   - Charts and graphs (use Chart.js or Recharts)
   - Date range selector
   - Export reports as PDF
   - Real-time updates

**Files to create:**
- `apps/api/src/routes/analytics.ts`
- `apps/web/src/routes/admin/contracts/analytics.tsx`
- `apps/web/src/components/contracts/ContractChart.tsx`

---

### 7.2 Reporting & Export
**Goal:** Generate compliance and business reports

**Report types:**
1. **Compliance report**
   - All contracts in date range
   - Full audit trails
   - Signature verification
   - PDF export

2. **Revenue report**
   - Signed contracts by month
   - Revenue by template
   - Revenue by client
   - CSV/PDF export

3. **Performance report**
   - Conversion rates
   - Time metrics
   - Client response times
   - Template effectiveness

**Files to create:**
- `apps/api/src/services/reporting.ts`
- `apps/web/src/components/contracts/ReportBuilder.tsx`

---

## **Phase 8: Advanced Features** (Future)
*Priority: LOW | Duration: Variable*

### 8.1 Multi-Party Contracts
- Support for multiple signers
- Sequential signing workflow
- Parallel signing workflow
- Witness signatures
- Notary integration

### 8.2 Contract Amendments
- Create addendums to signed contracts
- Track amendment history
- Re-signature workflow
- Version comparison view

### 8.3 Contract Negotiation
- Comment system on contract sections
- Suggested edits (track changes)
- Counter-offers
- Negotiation history timeline

### 8.4 Advanced Template Features
- Conditional clauses (show/hide based on variables)
- Formula fields (auto-calculate totals)
- Lookup fields (pull from database)
- Repeating sections (line items)
- Template marketplace (buy/sell templates)

### 8.5 Integrations
- **Payment processors:** Stripe, Square, PayPal
- **Accounting:** QuickBooks, Xero, FreshBooks
- **CRM:** Salesforce, HubSpot
- **Calendar:** Google Calendar, Outlook
- **Storage:** Dropbox, Google Drive, OneDrive
- **E-signature:** DocuSign, HelloSign (as alternative)

### 8.6 Mobile App
- React Native mobile app
- Offline contract viewing
- Mobile signature capture
- Push notifications for contract updates

---

## Implementation Priority Order

### Week 1-2: Core Extensions
1. ✅ Phase 3.1: Clause Library UI (2 days)
2. ✅ Phase 3.2: Template Designer (3 days)

### Week 3-4: Document Management
3. ✅ Phase 4.1: PDF Generation (3 days)
4. ✅ Phase 4.2: Document Verification (1 day)

### Week 5-6: Client Portal
5. ✅ Phase 5.1: Magic Links (2 days)
6. ✅ Phase 5.2: Signing Portal (4 days)
7. ✅ Phase 5.3: Audit Trail (1 day)

### Week 7: Automation
8. ✅ Phase 6.1: Invoice Automation (2 days)
9. ✅ Phase 6.2: Reminder System (2 days)

### Week 8: Analytics
10. ✅ Phase 7.1: Analytics Dashboard (2 days)
11. ✅ Phase 7.2: Reporting (2 days)

---

## Technical Stack Recommendations

### PDF Generation
- **Puppeteer** - Best for HTML rendering
- **pdf-lib** - PDF manipulation
- **PDFKit** - Alternative, lighter weight

### Rich Text Editing
- **Tiptap** - Modern, extensible (recommended)
- **TinyMCE** - Feature-rich, enterprise-grade
- **Quill** - Lightweight, simple

### Signature Capture
- **react-signature-canvas** - Simple, works well
- **signature_pad** - Vanilla JS, lightweight

### Email Sending
- **SendGrid** - Reliable, affordable
- **Mailgun** - Developer-friendly
- **Amazon SES** - Cost-effective at scale

### Charts & Analytics
- **Recharts** - React-first, beautiful
- **Chart.js** - Popular, versatile
- **Victory** - Flexible, composable

### Job Scheduling
- **Bull** - Redis-based queue (recommended)
- **node-cron** - Simple cron jobs
- **Agenda** - MongoDB-based

---

## Database Migrations Needed

### Phase 4 - PDF Generation
```sql
ALTER TABLE "Contract" ADD COLUMN "documentHash" TEXT;
ALTER TABLE "Contract" ADD COLUMN "hashAlgorithm" TEXT DEFAULT 'sha256';
ALTER TABLE "Contract" ADD COLUMN "pdfGeneratedAt" TIMESTAMP;
```

### Phase 5 - E-Signature
```sql
ALTER TABLE "Contract" ADD COLUMN "magicToken" TEXT UNIQUE;
ALTER TABLE "Contract" ADD COLUMN "magicTokenExpiry" TIMESTAMP;
ALTER TABLE "Contract" ADD COLUMN "viewedAt" TIMESTAMP;
ALTER TABLE "Contract" ADD COLUMN "signatureData" JSONB;
ALTER TABLE "Contract" ADD COLUMN "signerIp" TEXT;
ALTER TABLE "Contract" ADD COLUMN "signerUserAgent" TEXT;
ALTER TABLE "Contract" ADD COLUMN "signerLocation" JSONB;

CREATE TABLE "ContractSignature" (
  "id" TEXT PRIMARY KEY,
  "contractId" TEXT NOT NULL REFERENCES "Contract"("id"),
  "signatureImage" TEXT NOT NULL,
  "signedAt" TIMESTAMP NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "location" JSONB
);
```

### Phase 6 - Reminders
```sql
CREATE TABLE "ContractReminder" (
  "id" TEXT PRIMARY KEY,
  "contractId" TEXT NOT NULL REFERENCES "Contract"("id"),
  "scheduledFor" TIMESTAMP NOT NULL,
  "sentAt" TIMESTAMP,
  "type" TEXT NOT NULL,
  "emailSubject" TEXT,
  "emailBody" TEXT
);
```

---

## Security Considerations

1. **Magic Links**
   - Use crypto-secure token generation
   - Set reasonable expiry (30 days max)
   - One-time use for sensitive actions
   - Rate limit link generation

2. **E-Signatures**
   - Store IP + User Agent for legal validity
   - Use HTTPS only (enforce TLS 1.3+)
   - Implement CSRF protection
   - Log all signature attempts

3. **PDF Security**
   - SHA-256 hash verification
   - Prevent PDF modification (set permissions)
   - Watermark draft PDFs
   - Encrypt sensitive PDFs (optional)

4. **Audit Compliance**
   - Immutable audit logs
   - Tamper-evident storage
   - Regular backups
   - GDPR right-to-delete (anonymize, don't delete logs)

---

## Testing Strategy

### Unit Tests
- Service functions (PDF generation, signature validation)
- API endpoints (contract generation, magic links)
- Utility functions (hash generation, OTP validation)

### Integration Tests
- Full contract generation workflow
- Signing workflow end-to-end
- Email sending and magic link delivery
- Invoice automation triggers

### E2E Tests (Playwright)
- Create contract via wizard
- Send contract to client
- Client views and signs contract
- Download signed PDF
- Verify audit trail

### Load Tests
- 1000 concurrent PDF generations
- 10000 magic link validations/sec
- Email queue performance

---

## Success Metrics

### Phase 3 - Template Designer
- ✅ Can create template in under 5 minutes
- ✅ All clause types supported
- ✅ Preview works accurately

### Phase 4 - PDF Generation
- ✅ PDF generated in under 3 seconds
- ✅ 100% rendering accuracy
- ✅ PDF/A compliance verified

### Phase 5 - E-Signature
- ✅ Client signs in under 2 minutes
- ✅ Zero security vulnerabilities
- ✅ Legal validity confirmed by counsel

### Phase 6 - Automation
- ✅ Invoices created within 1 minute of signature
- ✅ Reminders sent with 100% reliability
- ✅ Zero missed reminders

### Phase 7 - Analytics
- ✅ Dashboard loads in under 1 second
- ✅ All metrics accurate
- ✅ Reports generate in under 5 seconds

---

## Budget Estimate (External Services)

### Required Services
- **Email (SendGrid):** $15/month (40K emails)
- **PDF Storage (S3):** $5/month (100GB)
- **Redis (Upstash):** $0/month (free tier for job queue)

### Optional Services
- **SMS (Twilio):** $20/month (for OTP)
- **DocuSign:** $10/month/user (if using their API)
- **Monitoring (Sentry):** $26/month

**Total monthly cost:** $20-70 depending on features

---

## Next Session Plan

For next session, I recommend starting with **Phase 3.1: Clause Library UI** since:
1. It's the smallest, most self-contained feature
2. No external dependencies
3. Provides immediate value (manage clauses visually)
4. Good warm-up before complex features
5. Establishes UI patterns for template designer

**Estimated time:** 2-3 hours to complete fully

Shall we begin with Phase 3.1?
