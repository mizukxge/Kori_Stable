import type { Proposal } from './proposals-api';

const API_BASE_URL = 'http://localhost:3002';

export interface ConversionResult {
  proposal: Proposal;
  contract: any;
  invoice: any;
}

export interface ConversionStatus {
  accepted: boolean;
  hasContract: boolean;
  hasInvoice: boolean;
  contract?: any;
  invoice?: any;
}

/**
 * Accept a proposal and automatically create linked contract and invoice
 */
export async function acceptAndConvertProposal(proposalId: string): Promise<ConversionResult> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/proposals/${proposalId}/accept-and-convert`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );
    if (!response.ok) throw new Error('Failed to convert proposal');
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Failed to accept and convert proposal:', error);
    throw error;
  }
}

/**
 * Get the conversion status of a proposal
 */
export async function getProposalConversionStatus(proposalId: string): Promise<ConversionStatus> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/proposals/${proposalId}/conversion-status`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error('Failed to get conversion status');
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Failed to get proposal conversion status:', error);
    throw error;
  }
}

/**
 * Undo a proposal acceptance (revert contract and invoice)
 */
export async function undoProposalConversion(proposalId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/proposals/${proposalId}/undo-conversion`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error('Failed to undo conversion');
  } catch (error) {
    console.error('Failed to undo proposal conversion:', error);
    throw error;
  }
}
