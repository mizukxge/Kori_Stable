# Kori Photography Platform — Invoices, Proposals & Contracts Workflow  
**Stable v1.0 — 2025-11-07**

Comprehensive end-to-end workflow for generating, managing, and integrating **Proposals**, **Contracts**, and **Invoices** in the Kori Photography Platform.  
This version merges the earlier Mizu Studio document and the extended API/DB workflow specification.

---

## Table of Contents
1. [Proposal Workflow](#proposal-workflow)
2. [Contract Workflow](#contract-workflow)
3. [Invoice Workflow](#invoice-workflow)
4. [Integration Points](#integration-points)
5. [Status Lifecycles](#status-lifecycles)
6. [Payment & Reconciliation](#payment--reconciliation)
7. [Features Summary](#key-features-summary)
8. [Database Relationships](#database-relationships)
9. [Architecture & Implementation Notes](#implementation-notes)
10. [Future Enhancements](#future-enhancements)

---

## PROPOSAL WORKFLOW

### Overview
Proposals are quotations for photography services. They outline deliverables, pricing, and terms and must be **accepted by the client** before converting into a contract.

### Core Models
- `Proposal`, `ProposalItem`
- `ProposalTemplate`, `ProposalTemplateItem`
- `ProposalEmailTemplate`

### Lifecycle

```
DRAFT → SENT → VIEWED → ACCEPTED → (Convert to Contract)
                  ↓
               DECLINED
                  ↓
               EXPIRED
```

### Phases
**Phase 1 – Creation**
- Admin creates from scratch or a template (`POST /admin/proposals`).
- Validation: title, client, at least one item.
- Stored as `DRAFT` with auto-number (e.g., PROP-2025-0001).

**Phase 2 – Editing**
- Editable only in `DRAFT` or `VIEWED` state.
- Updates propagate to line items and totals.

**Phase 3 – Sending**
- Email template selection → PDF generation → status `SENT`.
- Generates magic link + audit log.

**Phase 4 – Client Engagement**
- Public route `/client/proposal/:proposalNumber`.
- Client views proposal, accepts or declines (`POST /public/proposals/:token/accept` or `/decline`).
- Acceptance sets `ACCEPTED` and triggers contract creation option.

**Phase 5 – Expiration**
- Background job checks `expiresAt`; expired proposals lock automatically.

**Phase 6 – Conversion to Contract**
- `POST /admin/proposals/:id/convert-to-contract`
- Copies proposal details, creates linked `Contract`.

---

## CONTRACT WORKFLOW

### Overview
Contracts formalize accepted proposals. They support **template-based creation**, **e-signature**, **OTP verification**, **reminders**, and **automatic invoicing**.

### Core Models
- `Contract`, `ContractTemplate`
- `ContractEvent`, `ContractReminderRule`
- `Clause`

### Lifecycle
```
DRAFT → SENT → VIEWED → SIGNED → COUNTERSIGNED → ACTIVE
  ↓                        ↓
DELETE                   EXPIRED
                           ↓
                          VOIDED
```

### Phases
**Phase 1 – Creation**
- Manual or from accepted proposal.
- Templates define clauses, placeholders, and validation rules.
- Saved as `DRAFT` with unique number (e.g., CT-2025-0001).

**Phase 2 – Editing**
- Only editable while `DRAFT`.

**Phase 3 – PDF Generation**
- HTML → PDF conversion.
- Hash (`pdfHash`) for tamper detection.

**Phase 4 – Sending**
- Magic link or OTP sent to client.
- Status → `SENT`.
- Reminder rules auto-scheduled.

**Phase 5 – Client E-Signing**
- Public route `/contract/sign/:token`.
- Supports password or OTP verification.
- Signature recorded with IP + UA hash.
- Status → `SIGNED`.

**Phase 6 – Countersigning**
- Admin signs → `COUNTERSIGNED`.
- Auto-invoice generation optional.

**Phase 7 – Versioning/Reissue**
- `POST /admin/contracts/:id/reissue` creates new version (CT-2025-0001-R1).

**Phase 8 – Termination/Voiding**
- `POST /admin/contracts/:id/void` sets `VOIDED`; generates watermarked PDF.

---

## INVOICE WORKFLOW

### Overview
Invoices request payment for deposits, balances, or additional services. They can be generated manually or automatically from contracts.

### Core Models
- `Invoice`, `InvoiceItem`
- `Payment`
- `Reconciliation`

### Lifecycle
```
DRAFT → SENT → PAID
  ↓       ↓
DELETE  PARTIAL
        ↓
      OVERDUE
        ↓
      (Collection/Write-off)
```

### Phases
**Phase 1 – Creation**
- `POST /admin/invoices` (manual) or auto from contract.
- Status = `DRAFT`, auto-number (INV-YYYY-####).

**Phase 2 – Editing**
- Editable only while `DRAFT`.

**Phase 3 – Sending**
- Generates PDF and magic link.
- `POST /admin/invoices/:id/send`
- Status = `SENT`.

**Phase 4 – Client Payment**
- Portal: `/client/invoice/:invoiceNumber`.
- Payment via Stripe/PayPal/Bank.
- Webhook confirms payment and updates `amountPaid` and status.

**Phase 5 – Reconciliation**
- Admin or automated CSV import links payments to bank transactions.
- Journals created for each reconciliation.

**Phase 6 – Overdue Management**
- Daily job marks overdue invoices.
- Admin can send reminders or apply late fees.

**Phase 7 – Completion**
- Fully paid → `PAID`, archived for 7 years.

---

## INTEGRATION POINTS

### Proposal → Contract → Invoice Chain
```
Proposal (ACCEPTED)
→ Convert to Contract
→ Contract (COUNTERSIGNED)
→ Auto-create Invoice
→ Invoice → Payment → Delivery Release
```

### Email Templates
- Stored in dedicated tables per document type.
- Variables (e.g., `{{clientName}}`, `{{proposalLink}}`) resolved at send-time.

### Clauses & Templates
- Managed under `/admin/contracts/clauses`.
- Mandatory legal sections (Liability, GDPR, Termination) versioned and auto-included.

### Accounting & Journal Entries
- Generated for invoice creation and reconciliation.
- Period control enforced once accounting modules enabled.

---

## STATUS LIFECYCLES

| Entity | Key Statuses | Notes |
|---------|---------------|-------|
| **Proposal** | DRAFT → SENT → VIEWED → ACCEPTED/DECLINED/EXPIRED | Converts to Contract on ACCEPTED |
| **Contract** | DRAFT → SENT → VIEWED → SIGNED → COUNTERSIGNED → ACTIVE/VOIDED/EXPIRED | E-sign + reminders |
| **Invoice** | DRAFT → SENT → PARTIAL → PAID/OVERDUE | Triggers payment + reconciliation |

---

## PAYMENT & RECONCILIATION

### Flow
```
Invoice SENT
→ Client chooses method
→ Payment (Stripe / Bank / Other)
→ Webhook or manual record
→ Payment completed → Reconciliation → Journal Entry
```

- Stripe webhook: `POST /webhooks/stripe`
- Manual record: `POST /admin/invoices/:id/record-payment`
- Reconciliation: `POST /admin/reconciliation`
- Journal entry: `POST /admin/journals`

---

## KEY FEATURES SUMMARY

### Proposal
- Templates + line items  
- Tax, expiration, client acceptance  
- Magic links + OTP support  
- PDF export + audit logs  

### Contract
- Templates + reusable clauses  
- OTP + password protection  
- E-signature and countersignature  
- Reminder rules and reissues  

### Invoice
- Auto-numbering and contract linkage  
- Stripe/PayPal integration  
- Payment tracking and reconciliation  
- Overdue and write-off handling  

---

## DATABASE RELATIONSHIPS
```
Client → Proposals → Contracts → Invoices → Payments → Reconciliation
AdminUser → manages all document entities
```
Each record has audit fields `{createdBy, updatedAt, status, timestamps}` and immutable PDF hashes.

---

## IMPLEMENTATION NOTES

- **Frontend:** React + TypeScript; file-based routes under `/apps/web/src/routes/`.  
- **Backend:** Fastify + Prisma; routes under `/apps/api/src/routes/`.  
- **Email Delivery:** Configurable providers; variable substitution supported.  
- **PDFs:** Generated as PDF/A, SHA256-hashed, stored under `/uploads/`.  
- **Security:** Magic links expire (7–28 days); OTP and password gating; six failed attempts void link.  

---

## FUTURE ENHANCEMENTS
- [ ] Recurring billing & subscriptions  
- [ ] Multi-language templates  
- [ ] DocuSign/AdobeSign integration  
- [ ] Full client portal history  
- [ ] Multi-currency support  
- [ ] Predictive revenue & payment analytics  
- [ ] Invoice aging & DSO dashboards  

---

**CHANGELOG**
- Merged simplified workflow with full operational spec (WORKFLOW_DOCUMENTATION.md)
- Added database, endpoint, and lifecycle details
- Unified cross-document integration and payment flow
- Designated Stable v1.0 baseline for milestone 4 (Sales → Contract → Cash)
