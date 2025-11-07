# Kori Photography Platform — Invoices, Proposals & Contracts Workflow

**Stable v1.0 — 2025-11-07**

Comprehensive end-to-end workflow for generating, managing, and integrating **Proposals**, **Contracts**, and **Invoices** in the Kori Photography Platform.

This document merges operational specifications with the complete API/database workflow details and serves as the baseline for Milestone 4: "Sales → Contract → Cash".

---

## Table of Contents

1. [Proposal Workflow](#proposal-workflow)
2. [Contract Workflow](#contract-workflow)
3. [Invoice Workflow](#invoice-workflow)
4. [Integration Points](#integration-points)
5. [Status Lifecycles](#status-lifecycles)
6. [Payment & Reconciliation](#payment--reconciliation)
7. [Key Features Summary](#key-features-summary)
8. [Database Relationships](#database-relationships)
9. [Implementation Notes](#implementation-notes)
10. [Future Enhancements](#future-enhancements)

---

## PROPOSAL WORKFLOW

### Overview
Proposals are quotations for photography services. They outline deliverables, pricing, and terms and must be **accepted by the client** before converting into a contract. They contain line items, pricing, terms, and require client acceptance before converting to a contract.

### Core Models
- `Proposal`, `ProposalItem`
- `ProposalTemplate`, `ProposalTemplateItem`
- `ProposalEmailTemplate`

**Detailed References:**
- **Proposal** (`apps/api/prisma/schema.prisma:427`)
- **ProposalItem** (line items)
- **ProposalTemplate** (reusable templates)
- **ProposalTemplateItem** (template line items)
- **ProposalEmailTemplate** (email templates for sending)

### Complete Workflow

#### Phase 1: PROPOSAL CREATION

**Option A: Create from Scratch**

1. **Admin navigates to Proposals**
   - Route: `/admin/proposals` (Frontend)
   - Component: `apps/web/src/routes/admin/proposals/index.tsx`

2. **Click "New Proposal" button**
   - Route: `/admin/proposals/new` (Frontend)
   - Component: `apps/web/src/routes/admin/proposals/new.tsx`

3. **Fill Proposal Form**
   - Title (required)
   - Client selection (required)
   - Description (optional)
   - Line items with:
     - Description
     - Quantity
     - Unit Price
     - Amount (auto-calculated)
   - Pricing:
     - Subtotal (auto-calculated)
     - Tax Rate (optional)
     - Tax Amount (auto-calculated)
     - Total (auto-calculated)
   - Terms and conditions (optional)
   - Expiration date (optional)

4. **Submit Proposal**
   - **API Endpoint:** `POST /admin/proposals`
   - **Handler:** `apps/api/src/routes/proposals.ts:85`
   - **Service:** `ProposalService.createProposal()` in `apps/api/src/services/proposal.ts`
   - **Validation:**
     - title required
     - clientId required
     - At least one line item required
     - Prices must be valid decimals
   - **Database:**
     - Create `Proposal` record with status `DRAFT`
     - Generate unique `proposalNumber` (e.g., PROP-2025-001)
     - Create `ProposalItem` records for each line item
     - Set `createdBy` to current admin user
   - **Response:** Returns created proposal with all details

**Option B: Create from Template**

1. **From Proposal Templates page**
   - Route: `/admin/proposal-templates`
   - Component: `apps/web/src/routes/admin/proposal-templates/index.tsx`

2. **Select template**
   - `AdminProposalTemplates` component shows all templates
   - Click "Use Template"

3. **Auto-populate form**
   - Title from template
   - All template line items loaded
   - Default terms from template
   - Admin can modify before saving

4. **Save as new proposal**
   - Same as Option A creation flow

#### Phase 2: PROPOSAL EDITING

1. **Admin views proposal details**
   - Route: `/admin/proposals/:id`
   - Component: `apps/web/src/routes/admin/proposals/[id].tsx`

2. **Click "Edit" (only for DRAFT/VIEWED status)**
   - Route: `/admin/proposals/:id/edit`
   - Component: `apps/web/src/routes/admin/proposals/edit.tsx`

3. **Modify proposal fields**
   - Update title, description, terms
   - Add/remove/update line items
   - Adjust pricing, tax rates
   - Update expiration date

4. **Save changes**
   - **API Endpoint:** `PUT /admin/proposals/:id`
   - **Handler:** `apps/api/src/routes/proposals.ts:165`
   - **Service:** `ProposalService.updateProposal()`
   - **Validation:** Same as creation
   - **Database:** Update `Proposal` and `ProposalItem` records
   - **Restrictions:**
     - Cannot edit after SENT status (except limited fields)
     - Cannot edit if contract already created

#### Phase 3: PROPOSAL SENDING

1. **Admin views proposal**
   - Status: `DRAFT` or `VIEWED`

2. **Click "Send Proposal" button**
   - Opens email template selector
   - Shows available email templates from `ProposalEmailTemplate` table

3. **Select email template**
   - Template contains:
     - Email subject line
     - Email body content
     - Template variables (e.g., {{clientName}}, {{proposalLink}})
   - Variables auto-replaced with actual data

4. **Send proposal**
   - **API Endpoint:** `POST /admin/proposals/:id/send`
   - **Handler:** `apps/api/src/routes/proposals.ts`
   - **Service:** `ProposalService.sendProposal()`
   - **Actions:**
     - Generate PDF of proposal
     - Store PDF at `pdfPath`
     - Update status to `SENT`
     - Set `sentAt` timestamp
     - Generate magic link token for client viewing
     - Send email via `sendEmail()` service
     - Record audit log
   - **Email Contains:**
     - Personalized greeting
     - Proposal details summary
     - Magic link to view/accept proposal
     - Call to action with due date

#### Phase 4: CLIENT ENGAGEMENT

1. **Client receives email**
   - Contains clickable link to view proposal
   - No authentication required

2. **Client views proposal**
   - Route: `/client/proposal/:proposalNumber` (Public)
   - Component: `apps/web/src/routes/client/proposal/[proposalNumber].tsx`
   - **API Endpoint:** `GET /public/proposals/:token`
   - **Handler:** `apps/api/src/routes/publicProposal.ts`
   - **Database Update:** Set `viewedAt` timestamp, status changes to `VIEWED`

3. **Client accepts or declines**
   - **Accept Proposal:**
     - Click "Accept Proposal" button
     - May trigger OTP verification (if configured)
     - **API Endpoint:** `POST /public/proposals/:token/accept`
     - Database: Set `acceptedAt` timestamp, status to `ACCEPTED`

   - **Decline Proposal:**
     - Click "Decline" button
     - Optional: Add decline reason
     - **API Endpoint:** `POST /public/proposals/:token/decline`
     - Database: Set `declinedAt` timestamp, status to `DECLINED`

#### Phase 5: PROPOSAL EXPIRATION

1. **System checks expiration**
   - Background job (if configured) checks `expiresAt` date
   - If current date > `expiresAt`, status changes to `EXPIRED`

2. **Admin can extend**
   - Update `expiresAt` date
   - Send reminder email with new deadline

#### Phase 6: PROPOSAL CONVERSION TO CONTRACT

1. **After acceptance**
   - Admin views accepted proposal
   - Clicks "Convert to Contract"

2. **Create Contract from Proposal**
   - **API Endpoint:** `POST /admin/proposals/:id/convert-to-contract`
   - **Handler:** `apps/api/src/routes/proposals.ts`
   - **Service:** `ProposalConversionService.convertToContract()`
   - **Process:**
     - Create new `Contract` record
     - Link to proposal via `proposalId`
     - Copy proposal content to contract
     - Create contract PDF
     - Set contract to `DRAFT` status
   - **Result:** Proposal now linked to contract, moves to contract workflow

### API Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/admin/proposals/stats` | Get statistics | Admin |
| GET | `/admin/proposals` | List all proposals | Admin |
| GET | `/admin/proposals/:id` | Get single proposal | Admin |
| POST | `/admin/proposals` | Create proposal | Admin |
| PUT | `/admin/proposals/:id` | Update proposal | Admin |
| DELETE | `/admin/proposals/:id` | Delete proposal | Admin |
| POST | `/admin/proposals/:id/send` | Send proposal to client | Admin |
| POST | `/admin/proposals/:id/convert-to-contract` | Convert to contract | Admin |
| GET | `/public/proposals/:token` | Client views proposal | Public |
| POST | `/public/proposals/:token/accept` | Client accepts | Public |
| POST | `/public/proposals/:token/decline` | Client declines | Public |

### Status Lifecycle

```
DRAFT → SENT → VIEWED → ACCEPTED → (Convert to Contract)
                  ↓
               DECLINED
                  ↓
               EXPIRED
```

---

## CONTRACT WORKFLOW

### Overview
A contract is a legally binding agreement created from an accepted proposal or manually. It supports e-signing, tracking, versioning, and automatic invoice generation.

### Database Models
- **Contract** (`apps/api/prisma/schema.prisma:683`)
- **ContractTemplate** (reusable contract templates)
- **ContractEvent** (audit trail of all contract actions)
- **ContractReminderRule** (reminder configuration)
- **Clause** (reusable contract clauses)

### Complete Workflow

#### Phase 1: CONTRACT CREATION

**Option A: Manual Creation**

1. **Admin navigates to Contracts**
   - Route: `/admin/contracts`
   - Component: `apps/web/src/routes/admin/contracts/index.tsx`

2. **Click "New Contract"**
   - Select contract template
   - Templates found in `ContractTemplate` table
   - Template contains:
     - Contract content (legacy or HTML)
     - Variable definitions with validation
     - Mandatory clauses (references to Clause records)
     - Document type (SERVICE_AGREEMENT, BOOKING_CONTRACT, etc.)

3. **Fill Contract Form**
   - Title (required)
   - Client selection (required)
   - Template selection (optional)
   - Fill template variables:
     - Client name, email, address
     - Service description
     - Dates (start, end, sign-by)
     - Terms and conditions
     - Custom fields per template
   - Configure e-signing:
     - OTP verification (optional)
     - Portal password requirement
     - Sign-by date (required)

4. **Submit Contract**
   - **API Endpoint:** `POST /admin/contracts`
   - **Handler:** `apps/api/src/routes/contracts.ts:115`
   - **Service:** `ContractService.createContract()`
   - **Process:**
     - Validate required fields
     - Replace template variables with actual values
     - Generate contract HTML from template
     - Create `Contract` record with status `DRAFT`
     - Generate unique `contractNumber` (e.g., CT-2025-0001)
     - Create `ContractEvent` record with type `CREATED`
     - Set `createdBy` to current admin
   - **Database:** Contract stored with status `DRAFT`

**Option B: Convert from Proposal**

1. **From accepted proposal**
   - Route: `/admin/proposals/:id`
   - Click "Convert to Contract"

2. **Auto-populated contract form**
   - Client information from proposal
   - Services/items from proposal line items
   - Proposal content as contract body (optional)

3. **Select template**
   - Choose appropriate contract template
   - System auto-fills available variables

4. **Review and submit**
   - Same submission flow as Option A

#### Phase 2: CONTRACT EDITING

1. **Admin views contract details**
   - Route: `/admin/contracts/:id`
   - Component: `apps/web/src/routes/admin/contracts/[id].tsx`

2. **Click "Edit" (only for DRAFT status)**
   - Route: `/admin/contracts/:id/edit`

3. **Modify contract**
   - Update client, title, dates
   - Re-fill template variables
   - Add/remove clauses
   - Update terms

4. **Save changes**
   - **API Endpoint:** `PUT /admin/contracts/:id`
   - **Handler:** `apps/api/src/routes/contracts.ts:200`
   - **Service:** `ContractService.updateContract()`
   - **Database:** Update `Contract` record
   - **Restrictions:**
     - Only editable in DRAFT status
     - Cannot edit after sent to client

#### Phase 3: PDF GENERATION

1. **System generates PDF**
   - **API Endpoint:** `POST /admin/contracts/:id/generate-pdf`
   - **Handler:** Integrated in contract creation/update
   - **Process:**
     - Convert contract HTML to PDF
     - Store at `pdfPath` location
     - Generate SHA256 hash for integrity (`pdfHash`)
     - Record generation time (`pdfGeneratedAt`)
   - **Output:** PDF stored in `apps/api/uploads/contracts/`

#### Phase 4: CONTRACT SENDING

1. **Admin reviews contract**
   - Status: `DRAFT`
   - PDF generated

2. **Click "Send for Signature"**
   - Initiates e-signing workflow

3. **Configure e-signing**
   - Select signing method:
     - **Option A:** OTP sent to client email
     - **Option B:** Magic link with no password
     - **Option C:** Portal with password
   - Set sign-by date (required)
   - Optionally add reminder rules

4. **Send to Client**
   - **API Endpoint:** `POST /admin/contracts/:id/send`
   - **Handler:** `apps/api/src/routes/contracts.ts:290`
   - **Service:** `ContractService.sendContract()`
   - **Process:**
     - Generate magic link token (`magicLinkToken`)
     - Set magic link expiration (`magicLinkExpiresAt`)
     - If OTP enabled: Generate OTP code (`otpCode`)
     - Update status to `SENT`
     - Set `sentAt` timestamp
     - Send email to client with signing link
     - Create `ContractEvent` of type `SENT`
     - Schedule reminder emails based on `ContractReminderRule`

#### Phase 5: CLIENT E-SIGNING

1. **Client receives email**
   - Contains link to sign contract: `/contract/sign/:token`
   - Public route, no authentication required

2. **Client accesses signing portal**
   - Route: `/contract/sign/:token` (Public)
   - Component: `apps/web/src/routes/contract/sign/$token.tsx`
   - **API Endpoint:** `GET /public/contracts/:token`
   - **Handler:** `apps/api/src/routes/publicContract.ts`

3. **Authentication flow**
   - If portal password enabled:
     - Client enters password
     - System validates `portalPasswordHash`
   - If OTP enabled:
     - Client enters OTP sent to email
     - System validates `otpCode` and `otpExpiresAt`
     - Track `otpAttempts` (limit 3)
     - If exceeded, lock contract

4. **Client reviews contract**
   - View PDF
   - View contract details
   - Confirm understanding

5. **Client signs**
   - Click "Sign Contract"
   - Session validation:
     - Create `signerSessionId`
     - Set `signerSessionExpiresAt` (30 minutes)
     - Track IP address for audit trail
   - **API Endpoint:** `POST /public/contracts/:token/sign`
   - **Handler:** `apps/api/src/routes/publicContract.ts`
   - **Process:**
     - Validate session is active
     - Validate IP/user agent match (basic fraud check)
     - Update contract:
       - Status to `SIGNED`
       - Set `signedAt` timestamp
       - Store `signatureIP` and `signatureAgent`
     - Create `ContractEvent` of type `SIGNED`
     - Generate signed PDF (with signature watermark)
     - Send confirmation email to client
     - Trigger invoice automation (if configured)

#### Phase 6: ADMIN COUNTERSIGNING

1. **Admin reviews signed contract**
   - Status: `SIGNED`
   - Notes: "Awaiting admin signature"

2. **Click "Countersign"**
   - **API Endpoint:** `POST /admin/contracts/:id/countersign`
   - **Handler:** `apps/api/src/routes/contracts.ts`
   - **Process:**
     - Update status to `COUNTERSIGNED`
     - Set `countersignedAt` timestamp
     - Create `ContractEvent` of type `COUNTERSIGNED`
     - Generate final signed PDF with both signatures
     - Optional: Auto-generate invoice

3. **Activate Contract**
   - Click "Activate"
   - Status changes to `ACTIVE`
   - Contract now in effect
   - `effectiveAt` timestamp recorded

#### Phase 7: CONTRACT VERSIONING & REISSUE

1. **If contract needs changes after signing**
   - Click "Reissue Contract"
   - **API Endpoint:** `POST /admin/contracts/:id/reissue`
   - **Process:**
     - Create new contract with same `baseNumber`
     - Increment `reissueIndex` (0 → 1 → 2, etc.)
     - New `contractNumber`: CT-2025-0001-R1
     - Link to original via `baseNumber`
     - Status reset to `DRAFT`
     - Previous version status set to `SUPERSEDED`

#### Phase 8: CONTRACT TERMINATION/VOIDING

1. **Admin marks contract as void**
   - Click "Void Contract"
   - Provide reason (required)
   - **API Endpoint:** `POST /admin/contracts/:id/void`
   - **Process:**
     - Status changes to `VOIDED`
     - Set `voidedAt` timestamp
     - Set `voidedReason` field
     - Create `ContractEvent` of type `VOIDED`
     - Generate voided PDF with watermark
     - Notify client

2. **Auto-expiration**
   - If `signByAt` date passed and contract not signed:
     - Status changes to `EXPIRED`
     - Send expiration notice

### Contract Reminder System

1. **Configure reminder rules**
   - Route: `/admin/contracts/settings`
   - Create `ContractReminderRule` records
   - Configure:
     - `offsetsDays`: Array of days relative to sign-by date
     - Example: [-3, 0, 3, 7] sends reminders at T-3, T, T+3, T+7
     - `businessHoursOnly`: Only send during business hours
     - `cooldownHours`: Minimum hours between reminders

2. **Automatic reminder sending**
   - Background job checks contracts daily
   - For each unsigned contract:
     - Check if reminder should be sent today
     - Verify cooldown period elapsed
     - Send reminder email
     - Create `ContractEvent` of type `REMINDER_SENT`

### API Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/admin/contracts/stats` | Get statistics | Admin |
| GET | `/admin/contracts` | List all contracts | Admin |
| GET | `/admin/contracts/:id` | Get single contract | Admin |
| POST | `/admin/contracts` | Create contract | Admin |
| PUT | `/admin/contracts/:id` | Update contract | Admin |
| DELETE | `/admin/contracts/:id` | Delete contract | Admin |
| POST | `/admin/contracts/:id/send` | Send for signing | Admin |
| POST | `/admin/contracts/:id/countersign` | Admin signature | Admin |
| POST | `/admin/contracts/:id/void` | Void contract | Admin |
| POST | `/admin/contracts/:id/reissue` | Reissue as new version | Admin |
| GET | `/public/contracts/:token` | Client views (public) | Public |
| POST | `/public/contracts/:token/sign` | Client signs (public) | Public |

### Status Lifecycle

```
DRAFT → SENT → VIEWED → SIGNED → COUNTERSIGNED → ACTIVE
  ↓                        ↓
DELETE                   EXPIRED
                           ↓
                          VOIDED
```

---

## INVOICE WORKFLOW

### Overview
An invoice is a billing document requesting payment. Can be created manually or automatically from contracts. Supports multiple payment methods and reconciliation.

### Database Models
- **Invoice** (`apps/api/prisma/schema.prisma:849`)
- **InvoiceItem** (line items)
- **Payment** (payment transactions)
- **Reconciliation** (reconciliation with bank)

### Complete Workflow

#### Phase 1: INVOICE CREATION

**Option A: Manual Creation**

1. **Admin navigates to Invoices**
   - Route: `/admin/invoices`
   - Component: `apps/web/src/routes/admin/invoices/index.tsx`

2. **Click "New Invoice"**
   - Route: `/admin/invoices/new`
   - Component: `apps/web/src/routes/admin/invoices/new.tsx`

3. **Fill Invoice Form**
   - Title (required)
   - Client selection (required)
   - Description (optional)
   - Line items with:
     - Description
     - Quantity
     - Unit Price
     - Amount (auto-calculated)
   - Pricing:
     - Subtotal (auto-calculated)
     - Tax Rate (optional)
     - Tax Amount (auto-calculated)
     - Total (auto-calculated)
   - Payment terms (e.g., "Net 30", "Due on Receipt")
   - Due date (required)
   - Payment method options available to client:
     - Bank Transfer
     - Credit Card
     - Check
     - Cash
     - Stripe
     - PayPal

4. **Submit Invoice**
   - **API Endpoint:** `POST /admin/invoices`
   - **Handler:** `apps/api/src/routes/invoices.ts:85`
   - **Service:** `InvoiceService.createInvoice()`
   - **Process:**
     - Validate required fields
     - Create `Invoice` record with status `DRAFT`
     - Generate unique `invoiceNumber` (e.g., INV-2025-001)
     - Create `InvoiceItem` records for each line item
     - Set `createdBy` to current admin
     - Initialize `amountDue = total`
     - Initialize `amountPaid = 0`
   - **Database:** Invoice stored with status `DRAFT`

**Option B: Auto-generate from Contract**

1. **Contract reaches COUNTERSIGNED status**
   - Automatic trigger (if configured)
   - Or admin manually triggers from contract

2. **System auto-creates invoice**
   - **API Endpoint:** `POST /admin/contracts/:id/create-invoice`
   - **Handler:** `apps/api/src/routes/contracts.ts`
   - **Process:**
     - Create `Invoice` linked to contract via `contractId`
     - Copy contract items or use predefined pricing
     - Copy client information
     - Set status to `DRAFT`
     - Default due date: 30 days from contract signature
   - **Database:** New `Invoice` created with `contractId` foreign key

#### Phase 2: INVOICE EDITING

1. **Admin views invoice**
   - Status: `DRAFT` or `SENT`
   - Route: `/admin/invoices/:id`

2. **Click "Edit"**
   - Only available for `DRAFT` status

3. **Modify invoice**
   - Update line items
   - Adjust pricing, tax
   - Update due date
   - Modify payment terms

4. **Save changes**
   - **API Endpoint:** `PUT /admin/invoices/:id`
   - **Handler:** `apps/api/src/routes/invoices.ts:165`
   - **Service:** `InvoiceService.updateInvoice()`
   - **Restrictions:** Only for DRAFT status

#### Phase 3: PDF GENERATION

1. **System generates PDF**
   - Triggered on invoice creation or update
   - **Process:**
     - Convert invoice to PDF format
     - Store at `pdfPath` location
   - **Output:** PDF in `apps/api/uploads/invoices/`

#### Phase 4: INVOICE SENDING

1. **Admin views invoice**
   - Status: `DRAFT`

2. **Click "Send Invoice"**
   - Opens send dialog
   - Select payment method client should use:
     - Bank Transfer
     - Credit Card
     - Other options

3. **Configure invoice**
   - Payment method selection affects:
     - Invoice display (payment instructions)
     - Available payment gateways
     - Client payment experience

4. **Send to Client**
   - **API Endpoint:** `POST /admin/invoices/:id/send`
   - **Handler:** `apps/api/src/routes/invoices.ts:220`
   - **Service:** `InvoiceService.sendInvoice()`
   - **Process:**
     - Update `paymentType` field
     - Set status to `SENT`
     - Set `sentAt` timestamp
     - Generate magic link for client payment portal
     - Send email to client with:
       - Invoice summary
       - Due date
       - Payment link
       - Payment instructions
     - Track email delivery

#### Phase 5: CLIENT VIEWS & PAYS

1. **Client receives email**
   - Contains magic link to payment portal
   - Public route, no authentication

2. **Client views invoice**
   - Route: `/client/invoice/:invoiceNumber` (Public)
   - Component: `apps/web/src/routes/client/invoice/[invoiceNumber].tsx`
   - **API Endpoint:** `GET /public/invoices/:token`
   - **Handler:** `apps/api/src/routes/publicInvoice.ts`
   - Displays:
     - Full invoice details
     - Line items and pricing
     - Due date
     - Payment options

3. **Client selects payment method**
   - Bank Transfer:
     - Display bank details
     - Generate payment reference
     - Client pays manually
   - Credit Card:
     - **API Endpoint:** `POST /public/invoices/:token/pay`
     - Redirect to Stripe payment gateway
     - Client enters card details
     - Stripe processes payment
   - Other methods:
     - Display payment instructions
     - Manual reconciliation later

#### Phase 6: PAYMENT PROCESSING

1. **If Credit Card payment (Stripe)**
   - **API Endpoint:** `POST /public/invoices/:token/pay`
   - **Handler:** `apps/api/src/routes/payments.ts`
   - **Service:** `PaymentService.createPayment()`
   - **Process:**
     - Create Stripe PaymentIntent
     - Return client secret to frontend
     - Client completes payment on Stripe
     - Stripe webhook confirms payment:
       - **Webhook:** `POST /webhooks/stripe`
       - Create `Payment` record with status `COMPLETED`
       - Set `paidAt` timestamp
       - Update `Invoice.amountPaid`
       - Recalculate `amountDue`
       - If `amountDue <= 0`: Set invoice status to `PAID`
       - If `amountDue > 0`: Set status to `PARTIAL`
       - Send payment confirmation email
       - Create audit log

2. **If Bank Transfer**
   - Client sends payment manually
   - Admin records payment:
     - **API Endpoint:** `POST /admin/invoices/:id/record-payment`
     - **Handler:** `apps/api/src/routes/invoices.ts:280`
     - **Form:**
       - Amount paid
       - Payment date
       - Payment reference
       - Payment method
     - **Process:**
       - Create `Payment` record with status `COMPLETED`
       - Update `Invoice.amountPaid`
       - Recalculate `amountDue`
       - Update invoice status based on amount due
       - Send confirmation email to client

#### Phase 7: PAYMENT RECONCILIATION

1. **Bank import**
   - System imports bank transactions (if connected)
   - Or admin manually imports CSV

2. **Reconciliation matching**
   - **API Endpoint:** `POST /admin/reconciliation`
   - **Handler:** `apps/api/src/routes/reconciliation.ts`
   - **Process:**
     - Match bank transactions to payments
     - Verify payment reference number
     - Match amount and date
     - Update payment status to `RECONCILED`
     - Create `Reconciliation` record linking:
       - Payment
       - Bank transaction
       - Admin who reconciled

3. **Reconciliation journal entry**
   - **API Endpoint:** `POST /admin/journals`
   - **Handler:** `apps/api/src/routes/journals.ts`
   - **Process:**
     - Create `JournalEntry` for reconciliation
     - Debit Accounts Receivable
     - Credit Bank Account
     - Link to reconciliation record
     - Status: DRAFT (awaiting approval)

#### Phase 8: INVOICE OVERDUE & COLLECTION

1. **Automatic status update**
   - Background job runs daily
   - For each `SENT` or `PARTIAL` invoice:
     - If `dueDate < today` and status still `SENT`:
       - Update status to `OVERDUE`
       - Send overdue notice email

2. **Admin sends reminders**
   - Route: `/admin/invoices/:id/send-reminder`
   - **API Endpoint:** `POST /admin/invoices/:id/send-reminder`
   - Send overdue payment request
   - Option to apply late fees

3. **Collection actions**
   - Write off invoice:
     - **API Endpoint:** `POST /admin/invoices/:id/write-off`
     - Mark as uncollectable
     - Create write-off journal entry
   - Or refund:
     - **API Endpoint:** `POST /admin/payments/:id/refund`
     - Refund client amount
     - Create refund journal entry

#### Phase 9: INVOICE COMPLETION

1. **Invoice fully paid**
   - `amountDue = 0`
   - Status: `PAID`
   - `paidAt` timestamp recorded

2. **Archive invoice**
   - Invoice moves to archive
   - Retained for 7 years per accounting standards
   - Searchable in historical records

### API Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/admin/invoices/stats` | Get statistics | Admin |
| GET | `/admin/invoices` | List all invoices | Admin |
| GET | `/admin/invoices/:id` | Get single invoice | Admin |
| POST | `/admin/invoices` | Create invoice | Admin |
| PUT | `/admin/invoices/:id` | Update invoice | Admin |
| DELETE | `/admin/invoices/:id` | Delete invoice | Admin |
| POST | `/admin/invoices/:id/send` | Send to client | Admin |
| POST | `/admin/invoices/:id/record-payment` | Record manual payment | Admin |
| POST | `/admin/invoices/:id/send-reminder` | Send reminder | Admin |
| GET | `/public/invoices/:token` | Client views (public) | Public |
| POST | `/public/invoices/:token/pay` | Client pays (public) | Public |
| POST | `/admin/payments/:id/refund` | Refund payment | Admin |

### Status Lifecycle

```
DRAFT → SENT → PAID
  ↓       ↓
DELETE  PARTIAL
        ↓
      OVERDUE
        ↓
      (Collection/Write-off)
```

---

## INTEGRATION POINTS

### Proposal → Contract → Invoice Chain

**Core Integration Flow:**
```
Proposal (ACCEPTED)
→ Convert to Contract
→ Contract (COUNTERSIGNED)
→ Auto-create Invoice
→ Invoice → Payment → Delivery Release
```

**Detailed Steps:**

1. **Proposal Accepted → Create Contract**
   ```
   Proposal (ACCEPTED)
   → Click "Convert to Contract"
   → Creates Contract with proposalId link
   → Contract inherits client, items, pricing
   ```

2. **Contract Signed → Create Invoice**
   ```
   Contract (COUNTERSIGNED)
   → Auto-trigger or manual trigger
   → Creates Invoice with contractId link
   → Invoice copies items or uses preset pricing
   ```

3. **Invoice Payment → Reconciliation**
   ```
   Invoice (SENT)
   → Client payment (Stripe/Bank/Other)
   → Payment webhook or manual record
   → Reconciliation entry created
   → Journal entry posted
   ```

4. **End-to-End Workflow:**
   ```
   Inquiry → Proposal → Contract → Invoice → Payment → Reconciliation → Delivery Release
   ```

### Email Templates System

Stored in dedicated tables per document type. Variables (e.g., `{{clientName}}`, `{{proposalLink}}`) are resolved at send-time.

- **Proposal Email Templates:** `ProposalEmailTemplate` table
  - Used when sending proposals to clients
  - Templates support variables: {{clientName}}, {{proposalTotal}}, {{proposalLink}}, {{dueDate}}, etc.
  - Admin manages in `/admin/proposals/templates`
  - Customizable for different proposal types

- **Contract Email Templates:** Managed separately, versioned with contracts
  - Sent at each contract status change
  - Contains magic signing links
  - Future: Make fully customizable

- **Invoice Email Templates:** Managed separately, versioned with invoices
  - Sent when invoice created/sent
  - Contains payment link
  - Contains payment instructions
  - Future: Enhanced customization

### Clause Management

Managed under `/admin/contracts/clauses` with versioning and auto-inclusion of mandatory sections.

- **Reusable Clauses:** `Clause` table
  - Standard contract clauses (terms, liability, confidentiality, etc.)
  - Mandatory legal sections: Liability, GDPR, Termination (versioned and auto-included)
  - Linked to contract templates via `mandatoryClauseIds`
  - Admin can:
    - Create/edit clauses
    - Mark as mandatory
    - Organize by category
    - Version control

- **Clause usage:**
  - Contract templates reference mandatory clauses
  - When contract created from template, mandatory clauses automatically included
  - Admin can add/remove optional clauses before sending
  - All clause versions tracked for audit compliance

### Pricing Rules & Automation

- **Pricing Rules:** `PricingRule` table
  - Define conditional pricing based on:
    - Service type
    - Client tier
    - Volume discounts
    - Seasonal rates
  - Used when:
    - Creating invoices from contracts
    - Calculating line item amounts

### Accounting Integration

- **Journal Entries:** `JournalEntry` table
  - Created for:
    - Invoice creation (Accounts Receivable debit, Revenue credit)
    - Payment received (Bank debit, Accounts Receivable credit)
    - Write-offs (Bad Debt Expense debit, Accounts Receivable credit)
  - Status workflow:
    - DRAFT (requires approval)
    - POSTED (in ledger)
    - RECONCILED (matched to bank)

- **Accounting Periods:** `AccountingPeriod` table
  - Monthly or quarterly periods
  - Can be OPEN, CLOSED, LOCKED
  - Journal entries locked after period closes

---

## STATUS LIFECYCLES

### Proposal Status Flow

| Status | Triggered By | Next States | Notes |
|--------|--------------|-------------|-------|
| DRAFT | Creation | SENT, DELETE | Admin can edit, save as template |
| SENT | Admin sends | VIEWED, DECLINED, EXPIRED | Magic link sent to client |
| VIEWED | Client views | ACCEPTED, DECLINED, EXPIRED | First client engagement tracked |
| ACCEPTED | Client accepts | Convert to Contract, EXPIRED | Can create contract |
| DECLINED | Client declines | - | Workflow ends |
| EXPIRED | Date passed | - | Cannot accept after expiry |

### Contract Status Flow

| Status | Triggered By | Next States | Notes |
|--------|--------------|-------------|-------|
| DRAFT | Creation | SENT, DELETE | Admin edits before sending |
| SENT | Admin sends | VIEWED, EXPIRED, VOIDED | e-signing link sent |
| VIEWED | Client views | SIGNED, EXPIRED | Client engagement tracked |
| SIGNED | Client signs | COUNTERSIGNED, EXPIRED | Awaits admin signature |
| COUNTERSIGNED | Admin signs | ACTIVE, VOIDED | Contract ready for execution |
| ACTIVE | Admin activates | EXPIRED, TERMINATED | Contract in effect |
| EXPIRED | Date passed | - | Cannot sign after date |
| VOIDED | Admin voids | - | Permanent, not reversible |
| TERMINATED | Admin terminates | - | Contract end before expiry |

### Invoice Status Flow

| Status | Triggered By | Next States | Notes |
|--------|--------------|-------------|-------|
| DRAFT | Creation | SENT, DELETE | Admin edits before sending |
| SENT | Admin sends | PAID, PARTIAL, OVERDUE | Magic link sent to client |
| PAID | Full payment received | - | Invoice complete |
| PARTIAL | Partial payment | PAID, OVERDUE | Awaiting remaining balance |
| OVERDUE | Date passed + not paid | Write-off, Refund | Past due notice sent |
| CANCELLED | Admin cancels | - | Invoice voided |

---

## PAYMENT & RECONCILIATION

### Payment Flow Diagram

```
┌─────────────────┐
│  Invoice SENT   │
└────────┬────────┘
         │
         ├─→ BANK TRANSFER ─→ Manual recording
         │
         ├─→ CREDIT CARD ─→ Stripe Payment Intent
         │                   ↓
         │                Stripe Gateway
         │                   ↓
         │                Webhook (success)
         │                   ↓
         │                Create Payment
         │
         └─→ OTHER ─→ Manual instructions

         ├─→ PAYMENT CREATED
         │
         ├─→ PAYMENT COMPLETED
         │   ├─→ Update Invoice amountPaid
         │   ├─→ Recalculate amountDue
         │   └─→ Update Invoice status (PAID/PARTIAL)
         │
         └─→ RECONCILIATION
             ├─→ Match to bank transaction
             ├─→ Create Reconciliation record
             └─→ Create journal entry
```

### Reconciliation Process

1. **Bank Import**
   - File upload (CSV/OFX)
   - Or API integration (future)
   - Creates `BankTransaction` records

2. **Auto-matching** (if configured)
   - System attempts to match:
     - Amount
     - Date (within tolerance)
     - Memo/description

3. **Manual reconciliation**
   - Admin reviews unmatched items
   - Manually links payment to bank transaction
   - **API Endpoint:** `POST /admin/reconciliation`
   - Creates `Reconciliation` record

4. **Journal entry creation**
   - **API Endpoint:** `POST /admin/journals`
   - Entry type: RECONCILIATION
   - Debit: Bank Account
   - Credit: Accounts Receivable
   - Status: DRAFT (requires approval)

5. **Approval**
   - Admin reviews journal entry
   - **API Endpoint:** `PUT /admin/journals/:id/approve`
   - Status changes to POSTED
   - Entry now in general ledger
   - Affects financial reports

6. **Closing**
   - Monthly reconciliation
   - All items must be matched
   - Period marked as CLOSED
   - No further edits allowed

---

## KEY FEATURES SUMMARY

### Proposal Features
- ✅ Template-based creation
- ✅ Customizable line items
- ✅ Automatic tax calculation
- ✅ Expiration management
- ✅ Client e-signature (OTP verification)
- ✅ Magic link sharing
- ✅ Conversion to contract
- ✅ Email templates with variables
- ✅ PDF generation
- ✅ Version tracking (via timestamps)

### Contract Features
- ✅ Template-based creation
- ✅ Variable replacement
- ✅ Reusable clauses
- ✅ Client e-signature workflow
- ✅ OTP verification
- ✅ Magic link access
- ✅ Portal password protection
- ✅ Version/reissue management
- ✅ Reminder automation
- ✅ Void/termination capability
- ✅ PDF generation with hash verification
- ✅ Audit trail (ContractEvent)
- ✅ Automatic invoice generation

### Invoice Features
- ✅ Manual creation
- ✅ Auto-generation from contracts
- ✅ Template line items
- ✅ Multiple payment methods
- ✅ Stripe integration
- ✅ Payment tracking
- ✅ Partial payment support
- ✅ Overdue management
- ✅ Payment reconciliation
- ✅ PDF generation
- ✅ Email reminders
- ✅ Write-off capability
- ✅ Accounting integration

---

## Database Relationships

**Core Entity Relationship Flow:**
```
Client → Proposals → Contracts → Invoices → Payments → Reconciliation
AdminUser → manages all document entities
```

**Complete Entity Hierarchy:**
```
AdminUser
├── proposals (Proposal.createdBy)
├── proposalTemplates (ProposalTemplate.createdBy)
├── proposalEmailTemplates (ProposalEmailTemplate.createdBy)
├── contracts (Contract.createdBy)
├── contractTemplates (ContractTemplate.createdBy)
└── invoices (Invoice.createdBy)

Client
├── proposals (Proposal.clientId)
├── contracts (Contract.clientId)
└── invoices (Invoice.clientId)

Proposal
├── items (ProposalItem)
├── emailTemplate (ProposalEmailTemplate)
├── contract (Contract via proposalId)
└── createdByUser (AdminUser)

Contract
├── template (ContractTemplate)
├── proposal (Proposal via proposalId)
├── client (Client)
├── invoices (Invoice.contractId)
├── events (ContractEvent)
└── createdByUser (AdminUser)

Invoice
├── items (InvoiceItem)
├── payments (Payment)
├── contract (Contract via contractId)
└── createdByUser (AdminUser)

Payment
└── reconciliation (Reconciliation via paymentId)

Reconciliation
├── payment (Payment)
├── bankTransaction (BankTransaction)
└── journal (JournalEntry)
```

**Key Audit Fields:**
Each record has audit fields `{createdBy, updatedAt, status, timestamps}` and immutable PDF hashes for integrity verification.

---

## Implementation Notes

### Architecture Overview

**Frontend:** React + TypeScript; file-based routes under `/apps/web/src/routes/`.
**Backend:** Fastify + Prisma; routes under `/apps/api/src/routes/`.

### Frontend Architecture
- React 18 with React Router v7
- File-based routing: `apps/web/src/routes/`
- API clients: `apps/web/src/lib/*-api.ts`
- Components: `apps/web/src/components/`

### Backend Architecture
- Fastify Node.js API
- Prisma ORM for database
- Services layer for business logic: `apps/api/src/services/`
- Routes layer for HTTP endpoints: `apps/api/src/routes/`
- PostgreSQL database

### Email Delivery
- Configurable providers in production (SendGrid, AWS SES, etc.)
- Variable substitution supported: `{{variableName}}`
- Stub provider in development
- Magic links for authentication

### PDF Generation & Security
- HTML → PDF/A conversion for archival compliance
- SHA256-hashed for tamper detection
- Stored under `/uploads/` with unique identifiers
- Future: Encryption at rest

### Security Features

**Magic Links:**
- Expire after 7–28 days (configurable per document type)
- One-time use tokens
- Protect sensitive documents from unauthorized access

**OTP Verification:**
- One-Time Passwords sent via email
- Expiration window (typically 15 minutes)
- Rate limiting: Max 3 failed attempts, then link lockout
- Prevents brute force attacks

**Portal Password Protection:**
- Optional password gating for contract/invoice portals
- Hashed with secure algorithms
- Failed attempts tracked
- Six failed attempts automatically void the link

**Audit Trail:**
- All document actions logged in event tables
- IP address and user agent hashed for privacy
- Immutable audit records for compliance
- ContractEvent model tracks every state change

---

## Future Enhancements

- [ ] Recurring billing & subscriptions
- [ ] Multi-language templates
- [ ] DocuSign/AdobeSign integration
- [ ] Full client portal history
- [ ] Multi-currency support
- [ ] Predictive revenue & payment analytics
- [ ] Invoice aging & DSO dashboards
- [ ] Real-time collaboration on contracts
- [ ] Custom invoice numbering schemes
- [ ] Bulk invoice generation
- [ ] Audit log retention policies
- [ ] Advanced reconciliation rules

---

## CHANGELOG

**v1.0 — November 7, 2025 (Stable Baseline)**
- ✅ Merged simplified workflow with full operational spec
- ✅ Added database, endpoint, and lifecycle details
- ✅ Unified cross-document integration and payment flow
- ✅ Designated Stable v1.0 baseline for Milestone 4 (Sales → Contract → Cash)
- ✅ Integrated comprehensive security documentation
- ✅ Added implementation architecture details
- ✅ Complete API endpoint reference
- ✅ Status lifecycle tables
- ✅ Database relationship mapping
