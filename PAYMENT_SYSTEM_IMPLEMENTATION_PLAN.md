# Payment System Implementation Plan

**Status:** Ready to Implement
**Prerequisites:** Invoice system working ✅
**Test Invoice Available:** INV-1762315112501 (ID: cmhlgwzlk0001tks4jd0mcjku)

---

## Overview

Implement a multi-payment-provider invoice payment system supporting:
- Stripe (Credit/Debit Cards)
- PayPal
- Apple Pay (via Stripe)
- Google Pay (via Stripe)
- Bank Transfer (manual, instructions only)

---

## Phase 1: Public Invoice View Page

### Route
**File:** `apps/web/src/routes/payment/[id].tsx`

### Features
1. Fetch invoice details by ID
2. Display invoice information:
   - Invoice number, date, due date
   - Client name
   - Line items with quantities and prices
   - Subtotal, tax, total
   - Amount due
   - Payment status
3. Show payment method selection if unpaid
4. Display "Already Paid" badge if status is PAID

### API Endpoint (Already Exists)
```typescript
GET /invoices/:id
// Returns full invoice with items and client info
```

### UI Components Needed
- InvoiceHeader (number, date, status badge)
- ClientInfo (name, email)
- LineItemsTable
- TotalsBreakdown (subtotal, tax, total, amount paid, amount due)
- PaymentMethodSelector (buttons for each method)
- BankTransferInstructions (collapsible section)

### Styling
- Professional invoice layout
- Print-friendly CSS
- Responsive mobile view
- Payment method buttons with provider logos

---

## Phase 2: Payment Method Integration

### 2.1 Stripe Integration

**NPM Package:**
```bash
pnpm add stripe @stripe/stripe-js
```

**Environment Variables:**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Backend Route:**
```typescript
// apps/api/src/routes/payments.ts

// Create payment intent
POST /payment/stripe/create-intent
Body: { invoiceId: string, amount: number }
Returns: { clientSecret: string, paymentIntentId: string }

// Webhook handler
POST /payment/stripe/webhook
Headers: { stripe-signature: string }
Body: Stripe event object
Returns: { received: true }
```

**Frontend Integration:**
```typescript
// apps/web/src/components/payment/StripePaymentForm.tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Use Stripe Payment Element for card, Apple Pay, Google Pay
```

**Flow:**
1. Client selects "Credit Card" or "Apple/Google Pay"
2. Frontend calls `POST /payment/stripe/create-intent`
3. Stripe Payment Element mounts with client secret
4. Client completes payment
5. Stripe redirects to success URL
6. Webhook confirms payment
7. Backend updates invoice status

---

### 2.2 PayPal Integration

**NPM Package:**
```bash
pnpm add @paypal/checkout-server-sdk
```

**Environment Variables:**
```
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox  # or 'live'
```

**Backend Route:**
```typescript
// apps/api/src/routes/payments.ts

// Create order
POST /payment/paypal/create-order
Body: { invoiceId: string, amount: number }
Returns: { orderId: string }

// Capture order
POST /payment/paypal/capture-order
Body: { orderId: string, invoiceId: string }
Returns: { success: boolean, paymentId: string }
```

**Frontend Integration:**
```typescript
// apps/web/src/components/payment/PayPalButton.tsx
import { PayPalButtons } from "@paypal/react-paypal-js";

<PayPalButtons
  createOrder={async () => {
    const { orderId } = await createPayPalOrder(invoiceId);
    return orderId;
  }}
  onApprove={async (data) => {
    await capturePayPalOrder(data.orderID, invoiceId);
  }}
/>
```

**Flow:**
1. Client clicks PayPal button
2. Frontend calls `POST /payment/paypal/create-order`
3. PayPal modal opens
4. Client logs into PayPal and approves
5. Frontend calls `POST /payment/paypal/capture-order`
6. Backend updates invoice status

---

### 2.3 Bank Transfer (Manual)

**No Integration Required** - Display only

**Component:**
```typescript
// apps/web/src/components/payment/BankTransferInstructions.tsx

// Display bank account details from environment
BANK_NAME=Your Bank Name
BANK_ACCOUNT_NUMBER=12345678
BANK_SORT_CODE=12-34-56
BANK_ACCOUNT_NAME=Mizu Studio Ltd
BANK_IBAN=GB...
BANK_SWIFT=...
```

**Features:**
- Copy-to-clipboard buttons for account details
- Reference number to include (invoice number)
- "Mark as Pending" button (updates status to PENDING)
- Admin receives notification to verify payment manually

---

## Phase 3: Payment Backend Service

### File Structure
```
apps/api/src/
├── routes/
│   └── payments.ts           # Payment API routes
├── services/
│   ├── payment.ts            # Payment business logic
│   ├── stripe-service.ts     # Stripe integration
│   └── paypal-service.ts     # PayPal integration
└── schemas/
    └── payment.ts            # Zod validation schemas
```

### Payment Service Methods

