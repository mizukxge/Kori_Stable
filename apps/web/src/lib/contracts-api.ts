const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Clause {
  id: string;
  slug: string;
  title: string;
  bodyHtml: string;
  tags: string[];
  mandatory: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  eventType?: string;
  bodyHtml?: string;
  variablesSchema?: any;
  mandatoryClauseIds: string[];
  isActive: boolean;
  isPublished: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdByUser?: { name: string; email: string };
}

export interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED' | 'EXPIRED';
  content: string;
  pdfPath?: string;
  templateId: string;
  template?: ContractTemplate;
  clientId?: string;
  client?: any;
  variables: any;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  signedAt?: string;
  createdByUser?: { name: string; email: string };
  magicLinkUrl?: string;
  magicLinkExpiresAt?: string;
}

// Get all templates (including drafts)
export async function getAllTemplates(): Promise<ContractTemplate[]> {
  const response = await fetch(`${API_BASE_URL}/api/contract-templates`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch templates');
  }

  return response.json();
}

// Get all published templates
export async function getPublishedTemplates(): Promise<ContractTemplate[]> {
  const response = await fetch(`${API_BASE_URL}/api/contract-templates/published`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch templates');
  }

  return response.json();
}

// Get template by ID
export async function getTemplateById(id: string): Promise<ContractTemplate> {
  const response = await fetch(`${API_BASE_URL}/api/contract-templates/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch template');
  }

  return response.json();
}

// Get template by ID with clauses
export async function getTemplateWithClauses(id: string): Promise<ContractTemplate & { clauses: Clause[] }> {
  const response = await fetch(`${API_BASE_URL}/api/contract-templates/${id}/with-clauses`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch template');
  }

  return response.json();
}

// Create template
export async function createTemplate(data: {
  name: string;
  description?: string;
  type?: string;
  eventType?: string;
  bodyHtml?: string;
  variablesSchema?: any;
  mandatoryClauseIds?: string[];
  isActive?: boolean;
  isPublished?: boolean;
}): Promise<ContractTemplate> {
  const response = await fetch(`${API_BASE_URL}/api/contract-templates`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create template');
  }

  return response.json();
}

// Update template
export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    type?: string;
    eventType?: string;
    bodyHtml?: string;
    variablesSchema?: any;
    mandatoryClauseIds?: string[];
    isActive?: boolean;
    isPublished?: boolean;
  }
): Promise<ContractTemplate> {
  const response = await fetch(`${API_BASE_URL}/api/contract-templates/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update template');
  }

  return response.json();
}

// Delete template
export async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/contract-templates/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete template');
  }
}

// Publish template
export async function publishTemplate(id: string): Promise<ContractTemplate> {
  const response = await fetch(`${API_BASE_URL}/api/contract-templates/${id}/publish`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to publish template');
  }

  return response.json();
}

// Unpublish template
export async function unpublishTemplate(id: string): Promise<ContractTemplate> {
  const response = await fetch(`${API_BASE_URL}/api/contract-templates/${id}/unpublish`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to unpublish template');
  }

  return response.json();
}

// Get all clauses
export async function getAllClauses(filters?: {
  search?: string;
  tags?: string;
  mandatory?: boolean;
  isActive?: boolean;
}): Promise<Clause[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.tags) params.append('tags', filters.tags);
  if (filters?.mandatory !== undefined) params.append('mandatory', String(filters.mandatory));
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

  const url = `${API_BASE_URL}/api/clauses${params.toString() ? '?' + params.toString() : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch clauses');
  }

  return response.json();
}

// Get clause by ID
export async function getClauseById(id: string): Promise<Clause> {
  const response = await fetch(`${API_BASE_URL}/api/clauses/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch clause');
  }

  return response.json();
}

// Create clause
export async function createClause(data: {
  slug: string;
  title: string;
  bodyHtml: string;
  tags?: string[];
  mandatory?: boolean;
  isActive?: boolean;
}): Promise<Clause> {
  const response = await fetch(`${API_BASE_URL}/api/clauses`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create clause');
  }

  return response.json();
}

