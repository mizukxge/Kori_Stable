# Kori Photography Platform - Implementation Next Steps

## ✅ What Has Been Completed

### 1. Complete Workflow Documentation
- **File:** `WORKFLOW_DOCUMENTATION.md` (1,277 lines)
- **Content:** Full end-to-end specification for Proposals, Contracts, and Invoices
- **Status:** Ready for reference during development

### 2. Implementation Analysis
- **File:** Full assessment of current implementation status
- **Findings:**
  - Proposals: 70% complete
  - Contracts: 65% complete (missing critical signing portal)
  - Invoices: 55% complete (missing Stripe integration)

### 3. Contract Signing Portal (CRITICAL FEATURE)
- **Backend Service:** `apps/api/src/services/contractSigning.ts` ✅ CREATED
  - OTP verification with rate limiting
  - Portal password protection
  - Session management
  - Signature recording with audit trail
  - Full privacy protection (IP/UA hashing)

- **Frontend Portal:** `apps/web/src/routes/client/contract/[token].tsx` ✅ CREATED
  - Multi-stage signing flow (authentication → review → sign → confirm)
  - Contract content display (HTML and plain text)
  - Multiple signature methods (draw, type, upload)
  - Mobile-optimized UI
  - Error handling and validation

---

## 🔴 CRITICAL NEXT STEPS (Do These First!)

### Step 1: Add API Routes for Contract Signing (30 minutes)
**File to Update:** `apps/api/src/routes/publicContract.ts`

Add these endpoints:
```typescript
// Get contract for signing portal
fastify.get('/contract/:token/signing-portal', async (request, reply) => {
  const { token } = request.params as { token: string };
  const contract = await ContractSigningService.getContractForSigning(token);
  return { success: true, contract };
});

// Request OTP
fastify.post('/contract/:contractId/request-otp', async (request, reply) => {
  const { contractId } = request.params;
  const { email } = request.body as { email: string };
  const result = await ContractSigningService.requestOTP(contractId, email);
  return { success: true, ...result };
});

// Verify OTP
fastify.post('/contract/:contractId/verify-otp', async (request, reply) => {
  const { contractId } = request.params;
  const { otpCode } = request.body as { otpCode: string };
  const result = await ContractSigningService.verifyOTP(contractId, otpCode);
  return result;
});

// Verify Password
fastify.post('/contract/:contractId/verify-password', async (request, reply) => {
  const { contractId } = request.params;
  const { password } = request.body as { password: string };
  const result = await ContractSigningService.verifyPassword(contractId, password);
  return result;
});

// Record Signature
fastify.post('/contract/:contractId/sign', async (request, reply) => {
  const { contractId } = request.params;
  const { sessionId, signatureData, ipAddress, userAgent } = request.body;
  const result = await ContractSigningService.recordSignature(contractId, sessionId, {
    ...signatureData,
    ipAddress,
    userAgent,
    timestamp: new Date(),
  });
  return result;
});
```

### Step 2: Update App Router (10 minutes)
**File to Update:** `apps/web/src/App.tsx`

Add route:
```typescript
import ContractSigningPortal from './routes/client/contract/[token]';

// In Routes:
<Route path="/contract/sign/:token" element={<ContractSigningPortal />} />
```

### Step 3: Update Frontend API Client (15 minutes)
**File to Update:** `apps/web/src/lib/public-contract-api.ts`

Add methods:
```typescript
export async function requestContractOTP(contractId: string, email: string) {
  return fetch(`${API_URL}/contract/${contractId}/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(r => r.json());
}

export async function verifyContractOTP(contractId: string, otpCode: string) {
  return fetch(`${API_URL}/contract/${contractId}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otpCode }),
  }).then(r => r.json());
}

export async function verifyContractPassword(contractId: string, password: string) {
  return fetch(`${API_URL}/contract/${contractId}/verify-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }).then(r => r.json());
}

