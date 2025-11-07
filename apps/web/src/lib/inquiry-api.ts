const API_BASE_URL = 'http://localhost:3002';

export type InquiryType = 'WEDDING' | 'PORTRAIT' | 'COMMERCIAL' | 'FAMILY' | 'REAL_ESTATE' | 'OTHER';

export interface CreateInquiryRequest {
  fullName: string;
  email: string;
  phone: string;
  company?: string | null;
  inquiryType: InquiryType;
  shootDate?: string | null;
  shootDescription: string;
  location?: string | null;
  specialRequirements?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  attachmentUrls?: string[];
  source?: string | null;
}

export interface CreateInquiryResponse {
  success: boolean;
  inquiryId: string;
  message: string;
}

/**
 * Submit a new inquiry from the public form
 */
export async function submitInquiry(data: CreateInquiryRequest): Promise<CreateInquiryResponse> {
  const response = await fetch(`${API_BASE_URL}/inquiries/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit inquiry');
  }

  return response.json();
}
