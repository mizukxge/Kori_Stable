# Next Session Kickoff - Phase 6 (Proposal Management)

**Prepared For:** Next Development Session
**Current System Status:** 57% Complete (6.5 of 9 phases)
**Last Session:** November 5, 2025 - Phase 5.5 Email Integration COMPLETE ✅
**Next Phase:** Phase 6 - Proposal Management System (4-5 hours)

---

## Pre-Session Checklist

Before starting Phase 6 implementation, verify these items:

### 1. System Status Verification
- [ ] Check git status - should be clean
- [ ] Review SESSION_SUMMARY_2025_11_05.md to understand Phase 5.5
- [ ] Review PHASE_5.5_EMAIL_INTEGRATION_COMPLETE.md for email details
- [ ] Verify NEXT_PHASE_OUTLINE.md for Phase 6 specifications

### 2. Development Environment
- [ ] `pnpm dev` starts both API and web servers without errors
- [ ] API running on http://localhost:3001
- [ ] Web running on http://localhost:3000
- [ ] Database connection working (can run `pnpm db:studio`)
- [ ] No console errors on startup

### 3. Database Status
- [ ] All previous migrations applied
- [ ] Proposal model exists in Prisma schema
- [ ] LineItem model exists in Prisma schema
- [ ] Can query Proposal from database
- [ ] Admin user exists for testing

### 4. Email System Status (Optional but helpful)
- [ ] SES service (ses.ts) exists and is functional
- [ ] Test script available: `npx tsx src/scripts/test-email.ts`
- [ ] Environment variables set for email (USE_SES or Nodemailer settings)
- [ ] Can send test emails (not required for Phase 6 UI work)

---

## Phase 6 Specifications

### Project Scope: Proposal Management System

**Duration:** 4-5 hours
**Database Status:** ✅ Ready (schema exists)
**Frontend Status:** Pending (needs UI implementation)
**API Status:** Pending (needs endpoints)

### User Stories

**As an admin, I want to:**
1. Create proposals for clients with line items and pricing
2. View all proposals with filtering by status, client, date range
3. Search proposals by title, client name, proposal number
4. Edit existing proposals and add/remove line items
5. Send proposals to clients via email (uses email system from Phase 5.5)
6. View proposal details including client info and line items
7. Download proposals as PDF
8. Track proposal status (DRAFT, SENT, VIEWED, ACCEPTED, DECLINED, EXPIRED)
9. Duplicate existing proposals to create similar ones
10. Archive or delete proposals

### Database Schema (Already Exists)

**Proposal Model:**
```prisma
model Proposal {
  id                String      @id @default(cuid())
  proposalNumber    String      @unique
  clientId          String
  client            Client      @relation(fields: [clientId], references: [id], onDelete: Cascade)
  title             String
  description       String?
  items             LineItem[]
  subtotal          Decimal     @default(0)
  taxAmount         Decimal     @default(0)
  total             Decimal     @default(0)
  currency          String      @default("GBP")
  status            ProposalStatus  @default(DRAFT)
  validFrom         DateTime?
  validUntil        DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  createdBy         String
  viewedAt          DateTime?
  viewedBy          String?
  acceptedAt        DateTime?
  declinedAt        DateTime?
}

model LineItem {
  id                String      @id @default(cuid())
  proposalId        String
  proposal          Proposal    @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  description       String
  quantity          Int
  unitPrice         Decimal
  amount            Decimal
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

enum ProposalStatus {
  DRAFT
  SENT
  VIEWED
  ACCEPTED
  DECLINED
  EXPIRED
}
```

### Frontend Components Needed

#### 1. Proposal List Page
**Path:** `apps/web/src/routes/admin/proposals/index.tsx`
**Duration:** 1.5-2 hours
**Features:**
- Header with "Create Proposal" button
- Stats cards showing:
  - Total proposals
  - Pending (DRAFT + SENT)
  - Accepted
  - Declined
- Search bar: Search by title, client name, proposal number
- Filters:
  - Status dropdown (All, Draft, Sent, Viewed, Accepted, Declined)
  - Date range picker
  - Currency filter