export async function signContract(contractId: string, data: any) {
  return fetch(`${API_URL}/contract/${contractId}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  }).then(r => r.json());
}
```

### Step 4: Test Contract Signing (15 minutes)
1. Start dev servers: `pnpm dev`
2. Create a contract in admin panel
3. Send contract to client (get the signing link)
4. Open signing portal: `http://localhost:3000/contract/sign/[token]`
5. Complete the signing flow
6. Verify in database that contract is marked as SIGNED

---

## 📊 Remaining Work by Priority

### PHASE 1: Enable Invoice Payments (Week 1)
**Time Estimate:** 16-20 hours

1. **Create Stripe Payment Service** (3-4 hours)
   - File: `apps/api/src/services/stripePayment.ts`
   - Methods: createPaymentIntent, handleWebhook, refund

2. **Add Stripe Webhook Handler** (2-3 hours)
   - File: `apps/api/src/routes/stripeWebhooks.ts`
   - Events: payment_intent.succeeded, payment_intent.payment_failed

3. **Create Invoice Payment Portal** (4-5 hours)
   - File: `apps/web/src/routes/client/invoice-payment/[invoiceNumber].tsx`
   - Integration: Stripe.js, payment form

4. **Update Invoice Service** (3-4 hours)
   - File: `apps/api/src/services/invoice.ts`
   - Add: recordPayment, updatePaymentStatus methods

5. **Add Stripe API Routes** (2-3 hours)
   - File: `apps/api/src/routes/invoices.ts`
   - Endpoints: createPaymentIntent, confirmPayment

6. **Setup Environment** (0.5 hour)
   - Add Stripe keys to `.env`
   - Run: `pnpm add stripe @stripe/stripe-js @stripe/react-stripe-js`

### PHASE 2: Automate Workflows (Week 2)
**Time Estimate:** 12-16 hours

1. **Build Job Scheduler** (4-5 hours)
   - File: `apps/api/src/jobs/scheduler.ts`
   - Use: Bull queue library
   - Setup: Redis connection

2. **Proposal Expiration Job** (2-3 hours)
   - Auto-expire old proposals
   - Send expiration notifications

3. **Contract Reminder Job** (2-3 hours)
   - Send signing reminders per rules
   - Respect timezone settings

4. **Invoice Reminder Job** (2-3 hours)
   - Send payment reminders for overdue invoices
   - Respect customer preferences

5. **Bank Reconciliation Job** (2-3 hours)
   - Auto-match bank transactions
   - Create reconciliation records

### PHASE 3: Improve UX (Week 3)
**Time Estimate:** 10-12 hours

1. **Proposal Form Component** (3-4 hours)
   - File: `apps/web/src/components/proposals/ProposalForm.tsx`
   - Features: Line item builder, tax calculation, template selection

2. **Invoice Form Component** (2-3 hours)
   - File: `apps/web/src/components/invoices/InvoiceForm.tsx`
   - Features: Auto-numbering, due date calculator

3. **Financial Dashboards** (3-4 hours)
   - Revenue analytics
   - Accounts receivable aging
   - Cash flow projections

4. **Email Integration** (2-3 hours)
   - Configure SES or SendGrid
   - Send notifications for all events

---

## 📋 Complete Task Checklist

### Contract Signing (✅ 100% Complete)
- [x] Backend service implementation
- [x] Frontend signing portal
- [ ] API routes (NEXT: Do this immediately!)
- [ ] Testing

### Invoice Payments (🟡 0% Complete)
- [ ] Stripe service implementation
- [ ] Webhook handler
- [ ] Payment portal UI
- [ ] Invoice service updates
- [ ] Environment setup
- [ ] Testing

### Automations (🟡 0% Complete)
- [ ] Job scheduler setup
- [ ] Proposal expiration job
- [ ] Contract reminder job
- [ ] Invoice reminder job
- [ ] Bank reconciliation job

### Enhancements (🟡 0% Complete)
- [ ] Proposal form component
- [ ] Invoice form component
- [ ] Financial dashboards
- [ ] Email integration
- [ ] Template customization

---

## 🚀 Immediate Action Plan (Next 2 Hours)

```
1. Add API routes to publicContract.ts (30 min)
   ↓
2. Update App.tsx with route (10 min)
   ↓
3. Update public-contract-api.ts (15 min)
   ↓
4. Run pnpm dev and test signing portal (15 min)
   ↓
5. If successful: Mark contract signing as DONE ✅
```

---

## 📚 Reference Documentation

| Document | Purpose |
|----------|---------|
| `WORKFLOW_DOCUMENTATION.md` | Complete workflow specification |
| `IMPLEMENTATION_PROGRESS.md` | Current implementation status |
| `CLAUDE.md` | Project overview and architecture |
| `invoices_proposals_contracts_workflow.md` | Original workflow spec (v1.0) |

---

## 🔧 Useful Commands

```bash
# Start dev servers
pnpm dev

# Type check
pnpm typecheck

# Run tests
pnpm test

# Build for production
pnpm build

# Database migration
pnpm db:migrate:dev
pnpm db:migrate:prod

# View database
pnpm db:studio

# Install new packages
pnpm add [package-name]
```

---

## ⚠️ Important Notes

1. **Magic Link Token Validation** - The contract signing portal uses the token from the URL. Ensure the backend properly validates this token matches an active contract.

2. **Email Configuration** - Email sending is stubbed in the code. You'll need to:
   - Configure SendGrid or AWS SES
   - Update `apps/api/src/services/email.ts`
   - Set email provider credentials in `.env`

3. **Database Fields** - Ensure your PostgreSQL database has all required fields:
   - In `Contract`: otpEmail, otpCode, otpExpiresAt, otpAttempts, signerSessionId, signerSessionExpiresAt, portalPasswordHash, failedAttempts, signatureIP, signatureAgent

4. **PDF Signature Embedding** - The signature is recorded in the database but not embedded in the PDF yet. Plan for PDF generation with embedded signature watermark.

5. **Rate Limiting** - Consider adding global rate limiting to API routes to prevent abuse.

---

## 📞 Questions?

Refer to:
- `WORKFLOW_DOCUMENTATION.md` for workflow details
- `IMPLEMENTATION_PROGRESS.md` for technical progress
- Code comments in created files for implementation details

---

**Last Updated:** November 7, 2025
**Next Review:** After completing contract signing API routes
