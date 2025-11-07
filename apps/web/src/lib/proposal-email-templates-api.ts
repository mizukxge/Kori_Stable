/**
 * Proposal Email Templates API Client
 * Frontend API functions for managing email templates
 */

const API_BASE_URL = 'http://localhost:3002';

export interface ProposalEmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    proposals: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateInput {
  name: string;
  subject: string;
  content: string;
  isDefault?: boolean;
}

export interface UpdateEmailTemplateInput {
  name?: string;
  subject?: string;
  content?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface RenderTemplateResult {
  subject: string;
  content: string;
  variables: string[];
}

export interface TemplateStats {
  total: number;
  active: number;
  inactive: number;
  hasDefault: boolean;
  defaultTemplate?: {
    id: string;
    name: string;
  };
}

/**
 * Create a new email template
 */
export async function createEmailTemplate(
  input: CreateEmailTemplateInput
): Promise<ProposalEmailTemplate> {
  const response = await fetch(`${API_BASE_URL}/admin/proposal-email-templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create email template');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * List all email templates
 */
export async function listEmailTemplates(): Promise<ProposalEmailTemplate[]> {
  const response = await fetch(`${API_BASE_URL}/admin/proposal-email-templates`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch email templates');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Get a single email template by ID
 */
export async function getEmailTemplate(id: string): Promise<ProposalEmailTemplate> {
  const response = await fetch(`${API_BASE_URL}/admin/proposal-email-templates/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch email template');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Update an email template
 */
export async function updateEmailTemplate(
  id: string,
  input: UpdateEmailTemplateInput
): Promise<ProposalEmailTemplate> {
  const response = await fetch(`${API_BASE_URL}/admin/proposal-email-templates/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update email template');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Delete an email template
 */
export async function deleteEmailTemplate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/proposal-email-templates/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete email template');
  }
}

/**
 * Set a template as default
 */
export async function setDefaultEmailTemplate(id: string): Promise<ProposalEmailTemplate> {
  const response = await fetch(
    `${API_BASE_URL}/admin/proposal-email-templates/${id}/set-default`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to set default template');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Preview template with sample data
 */
export async function previewEmailTemplate(id: string): Promise<RenderTemplateResult> {
  const response = await fetch(
    `${API_BASE_URL}/admin/proposal-email-templates/${id}/preview`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to preview template');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Preview template content without saving (for create/edit form)
 */
export async function previewTemplateContent(
  subject: string,
  content: string
): Promise<RenderTemplateResult> {
  const response = await fetch(`${API_BASE_URL}/admin/proposal-email-templates/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ subject, content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to preview template content');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Get template statistics
 */
export async function getTemplateStats(): Promise<TemplateStats> {
  const response = await fetch(`${API_BASE_URL}/admin/proposal-email-templates/stats`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch template statistics');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Send proposal email
 */
export async function sendProposalEmail(
  proposalId: string,
  input: {
    templateId?: string;
    recipientEmail?: string;
    customMessage?: string;
  }
): Promise<{
  emailLogId: string;
  recipientEmail: string;
  subject: string;
  sentAt: Date;
}> {
  const response = await fetch(`${API_BASE_URL}/admin/proposals/${proposalId}/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send proposal email');
  }

  const data = await response.json();
  return data.data || data;
}