- Table with columns:
  - Proposal Number
  - Client Name
  - Title
  - Total Amount (formatted with currency)
  - Status badge (color-coded)
  - Date Created
  - Actions (View, Edit, Send, Delete, Duplicate, Download PDF)
- Pagination (20 items per page)
- Loading states and error handling
- Empty state when no proposals

**Reference Components:**
- Use existing pattern from: `apps/web/src/routes/admin/contracts/index.tsx`
- Reuse: Stats cards, table layout, filter patterns
- Styling: Match existing Tailwind CSS patterns

#### 2. Create/Edit Proposal Modal
**Path:** `apps/web/src/components/proposals/ProposalModal.tsx`
**Duration:** 1-1.5 hours
**Features:**
- Modal dialog (create or edit mode)
- Form fields:
  - Title (required, text input)
  - Description (optional, textarea)
  - Client dropdown (required, searchable)
  - Valid From date picker
  - Valid Until date picker
  - Currency dropdown (GBP default)
  - Status dropdown
- Line items section:
  - Table showing description, quantity, unit price, amount
  - Add line item button
  - Remove line item button (per row)
  - Auto-calculate: amount = quantity × unitPrice
  - Auto-calculate: total = sum of amounts
- Subtotal, Tax, Total display (read-only, calculated)
- Submit button: "Save Proposal"
- Cancel button

**Reference Components:**
- Use existing pattern from: `apps/web/src/components/contracts/ContractModal.tsx`
- Reuse: Form validation, modal structure, button styles
- Line items pattern: Similar to invoice items system

#### 3. Proposal Detail Page
**Path:** `apps/web/src/routes/admin/proposals/[id].tsx`
**Duration:** 1-1.5 hours
**Features:**
- Header section:
  - Proposal number
  - Client name (linked to client detail)
  - Status badge (color-coded)
  - Date created and last updated
- Content sections:
  - Proposal title and description
  - Valid from/until dates
  - Line items table (description, quantity, unit price, amount)
  - Subtotal, Tax, Total (currency formatted)
- Metadata section:
  - Created by
  - Client contact info
  - Created date
  - Last viewed (if applicable)
  - Accepted/Declined date (if applicable)
- Action buttons:
  - Edit (opens modal)
  - Duplicate (creates copy)
  - Send (triggers email)
  - Download PDF (if implemented)
  - Delete (with confirmation)
  - Back to list
- Status history timeline (show when sent, viewed, accepted, etc.)

**Reference Components:**
- Use existing pattern from: `apps/web/src/routes/admin/contracts/[id].tsx`
- Reuse: Timeline component, metadata layout, action buttons
- Timeline events: CREATED, SENT, VIEWED, ACCEPTED, DECLINED

### API Endpoints Needed

**Base Path:** `/admin/proposals`

```
POST   /admin/proposals
  Create new proposal
  Body: { title, description, clientId, items, validFrom, validUntil, currency, status }
  Response: { id, proposalNumber, ... }

GET    /admin/proposals
  List proposals with filters
  Query: { status?, clientId?, search?, dateFrom?, dateTo?, currency?, page?, limit? }
  Response: { proposals: [...], total, pages }

GET    /admin/proposals/:id
  Get proposal details
  Response: { id, proposalNumber, client, items, ... }

PUT    /admin/proposals/:id
  Update proposal
  Body: { title, description, items, validFrom, validUntil, status, ... }
  Response: { id, ... }

DELETE /admin/proposals/:id
  Delete proposal
  Response: { success: true }

POST   /admin/proposals/:id/send
  Send proposal to client (triggers email)
  Body: { note? }
  Response: { success: true, messageId }

POST   /admin/proposals/:id/duplicate
  Clone proposal (create copy)
  Response: { id, proposalNumber, ... }

POST   /admin/proposals/:id/status
  Update proposal status
  Body: { status }
  Response: { id, status, ... }
```

**Implementation Path:**
- Create `apps/api/src/routes/proposals.ts`
- Create `apps/api/src/services/proposal.ts`
- Add API client function `apps/web/src/lib/proposals-api.ts` (already exists as placeholder)

