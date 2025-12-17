/**
 * Public Contract API - No authentication required
 * Uses magic links and OTP for access
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ValidationResult {
  success: boolean;
  contractId?: string;
  expired?: boolean;
  notFound?: boolean;
  message?: string;
}

interface OTPRequestResult {
  success: boolean;
  message: string;
  expiresAt?: string;
}

interface OTPVerifyResult {
  success: boolean;
  sessionId?: string;
  expiresAt?: string;
  message?: string;
  attemptsRemaining?: number;
}

interface ContractData {
  id: string;
  contractNumber: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };
  template?: {
    id: string;
    name: string;
  };
}

interface SignatureData {
  signatureDataUrl: string;
  signerName: string;
  signerEmail: string;
  agreedToTerms: boolean;
}

interface SignResult {
  success: boolean;
  message: string;
  data?: {
    contractNumber: string;
    signedAt: string;
    signedPdfPath: string;
  };
  errors?: string[];
}

interface DeclineResult {
  success: boolean;
  message: string;
}

interface ExtendSessionResult {
  success: boolean;
  expiresAt?: string;
  message?: string;
}

/**
 * Validate magic link token
 */
export async function validateMagicLink(token: string): Promise<ValidationResult> {
  const response = await fetch(`${API_URL}/contract/validate/${token}`);
  return response.json();
}

/**
 * Request OTP for contract access
 */
export async function requestOTP(token: string, email: string): Promise<OTPRequestResult> {
  const response = await fetch(`${API_URL}/contract/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, email }),
  });
  return response.json();
}

/**
 * Verify OTP and create signing session
 */
export async function verifyOTP(token: string, otp: string): Promise<OTPVerifyResult> {
  const response = await fetch(`${API_URL}/contract/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, otp }),
  });
  return response.json();
}

/**
 * Get contract for signing (requires valid session)
 */
export async function getContractForSigning(
  contractId: string,
  sessionId: string
): Promise<{ success: boolean; data?: ContractData; message?: string }> {
  const response = await fetch(`${API_URL}/contract/view/${contractId}?sessionId=${sessionId}`);
  return response.json();
}

/**
 * Sign the contract
 */
export async function signContract(
  contractId: string,
  sessionId: string,
  signatureData: SignatureData
): Promise<SignResult> {
  const response = await fetch(`${API_URL}/contract/sign/${contractId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      ...signatureData,
    }),
  });
  return response.json();
}

/**
 * Decline the contract
 */
export async function declineContract(
  contractId: string,
  sessionId: string,
  reason?: string
): Promise<DeclineResult> {
  const response = await fetch(`${API_URL}/contract/decline/${contractId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, reason }),
  });
  return response.json();
}

/**
 * Extend signing session
 */
export async function extendSession(
  contractId: string,
  sessionId: string
): Promise<ExtendSessionResult> {
  const response = await fetch(`${API_URL}/contract/extend-session/${contractId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  return response.json();
}