```typescript
// apps/api/src/services/payment.ts

export class PaymentService {
  // Create payment record
  static async createPayment(data: CreatePaymentData): Promise<Payment>

  // Process payment via provider
  static async processPayment(paymentId: string, provider: PaymentMethod): Promise<boolean>

  // Handle payment webhook
  static async handleWebhook(provider: PaymentMethod, event: any): Promise<void>

  // Update invoice on successful payment
  static async updateInvoiceOnPayment(invoiceId: string, paymentId: string): Promise<Invoice>

  // Mark payment as failed
  static async markPaymentFailed(paymentId: string, reason: string): Promise<Payment>

  // Process refund
  static async processRefund(paymentId: string, amount?: number): Promise<Payment>
}
```

---

## Phase 4: Database Schema (Already Exists)

The Payment model already exists in Prisma schema:

```prisma
model Payment {
  id            String @id @default(cuid())
  paymentNumber String @unique
  invoiceId     String
  invoice       Invoice @relation(fields: [invoiceId], references: [id])

  method        PaymentMethod
  amount        Decimal @db.Decimal(10, 2)
  status        PaymentStatus

  providerPaymentId  String?
  providerData       Json?
  failureReason      String?
  refundAmount       Decimal? @db.Decimal(10, 2)
  refundedAt         DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum PaymentMethod {
  STRIPE
  PAYPAL
  BANK_TRANSFER
  APPLE_PAY
  GOOGLE_PAY
  CASH
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}
```

**No migration needed** - schema already supports all features.

---

## Phase 5: Webhook Security

### Stripe Webhook Verification
```typescript
// apps/api/src/routes/payments.ts

import Stripe from 'stripe';

app.post('/payment/stripe/webhook', async (request, reply) => {
  const sig = request.headers['stripe-signature'];
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  try {
    const event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );

    await PaymentService.handleStripeWebhook(event);
    reply.send({ received: true });
  } catch (err) {
    reply.code(400).send(`Webhook Error: ${err.message}`);
  }
});
```

### PayPal Webhook Verification
```typescript
// Use PayPal SDK to verify webhook signature
import paypal from '@paypal/checkout-server-sdk';

// Verify webhook signature using PayPal SDK
```

---

## Phase 6: Payment Flow State Management

### Invoice Status Updates

**Before Payment:**
```
status: 'SENT'
amountPaid: 0
amountDue: 3900.00
```

**During Payment (Stripe/PayPal):**
```
status: 'SENT' (unchanged until webhook confirms)
Payment record created with status: 'PROCESSING'
```

**After Successful Payment:**
```
status: 'PAID'
amountPaid: 3900.00
amountDue: 0.00
paidAt: <timestamp>
Payment record updated to status: 'COMPLETED'
```

**After Failed Payment:**
```
status: 'SENT' (unchanged)
Payment record status: 'FAILED'
failureReason: "Card declined" (from provider)
```

**Bank Transfer (Manual):**
```
status: 'PENDING' (admin must confirm)
Payment record created with status: 'PENDING'
Admin receives notification
```

---

## Phase 7: Admin Payment Management

### Admin Routes Needed

**Payment List Page:**
- `apps/web/src/routes/admin/payments/index.tsx`
- Display all payments with filters
- Filter by: status, method, date range, invoice
- Search by payment number, invoice number

**Payment Detail Page:**
- `apps/web/src/routes/admin/payments/[id].tsx`
- Show payment details
- Link to invoice
- Show provider transaction ID
- "Process Refund" button (if applicable)

**Invoice Detail Enhancement:**
- Add payments list section to invoice detail page
- Show payment history
- "Mark as Paid" button for manual payments

---

## Phase 8: Email Notifications (When SES Approved)

### Payment Confirmation Email
```typescript
// apps/api/src/services/email-templates.ts

export function generatePaymentConfirmationEmail(
  invoice: Invoice,
  payment: Payment,
  client: Client
) {
  return {
    subject: `Payment Received - Invoice ${invoice.invoiceNumber}`,
    html: `
      <h1>Payment Confirmed</h1>
      <p>Dear ${client.name},</p>
      <p>We have received your payment of £${payment.amount} for invoice ${invoice.invoiceNumber}.</p>
      <p><strong>Payment Details:</strong></p>
      <ul>
        <li>Amount: £${payment.amount}</li>
        <li>Method: ${payment.method}</li>
        <li>Date: ${payment.createdAt}</li>
        <li>Reference: ${payment.paymentNumber}</li>
      </ul>
      <p>Thank you for your business!</p>
    `
  };
}
```

### Admin Payment Notification
```typescript
// Notify admin when payment received
export function generateAdminPaymentNotification(
  invoice: Invoice,
  payment: Payment,
  client: Client
) {
  return {
    to: env.ADMIN_EMAIL,
    subject: `Payment Received - ${client.name} - ${invoice.invoiceNumber}`,
    html: `
      <p>Payment received from ${client.name}</p>
      <p>Amount: £${payment.amount}</p>
      <p>Invoice: ${invoice.invoiceNumber}</p>
      <p>Method: ${payment.method}</p>
      <a href="${env.PUBLIC_URL}/admin/payments/${payment.id}">View Payment</a>
    `
  };
}
```