### API Service Implementation

**File:** `apps/api/src/services/proposal.ts`

Required methods:
```typescript
class ProposalService {
  static async createProposal(data, userId: string)
  static async getProposals(filters, userId: string)
  static async getProposalById(id: string)
  static async updateProposal(id: string, data, userId: string)
  static async deleteProposal(id: string, userId: string)
  static async duplicateProposal(id: string, userId: string)
  static async sendProposal(id: string, userId: string)
  static async updateStatus(id: string, status: string)

  // Helper methods
  static async generateProposalNumber()
  static async getProposalWithClient(id: string)
  static async calculateTotals(items, taxRate?)
}
```

**Email Integration:**
- Use `sendProposalEmail()` from `apps/api/src/services/ses.ts`
- Function signature: `sendProposalEmail(prospectEmail, proposalId, prospectName)`
- Called when proposal is sent to client
- Updates proposal status to SENT
- Logs to audit trail

---

## Implementation Sequence

### Day 1: Setup & API (2-2.5 hours)
1. [ ] Create `apps/api/src/routes/proposals.ts` with all endpoints
2. [ ] Create `apps/api/src/services/proposal.ts` with all business logic
3. [ ] Register routes in `apps/api/src/routes/index.ts`
4. [ ] Test endpoints with API client (Postman/curl)
5. [ ] Verify database queries work correctly

### Day 2: Frontend - List & Forms (1.5-2 hours)
1. [ ] Create proposal list page with filters and search
2. [ ] Create proposal modal component
3. [ ] Wire up create/edit functionality
4. [ ] Test form validation
5. [ ] Test CRUD operations

### Day 3: Frontend - Details & Polish (1-1.5 hours)
1. [ ] Create proposal detail page
2. [ ] Add status timeline
3. [ ] Implement all action buttons
4. [ ] Add email sending (send proposal)
5. [ ] Testing and bug fixes
6. [ ] Duplicate functionality

### Estimated Total: 4-5 hours

---

## Existing Code to Reuse

### Frontend Patterns
- **List Pages:** `apps/web/src/routes/admin/contracts/index.tsx`
- **Detail Pages:** `apps/web/src/routes/admin/contracts/[id].tsx`
- **Modals:** `apps/web/src/components/contracts/ContractModal.tsx`
- **Stats Cards:** `apps/web/src/components/layout/Header.tsx`
- **Timeline:** `apps/web/src/components/AuditTrail.tsx`
- **API Client:** `apps/web/src/lib/contracts-api.ts`

### Backend Patterns
- **Routes:** `apps/api/src/routes/contracts.ts`
- **Service:** `apps/api/src/services/contract.ts`
- **Email:** `apps/api/src/services/ses.ts` (sendProposalEmail function exists)
- **Audit Logging:** Pattern established in contract service

### UI Components
- Buttons, inputs, modals already styled and ready
- Table component with sorting
- Date pickers configured
- Currency formatting utilities ready
- Status badge components available

---

## Database Ready

✅ **Proposal model exists in schema.prisma**
✅ **LineItem model exists in schema.prisma**
✅ **ProposalStatus enum defined**
✅ **Foreign keys and relations set up**
✅ **No migrations needed**

Just start implementing!

---

## Email Integration Ready

✅ **sendProposalEmail function exists** in `ses.ts`
- Sends professional proposal email with view link
- Includes 72-hour expiry messaging (can customize)
- Personalized with prospect name
- Professional HTML with plain text fallback
- Ready to use: `await sendProposalEmail(clientEmail, proposalId, clientName)`

---

## Success Criteria

Phase 6 will be complete when:
✅ Proposals can be created with line items and pricing
✅ Proposal list page displays all proposals with filters
✅ Users can search by title, client, or proposal number
✅ Edit functionality allows updating proposal details
✅ Proposals can be sent to clients (triggers email)
✅ Status tracking works (DRAFT → SENT → VIEWED → ACCEPTED/DECLINED)
✅ Proposal detail page shows all information
✅ Duplicate functionality creates copy
✅ Delete functionality removes proposals
✅ PDF download works (if time permits)
✅ UI is consistent with existing design
✅ Error handling for all operations
✅ Loading states and feedback