// Update clause
export async function updateClause(
  id: string,
  data: {
    slug?: string;
    title?: string;
    bodyHtml?: string;
    tags?: string[];
    mandatory?: boolean;
    isActive?: boolean;
  }
): Promise<Clause> {
  const response = await fetch(`${API_BASE_URL}/api/clauses/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update clause');
  }

  return response.json();
}

// Delete clause (soft delete)
export async function deleteClause(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/clauses/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete clause');
  }
}

// Contract generation (uses existing contracts route)
export async function generateContract(data: {
  templateId: string;
  title: string;
  clientId?: string;
  variables: Record<string, any>;
}): Promise<Contract> {
  const response = await fetch(`${API_BASE_URL}/admin/contracts`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate contract');
  }

  const result = await response.json();
  return result.data || result;
}

// List contracts
export async function listContracts(filters?: {
  clientId?: string;
  status?: string;
}): Promise<Contract[]> {
  const params = new URLSearchParams();
  if (filters?.clientId) params.append('clientId', filters.clientId);
  if (filters?.status) params.append('status', filters.status);

  const url = `${API_BASE_URL}/admin/contracts${params.toString() ? '?' + params.toString() : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch contracts');
  }

  const result = await response.json();
  return result.data || result;
}

// Get contract by ID
export async function getContractById(id: string): Promise<Contract> {
  const response = await fetch(`${API_BASE_URL}/admin/contracts/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch contract');
  }

  const result = await response.json();
  return result.data || result;
}

// Update contract status
export async function updateContractStatus(
  id: string,
  status: Contract['status']
): Promise<Contract> {
  const response = await fetch(`${API_BASE_URL}/admin/contracts/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update contract');
  }

  const result = await response.json();
  return result.data || result;
}

// Send contract to client
export async function sendContract(id: string): Promise<Contract> {
  const response = await fetch(`${API_BASE_URL}/admin/contracts/${id}/send`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send contract');
  }

  const result = await response.json();
  return result.data || result;
}

// Resend contract (revokes old magic link and generates new one)
export async function resendContract(id: string): Promise<Contract & { magicLinkUrl?: string; magicLinkExpiresAt?: Date }> {
  const response = await fetch(`${API_BASE_URL}/admin/contracts/${id}/resend`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to resend contract');
  }

  const result = await response.json();
  return result.data || result;
}

// Delete contract
export async function deleteContract(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/contracts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete contract');
  }
}

// PDF Generation APIs

// Generate PDF for contract
export async function generateContractPDF(id: string): Promise<Contract> {
  const response = await fetch(`${API_BASE_URL}/admin/contracts/${id}/generate-pdf`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate PDF');
  }

  const result = await response.json();
  return result.data || result;
}

// Regenerate PDF for contract
export async function regenerateContractPDF(id: string): Promise<Contract> {
  const response = await fetch(`${API_BASE_URL}/admin/contracts/${id}/regenerate-pdf`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to regenerate PDF');
  }

  const result = await response.json();
  return result.data || result;
}

// Verify PDF integrity
export async function verifyContractPDF(id: string): Promise<{
  isValid: boolean;
  pdfPath: string;
  pdfHash: string;
}> {
  const response = await fetch(`${API_BASE_URL}/admin/contracts/${id}/verify-pdf`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to verify PDF');
  }

  const result = await response.json();
  return result.data || result;
}

// Get PDF information
export async function getContractPDFInfo(id: string): Promise<{
  title?: string;
  author?: string;
  subject?: string;
  pageCount: number;
  creationDate?: Date;
  modificationDate?: Date;
  fileSize: number;
}> {
  const response = await fetch(`${API_BASE_URL}/admin/contracts/${id}/pdf-info`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get PDF info');
  }

  const result = await response.json();
  return result.data || result;
}

// Download PDF
export function downloadContractPDF(pdfPath: string, filename?: string): void {
  const url = `${API_BASE_URL}${pdfPath}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || pdfPath.split('/').pop() || 'contract.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Contract Events / Audit Trail
export interface ContractEvent {
  id: string;
  contractId: string;
  type: string;
  ip?: string;
  userAgent?: string;
  meta?: any;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  clientId?: string;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface ContractAuditTrail {
  contractEvents: ContractEvent[];
  auditLogs: AuditLog[];
}

export async function getContractEvents(id: string): Promise<ContractAuditTrail> {
  const response = await fetch(`${API_BASE_URL}/admin/contracts/${id}/events`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch contract events');
  }

  const result = await response.json();
  return result.data;
}
