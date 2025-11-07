const API_BASE_URL = 'http://localhost:3002';

// Proposal types
export interface PublicProposal {
  proposalNumber: string;
  title: string;
  description: string;
  client: {
    name: string;
    email: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: string;
    amount: string;
  }>;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  currency: string;
  terms: string;
  validUntil: string;
  expiresAt: string;
  status: string;
  sentAt: string;
  viewedAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
}

// Invoice types
export interface PublicInvoice {
  invoiceNumber: string;
  title: string;
  description?: string;
  client: {
    name: string;
    email: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: string;
    amount: string;
  }>;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  currency: string;
  status: string;
  paymentTerms?: string;
  dueDate?: string;
  sentAt: string;
  paidAt: string | null;
}

// Contract types
export interface PublicContract {
  id: string;
  title: string;
  description?: string;
  status: string;
  client: {
    name: string;
    email: string;
  };
  parties: Array<{
    name: string;
    role: string;
  }>;
  content: string;
  createdAt: string;
  expiresAt?: string;
  signedAt?: string;
}

// OTP Response
export interface OTPResponse {
  success: boolean;
  message: string;
  data?: {
    otpCode: string;
    formattedCode: string;
    expiresAt: string;
    expiresInMinutes: number;
  };
}

// Proposal API functions
export async function getProposal(proposalNumber: string): Promise<PublicProposal> {
  const response = await fetch(`${API_BASE_URL}/proposals/${proposalNumber}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to load proposal');
  }

  const data = await response.json();
  return data.data;
}

export async function requestProposalOTP(proposalNumber: string): Promise<OTPResponse> {
  const response = await fetch(`${API_BASE_URL}/proposals/${proposalNumber}/request-otp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request OTP');
  }

  return await response.json();
}

export async function acceptProposal(
  proposalNumber: string,
  otpCode: string
): Promise<{ proposalNumber: string; title: string; total: string; acceptedAt: string }> {
  const response = await fetch(`${API_BASE_URL}/proposals/${proposalNumber}/accept`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otpCode }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to accept proposal');
  }

  const data = await response.json();
  return data.data;
}

export async function declineProposal(
  proposalNumber: string,
  reason?: string
): Promise<{ proposalNumber: string; declinedAt: string }> {
  const response = await fetch(`${API_BASE_URL}/proposals/${proposalNumber}/decline`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to decline proposal');
  }

  const data = await response.json();
  return data.data;
}

// Invoice API functions
export async function getInvoice(invoiceNumber: string): Promise<PublicInvoice> {
  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceNumber}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to load invoice');
  }

  const data = await response.json();
  return data.data;
}

export async function requestInvoiceOTP(
  invoiceNumber: string,
  email: string
): Promise<OTPResponse> {
  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceNumber}/request-otp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request OTP');
  }

  return await response.json();
}

export async function verifyInvoicePayment(
  invoiceNumber: string,
  otpCode: string,
  paymentMethod?: string
): Promise<{
  invoiceNumber: string;
  title: string;
  total: string;
  paidAt: string;
  status: string;
}> {
  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceNumber}/verify-payment`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otpCode, paymentMethod }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to verify payment');
  }

  const data = await response.json();
  return data.data;
}

// Contract API functions (already exists, but including for completeness)
export async function validateContractToken(token: string): Promise<{ contractId: string }> {
  const response = await fetch(`${API_BASE_URL}/contract/validate/${token}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Invalid contract link');
  }

  const data = await response.json();
  return { contractId: data.contractId };
}

export async function requestContractOTP(token: string, email: string): Promise<OTPResponse> {
  const response = await fetch(`${API_BASE_URL}/contract/request-otp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request OTP');
  }

  return await response.json();
}

export async function verifyContractOTP(
  token: string,
  otp: string
): Promise<{ sessionId: string; expiresAt: string }> {
  const response = await fetch(`${API_BASE_URL}/contract/verify-otp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, otp }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Invalid OTP');
  }

  const data = await response.json();
  return data;
}

export async function getContractForSigning(
  contractId: string,
  sessionId: string
): Promise<PublicContract> {
  const response = await fetch(`${API_BASE_URL}/contract/view/${contractId}?sessionId=${sessionId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to load contract');
  }

  const data = await response.json();
  return data.data;
}