---

## Known Issues

None identified. System is clean and ready for Phase 6.

---

## Environment Setup

**Assumed Environment:**
- Node.js and pnpm installed
- PostgreSQL running and configured
- Database migrations complete
- .env file configured with:
  ```env
  DATABASE_URL=postgresql://user:pass@localhost:5432/kori_dev
  SESSION_SECRET=generated_secret_32_chars
  EMAIL_ENABLED=true
  CORS_ORIGIN=http://localhost:3000
  PUBLIC_URL=http://localhost:3000
  ```

---

## Quick Start for Next Session

1. **Verify System Ready**
   ```bash
   cd /path/to/kori_web_stable
   pnpm install  # if needed
   pnpm db:generate  # refresh Prisma
   ```

2. **Start Development Servers**
   ```bash
   # Terminal 1
   pnpm dev

   # Or separately:
   pnpm dev:api   # Terminal 1
   pnpm dev:web   # Terminal 2
   ```

3. **Review Documentation**
   - Read NEXT_PHASE_OUTLINE.md section on Phase 6
   - Review PHASE_5.5_EMAIL_INTEGRATION_COMPLETE.md for email context
   - Review this document (NEXT_SESSION_KICKOFF.md)

4. **Start Implementation**
   - Begin with API endpoints in proposals.ts
   - Reference contracts.ts for patterns
   - Build API before frontend

---

## Support Resources

**Documentation Files:**
- `NEXT_PHASE_OUTLINE.md` - Full Phase 6 specification
- `CLAUDE.md` - Development guide and architecture
- `PHASE_5.5_EMAIL_INTEGRATION_COMPLETE.md` - Email system details
- `SESSION_SUMMARY_2025_11_05.md` - Last session summary

**Code References:**
- Contract routes: `apps/api/src/routes/contracts.ts` - API patterns
- Contract service: `apps/api/src/services/contract.ts` - Service patterns
- Contract list page: `apps/web/src/routes/admin/contracts/index.tsx` - Frontend patterns
- Email service: `apps/api/src/services/ses.ts` - Email integration

---

## Notes for Developer

1. **Reuse Contracts Pattern**
   - Proposal system is very similar to contracts
   - Can use same table layouts, filters, modals
   - Different data model but same UI patterns

2. **Email Integration**
   - sendProposalEmail() function is already written
   - Just call it when proposal status changes to SENT
   - Email automatically handles magic links and formatting

3. **Line Items**
   - Use pattern from invoice system
   - Add/remove items dynamically
   - Auto-calculate totals
   - Store in database through ProposalLineItem relation

4. **Status Tracking**
   - DRAFT: Initial state, not sent
   - SENT: Sent to client
   - VIEWED: Client has opened proposal link
   - ACCEPTED: Client accepted proposal (accepted at timestamp set)
   - DECLINED: Client declined proposal (declined at timestamp set)
   - EXPIRED: Valid until date has passed

5. **Audit Trail**
   - Log all major operations (CREATE, UPDATE, SEND, DELETE)
   - Include proposal number and client info in metadata
   - Track email sending success/failure

---

## Phase 6 Estimated Timeline

- **Total Duration:** 4-5 hours
- **API Development:** 1.5-2 hours
- **Frontend Development:** 2-2.5 hours
- **Testing & Polish:** 0.5-1 hour

**System Progression After Phase 6:**
- Current: 57% (6.5 of 9 phases)
- After: 66% (8 of 9 phases)

---

## Next Phase After Phase 6

**Phase 7: Invoices** (Once Phase 6 complete)
- Similar to proposals but with different business logic
- Database model exists
- Can reuse many components

---

**Prepared by:** Claude Code
**Date:** November 5, 2025
**Session:** Phase 5.5 Email Integration
**Status:** Ready for Phase 6 Implementation

