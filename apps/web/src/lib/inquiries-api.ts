const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Inquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company?: string | null;
  inquiryType: 'WEDDING' | 'PORTRAIT' | 'COMMERCIAL' | 'EVENT' | 'FAMILY' | 'PRODUCT' | 'REAL_ESTATE' | 'HEADSHOT' | 'OTHER';
  shootDate?: string | null;
  shootDescription: string;
  location?: string | null;
  specialRequirements?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  attachmentUrls: string[];
  attachmentCount: number;
  source?: string | null;
  tags: string[];
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'NEGOTIATING' | 'CONVERTED' | 'REJECTED' | 'ARCHIVED';
  internalNotes?: string | null;
  clientId?: string | null;
  client?: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
  contactedAt?: string | null;
  qualifiedAt?: string | null;
  convertedAt?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface InquiryStats {
  totalThisPeriod: number;
  newToday: number;
  conversionRate: number;
  avgResponseTimeHours: number;
}

export interface ListInquiriesResponse {
  success: boolean;
  data: Inquiry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InquiryResponse {
  success: boolean;
  data: Inquiry;
}

/**
 * Get inquiry statistics for dashboard
 */
export async function getInquiryStats(): Promise<{ success: boolean; data: InquiryStats }> {
  const response = await fetch(`${API_BASE_URL}/admin/inquiries/stats`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to load inquiry stats');
  }

  return response.json();
}

/**
 * List inquiries with filtering, sorting, and pagination
 */
export async function getInquiries(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  type?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  budgetMin?: number;
  budgetMax?: number;
  tags?: string[];
}): Promise<ListInquiriesResponse> {
  const query = new URLSearchParams();

  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.sortBy) query.append('sortBy', params.sortBy);
  if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
  if (params?.status) query.append('status', params.status);
  if (params?.type) query.append('type', params.type);
  if (params?.search) query.append('search', params.search);
  if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
  if (params?.dateTo) query.append('dateTo', params.dateTo);
  if (params?.budgetMin) query.append('budgetMin', String(params.budgetMin));
  if (params?.budgetMax) query.append('budgetMax', String(params.budgetMax));
  if (params?.tags?.length) query.append('tags', params.tags.join(','));

  const response = await fetch(
    `${API_BASE_URL}/admin/inquiries?${query.toString()}`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to load inquiries');
  }

  return response.json();
}

/**
 * Get a single inquiry by ID
 */
export async function getInquiry(id: string): Promise<InquiryResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/inquiries/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to load inquiry');
  }

  return response.json();
}

/**
 * Update inquiry (internal notes, tags, etc.)
 */
export async function updateInquiry(
  id: string,
  data: {
    internalNotes?: string | null;
    tags?: string[];
    status?: string;
  }
): Promise<InquiryResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/inquiries/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update inquiry');
  }

  return response.json();
}

/**
 * Update inquiry status
 */
export async function updateInquiryStatus(
  id: string,
  status: string
): Promise<InquiryResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/inquiries/${id}/status`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update inquiry status');
  }

  return response.json();
}

/**
 * Convert inquiry to client
 */
export async function convertInquiryToClient(
  id: string,
  clientStatus?: string
): Promise<{ success: boolean; data: { inquiry: Inquiry; client: any } }> {
  const response = await fetch(`${API_BASE_URL}/admin/inquiries/${id}/convert`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: clientStatus || 'ACTIVE' }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to convert inquiry to client');
  }

  return response.json();
}

/**
 * Send email to inquiry contact
 */
export async function sendInquiryEmail(
  id: string,
  data: {
    templateName: string;
    customMessage?: string;
    recipientEmail?: string;
  }
): Promise<{ success: boolean; data: any }> {
  const response = await fetch(`${API_BASE_URL}/admin/inquiries/${id}/email`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send email');
  }

  return response.json();
}

/**
 * Delete or archive inquiry
 */
export async function deleteInquiry(
  id: string,
  archive: boolean = true
): Promise<InquiryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/inquiries/${id}?archive=${archive}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete inquiry');
  }

  return response.json();
}