---

## Phase 9: Testing Strategy

### Test Cases

**Stripe:**
1. Test successful card payment (use 4242 4242 4242 4242)
2. Test declined card (use 4000 0000 0000 0002)
3. Test Apple Pay (if available)
4. Test Google Pay (if available)
5. Verify webhook received and processed
6. Verify invoice status updated
7. Test refund processing

**PayPal:**
1. Test successful PayPal payment in sandbox
2. Test cancelled payment
3. Verify order capture works
4. Verify invoice updated correctly

**Bank Transfer:**
1. Verify instructions display correctly
2. Test "Mark as Pending" functionality
3. Verify admin notification sent
4. Test manual payment confirmation by admin

**Edge Cases:**
1. Duplicate webhook events (idempotency)
2. Partial payments (not currently supported)
3. Overpayments (handle or reject)
4. Payment timeout scenarios
5. Network failures during payment
6. Invoice already paid (prevent duplicate payments)

---

## Phase 10: Security Checklist

- [ ] Webhook signature verification (Stripe & PayPal)
- [ ] HTTPS only for payment pages (production)
- [ ] No payment credentials in frontend code
- [ ] Rate limiting on payment endpoints
- [ ] CSRF tokens on payment forms
- [ ] PCI compliance (use Stripe Elements, never touch card data)
- [ ] Sanitize all user inputs
- [ ] Audit log all payment actions
- [ ] Encrypt sensitive payment data in database (if storing)
- [ ] Secure webhook endpoints (verify signatures)

---

## Implementation Checklist

### Phase 1: Foundation (4 hours)
- [ ] Create public invoice view page
- [ ] Implement invoice details display
- [ ] Add payment method selector UI
- [ ] Create bank transfer instructions component

### Phase 2: Stripe Integration (5 hours)
- [ ] Install Stripe packages
- [ ] Create Stripe service
- [ ] Implement payment intent creation
- [ ] Add Stripe Payment Element to frontend
- [ ] Create webhook endpoint
- [ ] Test with Stripe test cards
- [ ] Verify invoice updates on payment

### Phase 3: PayPal Integration (4 hours)
- [ ] Install PayPal packages
- [ ] Create PayPal service
- [ ] Implement order creation
- [ ] Add PayPal buttons to frontend
- [ ] Implement order capture
- [ ] Test in PayPal sandbox

### Phase 4: Payment Service (2 hours)
- [ ] Create payment service class
- [ ] Implement createPayment method
- [ ] Implement updateInvoiceOnPayment
- [ ] Add payment number generation
- [ ] Create audit logs for payments

### Phase 5: Admin Interface (2 hours)
- [ ] Create payments list page
- [ ] Create payment detail page
- [ ] Add payment history to invoice detail
- [ ] Add "Mark as Paid" for manual payments

### Phase 6: Testing & Polish (3 hours)
- [ ] Test all payment methods
- [ ] Test webhook handling
- [ ] Test error scenarios
- [ ] Add loading states
- [ ] Add error messages
- [ ] Mobile responsive testing

**Total Estimated Time:** ~20 hours

---

## Success Criteria

Payment system is complete when:

1. ✅ Client can view invoice on public payment page
2. ✅ Client can pay via Stripe (card)
3. ✅ Client can pay via PayPal
4. ✅ Apple Pay works (if browser supports)
5. ✅ Google Pay works (if browser supports)
6. ✅ Bank transfer instructions display correctly
7. ✅ Payment webhooks update invoice status
8. ✅ Payment records created in database
9. ✅ Admin can view payment history
10. ✅ Admin can process refunds
11. ✅ Email confirmations sent (when SES approved)
12. ✅ All payment methods tested and working

---

## Environment Setup Checklist

- [ ] Stripe account created
- [ ] Stripe test API keys obtained
- [ ] Stripe webhook endpoint configured
- [ ] PayPal business account created
- [ ] PayPal sandbox credentials obtained
- [ ] Bank account details added to .env
- [ ] Install npm packages (stripe, @paypal/checkout-server-sdk)
- [ ] Add environment variables to .env
- [ ] Test mode enabled for all providers

---

## Quick Start (Next Session)

**Step 1:** Install dependencies
```bash
pnpm add stripe @stripe/stripe-js @stripe/react-stripe-js
pnpm add @paypal/checkout-server-sdk @paypal/react-paypal-js
```

**Step 2:** Create `.env` entries
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
BANK_ACCOUNT_NUMBER=12345678
```

**Step 3:** Start with public invoice view page
```bash
# Create file
touch apps/web/src/routes/payment/[id].tsx
```

**Step 4:** Use existing test invoice
- Invoice ID: `cmhlgwzlk0001tks4jd0mcjku`
- URL: `http://localhost:3000/payment/cmhlgwzlk0001tks4jd0mcjku`

---

**Ready to implement!**
