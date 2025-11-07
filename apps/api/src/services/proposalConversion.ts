import { PrismaClient } from '@prisma/client';
import { VariableSubstitutionService } from './variableSubstitution';

const db = new PrismaClient();

export interface ConversionResult {
  proposal: any;
  contract: any;
  invoice: any;
}

/**
 * Service for converting accepted proposals to contracts and invoices
 */
export class ProposalConversionService {
  /**
   * Accept a proposal and automatically create linked contract and invoice
   * This is the "single-click" conversion feature
   */
  static async acceptAndConvert(proposalId: string): Promise<ConversionResult> {
    try {
      // 1. Get the proposal with all related data
      const proposal = await db.proposal.findUnique({
        where: { id: proposalId },
        include: {
          client: true,
          items: true,
          createdByUser: true,
        },
      });

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      if (proposal.status !== 'DRAFT' && proposal.status !== 'SENT' && proposal.status !== 'VIEWED') {
        throw new Error(`Proposal cannot be accepted from status: ${proposal.status}`);
      }

      // 2. Mark proposal as ACCEPTED
      const updatedProposal = await db.proposal.update({
        where: { id: proposalId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
        include: {
          client: true,
          items: true,
        },
      });

      // 3. Create contract from proposal
      const contract = await this.createContractFromProposal(updatedProposal);

      // 4. Create invoice from proposal
      const invoice = await this.createInvoiceFromProposal(updatedProposal, contract.id);

      return {
        proposal: updatedProposal,
        contract,
        invoice,
      };
    } catch (error) {
      console.error('Failed to accept and convert proposal:', error);
      throw error;
    }
  }

  /**
   * Create a contract from an accepted proposal
   */
  private static async createContractFromProposal(proposal: any): Promise<any> {
    try {
      // Generate contract number (CT-YYYY-NNNN)
      const year = new Date().getFullYear();
      const contractCount = await db.contract.count({
        where: {
          contractNumber: {
            startsWith: `CT-${year}-`,
          },
        },
      });
      const contractNumber = `CT-${year}-${String(contractCount + 1).padStart(4, '0')}`;

      // Create context for variable substitution
      const context = VariableSubstitutionService.createContext(
        proposal.client,
        proposal.createdByUser,
        proposal
      );

      // Create contract
      const contract = await db.contract.create({
        data: {
          contractNumber,
          title: `${proposal.client.name} - ${proposal.title}`,
          content: `Contract based on proposal: ${proposal.proposalNumber}`,
          status: 'DRAFT',
          clientId: proposal.clientId,
          proposalId: proposal.id,
          createdBy: proposal.createdBy,
          effectiveAt: new Date(),
        },
      });

      return contract;
    } catch (error) {
      console.error('Failed to create contract:', error);
      throw error;
    }
  }

  /**
   * Create an invoice from an accepted proposal
   */
  private static async createInvoiceFromProposal(proposal: any, contractId: string): Promise<any> {
    try {
      // Generate invoice number (INV-YYYY-NNNN)
      const year = new Date().getFullYear();
      const invoiceCount = await db.invoice.count({
        where: {
          invoiceNumber: {
            startsWith: `INV-${year}-`,
          },
        },
      });
      const invoiceNumber = `INV-${year}-${String(invoiceCount + 1).padStart(4, '0')}`;

      // Create invoice
      const invoice = await db.invoice.create({
        data: {
          invoiceNumber,
          title: `Invoice for ${proposal.title}`,
          description: `Invoice for accepted proposal: ${proposal.proposalNumber}`,
          clientId: proposal.clientId,
          contractId: contractId,
          subtotal: proposal.subtotal,
          taxRate: proposal.taxRate,
          taxAmount: proposal.taxAmount,
          total: proposal.total,
          amountDue: proposal.total,
          status: 'DRAFT',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
          createdBy: proposal.createdBy,
          items: {
            create: proposal.items.map((item: any, index: number) => ({
              position: index,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount || item.unitPrice * item.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return invoice;
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw error;
    }
  }

  /**
   * Get the conversion status of a proposal
   * (i.e., whether it has linked contract and invoice)
   */
  static async getConversionStatus(proposalId: string): Promise<{
    accepted: boolean;
    hasContract: boolean;
    hasInvoice: boolean;
    contract?: any;
    invoice?: any;
  }> {
    try {
      const proposal = await db.proposal.findUnique({
        where: { id: proposalId },
      });

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      const contract = await db.contract.findUnique({
        where: { proposalId },
      });

      const invoice = contract
        ? await db.invoice.findFirst({
            where: { contractId: contract.id },
          })
        : null;

      return {
        accepted: proposal.status === 'ACCEPTED',
        hasContract: !!contract,
        hasInvoice: !!invoice,
        contract: contract || undefined,
        invoice: invoice || undefined,
      };
    } catch (error) {
      console.error('Failed to get conversion status:', error);
      throw error;
    }
  }

  /**
   * Undo a conversion (revert contract and invoice back to draft if not too far along)
   */
  static async undoConversion(proposalId: string): Promise<void> {
    try {
      const proposal = await db.proposal.findUnique({
        where: { id: proposalId },
        include: {
          contract: true,
        },
      });

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      if (proposal.status !== 'ACCEPTED') {
        throw new Error('Proposal must be accepted to undo conversion');
      }

      // Revert proposal to SENT
      await db.proposal.update({
        where: { id: proposalId },
        data: {
          status: 'SENT',
          acceptedAt: null,
        },
      });

      // Archive related contract if it exists
      if (proposal.contract) {
        await db.contract.update({
          where: { id: proposal.contract.id },
          data: {
            status: 'VOIDED',
            voidedAt: new Date(),
            voidedReason: 'Conversion undone',
          },
        });

        // Archive related invoices
        const invoices = await db.invoice.findMany({
          where: { contractId: proposal.contract.id },
        });

        for (const invoice of invoices) {
          await db.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'CANCELLED',
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to undo conversion:', error);
      throw error;
    }
  }
}
