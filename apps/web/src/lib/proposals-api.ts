const API_BASE_URL = 'http://localhost:3002';

export interface ProposalItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
}

export interface Proposal {
  id: string;
  proposalNumber: string;
  title: string;
  description?: string;
  clientId: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };
  subtotal: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  total: number | string;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'DECLINED';
  sentAt?: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  validUntil?: string;
  expiresAt?: Date;
  terms?: string;
  notes?: string;
  pdfPath?: string;
  items: ProposalItem[];
  contract?: {
    id: string;
    contractNumber: string;
    status: string;
  };
  createdBy: string;
  createdByUser?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProposalStats {
  total: number;
  draft: number;
  sent: number;
  viewed: number;
  accepted: number;
  declined: number;
  acceptanceRate: number;
  pendingCount: number;
}

// Get all proposals
export async function listProposals(filters?: {
  clientId?: string;
  status?: string;
  search?: string;
}): Promise<Proposal[]> {
  const params = new URLSearchParams();
  if (filters?.clientId) params.append('clientId', filters.clientId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);

  const url = `${API_BASE_URL}/admin/proposals${params.toString() ? '?' + params.toString() : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch proposals');
  }

  const data = await response.json();
  return data.data || data;
}

// Get proposal by ID
export async function getProposalById(id: string): Promise<Proposal> {
  const response = await fetch(`${API_BASE_URL}/admin/proposals/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch proposal');
  }

  const data = await response.json();
  return data.data || data;
}

// Create new proposal
export async function createProposal(input: {
  clientId: string;
  title: string;
  description?: string;
  terms?: string;
  validUntil?: string;
  expiresAt?: string;
  items: ProposalItem[];
  taxRate?: number;
  notes?: string;
}): Promise<Proposal> {
  const response = await fetch(`${API_BASE_URL}/admin/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create proposal');
  }

  const data = await response.json();
  return data.data || data;
}

// Update proposal
export async function updateProposal(
  id: string,
  input: {
    title?: string;
    description?: string;
    terms?: string;
    validUntil?: string;
    expiresAt?: string;
    items?: ProposalItem[];
    taxRate?: number;
    notes?: string;
  }
): Promise<Proposal> {
  const response = await fetch(`${API_BASE_URL}/admin/proposals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      console.error('API error response:', error);
      throw new Error(error.message || error.error || 'Failed to update proposal');
    } catch (e) {
      console.error('Failed to parse error response:', e);
      throw new Error(`Failed to update proposal (Status: ${response.status})`);
    }
  }

  const data = await response.json();
  return data.data || data;
}

// Send proposal
export async function sendProposal(id: string): Promise<Proposal> {
  const response = await fetch(`${API_BASE_URL}/admin/proposals/${id}/send`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send proposal');
  }

  const data = await response.json();
  return data.data || data;
}

// Accept proposal
export async function acceptProposal(id: string): Promise<Proposal> {
  const response = await fetch(`${API_BASE_URL}/admin/proposals/${id}/accept`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to accept proposal');
  }

  const data = await response.json();
  return data.data || data;
}

// Decline proposal
export async function declineProposal(id: string, reason?: string): Promise<Proposal> {
  const response = await fetch(`${API_BASE_URL}/admin/proposals/${id}/decline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to decline proposal');
  }

  const data = await response.json();
  return data.data || data;
}

// Delete proposal
export async function deleteProposal(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/proposals/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete proposal');
  }
}

// Get proposal statistics
export async function getProposalStats(): Promise<ProposalStats> {
  const response = await fetch(`${API_BASE_URL}/admin/proposals/stats`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch proposal statistics');
  }

  const data = await response.json();
  return data.data || data;
}
