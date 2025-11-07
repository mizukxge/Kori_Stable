const API_BASE_URL = 'http://localhost:3002';

export type PaymentMethod = 'BANK_TRANSFER' | 'PAYPAL' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'STRIPE';

export interface InvoicePaymentDetails {
  id: string;
  invoiceNumber: string;
  title: string;
  total: string;
  amountDue: string;
  amountPaid: string;
  currency: string;
  paymentType: 'CASH' | 'CARD' | null;
  dueDate: string | null;
  client: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }>;
}

/**
 * Get invoice payment details by invoice number
 */
export async function getInvoicePaymentDetails(invoiceNumber: string): Promise<InvoicePaymentDetails> {
  const response = await fetch(`${API_BASE_URL}/client/invoice/${invoiceNumber}/payment-details`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to load invoice details');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Create Stripe payment intent
 */
export async function createStripePaymentIntent(invoiceId: string): Promise<{
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}> {
  const response = await fetch(`${API_BASE_URL}/admin/invoices/${invoiceId}/create-payment-intent`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create payment intent');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Record a manual payment
 */
export async function recordPayment(invoiceId: string, amount: number, method: string, notes?: string) {
  const response = await fetch(`${API_BASE_URL}/admin/payments`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invoiceId,
      amount,
      method,
      notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to record payment');
  }

  return response.json();
}
