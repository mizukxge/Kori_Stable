/**
 * Envelope API Client
 * Handles all multi-signature envelope operations
 */

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3001';

export interface CreateEnvelopeData {
  name: string;
  description?: string;
  signingWorkflow?: 'SEQUENTIAL' | 'PARALLEL';
  expiresAt?: string;
}

export interface UpdateEnvelopeData {
  name?: string;
  description?: string;
  signingWorkflow?: 'SEQUENTIAL' | 'PARALLEL';
  expiresAt?: string;
}

export interface AddDocumentData {
  name: string;
  fileName: string;
  filePath: string;
  fileHash: string;
  fileSize: number;
}

export interface AddSignerData {
  name: string;
  email: string;
  role?: string;
  sequenceNumber?: number;
}

export interface SignatureData {
  signatureDataUrl: string;
  initialsDataUrl?: string;
  pageNumber?: number;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Envelope {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  signingWorkflow: 'SEQUENTIAL' | 'PARALLEL';
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  completedAt?: string;
  expiresAt?: string;
  documents?: Array<{
    id: string;
    name: string;
    fileName: string;
    filePath: string;
    fileHash: string;
    fileSize: number;
  }>;
  signers?: Array<{
    id: string;
    name: string;
    email: string;
    role?: string;
    status: 'PENDING' | 'VIEWED' | 'SIGNED' | 'DECLINED' | 'EXPIRED';
    sequenceNumber?: number;
    viewedAt?: string;
    signedAt?: string;
    declinedAt?: string;
  }>;
}

// ============================================
// ENVELOPE CRUD OPERATIONS
// ============================================

/**
 * Get envelope statistics
 */
export async function getEnvelopeStats() {
  const response = await fetch(`${API_BASE}/admin/envelopes/stats`);
  if (!response.ok) throw new Error('Failed to fetch statistics');
  const json = await response.json();
  return json.data;
}

/**
 * List all envelopes with optional filtering
 */
export async function getEnvelopes(filters?: { status?: string; createdById?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.createdById) params.append('createdById', filters.createdById);

  const response = await fetch(
    `${API_BASE}/admin/envelopes${params.toString() ? `?${params.toString()}` : ''}`,
    {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) throw new Error('Failed to fetch envelopes');
  const json = await response.json();
  return json.data || [];
}

/**
 * Get single envelope by ID
 */
export async function getEnvelopeById(id: string): Promise<Envelope> {
  const response = await fetch(`${API_BASE}/admin/envelopes/${id}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 404) throw new Error('Envelope not found');
  if (!response.ok) throw new Error('Failed to fetch envelope');
  const json = await response.json();
  return json.data;
}

/**
 * Create new envelope
 */
export async function createEnvelope(data: CreateEnvelopeData): Promise<Envelope> {
  const response = await fetch(`${API_BASE}/admin/envelopes`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create envelope');
  }
  const json = await response.json();
  return json.data;
}

/**
 * Update envelope
 */
export async function updateEnvelope(id: string, data: UpdateEnvelopeData): Promise<Envelope> {
  const response = await fetch(`${API_BASE}/admin/envelopes/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to update envelope');
  const json = await response.json();
  return json.data;
}

/**
 * Send envelope to signers
 */
export async function sendEnvelope(id: string): Promise<Envelope> {
  const response = await fetch(`${API_BASE}/admin/envelopes/${id}/send`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send envelope');
  }
  const json = await response.json();
  return json.data;
}

// ============================================
// DOCUMENT OPERATIONS
// ============================================

/**
 * Add document to envelope
 */
export async function addDocument(envelopeId: string, data: AddDocumentData) {
  const response = await fetch(`${API_BASE}/admin/envelopes/${envelopeId}/documents`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to add document');
  const json = await response.json();
  return json.data;
}

/**
 * Remove document from envelope
 */
export async function removeDocument(envelopeId: string, documentId: string) {
  const response = await fetch(`${API_BASE}/admin/envelopes/${envelopeId}/documents/${documentId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) throw new Error('Failed to remove document');
  return await response.json();
}

// ============================================
// SIGNER OPERATIONS
// ============================================

/**
 * Add signer to envelope
 */
export async function addSigner(envelopeId: string, data: AddSignerData) {
  const response = await fetch(`${API_BASE}/admin/envelopes/${envelopeId}/signers`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add signer');
  }
  const json = await response.json();
  return json.data;
}

/**
 * Remove signer from envelope
 */
export async function removeSigner(envelopeId: string, signerId: string) {
  const response = await fetch(`${API_BASE}/admin/envelopes/${envelopeId}/signers/${signerId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) throw new Error('Failed to remove signer');
  return await response.json();
}

/**
 * Verify signature integrity
 */
export async function verifySignature(envelopeId: string, signerId: string) {
  const response = await fetch(`${API_BASE}/admin/envelopes/${envelopeId}/signers/${signerId}/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) throw new Error('Failed to verify signature');
  return await response.json();
}

// ============================================
// PUBLIC SIGNER OPERATIONS (Magic Link)
// ============================================

/**
 * Get envelope info for signer using magic link token
 */
export async function getSignerEnvelope(token: string) {
  const response = await fetch(`${API_BASE}/sign/${token}`);

  if (response.status === 401) throw new Error('Invalid or expired magic link');
  if (!response.ok) throw new Error('Failed to load envelope');
  const json = await response.json();
  return json.data;
}

/**
 * Mark envelope as viewed by signer
 */
export async function markEnvelopeViewed(token: string) {
  const response = await fetch(`${API_BASE}/sign/${token}/view`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) throw new Error('Failed to mark as viewed');
  return await response.json();
}

/**
 * Capture signature from signer
 */
export async function captureSignature(token: string, data: SignatureData) {
  const response = await fetch(`${API_BASE}/sign/${token}/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.status === 403) throw new Error('You cannot sign at this time (sequential signing)');
  if (response.status === 401) throw new Error('Invalid or expired magic link');
  if (!response.ok) throw new Error('Failed to capture signature');
  const json = await response.json();
  return json.data;
}

/**
 * Decline to sign envelope
 */
export async function declineSignature(token: string, reason?: string) {
  const response = await fetch(`${API_BASE}/sign/${token}/decline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) throw new Error('Failed to decline signature');
  return await response.json();
}
