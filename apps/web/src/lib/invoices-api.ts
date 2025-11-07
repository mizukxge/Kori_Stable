const API_BASE_URL = 'http://localhost:3002';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
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
  amountDue: number | string;
  amountPaid?: number | string;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  paymentTerms?: string;
  dueDate?: string;
  notes?: string;
  pdfPath?: string;
  items: InvoiceItem[];
  createdBy: string;
  createdByUser?: {
    name: string;
    email: string;
  };
  sentAt?: Date;
  paidAt?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceStats {
  total: number;
  byStatus: {
    DRAFT?: number;
    SENT?: number;
    PARTIAL?: number;
    PAID?: number;
    OVERDUE?: number;
  };
  totalRevenue: string;
  unpaidAmount: string;
}

// Get all invoices
export async function listInvoices(filters?: {
  clientId?: string;
  status?: string;
  search?: string;
}): Promise<Invoice[]> {
  const params = new URLSearchParams();
  if (filters?.clientId) params.append('clientId', filters.clientId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);

  const url = `${API_BASE_URL}/admin/invoices${params.toString() ? '?' + params.toString() : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch invoices');
  }

  const data = await response.json();
  return data.data || data;
}

// Get invoice by ID
export async function getInvoiceById(id: string): Promise<Invoice> {
  const response = await fetch(`${API_BASE_URL}/admin/invoices/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch invoice');
  }

  const data = await response.json();
  return data.data || data;
}

// Create new invoice
export async function createInvoice(input: {
  clientId: string;
  title: string;
  description?: string;
  paymentTerms?: string;
  dueDate?: string;
  items: InvoiceItem[];
  taxRate?: number;
  notes?: string;
  currency?: string;
}): Promise<Invoice> {
  const response = await fetch(`${API_BASE_URL}/admin/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create invoice');
  }

  const data = await response.json();
  return data.data || data;
}

// Update invoice
export async function updateInvoice(
  id: string,
  input: {
    title?: string;
    description?: string;
    paymentTerms?: string;
    dueDate?: string;
    items?: InvoiceItem[];
    taxRate?: number;
    notes?: string;
    status?: string;
  }
): Promise<Invoice> {
  const response = await fetch(`${API_BASE_URL}/admin/invoices/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update invoice');
  }

  const data = await response.json();
  return data.data || data;
}

// Send invoice
export async function sendInvoice(id: string): Promise<Invoice> {
  const response = await fetch(`${API_BASE_URL}/admin/invoices/${id}/send`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send invoice');
  }

  const data = await response.json();
  return data.data || data;
}

// Mark invoice as paid
export async function markInvoicePaid(id: string): Promise<Invoice> {
  const response = await fetch(`${API_BASE_URL}/admin/invoices/${id}/mark-paid`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark invoice as paid');
  }

  const data = await response.json();
  return data.data || data;
}

// Delete invoice
export async function deleteInvoice(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/invoices/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete invoice');
  }
}

// Get invoice statistics
export async function getInvoiceStats(): Promise<InvoiceStats> {
  const response = await fetch(`${API_BASE_URL}/admin/invoices/stats`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch invoice statistics');
  }

  const data = await response.json();
  return data.data || data;
}
