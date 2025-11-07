const API_BASE_URL = 'http://localhost:3002';

export interface ProposalTemplateItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: string | number;
  position?: number;
}

export interface ProposalTemplate {
  id: string;
  name: string;
  description?: string;
  title?: string;
  defaultTerms?: string;
  isActive: boolean;
  isPublic: boolean;
  items: ProposalTemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProposalTemplateData {
  name: string;
  description?: string;
  title?: string;
  defaultTerms?: string;
  items?: ProposalTemplateItem[];
}

export interface UpdateProposalTemplateData {
  name?: string;
  description?: string;
  title?: string;
  defaultTerms?: string;
  isActive?: boolean;
  items?: ProposalTemplateItem[];
}

export interface ProposalTemplateStats {
  total: number;
  active: number;
  inactive: number;
}

/**
 * List all proposal templates
 */
export async function listProposalTemplates(): Promise<ProposalTemplate[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/proposal-templates`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to list proposal templates');
    const data = await response.json();
    return data.data || data || [];
  } catch (error) {
    console.error('Failed to list proposal templates:', error);
    throw error;
  }
}

/**
 * Get a single proposal template
 */
export async function getProposalTemplate(id: string): Promise<ProposalTemplate> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/proposal-templates/${id}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Template not found');
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Failed to get proposal template:', error);
    throw error;
  }
}

/**
 * Create a new proposal template
 */
export async function createProposalTemplate(
  data: CreateProposalTemplateData
): Promise<ProposalTemplate> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/proposal-templates`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create template');
    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('Failed to create proposal template:', error);
    throw error;
  }
}

/**
 * Update a proposal template
 */
export async function updateProposalTemplate(
  id: string,
  data: UpdateProposalTemplateData
): Promise<ProposalTemplate> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/proposal-templates/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update template');
    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('Failed to update proposal template:', error);
    throw error;
  }
}

/**
 * Delete a proposal template (soft delete)
 */
export async function deleteProposalTemplate(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/proposal-templates/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete template');
  } catch (error) {
    console.error('Failed to delete proposal template:', error);
    throw error;
  }
}

/**
 * Duplicate a proposal template
 */
export async function duplicateProposalTemplate(
  id: string,
  newName?: string
): Promise<ProposalTemplate> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/proposal-templates/${id}/duplicate`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      }
    );
    if (!response.ok) throw new Error('Failed to duplicate template');
    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('Failed to duplicate proposal template:', error);
    throw error;
  }
}

/**
 * Get proposal template statistics
 */
export async function getProposalTemplateStats(): Promise<ProposalTemplateStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/proposal-templates/stats`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get stats');
    const data = await response.json();
    return data.data || { total: 0, active: 0, inactive: 0 };
  } catch (error) {
    console.error('Failed to get proposal template statistics:', error);
    throw error;
  }
}
