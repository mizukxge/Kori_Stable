import { PrismaClient, ContractStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { TemplateService } from './template.js';

const prisma = new PrismaClient();

const CONTRACTS_DIR = path.join(process.cwd(), 'contracts');

export interface GenerateContractData {
  templateId: string;
  title: string;
  clientId?: string;
  proposalId?: string;
  variables: Record<string, any>;
}

export interface UpdateContractData {
  title?: string;
  status?: ContractStatus;
}

export class ContractService {
  /**
   * Initialize contracts directory
   */
  static async initializeStorage(): Promise<void> {
    await fs.mkdir(CONTRACTS_DIR, { recursive: true });
  }

  /**
   * Generate contract number (e.g., CONT-2025-001)
   */
  static async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CONT-${year}`;

    // Get count of contracts for this year
    const count = await prisma.contract.count({
      where: {
        contractNumber: {
          startsWith: prefix,
        },
      },
    });

    const number = (count + 1).toString().padStart(3, '0');
    return `${prefix}-${number}`;
  }

  /**
   * Substitute variables in template content
   */
  static substituteVariables(
    content: string,
    variables: Record<string, any>
  ): string {
    let result = content;

    // Add current date helpers
    const now = new Date();
    const enrichedVariables = {
      ...variables,
      date: now.toLocaleDateString(),
      today: now.toLocaleDateString(),
      datetime: now.toLocaleString(),
      year: now.getFullYear().toString(),
    };

    // Extract all variables from template
    const templateVars = TemplateService.extractVariables(content);

    // Replace each variable
    for (const varName of templateVars) {
      const value = this.resolveVariable(varName, enrichedVariables);
      const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }

  /**
   * Resolve nested variable path (e.g., client.name)
   */
  private static resolveVariable(
    path: string,
    data: Record<string, any>
  ): string {
    const parts = path.split('.');
    let value: any = data;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return `[${path}]`; // Return placeholder if not found
      }
    }

    return value?.toString() || '';
  }

  /**
   * Generate contract from template
   */
  static async generateContract(data: GenerateContractData, userId: string) {
    await this.initializeStorage();

    // Get template
    const template = await TemplateService.getTemplateById(data.templateId);

    if (!template.isActive) {
      throw new Error('Template is not active');
    }

    // Generate contract number
    const contractNumber = await this.generateContractNumber();

    // Enrich variables with contextual data
    let enrichedVariables = { ...data.variables };

    // Add client data if provided
    if (data.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
      });
      if (client) {
        enrichedVariables.client = {
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company,
        };
      }
    }

    // Add proposal data if provided
    if (data.proposalId) {
      const proposal = await prisma.proposal.findUnique({
        where: { id: data.proposalId },
        include: { items: true },
      });
      if (proposal) {
        enrichedVariables.proposal = {
          number: proposal.proposalNumber,
          title: proposal.title,
          subtotal: proposal.subtotal.toString(),
          tax: proposal.taxAmount.toString(),
          total: proposal.total.toString(),
          items: proposal.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            amount: item.amount.toString(),
          })),
        };
      }
    }

    // Add admin user data
    const admin = await prisma.adminUser.findUnique({
      where: { id: userId },
    });
    if (admin) {
      enrichedVariables.admin = {
        name: admin.name,
        email: admin.email,
      };
    }

    // Substitute variables in template
    const content = this.substituteVariables(template.content, enrichedVariables);

    // Create contract
    const contract = await prisma.contract.create({
      data: {
        contractNumber,
        title: data.title,
        templateId: data.templateId,
        templateVersion: template.version,
        content,
        variables: enrichedVariables,
        clientId: data.clientId,
        proposalId: data.proposalId,
        createdBy: userId,
      },
      include: {
        template: true,
        client: true,
        proposal: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Contract',
        entityId: contract.id,
        userId,
        clientId: data.clientId,
        metadata: {
          contractNumber,
          templateName: template.name,
          title: data.title,
        },
      },
    });

    return contract;
  }

  /**
   * List contracts
   */
  static async listContracts(filters: {
    clientId?: string;
    templateId?: string;
    status?: ContractStatus;
  } = {}) {
    const where: any = {};

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.templateId) {
      where.templateId = filters.templateId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: { name: true },
        },
        client: {
          select: { name: true, email: true },
        },
        createdByUser: {
          select: { name: true, email: true },
        },
      },
    });

    return contracts;
  }

  /**
   * Get contract by ID
   */
  static async getContractById(id: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        template: true,
        client: true,
        proposal: true,
        createdByUser: {
          select: { name: true, email: true },
        },
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    return contract;
  }

  /**
   * Get contract by number
   */
  static async getContractByNumber(contractNumber: string) {
    const contract = await prisma.contract.findUnique({
      where: { contractNumber },
      include: {
        template: true,
        client: true,
        proposal: true,
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    return contract;
  }

  /**
   * Update contract
   */
  static async updateContract(
    id: string,
    data: UpdateContractData,
    userId: string
  ) {
    const existing = await this.getContractById(id);

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        title: data.title,
        status: data.status,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Contract',
        entityId: id,
        userId,
        clientId: updated.clientId,
        changes: {
          old: { title: existing.title, status: existing.status },
          new: { title: updated.title, status: updated.status },
        },
      },
    });

    return updated;
  }

  /**
   * Send contract
   */
  static async sendContract(id: string, userId: string) {
    const contract = await this.getContractById(id);

    if (contract.status !== 'DRAFT') {
      throw new Error('Only draft contracts can be sent');
    }

    // Generate PDF if not exists
    if (!contract.pdfPath) {
      await this.generatePDF(id);
    }

    const sent = await prisma.contract.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'SEND',
        entityType: 'Contract',
        entityId: id,
        userId,
        clientId: contract.clientId,
      },
    });

    return sent;
  }

  /**
   * Generate PDF for contract
   */
  static async generatePDF(contractId: string): Promise<string> {
    const contract = await this.getContractById(contractId);

    const filename = `${contract.contractNumber}.pdf`;
    const filepath = path.join(CONTRACTS_DIR, filename);

    // Create PDF document
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = doc.pipe(createWriteStream(filepath));

    // Header
    doc.fontSize(20).text('CONTRACT', { align: 'center' });
    doc.fontSize(12).text(contract.contractNumber, { align: 'center' });
    doc.moveDown();

    // Title
    doc.fontSize(16).text(contract.title);
    doc.moveDown();

    // Contract content - split by paragraphs
    const paragraphs = contract.content.split('\n\n');
    doc.fontSize(11);

    for (const paragraph of paragraphs) {
      if (paragraph.trim()) {
        doc.text(paragraph.trim(), { align: 'justify' });
        doc.moveDown();
      }
    }

    // Signature section
    doc.moveDown(2);
    doc.fontSize(10);
    
    if (contract.signedAt) {
      doc.text(`Signed on: ${contract.signedAt.toLocaleDateString()}`);
    } else {
      doc.text('Signature: ___________________________');
      doc.moveDown();
      doc.text('Date: ___________________________');
    }

    // Footer
    doc.fontSize(8)
      .text(`Generated: ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
        align: 'center',
      });

    doc.end();

    // Wait for PDF to finish writing
    await new Promise((resolve) => stream.on('finish', resolve));

    // Update contract with PDF path
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        pdfPath: filepath,
      },
    });

    return filepath;
  }

  /**
   * Delete contract
   */
  static async deleteContract(id: string, userId: string) {
    const contract = await this.getContractById(id);

    // Delete PDF if exists
    if (contract.pdfPath) {
      try {
        await fs.unlink(contract.pdfPath);
      } catch (error) {
        console.error('Failed to delete PDF:', error);
      }
    }

    await prisma.contract.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Contract',
        entityId: id,
        userId,
        clientId: contract.clientId,
        metadata: {
          contractNumber: contract.contractNumber,
          title: contract.title,
        },
      },
    });

    return contract;
  }

  /**
   * Get contract statistics
   */
  static async getContractStats() {
    const [total, byStatus] = await Promise.all([
      prisma.contract.count(),
      prisma.contract.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const stats: any = {
      total,
      byStatus: {},
    };

    byStatus.forEach((status) => {
      stats.byStatus[status.status] = status._count;
    });

    return stats;
  }
}